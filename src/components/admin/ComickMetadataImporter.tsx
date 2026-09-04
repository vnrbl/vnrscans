"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Globe,
  Loader2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  BookOpen,
  Tag,
  Search,
  Zap,
  ArrowRight,
  ExternalLink,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $previewComickMetadata,
  $searchComickList,
  $enrichComickItemDetails,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
import { useProcessingTask } from "@/contexts/ProcessingTaskContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface ComickMetadataImporterProps {
  seriesId?: string;
  seriesTitle?: string;
  slug?: string;
  onMetadataImported?: (metadata: ComickExtractedMetadata) => void;
  trigger?: React.ReactNode;
}

export function ComickMetadataImporter({
  seriesId,
  seriesTitle,
  slug,
  onMetadataImported,
  trigger,
}: ComickMetadataImporterProps) {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canEdit = isAdmin || isMod || isUploader;
  const qc = useQueryClient();
  const processing = useProcessingTask();

  const [open, setOpen] = useState(false);
  const [comickQuery, setComickQuery] = useState(seriesTitle || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<ComickExtractedMetadata[]>([]);
  const [selectedComic, setSelectedComic] = useState<ComickExtractedMetadata | null>(null);

  // Options
  const [importSynopsis, setImportSynopsis] = useState(true);
  const [importGenresAndTags, setImportGenresAndTags] = useState(true);
  const [importCover, setImportCover] = useState(true);
  const [importAltTitles, setImportAltTitles] = useState(true);

  // Auto-search when opened with a series title
  useEffect(() => {
    if (open) {
      const initialQuery = comickQuery.trim() || seriesTitle?.trim() || "";
      if (initialQuery) {
        setComickQuery(initialQuery);
        void handleSearch(initialQuery);
      }
    } else {
      setSearchResults([]);
      setSelectedComic(null);
    }
  }, [open, seriesTitle]);

  // Select comic & enrich with full tags if not already loaded
  const handleSelectComic = async (item: ComickExtractedMetadata) => {
    setSelectedComic(item);
    if (item.tags.length <= 5 && item.slug) {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.access_token) {
          const res = await $enrichComickItemDetails({
            data: {
              slug: item.slug,
              accessToken: session.access_token,
            },
          });
          if (res.success && res.tags.length > 0) {
            const updated: ComickExtractedMetadata = {
              ...item,
              tags: Array.from(new Set([...item.tags, ...res.tags])),
              genres: res.genres.length > 0 ? Array.from(new Set([...item.genres, ...res.genres])) : item.genres,
            };
            setSelectedComic((curr) => (curr?.slug === item.slug ? updated : curr));
            setSearchResults((prev) =>
              prev.map((p) => (p.slug === item.slug ? updated : p))
            );
          }
        }
      } catch {
        // Fallback to existing tags
      }
    }
  };

  // Search Comick by Name or URL
  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? comickQuery).trim() || seriesTitle?.trim();
    if (!q) {
      toast.error("Please enter a title to search");
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin/uploader");
        return;
      }

      setIsSearching(true);
      const res = await $searchComickList({
        data: {
          query: q,
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.results || res.results.length === 0) {
        // Fallback: try single preview
        const prevRes = await $previewComickMetadata({
          data: {
            query: q,
            accessToken: session.access_token,
          },
        });

        if (prevRes.success && prevRes.metadata) {
          setSearchResults([prevRes.metadata]);
          void handleSelectComic(prevRes.metadata);
        } else {
          setSearchResults([]);
          setSelectedComic(null);
          toast.error(res.error || `No comics found for "${q}". Try another keyword.`);
        }
      } else {
        setSearchResults(res.results);
        void handleSelectComic(res.results[0]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search Comick");
    } finally {
      setIsSearching(false);
    }
  };

  // Direct 1-Click Import of the Selected Comic
  const handleImportSelected = async (comicOverride?: ComickExtractedMetadata) => {
    const comicToImport = comicOverride || selectedComic;
    if (!comicToImport) {
      toast.error("Please select a comic to import");
      return;
    }

    if (!seriesId) {
      // Form-only preview callback for create series forms
      if (onMetadataImported) {
        onMetadataImported(comicToImport);
      }
      toast.success(`Populated form with "${comicToImport.title}" metadata!`);
      setOpen(false);
      return;
    }

    const steps = [
      { id: "auth", label: "Verifying administrative authorization" },
      { id: "meta", label: `Extracting metadata for "${comicToImport.title}"` },
      { id: "cover", label: "Synchronizing high-res cover art and synopsis" },
      { id: "tags", label: "Updating categories, genres and taxonomy tags" },
      { id: "refresh", label: "Finalizing series and refreshing cache" },
    ];

    setOpen(false);
    processing.startTask({
      title: "Importing Comick Metadata",
      description: `Updating series with official data from Comick`,
      steps,
    });

    try {
      setIsImporting(true);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error("Please sign in as admin or uploader");
      }
      processing.setStepStatus("auth", "done", "Authorized");

      processing.setStepStatus("meta", "active", "Fetching official data...");
      processing.setStepStatus("meta", "done");

      processing.setStepStatus("cover", "active", "Applying cover and description...");
      const res = await $importComickMetadataToSeries({
        data: {
          seriesId,
          accessToken: session.access_token,
          importCover,
          importSynopsis,
          importGenresAndTags,
          importAlternativeTitles: importAltTitles,
          overrideMetadata: comicToImport,
        },
      });

      if (!res.success || !res.metadata) {
        throw new Error(res.error || "Import from Comick failed");
      }

      processing.setStepStatus("cover", "done", "Cover and synopsis updated");
      processing.setStepStatus("tags", "done", `${res.metadata.genres?.length || 0} genres & tags applied`);

      processing.setStepStatus("refresh", "active");
      if (onMetadataImported) {
        onMetadataImported(res.metadata);
      }
      qc.invalidateQueries({ queryKey: ["series"] });
      if (slug) qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });

      processing.setStepStatus("refresh", "done");
      await processing.completeTask("Comick Metadata Imported Successfully! ✓");
      toast.success(res.message || "Metadata, genres, and synopsis imported!");
    } catch (err: any) {
      processing.failTask(err.message || "Import failed");
      toast.error(err.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>Search & Import from Comick</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#0d0d12] border-border/50 text-foreground overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/20 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Auto-Search & Import from Comick</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Search by Title
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Search any series name to automatically fetch synopsis, genres, tags, alternative titles, and cover art.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Search Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Series Title or Keyword
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={comickQuery}
                  onChange={(e) => setComickQuery(e.target.value)}
                  placeholder="e.g. Solo Leveling, Eleceed, Jujutsu Kaisen..."
                  className="pl-9 h-10 text-xs bg-background/60 border-border/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSearch();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSearch()}
                disabled={isSearching || isImporting || !comickQuery.trim()}
                className="h-10 px-4 text-xs font-semibold gap-1.5 shrink-0"
              >
                {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Search</span>
              </Button>
            </div>
          </div>

          {/* Import Checklist Options */}
          <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 sm:p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
              Include In Import:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <Checkbox
                  checked={importGenresAndTags}
                  onCheckedChange={(c) => setImportGenresAndTags(Boolean(c))}
                />
                <span>Genres & Tags</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <Checkbox
                  checked={importSynopsis}
                  onCheckedChange={(c) => setImportSynopsis(Boolean(c))}
                />
                <span>Synopsis</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <Checkbox
                  checked={importCover}
                  onCheckedChange={(c) => setImportCover(Boolean(c))}
                />
                <span>Cover Art</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <Checkbox
                  checked={importAltTitles}
                  onCheckedChange={(c) => setImportAltTitles(Boolean(c))}
                />
                <span>Alt Titles</span>
              </label>
            </div>
          </div>

          {/* Matching Results Grid */}
          {searchResults.length > 1 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Found {searchResults.length} matches — Click to select:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((item, idx) => {
                  const isSelected = selectedComic?.slug === item.slug || selectedComic?.title === item.title;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void handleSelectComic(item)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/15 shadow-sm"
                          : "border-border/40 bg-card/60 hover:bg-card/90 hover:border-border/70"
                      }`}
                    >
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="h-12 w-9 rounded object-cover shrink-0 bg-secondary"
                        />
                      ) : (
                        <div className="h-12 w-9 rounded bg-secondary shrink-0 flex items-center justify-center text-xs">
                          📖
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        {item.status && (
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase">{item.status}</span>
                        )}
                        {item.genres.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.genres.slice(0, 3).join(", ")}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Comic Detailed Preview */}
          {selectedComic && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-4">
                {selectedComic.coverUrl && (
                  <div className="relative aspect-[2/3] w-20 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-secondary shadow-md">
                    <img
                      src={selectedComic.coverUrl}
                      alt={selectedComic.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {selectedComic.title}
                    </h4>
                    {selectedComic.status && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-400 border-emerald-500/30">
                        {selectedComic.status}
                      </Badge>
                    )}
                  </div>

                  {selectedComic.alternativeTitles && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      Alt: {selectedComic.alternativeTitles}
                    </p>
                  )}

                  {/* Genres Preview */}
                  {selectedComic.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedComic.genres.map((g, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 font-medium"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tags Preview */}
                  {selectedComic.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-emerald-400 font-bold mr-1">
                        Tags ({selectedComic.tags.length}):
                      </span>
                      {selectedComic.tags.slice(0, 18).map((t, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/40 bg-secondary/30"
                        >
                          #{t}
                        </Badge>
                      ))}
                      {selectedComic.tags.length > 18 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold"
                        >
                          +{selectedComic.tags.length - 18} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Synopsis Preview */}
              {selectedComic.description && (
                <div className="pt-2 border-t border-border/20">
                  <span className="text-[11px] font-bold text-foreground block mb-1">
                    Synopsis / Description:
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed font-light">
                    {selectedComic.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <p className="text-xs">Searching Comick by title name...</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/20 bg-card/60 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => void handleImportSelected()}
            disabled={isImporting || !selectedComic}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importing & Linking...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" />
                <span>{selectedComic ? `Auto-Import "${selectedComic.title}"` : "Auto-Import from Comick"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
