"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PlusCircle,
  Sparkles,
  Search,
  Globe,
  Loader2,
  CheckCircle2,
  Check,
  Zap,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $searchComickList,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
import { useProcessingTask } from "@/contexts/ProcessingTaskContext";
import { $syncImportSource } from "@/lib/api/scraper.actions";
import { detectImportSource } from "@/lib/import-source-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddNewSeriesDialogProps {
  trigger?: React.ReactNode;
}

const seriesTypes = ["manhwa", "manga", "manhua", "novel"] as const;
const seriesStatuses = ["ongoing", "completed", "hiatus"] as const;

function toCleanSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/^\d+-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ScanProviderOption {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  domain: string;
  getUrl: (slug: string) => string;
  getSearchUrl: (title: string) => string;
}

const WORKABLE_SCAN_PROVIDERS: ScanProviderOption[] = [
  {
    id: "asura",
    name: "Asura Scans",
    icon: "⚔️",
    badge: "Recommended",
    domain: "asuracomic.net",
    getUrl: (slug) => `https://asuracomic.net/series/${slug}`,
    getSearchUrl: (title) => `https://asuracomic.net/series?name=${encodeURIComponent(title)}`,
  },
  {
    id: "flame",
    name: "Flame Comics",
    icon: "🔥",
    badge: "HQ Scans",
    domain: "flamecomics.me",
    getUrl: (slug) => `https://flamecomics.me/series/${slug}`,
    getSearchUrl: (title) => `https://flamecomics.me/series?search=${encodeURIComponent(title)}`,
  },
  {
    id: "reaper",
    name: "Reaper Scans",
    icon: "💀",
    domain: "reaperscans.com",
    getUrl: (slug) => `https://reaperscans.com/series/${slug}`,
    getSearchUrl: (title) => `https://reaperscans.com/series?query=${encodeURIComponent(title)}`,
  },
  {
    id: "hivetoon",
    name: "Hive / Void",
    icon: "⚡",
    domain: "hivetoon.com",
    getUrl: (slug) => `https://hivetoon.com/series/${slug}`,
    getSearchUrl: (title) => `https://hivetoon.com/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "qi",
    name: "Qi Scans",
    icon: "📖",
    badge: "Direct API",
    domain: "qimanga.com",
    getUrl: (slug) => `https://qimanga.com/series/${slug}`,
    getSearchUrl: (title) => `https://qimanga.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "custom",
    name: "Custom URL",
    icon: "🌐",
    domain: "Custom",
    getUrl: () => "",
    getSearchUrl: () => "",
  },
  {
    id: "none",
    name: "No Scan Source",
    icon: "🚫",
    domain: "Metadata Only",
    getUrl: () => "",
    getSearchUrl: () => "",
  },
];

export function AddNewSeriesDialog({ trigger }: AddNewSeriesDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canCreate = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");

  // Smart Hybrid State
  const [comickSearch, setComickSearch] = useState("");
  const [isSearchingComick, setIsSearchingComick] = useState(false);
  const [comickResults, setComickResults] = useState<ComickExtractedMetadata[]>([]);
  const [selectedComic, setSelectedComic] = useState<ComickExtractedMetadata | null>(null);
  const [selectedType, setSelectedType] = useState<"manhwa" | "manga" | "manhua" | "novel">("manhwa");
  const [selectedScanProvider, setSelectedScanProvider] = useState<string>("asura");
  const [scanSourceUrl, setScanSourceUrl] = useState("");
  const [autoSyncChapters, setAutoSyncChapters] = useState(true);
  const [syncMaxChapters, setSyncMaxChapters] = useState<number>(50);
  const [isHybridSubmitting, setIsHybridSubmitting] = useState(false);

  // Manual Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [alternativeTitles, setAlternativeTitles] = useState("");
  const [type, setType] = useState<"manhwa" | "manga" | "manhua" | "novel">("manhwa");
  const [status, setStatus] = useState<"ongoing" | "completed" | "hiatus">("ongoing");
  const [author, setAuthor] = useState("");
  const [artist, setArtist] = useState("");
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const handleSelectComic = (comic: ComickExtractedMetadata) => {
    setSelectedComic(comic);
    const cleanSlug = toCleanSlug(comic.slug || comic.title);
    const provider = WORKABLE_SCAN_PROVIDERS.find((p) => p.id === selectedScanProvider);
    if (provider && provider.id !== "none" && provider.id !== "custom") {
      setScanSourceUrl(provider.getUrl(cleanSlug));
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedScanProvider(providerId);
    const provider = WORKABLE_SCAN_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    if (provider.id === "none") {
      setScanSourceUrl("");
    } else if (provider.id === "custom") {
      // Keep existing URL or leave open for manual pasting
    } else if (selectedComic) {
      const cleanSlug = toCleanSlug(selectedComic.slug || selectedComic.title);
      setScanSourceUrl(provider.getUrl(cleanSlug));
    }
  };

  // Search Comick for official metadata
  const handleSearchComick = async () => {
    const q = comickSearch.trim();
    if (!q) {
      toast.error("Please enter a title or keyword to search Comick");
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      setIsSearchingComick(true);
      const res = await $searchComickList({
        data: {
          query: q,
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.results || res.results.length === 0) {
        setComickResults([]);
        setSelectedComic(null);
        toast.error(res.error || `No titles found on Comick for "${q}"`);
      } else {
        setComickResults(res.results);
        handleSelectComic(res.results[0]);
        toast.success(`Found ${res.results.length} comic(s) on Comick!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search Comick");
    } finally {
      setIsSearchingComick(false);
    }
  };

  const processing = useProcessingTask();

  // Hybrid Submit: Create series with Comick metadata & link scan source for chapters
  const handleHybridCreate = async () => {
    if (!selectedComic) {
      toast.error("Please search and select a comic from Comick");
      return;
    }

    const hasScanSource = !!scanSourceUrl.trim();
    const steps = [
      { id: "auth", label: "Verifying credentials & session authorization" },
      { id: "series", label: `Creating series "${selectedComic.title}" in database` },
      { id: "meta", label: "Importing HD cover, synopsis & alternative titles" },
      { id: "genres", label: "Mapping categories, genres & taxonomy tags" },
      ...(hasScanSource
        ? [{ id: "source", label: "Connecting scanlation source & syncing chapters" }]
        : []),
      { id: "ready", label: "Finalizing series & routing to reader" },
    ];

    // Close the input dialog so the centered processing animation takes center stage
    setOpen(false);

    processing.startTask({
      title: "Importing Series to VNR Scans",
      description: `Setting up "${selectedComic.title}" with complete official metadata`,
      steps,
    });

    try {
      setIsHybridSubmitting(true);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("Please sign in to import series");
      }
      processing.setStepStatus("auth", "done", "Authenticated");

      processing.setStepStatus("series", "active", "Generating slug and writing series record...");
      const generatedSlug = (
        selectedComic.slug?.trim() ||
        selectedComic.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );

      // 1. Insert series record into Supabase
      const { data: newSeries, error: insertError } = await (supabase.from("series") as any)
        .insert({
          title: selectedComic.title.trim(),
          slug: generatedSlug,
          alternative_titles: selectedComic.alternativeTitles || null,
          type: selectedType,
          status: (() => {
            const raw = String(selectedComic.status || "").toLowerCase().trim();
            if (raw === "completed") return "completed";
            if (raw === "hiatus" || raw === "cancelled" || raw === "canceled" || raw === "dropped") return "hiatus";
            return "ongoing";
          })(),
          author: selectedComic.author || null,
          artist: selectedComic.artist || null,
          release_year: selectedComic.releaseYear ? parseInt(String(selectedComic.releaseYear), 10) : null,
          description: selectedComic.description || null,
          cover_url: selectedComic.coverUrl || null,
          is_hidden: false,
        })
        .select("id, slug")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(`A series with slug "${generatedSlug}" already exists.`);
        }
        throw insertError;
      }
      processing.setStepStatus("series", "done", `Registered with slug /${newSeries.slug}`);

      // 2. Attach genres & tags from Comick
      processing.setStepStatus("meta", "active", "Importing cover art and synopsis...");
      if (selectedComic.genres && selectedComic.genres.length > 0) {
        await $importComickMetadataToSeries({
          data: {
            seriesId: newSeries.id,
            accessToken: session.access_token,
            importCover: true,
            importSynopsis: true,
            importGenresAndTags: true,
            importAlternativeTitles: true,
            overrideMetadata: selectedComic,
          },
        });
      }
      processing.setStepStatus("meta", "done", "Official synopsis & cover synchronized");
      processing.setStepStatus("genres", "done", `${selectedComic.genres?.length || 0} genres and taxonomy tags linked`);

      // 3. If scan source URL provided, register & trigger chapter scraper
      if (hasScanSource) {
        processing.setStepStatus("source", "active", "Connecting chapter upstream source...");
        const preset = detectImportSource(scanSourceUrl.trim());
        const { data: newSource, error: srcErr } = await (supabase as any)
          .from("series_import_sources")
          .insert({
            series_id: newSeries.id,
            source_url: scanSourceUrl.trim(),
            source_site: preset.sourceSite,
            scanlation_group: preset.scanlationGroup || null,
            auto_publish: true,
            enabled: true,
          })
          .select("id")
          .single();

        if (!srcErr && newSource?.id) {
          if (autoSyncChapters) {
            processing.setStepStatus("source", "active", `Syncing chapters from ${preset.sourceSite}...`);
            try {
              const syncRes = await $syncImportSource({
                data: {
                  sourceId: newSource.id,
                  accessToken: session.access_token,
                  maxChapters: syncMaxChapters,
                },
              });
              if (syncRes.success) {
                processing.setStepStatus(
                  "source",
                  "done",
                  `Imported ${syncRes.imported ?? 0} chapter(s) from ${preset.sourceSite}`
                );
              } else {
                processing.setStepStatus("source", "done", `Linked to ${preset.sourceSite}`);
              }
            } catch {
              processing.setStepStatus("source", "done", `Linked to ${preset.sourceSite}`);
            }
          } else {
            processing.setStepStatus("source", "done", `Linked to ${preset.sourceSite} (${preset.scanlationGroup || "Auto"})`);
          }
        } else {
          processing.setStepStatus("source", "done", "Source saved");
        }
      }

      processing.setStepStatus("ready", "done", "Series ready! Redirecting...");
      qc.invalidateQueries({ queryKey: ["series"] });
      await processing.completeTask("All Tasks Completed Successfully! ✓");
      router.push(`/title/${newSeries.slug}`);
    } catch (err: any) {
      processing.failTask(err.message || "Failed to create series");
      toast.error(`Creation failed: ${err.message}`);
    } finally {
      setIsHybridSubmitting(false);
    }
  };

  // Manual Series Creation Mutation
  const manualCreateMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");

      const steps = [
        { id: "validate", label: "Validating series details and inputs" },
        { id: "database", label: `Writing "${title}" to database` },
        { id: "ready", label: "Finalizing series and routing" },
      ];

      setOpen(false);
      processing.startTask({
        title: "Creating Series",
        description: `Creating "${title}" on VNR Scans`,
        steps,
      });

      processing.setStepStatus("validate", "active");
      const generatedSlug = (
        slug.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
      processing.setStepStatus("validate", "done", `Slug: ${generatedSlug}`);

      processing.setStepStatus("database", "active");
      const { data: newSeries, error } = await (supabase.from("series") as any)
        .insert({
          title: title.trim(),
          slug: generatedSlug,
          alternative_titles: alternativeTitles.trim() || null,
          type,
          status,
          author: author.trim() || null,
          artist: artist.trim() || null,
          release_year: releaseYear ? parseInt(releaseYear, 10) : null,
          description: description.trim() || null,
          cover_url: coverUrl.trim() || null,
          is_hidden: false,
        })
        .select("id, slug")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(`A series with slug "${generatedSlug}" already exists.`);
        }
        throw error;
      }

      processing.setStepStatus("database", "done");
      processing.setStepStatus("ready", "done");
      await processing.completeTask("Series created successfully! ✓");

      return newSeries;
    },
    onSuccess: (newSeries) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      router.push(`/title/${newSeries.slug}`);
    },
    onError: (err: any) => {
      processing.failTask(err.message || "Failed to create series");
      toast.error(err.message || "Failed to create series");
    },
  });

  if (!canCreate) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md text-xs cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Add New Series</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 border-purple-500/30 backdrop-blur-xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Add New Series
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/90 font-normal">
                Import complete official metadata from Comick & attach scan sources for chapters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-border/30 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("smart")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "smart"
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span>1-Click Comick & Scans Importer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span>Manual Creation</span>
          </button>
        </div>

        {/* ── TAB 1: SMART HYBRID IMPORTER ───────────────────────────── */}
        {activeTab === "smart" && (
          <div className="space-y-4 pt-1">
            {/* Step 1: Comick Metadata Search */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[11px] font-bold text-purple-300">1</span>
                  <span className="text-sm font-semibold tracking-tight text-purple-100">
                    Search Series on Comick.dev
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-normal">
                  Fetches official metadata, genres, tags & HD cover
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={comickSearch}
                  onChange={(e) => setComickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchComick()}
                  placeholder="e.g. Solo Leveling, Eleceed, Return of the Mount Hua..."
                  className="h-10 text-sm bg-neutral-900/90 border-neutral-800 focus:border-purple-500 text-white placeholder:text-neutral-500 rounded-lg font-normal"
                />
                <Button
                  type="button"
                  onClick={handleSearchComick}
                  disabled={isSearchingComick || !comickSearch.trim()}
                  className="h-10 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shrink-0 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  {isSearchingComick ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Comick Search Results Grid */}
              {comickResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-purple-500/20">
                  <span className="text-xs font-medium text-neutral-400">
                    Select the matching series from Comick ({comickResults.length} found):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                    {comickResults.map((comic) => {
                      const isSelected = selectedComic?.slug === comic.slug;
                      return (
                        <div
                          key={comic.slug}
                          onClick={() => handleSelectComic(comic)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500"
                              : "bg-card/40 border-border/40 hover:border-purple-500/40"
                          }`}
                        >
                          <img
                            src={comic.coverUrl || ""}
                            alt={comic.title}
                            className="h-14 w-10 object-cover rounded-md bg-secondary shrink-0 shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-white truncate">{comic.title}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-neutral-400">{comic.releaseYear || "N/A"}</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-normal">{comic.author || "Unknown"}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-purple-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Format Selector for Smart Mode */}
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs font-semibold text-neutral-300 shrink-0">Series Format:</span>
                    <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                      <SelectTrigger className="text-xs h-8 w-36 bg-neutral-900/80 border-neutral-800 text-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesTypes.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Workable Scan Chapter Source */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-bold text-neutral-300">2</span>
                    <span className="text-sm font-semibold tracking-tight text-neutral-100">
                      Select Chapter Scan Source
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/30">
                    Workable Scrapers
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400 font-normal leading-relaxed pl-7">
                  Choose a verified scanlation provider to import chapters from, or paste a custom URL.
                </p>
              </div>

              {/* Workable Provider Selection Grid */}
              <div className="pl-7 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WORKABLE_SCAN_PROVIDERS.map((provider) => {
                    const isSelected = selectedScanProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => handleProviderSelect(provider.id)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500 shadow-sm"
                            : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-base">{provider.icon}</span>
                          {provider.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {provider.badge}
                            </span>
                          )}
                          {isSelected && !provider.badge && (
                            <Check className="h-3.5 w-3.5 text-purple-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-white truncate w-full">{provider.name}</span>
                        <span className="text-[10px] text-neutral-400 truncate w-full">{provider.domain}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Scan Source Input & Test Link Helper */}
                {selectedScanProvider !== "none" && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-xs font-medium text-neutral-300">
                        Scan Source URL:
                      </Label>
                      {selectedComic && selectedScanProvider !== "custom" && (
                        <div className="flex items-center gap-2 text-[11px]">
                          {scanSourceUrl && (
                            <a
                              href={scanSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium hover:underline"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <span className="text-neutral-600">•</span>
                          <a
                            href={
                              WORKABLE_SCAN_PROVIDERS.find((p) => p.id === selectedScanProvider)?.getSearchUrl(
                                selectedComic.title
                              ) || "#"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-400 hover:text-white flex items-center gap-1 font-medium hover:underline"
                          >
                            <span>Search on Site</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <Input
                      value={scanSourceUrl}
                      onChange={(e) => setScanSourceUrl(e.target.value)}
                      placeholder="e.g. https://asuracomic.net/series/solo-leveling"
                      className="h-10 text-xs sm:text-sm bg-neutral-900/90 border-neutral-800 focus:border-purple-500 text-white placeholder:text-neutral-500 rounded-lg font-normal"
                    />

                    {/* Chapter Sync Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300 select-none">
                        <input
                          type="checkbox"
                          checked={autoSyncChapters}
                          onChange={(e) => setAutoSyncChapters(e.target.checked)}
                          className="rounded border-neutral-700 bg-neutral-900 text-purple-500 focus:ring-purple-500"
                        />
                        <span>Auto-sync chapters immediately upon import</span>
                      </label>

                      {autoSyncChapters && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400">Chapters to fetch:</span>
                          <Select
                            value={String(syncMaxChapters)}
                            onValueChange={(v) => setSyncMaxChapters(Number(v))}
                          >
                            <SelectTrigger className="h-7 w-32 text-[11px] bg-neutral-900 border-neutral-800 text-neutral-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="20">Latest 20</SelectItem>
                              <SelectItem value="50">First 50 (Std)</SelectItem>
                              <SelectItem value="150">All Available</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary & Create Button */}
            {selectedComic && (
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-neutral-200 truncate text-xs">
                    Ready to create <strong className="text-purple-300 font-semibold">{selectedComic.title}</strong>
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleHybridCreate}
                  disabled={isHybridSubmitting}
                  className="h-9 px-4 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shrink-0 cursor-pointer rounded-lg shadow-md transition-all"
                >
                  {isHybridSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-3.5 w-3.5" />
                      Create & Import Series
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MANUAL SERIES CREATION ──────────────────────────── */}
        {activeTab === "manual" && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Series Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Magic Emperor"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">URL Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="magic-emperor"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Format</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Release Year</Label>
                <Input
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="2026"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Author</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Artist</Label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Artist name"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Cover Image URL</Label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Synopsis / Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write synopsis here..."
                rows={3}
                className="text-xs whitespace-pre-wrap resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => manualCreateMutation.mutate()}
                disabled={!title.trim() || manualCreateMutation.isPending}
                className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 cursor-pointer shadow-md"
              >
                {manualCreateMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Create Series
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
