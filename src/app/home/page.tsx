// Server entry for /home. Prefetches the three anonymous carousels server-side
// (latest updates, popular, high score) so the client mounts already-hydrated.
// User-scoped sections (followed chapters, reading history) stay client-side
// because they need the auth session.

import HomeClient, {
  type HomeInitialData,
  type HomeLatestUpdate,
  type HomeSeriesCard,
} from "./HomeClient";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 60; // ISR cache for 60s — instant edge delivery

async function fetchHomeInitialData(): Promise<HomeInitialData> {
  const [latestRes, allSeriesRes, popularRes, highScoreRes] = await Promise.all([
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
    if (existing) return existing;
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

  return {
    latestUpdates,
    popular: (popularRes.data ?? []) as HomeSeriesCard[],
    highScore: (highScoreRes.data ?? []) as HomeSeriesCard[],
  };
}

export default async function Page() {
  const initialData = await fetchHomeInitialData();
  return <HomeClient initialData={initialData} />;
}
