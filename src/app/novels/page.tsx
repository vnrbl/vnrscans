import type { Metadata } from "next";
import NovelsClient from "./NovelsClient";
import { supabase } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Read Light Novels & Web Novels Online Free — vnrscans",
  description: "Explore our collection of high-quality light novels, web novels, and official translations. Read chapters online with our premium customizable reader.",
  keywords: ["read novels online", "web novels", "light novels", "novel translations", "vnrscans novels", "read webnovels free"],
  alternates: {
    canonical: "/novels",
  },
  openGraph: {
    title: "Read Light Novels & Web Novels Online Free — vnrscans",
    description: "Explore our collection of high-quality light novels, web novels, and official translations. Read chapters online with our premium customizable reader.",
    type: "website",
    url: "https://www.vnrscans.com/novels",
  },
};

async function fetchNovelsData() {
  const { data: novels, error: novelsError } = await supabase
    .from("series")
    .select("id,slug,title,description,cover_url,type,rating_average,status,view_count,updated_at,author,artist")
    .eq("type", "novel")
    .eq("is_hidden", false)
    .order("view_count", { ascending: false });

  if (novelsError) {
    console.error("Error fetching novels:", novelsError);
    return [];
  }

  if (novels && novels.length > 0) {
    const seriesIds = novels.map(n => n.id);
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("id,slug,chapter_number,title,created_at,series_id")
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("chapter_number", { ascending: false });

    if (chaptersError) {
      console.error("Error fetching chapters for novels:", chaptersError);
      return novels.map(n => ({ ...n, recent_chapters: [] }));
    }

    // Attach latest 3 chapters to each novel
    const chaptersBySeries = new Map<string, any[]>();
    (chapters ?? []).forEach(ch => {
      const existing = chaptersBySeries.get(ch.series_id) ?? [];
      if (existing.length < 3) {
        existing.push(ch);
      }
      chaptersBySeries.set(ch.series_id, existing);
    });

    return novels.map(n => ({
      ...n,
      recent_chapters: chaptersBySeries.get(n.id) ?? []
    }));
  }

  return [];
}

export default async function Page() {
  const novels = await fetchNovelsData();
  return <NovelsClient initialNovels={novels} />;
}
