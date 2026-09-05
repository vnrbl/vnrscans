"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, UserPlus, UserCheck, Star, Bookmark, Bell, BellRing, BellOff, ChevronLeft, ChevronRight, Heart, Trash2, Globe } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScanCoverImporter } from "@/components/admin/ScanCoverImporter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XP_AMOUNTS } from "@/lib/xp";

/* ------------------------------------------------------------------ */
/*  SeriesActions — cover image + follow/rate/library action buttons.  */
/*  Isolated so chapter interactions never trigger these to re-render. */
/* ------------------------------------------------------------------ */

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split("?")[0];
  return cleanUrl.endsWith(".mp4");
};

interface SeriesActionsProps {
  slug: string;
  seriesId: string;
  coverUrl: string | null;
  title: string;
  readChapterSlug: string | undefined;
  readButtonText: string;
  hasChapters: boolean;
}

export const SeriesActions = React.memo(function SeriesActions({
  slug,
  seriesId,
  coverUrl,
  title,
  readChapterSlug,
  readButtonText,
  hasChapters,
}: SeriesActionsProps) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const [activeCoverIdx, setActiveCoverIdx] = React.useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [galleryIdx, setGalleryIdx] = React.useState(0);
  const [activeView, setActiveView] = React.useState<"grid" | "lightbox">("grid");
  const [favCoverUrl, setFavCoverUrl] = React.useState<string | null>(null);

  // Fetch all cover images from the dedicated series_covers table
  const chapterCoversQuery = useQuery({
    queryKey: ["series", "covers", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_covers")
        .select("image_url")
        .eq("series_id", seriesId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any) => row.image_url as string);
    },
    staleTime: 1000 * 60 * 5,
  });

  const allCovers = React.useMemo(() => {
    const list: string[] = [];
    if (coverUrl) list.push(coverUrl);
    (chapterCoversQuery.data || []).forEach((img: string) => {
      if (!list.includes(img)) {
        list.push(img);
      }
    });
    return list;
  }, [coverUrl, chapterCoversQuery.data]);

  // Keyboard navigation for Lightbox view
  React.useEffect(() => {
    if (!isGalleryOpen || activeView !== "lightbox") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setGalleryIdx((prev) => (prev - 1 + allCovers.length) % allCovers.length);
      } else if (e.key === "ArrowRight") {
        setGalleryIdx((prev) => (prev + 1) % allCovers.length);
      } else if (e.key === "Escape") {
        setActiveView("grid");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGalleryOpen, activeView, allCovers.length]);

  // Load favorite cover safely on client mount
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const favCover = localStorage.getItem(`fav-cover-${seriesId}`);
        if (favCover) {
          setFavCoverUrl(favCover);
          const idx = allCovers.indexOf(favCover);
          if (idx !== -1) {
            setActiveCoverIdx(idx);
          }
        }
      }
    } catch {}
  }, [allCovers, seriesId]);

  // Delete Cover Mutation (Admin only)
  const deleteCoverMutation = useMutation({
    mutationFn: async (urlToDelete: string) => {
      if (!user || !isAdmin) throw new Error("Unauthorized");

      // 1. Delete matching row from series_covers
      const { error: deleteErr } = await supabase
        .from("series_covers")
        .delete()
        .eq("series_id", seriesId)
        .eq("image_url", urlToDelete);
      if (deleteErr) throw deleteErr;

      // 2. If this deleted cover was the main series cover_url, promote the next available or set to null
      if (coverUrl === urlToDelete) {
        const remainingCovers = allCovers.filter(c => c !== urlToDelete);
        const nextCover = remainingCovers.length > 0 ? remainingCovers[0] : null;

        const { error: updateErr } = await supabase
          .from("series")
          .update({ cover_url: nextCover })
          .eq("id", seriesId);
        if (updateErr) throw updateErr;
      }
    },
    onSuccess: (_, urlToDelete) => {
      toast.success("Cover picture deleted successfully");
      
      // Invalidate queries to refresh lists and slideshows
      qc.invalidateQueries({ queryKey: ["series"] });
      
      const nextCovers = allCovers.filter(c => c !== urlToDelete);
      if (activeCoverIdx >= nextCovers.length) {
        setActiveCoverIdx(Math.max(0, nextCovers.length - 1));
      }
      if (galleryIdx >= nextCovers.length) {
        setGalleryIdx(Math.max(0, nextCovers.length - 1));
      }
    },
    onError: (err: any) => {
      toast.error(`Delete failed: ${err.message}`);
    }
  });

  const isFollowing = useQuery({
    queryKey: ["following", slug, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_library")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const libraryStatus = useQuery({
    queryKey: ["library-status", slug, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_library")
        .select("reading_status")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return data?.reading_status ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const myRating = useQuery({
    queryKey: ["rating", slug, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .maybeSingle();
      return data?.rating ?? null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const isFavorited = useQuery({
    queryKey: ["is-favorited", seriesId, user?.id],
    queryFn: async () => {
      if (!user) {
        try {
          const favs = JSON.parse(localStorage.getItem("vnr_favorites") || "[]");
          return favs.includes(seriesId);
        } catch {
          return false;
        }
      }
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
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
          const already = favs.includes(seriesId);
          const next = already ? favs.filter((id) => id !== seriesId) : [...favs, seriesId];
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
          .eq("series_id", seriesId);
        if (error) throw error;
        return { favorited: false };
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            series_id: seriesId,
          });
        if (error) throw error;
        return { favorited: true };
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["is-favorited", seriesId, user?.id] });
      const previousValue = qc.getQueryData(["is-favorited", seriesId, user?.id]);
      qc.setQueryData(["is-favorited", seriesId, user?.id], (old: boolean | undefined) => !old);
      return { previousValue };
    },
    onSuccess: (res) => {
      if (res?.favorited) {
        toast.success("Added to Favorites ❤️");
      } else {
        toast.info("Removed from Favorites");
      }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousValue !== undefined) {
        qc.setQueryData(["is-favorited", seriesId, user?.id], context.previousValue);
      }
      toast.error(err.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["is-favorited", seriesId] });
      qc.invalidateQueries({ queryKey: ["library", "favorites"] });
      qc.invalidateQueries({ queryKey: ["library", "all"] });
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        await supabase.from("user_library").delete().eq("user_id", user.id).eq("series_id", seriesId);
        return { wasFollowing: true };
      }
      await supabase.from("user_library").insert({
        user_id: user.id,
        series_id: seriesId,
        reading_status: "reading",
      });
      return { wasFollowing: false };
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["following", slug] });
      const previousValue = qc.getQueryData(["following", slug]);
      qc.setQueryData(["following", slug], (old: boolean | undefined) => !old);
      return { previousValue };
    },
    onSuccess: (result) => {
      if (result?.wasFollowing) {
        toast.success("Unfollowed");
      } else {
        toast.success(`Following — +${XP_AMOUNTS.follow_series} Qi gathered`);
      }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousValue !== undefined) {
        qc.setQueryData(["following", slug], context.previousValue);
      }
      toast.error(err.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["following", slug] });
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["followers-count", slug] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
    },
  });

  const rate = useMutation({
    mutationFn: async (rating: number) => {
      if (!user) throw new Error("Sign in to rate");
      const { error } = await supabase
        .from("ratings")
        .upsert({ user_id: user.id, series_id: seriesId, rating }, { onConflict: "user_id,series_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rating", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("Rating saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: "reading" | "completed" | "plan_to_read" | "dropped") => {
      if (!user) throw new Error("Sign in to set status");
      const { error } = await supabase
        .from("user_library")
        .update({
          reading_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("series_id", seriesId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <aside className="mx-auto w-full max-w-[180px] shrink-0 sm:mx-0 sm:max-w-[220px]">
      <div 
        onClick={() => {
          if (allCovers.length > 0) {
            setActiveView("grid");
            setIsGalleryOpen(true);
          }
        }}
        className="overflow-hidden rounded-xl border border-border/40 bg-secondary shadow-2xl transition-all duration-300 hover:border-primary/30 relative group cursor-pointer"
      >
        {allCovers.length > 0 ? (
          <div className="relative aspect-[2/3] w-full bg-black/60 overflow-hidden flex items-center justify-center">
            {/* Blurred Backdrop */}
            {isVideoUrl(allCovers[activeCoverIdx]) ? (
              <video
                src={allCovers[activeCoverIdx]}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover blur-md opacity-25 scale-105 pointer-events-none"
              />
            ) : (
              <img
                src={allCovers[activeCoverIdx]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-md opacity-25 scale-105 pointer-events-none"
              />
            )}
            {/* Main Image */}
            {isVideoUrl(allCovers[activeCoverIdx]) ? (
              <video
                src={allCovers[activeCoverIdx]}
                autoPlay
                loop
                muted
                playsInline
                className="relative z-10 w-full h-full object-contain"
              />
            ) : (
              <Image
                src={allCovers[activeCoverIdx]}
                alt={title}
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 180px, 220px"
                className="relative z-10 object-contain transition-transform duration-500 hover:scale-102"
                referrerPolicy="no-referrer"
              />
            )}
            {/* Favorite Cover Heart Button */}
            {(() => {
              const currentUrl = allCovers[activeCoverIdx];
              const isFav = favCoverUrl === currentUrl;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const favKey = `fav-cover-${seriesId}`;
                    if (isFav) {
                      try { localStorage.removeItem(favKey); } catch {}
                      setFavCoverUrl(null);
                      toast.success("Removed from favorite covers");
                    } else {
                      try { localStorage.setItem(favKey, currentUrl); } catch {}
                      setFavCoverUrl(currentUrl);
                      toast.success("Set as favorite cover!");
                    }
                  }}
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md border transition-all duration-300 z-20 hover:scale-110 shadow-md ${
                    isFav
                      ? "bg-pink-600/85 border-pink-500 text-white"
                      : "bg-black/60 border-white/10 text-white/80 hover:text-white"
                  }`}
                  aria-label="Set as favorite cover"
                >
                  <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                </button>
              );
            })()}

            {allCovers.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCoverIdx(prev => (prev - 1 + allCovers.length) % allCovers.length);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/75 backdrop-blur border border-white/10 text-white hover:bg-black/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-105 shadow-md shadow-black/30"
                  aria-label="Previous cover"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {/* Right Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveCoverIdx(prev => (prev + 1) % allCovers.length);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/75 backdrop-blur border border-white/10 text-white hover:bg-black/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-105 shadow-md shadow-black/30"
                  aria-label="Next cover"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                {/* Dots Indicator inside a pill container */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-10 px-2.5 py-1.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/5">
                  {allCovers.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCoverIdx(idx);
                      }}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        activeCoverIdx === idx ? "bg-primary w-3.5" : "bg-white/60 w-1"
                      }`}
                      aria-label={`Go to cover ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center text-muted-foreground">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {hasChapters && readChapterSlug && (
          <Link
            href={`/title/${slug}/${readChapterSlug}`}
            className="block"
          >
            <Button className="h-11 w-full bg-primary text-base font-semibold hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10">
              <BookOpen className="mr-2 h-4 w-4" />
              {readButtonText}
            </Button>
          </Link>
        )}

        {user && !isFollowing.data && (
          <Button
            className="h-11 w-full bg-primary/90 font-semibold hover:bg-primary text-primary-foreground"
            onClick={() => toggleFollow.mutate()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Follow
          </Button>
        )}

        {user && isFollowing.data && (
          <Select
            value={libraryStatus.data ?? "reading"}
            onValueChange={(v) => setStatus.mutate(v as any)}
          >
            <SelectTrigger className="h-11 w-full border-primary/40 bg-primary/10 font-semibold text-primary">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                <SelectValue placeholder="Reading" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="plan_to_read">Plan to Read</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        )}

        {user && isFollowing.data && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-10 flex-1 border-border/60"
              onClick={() => toggleFollow.mutate()}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Following
            </Button>
            
            <Select
              defaultValue="all"
              onValueChange={(val) => {
                if (val === "all") {
                  toast.success("Notifications: All! You will get alerts when new chapters drop.");
                } else if (val === "personalized") {
                  toast.info("Notifications: Personalized updates enabled.");
                } else {
                  toast.info("Release notifications turned off.");
                }
              }}
            >
              <SelectTrigger className="h-10 w-12 px-0 justify-center border-border/60 bg-secondary/50" title="Release Notifications">
                <BellRing className="h-4 w-4 text-primary animate-pulse" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    <span>All Notifications</span>
                  </div>
                </SelectItem>
                <SelectItem value="personalized">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>Personalized</span>
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                    <span>None</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Mark as Favorite Button */}
        <Button
          variant="outline"
          onClick={() => toggleFavorite.mutate()}
          className={`h-10 w-full font-semibold transition-all duration-200 gap-2 cursor-pointer ${
            isFavorited.data
              ? "border-rose-500/50 bg-rose-950/30 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.18)]"
              : "border-border/60 hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-950/10"
          }`}
        >
          <Heart
            className={`h-4 w-4 transition-transform duration-200 ${
              isFavorited.data ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
            }`}
          />
          <span>{isFavorited.data ? "Favorited" : "Mark as Favorite"}</span>
        </Button>

        {/* Admin Scan Cover Import Tool */}
        {isAdmin && (
          <div className="pt-2 border-t border-border/20">
            <ScanCoverImporter
              seriesId={seriesId}
              slug={slug}
              currentCoverUrl={coverUrl}
              seriesTitle={title}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 text-xs font-semibold"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Import Cover from Scan</span>
                </Button>
              }
            />
          </div>
        )}
      </div>

      {user && (
        <div className="mt-5 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => rate.mutate(n)} aria-label={`Rate ${n}`}>
              <Star
                className={`h-5 w-5 transition duration-200 ${
                  (myRating.data ?? 0) >= n
                    ? "fill-primary text-primary filter drop-shadow-[0_0_4px_rgba(236,72,153,0.2)]"
                    : "text-muted-foreground hover:text-primary"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {allCovers.length > 0 && (
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
          <DialogContent className="max-w-3xl border border-border/30 bg-[#0e0e11]/95 p-6 backdrop-blur-md text-foreground">
            <DialogHeader className="pb-3 border-b border-border/10">
              <DialogTitle className="text-lg font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeView === "lightbox" && (
                    <button
                      type="button"
                      onClick={() => setActiveView("grid")}
                      className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors mr-1"
                      title="Back to Gallery Grid"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <span>Covers & Illustrations Gallery</span>
                </div>
                <div className="flex items-center gap-3 pr-6">
                  {isAdmin && (
                    <ScanCoverImporter
                      seriesId={seriesId}
                      slug={slug}
                      currentCoverUrl={coverUrl}
                      seriesTitle={title}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-950/40"
                        >
                          <Globe className="h-3 w-3" />
                          <span>Import Scan Cover</span>
                        </Button>
                      }
                    />
                  )}
                  <span className="text-xs text-muted-foreground font-mono font-normal">
                    {activeView === "lightbox" ? `${galleryIdx + 1} of ${allCovers.length}` : `${allCovers.length} images`}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>

            {activeView === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 mt-4 overflow-y-auto max-h-[70vh] p-1.5 scrollbar-thin scrollbar-thumb-primary/30">
                {allCovers.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setGalleryIdx(idx);
                      setActiveView("lightbox");
                    }}
                    className="relative w-full h-0 pb-[150%] rounded-lg overflow-hidden border border-border/20 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:scale-102 hover:shadow-xl hover:shadow-primary/5 group bg-secondary/35"
                  >
                    {isVideoUrl(url) ? (
                      <video
                        src={url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Cover ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/10">
                        View Image
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this cover?")) {
                            deleteCoverMutation.mutate(url);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-black/60 hover:bg-red-600 text-white z-30 transition-all shadow-md hover:scale-105"
                        title="Delete cover picture"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="relative aspect-[3/4] max-h-[60vh] w-full flex items-center justify-center bg-black/90 rounded-lg overflow-hidden mt-4 border border-border/10">
                  {/* Blurred background image for immersive depth */}
                  {isVideoUrl(allCovers[galleryIdx]) ? (
                    <video
                      src={allCovers[galleryIdx]}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={allCovers[galleryIdx]}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none"
                    />
                  )}
                  {/* Main cover in full aspect ratio fit */}
                  {isVideoUrl(allCovers[galleryIdx]) ? (
                    <video
                      src={allCovers[galleryIdx]}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="relative z-10 max-h-[60vh] max-w-full object-contain shadow-2xl"
                    />
                  ) : (
                    <img
                      src={allCovers[galleryIdx]}
                      alt={`${title} Cover ${galleryIdx + 1}`}
                      className="relative z-10 max-h-[60vh] max-w-full object-contain shadow-2xl"
                    />
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this cover?")) {
                          deleteCoverMutation.mutate(allCovers[galleryIdx]);
                          if (allCovers.length <= 1) {
                            setIsGalleryOpen(false);
                          } else {
                            setActiveView("grid");
                          }
                        }
                      }}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-red-600 hover:border-red-500 transition-all hover:scale-105 z-20 shadow-md"
                      title="Delete cover picture"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {allCovers.length > 1 && (
                    <>
                      {/* Left Arrow */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryIdx((prev) => (prev - 1 + allCovers.length) % allCovers.length);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 text-white transition-all hover:scale-105 z-20"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {/* Right Arrow */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryIdx((prev) => (prev + 1) % allCovers.length);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/10 text-white transition-all hover:scale-105 z-20"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail grid */}
                {allCovers.length > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-primary/45">
                    {allCovers.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGalleryIdx(idx)}
                        className={`relative aspect-[2/3] w-14 shrink-0 rounded overflow-hidden border-2 transition-all ${
                          galleryIdx === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        {isVideoUrl(url) ? (
                          <video src={url} muted className="object-cover h-full w-full" />
                        ) : (
                          <img src={url} alt="" className="object-cover h-full w-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </aside>
  );
});
