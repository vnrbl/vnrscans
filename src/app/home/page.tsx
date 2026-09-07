// Server entry for /home. Prefetches the three anonymous carousels server-side
// (latest updates, popular, high score) so the client mounts already-hydrated.
// User-scoped sections (followed chapters, reading history) stay client-side
// because they need the auth session.

import type { Metadata } from "next";
import HomeClient, {
  type HomeInitialData,
  type HomeLatestUpdate,
  type HomeSeriesCard,
} from "./HomeClient";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 10; // ISR cache for 10s — ultra fast fresh edge delivery

export const metadata: Metadata = {
  title: "Read Manga, Manhwa, Manhua & Novels Online Free — vnrscans",
  description:
    "Explore the latest manga, manhwa, manhua, and novel updates, popular series, and top-rated titles with fast loading and high quality on vnrscans.",
  alternates: {
    canonical: "https://www.vnrscans.com/home",
  },
  openGraph: {
    title: "Read Manga, Manhwa, Manhua & Novels — vnrscans",
    description:
      "Explore the latest manga, manhwa, manhua, and novel updates on vnrscans.",
    type: "website",
    url: "https://www.vnrscans.com/home",
  },
};

async function fetchHomeInitialData(): Promise<HomeInitialData> {
  // CRITICAL: Do NOT cap limit_count to small values (e.g. 48).
  // Home page must load all series (up to 1000) so "Load More" can display and paginate through the entire catalog!
  const [carouselRes, latestRes, allSeriesRes, popularRes, highScoreRes] = await Promise.all([
    supabase
      .from("carousel_items")
      .select(`
        id,
        series:series_id(
          id,
          title,
          slug,
          cover_url,
          description,
          type
        )
      `)
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase.rpc("get_series_with_latest_chapters", { limit_count: 1000 }),
    supabase.from("series").select("id,slug,title,cover_url,type,updated_at").order("title"),
    supabase
      .from("series")
      .select("id,slug,title,cover_url,type,rating_average,status,view_count")
      .order("view_count", { ascending: false })
      .limit(15),
    supabase
      .from("series")
      .select("id,slug,title,cover_url,type,rating_average,status,view_count")
      .order("rating_average", { ascending: false })
      .limit(15),
  ]);

  const rpcMap = new Map((latestRes.data ?? []).map((s: any) => [s.id, s]));
  const fullSeriesList = (allSeriesRes.data ?? []).map((s: any) => {
    const existing = rpcMap.get(s.id);
    if (existing) {
      // Ensure sorting strictly matches the newest timestamp between DB record and visible chapter cards
      const chTimestamps = (existing.recent_chapters ?? [])
        .map((c: any) => new Date(c.created_at || 0).getTime())
        .filter((t: number) => !isNaN(t) && t > 0);
      const dbTimestamp = existing.latest_chapter_created_at
        ? new Date(existing.latest_chapter_created_at).getTime()
        : 0;
      const bestTimestamp = Math.max(dbTimestamp, ...chTimestamps);
      const bestDateStr = bestTimestamp > 0 ? new Date(bestTimestamp).toISOString() : existing.latest_chapter_created_at;

      return {
        ...existing,
        latest_chapter_created_at: bestDateStr,
      };
    }
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      cover_url: s.cover_url,
      type: s.type,
      latest_chapter_created_at: s.updated_at,
      recent_chapters: [],
    };
  });

  fullSeriesList.sort(
    (a: any, b: any) =>
      new Date(b.latest_chapter_created_at || 0).getTime() -
      new Date(a.latest_chapter_created_at || 0).getTime()
  );

  const latestUpdates: HomeLatestUpdate[] = fullSeriesList.map((series: any) => ({
    id: series.id,
    slug: series.slug,
    title: series.title,
    cover_url: series.cover_url,
    type: series.type,
    recent_chapters: (series.recent_chapters ?? []).map((ch: any) => ({
      id: ch.id,
      slug: ch.slug,
      chapter_number: Number(ch.chapter_number),
      title: ch.title,
      created_at: ch.created_at,
      scheduled_at: ch.scheduled_at || null,
      status: ch.status || (ch.scheduled_at && new Date(ch.scheduled_at) > new Date() ? "scheduled" : "published"),
    })),
  }));

  const carouselItems = (carouselRes.data ?? [])
    .filter((item: any) => item.series)
    .map((item: any) => ({
      id: item.id,
      series: item.series,
    }));

  return {
    carouselItems,
    latestUpdates,
    popular: (popularRes.data ?? []) as HomeSeriesCard[],
    highScore: (highScoreRes.data ?? []) as HomeSeriesCard[],
  };
}

export default async function Page() {
  const initialData = await fetchHomeInitialData();
  return <HomeClient initialData={initialData} />;
}
