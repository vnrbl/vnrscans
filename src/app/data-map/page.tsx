import type { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";
import { Compass, BookOpen, Tag, Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform Data Directory & Sitemap — vnrscans",
  description: "Navigate the complete indexing structure of vnrscans. Browse all comic series, web novels, catalog genres, and sitemap directories.",
  keywords: ["vnrscans sitemap", "vnrscans directory", "manga directory", "manhwa sitemap", "web novels list"],
  alternates: {
    canonical: "/data-map",
  },
  openGraph: {
    title: "Platform Data Directory & Sitemap — vnrscans",
    description: "Navigate the complete indexing structure of vnrscans. Browse all comic series, web novels, catalog genres, and sitemap directories.",
    url: "https://www.vnrscans.com/data-map",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Platform Data Directory & Sitemap — vnrscans",
    description: "Navigate the complete indexing structure of vnrscans. Browse all comic series, web novels, catalog genres, and sitemap directories.",
  }
};

// Server-side prefetch for sitemap mapping
async function getDataMapPayload() {
  const [seriesRes, genresRes, chaptersRes] = await Promise.all([
    supabase
      .from("series")
      .select("slug, title, type")
      .eq("is_hidden", false)
      .order("title"),
    supabase
      .from("genres")
      .select("name, slug")
      .order("name"),
    supabase
      .from("chapters")
      .select(`
        slug,
        chapter_number,
        title,
        created_at,
        series:series_id (slug, title)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    series: seriesRes.data || [],
    genres: genresRes.data || [],
    chapters: (chaptersRes.data || []).map((ch: any) => ({
      slug: ch.slug,
      chapter_number: ch.chapter_number,
      title: ch.title,
      created_at: ch.created_at,
      series: ch.series as unknown as { slug: string; title: string } | null,
    })),
  };
}

export default async function DataMapPage() {
  const data = await getDataMapPayload();

  // Group series by type
  const groupedSeries = data.series.reduce((acc: Record<string, typeof data.series>, item) => {
    const type = item.type || "manga";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const coreRoutes = [
    { name: "Home Dashboard", path: "/home" },
    { name: "Browse Catalog", path: "/browse" },
    { name: "Top Rankings", path: "/rankings" },
    { name: "Recommendations", path: "/recommendations" },
    { name: "Request a Series", path: "/request-series" },
    { name: "DMCA Copyright Center", path: "/dmca" },
    { name: "About Platform", path: "/about" },
    { name: "Contact & Support", path: "/contact" },
  ];

  const typeLabels: Record<string, string> = {
    manga: "Manga Series",
    manhwa: "Manhwa Series",
    manhua: "Manhua Series",
    novel: "Web Novels",
  };

  return (
    <div className="min-h-screen bg-black text-foreground py-20">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl">
        {/* Header */}
        <div className="border-b border-neutral-900 pb-8 mb-12">
          <div className="eyebrow mb-3 tracking-[0.15em] opacity-80">vnrscans index directory</div>
          <h1 className="text-4xl font-bold uppercase tracking-[0.06em] text-white sm:text-5xl leading-none">
            DATA DIRECTORY MAP
          </h1>
          <p className="mt-4 text-sm text-neutral-450 font-light max-w-2xl leading-relaxed">
            Welcome to the human-readable directory index of vnrscans. This sitemap aggregates site pages, indexed catalog genres, registered titles, and recent chapter updates for search crawlers and catalog navigators.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {/* Column 1: Core Navigation & Genres */}
          <div className="space-y-10">
            {/* Core Routes */}
            <div className="card-spacex bg-surface-1 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-white border-b border-neutral-850 pb-3 mb-4 flex items-center gap-2">
                <Compass className="h-4.5 w-4.5 text-neutral-400 stroke-[1.5]" /> Platform Navigation
              </h2>
              <ul className="space-y-3">
                {coreRoutes.map((route) => (
                  <li key={route.path}>
                    <Link
                      href={route.path}
                      className="group flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      <span>{route.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Genres Index */}
            <div className="card-spacex bg-surface-1 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-white border-b border-neutral-850 pb-3 mb-4 flex items-center gap-2">
                <Tag className="h-4.5 w-4.5 text-neutral-400 stroke-[1.5]" /> Catalog Genres
              </h2>
              {data.genres.length === 0 ? (
                <p className="text-xs text-neutral-600">No genres defined.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {data.genres.map((genre) => (
                    <Link
                      key={genre.slug}
                      href={`/browse?genre=${encodeURIComponent(genre.slug)}`}
                      className="text-xs text-neutral-400 hover:text-white transition-colors truncate block"
                      title={genre.name}
                    >
                      # {genre.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Series Directory */}
          <div className="md:col-span-2 space-y-10">
            {/* Series Categories */}
            <div className="card-spacex bg-surface-1 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-white border-b border-neutral-850 pb-3 mb-6 flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-neutral-400 stroke-[1.5]" /> Library Index
              </h2>

              <div className="space-y-8">
                {Object.keys(typeLabels).map((type) => {
                  const items = groupedSeries[type] || [];
                  return (
                    <div key={type}>
                      <h3 className="eyebrow text-2xs tracking-widest text-neutral-400 mb-3 border-b border-neutral-900 pb-1.5 font-bold uppercase">
                        {typeLabels[type]} ({items.length})
                      </h3>
                      {items.length === 0 ? (
                        <p className="text-xs text-neutral-600 font-light">No titles indexed.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {items.map((s) => (
                            <Link
                              key={s.slug}
                              href={`/title/${s.slug}`}
                              className="text-xs text-neutral-400 hover:text-white transition-colors truncate block font-light"
                            >
                              {s.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Chapter Releases */}
            <div className="card-spacex bg-surface-1 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-white border-b border-neutral-850 pb-3 mb-4 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-neutral-400 stroke-[1.5]" /> Recent Chapter Archives
              </h2>
              {data.chapters.length === 0 ? (
                <p className="text-xs text-neutral-600">No chapters released.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.chapters.map((ch, idx) => {
                    const seriesTitle = ch.series?.title || "Unknown Series";
                    return (
                      <Link
                        key={idx}
                        href={`/title/${ch.series?.slug}/${ch.slug}`}
                        className="group flex items-center justify-between text-xs text-neutral-400 hover:text-white transition-colors border-b border-neutral-900/60 pb-2"
                      >
                        <span className="truncate max-w-[70%] font-light">
                          {seriesTitle}
                        </span>
                        <span className="text-3xs font-bold uppercase text-neutral-500 group-hover:text-neutral-300 font-mono">
                          Ch. {ch.chapter_number}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
