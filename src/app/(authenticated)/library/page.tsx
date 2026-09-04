"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, CheckCircle2, Clock, XCircle, Download, Trash2, HardDrive, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/OptimizedImage";
import { TITLE_COVER_CLASS } from "@/components/titleCardStyles";
import { formatAppDate } from "@/lib/date";
import {
  getOfflineChapters,
  deleteOfflineChapter,
  deleteOfflineChapters,
  type OfflineChapterMetadata,
} from "@/lib/offlineStorage";

type OfflineSeries = {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl?: string | null;
  chapters: OfflineChapterMetadata[];
  totalPageCount: number;
};

export default function LibraryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("favorites");
  const [offlineChapters, setOfflineChapters] = useState<OfflineChapterMetadata[]>([]);
  const [selectedOfflineSeries, setSelectedOfflineSeries] = useState<OfflineSeries | null>(null);

  useEffect(() => {
    const loadOffline = () => {
      setOfflineChapters(getOfflineChapters());
    };
    loadOffline();
    window.addEventListener("vnr-offline-change", loadOffline);
    return () => window.removeEventListener("vnr-offline-change", loadOffline);
  }, []);

  const offlineSeriesList = useMemo<OfflineSeries[]>(() => {
    const map = new Map<string, OfflineSeries>();
    for (const ch of offlineChapters) {
      const key = ch.seriesSlug || ch.seriesId || ch.seriesTitle;
      if (!map.has(key)) {
        map.set(key, {
          seriesId: ch.seriesId,
          seriesSlug: ch.seriesSlug,
          seriesTitle: ch.seriesTitle,
          seriesCoverUrl: ch.seriesCoverUrl,
          chapters: [],
          totalPageCount: 0,
        });
      }
      const item = map.get(key)!;
      item.chapters.push(ch);
      item.totalPageCount += ch.pageCount || 0;
      if (!item.seriesCoverUrl && ch.seriesCoverUrl) {
        item.seriesCoverUrl = ch.seriesCoverUrl;
      }
    }
    // Sort chapters in each series by chapterNumber ascending
    for (const item of map.values()) {
      item.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    }
    return Array.from(map.values());
  }, [offlineChapters]);

  const handleDeleteOfflineChapter = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteOfflineChapter(chapterId);
    const updated = getOfflineChapters();
    setOfflineChapters(updated);
    toast.success("Chapter removed from offline storage.");

    if (selectedOfflineSeries) {
      const remaining = selectedOfflineSeries.chapters.filter(
        (c) => c.chapterId !== chapterId && c.id !== chapterId
      );
      if (remaining.length === 0) {
        setSelectedOfflineSeries(null);
      } else {
        setSelectedOfflineSeries({
          ...selectedOfflineSeries,
          chapters: remaining,
          totalPageCount: remaining.reduce((acc, c) => acc + (c.pageCount || 0), 0),
        });
      }
    }
  };

  const handleDeleteAllForSeries = async (series: OfflineSeries) => {
    if (
      !window.confirm(
        `Remove all ${series.chapters.length} downloaded chapters of "${series.seriesTitle}" from offline storage?`
      )
    ) {
      return;
    }
    const ids = series.chapters.map((c) => c.id || c.chapterId);
    await deleteOfflineChapters(ids);
    const updated = getOfflineChapters();
    setOfflineChapters(updated);
    setSelectedOfflineSeries(null);
    toast.success(`Removed all offline chapters for "${series.seriesTitle}".`);
  };

  const handleClearAllOffline = async () => {
    if (offlineChapters.length === 0) return;
    if (
      !window.confirm(
        `Clear all ${offlineChapters.length} offline chapters across all series?`
      )
    ) {
      return;
    }
    const ids = offlineChapters.map((c) => c.id || c.chapterId);
    await deleteOfflineChapters(ids);
    setOfflineChapters([]);
    setSelectedOfflineSeries(null);
    toast.success("All offline chapters cleared.");
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

  const counts = {
    favorites: favorites.data?.length ?? 0,
    reading: filterByStatus("reading").length,
    completed: filterByStatus("completed").length,
    plan_to_read: filterByStatus("plan_to_read").length,
    dropped: filterByStatus("dropped").length,
    offline: offlineChapters.length,
  };

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
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 shrink-0" />
            <span>Favorites</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] leading-none">
              {counts.favorites}
            </span>
          </TabsTrigger>

          <TabsTrigger value="reading" className="flex items-center justify-center gap-1.5 text-xs font-semibold">
            <span>Reading</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-mono text-[10px] leading-none">
              {counts.reading}
            </span>
          </TabsTrigger>

          <TabsTrigger value="completed" className="flex items-center justify-center gap-1.5 text-xs font-semibold">
            <span>Completed</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-mono text-[10px] leading-none">
              {counts.completed}
            </span>
          </TabsTrigger>

          <TabsTrigger value="plan_to_read" className="flex items-center justify-center gap-1.5 text-xs font-semibold">
            <span>Plan to Read</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-mono text-[10px] leading-none">
              {counts.plan_to_read}
            </span>
          </TabsTrigger>

          <TabsTrigger value="dropped" className="flex items-center justify-center gap-1.5 text-xs font-semibold">
            <span>Dropped</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-mono text-[10px] leading-none">
              {counts.dropped}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="offline"
            className="flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-emerald-950/40 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 border border-transparent transition-all"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>Offline</span>
            <span className="ml-1 h-4 min-w-[18px] px-1 inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] leading-none">
              {counts.offline}
            </span>
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
          {offlineSeriesList.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center bg-card/30">
              <Download className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">No Offline Chapters Saved</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Open any chapter and click the Save button in the reader top bar (or download multiple chapters from a series page) to read them offline without internet!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-foreground">{offlineSeriesList.length}</strong> {offlineSeriesList.length === 1 ? "series" : "series"} • <strong className="text-foreground">{offlineChapters.length}</strong> total chapters saved offline
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllOffline}
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2.5"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
                  Clear All Offline
                </Button>
              </div>

              {/* Grid of Series Cards matching SeriesGrid layout */}
              <div className="grid grid-cols-2 gap-3 min-[380px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-4">
                {offlineSeriesList.map((series) => {
                  const chCount = series.chapters.length;
                  const firstCh = series.chapters[0];
                  const lastCh = series.chapters[chCount - 1];
                  const chRangeText =
                    chCount > 1
                      ? `Ch. ${firstCh.chapterNumber} - ${lastCh.chapterNumber}`
                      : `Chapter ${firstCh.chapterNumber}`;

                  return (
                    <div
                      key={series.seriesSlug || series.seriesId}
                      onClick={() => setSelectedOfflineSeries(series)}
                      className="glass-card group block rounded-[4px] overflow-hidden hover-lift relative cursor-pointer text-left"
                    >
                      <div className={`${TITLE_COVER_CLASS} relative overflow-hidden bg-neutral-950`}>
                        {series.seriesCoverUrl ? (
                          <OptimizedImage
                            src={series.seriesCoverUrl}
                            alt={series.seriesTitle}
                            seriesId={series.seriesId}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-secondary text-2xl">
                            📖
                          </div>
                        )}

                        {/* Cinematic bottom gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />

                        {/* Top OFFLINE badge */}
                        <div className="absolute left-2 top-2 z-10">
                          <Badge
                            variant="outline"
                            className="bg-emerald-950/80 border-emerald-500/50 text-emerald-300 text-3xs uppercase tracking-wider py-0.5 px-1.5 font-bold leading-none rounded-[3px] shadow-sm flex items-center gap-1 backdrop-blur-sm"
                          >
                            <HardDrive className="h-2.5 w-2.5 text-emerald-400" />
                            OFFLINE
                          </Badge>
                        </div>

                        {/* Bottom Right chapter count badge */}
                        <div className="absolute right-2.5 bottom-2.5 z-10 flex items-center gap-1 rounded border border-emerald-500/30 bg-black/85 px-2 py-0.5 text-3xs text-emerald-300 font-mono font-bold shadow-sm transition-opacity group-hover:opacity-0">
                          <BookOpen className="h-3 w-3 text-emerald-400" />
                          {chCount} {chCount === 1 ? "Ch" : "Chs"}
                        </div>

                        {/* Hover Reveal Details Overlay */}
                        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/30 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none max-h-full overflow-y-auto">
                          <p className="text-xs font-bold leading-snug text-white break-words drop-shadow-md">
                            {series.seriesTitle}
                          </p>
                          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-neutral-300 font-medium">
                            <span className="font-semibold text-emerald-400">
                              {chCount} {chCount === 1 ? "Chapter" : "Chapters"} Ready
                            </span>
                            <span className="text-neutral-400 font-mono text-3xs">
                              {chRangeText}
                            </span>
                            <span className="text-emerald-300/90 text-3xs mt-0.5">
                              Click to view chapters →
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-surface-1/90">
                        <h3
                          title={series.seriesTitle}
                          className="line-clamp-1 text-sm font-semibold leading-snug text-white group-hover:text-emerald-400 transition-colors duration-200"
                        >
                          {series.seriesTitle}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-400 font-normal truncate">
                          {chRangeText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Offline Series Chapters Modal */}
      <Dialog
        open={!!selectedOfflineSeries}
        onOpenChange={(open) => !open && setSelectedOfflineSeries(null)}
      >
        <DialogContent className="max-w-2xl bg-surface-1 border-border/60 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedOfflineSeries?.seriesTitle} - Offline Chapters
            </DialogTitle>
            <DialogDescription>
              Read or manage downloaded chapters for this series offline
            </DialogDescription>
          </DialogHeader>

          {selectedOfflineSeries && (
            <div>
              {/* Header Banner */}
              <div className="p-5 sm:p-6 bg-gradient-to-b from-surface-2 to-surface-1 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {selectedOfflineSeries.seriesCoverUrl ? (
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-border/60 bg-neutral-900 shadow-md">
                      <OptimizedImage
                        src={selectedOfflineSeries.seriesCoverUrl}
                        alt={selectedOfflineSeries.seriesTitle}
                        seriesId={selectedOfflineSeries.seriesId}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="grid h-16 w-12 shrink-0 place-items-center rounded-md bg-secondary text-base">
                      📖
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {selectedOfflineSeries.seriesTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge className="bg-emerald-500/20 border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                        {selectedOfflineSeries.chapters.length}{" "}
                        {selectedOfflineSeries.chapters.length === 1 ? "Chapter" : "Chapters"} Offline
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        • {selectedOfflineSeries.totalPageCount} pages total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  {selectedOfflineSeries.chapters[0] && (
                    <Link
                      href={`/title/${selectedOfflineSeries.seriesSlug}/${selectedOfflineSeries.chapters[0].chapterSlug}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Read Ch. {selectedOfflineSeries.chapters[0].chapterNumber}
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAllForSeries(selectedOfflineSeries)}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/60"
                    title="Delete all downloaded chapters for this series"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
                    Delete All
                  </Button>
                </div>
              </div>

              {/* Chapters List */}
              <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Downloaded Chapters ({selectedOfflineSeries.chapters.length})
                </div>
                {selectedOfflineSeries.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/80 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          Chapter {ch.chapterNumber}
                        </span>
                        {ch.chapterTitle && (
                          <span className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[280px]">
                            - {ch.chapterTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                        <span className="text-emerald-400 font-medium">Ready offline</span>
                        <span>•</span>
                        <span>{ch.pageCount} pages</span>
                        {ch.downloadedAt && (
                          <>
                            <span>•</span>
                            <span>Downloaded {formatAppDate(ch.downloadedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/title/${selectedOfflineSeries.seriesSlug}/${ch.chapterSlug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-white text-foreground text-xs font-semibold transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Read
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOfflineChapter(e, ch.id)}
                        title="Delete chapter from offline"
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
