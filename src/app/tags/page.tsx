import type { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import { TagsClient, type TagsInitialData } from "./TagsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Manga, Manhwa & Manhua by Tags — vnrscans",
  description:
    "Explore every manga, manhwa, and manhua tag on vnrscans. Browse by theme and descriptive keywords to discover your next series.",
  keywords: [
    "manga tags",
    "manhwa tags",
    "manhua tags",
    "browse manga by tag",
    "manga by genre",
    "manhwa by genre",
    "isekai manhwa",
    "cultivation manhwa",
    "martial arts manhwa",
    "vnrscans tags",
  ],
  alternates: {
    canonical: "/tags",
  },
  openGraph: {
    title: "Browse Manga, Manhwa & Manhua by Tags — vnrscans",
    description:
      "Explore every manga, manhwa, and manhua tag on vnrscans to discover your next series.",
    url: "https://www.vnrscans.com/tags",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tags — vnrscans",
    description:
      "Explore every manga, manhwa, and manhua tag on vnrscans.",
  },
};

async function fetchTagsData(): Promise<TagsInitialData> {
  const tagsRes = await supabase
    .from("tags")
    .select("*")
    .order("usage_count", { ascending: false });

  return {
    tags: tagsRes.data ?? [],
  };
}

export default async function Page() {
  const initialData = await fetchTagsData();
  return <TagsClient initialData={initialData} />;
}
