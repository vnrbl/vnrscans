"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Eye,
  Heart,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
  ExternalLink,
  Check,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddNewSeriesDialog } from "@/components/admin/AddNewSeriesDialog";
import { XP_AMOUNTS } from "@/lib/xp";
import {
  saveChapterOffline,
  getOfflineChapters,
  deleteOfflineChapter,
} from "@/lib/offlineStorage";
import { DownloadChaptersModal } from "@/components/DownloadChaptersModal";

/* ------------------------------------------------------------------ */
/*  ChapterList — ALL chapter interaction state lives here.           */
/*  Pagination clicks, search input, and sort toggles only            */
/*  re-render THIS component, not the entire page.                    */
/* ------------------------------------------------------------------ */

interface ChapterListProps {
  slug: string;
  seriesId: string;
  seriesTitle?: string;
  seriesCoverUrl?: string | null;
  seriesStatus?: string | null;
  initialChaptersData?: any[];
}

export const ChapterList = React.memo(function ChapterList({
  slug,
  seriesId,
  seriesTitle,
  seriesCoverUrl,
  seriesStatus,
  initialChaptersData,
}: ChapterListProps) {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canManage = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [deletingChapterId, setDeletingChapterId] = React.useState<string | null>(null);
  const [unlockingChapterId, setUnlockingChapterId] = React.useState<string | null>(null);

  const handleUnlockChapter = async (e: React.MouseEvent, chapterId: string, chapterNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Unlock Chapter ${chapterNumber} immediately for all readers?`)) {
      return;
    }
    try {
      setUnlockingChapterId(chapterId);
      const toastId = toast.loading(`Unlocking Chapter ${chapterNumber}...`);

      const { error: rpcError } = await (supabase as any).rpc("admin_unlock_chapter", {
        _chapter_id: chapterId,
      });

      if (rpcError) {
        const { error: updateError } = await supabase
          .from("chapters")
          .update({ scheduled_at: null, status: "published" })
          .eq("id", chapterId);
        if (updateError) throw updateError;
      }

      toast.success(`Chapter ${chapterNumber} unlocked successfully!`, { id: toastId });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["series"] });
    } catch (err: any) {
      toast.error(`Failed to unlock chapter: ${err.message}`);
    } finally {
      setUnlockingChapterId(null);
    }
  };

  // Chapter filtering and ordering state — scoped to this component only
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all");
  const [sortOrder, setSortByOrder] = React.useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const ITEMS_PER_PAGE = 15;

  const handleDeleteChapter = async (chapterId: string, chapterNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete Chapter ${chapterNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingChapterId(chapterId);
      const toastId = toast.loading(`Deleting Chapter ${chapterNumber}...`);

      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;

      toast.success(`Chapter ${chapterNumber} deleted successfully!`, { id: toastId });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["series"] });
    } catch (err: any) {
      toast.error(`Failed to delete chapter: ${err.message}`);
    } finally {
      setDeletingChapterId(null);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroup, sortOrder, searchQuery]);

  const chaptersQ = useQuery({
    queryKey: ["chapters", slug, selectedGroup, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("chapters")
        .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group,source_url")
        .eq("series_id", seriesId)
        .eq("status", "published");

      if (selectedGroup !== "all") {
        query = query.eq("scanlation_group", selectedGroup);
      }

      query = query.order("chapter_number", { ascending: sortOrder === "asc" });

      let { data, error } = await query;
      if (error && (error.code === "42703" || error.message?.includes("source_url"))) {
        let fallbackQuery = supabase
          .from("chapters")
          .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group")
          .eq("series_id", seriesId)
          .eq("status", "published");

        if (selectedGroup !== "all") {
          fallbackQuery = fallbackQuery.eq("scanlation_group", selectedGroup);
        }

        fallbackQuery = fallbackQuery.order("chapter_number", { ascending: sortOrder === "asc" });
        const fallbackRes = await fallbackQuery;
        data = (fallbackRes.data ?? []).map((c: any) => ({ ...c, source_url: null }));
        error = fallbackRes.error;
      }
      if (error) throw error;
      return (data ?? []).filter((c) => c.chapter_number !== 0);
    },
    placeholderData: selectedGroup === "all" && sortOrder === "desc" ? initialChaptersData : undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const filteredChapters = React.useMemo(() => {
    if (!chaptersQ.data) return [];
    if (!searchQuery.trim()) return chaptersQ.data;

    const query = searchQuery.toLowerCase();
    return chaptersQ.data.filter((c) => {
      const chapterNum = c.chapter_number?.toString() || "";
      const chapterTitle = c.title?.toLowerCase() || "";
      const uploader = ((c as any).uploaded_by || "").toLowerCase();
      const group = ((c as any).scanlation_group || "").toLowerCase();

      return (
        chapterNum.includes(query) ||
        chapterTitle.includes(query) ||
        uploader.includes(query) ||
        group.includes(query)
      );
    });
  }, [chaptersQ.data, searchQuery]);

  const totalPages = Math.ceil(filteredChapters.length / ITEMS_PER_PAGE);
  const paginatedChapters = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredChapters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredChapters, currentPage]);

  const uniqueChapterCount = React.useMemo(() => {
    if (!chaptersQ.data) return 0;
    const uniqueChapters = new Set(
      chaptersQ.data.map((ch) => Math.floor(ch.chapter_number))
    );
    return uniqueChapters.size;
  }, [chaptersQ.data]);

  // Latest published chapter — used to hint at the catch-up / series-complete
  // bonus on the row the user has to read to unlock it.
  const latestChapterId = React.useMemo(() => {
    if (!chaptersQ.data || chaptersQ.data.length === 0) return null;
    return chaptersQ.data.reduce(
      (best, c) => (best === null || c.chapter_number > best.chapter_number ? c : best),
      null as null | (typeof chaptersQ.data)[number],
    )?.id ?? null;
  }, [chaptersQ.data]);

  const isSeriesCompleted = seriesStatus === "completed";

  // Offline chapter download state
  const [savedOfflineIds, setSavedOfflineIds] = React.useState<Set<string>>(new Set());
  const [downloadingChapterId, setDownloadingChapterId] = React.useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0);
  const [isBatchDownloading, setIsBatchDownloading] = React.useState<boolean>(false);
  const [batchStatus, setBatchStatus] = React.useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = React.useState<boolean>(false);

  const refreshOfflineStatus = React.useCallback(() => {
    const offline = getOfflineChapters();
    setSavedOfflineIds(new Set(offline.map((o) => o.chapterId || o.id)));
  }, []);

  React.useEffect(() => {
    refreshOfflineStatus();
    window.addEventListener("vnr-offline-change", refreshOfflineStatus);
    return () => window.removeEventListener("vnr-offline-change", refreshOfflineStatus);
  }, [refreshOfflineStatus]);

  const handleDownloadSingleChapter = async (
    e: React.MouseEvent,
    chapter: { id: string; chapter_number: number; slug: string; title?: string | null }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (savedOfflineIds.has(chapter.id)) {
      if (window.confirm(`Chapter ${chapter.chapter_number} is already downloaded. Remove from offline storage?`)) {
        await deleteOfflineChapter(chapter.id);
        refreshOfflineStatus();
        toast.info(`Chapter ${chapter.chapter_number} removed from offline storage.`);
      }
      return;
    }

    if (downloadingChapterId) {
      toast.error("Another chapter is currently downloading. Please wait.");
      return;
    }

    setDownloadingChapterId(chapter.id);
    setDownloadProgress(0);

    try {
      const { data: pages, error } = await supabase
        .from("chapter_pages")
        .select("id, page_number, image_url")
        .eq("chapter_id", chapter.id)
        .order("page_number");

      if (error) throw error;
      if (!pages || pages.length === 0) {
        throw new Error("No pages found for this chapter.");
      }

      const chapterMeta = {
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        slug: chapter.slug,
        title: chapter.title,
        series_id: seriesId,
        series: {
          id: seriesId,
          slug: slug,
          title: seriesTitle || slug,
          cover_url: seriesCoverUrl,
        },
      };

      await saveChapterOffline(chapterMeta, pages, (percent) => {
        setDownloadProgress(percent);
      });

      refreshOfflineStatus();
      toast.success(`💾 Chapter ${chapter.chapter_number} Saved Offline!`, {
        description: `Available in your Library under Offline Downloads.`,
      });
    } catch (err: any) {
      toast.error(`Failed to download Chapter ${chapter.chapter_number}: ${err?.message}`);
    } finally {
      setDownloadingChapterId(null);
      setDownloadProgress(0);
    }
  };

  const handleBatchDownload = async (count: number = 5) => {
    if (isBatchDownloading || downloadingChapterId) {
      toast.error("A download is already in progress.");
      return;
    }

    const eligibleChapters = (filteredChapters || [])
      .filter((c) => !savedOfflineIds.has(c.id))
      .slice(0, count);

    if (eligibleChapters.length === 0) {
      toast.info("All selected chapters are already downloaded offline!");
      return;
    }

    setIsBatchDownloading(true);

    for (let i = 0; i < eligibleChapters.length; i++) {
      const ch = eligibleChapters[i];
      setBatchStatus(`Saving Ch. ${ch.chapter_number} (${i + 1}/${eligibleChapters.length})...`);
      setDownloadingChapterId(ch.id);
      setDownloadProgress(0);

      try {
        const { data: pages } = await supabase
          .from("chapter_pages")
          .select("id, page_number, image_url")
          .eq("chapter_id", ch.id)
          .order("page_number");

        if (pages && pages.length > 0) {
          await saveChapterOffline(
            {
              id: ch.id,
              chapter_number: ch.chapter_number,
              slug: ch.slug,
              title: ch.title,
              series_id: seriesId,
              series: {
                id: seriesId,
                slug: slug,
                title: seriesTitle || slug,
                cover_url: seriesCoverUrl,
              },
            },
            pages,
            (percent) => setDownloadProgress(percent)
          );
          refreshOfflineStatus();
        }
      } catch (err) {
        console.error(`Failed downloading chapter ${ch.chapter_number}`, err);
      }
    }

    setIsBatchDownloading(false);
    setBatchStatus(null);
    setDownloadingChapterId(null);
    toast.success(`💾 Batch Download Complete!`, {
      description: `${eligibleChapters.length} chapters saved for offline reading.`,
    });
  };

  const scanlationGroups = useQuery({
    queryKey: ["scanlation-groups", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("scanlation_group")
        .eq("series_id", seriesId)
        .eq("status", "published")
        .not("scanlation_group", "is", null);

      if (error) throw error;

      const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
      return uniqueGroups.sort();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  const readChapters = useQuery({
    queryKey: ["read-chapters", slug, user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId);
      return new Set<string>(data?.map((r) => r.chapter_id) ?? []);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Set of all unique chapter numbers read across ANY scan source
  const readChapterNumbers = React.useMemo(() => {
    const set = new Set<number>();
    if (!readChapters.data || !chaptersQ.data) return set;
    for (const ch of chaptersQ.data) {
      if (readChapters.data.has(ch.id)) {
        set.add(Number(ch.chapter_number));
      }
    }
    return set;
  }, [readChapters.data, chaptersQ.data]);

  // Per-chapter reader counts (distinct users who have read each chapter).
  const readerCounts = useQuery({
    queryKey: ["chapter-reader-counts", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_chapter_reader_counts", {
        _series_id: seriesId,
      });
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.chapter_id, Number(row.reader_count ?? 0)]));
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // Per-chapter like counts
  const chapterLikeCounts = useQuery({
    queryKey: ["chapter-like-counts", seriesId],
    queryFn: async () => {
      const { data: chapters } = await supabase
        .from("chapters")
        .select("id")
        .eq("series_id", seriesId);

      if (!chapters || chapters.length === 0) return new Map<string, number>();
      const chapterIds = chapters.map((c) => c.id);

      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("chapter_id")
        .in("chapter_id", chapterIds)
        .eq("reaction_type", "heart");

      if (error) return new Map<string, number>();
      const countMap = new Map<string, number>();
      (data ?? []).forEach((row) => {
        if (row.chapter_id) {
          countMap.set(row.chapter_id, (countMap.get(row.chapter_id) || 0) + 1);
        }
      });
      return countMap;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const refreshChapterTable = React.useCallback(async () => {
    await Promise.all([
      chaptersQ.refetch(),
      scanlationGroups.refetch(),
    ]);
    toast.success("Chapter table refreshed");
  }, [chaptersQ, scanlationGroups]);

  return (
    <section id="chapters-section">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold">
              Chapters {uniqueChapterCount > 0 && <span className="text-muted-foreground">({uniqueChapterCount})</span>}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
            {scanlationGroups.data && scanlationGroups.data.length > 0 && (
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {scanlationGroups.data.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortByOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="w-full gap-2 sm:w-auto"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshChapterTable}
              disabled={chaptersQ.isFetching || scanlationGroups.isFetching}
              className="w-full gap-2 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${(chaptersQ.isFetching || scanlationGroups.isFetching) ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDownloadModalOpen(true)}
              title="Download all chapters, select wanted chapters, or pick a range with 6x fast download"
              className="w-full gap-2 sm:w-auto border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/70 transition-all cursor-pointer font-bold shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span className="text-xs">Download Chapters</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 stroke-[1.8]" />
          <Input
            type="text"
            placeholder="Search chapters by number, title, uploader, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-[4px] bg-surface-1/90 border border-hairline focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white placeholder:text-neutral-500 text-xs transition-all"
          />
        </div>
      </div>

      {chaptersQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-[4px] shimmer-dark" />
          ))}
        </div>
      ) : !filteredChapters || filteredChapters.length === 0 ? (
        <div className="glass-panel rounded-[4px] p-8 text-center text-xs text-muted-foreground font-light">
          {searchQuery ? (
            <>No chapters found matching &quot;{searchQuery}&quot;</>
          ) : selectedGroup !== "all" ? (
            <>No chapters from {selectedGroup}. Try selecting &quot;All Groups&quot;.</>
          ) : (
            <>No chapters yet. Check back soon.</>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-2 md:hidden">
            {paginatedChapters.map((c) => {
              const isRead = (readChapters.data?.has(c.id) || readChapterNumbers.has(Number(c.chapter_number))) ?? false;
              const isNew = new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
              const showNewBadge = isNew && !isRead;
              const uploadedBy = (c as { uploaded_by?: string }).uploaded_by;
              const scanlationGroup = (c as { scanlation_group?: string }).scanlation_group;
              const isLatest = latestChapterId === c.id;
              const readerCount = readerCounts.data?.get(c.id) ?? 0;
              const chapterLikes = chapterLikeCounts.data?.get(c.id) ?? 0;
              const isScheduledLock = !!c.scheduled_at && new Date(c.scheduled_at) > new Date();
              const remainingMinutes = isScheduledLock
                ? Math.max(1, Math.ceil((new Date(c.scheduled_at!).getTime() - Date.now()) / (1000 * 60)))
                : 0;
              const sourceUrl = (c as any).source_url;

              return (
                <div
                  key={c.id}
                  className="glass-card block rounded-lg p-3 hover-lift transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/title/${slug}/${c.slug}`}
                          className={`text-sm transition-colors flex items-center gap-1.5 ${
                            isRead ? "text-neutral-500 font-medium hover:text-neutral-300" : "text-white font-semibold hover:text-purple-400"
                          }`}
                        >
                          <span>Chapter {c.chapter_number}</span>
                          {isRead && (
                            <span
                              className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/25 border border-emerald-400/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] shrink-0 transition-transform duration-200 group-hover:scale-125 ml-1"
                              title="Read & Completed (Qi Claimed)"
                            >
                              <Check className="h-3 w-3 stroke-[3.5]" />
                            </span>
                          )}
                        </Link>
                        {showNewBadge && (
                          <span className="shrink-0 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            NEW
                          </span>
                        )}
                        {isScheduledLock && (
                          <Link
                            href={`/title/${slug}/${c.slug}`}
                            className={`inline-flex items-center gap-1 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                              canManage
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                                : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 animate-pulse"
                            }`}
                            title={
                              canManage
                                ? `Early access hold until ${new Date(c.scheduled_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. As staff/admin, you can read directly.`
                                : "Locked chapter - Click to open unlock timer page"
                            }
                          >
                            <Lock className="h-3 w-3 text-amber-400" />
                            {canManage ? `Hold (${remainingMinutes}m)` : `Unlocks in ${remainingMinutes}m`}
                          </Link>
                        )}
                        {isScheduledLock && sourceUrl && (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded bg-primary/20 hover:bg-primary/35 border border-primary/50 px-2 py-0.5 text-[11px] font-bold text-primary transition-all hover:scale-105"
                            title="Read immediately on official scans source"
                          >
                            <span>(Read now)</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <XpBadge
                          isRead={isRead}
                          isLatest={isLatest}
                          isSeriesCompleted={isSeriesCompleted}
                        />
                      </div>
                      {c.title && (
                        <p className="mt-1 line-clamp-1 text-xs text-neutral-400">{c.title}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingleChapter(e, c)}
                        title={savedOfflineIds.has(c.id) ? "Saved Offline (Click to remove)" : "Save Chapter Offline"}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer shrink-0 ${
                          savedOfflineIds.has(c.id)
                            ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-400"
                            : "border-border/40 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {downloadingChapterId === c.id ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-[10px] font-mono">{downloadProgress}%</span>
                          </div>
                        ) : savedOfflineIds.has(c.id) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Badge variant="outline" className="gap-1 text-xs badge-glass text-pink-400 border-pink-500/30">
                        <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                        {chapterLikes}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs badge-glass">
                        <Eye className="h-3 w-3 text-neutral-400" />
                        {formatReaderCount(readerCount)}
                      </Badge>
                      {canManage && isScheduledLock && (
                        <button
                          type="button"
                          onClick={(e) => handleUnlockChapter(e, c.id, c.chapter_number)}
                          disabled={unlockingChapterId === c.id}
                          className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                          title={`Unlock Chapter ${c.chapter_number} Immediately`}
                        >
                          {unlockingChapterId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteChapter(c.id, c.chapter_number);
                          }}
                          disabled={deletingChapterId === c.id}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={`Delete Chapter ${c.chapter_number}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                    {scanlationGroup && <span className="font-semibold text-purple-400">{scanlationGroup}</span>}
                    {uploadedBy && <span>by {uploadedBy}</span>}
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    <span>{formatChapterAge(c.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet responsive table layout */}
          <div className="hidden overflow-x-auto rounded-lg border border-hairline glass-panel md:block shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-border/40 bg-surface-1/90 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left">Chapter</th>
                  <th className="px-3 py-3 text-left hidden 2xl:table-cell">Uploaded By</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Group</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">Upload Date</th>
                  <th className="px-2 sm:px-3 py-3 text-center hidden xl:table-cell">QI</th>
                  <th className="px-2 py-3 text-center hidden sm:table-cell">Likes</th>
                  <th className="px-2 py-3 text-right hidden lg:table-cell">Readers</th>
                  <th className="px-2 sm:px-3 py-3 text-center w-12 sm:w-16 text-emerald-400">Offline</th>
                  {canManage && (
                    <th className="px-3 py-3 text-right text-red-400 w-16 sm:w-20">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedChapters.map((c) => {
                  const isRead = (readChapters.data?.has(c.id) || readChapterNumbers.has(Number(c.chapter_number))) ?? false;
                  const isNew = new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
                  const showNewBadge = isNew && !isRead;
                  const isLatest = latestChapterId === c.id;
                  const readerCount = readerCounts.data?.get(c.id) ?? 0;
                  const chapterLikes = chapterLikeCounts.data?.get(c.id) ?? 0;
                  const isScheduledLock = !!c.scheduled_at && new Date(c.scheduled_at) > new Date();
                  const remainingMinutes = isScheduledLock
                    ? Math.max(1, Math.ceil((new Date(c.scheduled_at!).getTime() - Date.now()) / (1000 * 60)))
                    : 0;
                  const sourceUrl = (c as any).source_url;
                  const scanlationGroup = (c as { scanlation_group?: string }).scanlation_group;
                  const uploadedBy = (c as { uploaded_by?: string }).uploaded_by;

                  return (
                    <tr key={c.id} className="transition-colors hover:bg-surface-2/60 group">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Link
                            href={`/title/${slug}/${c.slug}`}
                            className="flex items-center gap-1.5"
                          >
                            <span
                              className={`text-sm transition-colors ${
                                isRead ? "text-neutral-500 font-medium group-hover:text-neutral-300" : "text-white font-semibold group-hover:text-purple-400"
                              }`}
                            >
                              Chapter {c.chapter_number}
                            </span>
                            {isRead && (
                              <span
                                className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-emerald-500/25 border border-emerald-400/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] shrink-0 transition-transform duration-200 group-hover:scale-125 ml-0.5"
                                title="Read & Completed (Qi Claimed)"
                              >
                                <Check className="h-3 w-3 stroke-[3.5]" />
                              </span>
                            )}
                            {showNewBadge && (
                              <span className="shrink-0 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                NEW
                              </span>
                            )}
                          </Link>
                          {isScheduledLock && (
                            <Link
                              href={`/title/${slug}/${c.slug}`}
                              className={`inline-flex items-center gap-1 shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                                canManage
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                                  : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 animate-pulse"
                              }`}
                              title={
                                canManage
                                  ? `Early access hold until ${new Date(c.scheduled_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. As staff/admin, you can read directly.`
                                  : "Locked chapter - Click to open unlock timer page"
                              }
                            >
                              <Lock className="h-3 w-3 text-amber-400" />
                              {canManage ? `Hold (${remainingMinutes}m)` : `Unlocks in ${remainingMinutes}m`}
                            </Link>
                          )}
                          {isScheduledLock && sourceUrl && (
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded bg-primary/20 hover:bg-primary/35 border border-primary/50 px-2 py-0.5 text-[11px] font-bold text-primary transition-all hover:scale-105"
                              title="Read immediately on official scans source"
                            >
                              <span>(Read now)</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {/* Sub-row for small viewports where separate Group / Title column is collapsed */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-400">
                          {c.title && (
                            <span className="line-clamp-1 text-neutral-400">{c.title}</span>
                          )}
                          {scanlationGroup && (
                            <span className="lg:hidden text-[11px] font-medium text-violet-400">
                              [{scanlationGroup}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden 2xl:table-cell">
                        {uploadedBy ? (
                          <Link
                            href={`/user/${uploadedBy}`}
                            className="text-sm text-muted-foreground transition-colors hover:text-violet-600"
                          >
                            {uploadedBy}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {scanlationGroup ? (
                          <Link
                            href={`/browse?group=${scanlationGroup}`}
                            className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-400"
                          >
                            {scanlationGroup}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs text-muted-foreground" title={new Date(c.created_at).toLocaleString()}>
                          <span className="font-medium text-neutral-300">{formatChapterAge(c.created_at)}</span>
                          <span className="hidden 2xl:inline ml-1.5 text-neutral-500">
                            ({new Date(c.created_at).toLocaleDateString()})
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center hidden xl:table-cell">
                        <XpBadge
                          isRead={isRead}
                          isLatest={isLatest}
                          isSeriesCompleted={isSeriesCompleted}
                        />
                      </td>
                      <td className="px-2 py-3 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-400">
                          <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                          {chapterLikes.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right hidden lg:table-cell">
                        <ReaderCount count={readerCount} loading={readerCounts.isLoading} />
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadSingleChapter(e, c)}
                          title={savedOfflineIds.has(c.id) ? "Saved Offline (Click to remove)" : "Save Chapter Offline"}
                          className={`inline-flex items-center justify-center p-1.5 sm:px-2 sm:py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                            savedOfflineIds.has(c.id)
                              ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60"
                              : "border-border/40 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {downloadingChapterId === c.id ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                              <span className="text-[10px] font-mono hidden sm:inline">{downloadProgress}%</span>
                            </div>
                          ) : savedOfflineIds.has(c.id) ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[11px] font-medium hidden 2xl:inline">Saved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Download className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[11px] font-medium hidden 2xl:inline">Save</span>
                            </div>
                          )}
                        </button>
                      </td>
                      {canManage && (
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isScheduledLock && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleUnlockChapter(e, c.id, c.chapter_number)}
                                disabled={unlockingChapterId === c.id}
                                className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title={`Unlock Chapter ${c.chapter_number} Immediately`}
                              >
                                {unlockingChapterId === c.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                ) : (
                                  <Unlock className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteChapter(c.id, c.chapter_number);
                              }}
                              disabled={deletingChapterId === c.id}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title={`Delete Chapter ${c.chapter_number}`}
                            >
                              {deletingChapterId === c.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex flex-col items-center justify-between gap-4 rounded-lg border border-border/40 bg-card px-4 py-4 sm:flex-row md:mt-0 md:rounded-t-none md:border-t-0">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredChapters.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filteredChapters.length}</span> chapters
              </p>
              <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    document.getElementById("chapters-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (pageNum === 2 && currentPage > 3) {
                        return <span key="ellipsis-start" className="px-1 text-muted-foreground select-none">...</span>;
                      }
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key="ellipsis-end" className="px-1 text-muted-foreground select-none">...</span>;
                      }
                      return null;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById("chapters-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`h-8 w-8 text-xs font-semibold ${currentPage === pageNum ? "bg-primary text-primary-foreground hover:bg-primary/95" : "hover:bg-secondary"}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    document.getElementById("chapters-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <DownloadChaptersModal
        open={downloadModalOpen}
        onOpenChange={setDownloadModalOpen}
        seriesId={seriesId}
        seriesSlug={slug}
        seriesTitle={seriesTitle || slug}
        seriesCoverUrl={seriesCoverUrl}
        chapters={chaptersQ.data || []}
        scanlationGroups={scanlationGroups.data || []}
        readChapterIds={readChapters.data}
      />
    </section>
  );
});

/* ------------------------------------------------------------------ */

function XpBadge({
  isRead,
  isLatest,
  isSeriesCompleted,
}: {
  isRead: boolean;
  isLatest: boolean;
  isSeriesCompleted: boolean;
}) {
  const tooltipParts = [`+${XP_AMOUNTS.chapter_complete} Qi for finishing this chapter`];
  if (isLatest) {
    tooltipParts.push(
      `+${XP_AMOUNTS.caught_up} Qi bonus for catching up to the latest chapter`,
    );
    if (isSeriesCompleted) {
      tooltipParts.push(
        `+${XP_AMOUNTS.series_complete} Qi bonus for finishing the entire title`,
      );
    }
  }

  let earnedXp = XP_AMOUNTS.chapter_complete;
  if (isLatest) {
    if (isSeriesCompleted) {
      earnedXp += XP_AMOUNTS.series_complete;
    } else {
      earnedXp += XP_AMOUNTS.caught_up;
    }
  }

  if (isRead) {
    return (
      <Badge
        variant="outline"
        title={`${tooltipParts.join("\n")}\n\nAlready gathered & completed.`}
        className="border-white/10 bg-white/5 text-neutral-500 text-[10px] h-5 px-1.5 font-medium cursor-default select-none line-through gap-1 inline-flex items-center"
      >
        <Check className="h-2.5 w-2.5 text-emerald-400/90" />
        +{earnedXp} Qi
      </Badge>
    );
  }

  if (earnedXp >= 225) {
    return (
      <Badge
        title={tooltipParts.join("\n")}
        className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border-amber-400 text-black text-[10px] h-5 px-1.5 font-black uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)] cursor-default select-none"
      >
        <Sparkles className="mr-0.5 h-2.5 w-2.5 fill-black" />
        +{earnedXp} Qi
      </Badge>
    );
  }

  if (earnedXp >= 125) {
    return (
      <Badge
        title={tooltipParts.join("\n")}
        className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 border-violet-500 text-white text-[10px] h-5 px-1.5 font-extrabold uppercase tracking-wide shadow-[0_0_8px_rgba(124,58,237,0.5)] cursor-default select-none"
      >
        <Sparkles className="mr-0.5 h-2.5 w-2.5 fill-white" />
        +{earnedXp} Qi
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      title={tooltipParts.join("\n")}
      className="border-emerald-500/30 bg-emerald-950/10 text-emerald-400 text-[10px] h-5 px-1.5 font-semibold cursor-default select-none"
    >
      <Sparkles className="mr-0.5 h-2.5 w-2.5 fill-emerald-400" />
      +{earnedXp} Qi
    </Badge>
  );
}

function ReaderCount({ count, loading }: { count: number; loading: boolean }) {
  if (loading) {
    return <span className="inline-block h-4 w-10 animate-pulse rounded bg-secondary/60" />;
  }
  return (
    <Badge
      variant="outline"
      title={`${count.toLocaleString()} reader${count === 1 ? "" : "s"}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
    >
      <Eye className="h-3 w-3" />
      {formatReaderCount(count)}
    </Badge>
  );
}

function formatReaderCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1_000) return value.toString();
  if (value < 1_000_000) return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function formatChapterAge(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return "";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < month) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs < year) return `${Math.floor(diffMs / month)}mo ago`;
  return `${Math.floor(diffMs / year)}y ago`;
}


