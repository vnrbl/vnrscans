-- XP ledger + bonus awards (series-complete, caught-up-to-latest, follow series).
--
-- Builds on 20260614000000_chapter_completion_xp.sql which created the base
-- `award_chapter_completion_xp` RPC. This migration:
--   * creates `xp_transactions` (the source-of-truth audit log for every XP grant),
--   * centralises XP writes through `_grant_xp` so every grant ends up in the ledger,
--   * extends chapter completion to also award caught-up + series-complete bonuses,
--   * grants XP on first follow / library-add via trigger.

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  source text not null,
  reference_id uuid,
  reference_type text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_transactions_user_created
  on public.xp_transactions (user_id, created_at desc);

-- One-per-(user, source, reference) for sources that should never double-pay
-- (chapter_complete, series_complete, caught_up, follow_series). Manual admin
-- grants etc. can use a different source name and skip this guard.
create unique index if not exists uq_xp_transactions_idempotent
  on public.xp_transactions (user_id, source, reference_id)
  where reference_id is not null;

alter table public.xp_transactions enable row level security;

drop policy if exists "Users read own xp transactions" on public.xp_transactions;
create policy "Users read own xp transactions" on public.xp_transactions
  for select using (auth.uid() = user_id);

drop policy if exists "Staff read all xp transactions" on public.xp_transactions;
create policy "Staff read all xp transactions" on public.xp_transactions
  for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

grant select on public.xp_transactions to authenticated;

-- Internal helper: records the ledger row AND updates profiles.xp/level.
-- Returns the amount actually granted (0 if the ledger row was a duplicate).
create or replace function public._grant_xp(
  _user_id uuid,
  _amount integer,
  _source text,
  _reference_id uuid,
  _reference_type text,
  _description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean;
begin
  if _amount <= 0 or _user_id is null then
    return 0;
  end if;

  insert into public.xp_transactions (user_id, amount, source, reference_id, reference_type, description)
  values (_user_id, _amount, _source, _reference_id, _reference_type, _description)
  on conflict on constraint uq_xp_transactions_idempotent do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return 0;
  end if;

  update public.profiles
  set experience_points = coalesce(experience_points, 0) + _amount,
      user_level = floor(sqrt(coalesce(experience_points, 0) + _amount) / 2) + 1
  where user_id = _user_id;

  return _amount;
end;
$$;

revoke all on function public._grant_xp(uuid, integer, text, uuid, text, text) from public, anon, authenticated;

-- Rewrite chapter completion: base 25 + bonuses, all routed through the ledger.
-- Returns one row per award so the client can toast each one.
drop function if exists public.award_chapter_completion_xp(uuid);

create or replace function public.award_chapter_completion_xp(_chapter_id uuid)
returns table (
  xp_gained integer,
  source text,
  description text,
  total_xp integer,
  new_level integer,
  leveled_up boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid := auth.uid();
  v_series_id    uuid;
  v_series_status public.series_status;
  v_series_title text;
  v_chapter_num  numeric;
  v_already      boolean;
  v_old_level    integer;
  v_new_xp       integer;
  v_new_level    integer;
  v_published_total integer;
  v_user_read_total integer;
  v_latest_chapter_id uuid;
  v_base_amount integer := 25;
  v_caught_up_amount integer := 100;
  v_series_complete_amount integer := 200;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select c.series_id, c.chapter_number, s.status, s.title
  into v_series_id, v_chapter_num, v_series_status, v_series_title
  from public.chapters c
  join public.series s on s.id = c.series_id
  where c.id = _chapter_id;

  if v_series_id is null then
    raise exception 'Chapter not found';
  end if;

  -- Ensure a reading_history row exists.
  insert into public.reading_history (user_id, series_id, chapter_id, progress, xp_awarded, updated_at)
  values (v_user_id, v_series_id, _chapter_id, 100, false, now())
  on conflict (user_id, chapter_id) do nothing;

  select rh.xp_awarded into v_already
  from public.reading_history rh
  where rh.user_id = v_user_id and rh.chapter_id = _chapter_id;

  select coalesce(p.user_level, 1) into v_old_level
  from public.profiles p
  where p.user_id = v_user_id;

  if not v_already then
    -- Mark and pay base.
    update public.reading_history
    set xp_awarded = true,
        progress = greatest(progress, 100),
        updated_at = now()
    where user_id = v_user_id and chapter_id = _chapter_id;

    perform public._grant_xp(
      v_user_id,
      v_base_amount,
      'chapter_complete',
      _chapter_id,
      'chapter',
      'Finished chapter ' || v_chapter_num::text || ' of ' || v_series_title
    );

    return query select v_base_amount,
                         'chapter_complete'::text,
                         ('Chapter ' || v_chapter_num::text || ' complete')::text,
                         null::integer, null::integer, null::boolean;
  end if;

  -- "Caught up to latest": user has read every currently-published chapter, and
  -- this chapter IS the latest one (so the bonus is anchored to that chapter id).
  select id into v_latest_chapter_id
  from public.chapters
  where series_id = v_series_id
    and status = 'published'
    and (scheduled_at is null or scheduled_at <= now())
  order by chapter_number desc
  limit 1;

  select count(*) into v_published_total
  from public.chapters
  where series_id = v_series_id
    and status = 'published'
    and (scheduled_at is null or scheduled_at <= now());

  select count(distinct rh.chapter_id) into v_user_read_total
  from public.reading_history rh
  join public.chapters c on c.id = rh.chapter_id
  where rh.user_id = v_user_id
    and rh.series_id = v_series_id
    and rh.xp_awarded = true
    and c.status = 'published'
    and (c.scheduled_at is null or c.scheduled_at <= now());

  if v_latest_chapter_id is not null
     and _chapter_id = v_latest_chapter_id
     and v_published_total > 0
     and v_user_read_total >= v_published_total then
    if public._grant_xp(
         v_user_id,
         v_caught_up_amount,
         'caught_up',
         v_latest_chapter_id,
         'chapter',
         'Caught up to the latest chapter of ' || v_series_title
       ) > 0 then
      return query select v_caught_up_amount,
                           'caught_up'::text,
                           ('Caught up on ' || v_series_title)::text,
                           null::integer, null::integer, null::boolean;
    end if;
  end if;

  -- "Finished title": series is marked completed and user has read everything.
  if v_series_status = 'completed'
     and v_published_total > 0
     and v_user_read_total >= v_published_total then
    if public._grant_xp(
         v_user_id,
         v_series_complete_amount,
         'series_complete',
         v_series_id,
         'series',
         'Finished ' || v_series_title
       ) > 0 then
      return query select v_series_complete_amount,
                           'series_complete'::text,
                           ('Finished ' || v_series_title)::text,
                           null::integer, null::integer, null::boolean;
    end if;
  end if;

  -- Final aggregate: return one trailing row with the resulting totals so the
  -- client can update the level bar. xp_gained=0 means "no new award, just stats".
  select coalesce(experience_points, 0), coalesce(user_level, 1)
  into v_new_xp, v_new_level
  from public.profiles
  where user_id = v_user_id;

  return query select 0,
                       'summary'::text,
                       null::text,
                       v_new_xp,
                       v_new_level,
                       (v_new_level > coalesce(v_old_level, 1));
end;
$$;

grant execute on function public.award_chapter_completion_xp(uuid) to authenticated;

-- First follow / library-add gives XP. Trigger fires on insert into user_library;
-- the partial unique index in xp_transactions prevents double-paying if the user
-- removes and re-adds the series.
create or replace function public.grant_follow_series_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.user_id is null or new.series_id is null then
    return new;
  end if;

  select title into v_title from public.series where id = new.series_id;

  perform public._grant_xp(
    new.user_id,
    15,
    'follow_series',
    new.series_id,
    'series',
    'Added ' || coalesce(v_title, 'a series') || ' to your library'
  );

  return new;
end;
$$;

drop trigger if exists trg_grant_follow_series_xp on public.user_library;
create trigger trg_grant_follow_series_xp
  after insert on public.user_library
  for each row
  execute function public.grant_follow_series_xp();
