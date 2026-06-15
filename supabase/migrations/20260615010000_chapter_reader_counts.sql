-- Per-chapter reader counts for the chapter list table.
-- Counts distinct users from reading_history per chapter in the given series.
-- SECURITY DEFINER lets us bypass per-row RLS on reading_history (we're only
-- returning aggregated counts, no per-user data leaves the function).

create or replace function public.get_chapter_reader_counts(_series_id uuid)
returns table (
  chapter_id uuid,
  reader_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select rh.chapter_id, count(distinct rh.user_id) as reader_count
  from public.reading_history rh
  where rh.series_id = _series_id
  group by rh.chapter_id;
$$;

grant execute on function public.get_chapter_reader_counts(uuid) to anon, authenticated;
