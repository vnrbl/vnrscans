import { cache } from "react";
import ReactDOM from "react-dom";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TitleDetailPageContent from "./TitleDetailPageContent";
import { supabase } from "@/integrations/supabase/client";

import { fetchSeriesBySlug } from "@/lib/series-slug";

export const revalidate = 60; // ISR edge caching for 60s
export const maxDuration = 300; // Allow server actions up to 5 minutes for chapter imports

type PageProps = {
  params: Promise<{ slug: string }>;
};

/* ------------------------------------------------------------------ */
/*  Single server-side prefetch wrapped in React.cache to guarantee   */
/*  deduplication between generateMetadata and Page render.           */
/* ------------------------------------------------------------------ */

const getSeriesData = cache(async (slug: string) => {
  return await fetchSeriesBySlug(slug);
});

const getChaptersData = cache(async (seriesId: string) => {
  let { data, error } = await supabase
    .from("chapters")
    .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group,source_url")
    .eq("series_id", seriesId)
    .in("status", ["published", "scheduled"])
    .order("chapter_number", { ascending: false });

  if (error && (error.code === "42703" || error.message?.includes("source_url"))) {
    const fallback = await supabase
      .from("chapters")
      .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group")
      .eq("series_id", seriesId)
      .in("status", ["published", "scheduled"])
      .order("chapter_number", { ascending: false });
    data = (fallback.data ?? []).map((c: any) => ({ ...c, source_url: null }));
  }

  return (data ?? []).filter((c) => c.chapter_number !== 0);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesData(slug);

  const seriesTitle = series?.title || slug;
  const seriesType = series?.type || "manga";
  const altTitles = series?.alternative_titles ? ` (${series.alternative_titles})` : "";
  
  // High CTR title pattern for series detail page
  const title = `Read ${seriesTitle}${altTitles} Online Free — vnrscans`;
  
  // Concise description with search keywords
  const description = series?.description
    ? `${series.description.slice(0, 160).trim()}... Read the latest chapters of ${seriesTitle} (${seriesType}) on vnrscans.`
    : `Read ${seriesTitle} ${seriesType} online in high quality. Enjoy the latest chapters, releases, and updates of ${seriesTitle} on vnrscans.`;

  // Dynamic tags & genres for keywords
  const genres = series?.series_genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];
  const tags = series?.series_tags?.map((t: any) => t.tag?.name).filter(Boolean) || [];
  const keywords = [
    seriesTitle,
    series?.alternative_titles,
    `read ${seriesTitle}`,
    `read ${seriesTitle} online`,
    `read ${seriesTitle} online free`,
    `read ${seriesTitle} ${seriesType}`,
    `${seriesTitle} ${seriesType}`,
    `${seriesTitle} english`,
    `${seriesTitle} chapters`,
    ...genres,
    ...tags,
    "manga",
    "manhwa",
    "manhua",
    "vnrscans"
  ].filter((item): item is string => typeof item === 'string' && item.length > 0);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.vnrscans.com/title/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.vnrscans.com/title/${slug}`,
      images: series?.cover_url ? [{ url: series.cover_url, alt: `${seriesTitle} Cover` }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: series?.cover_url ? [series.cover_url] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Reuses the same request-scoped data from generateMetadata (deduped)
  const initialSeriesData = await getSeriesData(slug);

  // Return a real 404 (instead of HTTP 200 "Series not found") so that
  // dead/mock URLs are removed from Google's index instead of crawling
  // thin error pages that hurt sitewide quality signals.
  if (!initialSeriesData) {
    notFound();
  }

  // Preload cover image in document head for instant discovery
  if (initialSeriesData.cover_url) {
    ReactDOM.preload(initialSeriesData.cover_url, { as: "image", fetchPriority: "high" });
  }

  // Fetch chapters in parallel only if series exists
  let initialChaptersData: any[] = [];
  if (initialSeriesData) {
    initialChaptersData = await getChaptersData(initialSeriesData.id);
  }

  // Generate the Schema.org JSON-LD object for rich search snippets
  const jsonLd = initialSeriesData ? {
    "@context": "https://schema.org",
    "@type": initialSeriesData.type === "novel" ? "Book" : "ComicSeries",
    "name": initialSeriesData.title,
    "alternativeHeadline": initialSeriesData.alternative_titles,
    "description": initialSeriesData.description,
    "image": initialSeriesData.cover_url,
    "author": (initialSeriesData as any).author ? { "@type": "Person", "name": (initialSeriesData as any).author } : undefined,
    "publisher": {
      "@type": "Organization",
      "name": "vnrscans",
      "url": "https://www.vnrscans.com"
    },
    "genre": initialSeriesData.series_genres?.map((g: any) => g.genre?.name).filter(Boolean) || [],
    "about": initialSeriesData.series_tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
    "hasPart": initialChaptersData?.slice(0, 50).map((c: any) => ({
      "@type": "WebPage",
      "name": `${initialSeriesData.title} Chapter ${c.chapter_number}${c.title ? `: ${c.title}` : ""}`,
      "url": `https://www.vnrscans.com/title/${slug}/${c.slug}`
    }))
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TitleDetailPageContent
        slug={slug}
        initialSeriesData={initialSeriesData}
        initialChaptersData={initialChaptersData}
      />
    </>
  );
}
