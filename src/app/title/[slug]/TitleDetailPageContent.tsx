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

function SideWidgets({
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
      {/* Feature 1: Share Series Feature */}
      <ShareWidget />

      {/* Feature 2: Personal Reading Progress & XP Tracker */}
      <ReadingProgressWidget seriesId={seriesId} totalChapters={totalChapters} />

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
  const lastReadChapter = dbLastRead || localLastRead;
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
      {/* Feature 1: Share Series Feature */}
      <ShareWidget />

      {/* Feature 2: Personal Reading Progress & XP Tracker */}
      <ReadingProgressWidget seriesId={seriesId} totalChapters={totalChapters} />

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
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Share2 className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-tight">Share Series</h3>
          <p className="text-[11px] text-muted-foreground truncate">Share with friends & community</p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleShare}
        className="w-full mt-3 gap-2 font-semibold text-xs h-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share Link
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
                      draggable={false}
                    />
                  )
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
