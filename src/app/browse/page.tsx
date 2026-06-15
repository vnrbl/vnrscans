import type { Metadata } from "next";
import BrowsePage, { type BrowseInitialData } from "./BrowseClient";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 300;

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
    supabase.from("genres").select("id,name,slug").order("name"),
    supabase
      .from("tags")
      .select("id,name,slug,color,icon")
      .order("usage_count", { ascending: false }),
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

  return {
    genres: genresRes.data ?? [],
    tags: tagsRes.data ?? [],
    defaultManhwa: defaultManhwaRes.data ?? [],
  };
}

export default async function Page() {
  const initialData = await fetchInitialData();
  return <BrowsePage initialData={initialData} />;
}
