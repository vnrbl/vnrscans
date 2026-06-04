-- Sync legacy generic badge names with cultivation titles shown on profile

UPDATE public.profile_badges AS pb
SET
  name = v.canonical_name,
  description = v.encoded_description,
  icon = v.icon,
  badge_color = v.badge_color,
  requirement_type = v.requirement_type,
  requirement_value = v.requirement_value
FROM (VALUES
  (
    'Top Reader',
    'Supreme Dao Ancestor',
    '{"description":"Read 1000+ chapters","category":"Title","difficulty":"Godly"}',
    '🧘‍♂️',
    '#EF4444',
    'chapters_read',
    1000
  ),
  (
    'Speedrunner',
    'Qi Condensation Speedrunner',
    '{"description":"Read 50 chapters in one day","category":"Badge","difficulty":"Moderate"}',
    '⚡',
    '#3B82F6',
    'daily_chapters',
    50
  ),
  (
    'Completionist',
    'Grandmaster of Demonic Cultivation',
    '{"description":"Completed 20+ series","category":"Title","difficulty":"Hard"}',
    '💀',
    '#8B5CF6',
    'series_completed',
    20
  ),
  (
    'Loyal Fan',
    'Sword Sect Disciple',
    '{"description":"Followed 50+ series","category":"Badge","difficulty":"Easy"}',
    '⚔️',
    '#10B981',
    'series_followed',
    50
  ),
  (
    'Streak Master',
    'Asura Demon Emperor',
    '{"description":"Maintained 100-day streak","category":"Title","difficulty":"Godly"}',
    '👹',
    '#F59E0B',
    'reading_streak',
    100
  ),
  (
    'Early Bird',
    'Rising Sun Qi Gatherer',
    '{"description":"Read before 6 AM","category":"Badge","difficulty":"Easy"}',
    '🌅',
    '#FBBF24',
    'early_reader',
    1
  ),
  (
    'Night Owl',
    'Shadow Realm Wanderer',
    '{"description":"Read after midnight","category":"Badge","difficulty":"Easy"}',
    '🌙',
    '#6366F1',
    'night_reader',
    1
  ),
  (
    'Genre Explorer',
    'Myriad Beast Emperor',
    '{"description":"Read 10+ different genres","category":"Title","difficulty":"Moderate"}',
    '🦁',
    '#14B8A6',
    'genres_explored',
    10
  ),
  (
    'Commentator',
    'Heavenly Dao Gossip Scholar',
    '{"description":"Posted 100+ comments","category":"Badge","difficulty":"Moderate"}',
    '📜',
    '#06B6D4',
    'comments_posted',
    100
  ),
  (
    'Critic',
    'Supreme Immortal Judge',
    '{"description":"Rated 50+ series","category":"Title","difficulty":"Hard"}',
    '⚖️',
    '#EC4899',
    'ratings_given',
    50
  )
) AS v(legacy_name, canonical_name, encoded_description, icon, badge_color, requirement_type, requirement_value)
WHERE pb.name = v.legacy_name;

-- Encode plain-text descriptions on canonical rows that predate JSON metadata
UPDATE public.profile_badges AS pb
SET description = v.encoded_description
FROM (VALUES
  ('Supreme Dao Ancestor', '{"description":"Read 1000+ chapters","category":"Title","difficulty":"Godly"}'),
  ('Qi Condensation Speedrunner', '{"description":"Read 50 chapters in one day","category":"Badge","difficulty":"Moderate"}'),
  ('Grandmaster of Demonic Cultivation', '{"description":"Completed 20+ series","category":"Title","difficulty":"Hard"}'),
  ('Sword Sect Disciple', '{"description":"Followed 50+ series","category":"Badge","difficulty":"Easy"}'),
  ('Asura Demon Emperor', '{"description":"Maintained 100-day streak","category":"Title","difficulty":"Godly"}'),
  ('Rising Sun Qi Gatherer', '{"description":"Read before 6 AM","category":"Badge","difficulty":"Easy"}'),
  ('Shadow Realm Wanderer', '{"description":"Read after midnight","category":"Badge","difficulty":"Easy"}'),
  ('Myriad Beast Emperor', '{"description":"Read 10+ different genres","category":"Title","difficulty":"Moderate"}'),
  ('Heavenly Dao Gossip Scholar', '{"description":"Posted 100+ comments","category":"Badge","difficulty":"Moderate"}'),
  ('Supreme Immortal Judge', '{"description":"Rated 50+ series","category":"Title","difficulty":"Hard"}')
) AS v(canonical_name, encoded_description)
WHERE pb.name = v.canonical_name
  AND (pb.description IS NULL OR pb.description NOT LIKE '{%');
