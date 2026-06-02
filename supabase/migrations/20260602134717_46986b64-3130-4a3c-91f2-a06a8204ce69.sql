
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE public.series_type AS ENUM ('manga', 'manhwa', 'manhua', 'novel');
CREATE TYPE public.series_status AS ENUM ('ongoing', 'completed', 'hiatus');
CREATE TYPE public.chapter_type AS ENUM ('image', 'novel');
CREATE TYPE public.chapter_status AS ENUM ('draft', 'published', 'scheduled');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- =========================================================
-- USER ROLES (must exist before policies use has_role)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles public read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles admin manage" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  base_username := COALESCE(NEW.raw_user_meta_data->>'username',
                            split_part(NEW.email, '@', 1),
                            'user_' || substr(NEW.id::text, 1, 8));
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  INSERT INTO public.profiles (user_id, username) VALUES (NEW.id, final_username);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- GENRES
-- =========================================================
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.genres TO anon, authenticated;
GRANT ALL ON public.genres TO service_role;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genres public read" ON public.genres FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "genres admin manage" ON public.genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SERIES
-- =========================================================
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  alternative_titles TEXT,
  description TEXT,
  cover_url TEXT,
  type public.series_type NOT NULL DEFAULT 'manga',
  status public.series_status NOT NULL DEFAULT 'ongoing',
  author TEXT,
  artist TEXT,
  release_year INT,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 0,
  view_count BIGINT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.series TO anon, authenticated;
GRANT ALL ON public.series TO service_role;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series public read" ON public.series FOR SELECT TO anon, authenticated USING (is_hidden = false OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "series admin manage" ON public.series FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX series_type_idx ON public.series(type);
CREATE INDEX series_status_idx ON public.series(status);
CREATE INDEX series_featured_idx ON public.series(is_featured) WHERE is_featured;
CREATE INDEX series_trending_idx ON public.series(is_trending) WHERE is_trending;

-- =========================================================
-- SERIES_GENRES
-- =========================================================
CREATE TABLE public.series_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  UNIQUE (series_id, genre_id)
);
GRANT SELECT ON public.series_genres TO anon, authenticated;
GRANT ALL ON public.series_genres TO service_role;
ALTER TABLE public.series_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_genres public read" ON public.series_genres FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "series_genres admin manage" ON public.series_genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- CHAPTERS
-- =========================================================
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  chapter_number NUMERIC(10,2) NOT NULL,
  title TEXT,
  slug TEXT NOT NULL,
  chapter_type public.chapter_type NOT NULL DEFAULT 'image',
  novel_content TEXT,
  status public.chapter_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  view_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (series_id, slug),
  UNIQUE (series_id, chapter_number)
);
GRANT SELECT ON public.chapters TO anon, authenticated;
GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters public read" ON public.chapters FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= now()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "chapters admin manage" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX chapters_series_idx ON public.chapters(series_id, chapter_number DESC);

-- =========================================================
-- CHAPTER PAGES
-- =========================================================
CREATE TABLE public.chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  page_number INT NOT NULL,
  UNIQUE (chapter_id, page_number)
);
GRANT SELECT ON public.chapter_pages TO anon, authenticated;
GRANT ALL ON public.chapter_pages TO service_role;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapter_pages public read" ON public.chapter_pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chapter_pages admin manage" ON public.chapter_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- BOOKMARKS
-- =========================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks self" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- READING HISTORY
-- =========================================================
CREATE TABLE public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_history TO authenticated;
GRANT ALL ON public.reading_history TO service_role;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history self" ON public.reading_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- RATINGS
-- =========================================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);
GRANT SELECT ON public.ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings public read" ON public.ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ratings self write" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND rating BETWEEN 1 AND 5);
CREATE POLICY "ratings self update" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (rating BETWEEN 1 AND 5);
CREATE POLICY "ratings self delete" ON public.ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger to keep series.rating_average up to date
CREATE OR REPLACE FUNCTION public.refresh_series_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid UUID := COALESCE(NEW.series_id, OLD.series_id);
BEGIN
  UPDATE public.series s SET rating_average = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2) FROM public.ratings WHERE series_id = sid
  ), 0) WHERE s.id = sid;
  RETURN NULL;
END;
$$;
CREATE TRIGGER ratings_refresh AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.refresh_series_rating();

-- =========================================================
-- COMMENTS
-- =========================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read" ON public.comments FOR SELECT TO anon, authenticated USING (is_hidden = false OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "comments self insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments self update" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments self delete" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "comments mod hide" ON public.comments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- =========================================================
-- REPORTS
-- =========================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 1000),
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reports TO authenticated;
GRANT SELECT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports self insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports self read" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "reports admin manage" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
