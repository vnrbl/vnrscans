import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ChapterReaderContent from "./ChapterReaderContent";
import { supabase } from "@/integrations/supabase/client";
import { fetchSeriesBySlug } from "@/lib/series-slug";
import { getCleanChapterSlug } from "@/lib/chapter-utils";

export const revalidate = 120; // Edge cached for 2 minutes — fast instant loading

type PageProps = {
  params: Promise<{ slug: string; chapterSlug: string }>;
};

// Server-side helper to fetch series + chapter + pages in one deduplicated request
const getChapterFullData = cache(async (seriesSlug: string, chapterSlug: string) => {
  // 1. Resolve series by slug (with encoding/hyphen/punctuation-insensitive fallback)
  const series = await fetchSeriesBySlug(seriesSlug, "id, slug, title, cover_url, type, description");

  let chapter: any = null;

  // 2. If series is resolved, look up chapter within that series
  if (series) {
    // 2a. Match exact series_id and chapter slug (use limit(1) to avoid PGRST116)
    const { data: chExact } = await supabase
      .from("chapters")
      .select(`
        *,
        series:series_id (
          id,
          slug,
          title,
          cover_url,
          type,
          description
        )
      `)
      .eq("series_id", series.id)
      .eq("slug", chapterSlug)
      .limit(1);

    if (chExact && chExact.length > 0) {
      chapter = chExact[0];
    } else {
      // 2b. Try partial slug match within series
      const { data: chPartial } = await supabase
        .from("chapters")
        .select(`
          *,
          series:series_id (
            id,
            slug,
            title,
            cover_url,
            type,
            description
          )
        `)
        .eq("series_id", series.id)
        .ilike("slug", `%${chapterSlug}%`)
        .limit(1);

      if (chPartial && chPartial.length > 0) {
        chapter = chPartial[0];
      } else {
        // 2c. Try chapter number match within series
        const match =
          chapterSlug.match(/chapter[_-]?([0-9]+(?:\.[0-9]+)?)/i) ||
          chapterSlug.match(/^([0-9]+(?:\.[0-9]+)?)$/);
        if (match) {
          const num = parseFloat(match[1]);
          const { data: chByNum } = await supabase
            .from("chapters")
            .select(`
              *,
              series:series_id (
                id,
                slug,
                title,
                cover_url,
                type,
                description
              )
            `)
            .eq("series_id", series.id)
            .eq("chapter_number", num)
            .order("created_at", { ascending: false })
            .limit(1);

          if (chByNum && chByNum.length > 0) {
            chapter = chByNum[0];
          }
        }
      }
    }
  }

  // 3. Global fallback if series was not found or chapter wasn't found in series
  if (!chapter) {
    const { data: chGlobal } = await supabase
      .from("chapters")
      .select(`
        *,
        series:series_id (
          id,
          slug,
          title,
          cover_url,
          type,
          description
        )
      `)
      .eq("slug", chapterSlug)
      .limit(1);

    if (chGlobal && chGlobal.length > 0) {
      chapter = chGlobal[0];
    }
  }

  if (!chapter) return null;

  // In parallel, fetch chapter pages and sibling chapters for instant navigation
  const [pagesRes, siblingsRes] = await Promise.all([
    supabase
      .from("chapter_pages")
      .select("id,page_number,image_url")
      .eq("chapter_id", chapter.id)
      .order("page_number"),
    supabase
      .from("chapters")
      .select("id,slug,chapter_number,title,scanlation_group")
      .eq("series_id", chapter.series_id)
      .in("status", ["published", "scheduled"])
      .order("chapter_number", { ascending: true }),
  ]);

  return {
    chapter,
    pages: pagesRes.data ?? [],
    siblings: siblingsRes.data ?? [],
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const fullData = await getChapterFullData(slug, chapterSlug);
  const data = fullData?.chapter;

  if (!data || !data.series) {
    return {
      title: "Chapter Not Found — vnrscans",
      robots: { index: false, follow: false },
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

  const cleanChapterSlug = data ? getCleanChapterSlug(data) : chapterSlug;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.vnrscans.com/title/${slug}/${cleanChapterSlug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://www.vnrscans.com/title/${slug}/${cleanChapterSlug}`,
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
  const fullData = await getChapterFullData(slug, chapterSlug);
  const data = fullData?.chapter;

  if (!data || !data.series) {
    notFound();
  }

  // Canonical clean slug strictly up to chapter number (e.g. chapter-1, not chapter-1-the-change)
  const cleanSlug = getCleanChapterSlug(data);
  if (chapterSlug !== cleanSlug) {
    redirect(`/title/${slug}/${cleanSlug}`);
  }

  const series = data.series as unknown as {
    title: string;
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.vnrscans.com"
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
        "item": `https://www.vnrscans.com/title/${slug}/${cleanSlug}`
      }
    ]
  };

  return (
    <>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ChapterReaderContent
        slug={slug}
        chapterSlug={cleanSlug}
        initialChapterData={data}
        initialPagesData={fullData?.pages}
        initialSiblingsData={fullData?.siblings}
      />
    </>
  );
}
