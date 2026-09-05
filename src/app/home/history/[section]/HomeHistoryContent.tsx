"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Clock, CheckCircle2, Bookmark, Layers, ListFilter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SectionPagination } from "@/components/SectionPagination";

type HistorySection = "followed-chapters" | "reading-history" | "latest-updates";
type Period = "day" | "week" | "month" | "all";

interface GroupedSeries {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  chapters: Array<{
    id: string;
    slug: string;
    chapter_number: number;
    title: string | null;
    created_at: string;
  }>;
}

type ChapterItem = {
  id: string;
  slug: string;
  title: string | null;
  chapter_number: number;
  created_at: string;
  progress?: number;
  series: { id: string; slug: string; title: string; cover_url: string | null } | null;
};

const SECTION_META: Record<HistorySection, { title: string; description: string; requiresAuth: boolean; timeLabel: string; accentColor: string }> = {
  "followed-chapters": {
    title: "New Chapters from Followed",
    description: "Chapter uploads from series in your library and favorites.",
    requiresAuth: true,
    timeLabel: "Uploaded",
    accentColor: "#10B981",
  },
  "reading-history": {
    title: "Reading History",
    description: "Chapters and series you opened, organized by when you read them.",
    requiresAuth: true,
    timeLabel: "Read",
    accentColor: "#8B5CF6",
  },
  "latest-updates": {
    title: "Latest Updates",
    description: "All recently published chapters across the site.",
    requiresAuth: false,
    timeLabel: "Uploaded",
    accentColor: "#8B5CF6",
  },
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "day", label: "1 Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

const PAGE_SIZE = 20;

export default function HomeHistoryContent({ section, period = "day" }: { section: string; period?: string }) {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [historyView, setHistoryView] = useState<"series" | "chapters">("series");

  const sectionKey = isHistorySection(section) ? section : null;
  const meta = sectionKey ? SECTION_META[sectionKey] : null;
  const periodKey = (period === "week" || period === "month" || period === "all" ? period : "day") as Period;

  useEffect(() => {
    setCurrentPage(1);
  }, [sectionKey, periodKey, historyView]);

  const chapters = useQuery({
    queryKey: ["home-history", sectionKey, periodKey, user?.id],
    queryFn: async () => {
      if (!sectionKey) return [];
      if (sectionKey === "followed-chapters") return fetchFollowedChapters(user!.id, periodKey);
      if (sectionKey === "reading-history") return fetchReadingHistory(user!.id, periodKey);
      return fetchLatestUpdates(periodKey);
    },
    enabled: !!sectionKey && (!meta?.requiresAuth || !!user) && !authLoading,
    staleTime: 1000 * 60 * 2,
  });

  const groupedData = useMemo(() => {
    if (!chapters.data) return [];
    if (sectionKey !== "latest-updates" && sectionKey !== "followed-chapters") return [];

    const seriesMap = new Map<string, GroupedSeries>();

    chapters.data.forEach((ch) => {
      const seriesSlug = ch.series?.slug;
      if (!seriesSlug) return;

      if (!seriesMap.has(seriesSlug)) {
        seriesMap.set(seriesSlug, {
          id: ch.series?.id || "",
          title: ch.series?.title || "",
          slug: seriesSlug,
          cover_url: ch.series?.cover_url || null,
          chapters: [],
        });
      }

      const existing = seriesMap.get(seriesSlug)!;
      if (!existing.chapters.some((c) => c.id === ch.id)) {
        existing.chapters.push({
          id: ch.id,
          slug: ch.slug,
          chapter_number: ch.chapter_number,
          title: ch.title,
          created_at: ch.created_at,
        });
      }
    });

    return Array.from(seriesMap.values());
  }, [chapters.data, sectionKey]);

  // Reading history grouped by series (most recent chapter read per series)
  const seriesGroupedHistory = useMemo(() => {
    if (sectionKey !== "reading-history" || !chapters.data) return [];
    const map = new Map<string, ChapterItem>();
    chapters.data.forEach((item) => {
      const sId = item.series?.id || item.series?.slug;
      if (sId && !map.has(sId)) {
        map.set(sId, item);
      }
    });
    return Array.from(map.values());
  }, [chapters.data, sectionKey]);

  if (!sectionKey || !meta) {
    return (
      <main className="container mx-auto min-h-screen px-4 py-24">
        <Button asChild variant="ghost" className="mb-6 gap-2">
          <Link to="/home">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Section not found</h1>
      </main>
    );
  }

  const needsLogin = meta.requiresAuth && !authLoading && !user;

  // Pagination calculations
  const totalItems =
    sectionKey === "reading-history"
      ? historyView === "series"
        ? seriesGroupedHistory.length
        : (chapters.data ?? []).length
      : groupedData.length;

  const paginatedGroupedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return groupedData.slice(start, start + PAGE_SIZE);
  }, [groupedData, currentPage]);

  const paginatedHistoryData = useMemo(() => {
    const list = historyView === "series" ? seriesGroupedHistory : (chapters.data ?? []);
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [historyView, seriesGroupedHistory, chapters.data, currentPage]);

  return (
    <main className="container mx-auto min-h-screen px-4 py-20 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/home">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: meta.accentColor,
                boxShadow: `0 0 10px ${meta.accentColor}`,
              }}
            />
            <h1 className="text-2xl sm:text-3xl font-bold">{meta.title}</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sectionKey === "reading-history" && (
            <div className="flex items-center rounded-lg border border-border/40 bg-card p-1">
              <Button
                size="sm"
                variant={historyView === "series" ? "default" : "ghost"}
                onClick={() => setHistoryView("series")}
                className="h-7 text-xs px-2.5 gap-1.5"
              >
                <Layers className="h-3.5 w-3.5" />
                By Series
              </Button>
              <Button
                size="sm"
                variant={historyView === "chapters" ? "default" : "ghost"}
                onClick={() => setHistoryView("chapters")}
                className="h-7 text-xs px-2.5 gap-1.5"
              >
                <ListFilter className="h-3.5 w-3.5" />
                All Chapters
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((item) => (
              <Button
                key={item.value}
                asChild
                size="sm"
                variant={periodKey === item.value ? "default" : "outline"}
                className="h-8 text-xs"
              >
                <Link
                  to="/home/history/$section"
                  params={{ section: sectionKey }}
                  search={{ period: item.value }}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {needsLogin ? (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          Sign in to view this history.
        </div>
      ) : chapters.isLoading || authLoading ? (
        <HistoryGridSkeleton />
      ) : totalItems > 0 ? (
        <>
          {sectionKey === "latest-updates" || sectionKey === "followed-chapters" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedGroupedData.map((item) => (
                <GroupedSeriesCard key={item.slug} item={item} timeLabel={meta.timeLabel} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
              {paginatedHistoryData.map((chapter) => (
                <HistoryChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  timeLabel={meta.timeLabel}
                  showProgress={historyView === "series"}
                />
              ))}
            </div>
          )}

          {/* Section Pagination (triggers whenever total items exceed 20) */}
          <SectionPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemLabel={sectionKey === "reading-history" && historyView === "chapters" ? "chapters" : "series"}
            accentColor={meta.accentColor}
          />
        </>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          No entries found for this period.
        </div>
      )}
    </main>
  );
}

async function fetchFollowedChapters(userId: string, period: Period): Promise<ChapterItem[]> {
  // 1. Fetch followed series IDs from BOTH user_library and bookmarks (Favorites)
  const [libRes, bmRes] = await Promise.all([
    supabase.from("user_library" as any).select("series_id").eq("user_id", userId),
    supabase.from("bookmarks" as any).select("series_id").eq("user_id", userId),
  ]);
  const seriesIds = Array.from(
    new Set([
      ...(((libRes.data ?? []) as any[]).map((r) => r.series_id)),
      ...(((bmRes.data ?? []) as any[]).map((r) => r.series_id)),
    ])
  ).filter(Boolean);
  if (seriesIds.length === 0) return [];

  const cutoff = getCutoffDate(period);

  // 2. Query recent chapter drops + all series latest chapters in parallel
  const [recentRes, rpcRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id,slug,title,chapter_number,created_at,series_id,series:series_id(id,slug,title,cover_url)")
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("chapter_number", { ascending: false })
      .limit(400),
    supabase.rpc("get_series_with_latest_chapters", { limit_count: 1000 }),
  ]);

  const rows: ChapterItem[] = [];
  const seenChapterIds = new Set<string>();

  (recentRes.data ?? []).forEach((ch: any) => {
    if (!ch.series?.slug || seenChapterIds.has(ch.id)) return;
    if (cutoff && new Date(ch.created_at) < new Date(cutoff)) return;
    seenChapterIds.add(ch.id);
    rows.push(ch);
  });

  // For any followed series not present in recent drops, extract from get_series_with_latest_chapters
  const coveredSeriesIds = new Set(rows.map((ch) => ch.series?.id).filter(Boolean));
  const missingSeriesIds = new Set(seriesIds.filter((id) => !coveredSeriesIds.has(id)));

  if (missingSeriesIds.size > 0 && rpcRes.data) {
    (rpcRes.data ?? []).forEach((s: any) => {
      if (!missingSeriesIds.has(s.id)) return;
      const recentList = Array.isArray(s.recent_chapters) ? s.recent_chapters : [];
      recentList.forEach((ch: any) => {
        if (!ch.id || seenChapterIds.has(ch.id)) return;
        if (cutoff && ch.created_at && new Date(ch.created_at) < new Date(cutoff)) return;
        seenChapterIds.add(ch.id);
        rows.push({
          id: ch.id,
          slug: ch.slug,
          title: ch.title,
          chapter_number: Number(ch.chapter_number),
          created_at: ch.created_at,
          series: {
            id: s.id,
            slug: s.slug,
            title: s.title,
            cover_url: s.cover_url,
          },
        });
      });
    });
  }

  return rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function fetchReadingHistory(userId: string, period: Period): Promise<ChapterItem[]> {
  const cutoff = getCutoffDate(period);
  let query = supabase
    .from("reading_history")
    .select("id,updated_at,progress,series_id,series:series_id(id,slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (cutoff) query = query.gte("updated_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .filter((row: any) => row.series?.slug && row.chapters?.slug)
    .map((row: any) => ({
      id: row.id,
      slug: row.chapters.slug,
      title: row.chapters.title,
      chapter_number: row.chapters.chapter_number,
      created_at: row.updated_at,
      progress: row.progress,
      series: row.series,
    }));
}

async function fetchLatestUpdates(period: Period): Promise<ChapterItem[]> {
  const cutoff = getCutoffDate(period);
  let query = supabase
    .from("chapters")
    .select("id,slug,title,chapter_number,created_at,series:series_id(id,slug,title,cover_url)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .order("chapter_number", { ascending: false })
    .limit(500);

  if (cutoff) query = query.gte("created_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ChapterItem[];
}

function GroupedSeriesCard({ item, timeLabel }: { item: GroupedSeries; timeLabel: string }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between">
      <div className="flex gap-4">
        {/* Cover Image */}
        <Link
          to="/title/$slug"
          params={{ slug: item.slug }}
          className="shrink-0"
        >
          <div className="relative h-[160px] w-[110px] overflow-hidden rounded-lg bg-secondary shadow-md">
            <OptimizedImage
              src={item.cover_url}
              alt={item.title}
              seriesId={item.id}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Series Info & Chapters */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <Link
              to="/title/$slug"
              params={{ slug: item.slug }}
              className="line-clamp-2 text-base font-bold leading-tight hover:text-emerald-400 transition-colors text-white"
            >
              {item.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              {item.chapters.length} new chapter{item.chapters.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-3 space-y-1.5 max-h-[96px] overflow-y-auto pr-1">
            {item.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to="/title/$titleSlug/$chapterSlug"
                params={{ titleSlug: item.slug, chapterSlug: chapter.slug }}
                className="flex items-center justify-between text-xs hover:text-emerald-400 transition-colors font-medium text-muted-foreground hover:text-foreground py-0.5 px-1 rounded hover:bg-secondary/40"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate font-semibold text-white group-hover:text-emerald-400">
                    Ch. {chapter.chapter_number}
                  </span>
                </div>
                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                  {formatTimeAgo(chapter.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function HistoryChapterCard({
  chapter,
  timeLabel,
  showProgress,
}: {
  chapter: ChapterItem;
  timeLabel: string;
  showProgress?: boolean;
}) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;

  const progressPercent = chapter.progress ? Math.min(100, Math.round(chapter.progress * 100)) : 0;

  return (
    <article className="group glass-card flex flex-col h-full rounded-lg overflow-hidden hover-lift transition-all border border-border/40 hover:border-purple-500/50">
      <Link
        to="/title/$titleSlug/$chapterSlug"
        params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
        className="block shrink-0"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-950">
          <OptimizedImage
            src={chapter.series?.cover_url ?? null}
            alt={chapter.series?.title ?? ""}
            seriesId={chapter.series?.id}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/80 border border-white/20 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>Ch. {chapter.chapter_number}</span>
          </div>
          {showProgress && progressPercent > 0 && (
            <div className="absolute top-2 right-2 rounded bg-black/85 border border-purple-500/40 px-1.5 py-0.5 text-[10px] font-bold text-purple-300 backdrop-blur-md">
              {progressPercent}%
            </div>
          )}
        </div>
      </Link>
      <div className="p-3 bg-surface-1/90 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link
            to="/title/$slug"
            params={{ slug: seriesSlug }}
            title={chapter.series?.title || ""}
            className="block truncate text-sm font-semibold leading-snug text-white hover:text-purple-400 transition-colors"
          >
            {chapter.series?.title}
          </Link>
          <p className="mt-1 text-xs text-neutral-400 truncate font-medium">
            Chapter {chapter.chapter_number}
          </p>
        </div>
        <div className="mt-2">
          {showProgress && progressPercent > 0 && (
            <div className="mb-2 w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <span className="truncate">
              {timeLabel} {formatTimeAgo(chapter.created_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function HistoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
          <div className="aspect-[3/4] animate-pulse bg-secondary" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function isHistorySection(section: string): section is HistorySection {
  return (
    section === "followed-chapters" ||
    section === "reading-history" ||
    section === "latest-updates"
  );
}

function getCutoffDate(period: Period): string | null {
  if (period === "all") return null;

  const date = new Date();
  if (period === "day") date.setDate(date.getDate() - 1);
  if (period === "week") date.setDate(date.getDate() - 7);
  if (period === "month") date.setMonth(date.getMonth() - 1);
  return date.toISOString();
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
