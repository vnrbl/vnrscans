"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, CheckCircle2, Clock, XCircle, Download, Trash2, HardDrive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Link from "next/link";
import { getOfflineChapters, deleteOfflineChapter, type OfflineChapterMetadata } from "@/lib/offlineStorage";

export default function LibraryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("favorites");
  const [offlineChapters, setOfflineChapters] = useState<OfflineChapterMetadata[]>([]);

  useEffect(() => {
    const loadOffline = () => {
      setOfflineChapters(getOfflineChapters());
    };
    loadOffline();
    window.addEventListener("vnr-offline-change", loadOffline);
    return () => window.removeEventListener("vnr-offline-change", loadOffline);
  }, []);

  const handleDeleteOffline = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteOfflineChapter(chapterId);
    setOfflineChapters(getOfflineChapters());
    toast.success("Chapter removed from offline storage.");
  };

  // Sync local favorites from guest mode if user just logged in
  useEffect(() => {
    if (!user) return;
    try {
      const localFavs: string[] = JSON.parse(localStorage.getItem("vnr_favorites") || "[]");
      if (localFavs.length > 0) {
        Promise.all(
          localFavs.map((sid) =>
            supabase
              .from("bookmarks")
              .upsert({ user_id: user.id, series_id: sid }, { onConflict: "user_id,series_id" } as any)
          )
        ).then(() => {
          localStorage.removeItem("vnr_favorites");
          qc.invalidateQueries({ queryKey: ["library", "favorites"] });
        });
      }
    } catch {}
  }, [user, qc]);

  // Fetch Favorites (Bookmarks)
  const favorites = useQuery({
    queryKey: ["library", "favorites", user?.id],
    queryFn: async () => {
      if (!user) {
        try {
          const favIds: string[] = JSON.parse(localStorage.getItem("vnr_favorites") || "[]");
          if (favIds.length === 0) return [];
          const { data } = await supabase
            .from("series")
            .select("id,slug,title,cover_url,type,rating_average,status,view_count")
            .in("id", favIds);
          return data ?? [];
        } catch {
          return [];
        }
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .select("created_at, series:series_id(id,slug,title,cover_url,type,rating_average,status,view_count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("favorites query:", error.message);
        return [];
      }

      const list = (data ?? []).map((item: any) => item.series).filter(Boolean);
      const seen = new Set<string>();
      return list.filter((series: any) => {
        if (!series.id || seen.has(series.id)) return false;
        seen.add(series.id);
        return true;
      });
    },
    staleTime: 1000 * 30,
  });

  // Fetch User Reading Library
  const library = useQuery({
    queryKey: ["library", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_library")
        .select("*,series:series_id(id,slug,title,cover_url,type,rating_average,status,view_count)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filterByStatus = (status: string) => {
    const items = (library.data ?? [])
      .filter((item: any) => item.reading_status === status)
      .map((item: any) => item.series)
      .filter(Boolean);

    const seen = new Set<string>();
    return items.filter((series: any) => {
      if (!series.id || seen.has(series.id)) return false;
      seen.add(series.id);
      return true;
    });
  };

  const favoritesCount = favorites.data?.length ?? 0;
  const readingCount = filterByStatus("reading").length;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">My Library</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your favorite titles, reading status, and personal collection.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-3 sm:grid-cols-6 gap-1 bg-card/60 border border-border/40 p-1 rounded-xl">
          <TabsTrigger
            value="favorites"
            className="flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-rose-950/40 data-[state=active]:text-rose-400 data-[state=active]:border-rose-500/30 border border-transparent transition-all"
          >
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                {favoritesCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="reading" className="text-xs font-semibold">
            <span>Reading</span>
            {readingCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-foreground font-mono">
                {readingCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="completed" className="text-xs font-semibold">
            Completed
          </TabsTrigger>

          <TabsTrigger value="plan_to_read" className="text-xs font-semibold">
            Plan to Read
          </TabsTrigger>

          <TabsTrigger value="dropped" className="text-xs font-semibold">
            Dropped
          </TabsTrigger>

          <TabsTrigger
            value="offline"
            className="flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-emerald-950/40 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 border border-transparent transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Offline</span>
            {offlineChapters.length > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {offlineChapters.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          <SeriesGrid
            items={favorites.data ?? []}
            loading={favorites.isLoading}
            emptyMessage="No favorite series yet. Tap 'Mark as Favorite' on any series page to add it here!"
          />
        </TabsContent>

        <TabsContent value="reading" className="mt-6">
          <SeriesGrid
            items={filterByStatus("reading")}
            loading={library.isLoading}
            emptyMessage="No series in Reading. Start reading something!"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <SeriesGrid
            items={filterByStatus("completed")}
            loading={library.isLoading}
            emptyMessage="No completed series yet."
          />
        </TabsContent>

        <TabsContent value="plan_to_read" className="mt-6">
          <SeriesGrid
            items={filterByStatus("plan_to_read")}
            loading={library.isLoading}
            emptyMessage="No series planned. Add some from Browse!"
          />
        </TabsContent>

        <TabsContent value="dropped" className="mt-6">
          <SeriesGrid
            items={filterByStatus("dropped")}
            loading={library.isLoading}
            emptyMessage="No dropped series."
          />
        </TabsContent>

        <TabsContent value="offline" className="mt-6">
          {offlineChapters.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center bg-card/30">
              <Download className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">No Offline Chapters Saved</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Open any chapter and click the Save button in the reader top bar to download it for reading on flights or without internet!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offlineChapters.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/60 hover:border-emerald-500/40 hover:bg-card/90 transition-all shadow-sm group"
                >
                  <Link
                    href={`/title/${ch.seriesSlug}/${ch.chapterSlug}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    {ch.seriesCoverUrl ? (
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-900 border border-border/40">
                        <img
                          src={ch.seriesCoverUrl}
                          alt={ch.seriesTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid h-14 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-xs">
                        📖
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {ch.seriesTitle}
                      </div>
                      <div className="text-xs text-primary font-semibold mt-0.5">
                        Chapter {ch.chapterNumber}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {ch.pageCount} pages • Ready offline
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteOffline(e, ch.id)}
                    title="Remove from offline storage"
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
