-- Redefine public.award_chapter_completion_xp to set base completion XP to 1000 XP and series complete XP to 1000 XP
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
  v_base_amount integer := 1000; -- Set to 1000 XP
  v_caught_up_amount integer := 100;
  v_series_complete_amount integer := 1000; -- Set to 1000 XP
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

-- Trigger to award XP when user posts a comment
create or replace function public.grant_comment_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_title text;
  v_ref_id uuid;
  v_ref_type text;
begin
  if new.user_id is null then
    return new;
  end if;

  select title into v_series_title from public.series where id = new.series_id;

  if new.chapter_id is not null then
    v_ref_id := new.chapter_id;
    v_ref_type := 'chapter';
  else
    v_ref_id := new.series_id;
    v_ref_type := 'series';
  end if;

  perform public._grant_xp(
    new.user_id,
    25, -- 25 XP for commenting
    'comment',
    v_ref_id,
    v_ref_type,
    'Commented on ' || coalesce(v_series_title, 'a series')
  );

  return new;
end;
$$;

drop trigger if exists trg_grant_comment_xp on public.comments;
create trigger trg_grant_comment_xp
  after insert on public.comments
  for each row
  execute function public.grant_comment_xp();

-- Trigger to award XP when user rates/reviews a series
create or replace function public.grant_rating_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_series_title text;
begin
  if new.user_id is null or new.series_id is null then
    return new;
  end if;

  select title into v_series_title from public.series where id = new.series_id;

  perform public._grant_xp(
    new.user_id,
    50, -- 50 XP for rating/review
    'rate_series',
    new.series_id,
    'series',
    'Rated ' || coalesce(v_series_title, 'a series')
  );

  return new;
end;
$$;

drop trigger if exists trg_grant_rating_xp on public.ratings;
create trigger trg_grant_rating_xp
  after insert on public.ratings
  for each row
  execute function public.grant_rating_xp();
