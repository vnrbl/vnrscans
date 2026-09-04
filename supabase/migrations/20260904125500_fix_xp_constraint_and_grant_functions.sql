-- =========================================================================
-- Migration: Fix XP ledger idempotent conflict resolution and safeguard triggers
-- Date: 2026-09-04
-- =========================================================================

-- 1. Ensure the unique index exists for idempotent XP grants
create unique index if not exists uq_xp_transactions_idempotent
  on public.xp_transactions (user_id, source, reference_id)
  where reference_id is not null;

-- 2. Redefine public._grant_xp with column-based conflict resolution matching the partial unique index
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

  -- Insert into ledger using partial unique index conflict target (NOT ON CONSTRAINT)
  insert into public.xp_transactions (user_id, amount, source, reference_id, reference_type, description)
  values (_user_id, _amount, _source, _reference_id, _reference_type, _description)
  on conflict (user_id, source, reference_id) where reference_id is not null do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return 0;
  end if;

  -- If user is admin / Dao Ancestor, do not increment profile points (boundless Qi)
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

revoke all on function public._grant_xp(uuid, integer, text, uuid, text, text) from public, anon;
grant execute on function public._grant_xp(uuid, integer, text, uuid, text, text) to authenticated;

-- 3. Update grant_rating_xp trigger function with safe error containment
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

  begin
    select title into v_series_title from public.series where id = new.series_id;

    perform public._grant_xp(
      new.user_id,
      50, -- 50 XP for rating/review
      'rate_series',
      new.series_id,
      'series',
      'Rated ' || coalesce(v_series_title, 'a series')
    );
  exception when others then
    -- Warning only: never abort the user rating transaction if XP grant hits an issue
    raise warning 'grant_rating_xp caught error: %', SQLERRM;
  end;

  return new;
end;
$$;

-- 4. Update grant_follow_series_xp trigger function with safe error containment
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

  begin
    select title into v_title from public.series where id = new.series_id;

    perform public._grant_xp(
      new.user_id,
      15,
      'follow_series',
      new.series_id,
      'series',
      'Added ' || coalesce(v_title, 'a series') || ' to your library'
    );
  exception when others then
    -- Warning only: never abort user follow transaction if XP grant hits an issue
    raise warning 'grant_follow_series_xp caught error: %', SQLERRM;
  end;

  return new;
end;
$$;
