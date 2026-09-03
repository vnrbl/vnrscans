-- Function to get top cultivators for a specific series ranked by Qi gathered from that series
create or replace function public.get_series_top_cultivators(_series_id uuid, _limit integer default 5)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  avatar_frame text,
  accent_color text,
  user_level integer,
  series_qi_collected bigint,
  chapters_read bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with series_chapter_ids as (
    select c.id from public.chapters c where c.series_id = _series_id
  ),
  user_history_stats as (
    select
      rh.user_id,
      count(distinct rh.chapter_id) as ch_count
    from public.reading_history rh
    where rh.series_id = _series_id
      and (rh.progress >= 70 or rh.xp_awarded = true)
    group by rh.user_id
  ),
  user_trans_stats as (
    select
      t.user_id,
      coalesce(sum(t.amount), 0) as trans_qi
    from public.xp_transactions t
    where (
      (t.reference_type = 'chapter' and t.reference_id in (select id from series_chapter_ids))
      or (t.reference_type = 'series' and t.reference_id = _series_id)
    )
    group by t.user_id
  ),
  combined_users as (
    select user_id from user_history_stats
    union
    select user_id from user_trans_stats
  ),
  ranked_users as (
    select
      cu.user_id,
      coalesce(uhs.ch_count, 0)::bigint as ch_read,
      greatest(
        coalesce(uts.trans_qi, 0)::bigint,
        (coalesce(uhs.ch_count, 0) * 50)::bigint
      ) as total_qi
    from combined_users cu
    left join user_history_stats uhs on uhs.user_id = cu.user_id
    left join user_trans_stats uts on uts.user_id = cu.user_id
  )
  select
    p.user_id,
    coalesce(p.username, 'Cultivator')::text as username,
    p.avatar_url::text,
    p.avatar_frame::text,
    p.accent_color::text,
    coalesce(p.user_level, 1)::integer as user_level,
    r.total_qi as series_qi_collected,
    r.ch_read as chapters_read
  from ranked_users r
  join public.profiles p on p.user_id = r.user_id
  where r.total_qi > 0 or r.ch_read > 0
  order by r.total_qi desc, r.ch_read desc
  limit coalesce(_limit, 5);
end;
$$;

grant execute on function public.get_series_top_cultivators(uuid, integer) to anon, authenticated;
