ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_spoiler boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'gif')),
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_alt text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'comment-media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'comment-media',
      'comment-media',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "comment media public read" ON storage.objects;
CREATE POLICY "comment media public read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'comment-media');

DROP POLICY IF EXISTS "users upload own comment media" ON storage.objects;
CREATE POLICY "users upload own comment media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comment-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "users delete own comment media" ON storage.objects;
CREATE POLICY "users delete own comment media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'comment-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE INDEX IF NOT EXISTS idx_comments_chapter_created
  ON public.comments(chapter_id, created_at DESC)
  WHERE chapter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_parent_created
  ON public.comments(parent_id, created_at ASC)
  WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'funny', 'shock', 'sad', 'angry')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment
  ON public.comment_reactions(comment_id);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.comment_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.comment_reactions TO authenticated;
GRANT ALL ON public.comment_reactions TO service_role;

DROP POLICY IF EXISTS "comment reactions public read" ON public.comment_reactions;
CREATE POLICY "comment reactions public read"
  ON public.comment_reactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "comment reactions self insert" ON public.comment_reactions;
CREATE POLICY "comment reactions self insert"
  ON public.comment_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment reactions self delete" ON public.comment_reactions;
CREATE POLICY "comment reactions self delete"
  ON public.comment_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
