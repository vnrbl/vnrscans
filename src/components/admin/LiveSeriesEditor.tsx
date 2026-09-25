"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Edit3,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Globe,
  Loader2,
  CheckCircle2,
  X,
  Plus,
  ExternalLink,
  Layers,
  Save,
  BookOpen,
  Zap,
  Download,
  RefreshCw,
  Link2,
  Trash2,
  PlusCircle,
  Eye,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";
import { PRESET_UNIVERSES, UNIVERSE_ROLES } from "@/lib/universe-constants";
import { supabase } from "@/integrations/supabase/client";
import { useProcessingTask } from "@/contexts/ProcessingTaskContext";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { logAdminAction } from "@/lib/adminLog";
import {
  $extractCoversFromScanUrl,
  $autoImportSeriesCover,
  $syncImportSource,
  $deleteChapter,
  $bulkDeleteChapters,
  $discoverNewChapters,
  $importSelectedChapters,
} from "@/lib/api/scraper.actions";
import { $importComickMetadataToSeries } from "@/lib/api/comick-import.actions";
import { detectImportSource, canonicalSourceSite, canonicalScanlationGroup } from "@/lib/import-source-utils";
import { ComickMetadataImporter } from "@/components/admin/ComickMetadataImporter";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";

const seriesTypes = ["manga", "manhwa", "manhua", "novel"] as const;
const seriesStatuses = ["ongoing", "completed", "hiatus"] as const;
const contentRatings = ["safe", "suggestive", "nsfw", "pornographic"] as const;
type ContentRating = (typeof contentRatings)[number];

const contentRatingLabels: Record<ContentRating, string> = {
  safe: "Safe",
  suggestive: "Suggestive",
  nsfw: "NSFW",
  pornographic: "Pornographic",
};

interface LiveSeriesEditorProps {
  series: any;
  slug: string;
  trigger?: React.ReactNode;
}

export function LiveSeriesEditor({ series: initialSeries, slug, trigger }: LiveSeriesEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canEdit = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "synopsis" | "cover" | "chapters" | "sources">("general");
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab]);

  // Form state
  const [title, setTitle] = useState(initialSeries?.title || "");
  const [newSlug, setNewSlug] = useState(initialSeries?.slug || "");
  const [alternativeTitles, setAlternativeTitles] = useState(initialSeries?.alternative_titles || "");
  const [type, setType] = useState<string>(initialSeries?.type || "manhwa");
  const [status, setStatus] = useState<string>(initialSeries?.status || "ongoing");
  const [author, setAuthor] = useState(initialSeries?.author || "");
  const [artist, setArtist] = useState(initialSeries?.artist || "");
  const [releaseYear, setReleaseYear] = useState(initialSeries?.release_year ? String(initialSeries.release_year) : "");
  const [description, setDescription] = useState(initialSeries?.description || "");
  const [contentRating, setContentRating] = useState<ContentRating>((initialSeries?.content_rating as ContentRating) || "safe");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialSeries?.is_featured));
  const [isTrending, setIsTrending] = useState(Boolean(initialSeries?.is_trending));
  const [isHidden, setIsHidden] = useState(Boolean(initialSeries?.is_hidden));
  const [coverUrl, setCoverUrl] = useState(initialSeries?.cover_url || "");
  const [importedGenres, setImportedGenres] = useState<string[]>([]);
  const [importedTags, setImportedTags] = useState<string[]>([]);
  const [universe, setUniverse] = useState(initialSeries?.universe || "");
  const [universeRole, setUniverseRole] = useState(initialSeries?.universe_role || "");

  // Chapter Management in Modal
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [isDeletingChapters, setIsDeletingChapters] = useState(false);

  // Cover Import state
  const [scanUrl, setScanUrl] = useState("");
  const [isExtractingCovers, setIsExtractingCovers] = useState(false);
  const [isAutoImportingCover, setIsAutoImportingCover] = useState(false);
  const [extractedCovers, setExtractedCovers] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Sync / Scan Source state
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [syncingState, setSyncingState] = useState<{ sourceId: string; mode: "latest" | "all" } | null>(null);
  const isSyncingSeries = !!syncingState;

  // Chapter Discovery & Selective Import state
  const [discoveredChapters, setDiscoveredChapters] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedImportChapters, setSelectedImportChapters] = useState<Set<number>>(new Set());
  const [isSelectiveImporting, setIsSelectiveImporting] = useState(false);

  const isSyncingSource = (sourceId: string, mode?: "latest" | "all") => {
    if (!syncingState) return false;
    if (syncingState.sourceId === "all_sources") {
      return mode ? syncingState.mode === mode : true;
    }
    return syncingState.sourceId === sourceId && (!mode || syncingState.mode === mode);
  };

  // Query existing import sources
  const importSourcesQ = useQuery({
    queryKey: ["admin", "series-import-sources", initialSeries?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("series_import_sources")
        .select("*")
        .eq("series_id", initialSeries?.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open && !isCreatingNew && !!initialSeries?.id,
  });

  // Query series chapters for editor
  const chaptersQ = useQuery({
    queryKey: ["admin", "series-editor-chapters", initialSeries?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, chapter_number, title, release_date, view_count, is_locked, price_coins, created_at, scanlation_group")
        .eq("series_id", initialSeries?.id)
        .order("chapter_number", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open && !isCreatingNew && !!initialSeries?.id,
  });

  // Sync state with props when modal opens
  useEffect(() => {
    if (open && initialSeries && !isCreatingNew) {
      setTitle(initialSeries.title || "");
      setNewSlug(initialSeries.slug || "");
      setAlternativeTitles(initialSeries.alternative_titles || "");
      setType(initialSeries.type || "manhwa");
      setStatus(initialSeries.status || "ongoing");
      setAuthor(initialSeries.author || "");
      setArtist(initialSeries.artist || "");
      setReleaseYear(initialSeries.release_year ? String(initialSeries.release_year) : "");
      setDescription(initialSeries.description || "");
      setContentRating((initialSeries.content_rating as ContentRating) || "safe");
      setIsFeatured(Boolean(initialSeries.is_featured));
      setIsTrending(Boolean(initialSeries.is_trending));
      setIsHidden(Boolean(initialSeries.is_hidden));
      setCoverUrl(initialSeries.cover_url || "");
      setUniverse(initialSeries.universe || "");
      setUniverseRole(initialSeries.universe_role || "");
      setImportedGenres([]);
      setImportedTags([]);
      setSelectedChapterIds(new Set());
    }
  }, [open, initialSeries, isCreatingNew]);

  const resetForNewSeries = () => {
    setIsCreatingNew(true);
    setTitle("");
    setNewSlug("");
    setAlternativeTitles("");
    setType("manhwa");
    setStatus("ongoing");
    setAuthor("");
    setArtist("");
    setReleaseYear(new Date().getFullYear().toString());
    setDescription("");
    setContentRating("safe");
    setIsFeatured(false);
    setIsTrending(false);
    setIsHidden(false);
    setCoverUrl("");
    setUniverse("");
    setUniverseRole("");
    setImportedGenres([]);
    setImportedTags([]);
    setActiveTab("general");
  };

  const resetForCurrentSeries = () => {
    setIsCreatingNew(false);
    if (initialSeries) {
      setTitle(initialSeries.title || "");
      setNewSlug(initialSeries.slug || "");
      setAlternativeTitles(initialSeries.alternative_titles || "");
      setType(initialSeries.type || "manhwa");
      setStatus(initialSeries.status || "ongoing");
      setAuthor(initialSeries.author || "");
      setArtist(initialSeries.artist || "");
      setReleaseYear(initialSeries.release_year ? String(initialSeries.release_year) : "");
      setDescription(initialSeries.description || "");
      setContentRating((initialSeries.content_rating as ContentRating) || "safe");
      setIsFeatured(Boolean(initialSeries.is_featured));
      setIsTrending(Boolean(initialSeries.is_trending));
      setIsHidden(Boolean(initialSeries.is_hidden));
      setCoverUrl(initialSeries.cover_url || "");
      setUniverse(initialSeries.universe || "");
      setUniverseRole(initialSeries.universe_role || "");
    }
  };

  // 1-Click Auto-Import Cover
  const handleAutoImportCover = async () => {
    if (!initialSeries?.id) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }
      setIsAutoImportingCover(true);
      const toastId = toast.loading("Auto-scanning series source for high-res cover...");
      const res = await $autoImportSeriesCover({
        data: {
          seriesId: initialSeries.id,
          accessToken: session.access_token,
          customUrl: scanUrl.trim() || undefined,
        },
      });

      if (!res.success || !res.coverUrl) {
        toast.error(res.error || "Failed to auto-import cover", { id: toastId });
      } else {
        setCoverUrl(res.coverUrl);
        toast.success(res.message || "Cover picture imported and set!", { id: toastId });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
        qc.invalidateQueries({ queryKey: ["series", "covers", initialSeries?.id] });
      }
    } catch (err: any) {
      toast.error(err.message || "Auto-import failed");
    } finally {
      setIsAutoImportingCover(false);
    }
  };

  // Extract candidate covers from custom URL
  const handleExtractCovers = async () => {
    if (!scanUrl.trim()) {
      toast.error("Please enter a scan or series URL");
      return;
    }
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }
      setIsExtractingCovers(true);
      const toastId = toast.loading("Extracting covers from scan source...");
      const res = await $extractCoversFromScanUrl({
        data: {
          url: scanUrl.trim(),
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.covers || res.covers.length === 0) {
        toast.error(res.error || "No covers found at that URL", { id: toastId });
      } else {
        setExtractedCovers(res.covers);
        toast.success(`Discovered ${res.covers.length} cover image(s)!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract covers");
    } finally {
      setIsExtractingCovers(false);
    }
  };

  // Upload Cover Image
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingCover(true);
    const toastId = toast.loading("Uploading cover media...");
    try {
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("comment-media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("comment-media").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
      toast.success("Cover uploaded!", { id: toastId });
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const processing = useProcessingTask();

  // Sync this series now (mode: "latest" = newest releases, "all" = all missing catalog chapters)
  const handleSyncThisSeries = async (sourceId?: string, mode: "latest" | "all" = "latest") => {
    const isAllSources = sourceId === "all_sources";
    const sourcesToSync = isAllSources
      ? (importSourcesQ.data || [])
      : (importSourcesQ.data || []).filter((s: any) => !sourceId || s.id === sourceId);

    if (sourcesToSync.length === 0) {
      toast.error("No scan source found to import from");
      return;
    }

    const modeLabel = mode === "all" ? "All Missing Chapters" : "Latest Chapters";
    const steps = [
      { id: "auth", label: "Verifying administrative authorization" },
      { id: "source", label: "Connecting scanlation source" },
      { id: "scrape", label: `Scraping & importing ${modeLabel.toLowerCase()}` },
      { id: "index", label: "Indexing chapter pages & refreshing catalog" },
    ];

    processing.startTask({
      title: mode === "all" ? "Importing All Chapters" : "Importing Latest Chapters",
      description: `Importing ${modeLabel.toLowerCase()} from ${sourcesToSync.length > 1 ? `${sourcesToSync.length} sources` : (sourcesToSync[0]?.source_site || "scan source")} for "${title || "series"}"`,
      steps,
    });

    try {
      setSyncingState({ sourceId: sourceId || sourcesToSync[0]?.id, mode });
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("Please sign in as admin");
      }
      processing.setStepStatus("auth", "done", "Authorized");

      let totalImported = 0;
      let totalSkipped = 0;

      for (let i = 0; i < sourcesToSync.length; i++) {
        const src = sourcesToSync[i];
        const srcName = src.source_site || "Source";
        processing.setStepStatus(
          "source",
          "active",
          `Connecting to ${srcName} (${i + 1}/${sourcesToSync.length})...`
        );

        processing.setStepStatus(
          "scrape",
          "active",
          `Extracting ${mode === "all" ? "full catalog" : "latest"} chapters from ${srcName}...`
        );

        const res = await $syncImportSource({
          data: {
            sourceId: src.id,
            accessToken: session.access_token,
            mode,
            maxChapters: mode === "all" ? 500 : 10,
          },
        });

        if (!res.success) {
          console.warn(`[Sync] Source ${src.id} failed:`, res.error);
          if (sourcesToSync.length === 1) {
            throw new Error(res.error || "Sync failed");
          }
        } else {
          totalImported += res.imported ?? 0;
          totalSkipped += res.skipped ?? 0;
        }
      }

      processing.setStepStatus("source", "done", "Connected");
      processing.setStepStatus("scrape", "done", `Imported ${totalImported} chapter(s)`);
      processing.setStepStatus("index", "active", "Refreshing chapter index...");

      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["chapters"] });
      qc.invalidateQueries({ queryKey: ["chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["admin", "chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["admin", "series-editor-chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", initialSeries?.id] });

      processing.setStepStatus("index", "done");
      await processing.completeTask(`${mode === "all" ? "All Chapters" : "Latest Chapters"} Imported Successfully! ✓`);

      if (totalImported > 0) {
        toast.success(`Sync complete! Imported ${totalImported} ${mode === "all" ? "chapter(s)" : "latest chapter(s)"} (${totalSkipped} skipped).`);
      } else {
        toast.info(`Source up to date (${totalSkipped} existing chapters verified).`);
      }
    } catch (err: any) {
      processing.failTask(err.message || "Import failed");
      toast.error(err.message || "Import failed");
    } finally {
      setSyncingState(null);
    }
  };

  // Add new scan source
  const handleAddSource = async () => {
    if (!newSourceUrl.trim() || !initialSeries?.id) return;
    try {
      setIsAddingSource(true);
      const preset = detectImportSource(newSourceUrl.trim());
      const { error } = await (supabase as any).from("series_import_sources").insert({
        series_id: initialSeries.id,
        source_url: newSourceUrl.trim(),
        source_site: canonicalSourceSite(preset.sourceSite),
        scanlation_group: canonicalScanlationGroup(preset.scanlationGroup) || null,
        auto_publish: true,
        enabled: true,
      });
      if (error) throw error;
      toast.success("Scan source linked!");
      setNewSourceUrl("");
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", initialSeries.id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add source");
    } finally {
      setIsAddingSource(false);
    }
  };

  // Discover new chapters from source
  const handleDiscoverChapters = async (sourceId?: string) => {
    try {
      setIsDiscovering(true);
      setDiscoveredChapters(null);
      setSelectedImportChapters(new Set());
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }

      const res = await $discoverNewChapters({
        data: {
          sourceId: sourceId || undefined,
          seriesId: !sourceId ? initialSeries?.id : undefined,
          accessToken: session.access_token,
        },
      });

      if (!res.success) {
        toast.error(res.error || "Chapter discovery failed");
        return;
      }

      setDiscoveredChapters(res);
      if (res.totalNew === 0) {
        toast.info(`${res.seriesTitle || "Series"} is fully up to date! (${res.totalExisting} chapters)`);
      } else {
        toast.success(`Found ${res.totalNew} new chapter(s) from ${res.sourceSite}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Import selected chapters
  const handleSelectiveImport = async () => {
    if (selectedImportChapters.size === 0 || !discoveredChapters?.sourceId) return;
    try {
      setIsSelectiveImporting(true);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }

      const chapterNumbers = Array.from(selectedImportChapters).sort((a, b) => a - b);

      processing.startTask({
        title: `Importing ${chapterNumbers.length} Selected Chapter(s)`,
        description: `Selectively importing chapters ${chapterNumbers.slice(0, 5).join(", ")}${chapterNumbers.length > 5 ? "..." : ""}`,
        steps: [
          { id: "auth", label: "Verifying authorization" },
          { id: "import", label: `Importing ${chapterNumbers.length} chapter(s)` },
          { id: "refresh", label: "Refreshing catalog" },
        ],
      });

      processing.setStepStatus("auth", "done", "Authorized");
      processing.setStepStatus("import", "active", `Importing chapters ${chapterNumbers.join(", ")}...`);

      const res = await $importSelectedChapters({
        data: {
          sourceId: discoveredChapters.sourceId,
          chapterNumbers,
          accessToken: session.access_token,
        },
      });

      if (!res.success) {
        throw new Error(res.error || "Selective import failed");
      }

      processing.setStepStatus("import", "done", `${res.imported} imported, ${res.failed} failed`);
      processing.setStepStatus("refresh", "active", "Refreshing...");

      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["admin", "series-editor-chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", initialSeries?.id] });

      processing.setStepStatus("refresh", "done");
      await processing.completeTask(`Selective Import Complete! ${res.imported} chapter(s) imported ✓`);

      if ((res.imported ?? 0) > 0) {
        toast.success(`Imported ${res.imported} chapter(s)! ${(res.failed ?? 0) > 0 ? `(${res.failed} failed)` : ""}`);
      } else {
        toast.info(res.message || "No new chapters imported.");
      }

      setSelectedImportChapters(new Set());
      setDiscoveredChapters(null);
    } catch (err: any) {
      processing.failTask(err.message || "Selective import failed");
      toast.error(err.message || "Selective import failed");
    } finally {
      setIsSelectiveImporting(false);
    }
  };

  // Delete Individual Chapter
  const handleDeleteSingleChapter = async (chapterId: string, chapterNumber: number) => {
    if (!window.confirm(`Delete Chapter ${chapterNumber}? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;
      toast.success(`Chapter ${chapterNumber} deleted.`);
      qc.invalidateQueries({ queryKey: ["admin", "series-editor-chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // Bulk Delete Chapters
  const handleBulkDelete = async () => {
    if (selectedChapterIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedChapterIds.size} selected chapter(s)? This action cannot be undone.`)) {
      return;
    }

    const steps = [
      { id: "auth", label: "Verifying administrative authorization" },
      { id: "purge", label: "Purging chapter pages and storage media" },
      { id: "db", label: `Removing ${selectedChapterIds.size} chapter rows from database` },
      { id: "refresh", label: "Refreshing series chapter catalog" },
    ];

    processing.startTask({
      title: "Deleting Chapters",
      description: `Permanently deleting ${selectedChapterIds.size} selected chapter(s)`,
      steps,
    });

    try {
      setIsDeletingChapters(true);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("Please sign in as admin");
      }
      processing.setStepStatus("auth", "done", "Authorized");

      processing.setStepStatus("purge", "active", "Cleaning up assets...");
      processing.setStepStatus("purge", "done");

      processing.setStepStatus("db", "active", "Removing database records...");
      const res = await $bulkDeleteChapters({
        data: {
          chapterIds: Array.from(selectedChapterIds),
          accessToken: session.access_token,
        },
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to bulk delete");
      }

      processing.setStepStatus("db", "done", `${selectedChapterIds.size} chapters deleted`);
      processing.setStepStatus("refresh", "active", "Updating cache...");
      setSelectedChapterIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "series-editor-chapters", initialSeries?.id] });
      qc.invalidateQueries({ queryKey: ["chapters", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });

      processing.setStepStatus("refresh", "done");
      await processing.completeTask("Chapters Deleted Successfully! ✓");
      toast.success(res.message || "Selected chapters deleted.");
    } catch (err: any) {
      processing.failTask(err.message || "Bulk delete failed");
      toast.error(`Bulk delete failed: ${err.message}`);
    } finally {
      setIsDeletingChapters(false);
    }
  };

  // Create New Series Mutation
  const createSeriesMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const generatedSlug = (
        newSlug.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );

      const payload: any = {
        title: title.trim(),
        slug: generatedSlug,
        alternative_titles: alternativeTitles.trim() || null,
        type,
        status,
        author: author.trim() || null,
        artist: artist.trim() || null,
        release_year: releaseYear ? parseInt(releaseYear, 10) : null,
        description: description.trim() || null,
        content_rating: contentRating,
        is_featured: isFeatured,
        is_trending: isTrending,
        is_hidden: isHidden,
        cover_url: coverUrl.trim() || null,
        universe: universe.trim() || null,
        universe_role: universeRole.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newRow, error: insertErr } = await supabase
        .from("series")
        .insert(payload)
        .select("id, slug")
        .single();

      if (insertErr) throw insertErr;

      if (coverUrl.trim() && newRow?.id) {
        await supabase.from("series_covers").insert({
          series_id: newRow.id,
          image_url: coverUrl.trim(),
          position: 0,
        });
      }

      if ((importedGenres.length > 0 || importedTags.length > 0) && newRow?.id) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (session?.access_token) {
            await $importComickMetadataToSeries({
              data: {
                seriesId: newRow.id,
                accessToken: session.access_token,
                importCover: false,
                importSynopsis: false,
                importAlternativeTitles: false,
                importGenresAndTags: true,
                overrideMetadata: {
                  slug: generatedSlug,
                  genres: importedGenres,
                  tags: importedTags,
                },
              },
            });
          }
        } catch (tagErr) {
          console.warn("Failed to attach imported tags to new series:", tagErr);
        }
      }

      await logAdminAction("create", "series", newRow.id, { title });
      return newRow;
    },
    onSuccess: (newRow) => {
      toast.success("New series created successfully!");
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["browse-manhwa"] });
      setOpen(false);
      if (newRow?.slug) {
        router.push(`/title/${newRow.slug}`);
      }
    },
    onError: (err: any) => {
      toast.error(`Creation failed: ${err.message}`);
    },
  });

  // Save Existing Series Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!initialSeries?.id) throw new Error("Series ID is missing");

      // 1. Update series table
      const payload: any = {
        title: title.trim(),
        alternative_titles: alternativeTitles.trim() || null,
        type,
        status,
        author: author.trim() || null,
        artist: artist.trim() || null,
        release_year: releaseYear ? parseInt(releaseYear, 10) : null,
        description: description.trim() || null,
        content_rating: contentRating,
        is_featured: isFeatured,
        is_trending: isTrending,
        is_hidden: isHidden,
        cover_url: coverUrl.trim() || null,
        universe: universe.trim() || null,
        universe_role: universeRole.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("series")
        .update(payload)
        .eq("id", initialSeries.id);

      if (updateErr) throw updateErr;

      // 2. Record in series_covers if new cover
      if (coverUrl.trim()) {
        const { data: existingCover } = await supabase
          .from("series_covers")
          .select("id")
          .eq("series_id", initialSeries.id)
          .eq("image_url", coverUrl.trim())
          .maybeSingle();

        if (!existingCover) {
          await supabase.from("series_covers").insert({
            series_id: initialSeries.id,
            image_url: coverUrl.trim(),
            position: 0,
          });
        }
      }

      await logAdminAction("update", "series", initialSeries.id, { title });
    },
    onSuccess: () => {
      toast.success("Series updated in real time!");
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["browse-manhwa"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["series", "covers", initialSeries?.id] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const filteredChapters = (chaptersQ.data || []).filter((ch: any) => {
    if (!chapterSearch.trim()) return true;
    const q = chapterSearch.toLowerCase();
    return (
      String(ch.chapter_number).includes(q) ||
      (ch.title && ch.title.toLowerCase().includes(q)) ||
      (ch.scanlation_group && ch.scanlation_group.toLowerCase().includes(q))
    );
  });

  if (!canEdit) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 shadow-sm cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Live Edit</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 liquid-glass-window border-white/15 text-foreground shadow-2xl">
          {/* Top Header Bar */}
          <DialogHeader className="p-3 sm:p-6 pb-2.5 sm:pb-3 border-b border-border/20 bg-card/60 backdrop-blur-sm shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pr-8 sm:pr-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-sm sm:text-lg font-bold flex items-center gap-1.5 truncate">
                    <span className="truncate">{isCreatingNew ? "Add New Series" : "Real-Time Series Editor"}</span>
                    <Badge variant="outline" className="text-[10px] sm:text-2xs uppercase tracking-wider font-mono shrink-0">
                      {isCreatingNew ? "New Entry" : type}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                    {isCreatingNew
                      ? "Create a new manga, manhwa, manhua, or novel with 1-click Comick auto-fill"
                      : "Edit series metadata, taxonomy, covers, chapters, and scan sources live"}
                  </DialogDescription>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2">
                {!isCreatingNew ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resetForNewSeries}
                    className="h-7 sm:h-8 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 cursor-pointer w-full sm:w-auto"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Add New Series</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resetForCurrentSeries}
                    className="h-7 sm:h-8 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold cursor-pointer w-full sm:w-auto"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Back to Edit Current</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation Tabs Bar with Smooth Side Scroll */}
            <div className="relative pt-2.5 sm:pt-3.5 border-t border-border/10 mt-2.5 sm:mt-3.5 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (tabsContainerRef.current) {
                    tabsContainerRef.current.scrollBy({ left: -140, behavior: "smooth" });
                  }
                }}
                className="h-7 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/40 sm:hidden cursor-pointer"
                aria-label="Scroll tabs left"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <div
                ref={tabsContainerRef}
                className="flex-1 flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent overscroll-x-contain touch-pan-x flex-nowrap px-0.5 pb-1 scroll-smooth"
              >
                <Button
                  type="button"
                  data-active={activeTab === "general"}
                  variant={activeTab === "general" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shrink-0"
                  onClick={() => setActiveTab("general")}
                >
                  Basic Info
                </Button>
                <Button
                  type="button"
                  data-active={activeTab === "synopsis"}
                  variant={activeTab === "synopsis" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
                  onClick={() => setActiveTab("synopsis")}
                >
                  <Globe className="h-3 w-3 text-emerald-400" />
                  <span>Synopsis & Comick</span>
                </Button>
                <Button
                  type="button"
                  data-active={activeTab === "cover"}
                  variant={activeTab === "cover" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shrink-0"
                  onClick={() => setActiveTab("cover")}
                >
                  Cover & Scan
                </Button>
                {!isCreatingNew && (
                  <>
                    <Button
                      type="button"
                      data-active={activeTab === "chapters"}
                      variant={activeTab === "chapters" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
                      onClick={() => setActiveTab("chapters")}
                    >
                      <Layers className="h-3 w-3 text-purple-400" />
                      <span>Chapters ({(chaptersQ.data || []).length})</span>
                    </Button>
                    <Button
                      type="button"
                      data-active={activeTab === "sources"}
                      variant={activeTab === "sources" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shrink-0"
                      onClick={() => setActiveTab("sources")}
                    >
                      Sources ({(importSourcesQ.data || []).length})
                    </Button>
                  </>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (tabsContainerRef.current) {
                    tabsContainerRef.current.scrollBy({ left: 140, behavior: "smooth" });
                  }
                }}
                className="h-7 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/40 sm:hidden cursor-pointer"
                aria-label="Scroll tabs right"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Tab Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-5">
            {/* ═══ 1. GENERAL TAB ═══ */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (isCreatingNew && !newSlug) {
                          setNewSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "")
                          );
                        }
                      }}
                      placeholder="e.g. Solo Leveling"
                      className="text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">URL Slug</Label>
                    <Input
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="e.g. solo-leveling"
                      disabled={!isCreatingNew}
                      className="text-xs font-mono bg-secondary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Format / Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesTypes.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Content Rating</Label>
                    <Select value={contentRating} onValueChange={(v) => setContentRating(v as ContentRating)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentRatings.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {contentRatingLabels[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Alternative Titles (1 per line)</Label>
                  <Textarea
                    rows={2}
                    value={alternativeTitles}
                    onChange={(e) => setAlternativeTitles(e.target.value)}
                    placeholder="Solo Leveling&#10;Na Honjaman Level Up"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Author</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Artist</Label>
                    <Input
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Release Year</Label>
                    <Input
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Shared Universe / Connected Franchise */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/15 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-purple-400" />
                      Shared Universe / Connected Franchise
                    </span>
                    {universe && (
                      <button
                        type="button"
                        onClick={() => {
                          setUniverse("");
                          setUniverseRole("");
                        }}
                        className="text-[10px] text-muted-foreground hover:text-rose-400 cursor-pointer"
                      >
                        Clear Universe
                      </button>
                    )}
                  </div>

                  {/* Preset quick buttons */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Quick Select Universe:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_UNIVERSES.map((preset) => (
                        <button
                          key={preset.slug}
                          type="button"
                          onClick={() => {
                            setUniverse(preset.name);
                            if (!universeRole) setUniverseRole("Connected Series");
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                            universe.toLowerCase() === preset.name.toLowerCase()
                              ? "bg-purple-600 border-purple-500 text-white"
                              : "bg-secondary/60 hover:bg-secondary border-border/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Universe Name</Label>
                      <Input
                        value={universe}
                        onChange={(e) => setUniverse(e.target.value)}
                        placeholder="e.g. PTJ Universe, Blue String, Nano Machine Murim..."
                        className="text-xs h-8.5 bg-background/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Role / Order in Universe</Label>
                      <Select value={universeRole} onValueChange={setUniverseRole}>
                        <SelectTrigger className="text-xs h-8.5 bg-background/60">
                          <SelectValue placeholder="Select role (e.g. Main Story, Prequel)" />
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
                </div>

                {/* Flags and Visibility */}
                <div className="rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
                  <span className="text-xs font-bold text-foreground block">Visibility & Discovery Toggles</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                      <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(Boolean(c))} />
                      <span>🌟 Featured Series</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                      <Checkbox checked={isTrending} onCheckedChange={(c) => setIsTrending(Boolean(c))} />
                      <span>🔥 Trending Now</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none text-red-400">
                      <Checkbox checked={isHidden} onCheckedChange={(c) => setIsHidden(Boolean(c))} />
                      <span>👁️ Hidden from Public</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ 2. SYNOPSIS & COMICK IMPORT TAB ═══ */}
            {activeTab === "synopsis" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-200">1-Click Comick.dev Auto-Fill</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Search by series title to automatically fill description with paragraph breaks intact, alternative titles, genres, and cover art.
                  </p>
                  <div className="pt-1">
                    <ComickMetadataImporter
                      seriesId={initialSeries?.id}
                      seriesTitle={title || initialSeries?.title}
                      slug={slug || initialSeries?.slug}
                      onMetadataImported={(meta: any) => {
                        if (meta.title && (!title || isCreatingNew)) setTitle(meta.title);
                        if (meta.description) setDescription(meta.description);
                        if (meta.alternativeTitles) setAlternativeTitles(meta.alternativeTitles);
                        if (meta.coverUrl) setCoverUrl(meta.coverUrl);
                        if (meta.status) setStatus(meta.status);
                        if (meta.releaseYear) setReleaseYear(String(meta.releaseYear));
                        if (meta.genres) setImportedGenres(meta.genres);
                        if (meta.tags) setImportedTags(meta.tags);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Description / Synopsis (Preserves Paragraphs)</Label>
                  <Textarea
                    rows={10}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter full synopsis for this series..."
                    className="font-normal leading-relaxed text-xs whitespace-pre-line"
                  />
                </div>
              </div>
            )}

            {/* ═══ 3. COVER & SCAN IMPORT TAB ═══ */}
            {activeTab === "cover" && (
              <div className="space-y-5">
                {!isCreatingNew && (
                  <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-purple-200">1-Click Auto-Import Cover</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically scans the linked source URL for this series and sets the high-resolution cover image.
                    </p>
                    <Button
                      type="button"
                      onClick={handleAutoImportCover}
                      disabled={isAutoImportingCover}
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs h-9 shadow-lg shadow-purple-600/20 gap-1.5 cursor-pointer"
                    >
                      {isAutoImportingCover ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Auto-Importing Cover...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          <span>Auto-Scan & Set Cover (1-Click)</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Current Cover Preview */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/40">
                  <div className="relative aspect-[2/3] w-28 sm:w-24 rounded-lg overflow-hidden border border-border/50 bg-secondary shrink-0 shadow-md">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="w-full min-w-0 flex-1 space-y-2">
                    <Label className="text-xs font-semibold">Cover Image URL</Label>
                    <Input
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://... cover image URL"
                      className="text-xs font-mono"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 cursor-pointer"
                          disabled={isUploadingCover}
                          asChild
                        >
                          <span>
                            <Upload className="h-3.5 w-3.5" />
                            {isUploadingCover ? "Uploading..." : "Upload File"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileUpload}
                              className="hidden"
                            />
                          </span>
                        </Button>
                      </label>
                      {coverUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive cursor-pointer"
                          onClick={() => setCoverUrl("")}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scan URL Cover Extractor */}
                <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Preview & Select from Scan Source</h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={scanUrl}
                      onChange={(e) => setScanUrl(e.target.value)}
                      placeholder="https://asuracomic.net/series/... or https://qiscans.org/..."
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      onClick={handleExtractCovers}
                      disabled={isExtractingCovers || !scanUrl.trim()}
                      variant="outline"
                      className="shrink-0 text-xs h-9 cursor-pointer"
                    >
                      {isExtractingCovers ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        "Preview All"
                      )}
                    </Button>
                  </div>

                  {extractedCovers.length > 0 && (
                    <div className="pt-3 border-t border-border/20 space-y-2">
                      <Label className="text-xs font-semibold text-purple-300">
                        Discovered Covers ({extractedCovers.length}) — Click to set as Main Cover:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                        {extractedCovers.map((url, idx) => {
                          const isSelected = coverUrl === url;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setCoverUrl(url);
                                toast.success("Selected as main cover!");
                              }}
                              className={`group relative aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-105 shadow-md ${
                                isSelected ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-black" : "border-border/40 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img src={url} alt={`Scan Cover ${idx + 1}`} className="h-full w-full object-cover" />
                              {isSelected && (
                                <div className="absolute top-1 right-1 rounded-full bg-primary text-primary-foreground p-0.5 shadow">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ 4. CHAPTERS MANAGEMENT TAB ═══ */}
            {activeTab === "chapters" && !isCreatingNew && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      placeholder="Search chapters..."
                      className="pl-9 h-8 text-xs bg-secondary/30 w-full"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-start sm:justify-end">
                    {selectedChapterIds.size > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={isDeletingChapters}
                        className="h-8 text-xs font-bold gap-1.5 cursor-pointer shadow-sm flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete ({selectedChapterIds.size})</span>
                      </Button>
                    )}
                    {(importSourcesQ.data || []).length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const srcId = importSourcesQ.data?.[0]?.id;
                            if (srcId) handleSyncThisSeries(srcId, "latest");
                          }}
                          disabled={isSyncingSeries}
                          className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1.5 cursor-pointer shadow-sm flex-1 sm:flex-none"
                          title="Import newest missing chapters (latest releases)"
                        >
                          {syncingState?.mode === "latest" ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 text-amber-300" />
                          )}
                          <span>{syncingState?.mode === "latest" ? "Syncing..." : "Sync Latest"}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const srcId = importSourcesQ.data?.[0]?.id;
                            if (srcId) handleSyncThisSeries(srcId, "all");
                          }}
                          disabled={isSyncingSeries}
                          className="h-8 text-xs font-bold border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white gap-1.5 cursor-pointer shadow-sm flex-1 sm:flex-none"
                          title="Import all missing chapters across the full catalog"
                        >
                          {syncingState?.mode === "all" ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-300" />
                          ) : (
                            <Download className="h-3.5 w-3.5 text-purple-300" />
                          )}
                          <span>{syncingState?.mode === "all" ? "Syncing..." : "Sync All"}</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("sources")}
                        className="h-8 text-xs font-medium gap-1.5 cursor-pointer border-dashed text-muted-foreground hover:text-foreground flex-1 sm:flex-none"
                        title="Configure a scan source to enable 1-click syncing"
                      >
                        <Globe className="h-3.5 w-3.5 text-purple-400" />
                        <span>Link Scan Source</span>
                      </Button>
                    )}
                    <a
                      href={`/admin/series-chapters/${initialSeries?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-secondary/30 hover:bg-secondary/60 text-xs font-semibold text-foreground transition-colors flex-1 sm:flex-none"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Chapter Manager</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                {chaptersQ.isLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredChapters.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-border/20 bg-secondary/10 text-muted-foreground text-xs">
                    No chapters found.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 sm:hidden">
                      <span>💡 Swipe sideways to view all columns</span>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
                      <div className="max-h-72 overflow-x-auto overflow-y-auto overscroll-x-contain touch-pan-x scrollbar-thin scrollbar-thumb-purple-500/25">
                        <table className="w-full min-w-[540px] text-xs">
                          <thead className="bg-secondary/40 border-b border-border/30 sticky top-0 backdrop-blur">
                            <tr>
                              <th className="p-2.5 text-left w-8">
                                <Checkbox
                                  checked={
                                    filteredChapters.length > 0 &&
                                    filteredChapters.every((c: any) => selectedChapterIds.has(c.id))
                                  }
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedChapterIds(new Set(filteredChapters.map((c: any) => c.id)));
                                    } else {
                                      setSelectedChapterIds(new Set());
                                    }
                                  }}
                                />
                              </th>
                              <th className="p-2.5 text-left font-bold">Chapter</th>
                              <th className="p-2.5 text-left font-bold">Title</th>
                              <th className="p-2.5 text-left font-bold">Group</th>
                              <th className="p-2.5 text-left font-bold">Date</th>
                              <th className="p-2.5 text-right font-bold text-red-400">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                            {filteredChapters.map((ch: any) => {
                              const isSelected = selectedChapterIds.has(ch.id);
                              return (
                                <tr key={ch.id} className="hover:bg-secondary/30 transition-colors">
                                  <td className="p-2.5">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const next = new Set(selectedChapterIds);
                                        if (checked) next.add(ch.id);
                                        else next.delete(ch.id);
                                        setSelectedChapterIds(next);
                                      }}
                                    />
                                  </td>
                                  <td className="p-2.5 font-bold text-foreground font-mono">
                                    Ch. {ch.chapter_number}
                                  </td>
                                  <td className="p-2.5 text-muted-foreground truncate max-w-[160px]">
                                    {ch.title || "—"}
                                  </td>
                                  <td className="p-2.5 text-purple-400 font-mono">
                                    {ch.scanlation_group || "—"}
                                  </td>
                                  <td className="p-2.5 text-muted-foreground">
                                    {formatAppDate(ch.created_at)}
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSingleChapter(ch.id, ch.chapter_number)}
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                      title={`Delete Chapter ${ch.chapter_number}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ 5. SCAN SOURCES TAB ═══ */}
            {activeTab === "sources" && !isCreatingNew && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-card/40 p-3 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold">Linked Scan Sources</h3>
                      {(importSourcesQ.data || []).length > 0 && (
                        <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {(importSourcesQ.data || []).length}
                        </span>
                      )}
                    </div>
                    {(importSourcesQ.data || []).length > 1 && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSyncThisSeries("all_sources", "latest")}
                          disabled={isSyncingSeries}
                          className="h-7 text-2xs font-semibold bg-purple-600/80 hover:bg-purple-600 text-white gap-1 cursor-pointer"
                          title="Sync latest releases from all linked sources"
                        >
                          <Zap className="h-3 w-3 text-amber-300" />
                          <span>Sync Latest (All)</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncThisSeries("all_sources", "all")}
                          disabled={isSyncingSeries}
                          className="h-7 text-2xs font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-900/40 gap-1 cursor-pointer"
                          title="Sync all missing chapters from all linked sources"
                        >
                          <Download className="h-3 w-3 text-purple-300" />
                          <span>Sync All Sources</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {(importSourcesQ.data || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No scan sources linked to this series yet. Add one below to enable 1-click chapter scraping & cover auto-import.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {(importSourcesQ.data || []).map((src: any) => (
                        <div key={src.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/30 transition-all">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {canonicalSourceSite(src.source_site || "Source")}
                              </span>
                              {src.last_checked_at && (
                                <span className="text-2xs text-muted-foreground">
                                  Last checked: {formatAppDate(src.last_checked_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-1">{src.source_url}</p>
                          </div>
                          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSyncThisSeries(src.id, "latest")}
                              disabled={isSyncingSeries}
                              className="flex-1 sm:flex-none h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1.5 cursor-pointer shadow-sm"
                              title="Import newest missing chapters (latest releases)"
                            >
                              {isSyncingSource(src.id, "latest") ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Zap className="h-3.5 w-3.5 text-amber-300" />
                              )}
                              <span>{isSyncingSource(src.id, "latest") ? "Importing..." : "Import Latest"}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncThisSeries(src.id, "all")}
                              disabled={isSyncingSeries}
                              className="flex-1 sm:flex-none h-8 text-xs font-bold border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white gap-1.5 cursor-pointer shadow-sm"
                              title="Import all missing chapters across the full catalog"
                            >
                              {isSyncingSource(src.id, "all") ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-300" />
                              ) : (
                                <Download className="h-3.5 w-3.5 text-purple-300" />
                              )}
                              <span>{isSyncingSource(src.id, "all") ? "Importing..." : "Import All"}</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* === Chapter Discovery & Selective Import === */}
                  {(importSourcesQ.data || []).length > 0 && (
                    <div className="pt-3 border-t border-border/20 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-emerald-400" />
                          <h3 className="text-sm font-bold">Discover & Select Chapters</h3>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDiscoverChapters()}
                          disabled={isDiscovering || isSyncingSeries}
                          className="h-7 text-2xs font-semibold bg-emerald-600/80 hover:bg-emerald-600 text-white gap-1 cursor-pointer"
                          title="Discover new chapters from the scan source"
                        >
                          {isDiscovering ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3" />
                          )}
                          <span>{isDiscovering ? "Scanning..." : "Discover New Chapters"}</span>
                        </Button>
                      </div>

                      {discoveredChapters && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-emerald-300">
                                {discoveredChapters.totalNew > 0
                                  ? `📋 ${discoveredChapters.totalNew} new chapter(s) available`
                                  : "✅ All chapters up to date"}
                              </p>
                              <p className="text-muted-foreground">
                                {discoveredChapters.totalDiscovered} on source · {discoveredChapters.totalExisting} in DB
                                {discoveredChapters.premiumSkipped > 0 && ` · ${discoveredChapters.premiumSkipped} premium skipped`}
                                {discoveredChapters.latestExisting != null && ` · Latest: Ch. ${discoveredChapters.latestExisting}`}
                              </p>
                            </div>
                            {discoveredChapters.totalNew > 0 && selectedImportChapters.size > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSelectiveImport}
                                disabled={isSelectiveImporting || isSyncingSeries}
                                className="h-7 text-2xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1 cursor-pointer shadow-sm"
                              >
                                {isSelectiveImporting ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                                <span>{isSelectiveImporting ? "Importing..." : `Import ${selectedImportChapters.size} Selected`}</span>
                              </Button>
                            )}
                          </div>

                          {discoveredChapters.totalNew > 0 && (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="text-2xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={selectedImportChapters.size === discoveredChapters.newChapters?.length && discoveredChapters.newChapters?.length > 0}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedImportChapters(new Set(discoveredChapters.newChapters.map((ch: any) => ch.chapterNumber)));
                                      } else {
                                        setSelectedImportChapters(new Set());
                                      }
                                    }}
                                  />
                                  Select all ({discoveredChapters.newChapters?.length})
                                </label>
                                {selectedImportChapters.size > 0 && (
                                  <span className="text-2xs text-emerald-400 font-mono">
                                    {selectedImportChapters.size} selected
                                  </span>
                                )}
                              </div>
                              <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border/20 bg-background/30">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                                  {(discoveredChapters.newChapters || []).map((ch: any) => {
                                    const isChecked = selectedImportChapters.has(ch.chapterNumber);
                                    return (
                                      <label
                                        key={ch.chapterNumber}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-all ${
                                          isChecked
                                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                                            : "hover:bg-secondary/30 border border-transparent"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            const next = new Set(selectedImportChapters);
                                            if (checked) next.add(ch.chapterNumber);
                                            else next.delete(ch.chapterNumber);
                                            setSelectedImportChapters(next);
                                          }}
                                        />
                                        <span className="font-mono font-bold">Ch. {ch.chapterNumber}</span>
                                        {ch.title && <span className="text-muted-foreground truncate text-2xs">{ch.title}</span>}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}


                  {/* Add new scan source */}
                  <div className="pt-3 border-t border-border/20 space-y-2">
                    <Label className="text-xs font-semibold">Link New Scan Source URL</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        placeholder="e.g. https://asuracomic.net/series/... or https://qiscans.org/..."
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSource}
                        disabled={isAddingSource || !newSourceUrl.trim()}
                        className="w-full sm:w-auto shrink-0 text-xs h-9 font-semibold cursor-pointer"
                      >
                        {isAddingSource ? "Linking..." : "Link Source"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <DialogFooter className="p-3 sm:p-4 border-t border-border/20 bg-card/60 backdrop-blur-sm flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="text-[11px] sm:text-xs text-muted-foreground text-center sm:text-left truncate">
              {isCreatingNew ? (
                <span>Creating new series entry</span>
              ) : (
                <span className="truncate">
                  Slug: <span className="font-mono text-foreground font-semibold">{slug}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={saveMutation.isPending || createSeriesMutation.isPending}
                className="flex-1 sm:flex-none h-8 sm:h-9 text-xs"
              >
                Cancel
              </Button>

              {isCreatingNew ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => createSeriesMutation.mutate()}
                  disabled={!title.trim() || createSeriesMutation.isPending}
                  className="flex-1 sm:flex-none h-8 sm:h-9 gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer"
                >
                  {createSeriesMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Publish Series
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={!title.trim() || saveMutation.isPending}
                  className="flex-1 sm:flex-none h-8 sm:h-9 gap-1.5 font-bold text-xs cursor-pointer"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Live Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
