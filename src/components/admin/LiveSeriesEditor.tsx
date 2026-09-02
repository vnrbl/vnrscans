"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { logAdminAction } from "@/lib/adminLog";
import { $extractCoversFromScanUrl, $autoImportSeriesCover, $syncImportSource } from "@/lib/api/scraper.actions";
import { detectImportSource } from "@/lib/import-source-utils";
import { ComickMetadataImporter } from "@/components/admin/ComickMetadataImporter";
import { Button } from "@/components/ui/button";
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
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canEdit = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "synopsis" | "cover" | "sources">("general");

  // Form state
  const [title, setTitle] = useState(initialSeries?.title || "");
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

  // Cover Import state
  const [scanUrl, setScanUrl] = useState("");
  const [isExtractingCovers, setIsExtractingCovers] = useState(false);
  const [isAutoImportingCover, setIsAutoImportingCover] = useState(false);
  const [extractedCovers, setExtractedCovers] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Sync / Scan Source state
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isSyncingSeries, setIsSyncingSeries] = useState(false);

  // Query existing import source
  const importSourcesQ = useQuery({
    queryKey: ["admin", "series-import-sources", initialSeries?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("series_import_sources")
        .select("*")
        .eq("series_id", initialSeries?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open && !!initialSeries?.id,
  });

  // Sync state with props when modal opens
  useEffect(() => {
    if (open && initialSeries) {
      setTitle(initialSeries.title || "");
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
    }
  }, [open, initialSeries]);

  // 1-Click Auto-Import Cover (Zero URL input needed)
  const handleAutoImportCover = async () => {
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

  // Sync this series now
  const handleSyncThisSeries = async (sourceId: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }
      setIsSyncingSeries(true);
      const toastId = toast.loading("Syncing latest chapters from source...");
      const res = await $syncImportSource({
        data: {
          sourceId,
          accessToken: session.access_token,
          maxChapters: 50,
        },
      });

      if (!res.success) {
        toast.error(res.error || "Sync failed", { id: toastId });
      } else {
        toast.success(`Sync complete! Imported ${res.imported ?? 0} new chapter(s).`, { id: toastId });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
        qc.invalidateQueries({ queryKey: ["chapters", initialSeries?.id] });
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setIsSyncingSeries(false);
    }
  };

  // Add new scan source
  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return;
    try {
      setIsAddingSource(true);
      const preset = detectImportSource(newSourceUrl.trim());
      const { error } = await (supabase as any).from("series_import_sources").insert({
        series_id: initialSeries.id,
        source_url: newSourceUrl.trim(),
        source_site: preset.sourceSite,
        scanlation_group: preset.scanlationGroup || null,
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

  // Save Mutation
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
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("series")
        .update(payload)
        .eq("id", initialSeries.id);

      if (updateErr) throw updateErr;

      // 2. Record in series_covers if new cover
      if (coverUrl) {
        const { data: existingCover } = await supabase
          .from("series_covers")
          .select("id")
          .eq("series_id", initialSeries.id)
          .eq("image_url", coverUrl)
          .maybeSingle();

        if (!existingCover) {
          await supabase.from("series_covers").insert({
            series_id: initialSeries.id,
            image_url: coverUrl,
            position: 0,
          });
        }
      }

      await logAdminAction("update", "series", initialSeries.id, { title });
    },
    onSuccess: () => {
      toast.success("Series updated in real time!");
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["series", "covers", initialSeries?.id] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
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
              className="gap-1.5 border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Live Edit</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden flex flex-col p-0 bg-[#0d0d12] border-border/40 text-foreground">
          {/* Top Header Bar */}
          <DialogHeader className="p-6 pb-4 border-b border-border/20 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Real-Time Series Editor</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Edit series metadata, taxonomy, covers, and sync sources live on site
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-6">
                <a
                  href={`/admin/series-chapters/${initialSeries?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Manage Chapters
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 pt-4 border-t border-border/10 mt-4 overflow-x-auto">
              <Button
                type="button"
                variant={activeTab === "general" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setActiveTab("general")}
              >
                Basic Info
              </Button>
              <Button
                type="button"
                variant={activeTab === "synopsis" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => setActiveTab("synopsis")}
              >
                <Globe className="h-3 w-3 text-emerald-400" />
                <span>Synopsis & Comick Import</span>
              </Button>
              <Button
                type="button"
                variant={activeTab === "cover" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setActiveTab("cover")}
              >
                Cover & Scan Import
              </Button>
              <Button
                type="button"
                variant={activeTab === "sources" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setActiveTab("sources")}
              >
                Scan Sources ({(importSourcesQ.data || []).length})
              </Button>
            </div>
          </DialogHeader>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[60vh]">
            {/* ═══ 1. GENERAL TAB ═══ */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Series title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Alternative Titles</Label>
                  <Input
                    value={alternativeTitles}
                    onChange={(e) => setAlternativeTitles(e.target.value)}
                    placeholder="Korean / Japanese names, synonyms (comma separated)"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesTypes.map((t) => (
                          <SelectItem key={t} value={t} className="uppercase">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Content Rating</Label>
                    <Select value={contentRating} onValueChange={(v) => setContentRating(v as ContentRating)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentRatings.map((r) => (
                          <SelectItem key={r} value={r}>
                            {contentRatingLabels[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Author</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Artist</Label>
                    <Input
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Release Year</Label>
                    <Input
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Flags / Visibility */}
                <div className="pt-2 border-t border-border/20 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={isFeatured}
                      onCheckedChange={(c) => setIsFeatured(Boolean(c))}
                    />
                    <span>Featured Series</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={isTrending}
                      onCheckedChange={(c) => setIsTrending(Boolean(c))}
                    />
                    <span>Trending Series</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={isHidden}
                      onCheckedChange={(c) => setIsHidden(Boolean(c))}
                    />
                    <span className="text-orange-400">Hidden from Public</span>
                  </label>
                </div>
              </div>
            )}

            {/* ═══ 2. SYNOPSIS & COMICK IMPORT TAB ═══ */}
            {activeTab === "synopsis" && (
              <div className="space-y-4">
                {/* Comick.dev 1-Click Import Feature Banner */}
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-200">Import from Comick.dev</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Auto-imports genres, tags, description/synopsis, and alternative titles
                        </p>
                      </div>
                    </div>

                    <ComickMetadataImporter
                      seriesId={initialSeries?.id}
                      seriesTitle={title}
                      slug={slug}
                      onMetadataImported={(meta) => {
                        if (meta.description) setDescription(meta.description);
                        if (meta.alternativeTitles) setAlternativeTitles(meta.alternativeTitles);
                        if (meta.coverUrl) setCoverUrl(meta.coverUrl);
                        if (meta.status) setStatus(meta.status);
                        if (meta.releaseYear) setReleaseYear(String(meta.releaseYear));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Description / Synopsis</Label>
                  <Textarea
                    rows={10}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter full synopsis for this series..."
                    className="font-normal leading-relaxed text-xs"
                  />
                </div>
              </div>
            )}

            {/* ═══ 4. COVER & SCAN IMPORT TAB ═══ */}
            {activeTab === "cover" && (
              <div className="space-y-5">
                {/* 1-Click Auto Import Banner */}
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-purple-200">1-Click Auto-Import Cover</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically scans the linked source URL for this series and sets the high-resolution cover image with zero typing needed.
                  </p>
                  <Button
                    type="button"
                    onClick={handleAutoImportCover}
                    disabled={isAutoImportingCover}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs h-9 shadow-lg shadow-purple-600/20 gap-1.5"
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

                {/* Current Cover Preview */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-card/40">
                  <div className="relative aspect-[2/3] w-24 rounded-lg overflow-hidden border border-border/50 bg-secondary shrink-0">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-semibold">Current Cover URL</Label>
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
                              accept="image/*,video/mp4"
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
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setCoverUrl("")}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Import Cover from Scan URL Tool */}
                <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Custom Scan Source / Chapter URL</h3>
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
                      className="shrink-0 text-xs h-9"
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

                  {/* Discovered Covers Grid */}
                  {extractedCovers.length > 0 && (
                    <div className="pt-3 border-t border-border/20 space-y-2">
                      <Label className="text-xs font-semibold text-purple-300">
                        Discovered Covers ({extractedCovers.length}) — Click any to set as Main Cover:
                      </Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
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

            {/* ═══ 5. SCAN SOURCES & AUTO-SYNC TAB ═══ */}
            {activeTab === "sources" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-purple-400" />
                      Linked Scan Sources
                    </h3>
                  </div>

                  {(importSourcesQ.data || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No scan sources linked to this series yet. Add one below to enable 1-click chapter scraping & cover auto-import.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(importSourcesQ.data || []).map((src: any) => (
                        <div key={src.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-secondary/20">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase font-mono">{src.source_site || "Source"}</span>
                              {src.last_checked_at && (
                                <span className="text-2xs text-muted-foreground">
                                  Last checked: {new Date(src.last_checked_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{src.source_url}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSyncThisSeries(src.id)}
                            disabled={isSyncingSeries}
                            className="shrink-0 h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 gap-1.5"
                          >
                            <RefreshCw className={`h-3 w-3 ${isSyncingSeries ? "animate-spin" : ""}`} />
                            {isSyncingSeries ? "Syncing..." : "Sync Chapters"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new scan source */}
                  <div className="pt-3 border-t border-border/20 space-y-2">
                    <Label className="text-xs font-semibold">Link New Scan Source URL</Label>
                    <div className="flex gap-2">
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
                        className="shrink-0 text-xs h-9 font-semibold"
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
          <DialogFooter className="p-4 border-t border-border/20 bg-card/60 backdrop-blur-sm flex justify-between items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Slug: <span className="font-mono text-foreground font-semibold">{slug}</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={!title.trim() || saveMutation.isPending}
                className="gap-1.5 font-bold"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Live Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
