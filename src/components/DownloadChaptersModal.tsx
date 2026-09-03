"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap,
  Search,
  XCircle,
  HardDrive,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  saveChapterOffline,
  getOfflineChapters,
  isOfflineStorageSupported,
} from "@/lib/offlineStorage";

export interface ChapterItem {
  id: string;
  chapter_number: number;
  slug: string;
  title?: string | null;
  created_at?: string;
}

interface DownloadChaptersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl?: string | null;
  chapters: ChapterItem[];
}

type SelectionMode = "all" | "range" | "custom" | "next10";

export function DownloadChaptersModal({
  open,
  onOpenChange,
  seriesId,
  seriesSlug,
  seriesTitle,
  seriesCoverUrl,
  chapters,
}: DownloadChaptersModalProps) {
  // Sort chapters ascending for logical range selection
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  }, [chapters]);

  // Track already downloaded chapter IDs
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());

  const refreshDownloaded = () => {
    const list = getOfflineChapters();
    setDownloadedSet(new Set(list.map((c) => c.chapterId || c.id)));
  };

  useEffect(() => {
    if (open) {
      refreshDownloaded();
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener("vnr-offline-change", refreshDownloaded);
    return () => window.removeEventListener("vnr-offline-change", refreshDownloaded);
  }, []);

  // Selection states
  const [mode, setMode] = useState<SelectionMode>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Range inputs
  const minCh = sortedChapters[0]?.chapter_number ?? 1;
  const maxCh = sortedChapters[sortedChapters.length - 1]?.chapter_number ?? 1;
  const [rangeStart, setRangeStart] = useState<string>(String(minCh));
  const [rangeEnd, setRangeEnd] = useState<string>(String(maxCh));

  // Update selection when mode changes
  useEffect(() => {
    if (mode === "all") {
      const allUndownloaded = sortedChapters
        .filter((c) => !downloadedSet.has(c.id))
        .map((c) => c.id);
      setSelectedIds(new Set(allUndownloaded));
    } else if (mode === "next10") {
      const next10 = sortedChapters
        .filter((c) => !downloadedSet.has(c.id))
        .slice(0, 10)
        .map((c) => c.id);
      setSelectedIds(new Set(next10));
    } else if (mode === "range") {
      const start = parseFloat(rangeStart) || minCh;
      const end = parseFloat(rangeEnd) || maxCh;
      const inRange = sortedChapters
        .filter(
          (c) =>
            c.chapter_number >= Math.min(start, end) &&
            c.chapter_number <= Math.max(start, end) &&
            !downloadedSet.has(c.id)
        )
        .map((c) => c.id);
      setSelectedIds(new Set(inRange));
    }
  }, [mode, rangeStart, rangeEnd, sortedChapters, downloadedSet, minCh, maxCh]);

  // Active Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [totalToDownload, setTotalToDownload] = useState(0);
  const [currentChapterProgress, setCurrentChapterProgress] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Filtered chapters for manual selection search
  const visibleChapters = useMemo(() => {
    if (!searchQuery.trim()) return sortedChapters;
    const q = searchQuery.toLowerCase();
    return sortedChapters.filter(
      (c) =>
        c.chapter_number.toString().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q))
    );
  }, [sortedChapters, searchQuery]);

  const toggleChapter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleChapters.forEach((c) => {
        if (!downloadedSet.has(c.id)) next.add(c.id);
      });
      return next;
    });
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Start fast parallel batch download
  const handleStartDownload = async () => {
    if (!isOfflineStorageSupported()) {
      toast.error("Offline storage is not supported in this browser.");
      return;
    }

    const queue = sortedChapters.filter((c) => selectedIds.has(c.id));
    if (queue.length === 0) {
      toast.info("Please select at least one chapter to download.");
      return;
    }

    setIsDownloading(true);
    setTotalToDownload(queue.length);
    setCurrentChapterIndex(0);
    setCurrentChapterProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let successfulCount = 0;

    for (let i = 0; i < queue.length; i++) {
      if (controller.signal.aborted) break;

      const chapter = queue[i];
      setCurrentChapterIndex(i);
      setCurrentChapterTitle(`Chapter ${chapter.chapter_number}`);
      setCurrentChapterProgress(0);

      try {
        // 1. Fetch chapter pages
        const { data: pages, error } = await supabase
          .from("chapter_pages")
          .select("id, page_number, image_url")
          .eq("chapter_id", chapter.id)
          .order("page_number");

        if (error) throw error;
        if (!pages || pages.length === 0) continue;

        // 2. High-speed 6x concurrent download into Cache API
        await saveChapterOffline(
          {
            id: chapter.id,
            chapter_number: chapter.chapter_number,
            slug: chapter.slug,
            title: chapter.title,
            series_id: seriesId,
            series: {
              id: seriesId,
              slug: seriesSlug,
              title: seriesTitle,
              cover_url: seriesCoverUrl,
            },
          },
          pages,
          (percent) => {
            setCurrentChapterProgress(percent);
          },
          controller.signal
        );

        successfulCount++;
        refreshDownloaded();
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          toast.info("Download paused/cancelled.");
          break;
        }
        console.error(`Failed to download chapter ${chapter.chapter_number}:`, err);
      }
    }

    setIsDownloading(false);
    abortControllerRef.current = null;

    if (successfulCount > 0) {
      toast.success(`⚡ Download Complete!`, {
        description: `Successfully saved ${successfulCount} chapters offline. Ready to read anytime!`,
      });
      refreshDownloaded();
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsDownloading(false);
  };

  // Estimated size (~2.5 MB per chapter average)
  const estimatedSizeMb = (selectedIds.size * 2.6).toFixed(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isDownloading && !isOpen) {
          if (window.confirm("A download is currently in progress. Cancel download?")) {
            handleCancelDownload();
            onOpenChange(false);
          }
        } else {
          onOpenChange(isOpen);
        }
      }}
    >
      <DialogContent className="max-w-2xl bg-zinc-950 border border-border/60 p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Download Chapters Offline</DialogTitle>
        <DialogDescription className="sr-only">
          Select chapters to download for offline reading
        </DialogDescription>

        {/* Modal Header */}
        <div className="p-5 border-b border-border/40 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Download Chapters Offline
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Zap className="h-3 w-3 fill-emerald-400" />
                  6x Ultra Fast
                </span>
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {seriesTitle} • {sortedChapters.length} Total Chapters
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isDownloading ? (
          /* Active Downloading Dashboard */
          <div className="p-6 flex flex-col items-center justify-center gap-5 min-h-[320px]">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                <Download className="h-9 w-9 text-emerald-400 animate-bounce" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Downloading {currentChapterTitle}...
              </h3>
              <p className="text-xs text-muted-foreground">
                Chapter {currentChapterIndex + 1} of {totalToDownload} • 6x Multi-Threaded Engine
              </p>
            </div>

            {/* Progress Bars */}
            <div className="w-full max-w-md space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>Current Chapter Progress</span>
                  <span className="text-emerald-400 font-bold">{currentChapterProgress}%</span>
                </div>
                <Progress value={currentChapterProgress} className="h-2.5 bg-zinc-800" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>Total Batch Progress</span>
                  <span>
                    {Math.round(((currentChapterIndex + (currentChapterProgress / 100)) / totalToDownload) * 100)}%
                  </span>
                </div>
                <Progress
                  value={((currentChapterIndex + (currentChapterProgress / 100)) / totalToDownload) * 100}
                  className="h-2 bg-zinc-800"
                />
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelDownload}
              className="gap-2 mt-2 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Cancel Download
            </Button>
          </div>
        ) : (
          /* Chapter Selection Controls */
          <div className="p-5 space-y-4">
            {/* Quick Selection Modes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMode("all")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "all"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Layers className="h-3.5 w-3.5" />
                  All Chapters
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {sortedChapters.filter((c) => !downloadedSet.has(c.id)).length} new
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("next10")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "next10"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Next 10
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">Quick batch</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("range")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "range"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span>1 → 50</span>
                  Range
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">Specify range</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "custom"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Custom Pick
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">Checkbox pick</span>
              </button>
            </div>

            {/* Range Mode Controls */}
            {mode === "range" && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-zinc-900/50">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  From Chapter:
                </span>
                <Input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="h-8 w-20 text-xs text-center font-mono bg-zinc-800"
                />
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  To Chapter:
                </span>
                <Input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="h-8 w-20 text-xs text-center font-mono bg-zinc-800"
                />
                <span className="text-xs text-emerald-400 font-mono ml-auto">
                  {selectedIds.size} chapters matched
                </span>
              </div>
            )}

            {/* Search and Bulk Toggle Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter chapters (e.g. 15 or title)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-zinc-900 border-border/40"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllVisible}
                  className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Scrollable Chapter Checkbox Grid */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/20 bg-zinc-900/30 p-1">
              {visibleChapters.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No chapters found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                visibleChapters.map((c) => {
                  const isSaved = downloadedSet.has(c.id);
                  const isSelected = selectedIds.has(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => !isSaved && toggleChapter(c.id)}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                        isSaved
                          ? "opacity-60 bg-zinc-900/50 cursor-default"
                          : isSelected
                          ? "bg-emerald-950/20 text-emerald-300"
                          : "hover:bg-zinc-800/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected || isSaved}
                          disabled={isSaved}
                          onCheckedChange={() => !isSaved && toggleChapter(c.id)}
                          className={isSaved ? "data-[state=checked]:bg-emerald-500/50" : ""}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Chapter {c.chapter_number}</span>
                          {c.title && (
                            <span className="text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-[280px]">
                              {c.title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Downloaded
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ~2.5 MB
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Summary & Download Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-emerald-400" />
                  <span>
                    <strong className="text-foreground font-mono">{selectedIds.size}</strong>{" "}
                    Chapters Selected
                  </span>
                </div>
                <span>•</span>
                <span className="font-mono">~{estimatedSizeMb} MB est.</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>

                <Button
                  size="sm"
                  onClick={handleStartDownload}
                  disabled={selectedIds.size === 0}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all shadow-lg shadow-emerald-950/50"
                >
                  <Download className="h-4 w-4" />
                  <span>Start Fast Download ({selectedIds.size})</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
