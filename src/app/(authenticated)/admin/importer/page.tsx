"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Globe,
  Search,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  Tag,
  Check,
  ShieldAlert,
  Play,
  Zap,
  Clock,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $searchComickList,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
import {
  $previewComixMetadata,
  $importComixMetadataToSeries,
  $fetchComixChaptersList,
  $importComixChaptersToSeries,
  type ComixExtractedMetadata,
  type ComixChapterItem,
} from "@/lib/api/comix-import.actions";
import { $syncImportSource } from "@/lib/api/scraper.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SeriesOption {
  id: string;
  title: string;
  slug: string;
  cover_url?: string | null;
}

export default function MangaImporterPage() {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canOperate = isAdmin || isMod || isUploader;

  const [activeTab, setActiveTab] = useState<"metadata" | "chapters" | "sources">("metadata");

  // Database series list for linking
  const [dbSeries, setDbSeries] = useState<SeriesOption[]>([]);
  const [loadingDbSeries, setLoadingDbSeries] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [seriesSearchTerm, setSeriesSearchTerm] = useState("");

  // ── 1. METADATA IMPORTER STATE ──────────────────────────────────
  const [metaSource, setMetaSource] = useState<"comick" | "comix">("comick");
  const [metaQuery, setMetaQuery] = useState("");
  const [isSearchingMeta, setIsSearchingMeta] = useState(false);
  const [comickResults, setComickResults] = useState<ComickExtractedMetadata[]>([]);
  const [selectedComick, setSelectedComick] = useState<ComickExtractedMetadata | null>(null);
  const [comixResult, setComixResult] = useState<ComixExtractedMetadata | null>(null);
  const [metaApplying, setMetaApplying] = useState(false);

  // Granular options for metadata import
  const [optCover, setOptCover] = useState(true);
  const [optSynopsis, setOptSynopsis] = useState(true);
  const [optGenresTags, setOptGenresTags] = useState(true);
  const [optAltTitles, setOptAltTitles] = useState(true);
  const [optStatusType, setOptStatusType] = useState(true);

  // ── 2. CHAPTER IMPORTER STATE (COMIX.TO) ────────────────────────
  const [comixChapterUrl, setComixChapterUrl] = useState("");
  const [isFetchingChapters, setIsFetchingChapters] = useState(false);
  const [discoveredChapters, setDiscoveredChapters] = useState<ComixChapterItem[]>([]);
  const [selectedChapterNums, setSelectedChapterNums] = useState<Set<number>>(new Set());
  const [scanGroup, setScanGroup] = useState("Comix");
  const [autoSyncScheduled, setAutoSyncScheduled] = useState(true);
  const [isImportingChapters, setIsImportingChapters] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusMsg, setImportStatusMsg] = useState("");
  const [importLogs, setImportLogs] = useState<string[]>([]);

  // ── 3. SOURCES & TRACKING STATE ────────────────────────────────
  const [activeSources, setActiveSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

  // Load existing series from database
  const loadDbSeries = useCallback(async () => {
    try {
      setLoadingDbSeries(true);
      const { data, error } = await supabase
        .from("series")
        .select("id, title, slug, cover_url")
        .order("title", { ascending: true });
      if (!error && data) {
        setDbSeries(data);
      }
    } finally {
      setLoadingDbSeries(false);
    }
  }, []);

  // Load active import sources
  const loadSources = useCallback(async () => {
    try {
      setLoadingSources(true);
      const { data, error } = await supabase
        .from("series_import_sources")
        .select("*, series:series(id, title, slug, cover_url)")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setActiveSources(data);
      }
    } finally {
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    void loadDbSeries();
    void loadSources();
  }, [loadDbSeries, loadSources]);

  // Filtered DB series for dropdown
  const filteredDbSeries = dbSeries.filter((s) =>
    s.title.toLowerCase().includes(seriesSearchTerm.toLowerCase()),
  );

  // ── METADATA SEARCH ─────────────────────────────────────────────
  const handleSearchMetadata = async (targetSource?: "comick" | "comix") => {
    const src = targetSource || metaSource;
    const q = metaQuery.trim();
    if (!q) {
      toast.error("Please enter a title or URL to search");
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      setIsSearchingMeta(true);
      if (src === "comix") {
        const res = await $previewComixMetadata({
          data: { query: q, accessToken: session.access_token },
        });
        if (!res.success || !res.metadata) {
          setComixResult(null);
          toast.error(res.error || `No data found on Comix.to for "${q}"`);
        } else {
          setComixResult(res.metadata);
          toast.success(`Found "${res.metadata.title}" on Comix.to!`);
          // Also pre-fill chapter URL for chapter importer tab
          setComixChapterUrl(res.metadata.comixUrl);
        }
      } else {
        const res = await $searchComickList({
          data: { query: q, accessToken: session.access_token },
        });
        if (!res.success || !res.results || res.results.length === 0) {
          setComickResults([]);
          setSelectedComick(null);
          toast.error(res.error || `No results on Comick.dev for "${q}". Try switching to Comix.to!`);
        } else {
          setComickResults(res.results);
          setSelectedComick(res.results[0]);
          toast.success(`Found ${res.results.length} series on Comick!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search metadata");
    } finally {
      setIsSearchingMeta(false);
    }
  };

  // ── APPLY METADATA TO SERIES ───────────────────────────────────
  const handleApplyMetadata = async () => {
    if (!selectedSeriesId) {
      toast.error("Please select a target series in your database first");
      return;
    }

    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.access_token) {
      toast.error("Please sign in");
      return;
    }

    try {
      setMetaApplying(true);
      if (metaSource === "comix") {
        if (!comixResult) {
          toast.error("Please search and inspect a Comix.to series first");
          return;
        }

        const res = await $importComixMetadataToSeries({
          data: {
            seriesId: selectedSeriesId,
            accessToken: session.access_token,
            overrideMetadata: comixResult,
            importCover: optCover,
            importSynopsis: optSynopsis,
            importGenresAndTags: optGenresTags,
            importAlternativeTitles: optAltTitles,
            importStatusAndType: optStatusType,
          },
        });

        if (res.success) {
          toast.success(res.message || "Comix.to metadata applied successfully!");
          void loadDbSeries();
        } else {
          toast.error(res.error || "Failed to apply Comix.to metadata");
        }
      } else {
        if (!selectedComick) {
          toast.error("Please select a series from Comick search results first");
          return;
        }

        const res = await $importComickMetadataToSeries({
          data: {
            seriesId: selectedSeriesId,
            accessToken: session.access_token,
            overrideMetadata: selectedComick,
            importCover: optCover,
            importSynopsis: optSynopsis,
            importGenresAndTags: optGenresTags,
            importAlternativeTitles: optAltTitles,
          },
        });

        if (res.success) {
          toast.success(res.message || "Comick.dev metadata applied successfully!");
          void loadDbSeries();
        } else {
          toast.error(res.error || "Failed to apply Comick.dev metadata");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to apply metadata");
    } finally {
      setMetaApplying(false);
    }
  };

  // ── CHAPTER DISCOVERY (COMIX.TO) ───────────────────────────────
  const handleInspectChapters = async () => {
    let url = comixChapterUrl.trim();
    if (!url) {
      // If user selected a DB series, check if it has a comix source
      const matchedSource = activeSources.find(
        (s) => s.series_id === selectedSeriesId && s.source_url?.includes("comix.to"),
      );
      if (matchedSource?.source_url) {
        url = matchedSource.source_url;
        setComixChapterUrl(url);
      }
    }

    if (!url) {
      toast.error("Please enter a Comix.to series URL (e.g. https://comix.to/title/...)");
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      setIsFetchingChapters(true);
      const res = await $fetchComixChaptersList({
        data: { seriesUrl: url, accessToken: session.access_token },
      });

      if (!res.success || !res.chapters || res.chapters.length === 0) {
        setDiscoveredChapters([]);
        setSelectedChapterNums(new Set());
        toast.error(res.error || "No chapters could be discovered for this URL");
      } else {
        setDiscoveredChapters(res.chapters);
        // Default select all discovered
        setSelectedChapterNums(new Set(res.chapters.map((c) => c.chapterNumber)));
        toast.success(`Discovered ${res.chapters.length} chapter(s) from Comix.to!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to discover chapters");
    } finally {
      setIsFetchingChapters(false);
    }
  };

  // ── IMPORT SELECTED CHAPTERS ────────────────────────────────────
  const handleImportSelectedChapters = async () => {
    if (!selectedSeriesId) {
      toast.error("Please choose which series to import chapters into");
      return;
    }

    if (selectedChapterNums.size === 0) {
      toast.error("Please select at least one chapter to import");
      return;
    }

    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.access_token) {
      toast.error("Please sign in");
      return;
    }

    const chaptersToImport = discoveredChapters.filter((c) =>
      selectedChapterNums.has(c.chapterNumber),
    );

    try {
      setIsImportingChapters(true);
      setImportProgress(10);
      setImportStatusMsg(`Preparing import for ${chaptersToImport.length} chapter(s)...`);
      setImportLogs([`Starting import of ${chaptersToImport.length} chapters...`]);

      const res = await $importComixChaptersToSeries({
        data: {
          seriesId: selectedSeriesId,
          chapters: chaptersToImport,
          scanlationGroup: scanGroup || "Comix",
          enableAutoSync: autoSyncScheduled,
          seriesUrl: comixChapterUrl.trim(),
          accessToken: session.access_token,
        },
      });

      setImportProgress(100);
      if (res.success) {
        toast.success(res.message || "Chapters imported successfully!");
        setImportStatusMsg(`Done! Imported ${res.importedCount} chapters.`);
        setImportLogs((prev) => [
          ...prev,
          `✓ Imported: ${res.importedCount} chapters`,
          `⏭ Skipped existing: ${res.skippedCount} chapters`,
          ...(res.errors || []).map((e) => `⚠️ ${e}`),
        ]);
        void loadSources();
      } else {
        toast.error(res.error || "Failed to import chapters");
        setImportStatusMsg("Import encountered errors.");
        setImportLogs((prev) => [...prev, `❌ Error: ${res.error}`]);
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
      setImportStatusMsg("Failed.");
    } finally {
      setIsImportingChapters(false);
    }
  };

  // ── TRIGGER MANUAL SYNC FOR A SOURCE ───────────────────────────
  const handleSyncSourceNow = async (sourceId: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      setSyncingSourceId(sourceId);
      toast.info("Starting background synchronization...");
      const res = await $syncImportSource({
        data: { sourceId, accessToken: session.access_token, maxChapters: 50 },
      });

      if (res.success) {
        toast.success(`Source synchronized! Imported ${res.imported ?? 0} new chapter(s).`);
        void loadSources();
      } else {
        toast.error(res.error || "Sync failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncingSourceId(null);
    }
  };

  if (!canOperate) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Admin or uploader permissions are required to access Manga Importer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-purple-950/40 via-background to-blue-950/20 p-6 md:p-8 backdrop-blur-xl shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600/30 text-purple-300 border-purple-500/40 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Dual Source Hub
              </Badge>
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                Comick.dev & Comix.to
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Globe className="h-7 w-7 text-purple-400" />
              Manga Importer & Tracker
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              <span className="text-purple-300 font-semibold">Comick.dev</span> is the default tracker for rich metadata (covers, taxonomy tags, all genres, synopsis). <span className="text-blue-300 font-semibold">Comix.to</span> provides direct high-speed chapter scraping with Cloudflare stealth and serves as an instant fallback when Comick lacks scans.
            </p>
          </div>

          {/* Quick Target Series Selector in Header */}
          <div className="bg-card/70 border border-border/40 rounded-xl p-3 min-w-[280px] shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] font-semibold text-neutral-300">Target Database Series:</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-white"
                onClick={loadDbSeries}
              >
                <RefreshCw className={`h-3 w-3 ${loadingDbSeries ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
              <SelectTrigger className="h-9 text-xs bg-neutral-900/80 border-neutral-800 text-white rounded-lg">
                <SelectValue placeholder="Select target series..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <div className="p-1 border-b border-border/30">
                  <Input
                    placeholder="Filter series..."
                    value={seriesSearchTerm}
                    onChange={(e) => setSeriesSearchTerm(e.target.value)}
                    className="h-7 text-xs bg-neutral-900"
                  />
                </div>
                {filteredDbSeries.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("metadata")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "metadata"
              ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm"
              : "text-muted-foreground hover:text-white hover:bg-card/50 border border-transparent"
          }`}
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Metadata Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chapters")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "chapters"
              ? "bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-sm"
              : "text-muted-foreground hover:text-white hover:bg-card/50 border border-transparent"
          }`}
        >
          <Zap className="h-4 w-4 text-blue-400" />
          <span>Comix.to Chapter Importer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sources")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sources"
              ? "bg-emerald-600/20 text-emerald-200 border border-emerald-500/40 shadow-sm"
              : "text-muted-foreground hover:text-white hover:bg-card/50 border border-transparent"
          }`}
        >
          <Clock className="h-4 w-4 text-emerald-400" />
          <span>Auto-Sync Hub ({activeSources.length})</span>
        </button>
      </div>

      {/* ── TAB 1: METADATA EXPLORER ────────────────────────────────── */}
      {activeTab === "metadata" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Search & Options */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                  <span>Source & Search</span>
                  {/* Source Switcher */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setMetaSource("comick")}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        metaSource === "comick"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      Comick.dev
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetaSource("comix")}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        metaSource === "comix"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      Comix.to
                    </button>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs">
                  {metaSource === "comick"
                    ? "Searches Comick's comprehensive index for rich metadata & all taxonomy tags."
                    : "Inspects Comix.to series page directly. Use title or direct comix.to/title/... URL."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={metaQuery}
                    onChange={(e) => setMetaQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchMetadata()}
                    placeholder={
                      metaSource === "comix"
                        ? "Enter title name or comix.to/title/... URL"
                        : "Enter comic name (e.g. Solo Leveling, Eleceed)..."
                    }
                    className="h-10 text-sm bg-neutral-900/90 border-neutral-800 focus:border-purple-500"
                  />
                  <Button
                    onClick={() => handleSearchMetadata()}
                    disabled={isSearchingMeta || !metaQuery.trim()}
                    className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                  >
                    {isSearchingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Granular Update Checkboxes */}
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <span className="text-xs font-semibold text-neutral-300">Fields to Synchronize:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <Checkbox checked={optCover} onCheckedChange={(v) => setOptCover(!!v)} />
                      <span>HD Cover Art</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <Checkbox checked={optSynopsis} onCheckedChange={(v) => setOptSynopsis(!!v)} />
                      <span>Synopsis / Description</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <Checkbox checked={optGenresTags} onCheckedChange={(v) => setOptGenresTags(!!v)} />
                      <span>Genres & Taxonomy Tags</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <Checkbox checked={optAltTitles} onCheckedChange={(v) => setOptAltTitles(!!v)} />
                      <span>Alternative Titles</span>
                    </label>
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  onClick={handleApplyMetadata}
                  disabled={metaApplying || !selectedSeriesId || (metaSource === "comick" ? !selectedComick : !comixResult)}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md cursor-pointer transition-all"
                >
                  {metaApplying ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Applying to Series...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Apply Metadata to Selected Series</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Comick Results Picker List if multiple results */}
            {metaSource === "comick" && comickResults.length > 0 && (
              <Card className="border-border/40 bg-card/60">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Comick Matches ({comickResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
                  {comickResults.map((c) => {
                    const isSel = selectedComick?.slug === c.slug;
                    return (
                      <div
                        key={c.slug}
                        onClick={() => setSelectedComick(c)}
                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                          isSel
                            ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500"
                            : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        {c.coverUrl ? (
                          <img
                            src={c.coverUrl}
                            alt={c.title}
                            className="h-12 w-9 object-cover rounded-md bg-secondary shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="h-12 w-9 bg-neutral-800 rounded-md flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-neutral-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{c.title}</h4>
                          <span className="text-[11px] text-muted-foreground">{c.releaseYear || "N/A"}</span>
                        </div>
                        {isSel && <Check className="h-4 w-4 text-purple-400 shrink-0" />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Live Metadata Preview Card */}
          <div className="lg:col-span-7">
            {metaSource === "comick" && selectedComick && (
              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {selectedComick.coverUrl && (
                      <img
                        src={selectedComick.coverUrl}
                        alt={selectedComick.title}
                        className="w-36 h-52 object-cover rounded-xl border border-border/50 shadow-md shrink-0 self-center sm:self-start"
                      />
                    )}
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-[10px] capitalize">
                          Comick.dev
                        </Badge>
                        {selectedComick.status && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {selectedComick.status}
                          </Badge>
                        )}
                        {selectedComick.releaseYear && (
                          <span className="text-xs text-muted-foreground">{selectedComick.releaseYear}</span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{selectedComick.title}</h2>
                      {selectedComick.alternativeTitles && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <span className="font-semibold text-neutral-300">Alts:</span> {selectedComick.alternativeTitles}
                        </p>
                      )}
                      {(selectedComick.author || selectedComick.artist) && (
                        <div className="text-xs text-neutral-300 flex items-center gap-3">
                          {selectedComick.author && <span>Author: <strong>{selectedComick.author}</strong></span>}
                          {selectedComick.artist && <span>Artist: <strong>{selectedComick.artist}</strong></span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Genres and Tags */}
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    {selectedComick.genres && selectedComick.genres.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-300">Genres ({selectedComick.genres.length}):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedComick.genres.map((g) => (
                            <Badge key={g} className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[11px]">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedComick.tags && selectedComick.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-300">Rich Taxonomy Tags ({selectedComick.tags.length}):</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {selectedComick.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] text-neutral-400 border-border/50">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synopsis */}
                  {selectedComick.description && (
                    <div className="space-y-1.5 pt-3 border-t border-border/40">
                      <span className="text-xs font-semibold text-neutral-300">Synopsis:</span>
                      <p className="text-xs text-neutral-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line font-normal">
                        {selectedComick.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {metaSource === "comix" && comixResult && (
              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {comixResult.coverUrl && (
                      <img
                        src={comixResult.coverUrl}
                        alt={comixResult.title}
                        className="w-36 h-52 object-cover rounded-xl border border-border/50 shadow-md shrink-0 self-center sm:self-start"
                      />
                    )}
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-[10px] capitalize">
                          Comix.to
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {comixResult.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {comixResult.status}
                        </Badge>
                        {comixResult.releaseYear && (
                          <span className="text-xs text-muted-foreground">{comixResult.releaseYear}</span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{comixResult.title}</h2>
                      {comixResult.alternativeTitles && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <span className="font-semibold text-neutral-300">Alts:</span> {comixResult.alternativeTitles}
                        </p>
                      )}
                      <div className="text-xs text-neutral-300 flex items-center gap-3">
                        {comixResult.author && <span>Author: <strong>{comixResult.author}</strong></span>}
                        {comixResult.artist && <span>Artist: <strong>{comixResult.artist}</strong></span>}
                        {comixResult.latestChapter && <span>Latest: <strong>Ch.{comixResult.latestChapter}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Genres & Tags */}
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    {comixResult.genres && comixResult.genres.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-300">Genres ({comixResult.genres.length}):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comixResult.genres.map((g) => (
                            <Badge key={g} className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[11px]">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {comixResult.tags && comixResult.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-300">Tags ({comixResult.tags.length}):</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {comixResult.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] text-neutral-400 border-border/50">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synopsis */}
                  {comixResult.description && (
                    <div className="space-y-1.5 pt-3 border-t border-border/40">
                      <span className="text-xs font-semibold text-neutral-300">Synopsis:</span>
                      <p className="text-xs text-neutral-300 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line font-normal">
                        {comixResult.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {!selectedComick && !comixResult && (
              <div className="border border-dashed border-border/50 rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-200">No Series Selected</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Search by title keyword or paste a URL above to inspect official metadata, covers, genres, and tags.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: COMIX.TO CHAPTER IMPORTER ────────────────────────── */}
      {activeTab === "chapters" && (
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <span>Comix.to Direct Chapter Scraper & Importer</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Extracts chapters from Comix.to using stealth browser routing. Reader images are fetched at maximum resolution without Cloudflare blocks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    value={comixChapterUrl}
                    onChange={(e) => setComixChapterUrl(e.target.value)}
                    placeholder="https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story"
                    className="h-10 text-sm bg-neutral-900 border-neutral-800 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
                <Button
                  onClick={handleInspectChapters}
                  disabled={isFetchingChapters || !comixChapterUrl.trim()}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shrink-0"
                >
                  {isFetchingChapters ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scanning Comix...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <span>Inspect Chapters</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Progress & Log Card if importing */}
              {isImportingChapters && (
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
                    <span>{importStatusMsg}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2 bg-neutral-800" />
                </div>
              )}

              {importLogs.length > 0 && !isImportingChapters && (
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 max-h-32 overflow-y-auto space-y-1">
                  {importLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}

              {/* Discovered Chapters Table */}
              {discoveredChapters.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        Discovered Chapters ({discoveredChapters.length})
                      </span>
                      <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/30">
                        {selectedChapterNums.size} Selected
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-neutral-800 hover:bg-neutral-800"
                        onClick={() => setSelectedChapterNums(new Set(discoveredChapters.map((c) => c.chapterNumber)))}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-neutral-800 hover:bg-neutral-800"
                        onClick={() => setSelectedChapterNums(new Set())}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/40 overflow-hidden max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-neutral-900/80 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-12 text-center">
                            <Checkbox
                              checked={selectedChapterNums.size === discoveredChapters.length && discoveredChapters.length > 0}
                              onCheckedChange={(v) => {
                                if (v) {
                                  setSelectedChapterNums(new Set(discoveredChapters.map((c) => c.chapterNumber)));
                                } else {
                                  setSelectedChapterNums(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="w-24">Chapter #</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discoveredChapters.map((ch) => {
                          const isChecked = selectedChapterNums.has(ch.chapterNumber);
                          return (
                            <TableRow key={ch.url} className={isChecked ? "bg-blue-950/10" : ""}>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(v) => {
                                    const next = new Set(selectedChapterNums);
                                    if (v) next.add(ch.chapterNumber);
                                    else next.delete(ch.chapterNumber);
                                    setSelectedChapterNums(next);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-bold text-white text-xs">
                                Ch.{ch.chapterNumber}
                              </TableCell>
                              <TableCell className="text-xs text-neutral-300">
                                {ch.title || `Chapter ${ch.chapterNumber}`}
                              </TableCell>
                              <TableCell className="text-right">
                                <a
                                  href={ch.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                                >
                                  <span>Source</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Options & Action Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-card/60 border border-border/40">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-neutral-300">Group:</Label>
                        <Input
                          value={scanGroup}
                          onChange={(e) => setScanGroup(e.target.value)}
                          className="h-8 w-28 text-xs bg-neutral-900 border-neutral-800"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                        <Checkbox
                          checked={autoSyncScheduled}
                          onCheckedChange={(v) => setAutoSyncScheduled(!!v)}
                        />
                        <span>Enable automated daily sync for this series</span>
                      </label>
                    </div>

                    <Button
                      onClick={handleImportSelectedChapters}
                      disabled={isImportingChapters || selectedChapterNums.size === 0 || !selectedSeriesId}
                      className="h-10 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold cursor-pointer shadow-md text-xs shrink-0"
                    >
                      {isImportingChapters ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Importing...</span>
                        </div>
                      ) : (
                        <span>Import {selectedChapterNums.size} Selected Chapter(s)</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: AUTO-SYNC SOURCES HUB ────────────────────────────── */}
      {activeTab === "sources" && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <span>Configured Manga Sources & Scheduled Sync</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Series configured with Comix.to and other upstream sources. Background cron jobs poll these sources to discover and upload new releases automatically.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSources}
                className="h-8 text-xs gap-1.5 border-border/50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSources ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeSources.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No active import sources configured yet. Link a series in the Chapter Importer tab with "Enable automated sync".
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-900/80">
                    <TableRow>
                      <TableHead>Series Title</TableHead>
                      <TableHead>Source Provider</TableHead>
                      <TableHead>Source URL</TableHead>
                      <TableHead>Scan Group</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSources.map((src) => {
                      const isSyncing = syncingSourceId === src.id;
                      return (
                        <TableRow key={src.id}>
                          <TableCell className="font-bold text-white text-xs">
                            {src.series?.title || src.series_id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                src.source_site?.toLowerCase().includes("comix")
                                  ? "bg-blue-600/20 text-blue-300 border-blue-500/30 text-[10px]"
                                  : "bg-purple-600/20 text-purple-300 border-purple-500/30 text-[10px]"
                              }
                            >
                              {src.source_site || "Direct"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-neutral-400 max-w-xs truncate">
                            <a
                              href={src.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{src.source_url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </TableCell>
                          <TableCell className="text-xs text-neutral-300">
                            {src.scanlation_group || "Default"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncSourceNow(src.id)}
                              disabled={isSyncing}
                              className="h-7 text-xs border-neutral-800 hover:bg-neutral-800 text-neutral-200"
                            >
                              {isSyncing ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Play className="h-3 w-3 mr-1 text-emerald-400" />
                              )}
                              <span>Sync Now</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
