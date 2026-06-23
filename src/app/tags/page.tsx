import type { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import { TagsClient, type TagsInitialData } from "./TagsClient";

export const revalidate = 300; // ISR: taxonomies change slowly

export const metadata: Metadata = {
  title: "Browse Manga, Manhwa & Manhua by Genre & Tags — vnrscans",
  description:
    "Explore every manga, manhwa, and manhua genre and tag on vnrscans. Browse by story genre, theme, and descriptive keywords to discover your next series.",
  keywords: [
    "manga genres",
    "manhwa genres",
    "manhua tags",
    "browse manga by genre",
    "manga tags",
    "vnrscans genres",
  ],
  alternates: {
    canonical: "/tags",
  },
  openGraph: {
    title: "Browse Manga, Manhwa & Manhua by Genre & Tags — vnrscans",
    description:
      "Explore every manga, manhwa, and manhua genre and tag on vnrscans to discover your next series.",
    url: "https://www.vnrscans.com/tags",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Genres & Tags — vnrscans",
    description:
      "Explore every manga, manhwa, and manhua genre and tag on vnrscans.",
  },
};

async function fetchTagsData(): Promise<TagsInitialData> {
  const [genresRes, tagsRes] = await Promise.all([
    supabase
      .from("genres")
      .select("*, series_genres(count)")
      .order("name"),
    supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false }),
  ]);

  return {
    genres: genresRes.data ?? [],
    tags: tagsRes.data ?? [],
  };
}

export default async function Page() {
  const initialData = await fetchTagsData();
  return <TagsClient initialData={initialData} />;
}
