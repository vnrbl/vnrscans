-- Create Recycle Bin table for soft deletion and item restoration
create table if not exists public.recycle_bin (
  id uuid primary key default gen_random_uuid(),
  item_type text not null, -- 'series', 'chapter', 'comment', 'banner', 'announcement', 'other'
  item_id text not null,
  title text not null,
  original_table text not null,
  metadata jsonb not null default '{}'::jsonb,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_by_username text,
  deleted_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists idx_recycle_bin_deleted_at on public.recycle_bin (deleted_at desc);
create index if not exists idx_recycle_bin_item_type on public.recycle_bin (item_type);
create index if not exists idx_recycle_bin_expires_at on public.recycle_bin (expires_at);

alter table public.recycle_bin enable row level security;

-- Policies
create policy "Admins and mods can read recycle bin"
  on public.recycle_bin
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'moderator')
    )
  );

create policy "Admins, mods and uploaders can insert to recycle bin"
  on public.recycle_bin
  for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'moderator', 'uploader')
    )
  );

create policy "Admins and mods can delete from recycle bin"
  on public.recycle_bin
  for delete
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'moderator')
    )
  );

-- RPC for restoring an item from the recycle bin
create or replace function public.restore_recycle_bin_item(bin_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_meta jsonb;
  v_res jsonb := '{"success": true}'::jsonb;
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin', 'moderator')
  ) then
    raise exception 'Unauthorized: Admin or Moderator required';
  end if;

  select * into v_item from public.recycle_bin where id = bin_id;
  if not found then
    raise exception 'Item not found in recycle bin';
  end if;

  v_meta := v_item.metadata;

  if v_item.item_type = 'series' then
    insert into public.series (
      id, title, slug, description, cover_url, banner_url,
      type, status, release_year, author, artist, serialization,
      created_at, updated_at
    )
    values (
      (v_meta->>'id')::uuid,
      v_meta->>'title',
      v_meta->>'slug',
      v_meta->>'description',
      v_meta->>'cover_url',
      v_meta->>'banner_url',
      coalesce((v_meta->>'type')::public.series_type, 'manhwa'),
      coalesce((v_meta->>'status')::public.series_status, 'ongoing'),
      (v_meta->>'release_year')::integer,
      v_meta->>'author',
      v_meta->>'artist',
      v_meta->>'serialization',
      coalesce((v_meta->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do update set
      title = excluded.title,
      slug = excluded.slug,
      updated_at = now();

  elsif v_item.item_type = 'chapter' then
    insert into public.chapters (
      id, series_id, chapter_number, title, slug, status, created_at, updated_at
    )
    values (
      (v_meta->>'id')::uuid,
      (v_meta->>'series_id')::uuid,
      (v_meta->>'chapter_number')::numeric,
      v_meta->>'title',
      v_meta->>'slug',
      coalesce(v_meta->>'status', 'published'),
      coalesce((v_meta->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do nothing;

  elsif v_item.item_type = 'comment' then
    insert into public.comments (
      id, user_id, series_id, chapter_id, content, parent_id, created_at, updated_at
    )
    values (
      (v_meta->>'id')::uuid,
      (v_meta->>'user_id')::uuid,
      (v_meta->>'series_id')::uuid,
      (v_meta->>'chapter_id')::uuid,
      v_meta->>'content',
      (v_meta->>'parent_id')::uuid,
      coalesce((v_meta->>'created_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do nothing;

  end if;

  delete from public.recycle_bin where id = bin_id;
  return v_res;
end;
$$;

-- RPC to empty recycle bin
create or replace function public.empty_recycle_bin()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin', 'moderator')
  ) then
    raise exception 'Unauthorized';
  end if;

  delete from public.recycle_bin;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant select, insert, delete on public.recycle_bin to authenticated;
grant execute on function public.restore_recycle_bin_item(uuid) to authenticated;
grant execute on function public.empty_recycle_bin() to authenticated;
