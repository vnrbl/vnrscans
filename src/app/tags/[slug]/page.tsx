import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TagDetailPageContent from "./TagDetailPageContent";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 120; // Edge ISR caching for 2 minutes

type PageProps = {
  params: Promise<{ slug: string }>;
};

const getTagData = cache(async (slug: string) => {
  try {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (tagError || !tag) {
      return { tag: null, series: [] };
    }

    const { data: seriesTags } = await supabase
      .from("series_tags")
      .select(`
        series:series_id (
          id,
          slug,
          title,
          cover_url,
          type,
          status,
          rating_average,
          view_count,
          chapter_count,
          description
        )
      `)
      .eq("tag_id", tag.id)
      .limit(60);

    const series = (seriesTags || [])
      .map((item: any) => item.series)
      .filter((s: any) => s !== null);

    return { tag, series };
  } catch {
    return { tag: null, series: [] };
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tag } = await getTagData(slug);

  if (!tag) {
    return {
      title: "Tag Not Found — vnrscans",
      robots: { index: false, follow: false },
    };
  }

  const tagName = tag.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `Browse ${tagName} Manga, Manhwa, & Manhua — vnrscans`;
  const description = `Discover and read the best manga, manhwa, manhua, and novels tagged with ${tagName} on vnrscans. Fast, high-quality reading experience.`;

  return {
    title,
    description,
    keywords: [tagName, `${tagName} manga`, `${tagName} manhwa`, `${tagName} manhua`, "read online", "vnrscans"],
    alternates: {
      canonical: `https://www.vnrscans.com/tags/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.vnrscans.com/tags/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const { tag, series } = await getTagData(slug);

  if (!tag) {
    notFound();
  }

  return <TagDetailPageContent slug={slug} initialTag={tag} initialSeries={series} />;
}
