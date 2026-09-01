-- Award XP once per chapter completion (not per progress update).
-- Replaces the older `update_reading_streak` trigger, which:
--   * referenced profiles.id instead of profiles.user_id (no-op),
--   * would have granted XP on every progress upsert (multiple per chapter).

alter table public.reading_history
  add column if not exists xp_awarded boolean not null default false;

-- Backfill: existing reading_history rows are considered already-awarded so
-- previously-read chapters don't retroactively dump XP on the user.
update public.reading_history set xp_awarded = true where xp_awarded = false;

create index if not exists idx_reading_history_user_xp_awarded
  on public.reading_history (user_id, xp_awarded);

-- Streak-only trigger: keep `last_read_date` / `reading_streak` fresh on every
-- reading_history write, but do NOT touch XP here.
drop trigger if exists update_streak_on_read on public.reading_history;
drop function if exists public.update_reading_streak();

create or replace function public.update_reading_streak_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    last_read_date = current_date,
    reading_streak = case
      when last_read_date = current_date then reading_streak
      when last_read_date = current_date - interval '1 day' then reading_streak + 1
      else 1
    end
  where user_id = new.user_id;
  return new;
end;
$$;

create trigger update_streak_on_read
  after insert or update on public.reading_history
  for each row
  execute function public.update_reading_streak_only();

-- Idempotent per (user, chapter) XP grant. Returns the XP delta (0 if already
-- granted), plus the user's new XP / level so the client can show feedback.
create or replace function public.award_chapter_completion_xp(_chapter_id uuid)
returns table (
  xp_gained integer,
  total_xp integer,
  new_level integer,
  leveled_up boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_series_id uuid;
  v_already   boolean;
  v_old_level integer;
  v_xp_amount integer := 25;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select series_id into v_series_id from public.chapters where id = _chapter_id;
  if v_series_id is null then
    raise exception 'Chapter not found';
  end if;

  -- Ensure a reading_history row exists (covers chapters opened before this
  -- migration shipped, where the row might be missing).
  insert into public.reading_history (user_id, series_id, chapter_id, progress, xp_awarded, updated_at)
  values (v_user_id, v_series_id, _chapter_id, 100, false, now())
  on conflict (user_id, chapter_id) do nothing;

  select rh.xp_awarded into v_already
  from public.reading_history rh
  where rh.user_id = v_user_id and rh.chapter_id = _chapter_id;

  if v_already then
    return query
      select 0,
             coalesce(p.experience_points, 0),
             coalesce(p.user_level, 1),
             false
      from public.profiles p
      where p.user_id = v_user_id;
    return;
  end if;

  update public.reading_history
  set xp_awarded = true,
      progress = greatest(progress, 100),
      updated_at = now()
  where user_id = v_user_id and chapter_id = _chapter_id;

  select user_level into v_old_level from public.profiles where user_id = v_user_id;

  return query
    update public.profiles
    set experience_points = coalesce(experience_points, 0) + v_xp_amount,
        user_level = floor(sqrt(coalesce(experience_points, 0) + v_xp_amount) / 2) + 1
    where user_id = v_user_id
    returning v_xp_amount,
              experience_points,
              user_level,
              (user_level > coalesce(v_old_level, 1));
end;
$$;

grant execute on function public.award_chapter_completion_xp(uuid) to authenticated;
