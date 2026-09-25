import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { buildArticlesIndexBreadcrumbLd } from "@/lib/article-schema";
import ArticlesDirectory from "./ArticlesDirectory";

export const metadata: Metadata = {
  title: "Manga & Manhwa Guides, Best Lists & Recommendations — vnrscans",
  description:
    "Curated guides and best lists for manga, manhwa, and manhua: top action webtoons of 2026, cultivation starter guides, isekai explainers, reader speed comparisons, and reading trackers.",
  keywords: [
    "manga guides",
    "manhwa guides",
    "best action manhwa 2026",
    "cultivation manhwa starter guide",
    "isekai manhwa beginners guide",
    "manga vs manhwa vs manhua explained",
    "best free manga sites compared",
    "vnrscans vs other manga readers",
    "gamified manga reading platforms",
    "how to track manga reading progress",
    "how to publish manga online",
  ],
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title: "Manga & Manhwa Guides and Best Lists — vnrscans",
    description:
      "Deep dives, curated top lists, and explainers for manga and manhwa readers — complete with cover art, ratings, plot synopses, and reading trackers.",
    url: "https://www.vnrscans.com/articles",
    type: "website",
  },
};

export default function ArticlesIndexPage() {
  const breadcrumbLd = buildArticlesIndexBreadcrumbLd();

  return (
    <div className="min-h-screen bg-background py-14 md:py-20 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8 relative">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-3xs text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-purple-300 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Articles &amp; Guides</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/20 px-3 py-1 text-3xs font-semibold uppercase tracking-wider text-purple-300">
            Editorial &amp; Series Recommendations
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Manga &amp; Manhwa Guides
          </h1>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground/90 font-light">
            Curated top lists, genre starter packs, and platform explainers for manga, manhwa, and
            manhua readers. Discover your next binge with full plots, cover art, and verified ratings.
          </p>
        </div>

        {/* Interactive Filterable Directory with Pagination */}
        <ArticlesDirectory articles={ARTICLES} />
      </div>
    </div>
  );
}
