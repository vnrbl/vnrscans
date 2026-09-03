import { cache } from "react";
import type { Metadata } from "next";
import ChapterReaderContent from "./ChapterReaderContent";
import { supabase } from "@/integrations/supabase/client";

export const revalidate = 120; // Edge cached for 2 minutes — fast instant loading

type PageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

// Server-side helper to fetch series + chapter details for metadata, deduplicated in request scope
const getChapterMetadataDetails = cache(async (seriesSlug: string, chapterSlug: string) => {
  const { data: chapter } = await supabase
    .from("chapters")
    .select(`
      chapter_number,
      title,
      series:series_id (
        title,
        cover_url,
        type,
        description
      )
    `)
    .eq("slug", chapterSlug)
    .maybeSingle();

  return chapter;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const data = await getChapterMetadataDetails(slug, chapterSlug);

  if (!data || !data.series) {
    return {
      title: `Read ${chapterSlug} — vnrscans`,
    };
  }

  // Cast series because of Supabase join types
  const series = data.series as unknown as {
    title: string;
    cover_url: string | null;
    type: string;
    description: string | null;
  };

  const seriesTitle = series.title;
  const chapterNum = data.chapter_number;
  const chapterTitle = data.title ? `: ${data.title}` : "";
  const seriesType = series.type || "manga";

  // High CTR title pattern
  const title = `Read ${seriesTitle} Chapter ${chapterNum}${chapterTitle} English Online — vnrscans`;
  
  // Concise description with search keywords
  const description = `Read ${seriesTitle} Chapter ${chapterNum} online in high quality. Enjoy the latest updates of this ${seriesType} on vnrscans - your premium reading home.`;

  const keywords = [
    seriesTitle,
    `read ${seriesTitle} chapter ${chapterNum}`,
    `read ${seriesTitle} chapter ${chapterNum} online`,
    `${seriesTitle} chapter ${chapterNum} english`,
    `${seriesTitle} chapter ${chapterNum} free`,
    `${seriesTitle} ch ${chapterNum}`,
    `chapter ${chapterNum}`,
    `chapter ${chapterNum} online`,
    "vnrscans",
    seriesType,
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/title/${slug}/${chapterSlug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://www.vnrscans.com/title/${slug}/${chapterSlug}`,
      images: series.cover_url ? [{ url: series.cover_url, alt: `${seriesTitle} Chapter ${chapterNum} Cover` }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: series.cover_url ? [series.cover_url] : [],
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { slug, chapterSlug } = await params;
  const data = await getChapterMetadataDetails(slug, chapterSlug);

  const series = data?.series as unknown as {
    title: string;
  } | undefined;

  const breadcrumbLd = data && series ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.vnrscans.com/home"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": series.title,
        "item": `https://www.vnrscans.com/title/${slug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `Chapter ${data.chapter_number}`,
        "item": `https://www.vnrscans.com/title/${slug}/${chapterSlug}`
      }
    ]
  } : null;

  return (
    <>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ChapterReaderContent slug={slug} chapterSlug={chapterSlug} />
    </>
  );
}
