"use client";

import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/OptimizedImage";

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

type HistorySearch = {
  period?: Period;
};

type ChapterItem = {
  id: string;
  slug: string;
  title: string | null;
  chapter_number: number;
  created_at: string;
  series: { id: string; slug: string; title: string; cover_url: string | null } | null;
};

const SECTION_META: Record<HistorySection, { title: string; description: string; requiresAuth: boolean; timeLabel: string }> = {
  "followed-chapters": {
    title: "New Chapters from Followed",
    description: "Chapter uploads from series in your library.",
    requiresAuth: true,
    timeLabel: "Uploaded",
  },
  "reading-history": {
    title: "Reading History",
    description: "Chapters you opened, grouped by when you read them.",
    requiresAuth: true,
    timeLabel: "Read",
  },
  "latest-updates": {
    title: "Latest Updates",
    description: "All recently published chapters across the site.",
    requiresAuth: false,
    timeLabel: "Uploaded",
  },
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "day", label: "1 Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

const HISTORY_PERIOD_LIMIT = 120;
const HISTORY_ALL_PAGE_SIZE = 1000;


export default function HomeHistoryContent({ section, period = "day" }: { section: string; period?: string }) {
  const { user, loading: authLoading } = useAuth();

  const sectionKey = isHistorySection(section) ? section : null;
  const meta = sectionKey ? SECTION_META[sectionKey] : null;
  const periodKey = (period === "week" || period === "month" || period === "all" ? period : "day") as Period;

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
          <h1 className="text-3xl font-bold">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              asChild
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              className="h-9"
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

      {needsLogin ? (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          Sign in to view this history.
        </div>
      ) : chapters.isLoading || authLoading ? (
        <HistoryGridSkeleton />
      ) : (chapters.data ?? []).length > 0 ? (
        sectionKey === "latest-updates" || sectionKey === "followed-chapters" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedData.map((item) => (
              <GroupedSeriesCard key={item.slug} item={item} timeLabel={meta.timeLabel} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {(chapters.data ?? []).map((chapter) => (
              <HistoryChapterCard key={chapter.id} chapter={chapter} timeLabel={meta.timeLabel} />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          No chapters found for this period.
        </div>
      )}
    </main>
  );
}

async function fetchFollowedChapters(userId: string, period: Period): Promise<ChapterItem[]> {
  const { data: library, error: libError } = await supabase
    .from("user_library" as any)
    .select("series_id")
    .eq("user_id", userId);
  if (libError) throw libError;

  const seriesIds = ((library ?? []) as unknown as Array<{ series_id: string }>).map((row) => row.series_id);
  if (seriesIds.length === 0) return [];

  const cutoff = getCutoffDate(period);
  const rows: ChapterItem[] = [];
  let page = 0;

  while (true) {
    const pageSize = period === "all" ? HISTORY_ALL_PAGE_SIZE : HISTORY_PERIOD_LIMIT;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("chapters")
      .select("id,slug,title,chapter_number,created_at,series:series_id(id,slug,title,cover_url)")
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("chapter_number", { ascending: false })
      .range(from, to);

    if (cutoff) query = query.gte("created_at", cutoff);

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as ChapterItem[]));

    if (period !== "all" || !data || data.length < pageSize || rows.length >= 1000) break;
    page += 1;
  }

  return rows;
}

async function fetchReadingHistory(userId: string, period: Period): Promise<ChapterItem[]> {
  const cutoff = getCutoffDate(period);
  const rows: any[] = [];
  let page = 0;

  while (true) {
    const pageSize = period === "all" ? HISTORY_ALL_PAGE_SIZE : HISTORY_PERIOD_LIMIT;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("reading_history")
      .select("id,updated_at,series:series_id(id,slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (cutoff) query = query.gte("updated_at", cutoff);

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));

    if (period !== "all" || !data || data.length < pageSize || rows.length >= 1000) break;
    page += 1;
  }

  return rows
    .filter((row) => row.series?.slug && row.chapters?.slug)
    .map((row) => ({
      id: row.id,
      slug: row.chapters.slug,
      title: row.chapters.title,
      chapter_number: row.chapters.chapter_number,
      created_at: row.updated_at,
      series: row.series,
    }));
}

async function fetchLatestUpdates(period: Period): Promise<ChapterItem[]> {
  const cutoff = getCutoffDate(period);
  const rows: ChapterItem[] = [];
  let page = 0;

  while (true) {
    const pageSize = period === "all" ? HISTORY_ALL_PAGE_SIZE : HISTORY_PERIOD_LIMIT;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("chapters")
      .select("id,slug,title,chapter_number,created_at,series:series_id(id,slug,title,cover_url)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("chapter_number", { ascending: false })
      .range(from, to);

    if (cutoff) query = query.gte("created_at", cutoff);

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as ChapterItem[]));

    if (period !== "all" || !data || data.length < pageSize || rows.length >= 1000) break;
    page += 1;
  }

  return rows;
}

function GroupedSeriesCard({ item, timeLabel }: { item: GroupedSeries; timeLabel: string }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex gap-4">
        {/* Cover Image */}
        <Link
          to="/title/$slug"
          params={{ slug: item.slug }}
          className="shrink-0"
        >
          <div className="relative h-[160px] w-[110px] overflow-hidden rounded-lg bg-secondary">
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
              className="line-clamp-2 text-base font-bold leading-tight hover:text-primary"
            >
              {item.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.chapters.length} new chapter{item.chapters.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mt-3 space-y-1.5 max-h-[96px] overflow-y-auto pr-1">
            {item.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to="/title/$titleSlug/$chapterSlug"
                params={{ titleSlug: item.slug, chapterSlug: chapter.slug }}
                className="flex items-center justify-between text-xs hover:text-primary transition-colors font-medium text-muted-foreground hover:text-foreground"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="truncate font-semibold text-white group-hover:text-primary">Ch. {chapter.chapter_number}</span>
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

function HistoryChapterCard({ chapter, timeLabel }: { chapter: ChapterItem; timeLabel: string }) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;

  return (
    <article className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Link to="/title/$titleSlug/$chapterSlug" params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <OptimizedImage
            src={chapter.series?.cover_url ?? null}
            alt={chapter.series?.title ?? ""}
            seriesId={chapter.series?.id}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute bottom-2 left-2 gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow backdrop-blur">
            <BookOpen className="h-3 w-3" />
            Ch.{chapter.chapter_number}
          </Badge>
        </div>
      </Link>
      <div className="p-3">
        <Link to="/title/$slug" params={{ slug: seriesSlug }} className="line-clamp-2 text-sm font-semibold leading-tight hover:text-primary">
          {chapter.series?.title}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {timeLabel} {formatTimeAgo(chapter.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function HistoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
  return section === "followed-chapters" || section === "reading-history" || section === "latest-updates";
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
