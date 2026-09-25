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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  saveChapterOffline,
  getOfflineChapters,
  isOfflineStorageSupported,
} from "@/lib/offlineStorage";
import { canonicalScanlationGroup, normalizeScanlationGroup } from "@/lib/import-source-utils";

export interface ChapterItem {
  id: string;
  chapter_number: number;
  slug: string;
  title?: string | null;
  created_at?: string;
  uploaded_by?: string | null;
  scanlation_group?: string | null;
}

interface DownloadChaptersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesCoverUrl?: string | null;
  chapters: ChapterItem[];
  scanlationGroups?: string[];
  readChapterIds?: Set<string> | Set<any>;
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
  scanlationGroups = [],
  readChapterIds,
}: DownloadChaptersModalProps) {
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

  // Filter States (Same as Chapter Table)
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mode & Selection
  const [mode, setMode] = useState<SelectionMode>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered Chapters matching the table filters
  const filteredChapters = useMemo(() => {
    let list = [...chapters];

    // 1. Scanlation Group
    if (selectedGroup !== "all") {
      list = list.filter(
        (c) => normalizeScanlationGroup(c.scanlation_group) === normalizeScanlationGroup(selectedGroup),
      );
    }

    // 2. Read / Unread Status
    if (readFilter === "unread" && readChapterIds) {
      list = list.filter((c) => !readChapterIds.has(c.id));
    } else if (readFilter === "read" && readChapterIds) {
      list = list.filter((c) => readChapterIds.has(c.id));
    }

    // 3. Search Query (Number, Title, Group, or Uploader)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const numStr = c.chapter_number.toString();
        const titleStr = (c.title || "").toLowerCase();
        const groupStr = (c.scanlation_group || "").toLowerCase();
        const uploaderStr = (c.uploaded_by || "").toLowerCase();
        return (
          numStr.includes(q) ||
          titleStr.includes(q) ||
          groupStr.includes(q) ||
          uploaderStr.includes(q)
        );
      });
    }

    // 4. Sort Order
    list.sort((a, b) => {
      return sortOrder === "desc"
        ? b.chapter_number - a.chapter_number
        : a.chapter_number - b.chapter_number;
    });

    return list;
  }, [chapters, selectedGroup, readFilter, searchQuery, sortOrder, readChapterIds]);

  // Range inputs
  const minCh = useMemo(() => {
    if (chapters.length === 0) return 1;
    return Math.min(...chapters.map((c) => c.chapter_number));
  }, [chapters]);

  const maxCh = useMemo(() => {
    if (chapters.length === 0) return 1;
    return Math.max(...chapters.map((c) => c.chapter_number));
  }, [chapters]);

  const [rangeStart, setRangeStart] = useState<string>(String(minCh));
  const [rangeEnd, setRangeEnd] = useState<string>(String(maxCh));

  // Sync range bounds when chapters load
  useEffect(() => {
    if (chapters.length > 0) {
      setRangeStart(String(minCh));
      setRangeEnd(String(maxCh));
    }
  }, [chapters, minCh, maxCh]);

  // Update selection when mode or filtered list changes
  useEffect(() => {
    if (mode === "all") {
      const allUndownloaded = filteredChapters
        .filter((c) => !downloadedSet.has(c.id))
        .map((c) => c.id);
      setSelectedIds(new Set(allUndownloaded));
    } else if (mode === "next10") {
      const next10 = filteredChapters
        .filter((c) => !downloadedSet.has(c.id))
        .slice(0, 10)
        .map((c) => c.id);
      setSelectedIds(new Set(next10));
    } else if (mode === "range") {
      const start = parseFloat(rangeStart) || minCh;
      const end = parseFloat(rangeEnd) || maxCh;
      const inRange = filteredChapters
        .filter(
          (c) =>
            c.chapter_number >= Math.min(start, end) &&
            c.chapter_number <= Math.max(start, end) &&
            !downloadedSet.has(c.id)
        )
        .map((c) => c.id);
      setSelectedIds(new Set(inRange));
    }
  }, [mode, rangeStart, rangeEnd, filteredChapters, downloadedSet, minCh, maxCh]);

  // Active Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [totalToDownload, setTotalToDownload] = useState(0);
  const [currentChapterProgress, setCurrentChapterProgress] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

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
      filteredChapters.forEach((c) => {
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

    const queue = chapters
      .filter((c) => selectedIds.has(c.id))
      .sort((a, b) => a.chapter_number - b.chapter_number);

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
        const { data: pages, error } = await supabase
          .from("chapter_pages")
          .select("id, page_number, image_url")
          .eq("chapter_id", chapter.id)
          .order("page_number");

        if (error) throw error;
        if (!pages || pages.length === 0) continue;

        // 6x Parallel Download Pool
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
          toast.info("Download cancelled.");
          break;
        }
        console.error(`Failed to download chapter ${chapter.chapter_number}:`, err);
      }
    }

    setIsDownloading(false);
    abortControllerRef.current = null;

    if (successfulCount > 0) {
      toast.success(`⚡ Download Complete!`, {
        description: `Successfully saved ${successfulCount} chapters offline. Ready to read!`,
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
      <DialogContent className="max-w-3xl bg-zinc-950 border border-border/60 p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Download Chapters Offline</DialogTitle>
        <DialogDescription className="sr-only">
          Select chapters with filters matching the chapter table to download for offline reading
        </DialogDescription>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
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
                {seriesTitle} • {chapters.length} Total Chapters ({downloadedSet.size} Saved)
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isDownloading ? (
          /* Active Downloading Dashboard */
          <div className="p-6 flex flex-col items-center justify-center gap-5 min-h-[340px]">
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
                Chapter {currentChapterIndex + 1} of {totalToDownload} • 6x Multi-Threaded Stream
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
                  <span className="font-bold">
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
          /* Selection & Table-matching Filters */
          <div className="p-4 sm:p-5 space-y-4">
            {/* Quick Selection Modes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMode("all")}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "all"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Layers className="h-3.5 w-3.5" />
                  All Filtered
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {filteredChapters.filter((c) => !downloadedSet.has(c.id)).length} chapters
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("next10")}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "next10"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Next 10
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">Quick 10 batch</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("range")}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "range"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span>1 → 50</span>
                  Range
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">From Ch to Ch</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === "custom"
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "border-border/40 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Manual Pick
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5">Checkbox pick</span>
              </button>
            </div>

            {/* Range Controls */}
            {mode === "range" && (
              <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-xl border border-border/40 bg-zinc-900/50">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  From:
                </span>
                <Input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="h-8 w-20 text-xs text-center font-mono bg-zinc-800"
                />
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  To:
                </span>
                <Input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="h-8 w-20 text-xs text-center font-mono bg-zinc-800"
                />
                <span className="text-xs text-emerald-400 font-mono ml-auto">
                  {selectedIds.size} matched
                </span>
              </div>
            )}

            {/* 🔍 FILTER TOOLBAR (Exact same filters as Chapter Table) */}
            <div className="p-3 rounded-xl border border-border/40 bg-zinc-900/40 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Filter className="h-3.5 w-3.5 text-emerald-400" />
                <span>Chapter Table Filters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Group Selector (Same as table) */}
                {scanlationGroups && scanlationGroups.length > 0 ? (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="h-8 text-xs bg-zinc-800/80 border-border/40">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {scanlationGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-muted-foreground flex items-center px-2">
                    All Scanlation Groups
                  </div>
                )}

                {/* 2. Read / Unread Filter */}
                <Select value={readFilter} onValueChange={(val: any) => setReadFilter(val)}>
                  <SelectTrigger className="h-8 text-xs bg-zinc-800/80 border-border/40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Already Read</SelectItem>
                  </SelectContent>
                </Select>

                {/* 3. Sort Order Toggle (Same as table) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                  className="h-8 gap-1.5 text-xs bg-zinc-800/80 border-border/40 cursor-pointer justify-start"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                </Button>
              </div>

              {/* 4. Full Search (Same placeholder as table) */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search chapters by number, title, uploader, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-zinc-800/80 border-border/40"
                />
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                Showing <strong className="text-foreground">{filteredChapters.length}</strong>{" "}
                chapters
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer font-medium"
                >
                  Select All Filtered
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs hover:text-foreground cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Scrollable Chapter List */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/20 bg-zinc-900/30 p-1">
              {filteredChapters.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No chapters match the current filters.
                </div>
              ) : (
                filteredChapters.map((c) => {
                  const isSaved = downloadedSet.has(c.id);
                  const isSelected = selectedIds.has(c.id);
                  const isRead = readChapterIds?.has(c.id) ?? false;

                  return (
                    <div
                      key={c.id}
                      onClick={() => !isSaved && toggleChapter(c.id)}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                        isSaved
                          ? "opacity-60 bg-zinc-900/40 cursor-default"
                          : isSelected
                          ? "bg-emerald-950/20 text-emerald-300"
                          : "hover:bg-zinc-800/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isSelected || isSaved}
                          disabled={isSaved}
                          onCheckedChange={() => !isSaved && toggleChapter(c.id)}
                          className={isSaved ? "data-[state=checked]:bg-emerald-500/50" : ""}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold"
                              style={isRead ? { color: "#c084fc" } : undefined}
                            >
                              Chapter {c.chapter_number}
                            </span>
                            {c.scanlation_group && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                                {canonicalScanlationGroup(c.scanlation_group)}
                              </span>
                            )}
                            {c.uploaded_by && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                by {c.uploaded_by}
                              </span>
                            )}
                          </div>
                          {c.title && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[240px] sm:max-w-md">
                              {c.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Saved
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

            {/* Bottom Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
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
