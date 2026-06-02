
-- Public read for covers, chapter-images, avatars
CREATE POLICY "public read covers" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'covers');
CREATE POLICY "public read chapter images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'chapter-images');
CREATE POLICY "public read avatars" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Admin writes for covers and chapter images
CREATE POLICY "admin write covers" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin write chapter images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'chapter-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'chapter-images' AND public.has_role(auth.uid(), 'admin'));

-- User-owned avatars (folder name = user id)
CREATE POLICY "users manage own avatar" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
