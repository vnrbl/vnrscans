"use client";

import React from "react";
import Link from "next/link";
import { Star, BookOpen, Trophy, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LiveSeriesEditor } from "@/components/admin/LiveSeriesEditor";
import { FormattedText } from "@/components/FormattedText";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatAppDate } from "@/lib/date";

/* ------------------------------------------------------------------ */
/*  SeriesHeader — static metadata that never re-renders on           */
/*  chapter pagination, search, or sort changes.                      */
/* ------------------------------------------------------------------ */

interface SeriesHeaderProps {
  series: any;
  slug: string;
  genres: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string; color: string; icon: string }>;
  authors: string[];
  artists: string[];
  contentRating: string | undefined;
  seriesRank: number | null | undefined;
  ratingsCount: number;
  followersCount: number;
  uniqueChapterCount: number;
  totalLikesCount?: number;
}

export const SeriesHeader = React.memo(function SeriesHeader({
  series: s,
  slug,
  genres,
  tags,
  authors,
  artists,
  contentRating,
  seriesRank,
  ratingsCount,
  followersCount,
  uniqueChapterCount,
  totalLikesCount = 0,
}: SeriesHeaderProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isFavorited = useQuery({
    queryKey: ["is-favorited", s.id, user?.id],
    queryFn: async () => {
      if (!user) {
        try {
          const favs = JSON.parse(localStorage.getItem("vnr_favorites") || "[]");
          return favs.includes(s.id);
        } catch {
          return false;
        }
      }
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_id", s.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    staleTime: 1000 * 30,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) {
        try {
          const favs: string[] = JSON.parse(localStorage.getItem("vnr_favorites") || "[]");
          const already = favs.includes(s.id);
          const next = already ? favs.filter((id) => id !== s.id) : [...favs, s.id];
          localStorage.setItem("vnr_favorites", JSON.stringify(next));
          return { favorited: !already };
        } catch {
          throw new Error("Could not update favorites");
        }
      }

      if (isFavorited.data) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("series_id", s.id);
        if (error) throw error;
        return { favorited: false };
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            series_id: s.id,
          });
        if (error) throw error;
        return { favorited: true };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["is-favorited", s.id] });
      qc.invalidateQueries({ queryKey: ["library", "favorites"] });
      qc.invalidateQueries({ queryKey: ["library", "all"] });
      if (res?.favorited) {
        toast.success("Added to Favorites ❤️");
      } else {
        toast.info("Removed from Favorites");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const CORE_GENRES_SET = React.useMemo(
    () =>
      new Set([
        "action", "adventure", "boys love", "comedy", "crime", "cyberpunk", "drama", 
        "ecchi", "erotica", "fantasy", "girls love", "harem", "historical", "horror", 
        "isekai", "josei", "martial arts", "mecha", "medical", "mystery", "psychological", 
        "reincarnation", "romance", "sci-fi", "seinen", "shoujo", "shounen", "slice of life", 
        "sports", "supernatural", "thriller", "wuxia", "xianxia", "xuanhuan", "yaoi", "yuri",
        "monsters", "magic", "cultivation", "webtoon", "manhwa", "manhua", "manga"
      ]),
    []
  );

  const { coreGenres, tropeTags } = React.useMemo(() => {
    const allMap = new Map<string, any>();
    const safeList = [...(genres || []), ...(tags || [])];
    safeList.forEach((item) => {
      if (item && item.name && (item.slug || item.id)) {
        allMap.set(item.slug || item.id, item);
      }
    });
    const all = Array.from(allMap.values());
    const core = all.filter((item) => item?.name && CORE_GENRES_SET.has(String(item.name).toLowerCase().trim()));
    const tropes = all.filter((item) => item?.name && !CORE_GENRES_SET.has(String(item.name).toLowerCase().trim()));
    return { coreGenres: core, tropeTags: tropes };
  }, [genres, tags, CORE_GENRES_SET]);

  return (
    <main className="min-w-0 flex-1 text-center sm:text-left">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans font-medium text-neutral-400 sm:justify-start">
          <Link href="/home" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-neutral-600 font-light">/</span>
          <Link href={`/browse?type=${s.type}`} className="hover:text-purple-300 text-neutral-300 capitalize transition-colors font-semibold">
            {s.type}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite.mutate()}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold border transition-all duration-200 cursor-pointer shadow-sm ${
              isFavorited.data
                ? "border-rose-500/50 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                : "border-white/10 bg-neutral-900/70 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30"
            }`}
            title={isFavorited.data ? "Favorited" : "Mark as Favorite"}
          >
            <Heart className={`h-3.5 w-3.5 transition-transform duration-200 ${isFavorited.data ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            <span>{isFavorited.data ? "Favorited" : "Favorite"}</span>
          </button>
          <LiveSeriesEditor series={s} slug={slug} />
        </div>
      </div>

      <div className="mb-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
        <span className="rounded-full uppercase text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 bg-purple-950/50 text-purple-300 border border-purple-500/30">
          {s.type}
        </span>
        {contentRating && (
          <span
            className={`rounded-full uppercase text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 border ${
              contentRating === "safe"
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                : contentRating === "suggestive"
                  ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                  : "bg-red-950/40 text-red-400 border-red-500/30"
            }`}
          >
            {contentRating}
          </span>
        )}
        {s.release_year && (
          <span className="rounded-full text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 border border-white/10 bg-white/5 text-neutral-400">
            {s.release_year}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full capitalize text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 border border-white/10 bg-white/5 text-neutral-300">
          {s.status === "ongoing" && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          {statusLabel(s.status)}
        </span>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-white uppercase font-heading sm:text-3xl md:text-4xl lg:text-[2.6rem] lg:leading-[1.1]">
        {s.title}
      </h1>

      {s.alternative_titles && (
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-400 font-sans font-normal">{s.alternative_titles}</p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:justify-start font-sans">
        {seriesRank && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-xs font-mono font-bold text-amber-300 shadow-sm shadow-amber-500/5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>#{seriesRank.toLocaleString()}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-neutral-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-mono font-bold text-white">
            {Number(s.rating_average || 0).toFixed(1)}
          </span>
          <span className="text-[11px] text-neutral-500 font-sans">({ratingsCount?.toLocaleString() ?? 0})</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-neutral-400">
          <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
          <span className="font-mono font-bold text-pink-400">
            {(totalLikesCount ?? 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 font-sans">likes</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-neutral-400">
          <Users className="h-3.5 w-3.5 text-neutral-400" />
          <span className="font-mono font-bold text-white">
            {followersCount?.toLocaleString() ?? 0}
          </span>
          <span className="text-[11px] text-neutral-500 font-sans">followers</span>
        </span>
        <span className="text-neutral-400 font-sans">
          <span className="font-mono font-bold text-white">{Number(s.view_count || 0).toLocaleString()}</span>
          <span className="text-[11px] text-neutral-500 ml-1">views</span>
        </span>
      </div>

      {s.description && (
        <div className="mt-4 max-w-3xl">
          <ExpandableSynopsis text={s.description} />
        </div>
      )}

      {coreGenres.length > 0 && (
        <MetaSection label="Genres">
          <LimitedGenrePills genres={coreGenres} />
        </MetaSection>
      )}

      {tropeTags.length > 0 && (
        <MetaSection label="Tags">
          <LimitedTagPills tags={tropeTags} />
        </MetaSection>
      )}

      {authors.length > 0 && (
        <MetaSection label="Authors">
          {authors.map((name) => (
            <MetaPill key={name}>{name}</MetaPill>
          ))}
        </MetaSection>
      )}

      {artists.length > 0 && (
        <MetaSection label="Artists">
          {artists.map((name) => (
            <MetaPill key={name}>{name}</MetaPill>
          ))}
        </MetaSection>
      )}

      <MetaSection label="Details">
        <MetaPill>Updated {formatAppDate(s.updated_at)}</MetaPill>
        {uniqueChapterCount > 0 && (
          <button
            onClick={() => {
              const chaptersSection = document.getElementById('chapters-section');
              chaptersSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-xs font-mono font-bold text-purple-300 transition-colors hover:bg-purple-900/60 hover:text-white cursor-pointer"
          >
            {uniqueChapterCount} chapters
          </button>
        )}
        <MetaPill className="capitalize">{s.type}</MetaPill>
      </MetaSection>
    </main>
  );
});

/* ------------------------------------------------------------------ */
/*  Small helper sub-components (inlined to avoid import overhead)     */
/* ------------------------------------------------------------------ */

function MetaSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">{label}</h3>
      <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">{children}</div>
    </div>
  );
}

function MetaPill({
  children,
  href,
  search,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  search?: Record<string, string>;
  className?: string;
}) {
  const pillClass = `inline-flex items-center rounded-md border border-white/[0.08] bg-neutral-900/80 px-2.5 py-0.5 text-xs font-medium text-neutral-300 font-sans transition-colors hover:border-purple-500/40 hover:text-white ${className}`;

  if (href) {
    const searchStr = search ? new URLSearchParams(search).toString() : "";
    const fullHref = searchStr ? `${href}?${searchStr}` : href;
    return (
      <Link href={fullHref} className={pillClass}>
        {children}
      </Link>
    );
  }

  return <span className={pillClass}>{children}</span>;
}

function LimitedGenrePills({
  genres,
}: {
  genres: Array<{ id: string; name: string; slug: string }>;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const mobileGenres = showAll ? genres : genres.slice(0, 10);
  const desktopGenres = showAll ? genres : genres.slice(0, 20);

  return (
    <>
      <span className="contents md:hidden">
        {mobileGenres.map((genre) => (
          <MetaPill key={genre.id} href="/browse" search={{ genre: genre.slug }}>
            {genre.name}
          </MetaPill>
        ))}
      </span>

      <span className="hidden md:contents">
        {desktopGenres.map((genre) => (
          <MetaPill key={genre.id} href="/browse" search={{ genre: genre.slug }}>
            {genre.name}
          </MetaPill>
        ))}
      </span>

      {!showAll && genres.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-950/30 px-2.5 py-0.5 text-xs font-mono font-medium text-purple-300 transition-colors hover:bg-purple-900/50 hover:text-white md:hidden cursor-pointer"
        >
          +{genres.length - 10} more
        </button>
      )}

      {!showAll && genres.length > 20 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="hidden items-center rounded-md border border-purple-500/30 bg-purple-950/30 px-2.5 py-0.5 text-xs font-mono font-medium text-purple-300 transition-colors hover:bg-purple-900/50 hover:text-white md:inline-flex cursor-pointer"
        >
          +{genres.length - 20} more
        </button>
      )}

      {showAll && genres.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="inline-flex items-center rounded-md border border-white/10 bg-neutral-900/80 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-400 transition-colors hover:text-white cursor-pointer"
        >
          Show less
        </button>
      )}
    </>
  );
}

function LimitedTagPills({
  tags,
}: {
  tags: Array<{ id?: string; name: string; slug: string; color?: string; icon?: string }>;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const mobileTags = showAll ? tags : tags.slice(0, 10);
  const desktopTags = showAll ? tags : tags.slice(0, 20);

  return (
    <>
      <span className="contents md:hidden">
        {mobileTags.map((tag) => (
          <MetaPill key={tag.id || tag.slug} href="/browse" search={{ genre: tag.slug }}>
            {tag.icon && <span className="mr-1">{tag.icon}</span>}
            {tag.name}
          </MetaPill>
        ))}
      </span>

      <span className="hidden md:contents">
        {desktopTags.map((tag) => (
          <MetaPill key={tag.id || tag.slug} href="/browse" search={{ genre: tag.slug }}>
            {tag.icon && <span className="mr-1">{tag.icon}</span>}
            {tag.name}
          </MetaPill>
        ))}
      </span>

      {!showAll && tags.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-950/30 px-2.5 py-0.5 text-xs font-mono font-medium text-purple-300 transition-colors hover:bg-purple-900/50 hover:text-white md:hidden cursor-pointer"
        >
          +{tags.length - 10} more
        </button>
      )}

      {!showAll && tags.length > 20 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="hidden items-center rounded-md border border-purple-500/30 bg-purple-950/30 px-2.5 py-0.5 text-xs font-mono font-medium text-purple-300 transition-colors hover:bg-purple-900/50 hover:text-white md:inline-flex cursor-pointer"
        >
          +{tags.length - 20} more
        </button>
      )}

      {showAll && tags.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="inline-flex items-center rounded-md border border-white/10 bg-neutral-900/80 px-2.5 py-0.5 text-xs font-mono font-medium text-neutral-400 transition-colors hover:text-white cursor-pointer"
        >
          Show less
        </button>
      )}
    </>
  );
}

function ExpandableSynopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;

  const displayText = React.useMemo(() => {
    if (expanded || !isLong) return text;
    let cut = text.slice(0, 320);

    // If truncation cuts inside an open markdown link [label](url), slice before the link starts
    const lastOpenBracket = cut.lastIndexOf("[");
    const lastCloseParen = cut.lastIndexOf(")");
    if (lastOpenBracket > lastCloseParen) {
      cut = cut.slice(0, lastOpenBracket);
    }

    // If truncation cuts inside a plain URL, slice before the URL starts
    const lastHttp = cut.lastIndexOf("http://");
    const lastHttps = cut.lastIndexOf("https://");
    const maxUrlStart = Math.max(lastHttp, lastHttps);
    if (maxUrlStart !== -1 && !/\s/.test(cut.slice(maxUrlStart))) {
      cut = cut.slice(0, maxUrlStart);
    }

    return cut.trimEnd() + "…";
  }, [text, expanded, isLong]);

  return (
    <div className="text-[13px] sm:text-sm leading-relaxed text-neutral-300 font-sans">
      <FormattedText text={displayText} />
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1.5 inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
        >
          [{expanded ? "less" : "more"}]
        </button>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "Releasing";
    case "completed":
      return "Completed";
    case "hiatus":
      return "Hiatus";
    default:
      return status;
  }
}
