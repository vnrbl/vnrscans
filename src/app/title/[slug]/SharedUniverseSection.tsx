"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe2,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  BookOpen,
  Check,
  Search,
  Loader2,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDragScroll, DRAG_SCROLL_CONTAINER_CLASS } from "@/hooks/useDragScroll";
import { TITLE_CARD_WIDTH, TITLE_COVER_CLASS } from "@/components/titleCardStyles";
import {
  getUniverseMetadata,
  PRESET_UNIVERSES,
  UNIVERSE_ROLES,
} from "@/lib/universe-constants";

interface SharedUniverseSectionProps {
  currentSeries: {
    id: string;
    slug: string;
    title: string;
    universe?: string | null;
    universe_role?: string | null;
  };
}

export function SharedUniverseSection({ currentSeries }: SharedUniverseSectionProps) {
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canManage = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customUniverseName, setCustomUniverseName] = useState("");
  const [currentRole, setCurrentRole] = useState(currentSeries.universe_role || "Main Story");

  // Search to add series to this universe
  const [searchSeriesQuery, setSearchSeriesQuery] = useState("");
  const [targetSeriesToAdd, setTargetSeriesToAdd] = useState<any>(null);
  const [targetRole, setTargetRole] = useState("Connected Series");

  const universeName = currentSeries.universe?.trim() || "";
  const universeMeta = getUniverseMetadata(universeName);

  // Drag scroll hook for the horizontal list
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  // Fetch all series in this universe (including or excluding current series)
  const universeSeriesQ = useQuery({
    queryKey: ["shared-universe", universeName, currentSeries.id],
    queryFn: async () => {
      if (!universeName) return [];
      const { data, error } = await supabase
        .from("series")
        .select("id, slug, title, cover_url, type, status, rating_average, chapter_count, universe, universe_role")
        .ilike("universe", universeName)
        .eq("is_hidden", false)
        .order("title");

      if (error) {
        console.warn("[SharedUniverse] Fetch error:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!universeName,
    staleTime: 1000 * 60 * 3,
  });

  // Series search query inside the modal
  const searchQ = useQuery({
    queryKey: ["search-series-for-universe", searchSeriesQuery],
    queryFn: async () => {
      if (!searchSeriesQuery.trim() || searchSeriesQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("series")
        .select("id, slug, title, cover_url, type, status, universe, universe_role")
        .ilike("title", `%${searchSeriesQuery.trim()}%`)
        .limit(10);

      if (error) return [];
      return data || [];
    },
    enabled: isManageOpen && searchSeriesQuery.trim().length >= 2,
  });

  // Mutation to set or change current series universe
  const setUniverseMutation = useMutation({
    mutationFn: async ({
      universe,
      role,
      seriesId,
    }: {
      universe: string | null;
      role: string | null;
      seriesId: string;
    }) => {
      const { error } = await supabase
        .from("series")
        .update({
          universe: universe ? universe.trim() : null,
          universe_role: role || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seriesId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Universe settings updated!");
      qc.invalidateQueries({ queryKey: ["shared-universe"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", currentSeries.slug] });
      qc.invalidateQueries({ queryKey: ["series"] });
      setTargetSeriesToAdd(null);
      setSearchSeriesQuery("");
    },
    onError: (err: any) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  const allConnected = universeSeriesQ.data || [];
  // Exclude current series from the display cards to showcase sibling titles
  const siblingSeries = allConnected.filter((s) => s.id !== currentSeries.id);

  // If no universe is set and user is not admin, don't show empty block
  if (!universeName && !canManage) {
    return null;
  }

  // If no universe is set yet, show an enticing admin prompt to link
  if (!universeName) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Admin Feature
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Link "{currentSeries.title}" to a Shared Universe
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              Connect this series with other titles belonging to the same franchise or universe (e.g. PTJ Universe, Blue String, Nano Machine Murim, Woogak Murim, Solo Leveling, etc.).
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedPreset("");
              setCustomUniverseName("");
              setIsManageOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Assign Universe
          </Button>
        </div>

        {/* Manage Universe Dialog */}
        <ManageUniverseModal
          open={isManageOpen}
          onOpenChange={setIsManageOpen}
          currentSeries={currentSeries}
          allConnected={allConnected}
          universeName={universeName}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          customUniverseName={customUniverseName}
          setCustomUniverseName={setCustomUniverseName}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          searchSeriesQuery={searchSeriesQuery}
          setSearchSeriesQuery={setSearchSeriesQuery}
          targetSeriesToAdd={targetSeriesToAdd}
          setTargetSeriesToAdd={setTargetSeriesToAdd}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          searchQ={searchQ}
          setUniverseMutation={setUniverseMutation}
        />
      </div>
    );
  }

  return (
    <section className="mt-10 pt-8 border-t border-border/40 space-y-5">
      {/* Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl border ${universeMeta.borderClass} bg-gradient-to-r ${universeMeta.bgGradient} p-4 sm:p-6 shadow-xl backdrop-blur-md`}>
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm ${universeMeta.borderClass} ${universeMeta.colorClass} bg-background/50 backdrop-blur-sm`}
              >
                {universeMeta.badge}
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {allConnected.length} {allConnected.length === 1 ? "Series" : "Connected Series"} in Universe
              </span>
              {currentSeries.universe_role && (
                <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide bg-secondary/80 text-foreground">
                  Current: {currentSeries.universe_role}
                </Badge>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Globe2 className={`h-6 w-6 ${universeMeta.colorClass}`} />
              <span>{universeName}</span>
            </h3>

            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {universeMeta.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/browse?search=${encodeURIComponent(universeName)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border/50 bg-background/40 hover:bg-background/80 hover:text-foreground text-muted-foreground transition-all duration-200"
            >
              Explore All <ExternalLink className="h-3 w-3" />
            </Link>

            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPreset(universeName);
                  setCustomUniverseName(universeName);
                  setCurrentRole(currentSeries.universe_role || "Main Story");
                  setIsManageOpen(true);
                }}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-xl gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" /> Manage Universe
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Connected Series Grid / Carousel */}
      {universeSeriesQ.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : siblingSeries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-card/20 p-6 text-center">
          <Globe2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            "{currentSeries.title}" is the only series currently registered in <span className="font-semibold text-foreground">{universeName}</span>.
          </p>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManageOpen(true)}
              className="mt-3 text-xs border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add More Series to {universeName}
            </Button>
          )}
        </div>
      ) : (
        <div className="relative group">
          {/* Scroll Navigation Buttons */}
          <button
            onClick={() => scrollBy("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 h-9 w-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-card hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 h-9 w-9 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-card hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Drag scrollable horizontal list */}
          <div
            ref={scrollRef}
            {...dragHandlers}
            className={`${DRAG_SCROLL_CONTAINER_CLASS} flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x`}
          >
            {siblingSeries.map((item) => (
              <div
                key={item.id}
                className={`${TITLE_CARD_WIDTH} flex-shrink-0 snap-start select-none`}
              >
                <Link
                  href={`/title/${item.slug}`}
                  className="group/card block rounded-xl overflow-hidden bg-card/60 border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                >
                  {/* Poster cover with exact 2:3 ratio */}
                  <div className={TITLE_COVER_CLASS}>
                    {item.cover_url ? (
                      <Image
                        src={item.cover_url}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No cover
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/30 pointer-events-none" />

                    {/* Universe Role Badge top-left */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-purple-950/90 text-purple-300 border border-purple-500/40 backdrop-blur-sm shadow-sm uppercase">
                        {item.universe_role || "Connected"}
                      </span>
                    </div>

                    {/* Rating badge top-right */}
                    {item.rating_average ? (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-sm text-amber-400">
                        <Star className="h-2.5 w-2.5 fill-amber-400" />
                        {Number(item.rating_average).toFixed(1)}
                      </div>
                    ) : null}

                    {/* Bottom stats inside cover */}
                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[10px] font-medium text-white/90">
                      <span className="capitalize">{item.type}</span>
                      <span className="capitalize px-1 rounded bg-black/60 text-white/80 text-[9px]">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Card title & chapter count */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-bold text-foreground group-hover/card:text-primary transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        {item.chapter_count ? `${item.chapter_count} Ch.` : "Active"}
                      </span>
                      <span className="text-primary font-bold hover:underline">Read →</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Universe Dialog */}
      <ManageUniverseModal
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
        currentSeries={currentSeries}
        allConnected={allConnected}
        universeName={universeName}
        selectedPreset={selectedPreset}
        setSelectedPreset={setSelectedPreset}
        customUniverseName={customUniverseName}
        setCustomUniverseName={setCustomUniverseName}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        searchSeriesQuery={searchSeriesQuery}
        setSearchSeriesQuery={setSearchSeriesQuery}
        targetSeriesToAdd={targetSeriesToAdd}
        setTargetSeriesToAdd={setTargetSeriesToAdd}
        targetRole={targetRole}
        setTargetRole={setTargetRole}
        searchQ={searchQ}
        setUniverseMutation={setUniverseMutation}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Manage Universe Modal                                        */
/* ------------------------------------------------------------------ */

function ManageUniverseModal({
  open,
  onOpenChange,
  currentSeries,
  allConnected,
  universeName,
  selectedPreset,
  setSelectedPreset,
  customUniverseName,
  setCustomUniverseName,
  currentRole,
  setCurrentRole,
  searchSeriesQuery,
  setSearchSeriesQuery,
  targetSeriesToAdd,
  setTargetSeriesToAdd,
  targetRole,
  setTargetRole,
  searchQ,
  setUniverseMutation,
}: any) {
  const activeUniverse = customUniverseName.trim() || selectedPreset.trim() || universeName;

  const handleSaveCurrentSeries = () => {
    if (!activeUniverse) {
      toast.error("Please specify a universe name");
      return;
    }
    setUniverseMutation.mutate({
      universe: activeUniverse,
      role: currentRole,
      seriesId: currentSeries.id,
    });
  };

  const handleUnlinkCurrentSeries = () => {
    if (window.confirm(`Remove "${currentSeries.title}" from ${universeName}?`)) {
      setUniverseMutation.mutate({
        universe: null,
        role: null,
        seriesId: currentSeries.id,
      });
      onOpenChange(false);
    }
  };

  const handleAddTargetSeries = () => {
    if (!targetSeriesToAdd || !activeUniverse) return;
    setUniverseMutation.mutate({
      universe: activeUniverse,
      role: targetRole,
      seriesId: targetSeriesToAdd.id,
    });
  };

  const handleRemoveSeriesFromUniverse = (item: any) => {
    if (window.confirm(`Unlink "${item.title}" from ${activeUniverse}?`)) {
      setUniverseMutation.mutate({
        universe: null,
        role: null,
        seriesId: item.id,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto p-4 sm:p-6 bg-card border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-purple-400" /> Manage Shared Universe
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Associate titles belonging to the same continuous world, author canon, or franchise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section 1: Set Universe for Current Title */}
          <div className="p-3.5 rounded-xl border border-border/50 bg-secondary/30 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>Current Series:</span>
              <span className="text-purple-300 normal-case">{currentSeries.title}</span>
            </h4>

            {/* Quick preset selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Select Curated Universe or Type Custom
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_UNIVERSES.map((preset) => (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset.name);
                      setCustomUniverseName(preset.name);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      activeUniverse.toLowerCase() === preset.name.toLowerCase()
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-secondary/60 hover:bg-secondary border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Universe Name input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Universe Name</label>
                <Input
                  value={customUniverseName}
                  onChange={(e) => setCustomUniverseName(e.target.value)}
                  placeholder="e.g. PTJ Universe, Blue String..."
                  className="text-xs h-9 bg-background/60 border-border/50 focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Role / Order in Universe</label>
                <Select value={currentRole} onValueChange={setCurrentRole}>
                  <SelectTrigger className="text-xs h-9 bg-background/60 border-border/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSE_ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              {universeName ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlinkCurrentSeries}
                  disabled={setUniverseMutation.isPending}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Unlink From Universe
                </Button>
              ) : <div />}

              <Button
                type="button"
                size="sm"
                onClick={handleSaveCurrentSeries}
                disabled={!activeUniverse || setUniverseMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm gap-1.5 cursor-pointer"
              >
                {setUniverseMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save Universe Setting
              </Button>
            </div>
          </div>

          {/* Section 2: Link More Series to this Universe */}
          {activeUniverse && (
            <div className="p-3.5 rounded-xl border border-border/50 bg-secondary/30 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-purple-400" />
                <span>Link Another Series to "{activeUniverse}"</span>
              </h4>

              {/* Chosen target series */}
              {targetSeriesToAdd ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-purple-500/40 bg-purple-950/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative aspect-[2/3] w-8 rounded overflow-hidden bg-secondary shrink-0">
                      {targetSeriesToAdd.cover_url ? (
                        <Image
                          src={targetSeriesToAdd.cover_url}
                          alt={targetSeriesToAdd.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {targetSeriesToAdd.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {targetSeriesToAdd.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger className="text-[11px] h-8 w-28 bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIVERSE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddTargetSeries}
                      disabled={setUniverseMutation.isPending}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white h-8 px-2.5 cursor-pointer"
                    >
                      Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTargetSeriesToAdd(null)}
                      className="text-xs h-8 px-2 text-muted-foreground cursor-pointer"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchSeriesQuery}
                      onChange={(e) => setSearchSeriesQuery(e.target.value)}
                      placeholder="Search series title to add to universe..."
                      className="pl-8 text-xs h-8.5 bg-background/60 border-border/50"
                    />
                  </div>

                  {/* Dropdown list */}
                  {searchSeriesQuery.trim().length >= 2 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-border/40 bg-card p-1 shadow-lg scrollbar-thin">
                      {searchQ.isLoading ? (
                        <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" /> Searching...
                        </div>
                      ) : !searchQ.data || searchQ.data.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No matching series found.
                        </div>
                      ) : (
                        searchQ.data.map((item: any) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTargetSeriesToAdd(item)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-purple-950/30 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative aspect-[2/3] w-7 rounded overflow-hidden bg-secondary shrink-0">
                                {item.cover_url ? (
                                  <Image
                                    src={item.cover_url}
                                    alt={item.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground group-hover:text-purple-300 truncate">
                                  {item.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground">
                                  {item.universe ? `Currently in: ${item.universe}` : "No universe"}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-purple-400 font-bold shrink-0 ml-2">
                              + Select
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: List of currently connected series in this universe */}
          {activeUniverse && allConnected.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Titles in {activeUniverse} ({allConnected.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allConnected.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative aspect-[2/3] w-7 rounded overflow-hidden bg-secondary shrink-0">
                        {item.cover_url ? (
                          <Image
                            src={item.cover_url}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-purple-300">
                          {item.universe_role || "Connected Series"}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSeriesFromUniverse(item)}
                      disabled={setUniverseMutation.isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 cursor-pointer"
                      title="Unlink from universe"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
