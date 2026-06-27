"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bell, 
  Trophy, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Sparkles,
  Award,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

        {/* Main layout grid: Chapters on Left, New Side Panel on Right */}
        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_340px]">
          {/* Chapter list — owns ALL chapter interaction state */}
          <ChapterList
            slug={slug}
            seriesId={s.id}
            seriesStatus={s.status}
            initialChaptersData={initialChaptersData}
          />

          {/* New Side Panel containing 3 features */}
          <TitleSidePanel
            seriesId={s.id}
            seriesStatus={s.status}
            totalChapters={uniqueChapterCount || (initialChaptersData?.length ?? 0)}
          />
        </div>

        {/* Recommendations Section — Moved below chapters, full width */}
        <div className="mt-14 pt-10 border-t border-border/40">
          <RecommendationsSection currentSeriesId={s.id} genres={s.series_genres as any[]} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TitleSidePanel — 3 New Features for Side Panel                     */
/* ------------------------------------------------------------------ */

const TitleSidePanel = React.memo(function TitleSidePanel({
  seriesId,
  seriesStatus,
  totalChapters,
}: {
  seriesId: string;
  seriesStatus?: string | null;
  totalChapters: number;
}) {
  return (
    <aside className="space-y-6 min-w-0">
      {/* Feature 1: Release Schedule & Countdown Timer */}
      <ReleaseCountdownWidget seriesStatus={seriesStatus} />

      {/* Feature 2: Personal Reading Progress & XP Tracker */}
      <ReadingProgressWidget seriesId={seriesId} totalChapters={totalChapters} />

      {/* Feature 3: Series Top Readers & Supporters */}
      <SeriesLeaderboardWidget seriesId={seriesId} />
    </aside>
  );
});

/* ------------------------------------------------------------------ */
/*  Feature 1: Release Schedule & Countdown Widget                    */
/* ------------------------------------------------------------------ */

function ReleaseCountdownWidget({ seriesId, seriesStatus }: { seriesId: string; seriesStatus?: string | null }) {
  const [notified, setNotified] = React.useState(false);
  const isOngoing = seriesStatus === "ongoing";

  const latestChapterQ = useQuery({
    queryKey: ["latest-chapter-release", seriesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chapters")
        .select("created_at, scheduled_at, chapter_number")
        .eq("series_id", seriesId)
        .order("chapter_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const expectedDateText = React.useMemo(() => {
    if (!isOngoing) return "Series Completed";
    const ch = latestChapterQ.data;
    if (ch?.scheduled_at) {
      const date = new Date(ch.scheduled_at);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (ch?.created_at) {
      const lastDate = new Date(ch.created_at);
      const nextDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (nextDate < now) {
        nextDate.setDate(now.getDate() + 3);
      }
      return nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    const defaultNext = new Date();
    defaultNext.setDate(defaultNext.getDate() + 4);
    return defaultNext.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [latestChapterQ.data, isOngoing]);

  const handleNotifyToggle = () => {
    setNotified(!notified);
    if (!notified) {
      toast.success("Release notifications enabled for this series!");
    } else {
      toast.info("Release notifications muted.");
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Release Schedule</h3>
            <p className="text-[11px] text-muted-foreground">
              {isOngoing ? "Weekly Updates" : "Status: " + (seriesStatus || "Completed")}
            </p>
          </div>
        </div>
        {isOngoing && (
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] uppercase tracking-wider font-semibold animate-pulse">
            Ongoing
          </Badge>
        )}
      </div>

      <div className="rounded-lg bg-muted/40 p-3 text-center border border-border/40">
        {isOngoing ? (
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Expected Date</span>
            <div className="mt-1 font-mono text-base font-black tracking-tight text-primary flex items-center justify-center gap-1.5">
              <Zap className="h-4 w-4 fill-primary text-primary" />
              <span>{expectedDateText}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Est. Frequency: Weekly</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>All chapters available to read</span>
          </div>
        )}
      </div>

      <Button
        variant={notified ? "secondary" : "outline"}
        size="sm"
        className="w-full mt-3 gap-2 text-xs font-semibold h-9"
        onClick={handleNotifyToggle}
      >
        <Bell className={`h-3.5 w-3.5 ${notified ? "fill-primary text-primary" : ""}`} />
        {notified ? "Notifications Enabled" : "Notify Me On Release"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature 2: Personal Reading Progress & XP Tracker                 */
/* ------------------------------------------------------------------ */

function ReadingProgressWidget({
  seriesId,
  totalChapters,
}: {
  seriesId: string;
  totalChapters: number;
}) {
  const { user } = useAuth();

  const userProgress = useQuery({
    queryKey: ["user-series-progress", seriesId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, count, error } = await supabase
        .from("reading_history")
        .select("chapter_id, xp_awarded", { count: "exact" })
        .eq("user_id", user.id)
        .eq("series_id", seriesId);

      if (error) throw error;
      const readCount = count ?? (data?.length || 0);
      const xpEarned = data?.filter((d) => d.xp_awarded).length ? data.filter((d) => d.xp_awarded).length * 50 : readCount * 50;

      return { readCount, xpEarned };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const readCount = userProgress.data?.readCount ?? 0;
  const xpEarned = userProgress.data?.xpEarned ?? (readCount * 50);
  const progressPercent = totalChapters > 0 ? Math.min(100, Math.round((readCount / totalChapters) * 100)) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Reading Tracker</h3>
            <p className="text-[11px] text-muted-foreground">Your progress on this series</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono font-bold border-violet-500/30 text-violet-400">
          +{xpEarned} XP
        </Badge>
      </div>

      {!user ? (
        <div className="rounded-lg bg-muted/30 p-3 text-center border border-border/40">
          <p className="text-xs text-muted-foreground mb-2">Log in to track read chapters & earn XP!</p>
          <Button variant="secondary" size="sm" className="w-full text-xs font-semibold h-8" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-bold text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-muted/80" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>{readCount} of {totalChapters} chapters read</span>
            {progressPercent === 100 && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Sparkles className="h-3 w-3" /> Caught up!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature 3: Series Top Readers & Supporters                        */
/* ------------------------------------------------------------------ */

function SeriesLeaderboardWidget({ seriesId }: { seriesId: string }) {
  const leaderboard = useQuery({
    queryKey: ["series-leaderboard", seriesId],
    queryFn: async () => {
      // 1. Query reading_history for users reading this series
      const { data: historyData, error: historyErr } = await supabase
        .from("reading_history")
        .select("user_id")
        .eq("series_id", seriesId)
        .limit(50);

      if (historyErr) throw historyErr;

      const userIds = Array.from(new Set((historyData || []).map((h) => h.user_id)));

      if (userIds.length === 0) {
        // Fallback: fetch top profiles overall if no series specific readers exist yet
        const { data: topProfiles } = await supabase
          .from("profiles")
          .select("username, avatar_url, experience_points, user_level")
          .order("experience_points", { ascending: false })
          .limit(3);
        return topProfiles || [];
      }

      // 2. Fetch profiles for readers
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("username, avatar_url, experience_points, user_level")
        .in("user_id", userIds)
        .order("experience_points", { ascending: false })
        .limit(3);

      if (profErr) throw profErr;
      return profiles || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const topReaders = leaderboard.data || [];

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
          <Trophy className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold leading-tight">Top Supporters</h3>
          <p className="text-[11px] text-muted-foreground">Community leaders for this title</p>
        </div>
      </div>

      {leaderboard.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : topReaders.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No top readers yet.</p>
      ) : (
        <div className="space-y-2">
          {topReaders.map((reader: any, index: number) => {
            const rank = index + 1;
            return (
              <div
                key={reader.username || index}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      rank === 1
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : rank === 2
                        ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                        : "bg-amber-700/20 text-amber-600 border border-amber-700/40"
                    }`}
                  >
                    #{rank}
                  </span>
                  <Avatar className="h-6 w-6 border border-border/60 shrink-0">
                    <AvatarImage src={reader.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {(reader.username || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground truncate">{reader.username || "Anonymous"}</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-muted-foreground shrink-0 pl-2">
                  {(reader.experience_points || 0).toLocaleString()} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecommendationsSection — Memoized full-width horizontal section   */
/* ------------------------------------------------------------------ */

const RecommendationsSection = React.memo(function RecommendationsSection({
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
        .slice(0, 15);
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  return (
    <section className="min-w-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Recommendations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Similar series you might enjoy based on genres</p>
        </div>
        {(recommendations.data?.length ?? 0) > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => scrollBy("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => scrollBy("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {recommendations.isLoading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} shrink-0`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary rounded-lg`} />
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
              className={`group ${TITLE_CARD_WIDTH} shrink-0 overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1`}
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
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-0.5 text-xs font-bold backdrop-blur">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {Number(title.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-xs font-bold leading-snug group-hover:text-primary transition-colors">
                  {title.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
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
