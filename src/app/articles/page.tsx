import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { ARTICLES } from "@/lib/articles";
import { buildArticlesIndexBreadcrumbLd } from "@/lib/article-schema";

export const metadata: Metadata = {
  title: "Manga & Manhwa Guides, Comparisons & Insights — vnrscans",
  description:
    "Guides and comparisons for manga, manhwa, and manhua readers: manga vs manhwa vs manhua, best free manga sites compared, gamified reading rewards, reading trackers, and creator publishing guides.",
  keywords: [
    "manga guides",
    "manhwa guides",
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
    title: "Manga & Manhwa Guides — vnrscans",
    description:
      "Guides and comparisons for manga, manhwa, and manhua readers — from genre explainers to platform comparisons.",
    url: "https://www.vnrscans.com/articles",
    type: "website",
  },
};

export default function ArticlesIndexPage() {
  const breadcrumbLd = buildArticlesIndexBreadcrumbLd();

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8 relative">
        <nav aria-label="Breadcrumb" className="text-3xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-purple-300 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">Articles</span>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Manga &amp; Manhwa Guides
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground font-light">
          Deep dives, comparisons, and explainers for manga, manhwa, and manhua readers —
          what the differences are, where the best free reading lives, how gamified
          rewards work, and how independent creators publish their series.
        </p>

        <div className="mt-10 grid gap-5">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group block rounded-xl border border-border/60 bg-surface-1/40 p-6 transition-all hover:border-purple-500/50 hover:bg-surface-1/70 focus-ring"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {article.targets.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 text-3xs font-mono uppercase tracking-wider text-purple-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                {article.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-light">
                {article.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-4 text-3xs text-muted-foreground/70 font-mono uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.readingMinutes} min read
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {article.datePublished}
                </span>
                <span className="inline-flex items-center gap-1 text-purple-400/80 transition-colors group-hover:text-purple-300">
                  Read guide <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
