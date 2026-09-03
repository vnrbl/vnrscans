-- Migration to permanently sync reading history and ensure chapter completion marks progress=100 and xp_awarded=true

-- 1. Backfill existing reading_history records
update public.reading_history
set progress = 100
where xp_awarded = true and progress < 50;

-- 2. Update award_chapter_completion_xp to ensure progress is updated to 100 on conflict
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
  v_base_amount integer := 50; -- Set to 50 Qi
  v_caught_up_amount integer := 100;
  v_series_complete_amount integer := 1000; -- Set to 1000 Qi
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

  -- Ensure reading_history row exists, and ensure progress is updated to 100 if completed
  insert into public.reading_history (user_id, series_id, chapter_id, progress, xp_awarded, updated_at)
  values (v_user_id, v_series_id, _chapter_id, 100, false, now())
  on conflict (user_id, chapter_id) do update
  set progress = greatest(public.reading_history.progress, 100),
      updated_at = now();

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
        progress = 100,
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

  -- Always guarantee progress is 100 for completed chapters
  update public.reading_history
  set progress = 100,
      updated_at = now()
  where user_id = v_user_id and chapter_id = _chapter_id and progress < 100;

  return;
end;
$$;
