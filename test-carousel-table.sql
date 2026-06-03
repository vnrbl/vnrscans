-- Test if carousel_items table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'carousel_items'
) as table_exists;

-- If table exists, show structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'carousel_items'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'carousel_items';

-- Count existing carousel items
SELECT COUNT(*) as carousel_item_count 
FROM public.carousel_items;
