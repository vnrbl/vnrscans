import type { Metadata } from "next";
import BrowsePage, { type BrowseInitialData } from "./BrowseClient";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 60; // Edge cached for 60s — instant 30ms delivery with background revalidation

export const metadata: Metadata = {
  title: "Browse Manga, Manhwa, Manhua & Novels - vnrscans",
  description:
    "Browse public manga, manhwa, manhua, and novel series on vnrscans by genre, tag, status, and latest updates.",
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    title: "Browse vnrscans",
    description:
      "Explore the vnrscans catalog by genre, tag, status, and latest updates.",
    type: "website",
    url: "https://www.vnrscans.com/browse",
  },
};

async function fetchInitialData(): Promise<BrowseInitialData> {
  const [genresRes, tagsRes, defaultManhwaRes] = await Promise.all([
    supabase
      .from("genres")
      .select("id,name,slug,series_genres!inner(series_id)")
      .order("name"),
    supabase
      .from("tags")
      .select("id,name,slug,color,icon,series_tags!inner(series_id)")
      .order("name"),
    supabase
      .from("series")
      .select(
        "id,slug,title,alternative_titles,description,cover_url,type,rating_average,status,author,artist,release_year,created_at,updated_at,view_count,content_rating,chapter_count,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug))"
      )
      .eq("is_hidden", false)
      .order("updated_at", { ascending: false }),
  ]);

  if (genresRes.error) throw genresRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (defaultManhwaRes.error) throw defaultManhwaRes.error;

  const seriesWithRealCounts = defaultManhwaRes.data ?? [];

const CORE_GENRES_SET = new Set([
  "action", "adventure", "boys love", "comedy", "crime", "cyberpunk", "drama", 
  "ecchi", "erotica", "fantasy", "girls love", "harem", "historical", "horror", 
  "isekai", "josei", "martial arts", "mecha", "medical", "mystery", "psychological", 
  "reincarnation", "romance", "sci-fi", "seinen", "shoujo", "shounen", "slice of life", 
  "sports", "supernatural", "thriller", "wuxia", "xianxia", "xuanhuan", "yaoi", "yuri",
  "monsters", "magic", "cultivation", "webtoon", "manhwa", "manhua", "manga"
]);

  const uniqueGenresMap = new Map<string, { id: string; name: string; slug: string }>();
  (genresRes.data ?? []).forEach((g: any) => {
    if (g?.slug && !uniqueGenresMap.has(g.slug.toLowerCase())) {
      uniqueGenresMap.set(g.slug.toLowerCase(), { id: g.id, name: g.name, slug: g.slug });
    }
  });

  // Also include core genres from series tags (e.g. cultivation, martial arts, reincarnation)
  (tagsRes.data ?? []).forEach((t: any) => {
    const slug = (t?.slug || "").toLowerCase().trim();
    const name = (t?.name || "").toLowerCase().trim();
    if ((CORE_GENRES_SET.has(slug) || CORE_GENRES_SET.has(name)) && !uniqueGenresMap.has(slug)) {
      uniqueGenresMap.set(slug, { id: t.id, name: t.name, slug: t.slug });
    }
  });

  const uniqueTagsMap = new Map<string, any>();
  (tagsRes.data ?? []).forEach((t: any) => {
    if (!uniqueTagsMap.has(t.id)) {
      uniqueTagsMap.set(t.id, { id: t.id, name: t.name, slug: t.slug, color: t.color, icon: t.icon });
    }
  });

  return {
    genres: Array.from(uniqueGenresMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    tags: Array.from(uniqueTagsMap.values()),
    defaultManhwa: seriesWithRealCounts,
  };
}

export default async function Page() {
  const initialData = await fetchInitialData();
  return <BrowsePage initialData={initialData} />;
}
