-- Migration: deduplicate chapter completion Qi and sync across multiple scan sources
-- When a user reads any scan source of chapter X in a series:
-- 1. All scan sources for chapter X in that series are marked as read (progress = 100)
-- 2. Qi is awarded only once per unique chapter number

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
  v_base_amount integer := 50; -- 50 Qi
  v_caught_up_amount integer := 100;
  v_series_complete_amount integer := 1000; -- 1000 Qi
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

  -- 1. Check if user already got Qi for this chapter number in this series across ANY scan source
  select exists (
    select 1
    from public.reading_history rh
    join public.chapters c2 on c2.id = rh.chapter_id
    where rh.user_id = v_user_id
      and c2.series_id = v_series_id
      and c2.chapter_number = v_chapter_num
      and rh.xp_awarded = true
  ) into v_already;

  -- 2. Mark ALL scan sources for this chapter number as completed (progress = 100)
  insert into public.reading_history (user_id, series_id, chapter_id, progress, xp_awarded, updated_at)
  select v_user_id, v_series_id, c_other.id, 100, true, now()
  from public.chapters c_other
  where c_other.series_id = v_series_id and c_other.chapter_number = v_chapter_num
  on conflict (user_id, chapter_id) do update
  set progress = greatest(public.reading_history.progress, 100),
      xp_awarded = true,
      updated_at = now();

  select coalesce(p.user_level, 1) into v_old_level
  from public.profiles p
  where p.user_id = v_user_id;

  -- 3. Award Qi only once per unique chapter number
  if not v_already then
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

  -- Already claimed previously for this chapter number
  return query select 0,
                       'chapter_complete'::text,
                       ('Chapter ' || v_chapter_num::text || ' already claimed')::text,
                       null::integer, null::integer, null::boolean;
end;
$$;
