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

/* ------------------------------------------------------------------ */
/*  ChapterList — ALL chapter interaction state lives here.           */
/*  Pagination clicks, search input, and sort toggles only            */
/*  re-render THIS component, not the entire page.                    */
/* ------------------------------------------------------------------ */

interface ChapterListProps {
  slug: string;
  seriesId: string;
  seriesStatus?: string | null;
  initialChaptersData?: any[];
}

export const ChapterList = React.memo(function ChapterList({
  slug,
  seriesId,
  seriesStatus,
  initialChaptersData,
}: ChapterListProps) {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canManage = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [deletingChapterId, setDeletingChapterId] = React.useState<string | null>(null);

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
        .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group")
        .eq("series_id", seriesId)
        .eq("status", "published");

      if (selectedGroup !== "all") {
        query = query.eq("scanlation_group", selectedGroup);
      }

      query = query.order("chapter_number", { ascending: sortOrder === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).filter((c) => c.chapter_number !== 0 && (!c.scheduled_at || new Date(c.scheduled_at) <= new Date()));
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
      if (!user) return new Set();
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id)
        .eq("series_id", seriesId);
      return new Set(data?.map((r) => r.chapter_id) ?? []);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

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
            {canManage && <AddNewSeriesDialog />}
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
              const isRead = readChapters.data?.has(c.id) ?? false;
              const isNew = new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
              const showNewBadge = isNew && !isRead;
              const uploadedBy = (c as { uploaded_by?: string }).uploaded_by;
              const scanlationGroup = (c as { scanlation_group?: string }).scanlation_group;
              const isLatest = latestChapterId === c.id;
              const readerCount = readerCounts.data?.get(c.id) ?? 0;
              const chapterLikes = chapterLikeCounts.data?.get(c.id) ?? 0;

              return (
                <Link
                  key={c.id}
                  href={`/title/${slug}/${c.slug}`}
                  className="glass-card block rounded-lg p-3 hover-lift transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="font-semibold text-sm text-white"
                          style={isRead ? { color: "#c084fc" } : undefined}
                        >
                          Chapter {c.chapter_number}
                        </span>
                        {showNewBadge && (
                          <span className="shrink-0 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            NEW
                          </span>
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
                      <Badge variant="outline" className="gap-1 text-xs badge-glass text-pink-400 border-pink-500/30">
                        <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                        {chapterLikes}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs badge-glass">
                        <Eye className="h-3 w-3 text-neutral-400" />
                        {formatReaderCount(readerCount)}
                      </Badge>
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
                </Link>
              );
            })}
          </div>

          {/* Desktop table layout */}
          <div className="hidden overflow-x-auto rounded-lg border border-hairline glass-panel md:block shadow-lg">
            <table className="w-full min-w-[860px]">
            <thead className="border-b border-border/40 bg-surface-1/90">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Chapter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Uploaded By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Upload Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">XP</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Likes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Readers</th>
                {canManage && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-red-400">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginatedChapters.map((c) => {
                const isRead = readChapters.data?.has(c.id) ?? false;
                const isNew = new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
                const showNewBadge = isNew && !isRead;
                const isLatest = latestChapterId === c.id;
                const readerCount = readerCounts.data?.get(c.id) ?? 0;
                const chapterLikes = chapterLikeCounts.data?.get(c.id) ?? 0;

                return (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2/60 group">
                    <td className="px-4 py-3">
                      <Link
                        href={`/title/${slug}/${c.slug}`}
                        className="flex items-center gap-2"
                      >
                        <span className="font-semibold text-sm text-white group-hover:text-purple-400 transition-colors" style={isRead ? { color: "#c084fc" } : undefined}>
                          Chapter {c.chapter_number}
                        </span>
                        {showNewBadge && (
                          <span className="shrink-0 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            NEW
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {(c as { uploaded_by?: string }).uploaded_by ? (
                        <Link
                          href={`/user/${(c as { uploaded_by?: string }).uploaded_by!}`}
                          className="text-sm text-muted-foreground transition-colors hover:text-violet-600"
                        >
                          {(c as { uploaded_by?: string }).uploaded_by}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(c as { scanlation_group?: string }).scanlation_group ? (
                        <Link
                          href={`/browse?group=${(c as { scanlation_group?: string }).scanlation_group}`}
                          className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-400"
                        >
                          {(c as { scanlation_group?: string }).scanlation_group}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        <span className="ml-2 text-xs">({formatChapterAge(c.created_at)})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <XpBadge
                        isRead={isRead}
                        isLatest={isLatest}
                        isSeriesCompleted={isSeriesCompleted}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-400">
                        <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                        {chapterLikes.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReaderCount count={readerCount} loading={readerCounts.isLoading} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
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
  const tooltipParts = [`+${XP_AMOUNTS.chapter_complete} XP for finishing this chapter`];
  if (isLatest) {
    tooltipParts.push(
      `+${XP_AMOUNTS.caught_up} XP bonus for catching up to the latest chapter`,
    );
    if (isSeriesCompleted) {
      tooltipParts.push(
        `+${XP_AMOUNTS.series_complete} XP bonus for finishing the entire title`,
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
        title={`${tooltipParts.join("\n")}\n\nAlready earned.`}
        className="border-zinc-800 bg-zinc-900/30 text-zinc-500 text-[10px] h-5 px-1.5 font-semibold cursor-default select-none line-through"
      >
        +{earnedXp} XP
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
        +{earnedXp} XP
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
        +{earnedXp} XP
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
      +{earnedXp} XP
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


