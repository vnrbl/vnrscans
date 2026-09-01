-- Move every existing tag into genres and transfer title assignments.
--
-- After this migration:
-- - public.genres contains every previous public.tags row by name/slug.
-- - public.series_genres contains every previous public.series_tags relationship.
-- - public.tags and public.series_tags are emptied so Tags can be rebuilt as a
--   separate descriptive taxonomy later.

INSERT INTO public.genres (name, slug)
SELECT t.name, t.slug
FROM public.tags t
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.series_genres (series_id, genre_id)
SELECT DISTINCT st.series_id, g.id
FROM public.series_tags st
JOIN public.tags t ON t.id = st.tag_id
JOIN public.genres g ON g.slug = t.slug
ON CONFLICT (series_id, genre_id) DO NOTHING;

DELETE FROM public.series_tags;
DELETE FROM public.tags;
