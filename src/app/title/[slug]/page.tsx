import type { Metadata } from "next";
import TitleDetailPageContent from "./TitleDetailPageContent";
import { supabase } from "@/integrations/supabase/client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/* ------------------------------------------------------------------ */
/*  Single server-side prefetch used by both generateMetadata + Page  */
/*  React/Next.js auto-deduplicates this when the same async fn       */
/*  is called in the same request.                                     */
/* ------------------------------------------------------------------ */

async function getSeriesData(slug: string) {
  const { data } = await supabase
    .from("series")
    .select("*,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug,color,icon))")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getChaptersData(seriesId: string) {
  const { data } = await supabase
    .from("chapters")
    .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group")
    .eq("series_id", seriesId)
    .eq("status", "published")
    .order("chapter_number", { ascending: false });

  return (data ?? []).filter(
    (c) => !c.scheduled_at || new Date(c.scheduled_at) <= new Date()
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesData(slug);

  const title = series ? `${series.title} — vnrscans` : `${slug} — vnrscans`;
  const description = series?.description || "Read manga, manhwa, and manhua series";

  return {
    title,
    description,
    // Preload cover image in the <head> so the browser discovers it before JS hydration
    ...(series?.cover_url
      ? {
          other: {
            "link:preload": series.cover_url,
          },
        }
      : {}),
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Reuses the same request-scoped data from generateMetadata (deduped)
  const initialSeriesData = await getSeriesData(slug);

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
    "about": initialSeriesData.series_tags?.map((t: any) => t.tag?.name).filter(Boolean) || []
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
