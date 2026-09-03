-- Admin Infinite Qi:
-- Admin users have boundless / infinite Qi.
-- When completing chapters or tasks:
-- 1. It still logs to public.xp_transactions so it appears in history.
-- 2. It does NOT increment the admin's experience_points or user_level (no need to give Qi to admin anymore).

create or replace function public._grant_xp(
  _user_id        uuid,
  _amount         integer,
  _source         text,
  _reference_id   uuid    default null,
  _reference_type text    default null,
  _description    text    default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean;
  v_is_admin boolean := false;
begin
  if _amount <= 0 or _user_id is null then
    return 0;
  end if;

  -- Check if user is an admin or Dao Ancestor (vnr610)
  select exists (
    select 1 from public.user_roles ur where ur.user_id = _user_id and ur.role = 'admin'
  ) into v_is_admin;

  if not coalesce(v_is_admin, false) then
    select (lower(coalesce(p.username, '')) = 'vnr610' or coalesce(p.user_level, 1) >= 100)
    into v_is_admin
    from public.profiles p
    where p.user_id = _user_id;
  end if;

  -- Always insert into ledger so that task & chapter reading shows in history
  insert into public.xp_transactions (user_id, amount, source, reference_id, reference_type, description)
  values (_user_id, _amount, _source, _reference_id, _reference_type, _description)
  on conflict on constraint uq_xp_transactions_idempotent do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return 0;
  end if;

  -- If user is admin / Dao Ancestor, do NOT increment points — they have infinite Qi
  if coalesce(v_is_admin, false) then
    return _amount;
  end if;

  update public.profiles
  set experience_points = coalesce(experience_points, 0) + _amount,
      user_level = floor(sqrt(coalesce(experience_points, 0) + _amount) / 2) + 1
  where user_id = _user_id;

  return _amount;
end;
$$;

revoke all on function public._grant_xp(uuid, integer, text, uuid, text, text) from public, anon, authenticated;
