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
  PenTool,
  Palette,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $searchComickList,
  $enrichComickItemDetails,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
import {
  $searchComixList,
  $previewComixMetadata,
  $importComixMetadataToSeries,
  type ComixExtractedMetadata,
} from "@/lib/api/comix-import.actions";
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
    id: "comix",
    name: "Comix.to",
    icon: "⚡",
    badge: "Direct Scan",
    domain: "comix.to",
    getUrl: (slug) => `https://comix.to/title/${slug}`,
    getSearchUrl: (title) => `https://comix.to/browse?keyword=${encodeURIComponent(title)}`,
  },
  {
    id: "kayn",
    name: "Kayn Scans",
    icon: "⚡",
    badge: "Super Fast",
    domain: "kaynscans.com",
    getUrl: (slug) => `https://kaynscans.com/series/${slug}`,
    getSearchUrl: (title) => `https://kaynscans.com/search?query=${encodeURIComponent(title)}`,
  },
  {
    id: "drake",
    name: "Drake Scans",
    icon: "🐉",
    badge: "Super Fast",
    domain: "drakecomic.net",
    getUrl: (slug) => `https://drakecomic.net/series/comic/${slug}`,
    getSearchUrl: (title) => `https://drakecomic.net/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "witchtoons",
    name: "WitchToons",
    icon: "🧙‍♀️",
    badge: "Super Fast",
    domain: "witchtoons.net",
    getUrl: (slug) => `https://witchtoons.net/series/comic/${slug}`,
    getSearchUrl: (title) => `https://witchtoons.net/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "duskscans",
    name: "Dusk Scans",
    icon: "🌆",
    badge: "Super Fast",
    domain: "duskscans.com",
    getUrl: (slug) => `https://duskscans.com/series/${slug}`,
    getSearchUrl: (title) => `https://duskscans.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "elftoon",
    name: "ElfToon",
    icon: "🧝",
    badge: "Fast Scraper",
    domain: "elftoon.com",
    getUrl: (slug) => `https://elftoon.com/manga/${slug}/`,
    getSearchUrl: (title) => `https://elftoon.com/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "thunder",
    name: "Thunder Scans",
    icon: "⚡",
    badge: "Fast Scraper",
    domain: "en-thunderscans.com",
    getUrl: (slug) => `https://en-thunderscans.com/manga/${slug}/`,
    getSearchUrl: (title) => `https://en-thunderscans.com/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "scythe",
    name: "Scythe Scans",
    icon: "⚔️",
    badge: "Fast Scraper",
    domain: "scythescans.com",
    getUrl: (slug) => `https://scythescans.com/manga/${slug}/`,
    getSearchUrl: (title) => `https://scythescans.com/?s=${encodeURIComponent(title)}`,
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
  const [metadataSource, setMetadataSource] = useState<"comick" | "comix">("comick");
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
  const [showComixFallbackNotice, setShowComixFallbackNotice] = useState(false);

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

  // Resolve the correct Qi Scans slug by validating against their API
  const resolveQiScansUrl = async (title: string, comickSlug: string): Promise<string> => {
    const baseApiUrl = "https://api.qimanga.com/api/v1/series";
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    // Generate slug candidates: the cleaned comick slug, title-based slug, etc.
    const titleSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const candidates = [
      comickSlug,
      titleSlug,
      // Some Qi Scans slugs have trailing numbers or slight variations
      `${titleSlug}-1`,
      `${titleSlug}-2`,
      comickSlug.replace(/-\d+$/, ""),
    ];

    // Deduplicate
    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    for (const slug of uniqueCandidates) {
      try {
        const res = await fetch(`${baseApiUrl}/${encodeURIComponent(slug)}`, {
          headers: { "User-Agent": userAgent, Accept: "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const resolvedSlug = data?.data?.slug || data?.slug || slug;
          return `https://qimanga.com/series/${resolvedSlug}`;
        }
      } catch {
        // Try next candidate
      }
    }

    // Fallback: return the best-guess URL (user can manually edit it)
    return `https://qimanga.com/series/${comickSlug}`;
  };

  const handleSelectComic = async (comic: ComickExtractedMetadata) => {
    setSelectedComic(comic);
    const cleanSlug = toCleanSlug(comic.slug || comic.title);
    const provider = WORKABLE_SCAN_PROVIDERS.find((p) => p.id === selectedScanProvider);
    if (provider && provider.id !== "none" && provider.id !== "custom") {
      if (provider.id === "qi") {
        // Set initial URL immediately, then resolve in background
        setScanSourceUrl(provider.getUrl(cleanSlug));
        resolveQiScansUrl(comic.title, cleanSlug).then((url) => setScanSourceUrl(url)).catch(() => {});
      } else {
        setScanSourceUrl(provider.getUrl(cleanSlug));
      }
    }
    if ((!comic.author || !comic.artist) && comic.slug && metadataSource === "comick") {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.access_token) {
          const res = await $enrichComickItemDetails({
            data: { slug: comic.slug, title: comic.title, accessToken: session.access_token },
          });
          if (res.success) {
            const updated = {
              ...comic,
              author: res.author || comic.author,
              artist: res.artist || comic.artist,
              tags: res.tags?.length ? Array.from(new Set([...comic.tags, ...res.tags])) : comic.tags,
              genres: res.genres?.length ? Array.from(new Set([...comic.genres, ...res.genres])) : comic.genres,
            };
            setSelectedComic((curr) => (curr?.slug === comic.slug ? updated : curr));
            setComickResults((prev) => prev.map((p) => (p.slug === comic.slug ? updated : p)));
          }
        }
      } catch {
        // silent
      }
    }
  };


  const handleProviderSelect = async (providerId: string) => {
    setSelectedScanProvider(providerId);
    const provider = WORKABLE_SCAN_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    if (provider.id === "none") {
      setScanSourceUrl("");
    } else if (provider.id === "custom") {
      // Keep existing URL or leave open for manual pasting
    } else if (selectedComic) {
      const cleanSlug = toCleanSlug(selectedComic.slug || selectedComic.title);

      // For Qi Scans, validate the slug against their API
      if (provider.id === "qi") {
        setScanSourceUrl(`https://qimanga.com/series/${cleanSlug}`);
        toast.loading("Resolving Qi Scans URL...", { id: "qi-resolve" });
        try {
          const resolvedUrl = await resolveQiScansUrl(selectedComic.title, cleanSlug);
          setScanSourceUrl(resolvedUrl);
          const resolvedSlug = resolvedUrl.split("/series/")[1];
          if (resolvedSlug !== cleanSlug) {
            toast.success(`Connected to Qi Scans: ${resolvedSlug}`, { id: "qi-resolve" });
          } else {
            toast.dismiss("qi-resolve");
          }
        } catch {
          toast.error("Could not verify Qi Scans URL — please check the URL manually", { id: "qi-resolve" });
        }
      } else {
        setScanSourceUrl(provider.getUrl(cleanSlug));
      }
    }
  };

  // Search Comick or Comix.to for official metadata
  const handleSearchMetadata = async (overrideSource?: "comick" | "comix") => {
    const activeSource = overrideSource || metadataSource;
    const q = comickSearch.trim();
    if (!q) {
      toast.error(`Please enter a title or URL to search ${activeSource === "comick" ? "Comick" : "Comix.to"}`);
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      setIsSearchingComick(true);
      setShowComixFallbackNotice(false);

      if (activeSource === "comix") {
        const res = await $searchComixList({
          data: {
            query: q,
            accessToken: session.access_token,
          },
        });

        if (res.success && res.results && res.results.length > 0) {
          const mappedList: ComickExtractedMetadata[] = res.results.map((meta) => ({
            title: meta.title,
            slug: meta.slug,
            description: meta.description,
            alternativeTitles: meta.alternativeTitles,
            genres: meta.genres,
            tags: meta.tags,
            status: meta.status,
            releaseYear: meta.releaseYear,
            coverUrl: meta.coverUrl,
            author: meta.author,
            artist: meta.artist,
          }));
          setComickResults(mappedList);
          handleSelectComic(mappedList[0]);
          setSelectedType(res.results[0].type);
          setSelectedScanProvider("comix");
          setScanSourceUrl(res.results[0].comixUrl);
          toast.success(`Found "${res.results[0].title}" on Comix.to!`);
        } else {
          // Fallback: try preview
          const prevRes = await $previewComixMetadata({
            data: {
              query: q,
              accessToken: session.access_token,
            },
          });

          if (prevRes.success && prevRes.metadata) {
            const meta = prevRes.metadata;
            const mapped: ComickExtractedMetadata = {
              title: meta.title,
              slug: meta.slug,
              description: meta.description,
              alternativeTitles: meta.alternativeTitles,
              genres: meta.genres,
              tags: meta.tags,
              status: meta.status,
              releaseYear: meta.releaseYear,
              coverUrl: meta.coverUrl,
              author: meta.author,
              artist: meta.artist,
            };
            setComickResults([mapped]);
            handleSelectComic(mapped);
            setSelectedType(meta.type);
            setSelectedScanProvider("comix");
            setScanSourceUrl(meta.comixUrl);
            toast.success(`Found "${meta.title}" on Comix.to!`);
          } else {
            setComickResults([]);
            setSelectedComic(null);
            toast.error(prevRes.error || `No titles found on Comix.to for "${q}"`);
          }
        }
      } else {
        const res = await $searchComickList({
          data: {
            query: q,
            accessToken: session.access_token,
          },
        });

        if (!res.success || !res.results || res.results.length === 0) {
          setComickResults([]);
          setSelectedComic(null);
          setShowComixFallbackNotice(true);
          toast.error(res.error || `No titles found on Comick for "${q}". Try Comix.to!`);
        } else {
          setComickResults(res.results);
          handleSelectComic(res.results[0]);
          toast.success(`Found ${res.results.length} comic(s) on Comick!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
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

      // 2. Attach genres & tags from Comick or Comix.to
      processing.setStepStatus("meta", "active", "Importing cover art and synopsis...");
      if (selectedComic) {
        if (metadataSource === "comix") {
          await $importComixMetadataToSeries({
            data: {
              seriesId: newSeries.id,
              accessToken: session.access_token,
              importCover: true,
              importSynopsis: true,
              importGenresAndTags: true,
              importAlternativeTitles: true,
              importStatusAndType: true,
              importAuthorAndArtist: true,
              overrideMetadata: selectedComic,
            },
          });
        } else {
          await $importComickMetadataToSeries({
            data: {
              seriesId: newSeries.id,
              accessToken: session.access_token,
              importCover: true,
              importSynopsis: true,
              importGenresAndTags: true,
              importAlternativeTitles: true,
              importAuthorAndArtist: true,
              overrideMetadata: selectedComic,
            },
          });
        }
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

      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[94vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto p-3.5 sm:p-6 lg:p-7 bg-background/95 border-purple-500/30 backdrop-blur-xl transition-all duration-200">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 shadow-sm">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                Add New Series
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground/90 font-normal line-clamp-1 sm:line-clamp-none">
                Import complete official metadata from Comick & attach scan sources for chapters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 border-b border-border/30 pb-2.5 sm:pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("smart")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "smart"
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">1-Click Comick & Scans Importer</span>
            <span className="sm:hidden">1-Click Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>Manual Creation</span>
          </button>
        </div>

        {/* ── TAB 1: SMART HYBRID IMPORTER ───────────────────────────── */}
        {activeTab === "smart" && (
          <div className="space-y-4 pt-1">
            {/* Step 1: Comick / Comix.to Metadata Search */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[11px] font-bold text-purple-300">1</span>
                  <span className="text-sm font-semibold tracking-tight text-purple-100">
                    Search Metadata ({metadataSource === "comick" ? "Comick.dev" : "Comix.to"})
                  </span>
                </div>
                {/* Source Selection Buttons */}
                <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMetadataSource("comick");
                      setShowComixFallbackNotice(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      metadataSource === "comick"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Comick.dev (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMetadataSource("comix");
                      setShowComixFallbackNotice(false);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      metadataSource === "comix"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Comix.to
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={comickSearch}
                  onChange={(e) => setComickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchMetadata()}
                  placeholder={
                    metadataSource === "comix"
                      ? "Enter Comix.to title URL (e.g. https://comix.to/title/...) or title name"
                      : "e.g. Solo Leveling, Eleceed, Return of the Mount Hua..."
                  }
                  className="h-10 text-sm bg-neutral-900/90 border-neutral-800 focus:border-purple-500 text-white placeholder:text-neutral-500 rounded-lg font-normal"
                />
                <Button
                  type="button"
                  onClick={() => handleSearchMetadata()}
                  disabled={isSearchingComick || !comickSearch.trim()}
                  className="h-10 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shrink-0 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  {isSearchingComick ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Comix.to Fallback Suggestion */}
              {showComixFallbackNotice && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <span>No scan matches on Comick? Try searching Comix.to</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/20 text-amber-100"
                    onClick={() => {
                      setMetadataSource("comix");
                      void handleSearchMetadata("comix");
                    }}
                  >
                    Search Comix.to
                  </Button>
                </div>
              )}

              {/* Comick / Comix Search Results Grid */}
              {comickResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-purple-500/20">
                  <span className="text-xs font-medium text-neutral-400">
                    Select matching series ({comickResults.length} found on {metadataSource === "comick" ? "Comick.dev" : "Comix.to"}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-56 lg:max-h-64 overflow-y-auto p-1 scrollbar-thin">
                    {comickResults.map((comic) => {
                      const isSelected = selectedComic?.slug === comic.slug;
                      return (
                        <div
                          key={comic.slug}
                          onClick={() => handleSelectComic(comic)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500 shadow-sm"
                              : "bg-card/40 border-border/40 hover:border-purple-500/40"
                          }`}
                        >
                          <img
                            src={comic.coverUrl || ""}
                            alt={comic.title}
                            className="h-16 w-11 object-cover rounded-md bg-secondary shrink-0 shadow-sm"
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

                  {/* Selected Comic Metadata Preview Card */}
                  {selectedComic && (
                    <div className="p-3 sm:p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3 mt-2">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <img
                          src={selectedComic.coverUrl || ""}
                          alt={selectedComic.title}
                          className="h-28 w-20 sm:h-32 sm:w-24 object-cover rounded-lg border border-purple-500/30 shadow shrink-0 self-center sm:self-start"
                        />
                        <div className="min-w-0 flex-1 space-y-2 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{selectedComic.title}</h4>
                            <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/40 shrink-0">
                              {selectedComic.releaseYear || "N/A"}
                            </Badge>
                          </div>

                          {/* Author & Artist Badges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                              <PenTool className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] text-purple-400/80 block uppercase font-bold tracking-wider leading-none">
                                  Author
                                </span>
                                <span className="text-white font-medium text-[11px] sm:text-xs truncate block mt-0.5">
                                  {selectedComic.author || "Detecting / Not specified"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-xs">
                              <Palette className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] text-pink-400/80 block uppercase font-bold tracking-wider leading-none">
                                  Artist
                                </span>
                                <span className="text-white font-medium text-[11px] sm:text-xs truncate block mt-0.5">
                                  {selectedComic.artist || "Detecting / Not specified"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs col-span-1 sm:col-span-2 lg:col-span-1">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] text-indigo-400/80 block uppercase font-bold tracking-wider leading-none">
                                  Format
                                </span>
                                <span className="text-white font-medium text-[11px] sm:text-xs truncate block capitalize mt-0.5">
                                  {selectedType}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Genres tags preview */}
                          {selectedComic.genres && selectedComic.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {selectedComic.genres.slice(0, 10).map((g) => (
                                <span
                                  key={g}
                                  className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] bg-purple-500/20 text-purple-200 border border-purple-500/30 font-medium"
                                >
                                  {g}
                                </span>
                              ))}
                              {selectedComic.genres.length > 10 && (
                                <span className="text-[10px] text-neutral-400 self-center">
                                  +{selectedComic.genres.length - 10} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                <p className="text-xs text-neutral-400 font-normal leading-relaxed pl-0 sm:pl-7">
                  Choose a verified scanlation provider to import chapters from, or paste a custom URL.
                </p>
              </div>

              {/* Workable Provider Selection Grid */}
              <div className="pl-0 sm:pl-7 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
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
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-neutral-200 truncate text-xs">
                    Ready to create <strong className="text-purple-300 font-semibold">{selectedComic.title}</strong>
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleHybridCreate}
                  disabled={isHybridSubmitting}
                  className="h-9 px-4 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shrink-0 cursor-pointer rounded-lg shadow-md transition-all w-full sm:w-auto"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-bold text-neutral-200">Series Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Magic Emperor"
                  className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">URL Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="magic-emperor"
                  className="text-xs sm:text-sm h-10 font-mono bg-neutral-900/80 border-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Format</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Release Year</Label>
                <Input
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="2026"
                  className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Author</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Artist</Label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Artist name"
                  className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-200">Cover Image URL</Label>
                <Input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="text-xs sm:text-sm h-10 bg-neutral-900/80 border-neutral-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-200">Synopsis / Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write synopsis here..."
                rows={4}
                className="text-xs sm:text-sm whitespace-pre-wrap resize-none bg-neutral-900/80 border-neutral-800"
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
