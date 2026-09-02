"use client";

import React from "react";
import Link from "next/link";
import { Star, BookOpen, Trophy, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LiveSeriesEditor } from "@/components/admin/LiveSeriesEditor";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        <nav className="flex flex-wrap items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold sm:justify-start">
          <Link href="/home" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href={`/browse?type=${s.type}`} className="hover:text-primary transition-colors">
            {s.type}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite.mutate()}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer shadow-sm ${
              isFavorited.data
                ? "border-rose-500/50 bg-rose-950/30 text-rose-400 hover:bg-rose-950/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                : "border-border/60 bg-secondary/50 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30"
            }`}
            title={isFavorited.data ? "Favorited" : "Mark as Favorite"}
          >
            <Heart className={`h-3.5 w-3.5 transition-transform duration-200 ${isFavorited.data ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            <span>{isFavorited.data ? "Favorited" : "Favorite"}</span>
          </button>
          <LiveSeriesEditor series={s} slug={slug} />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
        <Badge variant="secondary" className="rounded-md uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5 bg-secondary/50">
          {s.type}
        </Badge>
        {contentRating && (
          <Badge
            className={`rounded-md uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5 ${
              contentRating === "safe"
                ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                : contentRating === "suggestive"
                  ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                  : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
            }`}
          >
            {contentRating}
          </Badge>
        )}
        {s.release_year && (
          <Badge variant="outline" className="rounded-md text-[10px] font-semibold px-2 py-0.5 border-border/50">
            {s.release_year}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1 rounded-md capitalize text-[10px] font-semibold px-2 py-0.5 border-border/50">
          {s.status === "ongoing" && (
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {statusLabel(s.status)}
        </Badge>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {s.title}
      </h1>

      {s.alternative_titles && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">{s.alternative_titles}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
        {seriesRank && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 font-semibold text-primary shadow-sm shadow-primary/5">
            <Trophy className="h-4 w-4" />
            #{seriesRank.toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-bold text-foreground">
            {Number(s.rating_average || 0).toFixed(1)}
          </span>
          by {ratingsCount?.toLocaleString() ?? 0} users
        </span>
        <span className="inline-flex items-center gap-1.5 text-pink-400 font-medium">
          <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
          <span className="font-bold text-foreground">
            {(totalLikesCount ?? 0).toLocaleString()}
          </span>{" "}
          likes
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="font-semibold text-foreground">
            {followersCount?.toLocaleString() ?? 0}
          </span>{" "}
          followed
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{Number(s.view_count || 0).toLocaleString()}</span> views
        </span>
      </div>

      {s.description && (
        <div className="mt-5 max-w-3xl">
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

      <MetaSection label="Info">
        <MetaPill>Updated {new Date(s.updated_at).toLocaleDateString()}</MetaPill>
        {uniqueChapterCount > 0 && (
          <button
            onClick={() => {
              const chaptersSection = document.getElementById('chapters-section');
              chaptersSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
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
    <div className="mt-5">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">{children}</div>
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
  const pillClass = `inline-flex rounded-md bg-secondary/70 px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary ${className}`;

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
          className="inline-flex rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground md:hidden"
        >
          Show all +{genres.length - 10}
        </button>
      )}

      {!showAll && genres.length > 20 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="hidden rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground md:inline-flex"
        >
          Show all +{genres.length - 20}
        </button>
      )}

      {showAll && genres.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="inline-flex rounded-md border border-border/60 bg-secondary/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
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
          className="inline-flex rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground md:hidden"
        >
          Show all +{tags.length - 10}
        </button>
      )}

      {!showAll && tags.length > 20 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="hidden rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground md:inline-flex"
        >
          Show all +{tags.length - 20}
        </button>
      )}

      {showAll && tags.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="inline-flex rounded-md border border-border/60 bg-secondary/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
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

  const displayText = expanded || !isLong ? text : `${text.slice(0, 320).trim()}…`;

  return (
    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line space-y-2">
      <span>{displayText}</span>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1.5 inline-block font-semibold text-primary hover:underline cursor-pointer"
        >
          [{expanded ? "view less" : "view more"}]
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
