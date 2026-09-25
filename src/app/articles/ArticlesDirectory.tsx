"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  ARTICLE_CATEGORIES,
  type Article,
  type ArticleCategory,
} from "@/lib/articles";

const ARTICLES_PER_PAGE = 6;

interface ArticlesDirectoryProps {
  articles: Article[];
}

export default function ArticlesDirectory({ articles }: ArticlesDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    articles.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Category match
      if (selectedCategory !== "All" && article.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(q);
        const matchesTag = article.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesExcerpt && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Reset page when category or search changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalArticles = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * ARTICLES_PER_PAGE;
  const endIndex = Math.min(startIndex + ARTICLES_PER_PAGE, totalArticles);
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  return (
    <div>
      {/* Controls: Search and Filter Pills */}
      <div className="mt-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search guides, series, or keywords..."
            className="w-full rounded-xl border border-border/80 bg-surface-1/60 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder-muted-foreground/70 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => handleCategoryChange("All")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === "All"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "border border-border/70 bg-surface-1/50 text-muted-foreground hover:border-purple-500/40 hover:text-white"
            }`}
          >
            All Guides ({categoryCounts["All"] || 0})
          </button>
          {ARTICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                  : "border border-border/70 bg-surface-1/50 text-muted-foreground hover:border-purple-500/40 hover:text-white"
              }`}
            >
              {cat} ({categoryCounts[cat] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Results Header / Page Limitation Summary */}
      <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-3 font-mono">
        <span>
          Showing {totalArticles === 0 ? 0 : startIndex + 1}–{endIndex} of {totalArticles} articles
        </span>
        {totalPages > 1 && (
          <span>
            Page {activePage} of {totalPages}
          </span>
        )}
      </div>

      {/* Articles Grid */}
      {paginatedArticles.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border/80 bg-surface-1/20 p-12 text-center">
          <p className="text-base text-muted-foreground font-medium">
            No articles found matching your filter criteria.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          {paginatedArticles.map((article) => {
            const seriesCount = article.sections.reduce(
              (acc, s) => acc + (s.seriesList?.length || 0),
              0
            );

            return (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group block rounded-2xl border border-border/60 bg-surface-1/40 p-5 sm:p-6 transition-all hover:border-purple-500/50 hover:bg-surface-1/70 shadow-sm hover:shadow-lg hover:shadow-purple-950/20"
              >
                {/* Header Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="rounded-md border border-purple-500/40 bg-purple-950/30 px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider text-purple-200">
                    {article.category}
                  </span>
                  {seriesCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-3xs font-semibold text-amber-200">
                      <Sparkles className="h-2.5 w-2.5" /> {seriesCount} Series Curated
                    </span>
                  )}
                  {article.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border/70 bg-surface-2/60 px-2 py-0.5 text-3xs font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground/90 font-light line-clamp-2">
                  {article.excerpt}
                </p>

                {/* Footer Metadata */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-3xs sm:text-xs text-muted-foreground/70 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-purple-400" /> {article.readingMinutes} min read
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {article.datePublished}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-purple-400 group-hover:text-purple-300 font-bold uppercase tracking-wider transition-colors">
                    Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls (Page limitation) */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-border/50">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-surface-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:border-purple-500/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                  activePage === pageNum
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                    : "border border-border/70 bg-surface-1 text-muted-foreground hover:border-purple-500/40 hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-surface-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:border-purple-500/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
