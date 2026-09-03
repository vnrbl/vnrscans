"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  Book,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Layers,
  AlertTriangle,
  Clock,
  CheckSquare,
  Square,
  Eye,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  RecycleBinItem,
  restoreRecycleBinItem,
  permanentlyDeleteItem,
  emptyAllRecycleBin,
} from "@/lib/recycle-bin";

export default function RecycleBinPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "expiring">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [inspectItem, setInspectItem] = useState<RecycleBinItem | null>(null);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [confirmDeleteSingle, setConfirmDeleteSingle] = useState<RecycleBinItem | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Recycle Bin items
  const recycleBinQuery = useQuery({
    queryKey: ["admin-recycle-bin"],
    queryFn: async (): Promise<RecycleBinItem[]> => {
      const { data, error } = await (supabase as any)
        .from("recycle_bin")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) {
        console.warn("[RecycleBin] Error fetching from table:", error);
        // Fallback: check localStorage mock items for graceful preview
        try {
          const cached = localStorage.getItem("vnr_recycle_bin_mock");
          if (cached) return JSON.parse(cached);
        } catch (_) {}
        return [];
      }
      return (data || []) as RecycleBinItem[];
    },
    staleTime: 5 * 1000,
  });

  const items = recycleBinQuery.data || [];

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let list = items.slice();

    // Type filter
    if (typeFilter !== "all") {
      list = list.filter((it) => it.item_type === typeFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.item_type?.toLowerCase().includes(q) ||
          it.deleted_by_username?.toLowerCase().includes(q) ||
          it.item_id?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime();
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "expiring") {
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      return 0;
    });

    return list;
  }, [items, typeFilter, searchQuery, sortBy]);

  // Summary counts
  const stats = useMemo(() => {
    const total = items.length;
    const series = items.filter((i) => i.item_type === "series").length;
    const chapters = items.filter((i) => i.item_type === "chapter").length;
    const comments = items.filter((i) => i.item_type === "comment").length;
    const expiringSoon = items.filter((i) => {
      const days = Math.ceil((new Date(i.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    }).length;

    return { total, series, chapters, comments, expiringSoon };
  }, [items]);

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Single Restore Action
  const handleRestore = async (item: RecycleBinItem) => {
    setIsProcessing(true);
    const toastId = toast.loading(`Restoring "${item.title}"...`);
    try {
      const res = await restoreRecycleBinItem(item);
      if (!res.success) throw new Error(res.error || "Failed to restore");

      toast.success(`Successfully restored "${item.title}"`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      setInspectItem(null);
    } catch (err: any) {
      toast.error(`Restore failed: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Restore Action
  const handleBatchRestore = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    const toastId = toast.loading(`Restoring ${selectedIds.size} items...`);
    let count = 0;
    try {
      for (const id of Array.from(selectedIds)) {
        const item = items.find((i) => i.id === id);
        if (item) {
          const res = await restoreRecycleBinItem(item);
          if (res.success) count++;
        }
      }
      toast.success(`Successfully restored ${count} items`, { id: toastId });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    } catch (err: any) {
      toast.error(`Batch restore error: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Delete Permanently Action
  const handleConfirmSingleDelete = async () => {
    if (!confirmDeleteSingle) return;
    setIsProcessing(true);
    const toastId = toast.loading("Permanently deleting...");
    try {
      const res = await permanentlyDeleteItem(confirmDeleteSingle.id);
      if (!res.success) throw new Error(res.error);

      toast.success(`Permanently purged "${confirmDeleteSingle.title}"`, { id: toastId });
      setConfirmDeleteSingle(null);
      queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Delete Permanently Action
  const handleConfirmBatchDelete = async () => {
    setIsProcessing(true);
    const toastId = toast.loading(`Permanently purging ${selectedIds.size} items...`);
    let count = 0;
    try {
      for (const id of Array.from(selectedIds)) {
        const res = await permanentlyDeleteItem(id);
        if (res.success) count++;
      }
      toast.success(`Purged ${count} items permanently`, { id: toastId });
      setSelectedIds(new Set());
      setConfirmDeleteBatch(false);
      queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
    } catch (err: any) {
      toast.error(`Batch delete error: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty Bin Action
  const handleConfirmEmpty = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Emptying recycle bin...");
    try {
      const res = await emptyAllRecycleBin();
      if (!res.success) throw new Error(res.error);

      toast.success("Recycle Bin emptied successfully", { id: toastId });
      setConfirmEmptyOpen(false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
    } catch (err: any) {
      toast.error(`Failed to empty bin: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render type icon
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "series":
        return <Book className="h-4 w-4 text-purple-400" />;
      case "chapter":
        return <FileText className="h-4 w-4 text-cyan-400" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case "banner":
        return <ImageIcon className="h-4 w-4 text-amber-400" />;
      default:
        return <Layers className="h-4 w-4 text-neutral-400" />;
    }
  };

  // Calculate days remaining before automatic purge
  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase font-heading">
              Recycle Bin
            </h1>
            <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 font-mono text-2xs">
              Soft Deletion Vault
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans">
            Deleted series, chapters, comments, and assets are retained for 30 days. Restore them at any time or permanently purge them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recycleBinQuery.refetch()}
            disabled={recycleBinQuery.isFetching}
            className="border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 text-xs gap-1.5 h-8 px-3 rounded-lg"
          >
            <RefreshCw className={`h-3 w-3 ${recycleBinQuery.isFetching ? "animate-spin text-purple-400" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmEmptyOpen(true)}
            disabled={items.length === 0 || isProcessing}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs gap-1.5 h-8 px-3 rounded-lg cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Empty Bin</span>
          </Button>
        </div>
      </div>

      {/* ─── Metric Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0c] p-3.5 space-y-1">
          <span className="text-3xs font-mono text-neutral-500 uppercase tracking-wider">Total in Trash</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.total}</span>
            <Trash2 className="h-4 w-4 text-neutral-600" />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0c] p-3.5 space-y-1">
          <span className="text-3xs font-mono text-purple-400 uppercase tracking-wider">Deleted Series</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.series}</span>
            <Book className="h-4 w-4 text-purple-500/50" />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0c] p-3.5 space-y-1">
          <span className="text-3xs font-mono text-cyan-400 uppercase tracking-wider">Deleted Chapters</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.chapters}</span>
            <FileText className="h-4 w-4 text-cyan-500/50" />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0c] p-3.5 space-y-1">
          <span className="text-3xs font-mono text-amber-400 uppercase tracking-wider">Expiring in ≤ 7d</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.expiringSoon}</span>
            <Clock className="h-4 w-4 text-amber-500/50" />
          </div>
        </div>
      </div>

      {/* ─── Search, Tabs & Sort Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950 p-2.5 rounded-xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <Input
            placeholder="Search deleted titles, IDs, or deleter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-black/60 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 rounded-lg focus-visible:ring-purple-500/40"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "series", label: "Series" },
            { id: "chapter", label: "Chapters" },
            { id: "comment", label: "Comments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 bg-neutral-900 border border-neutral-800 rounded-lg px-2 text-xs text-neutral-300 cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest Deleted</option>
            <option value="oldest">Oldest Deleted</option>
            <option value="title">Title (A-Z)</option>
            <option value="expiring">Expiring Soonest</option>
          </select>
        </div>
      </div>

      {/* ─── Batch Operations Bar ────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBatchRestore}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3 rounded-md gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restore Selected</span>
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDeleteBatch(true)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-500 text-white text-xs h-7 px-3 rounded-md gap-1 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Purge Selected</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-400 hover:text-white text-xs h-7 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Items Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0c] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black text-3xs font-mono uppercase tracking-widest text-neutral-500">
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="cursor-pointer text-neutral-400 hover:text-white">
                    {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? (
                      <CheckSquare className="h-4 w-4 text-purple-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-3 font-semibold">Item Title & Details</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Deleted By</th>
                <th className="p-3 font-semibold">Deleted Date</th>
                <th className="p-3 font-semibold">Auto-Purge</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-500">
                        <Trash2 className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-white">Recycle Bin is Empty</p>
                        <p className="text-xs text-neutral-400 max-w-sm">
                          {searchQuery || typeFilter !== "all"
                            ? "No deleted items match your search filters."
                            : "There are no soft-deleted records currently in the trash vault."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const daysLeft = getDaysRemaining(item.expires_at);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? "bg-purple-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(item.id)}
                          className="cursor-pointer text-neutral-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Title & info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                            {renderTypeIcon(item.item_type)}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <span className="font-bold text-white block truncate hover:text-purple-300 transition-colors cursor-pointer" onClick={() => setInspectItem(item)}>
                              {item.title || "Untitled Record"}
                            </span>
                            <span className="text-3xs font-mono text-neutral-500 truncate block">
                              ID: {item.item_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded text-3xs font-mono border border-white/10 bg-white/5 text-neutral-300">
                          {item.item_type}
                        </span>
                      </td>

                      {/* Deleter */}
                      <td className="p-3 font-mono text-3xs text-neutral-400">
                        {item.deleted_by_username || "System Admin"}
                      </td>

                      {/* Deleted Date */}
                      <td className="p-3 font-mono text-3xs text-neutral-400">
                        {new Date(item.deleted_at).toLocaleDateString()}
                      </td>

                      {/* Days Left */}
                      <td className="p-3">
                        <span
                          className={`text-3xs font-mono px-2 py-0.5 rounded border ${
                            daysLeft <= 3
                              ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold animate-pulse"
                              : daysLeft <= 7
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-white/5 border-white/10 text-neutral-400"
                          }`}
                        >
                          {daysLeft} days left
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setInspectItem(item)}
                            className="h-7 w-7 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white"
                            title="Inspect details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(item)}
                            disabled={isProcessing}
                            className="h-7 w-7 rounded-md hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300"
                            title="Restore item"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteSingle(item)}
                            disabled={isProcessing}
                            className="h-7 w-7 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Inspect Modal ───────────────────────────────────────────────────── */}
      <Dialog open={!!inspectItem} onOpenChange={(open) => !open && setInspectItem(null)}>
        <DialogContent className="bg-[#0a0a0c] border border-white/15 text-white max-w-xl max-h-[85vh] overflow-y-auto">
          {inspectItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-7 w-7 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center">
                    {renderTypeIcon(inspectItem.item_type)}
                  </span>
                  <DialogTitle className="text-base font-bold text-white font-heading">
                    {inspectItem.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-neutral-400">
                  Inspect the snapshot metadata and restore or delete this record.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-black border border-white/10 font-mono text-3xs">
                  <div>
                    <span className="text-neutral-500">Record Type:</span>
                    <p className="text-neutral-200 capitalize font-bold">{inspectItem.item_type}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Original Table:</span>
                    <p className="text-neutral-200">{inspectItem.original_table}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Deleted By:</span>
                    <p className="text-neutral-200">{inspectItem.deleted_by_username || "Admin"}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Retention Ends:</span>
                    <p className="text-amber-400">{new Date(inspectItem.expires_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Raw snapshot JSON */}
                <div className="space-y-1.5">
                  <span className="text-3xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    Item Metadata Snapshot
                  </span>
                  <div className="max-h-60 overflow-y-auto p-3 rounded-lg bg-black/90 border border-white/10 text-3xs font-mono text-neutral-300">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(inspectItem.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const it = inspectItem;
                    setInspectItem(null);
                    setConfirmDeleteSingle(it);
                  }}
                  className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Purge Permanently
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleRestore(inspectItem)}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restore Record
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Single Delete Modal ─────────────────────────────────────── */}
      <Dialog open={!!confirmDeleteSingle} onOpenChange={(open) => !open && setConfirmDeleteSingle(null)}>
        <DialogContent className="bg-[#0a0a0c] border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-white font-heading">
                Permanently Delete Record?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-300">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white font-mono">"{confirmDeleteSingle?.title}"</strong>? This action is irreversible and the item cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteSingle(null)}
              className="border-white/10 text-neutral-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmSingleDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
            >
              Permanently Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Batch Delete Modal ──────────────────────────────────────── */}
      <Dialog open={confirmDeleteBatch} onOpenChange={setConfirmDeleteBatch}>
        <DialogContent className="bg-[#0a0a0c] border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-white font-heading">
                Purge {selectedIds.size} Selected Items?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-300">
              This will permanently delete all {selectedIds.size} selected items from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteBatch(false)}
              className="border-white/10 text-neutral-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmBatchDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
            >
              Purge All Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Empty Bin Modal ─────────────────────────────────────────── */}
      <Dialog open={confirmEmptyOpen} onOpenChange={setConfirmEmptyOpen}>
        <DialogContent className="bg-[#0a0a0c] border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-white font-heading">
                Empty Recycle Bin?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-300">
              Are you sure you want to empty the entire recycle bin? All {items.length} items will be permanently erased.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmEmptyOpen(false)}
              className="border-white/10 text-neutral-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmEmpty}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
            >
              Yes, Empty Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
