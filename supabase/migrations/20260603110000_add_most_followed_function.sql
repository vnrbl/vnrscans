-- Function to get most followed series
CREATE OR REPLACE FUNCTION get_most_followed_series(limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  cover_url TEXT,
  type TEXT,
  rating_average FLOAT,
  view_count INT,
  status TEXT,
  follower_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug,
    s.title,
    s.cover_url,
    s.type::TEXT,
    s.rating_average,
    s.view_count,
    s.status::TEXT,
    COUNT(ul.id) as follower_count
  FROM series s
  LEFT JOIN user_library ul ON s.id = ul.series_id
  GROUP BY s.id, s.slug, s.title, s.cover_url, s.type, s.rating_average, s.view_count, s.status
  ORDER BY follower_count DESC, s.rating_average DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
