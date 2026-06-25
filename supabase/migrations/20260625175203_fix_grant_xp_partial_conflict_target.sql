-- Redefine public._grant_xp to use column-based conflict resolution matching the partial unique index
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
  on conflict (user_id, source, reference_id) where reference_id is not null do nothing
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
