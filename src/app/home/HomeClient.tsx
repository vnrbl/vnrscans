"use client";

import React, { type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, History, ChevronLeft, ChevronRight, ChevronUp, Star, MoreVertical, EyeOff, Lock, ExternalLink, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDragScroll, DRAG_SCROLL_CONTAINER_CLASS } from "@/hooks/useDragScroll";
import { TITLE_CARD_WIDTH, TITLE_COVER_CLASS } from "@/components/titleCardStyles";
import dynamic from "next/dynamic";
import type { CarouselItem } from "@/components/HomeHeroCarousel";

const HomeHeroCarousel = dynamic(
  () => import("@/components/HomeHeroCarousel").then((m) => m.HomeHeroCarousel),
  {
    ssr: true,
    loading: () => (
      <div className="h-64 sm:h-72 w-full animate-pulse rounded-lg bg-secondary/30" />
    ),
  }
);
import { OptimizedImage } from "@/components/OptimizedImage";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { CountryFlag, getTypeLabel } from "@/components/CountryFlag";

const LATEST_UPDATES_CHAPTER_LIMIT = 5;
const LATEST_UPDATES_PAGE_SIZE = 1000;
const HOME_HORIZONTAL_CARD_LIMIT = 30;
const LATEST_UPDATES_ROWS_PER_BATCH = 6;
const LATEST_UPDATES_DESKTOP_COLUMNS = 4;
const LATEST_UPDATES_BATCH_SIZE = LATEST_UPDATES_ROWS_PER_BATCH * LATEST_UPDATES_DESKTOP_COLUMNS; // 24 (divisible by 1, 2, 3, 4)

type HomeHistorySection = "followed-chapters" | "reading-history" | "latest-updates";

export type HomeSeriesCard = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string;
  rating_average: number | null;
  status: string;
  view_count: number | null;
};

export type HomeLatestUpdate = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string;
  recent_chapters: {
    id: string;
    slug: string;
    chapter_number: number;
    title: string | null;
    created_at: string;
    scheduled_at?: string | null;
    status?: string | null;
  }[];
};

export type HomeInitialData = {
  carouselItems?: CarouselItem[];
  latestUpdates?: HomeLatestUpdate[];
  popular?: HomeSeriesCard[];
  highScore?: HomeSeriesCard[];
};

function HomeContent({ initialData }: { initialData?: HomeInitialData }) {
  const { user } = useAuth();
  const { settings } = useReaderSettings();
  
  // Hidden sections state (stored safely in localStorage)
  const [hiddenSections, setHiddenSections] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = window.localStorage.getItem('hiddenHomeSections');
        if (saved) {
          setHiddenSections(new Set(JSON.parse(saved)));
        }
      }
    } catch {}
  }, []);

  // Save hidden sections to localStorage
  const toggleSection = (sectionId: string) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      window.localStorage.setItem('hiddenHomeSections', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const isSectionHidden = (sectionId: string) => hiddenSections.has(sectionId);

  // Recently added chapters
  const recentChapters = useQuery({
    queryKey: ["recent-chapters", settings.showNovelsOnHome],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,title,chapter_number,created_at,scheduled_at,series:series_id(id,slug,title,cover_url,type)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .order("chapter_number", { ascending: false })
        .limit(settings.showNovelsOnHome ? 18 : 40);
      if (error) throw error;
      
      let chapters = data ?? [];
      if (!settings.showNovelsOnHome) {
        chapters = chapters.filter((ch: any) => ch.series?.type !== "novel");
      }
      return chapters.slice(0, 18);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const readingHistory = useQuery({
    queryKey: ["home-reading-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_history")
        .select(
          "id,updated_at,progress,series_id,series:series_id(id,slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)"
        )
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(40);
      if (error) throw error;

      // Group by series and keep only the most recent chapter per series
      const seriesMap = new Map();
      (data ?? []).forEach((item) => {
        if (item.series_id && !seriesMap.has(item.series_id)) {
          seriesMap.set(item.series_id, item);
        }
      });

      // Convert back to array and keep enough cards for the horizontal scroll.
      return Array.from(seriesMap.values()).slice(0, HOME_HORIZONTAL_CARD_LIMIT);
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const followedChapters = useQuery({
    queryKey: ["home-followed-chapters", user?.id],
    queryFn: async () => {
      // 1. Fetch followed series IDs from BOTH user_library and bookmarks (Favorites)
      const [libRes, bmRes] = await Promise.all([
        supabase.from("user_library").select("series_id").eq("user_id", user!.id),
        supabase.from("bookmarks").select("series_id").eq("user_id", user!.id),
      ]);
      const seriesIdSet = new Set<string>([
        ...(libRes.data ?? []).map((row) => row.series_id),
        ...(bmRes.data ?? []).map((row) => row.series_id),
      ]);
      const seriesIds = Array.from(seriesIdSet).filter(Boolean);
      if (seriesIds.length === 0) return [];

      // 2. Fetch recent chapter drops to capture active batch updates + series latest chapters
      const [recentRes, rpcRes] = await Promise.all([
        supabase
          .from("chapters")
          .select("id,slug,title,chapter_number,created_at,scheduled_at,series_id,series:series_id(id,slug,title,cover_url,type)")
          .in("series_id", seriesIds)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .order("chapter_number", { ascending: false })
          .limit(100),
        supabase.rpc("get_series_with_latest_chapters", { limit_count: 60 }),
      ]);

      // Group by series so that mass updates (e.g. 5+ chapters) collapse into ONE cover card
      const seriesMap = new Map<string, {
        latestChapter: any;
        chapters: any[];
        minChapter: number;
        maxChapter: number;
        totalUpdated: number;
      }>();

      (recentRes.data ?? []).forEach((chapter: any) => {
        const sid = chapter.series_id;
        if (!sid || !chapter.series) return;
        const num = Number(chapter.chapter_number);

        if (!seriesMap.has(sid)) {
          seriesMap.set(sid, {
            latestChapter: chapter,
            chapters: [chapter],
            minChapter: num,
            maxChapter: num,
            totalUpdated: 1,
          });
        } else {
          const entry = seriesMap.get(sid)!;
          entry.chapters.push(chapter);
          entry.totalUpdated++;
          if (num < entry.minChapter) entry.minChapter = num;
          if (num > entry.maxChapter) entry.maxChapter = num;
          if (num > Number(entry.latestChapter.chapter_number)) {
            entry.latestChapter = chapter;
          }
        }
      });

      // 3. For any followed series not covered in recent drops,
      // populate their latest chapter from get_series_with_latest_chapters so ALL followed series are represented
      const missingSeriesIds = new Set(seriesIds.filter((id) => !seriesMap.has(id)));
      if (missingSeriesIds.size > 0 && rpcRes.data) {
        (rpcRes.data ?? []).forEach((s: any) => {
          if (!missingSeriesIds.has(s.id)) return;
          const latest = s.recent_chapters?.[0];
          if (!latest) return;
          const num = Number(latest.chapter_number);

          const recentList = Array.isArray(s.recent_chapters) ? s.recent_chapters : [];
          const batchChapters = recentList.filter((c: any) => {
            if (!latest.created_at || !c.created_at) return false;
            const diff = Math.abs(new Date(latest.created_at).getTime() - new Date(c.created_at).getTime());
            return diff <= 1000 * 60 * 60 * 24; // within 24 hours
          });
          const totalUpdated = Math.max(1, batchChapters.length);
          const chNums = batchChapters.map((c: any) => Number(c.chapter_number)).filter((n: number) => !isNaN(n));
          const minChapter = chNums.length > 0 ? Math.min(...chNums) : num;
          const maxChapter = chNums.length > 0 ? Math.max(...chNums) : num;

          seriesMap.set(s.id, {
            latestChapter: {
              id: latest.id,
              slug: latest.slug,
              title: latest.title,
              chapter_number: latest.chapter_number,
              created_at: latest.created_at,
              scheduled_at: latest.scheduled_at,
              series_id: s.id,
              series: {
                id: s.id,
                slug: s.slug,
                title: s.title,
                cover_url: s.cover_url,
                type: s.type,
              },
            },
            chapters: batchChapters.length > 0 ? batchChapters : [latest],
            minChapter,
            maxChapter,
            totalUpdated,
          });
        });
      }

      const groupedChapters = Array.from(seriesMap.values())
        .sort((a, b) => new Date(b.latestChapter.created_at).getTime() - new Date(a.latestChapter.created_at).getTime())
        .map((entry) => ({
          ...entry.latestChapter,
          massUpdateCount: entry.totalUpdated,
          minChapterNumber: entry.minChapter,
          maxChapterNumber: entry.maxChapter,
          batchChapters: entry.chapters,
        }));

      return groupedChapters.slice(0, 50);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Popular manhwa
  const popularInitialData = React.useMemo(() => {
    if (settings.showNovelsOnHome) return initialData?.popular;
    return initialData?.popular?.filter((s: any) => s.type !== "novel");
  }, [initialData?.popular, settings.showNovelsOnHome]);

  const popular = useQuery({
    queryKey: ["popular", settings.showNovelsOnHome],
    initialData: popularInitialData,
    queryFn: async () => {
      let query = supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count");
      
      if (!settings.showNovelsOnHome) {
        query = query.neq("type", "novel");
      }
      
      const { data, error } = await query
        .order("view_count", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Latest updates - series with recent chapter releases
  const latestUpdatesInitialData = React.useMemo(() => {
    if (settings.showNovelsOnHome) return initialData?.latestUpdates;
    return initialData?.latestUpdates?.filter((s: any) => s.type !== "novel");
  }, [initialData?.latestUpdates, settings.showNovelsOnHome]);

  const latestUpdates = useQuery({
    queryKey: ["latest-updates", settings.showNovelsOnHome],
    queryFn: async () => {
      const rpcRes = await supabase.rpc("get_series_with_latest_chapters", { limit_count: 60 });
      if (rpcRes.error) throw rpcRes.error;

      let fullSeriesList = rpcRes.data ?? [];
      if (!settings.showNovelsOnHome) {
        fullSeriesList = fullSeriesList.filter((series: any) => series.type !== "novel");
      }

      return fullSeriesList.map((series: any) => ({
        id: series.id,
        slug: series.slug,
        title: series.title,
        cover_url: series.cover_url,
        type: series.type,
        recent_chapters: (series.recent_chapters ?? []).map((ch: any) => ({
          id: ch.id,
          slug: ch.slug,
          chapter_number: Number(ch.chapter_number),
          title: ch.title,
          created_at: ch.created_at,
          scheduled_at: ch.scheduled_at || null,
          status: ch.status || (ch.scheduled_at && new Date(ch.scheduled_at) > new Date() ? "scheduled" : "published"),
        })),
      }));
    },
    initialData: latestUpdatesInitialData,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 20,
  });

  // Realtime subscription: synchronize Latest Updates and Reading History with live DB updates
  const queryClient = useQueryClient();
  React.useEffect(() => {
    const channel = supabase
      .channel("home-db-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chapters" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["latest-updates"] });
          queryClient.invalidateQueries({ queryKey: ["home-followed-chapters"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reading_history" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["home-reading-history"] });
          queryClient.invalidateQueries({ queryKey: ["latest-updates-reading-history"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "series" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["latest-updates"] });
          queryClient.invalidateQueries({ queryKey: ["high-score"] });
          queryClient.invalidateQueries({ queryKey: ["popular"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // High score manhwa
  const highScoreInitialData = React.useMemo(() => {
    if (settings.showNovelsOnHome) return initialData?.highScore;
    return initialData?.highScore?.filter((s: any) => s.type !== "novel");
  }, [initialData?.highScore, settings.showNovelsOnHome]);

  const highScore = useQuery({
    queryKey: ["high-score", settings.showNovelsOnHome],
    initialData: highScoreInitialData,
    queryFn: async () => {
      let query = supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count");
      
      if (!settings.showNovelsOnHome) {
        query = query.neq("type", "novel");
      }

      const { data, error } = await query
        .order("rating_average", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return (
    <div className="min-h-screen">
      <HomeHeroCarousel initialItems={initialData?.carouselItems} />

      {user && (
        <>
          {!isSectionHidden('followed-chapters') && (
            <FollowedUpdatesCarouselSection
              sectionId="followed-chapters"
              onHide={() => toggleSection('followed-chapters')}
              title="New Chapters from Followed"
              description="Latest uploads from series you follow"
              loading={followedChapters.isLoading}
              emptyMessage="Follow series to get new chapter updates here."
              chapters={(followedChapters.data ?? []) as RecentChapter[]}
            />
          )}

          {!isSectionHidden('reading-history') && (
            <ChapterCarouselSection
              sectionId="reading-history"
              onHide={() => toggleSection('reading-history')}
              title="Reading History"
              description="Pick up where you left off"
              icon={<History className="h-5 w-5" />}
              loading={readingHistory.isLoading}
              emptyMessage="No reading history yet. Start a series to see it here."
              chapters={mapHistoryToChapters(readingHistory.data)}
              timeField="updated"
              linkVariant="seriesOnly"
            />
          )}
        </>
      )}

      {/* Latest Updates Section */}
      {!isSectionHidden('latest-updates') && (
        <LatestUpdatesSection
          sectionId="latest-updates"
          onHide={() => toggleSection('latest-updates')}
          title="Latest Updates"
          description="Recently updated series with new chapters"
          series={latestUpdates.data ?? []}
          loading={latestUpdates.isLoading}
          userId={user?.id}
        />
      )}

      {/* Popular Manhwa Section */}
      {!isSectionHidden('popular') && (
        <SeriesCarouselSection
          sectionId="popular"
          onHide={() => toggleSection('popular')}
          title="Popular Manhwa"
          description="Discover the most read manhwa series ranked by our community"
          series={popular.data ?? []}
          loading={popular.isLoading}
        />
      )}

      {/* High Score Manhwa Section */}
      {!isSectionHidden('high-score') && (
        <SeriesCarouselSection
          sectionId="high-score"
          onHide={() => toggleSection('high-score')}
          title="High Score Manhwa"
          description="Discover the highest rated manhwa series"
          series={highScore.data ?? []}
          loading={highScore.isLoading}
        />
      )}

      {/* Show Hidden Sections Button */}
      {hiddenSections.size > 0 && (
        <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
          <div className="rounded-lg border border-border/40 bg-card p-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {hiddenSections.size} section{hiddenSections.size > 1 ? 's' : ''} hidden
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Show Hidden Sections
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {Array.from(hiddenSections).map((sectionId) => (
                  <DropdownMenuItem key={sectionId} onClick={() => toggleSection(sectionId)}>
                    {getSectionTitle(sectionId)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomePage({ initialData }: { initialData?: HomeInitialData }) {
  return <HomeContent initialData={initialData} />;
}

// Helper function to get section title from ID
function getSectionTitle(sectionId: string): string {
  const titles: Record<string, string> = {
    'followed-chapters': 'New Chapters from Followed',
    'reading-history': 'Reading History',
    'latest-updates': 'Latest Updates',
    'popular': 'Popular Manhwa',
    'high-score': 'High Score Manhwa',
  };
  return titles[sectionId] || sectionId;
}

type RecentChapter = {
  id: string;
  slug: string;
  title: string | null;
  chapter_number: number;
  created_at: string;
  scheduled_at?: string | null;
  series: { id: string; slug: string; title: string; cover_url: string | null } | null;
};

type HistoryRow = {
  id: string;
  updated_at: string;
  series: { id: string; slug: string; title: string; cover_url: string | null } | null;
  chapters: { slug: string; chapter_number: number; title: string | null } | null;
};

function mapHistoryToChapters(rows: HistoryRow[] | undefined): RecentChapter[] {
  if (!rows) return [];
  return rows
    .filter((row) => row.chapters?.slug && row.series?.slug)
    .map((row) => ({
      id: row.id,
      slug: row.chapters!.slug,
      title: row.chapters!.title,
      chapter_number: row.chapters!.chapter_number,
      created_at: row.updated_at,
      series: row.series,
    }));
}

function ChapterCarouselSection({
  title,
  description,
  icon,
  loading,
  emptyMessage,
  chapters,
  timeField = "created",
  linkVariant = "split",
  sectionId,
  onHide,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  loading: boolean;
  emptyMessage: string;
  chapters: RecentChapter[];
  timeField?: "created" | "updated";
  linkVariant?: "split" | "seriesOnly";
  sectionId?: string;
  onHide?: () => void;
}) {
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 border-b border-border/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
            {icon && <span className="text-purple-400">{icon}</span>}
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.04em] text-white">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground font-light tracking-[0.01em]">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-950/20 px-2.5"
          >
            <Link to="/home/history/$section" params={{ section: "reading-history" }}>
              View All
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          {chapters.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[4px] text-muted-foreground hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link
                    to="/home/history/$section"
                    params={{ section: "reading-history" }}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4 text-purple-400" />
                    View Full History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHide} className="text-xs cursor-pointer">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide this section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} glass-card rounded-[4px] overflow-hidden`}>
              <div className={`${TITLE_COVER_CLASS} shimmer-dark`} />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-3/4 shimmer-dark rounded" />
                <div className="h-3 w-1/2 shimmer-dark rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <div
          ref={scrollRef}
          {...dragHandlers}
          className={DRAG_SCROLL_CONTAINER_CLASS}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {chapters.map((chapter) => (
            <div key={chapter.id} className={TITLE_CARD_WIDTH}>
              <RecentChapterCard
                chapter={chapter}
                timeField={timeField}
                linkVariant={linkVariant}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[4px] p-8 text-center">
          <p className="text-sm text-muted-foreground font-light">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function FollowedUpdatesCarouselSection({
  title,
  description,
  loading,
  emptyMessage,
  chapters,
  sectionId,
  onHide,
}: {
  title: string;
  description?: string;
  loading: boolean;
  emptyMessage: string;
  chapters: RecentChapter[];
  sectionId?: string;
  onHide?: () => void;
}) {
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 border-b border-border/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.04em] text-white">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground font-light tracking-[0.01em]">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 px-2.5"
          >
            <Link to="/home/history/$section" params={{ section: "followed-chapters" }}>
              View All
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          {chapters.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[4px] text-muted-foreground hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link
                    to="/home/history/$section"
                    params={{ section: "followed-chapters" }}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4 text-emerald-400" />
                    View All Followed Updates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHide} className="text-xs cursor-pointer">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide this section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} glass-card rounded-[4px] overflow-hidden`}>
              <div className={`${TITLE_COVER_CLASS} shimmer-dark`} />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-3/4 shimmer-dark rounded" />
                <div className="h-3 w-1/2 shimmer-dark rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <div
          ref={scrollRef}
          {...dragHandlers}
          className={DRAG_SCROLL_CONTAINER_CLASS}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {chapters.map((chapter) => (
            <div key={chapter.id} className={TITLE_CARD_WIDTH}>
              <FollowedChapterCard chapter={chapter} />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[4px] p-8 text-center">
          <p className="text-sm text-muted-foreground font-light">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function SeriesCarouselSection({
  title,
  description,
  series,
  loading,
  sectionId,
  onHide,
}: {
  title: string;
  description?: string;
  series: Array<{
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    type: string;
    rating_average: number | null;
  }>;
  loading: boolean;
  sectionId?: string;
  onHide?: () => void;
}) {
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 border-b border-border/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.04em] text-white">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground font-light tracking-[0.01em]">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-950/20 px-2.5"
          >
            <Link
              to="/rankings"
              search={{ tab: sectionId === "popular" ? "most-viewed" : "top-rated" }}
            >
              Rankings
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          {series.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8 rounded-[4px] border-border/60 bg-surface-1/80 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[4px] text-muted-foreground hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link
                    to="/rankings"
                    search={{ tab: sectionId === "popular" ? "most-viewed" : "top-rated" }}
                    className="flex items-center"
                  >
                    <Trophy className="mr-2 h-4 w-4 text-amber-400" />
                    View in Rankings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHide} className="text-xs cursor-pointer">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide this section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} glass-card rounded-[4px] overflow-hidden`}>
              <div className={`${TITLE_COVER_CLASS} shimmer-dark`} />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-3/4 shimmer-dark rounded" />
                <div className="h-3 w-1/2 shimmer-dark rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : series.length > 0 ? (
        <div
          ref={scrollRef}
          {...dragHandlers}
          className={DRAG_SCROLL_CONTAINER_CLASS}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {series.map((item) => (
            <Link
              key={item.id}
              to="/title/$slug"
              params={{ slug: item.slug }}
              title={item.title}
              className={`group ${TITLE_CARD_WIDTH} glass-card flex flex-col h-full rounded-lg overflow-hidden hover-lift block flex-shrink-0`}
            >
              <div className={`${TITLE_COVER_CLASS} relative overflow-hidden bg-neutral-950 shrink-0`}>
                <OptimizedImage
                  src={item.cover_url}
                  alt={item.title}
                  seriesId={item.id}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute left-2 top-2">
                  <Badge variant="outline" className="badge-glass text-3xs font-semibold uppercase tracking-wider py-0.5 px-1.5 leading-none rounded-[3px]">
                    {item.type}
                  </Badge>
                </div>
                {item.rating_average && Number(item.rating_average) > 0 ? (
                  <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded border border-white/10 bg-black/75 px-1.5 py-0.5 text-xs backdrop-blur-md text-amber-300 font-bold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 stroke-[1.5]" />
                    {Number(item.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-3 bg-surface-1/90 flex flex-col justify-between flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold leading-snug text-white group-hover:text-purple-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[4px] p-8 text-center">
          <p className="text-sm text-muted-foreground font-light">No series available yet.</p>
        </div>
      )}
    </section>
  );
}

function LatestUpdatesSection({
  title,
  description,
  series,
  loading,
  userId,
  sectionId,
  onHide,
}: {
  title: string;
  description?: string;
  series: Array<{
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    type: string;
    recent_chapters: Array<{
      id: string;
      slug: string;
      chapter_number: number;
      title: string | null;
      created_at: string;
      scheduled_at?: string | null;
      status?: string | null;
    }>;
  }>;
  loading: boolean;
  userId?: string;
  sectionId?: string;
  onHide?: () => void;
}) {
  const [visibleCount, setVisibleCount] = React.useState(LATEST_UPDATES_BATCH_SIZE);

  // Prevent background query refetches from resetting user's expanded scroll state
  React.useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, Math.max(LATEST_UPDATES_BATCH_SIZE, series.length)));
  }, [series.length]);

  // Fetch reading history to determine read status
  const readingHistoryQuery = useQuery({
    queryKey: ["latest-updates-reading-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data?.map(d => d.chapter_id) ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const readChapterIds = new Set(readingHistoryQuery.data ?? []);
  const visibleSeries = series.slice(0, visibleCount);
  const hasMoreSeries = visibleCount < series.length;

  const isNewChapter = (createdAt: string) => {
    if (!createdAt) return false;
    const now = new Date();
    const chapterDate = new Date(createdAt);
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const timeDiff = now.getTime() - chapterDate.getTime();
    return timeDiff < threeHoursInMs && timeDiff >= 0;
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 border-b border-border/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-xs text-neutral-400">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-950/20 px-2.5"
          >
            <Link to="/home/history/$section" params={{ section: "latest-updates" }}>
              View All
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-neutral-400 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link
                    to="/home/history/$section"
                    params={{ section: "latest-updates" }}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4 text-purple-400" />
                    View All Updates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHide} className="text-xs cursor-pointer">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide this section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-lg p-3 overflow-hidden">
              <div className="flex gap-3">
                <div className="h-[160px] w-[105px] shrink-0 rounded shimmer-dark" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 shimmer-dark rounded" />
                  <div className="h-6 w-full shimmer-dark rounded mt-3" />
                  <div className="h-6 w-full shimmer-dark rounded" />
                  <div className="h-6 w-full shimmer-dark rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : series.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleSeries.map((item) => (
              <div
                key={item.id}
                className="glass-card group rounded-lg p-3 hover-lift transition-[border-color,box-shadow] flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  {/* Cover and Flag Column */}
                  <div className="shrink-0 flex flex-col items-center">
                    <Link
                      to="/title/$slug"
                      params={{ slug: item.slug }}
                      className="shrink-0 block"
                    >
                      <div className="relative h-[160px] w-[105px] overflow-hidden rounded bg-neutral-950">
                        <OptimizedImage
                          src={item.cover_url}
                          alt={item.title}
                          seriesId={item.id}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {item.recent_chapters.some((c) => c.status === "scheduled" || (c.scheduled_at && new Date(c.scheduled_at) > new Date())) && (
                          <div
                            className="absolute top-2 right-2 rounded bg-amber-950/90 border border-amber-500/50 p-1 text-amber-300 shadow-md backdrop-blur-md"
                            title="Has chapters currently on early-access hold"
                          >
                            <Lock className="h-2.5 w-2.5 text-amber-400 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Flag below the cover inside the card */}
                    <div
                      className="mt-2 flex items-center justify-center w-[105px]"
                      title={getTypeLabel(item.type)}
                    >
                      <div className="flex items-center justify-center p-0.5 rounded bg-surface-1/90 border border-white/10 shadow-xs hover:border-purple-500/40 transition-colors">
                        <CountryFlag type={item.type} className="h-3.5 w-5 rounded-[2px] shadow-xs overflow-hidden" />
                      </div>
                    </div>
                  </div>

                  {/* Series Info and Chapters */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="mb-2">
                      <Link
                        to="/title/$slug"
                        params={{ slug: item.slug }}
                        title={item.title}
                        className="block font-semibold text-sm leading-snug text-white hover:text-purple-400 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    </div>

                    {/* Recent Chapters List */}
                    <div className="space-y-1.5">
                      {item.recent_chapters.length > 0 ? (
                        item.recent_chapters.map((chapter) => {
                          const isRead = readChapterIds.has(chapter.id);
                          const isNew = isNewChapter(chapter.created_at);
                          const isScheduledLock = chapter.status === "scheduled" || (!!chapter.scheduled_at && new Date(chapter.scheduled_at) > new Date());
                          const remainingMinutes = isScheduledLock && chapter.scheduled_at
                            ? Math.max(1, Math.ceil((new Date(chapter.scheduled_at).getTime() - Date.now()) / (1000 * 60)))
                            : 0;

                          const formattedRemaining = remainingMinutes > 0
                            ? remainingMinutes >= 60
                              ? `${Math.floor(remainingMinutes / 60)}h${remainingMinutes % 60 ? ` ${remainingMinutes % 60}m` : ""}`
                              : `${remainingMinutes}m`
                            : null;

                          return (
                            <Link
                              key={chapter.id}
                              to="/title/$titleSlug/$chapterSlug"
                              params={{ titleSlug: item.slug, chapterSlug: chapter.slug }}
                              title={
                                isScheduledLock
                                  ? `Chapter ${chapter.chapter_number} is on early-access hold${formattedRemaining ? ` (Unlocks in ${formattedRemaining})` : ""}`
                                  : `Chapter ${chapter.chapter_number}`
                              }
                              className={`flex items-center justify-between text-xs px-2 py-1.5 rounded border transition-colors ${
                                isScheduledLock
                                  ? 'border-amber-500/40 bg-amber-950/25 hover:bg-amber-900/35 hover:border-amber-500/60 text-amber-200 shadow-sm'
                                  : isRead
                                  ? 'border-white/10 bg-surface-1/60 hover:bg-surface-2 hover:border-purple-500/40 text-neutral-500 opacity-75'
                                  : 'border-white/10 bg-surface-1/60 hover:bg-surface-2 hover:border-purple-500/40 text-neutral-200 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                                {isScheduledLock ? (
                                  <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                                ) : (
                                  <BookOpen className={`h-3 w-3 shrink-0 ${isRead ? 'text-neutral-500' : 'text-purple-400'}`} />
                                )}
                                <span className={`whitespace-nowrap text-xs ${isScheduledLock ? "font-semibold text-amber-300" : "font-medium"}`}>
                                  Ch. {chapter.chapter_number}
                                </span>
                                {isNew && !isRead && !isScheduledLock && (
                                  <span className="shrink-0 rounded-[3px] bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <span className={`ml-1 shrink-0 text-[11px] ${isScheduledLock ? "text-amber-400 font-medium font-mono" : "text-neutral-400"}`}>
                                {isScheduledLock && formattedRemaining ? formattedRemaining : formatTimeAgo(chapter.created_at)}
                              </span>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="flex items-center text-xs text-neutral-500 py-2 px-2.5 rounded border border-white/5 bg-white/[0.02]">
                          <Clock className="h-3 w-3 mr-1.5 text-neutral-600 shrink-0" />
                          <span>Coming Soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={visibleCount <= LATEST_UPDATES_BATCH_SIZE}
              className="min-w-36 gap-2 border-white/10 bg-surface-1/80 hover:bg-surface-2 hover:border-purple-500/40 text-neutral-300 hover:text-white transition-all disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed"
              onClick={() => setVisibleCount((count) => Math.max(LATEST_UPDATES_BATCH_SIZE, count - LATEST_UPDATES_BATCH_SIZE))}
            >
              <ChevronUp className="h-4 w-4 text-neutral-400" />
              Show Less
            </Button>
            {hasMoreSeries && (
              <Button
                variant="outline"
                className="min-w-40 gap-2 border-white/10 bg-surface-1/80 hover:bg-surface-2 hover:border-purple-500/40 text-white transition-all cursor-pointer"
                onClick={() => setVisibleCount((count) => Math.min(count + LATEST_UPDATES_BATCH_SIZE, series.length))}
              >
                Load More
                <span className="text-xs text-neutral-400">
                  {Math.min(visibleCount, series.length)}/{series.length}
                </span>
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">No recent updates available.</p>
        </div>
      )}
    </section>
  );
}

function ChapterFeedSection({
  title,
  description,
  icon,
  loading,
  emptyMessage,
  chapters,
  timeField,
  linkVariant,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  loading: boolean;
  emptyMessage: string;
  chapters: RecentChapter[];
  timeField: "created" | "updated";
  linkVariant: "split" | "seriesOnly";
}) {
  return (
    <section className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
              <div className="aspect-[2/3] animate-pulse bg-secondary" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {chapters.map((chapter) => (
            <RecentChapterCard
              key={chapter.id}
              chapter={chapter}
              timeField={timeField}
              linkVariant={linkVariant}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function FollowedChapterCard({ chapter }: { chapter: RecentChapter }) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;

  const massUpdateCount = (chapter as any).massUpdateCount || 1;
  const isMassUpdate = massUpdateCount > 1;
  const minCh = (chapter as any).minChapterNumber;
  const maxCh = (chapter as any).maxChapterNumber;

  return (
    <article className="group glass-card flex flex-col h-full rounded-lg overflow-hidden hover-lift transition-[border-color,box-shadow] relative">
      <Link
        to="/title/$titleSlug/$chapterSlug"
        params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
        title={chapter.series?.title || ""}
        className="block shrink-0"
      >
        <div className={`${TITLE_COVER_CLASS} relative overflow-hidden bg-neutral-950`}>
          <OptimizedImage
            src={chapter.series?.cover_url ?? null}
            alt={chapter.series?.title ?? ""}
            seriesId={chapter.series?.id}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {isMassUpdate && (
            <div className="absolute top-2 right-2 z-10">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider text-white ${
                massUpdateCount >= 5
                  ? "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-red-500/30"
                  : "bg-purple-600/95 shadow-purple-500/20"
              }`}>
                🔥 +{massUpdateCount} Chs
              </span>
            </div>
          )}

          {chapter.scheduled_at && new Date(chapter.scheduled_at) > new Date() ? (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300 shadow-md backdrop-blur-md transition-opacity group-hover:opacity-0 animate-pulse">
              <Lock className="h-3 w-3 text-amber-400" />
              <span>Ch. {chapter.chapter_number}</span>
            </div>
          ) : (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/80 border border-white/20 px-2 py-0.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-opacity group-hover:opacity-0">
              <BookOpen className="h-3.5 w-3.5 text-purple-400" />
              <span>Ch. {chapter.chapter_number}</span>
            </div>
          )}

          {/* Full Series Name Reveal On Hover */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/30 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <p className="text-xs font-bold leading-tight text-white drop-shadow-md break-words">
              {chapter.series?.title}
            </p>
            {isMassUpdate && (
              <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                Mass update: Ch. {minCh} – {maxCh}
              </p>
            )}
            {(chapter.series as any)?.type && (
              <span className="mt-1 text-[9px] uppercase font-semibold text-purple-400">
                {(chapter.series as any).type}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-3 bg-surface-1/90 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link
            to="/title/$slug"
            params={{ slug: seriesSlug }}
            title={chapter.series?.title || ""}
            className="block font-semibold text-sm text-white truncate leading-snug group-hover:text-purple-400 transition-colors"
          >
            {chapter.series?.title}
          </Link>
        </div>
        <Link
          to="/title/$titleSlug/$chapterSlug"
          params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
          className="mt-1 flex items-center justify-between gap-2 text-xs text-neutral-400 hover:text-purple-300 transition-colors truncate"
        >
          <span className="truncate">
            {isMassUpdate ? (
              <span className="text-purple-300 font-medium">Ch. {minCh} – {maxCh}</span>
            ) : (
              `Chapter ${chapter.chapter_number}`
            )}
          </span>
          <span className="shrink-0">{formatTimeAgo(chapter.created_at)}</span>
        </Link>
      </div>
    </article>
  );
}

function RecentChapterCard({
  chapter,
  timeField = "created",
  linkVariant = "split",
}: {
  chapter: RecentChapter;
  timeField?: "created" | "updated";
  linkVariant?: "split" | "seriesOnly";
}) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;

  const chapterLabel = `Chapter ${chapter.chapter_number}`;
  const timeLabel = timeField === "updated" ? "Last read" : "Uploaded";

  const cover = (
    <div className={`${TITLE_COVER_CLASS} relative overflow-hidden bg-neutral-950`}>
      <OptimizedImage
        src={chapter.series?.cover_url ?? null}
        alt={chapter.series?.title ?? ""}
        seriesId={chapter.series?.id}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Full Series Name Reveal On Hover */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/30 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <p className="text-xs font-bold leading-tight text-white drop-shadow-md break-words">
          {chapter.series?.title}
        </p>
        {(chapter.series as any)?.type && (
          <span className="mt-1 text-[9px] uppercase font-semibold text-purple-400">
            {(chapter.series as any).type}
          </span>
        )}
      </div>
    </div>
  );

  const timeRow = (
    <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
      <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className="truncate">
        {timeLabel} {formatTimeAgo(chapter.created_at)}
      </span>
    </div>
  );

  const isScheduledLock = (chapter as any).status === "scheduled" || (!!chapter.scheduled_at && new Date(chapter.scheduled_at) > new Date());

  return (
    <article className="group glass-card flex flex-col h-full rounded-lg overflow-hidden hover-lift transition-[border-color,box-shadow]">
      <Link to="/title/$slug" params={{ slug: seriesSlug }} className="block shrink-0">
        {cover}
      </Link>
      <div className="p-3 bg-surface-1/90 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link
            to="/title/$slug"
            params={{ slug: seriesSlug }}
            title={chapter.series?.title || ""}
            className="block font-semibold text-sm text-white truncate leading-snug group-hover:text-purple-400 transition-colors"
          >
            {chapter.series?.title}
          </Link>
          <p className="mt-1 text-xs text-neutral-400 truncate font-medium">
            {chapterLabel}
          </p>
        </div>
        <div className="mt-1">
          {linkVariant === "seriesOnly" ? (
            timeRow
          ) : (
            <>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className={`mt-2 h-8 w-full text-xs font-semibold rounded border transition-colors ${
                  isScheduledLock
                    ? "bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border-amber-500/40"
                    : "bg-surface-2 hover:bg-purple-950/40 hover:text-purple-200 border-border/40"
                }`}
              >
                <Link
                  to="/title/$titleSlug/$chapterSlug"
                  params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
                  className="flex items-center justify-center gap-1.5"
                >
                  {isScheduledLock && <Lock className="h-3 w-3 shrink-0 text-amber-400 animate-pulse" />}
                  <span>Chapter {chapter.chapter_number}</span>
                </Link>
              </Button>
              {timeRow}
            </>
          )}
        </div>
      </div>
    </article>
  );
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
