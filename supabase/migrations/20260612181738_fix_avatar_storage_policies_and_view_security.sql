-- H2: Remove permissive avatars-bucket policies added in 20260604000002.
-- They only checked `authenticated`, letting any signed-in user overwrite or
-- delete any other user's avatar. The folder-scoped policy
-- "users manage own avatar" from 20260602134847 remains and is sufficient
-- (uploads now go to <user_id>/avatar-<ts>.jpg).
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- H3: user_favorite_genres ran with view-owner rights, bypassing RLS on
-- reading_history and exposing every user's reading habits. security_invoker
-- makes it run with the querying user's permissions instead.
ALTER VIEW public.user_favorite_genres SET (security_invoker = true);
