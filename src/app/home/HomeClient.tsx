"use client";

import React, { type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, History, ChevronLeft, ChevronRight, Star, MoreVertical, EyeOff } from "lucide-react";
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
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";
import { OptimizedImage } from "@/components/OptimizedImage";

const LATEST_UPDATES_CHAPTER_LIMIT = 5;
const LATEST_UPDATES_PAGE_SIZE = 1000;
const HOME_HORIZONTAL_CARD_LIMIT = 30;
const LATEST_UPDATES_ROWS_PER_BATCH = 5;
const LATEST_UPDATES_DESKTOP_COLUMNS = 3;
const LATEST_UPDATES_BATCH_SIZE = LATEST_UPDATES_ROWS_PER_BATCH * LATEST_UPDATES_DESKTOP_COLUMNS;

type HomeHistorySection = "followed-chapters" | "reading-history" | "latest-updates";

function HomeContent() {
  const { user } = useAuth();
  
  // Hidden sections state (stored in localStorage)
  const [hiddenSections, setHiddenSections] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = window.localStorage.getItem('hiddenHomeSections');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

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
    queryKey: ["recent-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,title,chapter_number,created_at,series:series_id(slug,title,cover_url)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .order("chapter_number", { ascending: false })
        .limit(18);
      if (error) throw error;
      return data ?? [];
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
          "id,updated_at,series_id,series:series_id(slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)"
        )
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
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
      const { data: library, error: libError } = await supabase
        .from("user_library")
        .select("series_id")
        .eq("user_id", user!.id);
      if (libError) throw libError;
      const seriesIds = (library ?? []).map((row) => row.series_id);
      if (seriesIds.length === 0) return [];

      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,title,chapter_number,created_at,series_id,series:series_id(slug,title,cover_url)")
        .in("series_id", seriesIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .order("chapter_number", { ascending: false })
        .limit(100);
      if (error) throw error;

      const uniqueChapterUpdates = new Map<string, any>();
      (data ?? []).forEach((chapter: any) => {
        const key = `${chapter.series_id}:${chapter.chapter_number}`;
        if (!uniqueChapterUpdates.has(key)) {
          uniqueChapterUpdates.set(key, chapter);
        }
      });

      return Array.from(uniqueChapterUpdates.values()).slice(0, HOME_HORIZONTAL_CARD_LIMIT);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Popular manhwa
  const popular = useQuery({
    queryKey: ["popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count")
        .order("view_count", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Latest updates - series with recent chapter releases
  const latestUpdates = useQuery({
    queryKey: ["latest-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_series_with_latest_chapters", { limit_count: 100 });

      if (error) throw error;
      return (data ?? []).map((series: any) => ({
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
        })),
      }));
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });
  // High score manhwa
  const highScore = useQuery({
    queryKey: ["high-score"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count")
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
      <HomeHeroCarousel />

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

export default function HomePage() {
  return <HomeContent />;
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
  series: { slug: string; title: string; cover_url: string | null } | null;
};

type HistoryRow = {
  id: string;
  updated_at: string;
  series: { slug: string; title: string; cover_url: string | null } | null;
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
  timeField,
  linkVariant,
  sectionId,
  onHide,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  loading: boolean;
  emptyMessage: string;
  chapters: RecentChapter[];
  timeField: "created" | "updated";
  linkVariant: "split" | "seriesOnly";
  sectionId?: string;
  onHide?: () => void;
}) {
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {chapters.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
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
            <div key={i} className={`${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
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
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function FollowedUpdatesCarouselSection({
  title,
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
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chapters.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
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
            <div key={i} className={`${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
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
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
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
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {series.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("left")}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy("right")}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
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
            <div key={i} className={`${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
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
              className={`group ${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg`}
            >
              <div className={TITLE_COVER_CLASS}>
                <OptimizedImage
                  src={item.cover_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-2 top-2">
                  <Badge variant="secondary" className="bg-background/80 text-xs uppercase backdrop-blur">
                    {item.type}
                  </Badge>
                </div>
                {item.rating_average && Number(item.rating_average) > 0 ? (
                  <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
                    <Star className="h-3 w-3 fill-violet-600 text-violet-600" />
                    {Number(item.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">No series available yet.</p>
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
    }>;
  }>;
  loading: boolean;
  userId?: string;
  sectionId?: string;
  onHide?: () => void;
}) {
  const [visibleCount, setVisibleCount] = React.useState(LATEST_UPDATES_BATCH_SIZE);

  React.useEffect(() => {
    setVisibleCount(LATEST_UPDATES_BATCH_SIZE);
  }, [series]);

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
    const now = new Date();
    const chapterDate = new Date(createdAt);
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const timeDiff = now.getTime() - chapterDate.getTime();
    return timeDiff < twoHoursInMs && timeDiff >= 0; // Less than 2 hours old
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sectionId && onHide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide this section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
              <div className="flex gap-4 p-4">
                <div className="h-[200px] w-[140px] shrink-0 animate-pulse rounded-lg bg-secondary" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : series.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleSeries.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="flex gap-4 p-4">
                  {/* Cover Image */}
                  <Link
                    to="/title/$slug"
                    params={{ slug: item.slug }}
                    className="shrink-0"
                  >
                    <div className="relative h-[200px] w-[140px] overflow-hidden rounded-lg bg-secondary">
                      <OptimizedImage
                        src={item.cover_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Series Info and Chapters */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to="/title/$slug"
                      params={{ slug: item.slug }}
                      className="line-clamp-2 text-base font-bold leading-tight hover:text-violet-600"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.recent_chapters.length} recent chapter{item.recent_chapters.length !== 1 ? "s" : ""}
                    </div>

                    {/* Recent Chapters List with Read Status */}
                    <div className="mt-3 space-y-2">
                      {item.recent_chapters.map((chapter) => {
                        const isRead = readChapterIds.has(chapter.id);
                        const isNew = isNewChapter(chapter.created_at);

                        return (
                          <Link
                            key={chapter.id}
                            to="/title/$titleSlug/$chapterSlug"
                            params={{ titleSlug: item.slug, chapterSlug: chapter.slug }}
                            className={`flex items-center justify-between text-sm transition-colors ${isRead
                                ? 'text-muted-foreground hover:text-muted-foreground/80'
                                : 'hover:text-violet-600 font-medium'
                              }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              {isRead ? (
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-green-600" />
                              ) : (
                                <BookOpen className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                              )}
                              <span className="truncate">
                                Chapter {chapter.chapter_number}
                              </span>
                              {isNew && !isRead && (
                                <span className="shrink-0 flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8 2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                              {formatTimeAgo(chapter.created_at)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMoreSeries && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                className="min-w-40 gap-2"
                onClick={() => setVisibleCount((count) => Math.min(count + LATEST_UPDATES_BATCH_SIZE, series.length))}
              >
                Load More
                <span className="text-xs text-muted-foreground">
                  {Math.min(visibleCount, series.length)}/{series.length}
                </span>
              </Button>
            </div>
          )}
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

  return (
    <article className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Link
        to="/title/$titleSlug/$chapterSlug"
        params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
        className="block"
      >
        <div className={TITLE_COVER_CLASS}>
          <OptimizedImage
            src={chapter.series?.cover_url ?? null}
            alt={chapter.series?.title ?? ""}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute bottom-2 left-2 gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow backdrop-blur">
            <BookOpen className="h-3 w-3" />
            Ch.{chapter.chapter_number}
          </Badge>
        </div>
      </Link>
      <div className="p-3">
        <Link
          to="/title/$titleSlug/$chapterSlug"
          params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
          className="flex items-center justify-between gap-2 text-xs text-muted-foreground hover:text-primary"
        >
          <span>Ch.{chapter.chapter_number}</span>
          <span>{formatTimeAgo(chapter.created_at)}</span>
        </Link>
        <Link
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="mt-1 line-clamp-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary"
        >
          {chapter.series?.title}
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

  const chapterLabel = timeField === "created"
    ? `Chapter ${chapter.chapter_number} uploaded`
    : `Chapter ${chapter.chapter_number}`;
  const timeLabel = timeField === "updated" ? "Last read" : "Uploaded";

  const cover = (
    <div className={TITLE_COVER_CLASS}>
      <OptimizedImage
        src={chapter.series?.cover_url ?? null}
        alt={chapter.series?.title ?? ""}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );

  const timeRow = (
    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3 shrink-0" />
      <span>
        {timeLabel} {formatTimeAgo(chapter.created_at)}
      </span>
    </div>
  );

  return (
    <article className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Link to="/title/$slug" params={{ slug: seriesSlug }} className="block">
        {cover}
      </Link>
      <div className="p-3">
        <Link
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="line-clamp-1 text-sm font-semibold leading-tight text-foreground hover:text-primary"
        >
          {chapter.series?.title}
        </Link>
        {linkVariant === "seriesOnly" ? (
          <>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{chapterLabel}</p>
            {timeRow}
          </>
        ) : (
          <>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="mt-2 h-8 w-full text-xs font-semibold"
            >
              <Link
                to="/title/$titleSlug/$chapterSlug"
                params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }}
              >
                Chapter {chapter.chapter_number}
              </Link>
            </Button>
            {timeRow}
          </>
        )}
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
