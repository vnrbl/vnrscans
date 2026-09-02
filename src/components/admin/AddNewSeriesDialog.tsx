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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $searchComickList,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
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
  const [scanSourceUrl, setScanSourceUrl] = useState("");
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
        setSelectedComic(res.results[0]);
        toast.success(`Found ${res.results.length} comic(s) on Comick!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search Comick");
    } finally {
      setIsSearchingComick(false);
    }
  };

  // Hybrid Submit: Create series with Comick metadata & link scan source for chapters
  const handleHybridCreate = async () => {
    if (!selectedComic) {
      toast.error("Please search and select a comic from Comick");
      return;
    }

    try {
      setIsHybridSubmitting(true);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in");
        return;
      }

      const generatedSlug = (
        selectedComic.slug?.trim() ||
        selectedComic.title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );

      const toastId = toast.loading(`Creating "${selectedComic.title}"...`);

      // 1. Insert series record into Supabase
      const { data: newSeries, error: insertError } = await (supabase.from("series") as any)
        .insert({
          title: selectedComic.title.trim(),
          slug: generatedSlug,
          alternative_titles: selectedComic.alternativeTitles || null,
          type: selectedType,
          status: selectedComic.status || "ongoing",
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

      // 2. Attach genres & tags from Comick
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

      // 3. If scan source URL provided, register & trigger chapter scraper
      if (scanSourceUrl.trim()) {
        toast.loading("Attaching scan source for chapters...", { id: toastId });
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
          // Trigger initial chapter sync in background
          $syncImportSource({
            data: {
              sourceId: newSource.id,
              accessToken: session.access_token,
            },
          }).catch(console.error);
        }
      }

      toast.success("Series created successfully!", { id: toastId });
      qc.invalidateQueries({ queryKey: ["series"] });
      setOpen(false);
      router.push(`/title/${newSeries.slug}`);
    } catch (err: any) {
      toast.error(`Creation failed: ${err.message}`);
    } finally {
      setIsHybridSubmitting(false);
    }
  };

  // Manual Series Creation Mutation
  const manualCreateMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const generatedSlug = (
        slug.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );

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

      return newSeries;
    },
    onSuccess: (newSeries) => {
      toast.success("Series created successfully!");
      qc.invalidateQueries({ queryKey: ["series"] });
      setOpen(false);
      router.push(`/title/${newSeries.slug}`);
    },
    onError: (err: any) => {
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <Label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-purple-400" /> Step 1: Search Series on Comick.dev
                </Label>
                <span className="text-[11px] text-muted-foreground font-normal">Fetches genres, tags, synopsis & HD cover</span>
              </div>

              <div className="flex gap-2">
                <Input
                  value={comickSearch}
                  onChange={(e) => setComickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchComick()}
                  placeholder="e.g. Solo Leveling, Eleceed, Return of the Mount Hua..."
                  className="text-xs bg-background/80"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSearchComick}
                  disabled={isSearchingComick || !comickSearch.trim()}
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 cursor-pointer"
                >
                  {isSearchingComick ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Comick Search Results Grid */}
              {comickResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-purple-500/20">
                  <span className="text-2xs font-semibold text-muted-foreground">
                    Select the matching series from Comick ({comickResults.length} found):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                    {comickResults.map((comic) => {
                      const isSelected = selectedComic?.slug === comic.slug;
                      return (
                        <div
                          key={comic.slug}
                          onClick={() => setSelectedComic(comic)}
                          className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500"
                              : "bg-card/40 border-border/40 hover:border-purple-500/40"
                          }`}
                        >
                          <img
                            src={comic.coverUrl || ""}
                            alt={comic.title}
                            className="h-14 w-10 object-cover rounded-md bg-secondary shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-foreground truncate">{comic.title}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{comic.releaseYear || "N/A"}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{comic.author || "Unknown"}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-purple-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Format Selector for Smart Mode */}
                  <div className="pt-2 flex items-center gap-3">
                    <Label className="text-xs font-bold shrink-0">Series Format:</Label>
                    <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                      <SelectTrigger className="text-xs h-8 w-36">
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

            {/* Step 2: Scan Chapter Source */}
            <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-3">
              <div>
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" /> Step 2: Attach Scan Source for Chapters (Optional)
                </Label>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Paste the series URL from Asura, Reaper, FlameScans, Realm, Void, etc. Chapters will be synced directly from this source!
                </p>
              </div>

              <Input
                value={scanSourceUrl}
                onChange={(e) => setScanSourceUrl(e.target.value)}
                placeholder="e.g. https://asuracomic.net/series/solo-leveling"
                className="text-xs bg-background/80"
              />
            </div>

            {/* Summary & Create Button */}
            {selectedComic && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    Ready to create <strong className="text-purple-300">{selectedComic.title}</strong>
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleHybridCreate}
                  disabled={isHybridSubmitting}
                  className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shrink-0 cursor-pointer shadow-md"
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
