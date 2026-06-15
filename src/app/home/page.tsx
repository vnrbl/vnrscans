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

export const revalidate = 60; // edge ISR: refresh anonymous home every 60s

async function fetchHomeInitialData(): Promise<HomeInitialData> {
  const [latestRes, popularRes, highScoreRes] = await Promise.all([
    supabase.rpc("get_series_with_latest_chapters", { limit_count: 100 }),
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

  const latestUpdates: HomeLatestUpdate[] = (latestRes.data ?? []).map((series: any) => ({
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
