"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useDragScroll, DRAG_SCROLL_CONTAINER_CLASS } from "@/hooks/useDragScroll";
import { TITLE_CARD_WIDTH, TITLE_COVER_CLASS } from "@/components/titleCardStyles";
import Link from "next/link";

import { SeriesHeader } from "./SeriesHeader";
import { SeriesActions } from "./SeriesActions";
import { ChapterList } from "./ChapterList";

/* ------------------------------------------------------------------ */
/*  TitleDetailPageContent — thin shell that:                         */
/*  1. Owns the top-level series query (shared across sub-components) */
/*  2. Passes stable props to memoized children                       */
/*  3. Does NOT hold chapter pagination/search/sort state             */
/* ------------------------------------------------------------------ */

export default function TitleDetailPageContent({
  slug,
  initialSeriesData,
  initialChaptersData,
}: {
  slug: string;
  initialSeriesData?: any;
  initialChaptersData?: any[];
}) {
  const { user } = useAuth();

  const seriesQ = useQuery({
    queryKey: ["series", "detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug,color,icon))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Series not found");
      return data;
    },
    initialData: initialSeriesData,
    // Keep the server-provided data on screen even if a background
    // refetch fails (RLS, network, etc.) — never regress to a
    // "Series not found" screen for a real series.
    retry: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  // Lightweight queries that only affect SeriesHeader props
  const followersCount = useQuery({
    queryKey: ["followers-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const { count, error } = await supabase
        .from("user_library")
        .select("*", { count: "exact", head: true })
        .eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data,
    staleTime: 1000 * 60 * 2,
  });

  const ratingsCount = useQuery({
    queryKey: ["ratings-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const { count, error } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true })
        .eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data,
    staleTime: 1000 * 60 * 2,
  });

  const seriesRank = useQuery({
    queryKey: ["series-rank", slug],
    queryFn: async () => {
      if (!seriesQ.data) return null;
      const { data, error } = await supabase
        .from("series")
        .select("id")
        .order("view_count", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rank = data?.findIndex((s) => s.id === seriesQ.data.id);
      return rank !== undefined && rank >= 0 ? rank + 1 : null;
    },
    enabled: !!seriesQ.data,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Reading history for determining "Resume" vs "Start reading"
  const readingHistory = useQuery({
    queryKey: ["reading-history", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_id,chapters(slug,chapter_number)")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!seriesQ.data,
    staleTime: 1000 * 60 * 2,
  });

  const libraryStatus = useQuery({
    queryKey: ["library-status", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const { data } = await supabase
        .from("user_library")
        .select("reading_status")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .maybeSingle();
      return data?.reading_status ?? null;
    },
    enabled: !!user && !!seriesQ.data,
    staleTime: 1000 * 60 * 2,
  });

  const uniqueChapterCount = React.useMemo(() => {
    if (!initialChaptersData) return 0;
    const uniqueChapters = new Set(
      initialChaptersData.map((ch) => Math.floor(ch.chapter_number))
    );
    return uniqueChapters.size;
  }, [initialChaptersData]);

  // --------------- Loading & Error states ---------------

  if (seriesQ.isLoading) {
    return <div className="container mx-auto px-4 py-12"><div className="h-96 animate-pulse rounded-lg bg-secondary" /></div>;
  }
  if (!seriesQ.data) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Series not found</h1>
        <Link href="/browse" className="text-primary">Back to browse</Link>
      </div>
    );
  }

  const s = seriesQ.data;

  // --------------- Derived props (stable across renders) ---------------

  const genres = ((s.series_genres as any[]) ?? [])
    .map((sg) => sg.genre)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;
  const tags = ((s.series_tags as any[]) ?? [])
    .map((st: any) => st.tag)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string; color: string; icon: string }>;
  const authors = splitNames(s.author);
  const artists = splitNames(s.artist);
  const contentRating = (s as { content_rating?: string }).content_rating;

  // Compute read button props
  const lastReadChapter = readingHistory.data?.chapters as
    | { slug: string; chapter_number: number }
    | null
    | undefined;
  const firstChapter = initialChaptersData?.[initialChaptersData.length - 1];
  const isContinue = libraryStatus.data === "reading" && lastReadChapter;
  const readChapterSlug = isContinue
    ? lastReadChapter.slug
    : firstChapter?.slug;
  const readChapterNumber = isContinue
    ? lastReadChapter.chapter_number
    : firstChapter?.chapter_number;
  const readButtonLabel = isContinue ? "Resume" : "Start reading";
  const readButtonText =
    readChapterNumber != null
      ? `${readButtonLabel} Ch. ${readChapterNumber}`
      : readButtonLabel;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background cover image */}
      {s.cover_url && (
        <div className="absolute top-0 left-0 w-full h-[480px] pointer-events-none overflow-hidden z-0 select-none">
          <Image
            src={s.cover_url}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-[0.22] saturate-[1.1]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        </div>
      )}

      {/* Background glow */}
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 lg:py-8 relative z-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-10">
          {/* Left sidebar — cover & actions (memoized) */}
          <SeriesActions
            slug={slug}
            seriesId={s.id}
            coverUrl={s.cover_url}
            title={s.title}
            readChapterSlug={readChapterSlug}
            readButtonText={readButtonText}
            hasChapters={(initialChaptersData?.length ?? 0) > 0}
          />

          {/* Right — metadata (memoized, never re-renders on chapter interactions) */}
          <SeriesHeader
            series={s}
            slug={slug}
            genres={genres}
            tags={tags}
            authors={authors}
            artists={artists}
            contentRating={contentRating}
            seriesRank={seriesRank.data}
            ratingsCount={ratingsCount.data ?? 0}
            followersCount={followersCount.data ?? 0}
            uniqueChapterCount={uniqueChapterCount}
          />
        </div>

        {/* Chapters + Recommendations */}
        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_340px]">
          {/* Chapter list — owns ALL chapter interaction state */}
          <ChapterList
            slug={slug}
            seriesId={s.id}
            seriesStatus={s.status}
            initialChaptersData={initialChaptersData}
          />

          {/* Recommendations sidebar (memoized) */}
          <RecommendationsSidebar currentSeriesId={s.id} genres={s.series_genres as any[]} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecommendationsSidebar — memoized sidebar carousel                */
/* ------------------------------------------------------------------ */

const RecommendationsSidebar = React.memo(function RecommendationsSidebar({
  currentSeriesId,
  genres,
}: {
  currentSeriesId: string;
  genres: any[];
}) {
  const genreSlugs = genres?.map((sg) => sg.genre?.slug).filter(Boolean) || [];
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  const recommendations = useQuery({
    queryKey: ["recommendations", currentSeriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,series_genres(genre:genres(slug))")
        .neq("id", currentSeriesId)
        .order("rating_average", { ascending: false })
        .limit(50);

      if (error) throw error;

      const scored = (data || []).map((title: any) => {
        const titleGenres = title.series_genres?.map((sg: any) => sg.genre?.slug).filter(Boolean) || [];
        const commonGenres = titleGenres.filter((g: string) => genreSlugs.includes(g));
        return { ...title, score: commonGenres.length };
      });

      return scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || (b.rating_average || 0) - (a.rating_average || 0))
        .slice(0, 12);
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  return (
    <aside className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recommendations</h2>
        {(recommendations.data?.length ?? 0) > 0 && (
          <div className="hidden gap-1 md:flex">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {recommendations.isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} shrink-0`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
            </div>
          ))}
        </div>
      ) : !recommendations.data || recommendations.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No similar titles found.</p>
      ) : (
        <div
          ref={scrollRef}
          {...dragHandlers}
          className={DRAG_SCROLL_CONTAINER_CLASS}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recommendations.data.map((title: any) => (
            <Link
              key={title.id}
              href={`/title/${title.slug}`}
              className={`group ${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg`}
              draggable={false}
            >
              <div className={TITLE_COVER_CLASS}>
                {title.cover_url ? (
                  <Image
                    src={title.cover_url}
                    alt={title.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 150px, (max-width: 768px) 180px, 220px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
                {title.rating_average && Number(title.rating_average) > 0 ? (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
                    <Star className="h-3 w-3 fill-violet-500 text-violet-500" />
                    {Number(title.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-2 text-xs font-semibold leading-tight group-hover:text-violet-400">
                  {title.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function splitNames(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
