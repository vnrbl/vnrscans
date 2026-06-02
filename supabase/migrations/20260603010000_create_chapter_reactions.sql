-- Create chapter_reactions table
create table if not exists public.chapter_reactions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'thumbs_up', 'laugh', 'star', 'smile')),
  created_at timestamp with time zone default now() not null,
  
  -- Ensure a user can only have one reaction of each type per chapter
  unique(chapter_id, user_id, reaction_type)
);

-- Create indexes for better query performance
create index if not exists idx_chapter_reactions_chapter_id on public.chapter_reactions(chapter_id);
create index if not exists idx_chapter_reactions_user_id on public.chapter_reactions(user_id);

-- Enable RLS
alter table public.chapter_reactions enable row level security;

-- Policies
create policy "Anyone can view reactions"
  on public.chapter_reactions for select
  using (true);

create policy "Authenticated users can add reactions"
  on public.chapter_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own reactions"
  on public.chapter_reactions for delete
  to authenticated
  using (auth.uid() = user_id);
