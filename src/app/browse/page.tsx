import type { Metadata } from "next";
import BrowsePage, { type BrowseInitialData } from "./BrowseClient";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 120; // ISR cache for 2 minutes — fast edge response

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
      .order("updated_at", { ascending: false })
      .limit(60),
  ]);

  if (genresRes.error) throw genresRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (defaultManhwaRes.error) throw defaultManhwaRes.error;

  const fetchedSeries = defaultManhwaRes.data ?? [];
  let seriesWithRealCounts = fetchedSeries;

  if (fetchedSeries.length > 0) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("series_id,chapter_number")
      .in("series_id", fetchedSeries.map((s: any) => s.id))
      .eq("status", "published");

    const uniqueChaptersBySeries = new Map<string, Set<number>>();
    (chapters ?? []).forEach((chapter: any) => {
      const existing = uniqueChaptersBySeries.get(chapter.series_id) ?? new Set<number>();
      existing.add(Math.floor(chapter.chapter_number));
      uniqueChaptersBySeries.set(chapter.series_id, existing);
    });

    seriesWithRealCounts = fetchedSeries.map((s: any) => {
      const actualCount = uniqueChaptersBySeries.get(s.id)?.size ?? 0;
      return {
        ...s,
        chapter_count: actualCount > 0 ? actualCount : (s.chapter_count ?? 0),
      };
    });
  }

  const uniqueGenresMap = new Map<string, { id: string; name: string; slug: string }>();
  (genresRes.data ?? []).forEach((g: any) => {
    if (!uniqueGenresMap.has(g.id)) {
      uniqueGenresMap.set(g.id, { id: g.id, name: g.name, slug: g.slug });
    }
  });

  const uniqueTagsMap = new Map<string, any>();
  (tagsRes.data ?? []).forEach((t: any) => {
    if (!uniqueTagsMap.has(t.id)) {
      uniqueTagsMap.set(t.id, { id: t.id, name: t.name, slug: t.slug, color: t.color, icon: t.icon });
    }
  });

  return {
    genres: Array.from(uniqueGenresMap.values()),
    tags: Array.from(uniqueTagsMap.values()),
    defaultManhwa: seriesWithRealCounts,
  };
}

export default async function Page() {
  const initialData = await fetchInitialData();
  return <BrowsePage initialData={initialData} />;
}
