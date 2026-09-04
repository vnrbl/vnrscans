"use client";

import React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Bell, 
  Trophy, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Sparkles,
  Award,
  Share2
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
import { ReleaseScheduleCard } from "@/components/ReleaseScheduleCard";

function SideWidgets({
  seriesId,
  seriesStatus,
  totalChapters,
  chapters,
}: {
  seriesId: string;
  seriesStatus?: string | null;
  totalChapters: number;
  chapters?: Array<{ id: string; chapter_number: number }>;
}) {
  return (
    <aside className="space-y-6 min-w-0">
      {/* Feature 1: Share Series Feature */}
      <ShareWidget />

      {/* Feature 2: Personal Reading Progress & XP Tracker */}
      <ReadingProgressWidget seriesId={seriesId} totalChapters={totalChapters} chapters={chapters} />

      {/* Feature 3: Series Top Readers & Supporters */}
      <SeriesLeaderboardWidget seriesId={seriesId} />
    </aside>
  );
}

import { SeriesHeader } from "./SeriesHeader";
import { SeriesActions } from "./SeriesActions";
import { ChapterList } from "./ChapterList";
import { SeriesReviewsSection } from "./SeriesReviewsSection";

/* ------------------------------------------------------------------ */
/*  TitleDetailPageContent — thin shell that:                         */
/*  1. Owns the top-level series query (shared across sub-components) */
/*  2. Passes stable props to memoized children                       */
/*  3. Does NOT hold chapter pagination/search/sort state             */
/* ------------------------------------------------------------------ */

const getRarityColor = (rarity: string) => {
  switch (rarity?.toLowerCase()) {
    case "common":
      return "text-slate-400";
    case "uncommon":
      return "text-emerald-400";
    case "rare":
      return "text-blue-400 font-bold";
    case "very rare":
      return "text-purple-400 font-bold";
    case "extremely rare":
      return "text-orange-400 font-extrabold";
    case "legendary":
      return "text-yellow-400 font-extrabold shadow-[0_0_8px_rgba(250,204,21,0.2)]";
    case "mythical":
      return "text-red-400 font-extrabold animate-pulse";
    case "near non-existent":
      return "text-pink-400 font-extrabold uppercase animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]";
    default:
      return "text-foreground";
  }
};

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
  const [showRealms, setShowRealms] = React.useState(false);
  const [realmsTab, setRealmsTab] = React.useState("standard");

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

  const totalLikesCount = useQuery({
    queryKey: ["series-total-likes", seriesQ.data?.id],
    queryFn: async () => {
      if (!seriesQ.data?.id) return 0;
      const { data: chapters, error: chErr } = await supabase
        .from("chapters")
        .select("id")
        .eq("series_id", seriesQ.data.id);
      if (chErr || !chapters || chapters.length === 0) return 0;

      const chapterIds = chapters.map((c) => c.id);
      const { count, error } = await supabase
        .from("chapter_reactions")
        .select("*", { count: "exact", head: true })
        .in("chapter_id", chapterIds)
        .eq("reaction_type", "heart");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data?.id,
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

  const [localLastRead, setLocalLastRead] = React.useState<{ slug: string; chapter_number: number } | null>(null);

  React.useEffect(() => {
    try {
      const modern = localStorage.getItem(`vnr-last-read-${slug}`);
      if (modern) {
        const parsed = JSON.parse(modern);
        if (parsed?.slug) {
          setLocalLastRead(parsed);
          return;
        }
      }
      const legacy = localStorage.getItem(`last-read-${slug}`);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed?.slug) {
          setLocalLastRead(parsed);
        }
      }
    } catch {}
  }, [slug]);

  // Compute read button props
  const dbLastRead = readingHistory.data?.chapters as
    | { slug: string; chapter_number: number }
    | null
    | undefined;
  const rawLastRead = dbLastRead || localLastRead;

  // Resolve matching chapter from initialChaptersData if possible to guarantee canonical slug
  const matchedChapter = rawLastRead
    ? initialChaptersData?.find(
        (c) =>
          c.slug === rawLastRead.slug ||
          c.chapter_number === rawLastRead.chapter_number ||
          c.slug === `chapter-${rawLastRead.chapter_number}`
      )
    : null;

  const lastReadChapter = matchedChapter
    ? { slug: matchedChapter.slug, chapter_number: matchedChapter.chapter_number }
    : rawLastRead;

  const firstChapter = initialChaptersData?.[initialChaptersData.length - 1];
  const isContinue = !!lastReadChapter;
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
          {s.cover_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
            <video
              src={s.cover_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-[0.22] saturate-[1.1]"
            />
          ) : (
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
          )}
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
            totalLikesCount={totalLikesCount.data ?? 0}
          />
        </div>

        {/* Main layout grid: Chapters on Left, New Side Panel on Right */}
        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_340px]">
          {/* Chapter list & Release Schedule */}
          <div className="space-y-6 min-w-0">
            <ReleaseScheduleCard
              chapters={initialChaptersData || []}
              status={s.status}
              seriesTitle={s.title}
              seriesSlug={slug}
              estimatedNextReleaseAt={(s as any).estimated_next_release_at}
              releaseCadence={(s as any).release_cadence}
            />
            <ChapterList
              slug={slug}
              seriesId={s.id}
              seriesTitle={s.title}
              seriesCoverUrl={s.cover_url}
              seriesStatus={s.status}
              initialChaptersData={initialChaptersData}
            />
          </div>

          {/* Side panel */}
          <SideWidgets
            seriesId={s.id}
            seriesStatus={s.status}
            totalChapters={uniqueChapterCount || (initialChaptersData?.length ?? 0)}
            chapters={initialChaptersData || []}
          />
        </div>



        {/* Cultivation Realms Section (Taboo only) */}
        {slug === "taboo-son-of-the-lonely-frost-sovereign" && (
          <div className="mt-10 pt-10 border-t border-border/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Flame className="h-6 w-6 text-primary" /> Cultivation Archives: World Realms Database
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRealms(!showRealms)}
                className="gap-2 font-bold text-xs border-primary/30 hover:border-primary/60 text-primary hover:bg-primary/10 cursor-pointer shadow-sm"
              >
                {showRealms ? "Hide Realms Database" : "Decrypt Realms Database"}
                {showRealms ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {showRealms && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-5 rounded-xl border border-border/50 bg-card/25 backdrop-blur-sm shadow-sm">
                  
                  {/* Tab Selector */}
                  <div className="flex gap-2 mb-4 border-b border-border/20 pb-3">
                    <button
                      onClick={() => setRealmsTab("standard")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        realmsTab === "standard"
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(127,34,254,0.15)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/30 border border-transparent"
                      }`}
                    >
                      Standard Cultivation Realms
                    </button>
                    <button
                      onClick={() => setRealmsTab("devourer")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        realmsTab === "devourer"
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(127,34,254,0.15)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/30 border border-transparent"
                      }`}
                    >
                      Xue Chen's Abyssal Void Devourer Path
                    </button>
                  </div>

                  {realmsTab === "standard" ? (
                    <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#0c0f17] z-10 shadow-sm border-b border-border/30">
                          <tr className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
                            <th className="py-2.5 px-3 w-[5%] pb-3">#</th>
                            <th className="py-2.5 px-3 w-[22%] pb-3">Realm Name</th>
                            <th className="py-2.5 px-3 w-[15%] pb-3">Stages</th>
                            <th className="py-2.5 px-3 w-[18%] pb-3">Lifespan</th>
                            <th className="py-2.5 px-3 w-[22%] pb-3">Power Description</th>
                            <th className="py-2.5 px-3 w-[18%] pb-3">Advancement Requirements</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10 text-muted-foreground">
                          {[
  {
    "num": 1,
    "name": "Mortal Breath Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "120–150 years",
    "desc": "Basic qi absorption and body strengthening",
    "reqs": "Absorb spiritual energy from the world and open all major meridians"
  },
  {
    "num": 2,
    "name": "Spirit Foundation Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "250–400 years",
    "desc": "Build spiritual foundation, short flight",
    "reqs": "Compress and solidify qi foundation, survive minor qi deviation"
  },
  {
    "num": 3,
    "name": "Golden Core Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "600–900 years",
    "desc": "Form Golden Core, release powerful attacks",
    "reqs": "Compress all qi into a solid Golden Core and survive Core Formation Tribulation"
  },
  {
    "num": 4,
    "name": "Nascent Soul Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "1,200–2,000 years",
    "desc": "Nascent Soul can leave body, possession",
    "reqs": "Form Nascent Soul inside the core and survive Nascent Soul Tribulation"
  },
  {
    "num": 5,
    "name": "Soul Metamorphosis Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "2,500–4,000 years",
    "desc": "Soul evolution, elemental control",
    "reqs": "Evolve and strengthen the soul, comprehend elemental laws"
  },
  {
    "num": 6,
    "name": "Void Refinement Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "5,000–8,000 years",
    "desc": "Touch space and void laws",
    "reqs": "Begin refining the void inside the body and comprehend space laws"
  },
  {
    "num": 7,
    "name": "Dao Fusion Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "10,000–18,000 years",
    "desc": "Merge personal Dao with the world",
    "reqs": "Fully merge personal Dao with heaven and earth, create a personal domain"
  },
  {
    "num": 8,
    "name": "Heavenly Tribulation Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "25,000–40,000 years",
    "desc": "Survive major heavenly tribulations",
    "reqs": "Comprehend deeper Dao and survive a major Heavenly Tribulation"
  },
  {
    "num": 9,
    "name": "True Immortal Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "60,000–100,000 years",
    "desc": "Become a True Immortal",
    "reqs": "Officially transcend mortality, body and soul reach immortal level"
  },
  {
    "num": 10,
    "name": "Golden Immortal Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "200,000+ years",
    "desc": "Indestructible golden immortal body",
    "reqs": "Refine the entire body into an indestructible Golden Immortal body"
  },
  {
    "num": 11,
    "name": "Mystic World Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "500,000+ years",
    "desc": "Create small personal world inside body",
    "reqs": "Create a stable small world inside the body using personal Dao"
  },
  {
    "num": 12,
    "name": "Celestial Law Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "1.2 Million+ years",
    "desc": "Influence heavenly laws",
    "reqs": "Begin influencing and slightly altering heavenly laws"
  },
  {
    "num": 13,
    "name": "Divine King Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "4 Million+ years",
    "desc": "Ruler-level power",
    "reqs": "Gather territory or faith and establish rule over a region or small planet"
  },
  {
    "num": 14,
    "name": "Divine Emperor Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "12 Million+ years",
    "desc": "Rule over multiple planets",
    "reqs": "Expand rule over multiple planets or large territories"
  },
  {
    "num": 15,
    "name": "Heavenly Sovereign Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "40 Million+ years",
    "desc": "Sovereign of major forces",
    "reqs": "Become a recognized sovereign of a major sect, force, or planet"
  },
  {
    "num": 16,
    "name": "Eternal Sovereign Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "120 Million+ years",
    "desc": "Near-indestructible, planet-destroying power",
    "reqs": "Reach near-indestructible level through extreme Dao comprehension"
  },
  {
    "num": 17,
    "name": "Abyssal Void Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "350 Million+ years",
    "desc": "Touch true Void laws",
    "reqs": "Begin comprehending and touching true Void laws"
  },
  {
    "num": 18,
    "name": "Taboo Breaker Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "700 Million+ years",
    "desc": "Break heavenly laws and taboos",
    "reqs": "Deliberately break a major heavenly taboo and survive the consequences"
  },
  {
    "num": 19,
    "name": "Origin Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "1.5 Billion+ years",
    "desc": "Devour and understand origin-level concepts",
    "reqs": "Devour and fully comprehend an origin-level concept or law"
  },
  {
    "num": 20,
    "name": "Supreme Dao Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "Near Immortality",
    "desc": "Peak of known cultivation",
    "reqs": "Stand at the absolute peak of known Dao and create/destroy small worlds"
  },
  {
    "num": 21,
    "name": "Chaos Origin Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "3 Billion+ years",
    "desc": "Understand primal chaos",
    "reqs": "Comprehend and stabilize primal chaos energy inside the body"
  },
  {
    "num": 22,
    "name": "Void Transcendent Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "8 Billion+ years",
    "desc": "Freely travel between realms",
    "reqs": "Open stable void rifts and travel between different realms/planets"
  },
  {
    "num": 23,
    "name": "Heaven Defying Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "20 Billion+ years",
    "desc": "Defy heavenly will",
    "reqs": "Successfully defy and resist heavenly will multiple times"
  },
  {
    "num": 24,
    "name": "Primordial Taboo Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "50 Billion+ years",
    "desc": "Cultivate forbidden primordial powers",
    "reqs": "Cultivate and survive using primordial forbidden powers"
  },
  {
    "num": 25,
    "name": "Supreme Origin Realm",
    "stages": "Early / Mid / Late / Peak",
    "lifespan": "Near True Immortality",
    "desc": "Absolute peak of existence",
    "reqs": "Reach the absolute peak where one can create, destroy, and rewrite world laws"
  }
].map((row) => (
                            <tr key={row.num} className="hover:bg-card/10 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[10px] text-primary">{row.num}</td>
                              <td className="py-2.5 px-3 font-bold text-foreground">{row.name}</td>
                              <td className="py-2.5 px-3 text-[11px] font-medium">{row.stages}</td>
                              <td className="py-2.5 px-3 text-[11px] font-mono text-purple-400 font-semibold">{row.lifespan}</td>
                              <td className="py-2.5 px-3 text-foreground/80">{row.desc}</td>
                              <td className="py-2.5 px-3 text-[11px] italic text-muted-foreground/90">{row.reqs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#0c0f17] z-10 shadow-sm border-b border-border/30">
                          <tr className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">
                            <th className="py-2.5 px-3 w-[4%] pb-3">#</th>
                            <th className="py-2.5 px-3 w-[15%] pb-3">Devourer Realm</th>
                            <th className="py-2.5 px-3 w-[10%] pb-3">Stages</th>
                            <th className="py-2.5 px-3 w-[14%] pb-3">Combat Equivalent</th>
                            <th className="py-2.5 px-3 w-[12%] pb-3">Rarity / Difficulty</th>
                            <th className="py-2.5 px-3 w-[12%] pb-3">Lifespan</th>
                            <th className="py-2.5 px-3 w-[18%] pb-3">Unique Abilities</th>
                            <th className="py-2.5 px-3 w-[15%] pb-3">Advancement Requirements</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10 text-muted-foreground">
                          {[
  {
    "num": 1,
    "name": "Void Embryo Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Golden Core Realm",
    "rarity": "Common",
    "lifespan": "300–500 years",
    "desc": "Abyssal Void Eye (basic analysis), see emotions, weaknesses, and energy flow",
    "reqs": "Devour and refine 10+ Golden Core level cultivators"
  },
  {
    "num": 2,
    "name": "Devouring Core Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Nascent Soul Realm",
    "rarity": "Common",
    "lifespan": "800–1,200 years",
    "desc": "Devour cultivation bases, steal partial techniques",
    "reqs": "Devour and refine 1 Nascent Soul level being"
  },
  {
    "num": 3,
    "name": "Abyssal Nascent Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Soul Metamorphosis Realm",
    "rarity": "Uncommon",
    "lifespan": "2,000–3,500 years",
    "desc": "Devour souls & memories, create small void zones",
    "reqs": "Devour and absorb the soul of a Soul Metamorphosis expert"
  },
  {
    "num": 4,
    "name": "Void Refiner Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Void Refinement Realm",
    "rarity": "Uncommon",
    "lifespan": "6,000–10,000 years",
    "desc": "Permanently refine stolen power into his own",
    "reqs": "Refine power from multiple high-level experts without backlash"
  },
  {
    "num": 5,
    "name": "Soul Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Dao Fusion Realm",
    "rarity": "Rare",
    "lifespan": "15,000–25,000 years",
    "desc": "Fully use enemy techniques as his own",
    "reqs": "Devour and perfectly replicate one complete high-level technique"
  },
  {
    "num": 6,
    "name": "Abyssal Sovereign Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "True Immortal Realm",
    "rarity": "Rare",
    "lifespan": "50,000–80,000 years",
    "desc": "Create personal Abyssal Domain that weakens enemies",
    "reqs": "Devour enough life force to stabilize a personal domain"
  },
  {
    "num": 7,
    "name": "Taboo Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Golden Immortal Realm",
    "rarity": "Very Rare",
    "lifespan": "150,000–250,000 years",
    "desc": "Partially ignore or devour heavenly tribulations",
    "reqs": "Survive and devour the energy of a Heavenly Tribulation"
  },
  {
    "num": 8,
    "name": "Eternal Void Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Mystic World Realm",
    "rarity": "Very Rare",
    "lifespan": "500,000–800,000 years",
    "desc": "Body becomes semi-void, extremely difficult to kill",
    "reqs": "Transform a large portion of his body into void"
  },
  {
    "num": 9,
    "name": "Origin Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Divine Emperor Realm",
    "rarity": "Extremely Rare",
    "lifespan": "2 Million+ years",
    "desc": "Devour abstract concepts (fear, pain, killing intent, life force)",
    "reqs": "Successfully devour and digest one conceptual law"
  },
  {
    "num": 10,
    "name": "Supreme Abyssal Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Heavenly Sovereign Realm",
    "rarity": "Extremely Rare",
    "lifespan": "8 Million+ years",
    "desc": "Create large-scale devouring fields affecting multiple experts",
    "reqs": "Create a devouring field capable of threatening Realm 15+ experts"
  },
  {
    "num": 11,
    "name": "Chaos Void Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Eternal Sovereign Realm",
    "rarity": "Legendary",
    "lifespan": "30 Million+ years",
    "desc": "Devour chaotic/primordial energy, gain partial immunity to natural laws",
    "reqs": "Devour and stabilize chaotic or primordial energy"
  },
  {
    "num": 12,
    "name": "Void Transcendent Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Abyssal Void Realm",
    "rarity": "Legendary",
    "lifespan": "100 Million+ years",
    "desc": "Freely travel between realms and planets through stable void rifts",
    "reqs": "Open a stable cross-realm void rift and survive the journey"
  },
  {
    "num": 13,
    "name": "Heaven Defying Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Taboo Breaker Realm",
    "rarity": "Mythical",
    "lifespan": "400 Million+ years",
    "desc": "Directly weaken or partially devour Heavenly Dao tribulations",
    "reqs": "Devour and survive a direct confrontation with Heavenly Will"
  },
  {
    "num": 14,
    "name": "Primordial Devourer Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Primordial Taboo Realm",
    "rarity": "Mythical",
    "lifespan": "1.5 Billion+ years",
    "desc": "Devour and refine primordial laws and ancient forbidden powers",
    "reqs": "Devour and integrate a primordial law or ancient taboo power"
  },
  {
    "num": 15,
    "name": "Supreme Void Origin Realm",
    "stages": "Early / Mid / Late / Peak",
    "eq": "Supreme Origin Realm",
    "rarity": "Near Non-existent",
    "lifespan": "Near Immortality",
    "desc": "Devour and partially rewrite the laws of small worlds or domains",
    "reqs": "Devour and successfully rewrite part of a world's laws"
  }
].map((row) => (
                            <tr key={row.num} className="hover:bg-card/10 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[10px] text-primary">{row.num}</td>
                              <td className="py-2.5 px-3 font-bold text-foreground">{row.name}</td>
                              <td className="py-2.5 px-3 text-[11px] font-medium">{row.stages}</td>
                              <td className="py-2.5 px-3 text-[11px] font-semibold text-purple-400 font-mono">{row.eq}</td>
                              <td className={`py-2.5 px-3 text-[11px] font-semibold ${getRarityColor(row.rarity)}`}>{row.rarity}</td>
                              <td className="py-2.5 px-3 text-[11px] font-mono text-purple-400 font-semibold">{row.lifespan}</td>
                              <td className="py-2.5 px-3 text-foreground/80">{row.desc}</td>
                              <td className="py-2.5 px-3 text-[11px] italic text-muted-foreground/90">{row.reqs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* Series Comments & Community Reviews Section */}
        <SeriesReviewsSection
          seriesId={s.id}
          seriesTitle={s.title}
          slug={slug}
          currentRating={s.rating_average}
        />

        {/* Recommendations Section — 7-per-row grid matching story style, genre & plot */}
        <div className="mt-14 pt-10 border-t border-border/40">
          <RecommendationsSection currentSeries={s} />
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
  chapters,
}: {
  seriesId: string;
  seriesStatus?: string | null;
  totalChapters: number;
  chapters?: Array<{ id: string; chapter_number: number }>;
}) {
  return (
    <aside className="space-y-6 min-w-0">
      {/* Feature 1: Share Series Feature */}
      <ShareWidget />

      {/* Feature 2: Personal Reading Progress & XP Tracker */}
      <ReadingProgressWidget seriesId={seriesId} totalChapters={totalChapters} chapters={chapters} />

      {/* Feature 3: Series Top Readers & Supporters */}
      <SeriesLeaderboardWidget seriesId={seriesId} />
    </aside>
  );
});

/* ------------------------------------------------------------------ */
/*  Feature 1: Share Series Widget                                    */
/* ------------------------------------------------------------------ */

function ShareWidget() {
  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: document.title,
          url: url,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          toast.success("Link copied to clipboard!");
        });
      }
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-purple-400 shrink-0">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Share Series</h3>
          <p className="text-[10px] text-neutral-400 truncate font-sans">Share with friends & community</p>
        </div>
      </div>
      <div className="mt-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="w-full text-xs font-mono font-bold h-7.5 rounded-lg border-white/10 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
        >
          Share Link
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature 2: Reading Progress & XP Tracker Widget                    */
/* ------------------------------------------------------------------ */

function ReadingProgressWidget({
  seriesId,
  totalChapters,
  chapters,
}: {
  seriesId: string;
  totalChapters: number;
  chapters?: Array<{ id: string; chapter_number: number }>;
}) {
  const { user } = useAuth();

  const progressQ = useQuery({
    queryKey: ["reading-progress-widget", seriesId, user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();

      const { data, error } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId);

      if (error) throw error;
      return new Set<string>((data || []).map((r) => r.chapter_id));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Calculate unique chapter numbers read across all scan sources
  const readChapterNumbers = React.useMemo(() => {
    const numbers = new Set<number>();
    if (!progressQ.data || !chapters) return numbers;
    for (const ch of chapters) {
      if (progressQ.data.has(ch.id)) {
        numbers.add(Number(ch.chapter_number));
      }
    }
    return numbers;
  }, [progressQ.data, chapters]);

  const readCount = readChapterNumbers.size;
  const earnedXp = readCount * 50;
  const progressPercent = totalChapters > 0 ? Math.min(100, Math.round((readCount / totalChapters) * 100)) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 shadow-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-400">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Your Progress</h3>
            <p className="text-[10px] text-neutral-400 font-sans">{readCount} of {totalChapters} chapters read</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-purple-400 tabular-nums">{progressPercent}%</span>
      </div>

      <Progress value={progressPercent} className="h-1.5 bg-neutral-900" />

      {user ? (
        <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>Spiritual Qi</span>
          </span>
          <span className="font-mono font-bold text-white">+{earnedXp} Qi</span>
        </div>
      ) : (
        <p className="text-[10px] text-neutral-500 text-center font-sans">
          <Link href="/login" className="text-purple-400 hover:underline font-semibold">Sign in</Link> to track reading & gather Qi
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature 3: Series Leaderboard Widget (Top Cultivators)            */
/* ------------------------------------------------------------------ */

function SeriesLeaderboardWidget({ seriesId }: { seriesId: string }) {
  const leaderboardQ = useQuery({
    queryKey: ["series-top-cultivators-v2", seriesId],
    queryFn: async () => {
      try {
        // 1. Try dedicated RPC function first for high-performance DB sync
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc(
          "get_series_top_cultivators",
          { _series_id: seriesId, _limit: 5 }
        );

        if (!rpcErr && rpcData && rpcData.length > 0) {
          return rpcData.map((row: any) => ({
            userId: row.user_id,
            username: row.username,
            avatarUrl: row.avatar_url,
            avatarFrame: row.avatar_frame,
            accentColor: row.accent_color,
            userLevel: row.user_level || 1,
            seriesQiCollected: Number(row.series_qi_collected) || 0,
            chaptersRead: Number(row.chapters_read) || 0,
          }));
        }

        // 2. Resilient fallback: calculate directly from reading_history & profiles
        const { data: historyData, error: historyErr } = await supabase
          .from("reading_history")
          .select("user_id, progress, xp_awarded")
          .eq("series_id", seriesId)
          .limit(200);

        if (historyErr || !historyData || historyData.length === 0) return [];

        const userCounts = new Map<string, number>();
        historyData.forEach((row: any) => {
          if (row.user_id && (row.progress >= 70 || row.xp_awarded)) {
            userCounts.set(row.user_id, (userCounts.get(row.user_id) || 0) + 1);
          }
        });

        const userIds = Array.from(userCounts.keys()).slice(0, 15);
        if (userIds.length === 0) return [];

        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, avatar_frame, accent_color, user_level, experience_points")
          .in("user_id", userIds);

        if (profErr || !profiles) return [];

        return profiles
          .map((p: any) => {
            const chRead = userCounts.get(p.user_id) || 1;
            const qiGathered = chRead * 50;
            return {
              userId: p.user_id,
              username: p.username,
              avatarUrl: p.avatar_url,
              avatarFrame: p.avatar_frame,
              accentColor: p.accent_color,
              userLevel: p.user_level || 1,
              seriesQiCollected: qiGathered,
              chaptersRead: chRead,
            };
          })
          .sort((a, b) => b.seriesQiCollected - a.seriesQiCollected || b.chaptersRead - a.chaptersRead)
          .slice(0, 5);
      } catch (err) {
        console.warn("[LeaderboardWidget] Error:", err);
        return [];
      }
    },
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 3,
  });

  const topReaders = leaderboardQ.data || [];

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 shadow-md space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-amber-400">
          <Award className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Top Cultivators</h3>
          <p className="text-[10px] text-neutral-400 font-sans">Ranked by Spiritual Qi gathered from this series</p>
        </div>
      </div>

      {leaderboardQ.isLoading ? (
        <div className="space-y-2 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : topReaders.length === 0 ? (
        <p className="text-[11px] text-neutral-500 text-center py-2 font-sans">No cultivators recorded for this series yet.</p>
      ) : (
        <div className="space-y-1.5">
          {topReaders.map((reader: any, index: number) => {
            const isTop1 = index === 0;
            const isTop2 = index === 1;
            const isTop3 = index === 2;
            const isDaoAncestor = reader.username?.toLowerCase() === "vnr610" || reader.userLevel >= 100;

            return (
              <div
                key={reader.userId || reader.username}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  isTop1
                    ? "bg-amber-950/20 border-amber-500/30"
                    : isTop2
                    ? "bg-slate-900/40 border-slate-700/30"
                    : isTop3
                    ? "bg-amber-950/10 border-amber-800/20"
                    : "bg-black/60 border-white/5"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Rank Position */}
                  <span
                    className={`text-[10px] font-mono font-bold w-4 text-center shrink-0 ${
                      isTop1
                        ? "text-amber-400"
                        : isTop2
                        ? "text-slate-300"
                        : isTop3
                        ? "text-amber-600"
                        : "text-neutral-500"
                    }`}
                  >
                    {isTop1 ? "👑" : `#${index + 1}`}
                  </span>

                  {/* Cultivator Avatar */}
                  <Link href={`/user/${reader.username}`} className="shrink-0">
                    <Avatar className="h-6 w-6 border border-white/10 hover:border-amber-400/60 transition-colors">
                      <AvatarImage src={reader.avatarUrl} />
                      <AvatarFallback className="text-[9px] font-mono bg-neutral-900 text-neutral-300">
                        {reader.username?.slice(0, 2)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* Cultivator Info */}
                  <div className="min-w-0">
                    <Link
                      href={`/user/${reader.username}`}
                      className="text-xs font-bold text-white hover:text-amber-300 transition-colors block truncate max-w-[120px] sm:max-w-[140px]"
                    >
                      {reader.username}
                    </Link>
                    <span className="text-[9px] font-mono text-neutral-400 block truncate">
                      {isDaoAncestor ? "Lv. ∞ Dao Ancestor" : `Lv. ${reader.userLevel}`}
                    </span>
                  </div>
                </div>

                {/* Qi Collected & Chapter Count */}
                <div className="text-right shrink-0 pl-2">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-3xs text-amber-400">⚡</span>
                    <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                      {isDaoAncestor ? "∞ Qi" : `${reader.seriesQiCollected.toLocaleString()} Qi`}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 block">
                    {reader.chaptersRead} ch. read
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecommendationsSection — 7-per-row grid matching plot, style & genre */
/* ------------------------------------------------------------------ */

const STORY_PLOT_TROPES = [
  "cultivation", "murim", "martial arts", "regression", "reincarnation", "isekai",
  "transmigration", "system", "dungeon", "tower", "hunter", "gate", "level up",
  "overpowered", "magic", "academy", "necromancer", "villainess", "otome", "romance",
  "revenge", "betrayal", "monster", "apocalypse", "survival", "vr", "game", "modern",
  "historical", "royalty", "emperor", "dragon", "god", "demon", "sword", "alchemy"
];

const RecommendationsSection = React.memo(function RecommendationsSection({
  currentSeries,
}: {
  currentSeries: any;
}) {
  const currentSeriesId = currentSeries?.id;
  const currentType = currentSeries?.type;

  const currentGenres: string[] = (currentSeries?.series_genres || [])
    .map((sg: any) => sg?.genre?.slug?.toLowerCase() || sg?.genre?.name?.toLowerCase() || (typeof sg === "string" ? sg.toLowerCase() : null))
    .filter(Boolean);

  const currentTags: string[] = (currentSeries?.series_tags || [])
    .map((st: any) => st?.tag?.slug?.toLowerCase() || st?.tag?.name?.toLowerCase() || (typeof st === "string" ? st.toLowerCase() : null))
    .filter(Boolean);

  const sourceText = `${currentSeries?.title || ""} ${currentSeries?.description || ""}`.toLowerCase();
  const sourceTropes = STORY_PLOT_TROPES.filter((trope) => sourceText.includes(trope));

  const recommendations = useQuery({
    queryKey: ["recommendations-strict-grid", currentSeriesId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("series")
          .select(
            "id,slug,title,cover_url,type,description,rating_average,status,series_genres(genre:genres(name,slug)),series_tags(tag:tags(name,slug))"
          )
          .neq("id", currentSeriesId)
          .eq("is_hidden", false)
          .order("rating_average", { ascending: false })
          .limit(100);

        if (error) {
          console.warn("[Recommendations] Fetch error:", error);
          return [];
        }

        const scored = (data || []).map((candidate: any) => {
          const candGenres: string[] = (candidate?.series_genres || [])
            .map((sg: any) => sg?.genre?.slug?.toLowerCase() || sg?.genre?.name?.toLowerCase())
            .filter(Boolean);

          const candTags: string[] = (candidate?.series_tags || [])
            .map((st: any) => st?.tag?.slug?.toLowerCase() || st?.tag?.name?.toLowerCase())
            .filter(Boolean);

          const candText = `${candidate?.title || ""} ${candidate?.description || ""}`.toLowerCase();

          // 1. Common Genres overlap
          const commonGenres = candGenres.filter((g) => currentGenres.includes(g));

          // 2. Common Tags overlap
          const commonTags = candTags.filter((t) => currentTags.includes(t));

          // 3. Shared Story Tropes & Plot Style
          const sharedTropes = sourceTropes.filter((trope) => candText.includes(trope));

          // 4. Format / Type Match
          const formatMatch = candidate?.type === currentType;

          // Scoring Formula
          let score = 0;
          score += commonGenres.length * 20;
          score += commonTags.length * 25;
          score += sharedTropes.length * 20;
          if (formatMatch) score += 15;

          const totalSharedSignals = commonGenres.length + commonTags.length + sharedTropes.length;

          return {
            ...candidate,
            score,
            commonCount: totalSharedSignals,
          };
        });

        // Strict filter: Must match at least 2 story signals (genres/tags/plot tropes) AND score >= 35
        return scored
          .filter((item) => item.score >= 35 && item.commonCount >= 2)
          .sort((a, b) => b.score - a.score || Number(b.rating_average || 0) - Number(a.rating_average || 0))
          .slice(0, 14); // Exactly 14 items (2 full rows of 7 in grid)
      } catch (err) {
        console.warn("[Recommendations] Query catch:", err);
        return [];
      }
    },
    enabled: !!currentSeriesId,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Similar Series & Recommendations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Carefully matched by story style, plot tropes, themes, and genres
          </p>
        </div>
      </div>

      {recommendations.isLoading ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
      ) : !recommendations.data || recommendations.data.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-border/30 bg-card/20 text-muted-foreground text-xs">
          No matching series found with similar story style, plot tropes, and genres.
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {recommendations.data.map((title: any) => (
            <Link
              key={title.id}
              href={`/title/${title.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-secondary">
                {title.cover_url ? (
                  title.cover_url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
                    <video
                      src={title.cover_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={title.cover_url}
                      alt={title.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 150px, (max-width: 768px) 180px, 220px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-40" />
                  </div>
                )}
                {title.rating_average && Number(title.rating_average) > 0 ? (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-2xs font-bold backdrop-blur shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {Number(title.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
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
