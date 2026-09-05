"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Clock, Layers, ListFilter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SectionPagination } from "@/components/SectionPagination";
import { formatTimeAgo, formatUserDateTime, getUserTimeZone } from "@/lib/date";

type HistorySection = "followed-chapters" | "reading-history" | "latest-updates";
type Period = "day" | "week" | "month" | "all";

export interface GroupedSeries {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  totalUpdated?: number;
  latestCreatedAt?: string;
  chapters: Array<{
    id: string;
    slug: string;
    chapter_number: number;
    title: string | null;
    created_at: string;
  }>;
}

export type ChapterItem = {
  id: string;
  slug: string;
  title: string | null;
  chapter_number: number;
  created_at: string;
  progress?: number;
  series: { id: string; slug: string; title: string; cover_url: string | null } | null;
};

const SECTION_META: Record<
  HistorySection,
  { title: string; description: string; requiresAuth: boolean; timeLabel: string; accentColor: string }
> = {
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

export default function HomeHistoryContent({
  section,
  period = "day",
}: {
  section: string;
  period?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [historyView, setHistoryView] = useState<"series" | "chapters">("series");

  const sectionKey = isHistorySection(section) ? section : null;
  const meta = sectionKey ? SECTION_META[sectionKey] : null;
  const defaultPeriod: Period = sectionKey === "reading-history" ? "all" : "day";
  const periodKey = (period === "week" || period === "month" || period === "all" ? period : (period === "day" ? "day" : defaultPeriod)) as Period;

  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentPage(1);
  }, [sectionKey, periodKey, historyView]);

  // Realtime subscription: synchronize Latest Updates, Followed Chapters, and Reading History with live DB updates
  useEffect(() => {
    const channel = supabase
      .channel("home-history-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chapters" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["home-history"], refetchType: "all" });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reading_history" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["home-history"], refetchType: "all" });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_library" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["home-history"], refetchType: "all" });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["home-history"], refetchType: "all" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const historyQuery = useQuery({
    queryKey: ["home-history", sectionKey, periodKey, user?.id, historyView],
    queryFn: async () => {
      if (!sectionKey) return [];
      if (sectionKey === "followed-chapters") {
        return fetchFollowedChapters(user!.id, periodKey);
      }
      if (sectionKey === "reading-history") {
        return fetchReadingHistory(user!.id, periodKey, historyView);
      }
      return fetchLatestUpdates(periodKey);
    },
    enabled: !!sectionKey && (!meta?.requiresAuth || !!user) && !authLoading,
    staleTime: 1000 * 15, // 15 seconds for responsive syncing
    refetchOnWindowFocus: true,
  });

  const readingHistoryQuery = useQuery({
    queryKey: ["home-history-read-chapters", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map((d) => d.chapter_id) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const readChapterIds = useMemo(
    () => new Set(readingHistoryQuery.data ?? []),
    [readingHistoryQuery.data]
  );

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
      ? ((historyQuery.data as ChapterItem[]) ?? []).length
      : ((historyQuery.data as GroupedSeries[]) ?? []).length;

  const paginatedGroupedSeries = useMemo(() => {
    if (sectionKey !== "followed-chapters" && sectionKey !== "latest-updates") return [];
    const list = (historyQuery.data as GroupedSeries[]) ?? [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [historyQuery.data, sectionKey, currentPage]);

  const paginatedHistoryData = useMemo(() => {
    if (sectionKey !== "reading-history") return [];
    const list = (historyQuery.data as ChapterItem[]) ?? [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [historyQuery.data, sectionKey, currentPage]);

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
                className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                By Series
              </Button>
              <Button
                size="sm"
                variant={historyView === "chapters" ? "default" : "ghost"}
                onClick={() => setHistoryView("chapters")}
                className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer"
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
                className="h-8 text-xs cursor-pointer"
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
      ) : historyQuery.isLoading || authLoading ? (
        <HistoryGridSkeleton />
      ) : totalItems > 0 ? (
        <>
          {sectionKey === "latest-updates" || sectionKey === "followed-chapters" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedGroupedSeries.map((item) => (
                <GroupedSeriesCard
                  key={item.slug}
                  item={item}
                  accentColor={meta.accentColor}
                  readChapterIds={readChapterIds}
                />
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
            itemLabel={
              sectionKey === "reading-history" && historyView === "chapters"
                ? "chapters"
                : "series"
            }
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

// ---------------------------------------------------------------------------
// DATA FETCHING HELPERS
// ---------------------------------------------------------------------------

async function fetchLatestUpdates(period: Period): Promise<GroupedSeries[]> {
  const cutoff = getCutoffDate(period);

  // Fetch RPC for latest 5 chapters per series AND all series to guarantee complete coverage
  const [rpcRes, allSeriesRes] = await Promise.all([
    supabase.rpc("get_series_with_latest_chapters", { limit_count: 1000 }),
    supabase.from("series").select("id,slug,title,cover_url,type,updated_at").order("title"),
  ]);
  if (rpcRes.error) throw rpcRes.error;

  const rpcMap = new Map((rpcRes.data ?? []).map((s: any) => [s.id, s]));
  const fullSeriesList = (allSeriesRes.data ?? []).map((s: any) => {
    const existing = rpcMap.get(s.id);
    if (existing) return existing;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      cover_url: s.cover_url,
      type: s.type,
      latest_chapter_created_at: s.updated_at,
      recent_chapters: [],
    };
  });

  const results: GroupedSeries[] = [];

  fullSeriesList.forEach((s: any) => {
    const recentChapters = Array.isArray(s.recent_chapters) ? s.recent_chapters : [];

    // Filter chapters based on period cutoff if selected
    const filteredChapters = cutoff
      ? recentChapters.filter(
          (ch: any) => ch.created_at && new Date(ch.created_at) >= new Date(cutoff)
        )
      : recentChapters;

    // If a cutoff is active and no chapters were created after cutoff, skip series
    if (cutoff && filteredChapters.length === 0) {
      if (
        !s.latest_chapter_created_at ||
        new Date(s.latest_chapter_created_at) < new Date(cutoff)
      ) {
        return;
      }
    }

    const chaptersToUse =
      filteredChapters.length > 0 ? filteredChapters : recentChapters.slice(0, 5);
    const latestDate =
      chaptersToUse[0]?.created_at || s.latest_chapter_created_at || s.updated_at;

    results.push({
      id: s.id,
      title: s.title,
      slug: s.slug,
      cover_url: s.cover_url,
      totalUpdated: filteredChapters.length > 0 ? filteredChapters.length : chaptersToUse.length,
      latestCreatedAt: latestDate,
      chapters: chaptersToUse.map((ch: any) => ({
        id: ch.id,
        slug: ch.slug,
        chapter_number: Number(ch.chapter_number),
        title: ch.title,
        created_at: ch.created_at,
      })),
    });
  });

  // Order series by newest chapter release date DESC
  return results.sort((a, b) => {
    const timeA = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0;
    const timeB = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0;
    return timeB - timeA;
  });
}

async function fetchFollowedChapters(userId: string, period: Period): Promise<GroupedSeries[]> {
  // 1. Fetch followed series IDs from BOTH user_library (excluding dropped) and bookmarks (Favorites)
  const [libRes, bmRes] = await Promise.all([
    supabase.from("user_library" as any).select("series_id, reading_status").eq("user_id", userId),
    supabase.from("bookmarks" as any).select("series_id").eq("user_id", userId),
  ]);
  const libSeries = ((libRes.data ?? []) as any[])
    .filter((r) => r.reading_status !== "dropped")
    .map((r) => r.series_id);
  const bmSeries = ((bmRes.data ?? []) as any[]).map((r) => r.series_id);

  const seriesIdSet = new Set<string>([...libSeries, ...bmSeries].filter(Boolean));
  const seriesIds = Array.from(seriesIdSet);
  if (seriesIds.length === 0) return [];

  const cutoff = getCutoffDate(period);

  // 2. Fetch series metadata, recent chapters, and RPC in parallel
  const [allFollowedSeriesRes, recentRes, rpcRes] = await Promise.all([
    supabase.from("series").select("id,slug,title,cover_url,type,updated_at").in("id", seriesIds),
    supabase
      .from("chapters")
      .select("id,slug,title,chapter_number,created_at,series_id,series:series_id(id,slug,title,cover_url)")
      .in("series_id", seriesIds)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("chapter_number", { ascending: false })
      .limit(1000),
    supabase.rpc("get_series_with_latest_chapters", { limit_count: 1000 }),
  ]);

  const seriesMap = new Map<string, GroupedSeries>();

  // Initialize all followed series so none are ever missing when period === "all"
  if (!cutoff) {
    (allFollowedSeriesRes.data ?? []).forEach((s: any) => {
      seriesMap.set(s.id, {
        id: s.id,
        title: s.title,
        slug: s.slug,
        cover_url: s.cover_url,
        totalUpdated: 0,
        latestCreatedAt: s.updated_at,
        chapters: [],
      });
    });
  }

  // Populate latest chapters from RPC (gives reliable top 5 chapters per series)
  const rpcFollowed = (rpcRes.data ?? []).filter((s: any) => seriesIdSet.has(s.id));
  rpcFollowed.forEach((s: any) => {
    const recentList = Array.isArray(s.recent_chapters) ? s.recent_chapters : [];
    const filtered = cutoff
      ? recentList.filter(
          (ch: any) => ch.created_at && new Date(ch.created_at) >= new Date(cutoff)
        )
      : recentList;

    if (cutoff && filtered.length === 0) return;

    const chaptersToUse = filtered.length > 0 ? filtered : recentList.slice(0, 5);
    const existing = seriesMap.get(s.id);
    if (!existing) {
      seriesMap.set(s.id, {
        id: s.id,
        title: s.title,
        slug: s.slug,
        cover_url: s.cover_url,
        totalUpdated: chaptersToUse.length,
        latestCreatedAt: chaptersToUse[0]?.created_at || s.latest_chapter_created_at,
        chapters: chaptersToUse.map((ch: any) => ({
          id: ch.id,
          slug: ch.slug,
          chapter_number: Number(ch.chapter_number),
          title: ch.title,
          created_at: ch.created_at,
        })),
      });
    } else {
      existing.totalUpdated = chaptersToUse.length;
      existing.latestCreatedAt =
        chaptersToUse[0]?.created_at || s.latest_chapter_created_at || existing.latestCreatedAt;
      chaptersToUse.forEach((ch: any) => {
        if (!existing.chapters.some((c) => c.id === ch.id)) {
          existing.chapters.push({
            id: ch.id,
            slug: ch.slug,
            chapter_number: Number(ch.chapter_number),
            title: ch.title,
            created_at: ch.created_at,
          });
        }
      });
    }
  });

  // Merge recent chapter drops to ensure multiple recent drops are captured
  (recentRes.data ?? []).forEach((ch: any) => {
    if (!ch.series?.slug) return;
    if (cutoff && new Date(ch.created_at) < new Date(cutoff)) return;

    let entry = seriesMap.get(ch.series_id);
    if (!entry) {
      entry = {
        id: ch.series.id,
        title: ch.series.title,
        slug: ch.series.slug,
        cover_url: ch.series.cover_url,
        totalUpdated: 0,
        latestCreatedAt: ch.created_at,
        chapters: [],
      };
      seriesMap.set(ch.series_id, entry);
    }

    if (!entry.chapters.some((c) => c.id === ch.id)) {
      entry.chapters.push({
        id: ch.id,
        slug: ch.slug,
        chapter_number: Number(ch.chapter_number),
        title: ch.title,
        created_at: ch.created_at,
      });
      entry.totalUpdated = (entry.totalUpdated || 0) + 1;
      if (new Date(ch.created_at).getTime() > new Date(entry.latestCreatedAt || 0).getTime()) {
        entry.latestCreatedAt = ch.created_at;
      }
    }
  });

  // Sort each series chapters by chapter_number DESC
  seriesMap.forEach((entry) => {
    entry.chapters.sort((a, b) => b.chapter_number - a.chapter_number);
  });

  return Array.from(seriesMap.values()).sort((a, b) => {
    const timeA = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0;
    const timeB = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0;
    return timeB - timeA;
  });
}

async function fetchReadingHistory(
  userId: string,
  period: Period,
  historyView: "series" | "chapters"
): Promise<ChapterItem[]> {
  const cutoff = getCutoffDate(period);

  if (historyView === "series") {
    // Dedicated RPC groups by series directly at DB level, returning all series read by user
    const { data, error } = await supabase.rpc("get_user_reading_history_series", {
      _user_id: userId,
      _cutoff: cutoff,
    });
    if (!error && Array.isArray(data)) {
      return data.map((row: any) => ({
        id: row.id,
        slug: row.chapter_slug,
        title: row.chapter_title,
        chapter_number: Number(row.chapter_number),
        created_at: row.updated_at,
        progress: Number(row.progress || 0),
        series: {
          id: row.series_id,
          slug: row.series_slug,
          title: row.series_title,
          cover_url: row.series_cover_url,
        },
      }));
    }
  } else {
    // Chapters view: return individual chapter read rows
    const { data, error } = await supabase.rpc("get_user_reading_history_chapters", {
      _user_id: userId,
      _cutoff: cutoff,
      _limit: 1000,
    });
    if (!error && Array.isArray(data)) {
      return data.map((row: any) => ({
        id: row.id,
        slug: row.chapter_slug,
        title: row.chapter_title,
        chapter_number: Number(row.chapter_number),
        created_at: row.updated_at,
        progress: Number(row.progress || 0),
        series: {
          id: row.series_id,
          slug: row.series_slug,
          title: row.series_title,
          cover_url: row.series_cover_url,
        },
      }));
    }
  }

  // Resilient fallback in case of connection or RPC error
  let query = supabase
    .from("reading_history")
    .select(
      "id,updated_at,progress,series_id,series:series_id(id,slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (cutoff) query = query.gte("updated_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .filter((row: any) => row.series?.slug && row.chapters?.slug)
    .map((row: any) => ({
      id: row.id,
      slug: row.chapters.slug,
      title: row.chapters.title,
      chapter_number: Number(row.chapters.chapter_number),
      created_at: row.updated_at,
      progress: Number(row.progress || 0),
      series: row.series,
    }));
}

// ---------------------------------------------------------------------------
// UI COMPONENTS
// ---------------------------------------------------------------------------

function GroupedSeriesCard({
  item,
  accentColor,
  readChapterIds,
}: {
  item: GroupedSeries;
  accentColor: string;
  readChapterIds?: Set<string>;
}) {
  const isNewChapter = (createdAt: string) => {
    if (!createdAt) return false;
    const now = new Date();
    const chapterDate = new Date(createdAt);
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const timeDiff = now.getTime() - chapterDate.getTime();
    return timeDiff < threeHoursInMs && timeDiff >= 0;
  };

  // Show 5 chapters directly on the card with NO inner scroll trap!
  // The mouse wheel will scroll the page naturally.
  const displayChapters = item.chapters.slice(0, 5);
  const remainingCount = Math.max(
    0,
    (item.totalUpdated || item.chapters.length) - displayChapters.length
  );

  return (
    <article className="group overflow-hidden rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 flex flex-col justify-between">
      <div className="flex gap-4">
        {/* Cover Image */}
        <Link
          to="/title/$slug"
          params={{ slug: item.slug }}
          className="shrink-0"
        >
          <div className="relative h-[195px] w-[125px] overflow-hidden rounded-lg bg-secondary shadow-md">
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
              className="line-clamp-2 text-base font-bold leading-tight hover:text-primary transition-colors text-white"
            >
              {item.title}
            </Link>
          </div>

          {/* List of chapters: WITHOUT any overflow-y-auto so page scrolls freely */}
          <div className="mt-2.5 space-y-1.5">
            {displayChapters.map((chapter) => {
              const isRead = readChapterIds?.has(chapter.id) ?? false;
              const isNew = isNewChapter(chapter.created_at);

              return (
                <Link
                  key={chapter.id}
                  to="/title/$titleSlug/$chapterSlug"
                  params={{ titleSlug: item.slug, chapterSlug: chapter.slug }}
                  className={`flex items-center justify-between text-xs transition-colors font-medium py-1 px-1.5 rounded ${
                    isRead
                      ? "text-neutral-500 hover:text-neutral-300 opacity-75 hover:bg-secondary/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <BookOpen
                      className={`h-3.5 w-3.5 shrink-0 ${isRead ? "text-neutral-500" : ""}`}
                      style={{ color: isRead ? undefined : accentColor }}
                    />
                    <span
                      className={`truncate ${
                        isRead
                          ? "text-neutral-500 font-normal"
                          : "font-semibold text-white group-hover:text-primary"
                      }`}
                    >
                      Ch. {chapter.chapter_number}
                    </span>
                    {isNew && !isRead && (
                      <span
                        className="shrink-0 rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 0 8px ${accentColor}80`,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <span
                    className="ml-2 shrink-0 text-[10px] text-neutral-400"
                    title={chapter.created_at ? `Uploaded: ${formatUserDateTime(chapter.created_at)} (${getUserTimeZone()})` : undefined}
                  >
                    {formatTimeAgo(chapter.created_at)}
                  </span>
                </Link>
              );
            })}

            {remainingCount > 0 && (
              <Link
                to="/title/$slug"
                params={{ slug: item.slug }}
                className="block text-[11px] font-semibold text-primary/85 hover:text-primary transition-colors pt-0.5 px-1.5"
              >
                +{remainingCount} more chapters →
              </Link>
            )}
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

  const progressPercent = chapter.progress
    ? Math.min(100, Math.round(chapter.progress * 100))
    : 0;

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
          <div
            className="flex items-center gap-1 text-xs text-neutral-400"
            title={chapter.created_at ? `${timeLabel}: ${formatUserDateTime(chapter.created_at)} (${getUserTimeZone()})` : undefined}
          >
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
  if (period === "day") date.setUTCDate(date.getUTCDate() - 1);
  if (period === "week") date.setUTCDate(date.getUTCDate() - 7);
  if (period === "month") date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString();
}
