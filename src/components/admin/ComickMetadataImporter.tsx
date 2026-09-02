"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import {
  $previewComickMetadata,
  $importComickMetadataToSeries,
  type ComickExtractedMetadata,
} from "@/lib/api/comick-import.actions";
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

  const [open, setOpen] = useState(false);
  const [comickQuery, setComickQuery] = useState(seriesTitle || "");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ComickExtractedMetadata | null>(null);

  // Options
  const [importSynopsis, setImportSynopsis] = useState(true);
  const [importGenresAndTags, setImportGenresAndTags] = useState(true);
  const [importCover, setImportCover] = useState(true);
  const [importAltTitles, setImportAltTitles] = useState(true);

  useEffect(() => {
    if (open && seriesTitle && !comickQuery) {
      setComickQuery(seriesTitle);
    }
  }, [open, seriesTitle, comickQuery]);

  // Preview Comick Metadata
  const handlePreview = async () => {
    const q = comickQuery.trim() || seriesTitle?.trim();
    if (!q) {
      toast.error("Please enter a title or comick.dev URL");
      return;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin/uploader");
        return;
      }

      setIsPreviewing(true);
      const toastId = toast.loading("Searching Comick.dev...");
      const res = await $previewComickMetadata({
        data: {
          query: q,
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.metadata) {
        toast.error(res.error || "No comic found on Comick.dev", { id: toastId });
      } else {
        setPreviewData(res.metadata);
        toast.success(`Found "${res.metadata.title}" on Comick.dev!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch from Comick.dev");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Direct 1-Click Auto Import
  const handleDirectImport = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin/uploader");
        return;
      }

      setIsImporting(true);
      const toastId = toast.loading("Importing metadata, genres, and synopsis from Comick.dev...");

      if (seriesId) {
        // Import directly to series in DB
        const res = await $importComickMetadataToSeries({
          data: {
            seriesId,
            query: comickQuery.trim() || seriesTitle?.trim() || undefined,
            accessToken: session.access_token,
            importCover,
            importSynopsis,
            importGenresAndTags,
            importAlternativeTitles: importAltTitles,
          },
        });

        if (!res.success || !res.metadata) {
          toast.error(res.error || "Import from Comick.dev failed", { id: toastId });
        } else {
          toast.success(res.message || "Metadata, genres, and synopsis imported!", { id: toastId });
          if (onMetadataImported) {
            onMetadataImported(res.metadata);
          }
          qc.invalidateQueries({ queryKey: ["series"] });
          if (slug) qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
          qc.invalidateQueries({ queryKey: ["admin", "series"] });
          qc.invalidateQueries({ queryKey: ["admin", "genres"] });
          qc.invalidateQueries({ queryKey: ["admin", "tags"] });
          setOpen(false);
        }
      } else {
        // Form-only preview callback (e.g. during new series creation form)
        const q = comickQuery.trim() || seriesTitle?.trim() || "";
        const res = await $previewComickMetadata({
          data: {
            query: q,
            accessToken: session.access_token,
          },
        });

        if (!res.success || !res.metadata) {
          toast.error(res.error || "No comic found on Comick.dev", { id: toastId });
        } else {
          if (onMetadataImported) {
            onMetadataImported(res.metadata);
          }
          toast.success(`Metadata populated from Comick.dev!`, { id: toastId });
          setOpen(false);
        }
      }
    } catch (err: any) {
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
            <span>Import from Comick.dev</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#0d0d12] border-border/50 text-foreground overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/20 bg-card/60">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Import from Comick.dev</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Auto Metadata
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Instantly import genre pills, tags, synopsis/description, alternative titles, and cover from https://comick.dev/
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Query / URL Input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Comick.dev URL or Series Title
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={comickQuery}
                  onChange={(e) => setComickQuery(e.target.value)}
                  placeholder="e.g. https://comick.dev/comic/00-solo-leveling or Solo Leveling"
                  className="pl-9 h-10 text-xs bg-background/60 border-border/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePreview();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePreview}
                disabled={isPreviewing || isImporting || !comickQuery.trim()}
                className="h-10 px-4 text-xs font-semibold gap-1.5 shrink-0"
              >
                {isPreviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Fetch Preview</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste the full comick.dev link (e.g. <code className="text-primary font-mono">https://comick.dev/comic/...</code>) or title name.
            </p>
          </div>

          {/* Import Checklist Options */}
          <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Metadata to Import & Sync:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={importGenresAndTags}
                  onCheckedChange={(c) => setImportGenresAndTags(Boolean(c))}
                />
                <span>Genres & Tags</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={importSynopsis}
                  onCheckedChange={(c) => setImportSynopsis(Boolean(c))}
                />
                <span>Synopsis</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={importCover}
                  onCheckedChange={(c) => setImportCover(Boolean(c))}
                />
                <span>Cover Image</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={importAltTitles}
                  onCheckedChange={(c) => setImportAltTitles(Boolean(c))}
                />
                <span>Alt Titles</span>
              </label>
            </div>
          </div>

          {/* Preview Section */}
          {previewData && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-4">
                {previewData.coverUrl && (
                  <div className="relative aspect-[2/3] w-20 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-secondary shadow-md">
                    <img
                      src={previewData.coverUrl}
                      alt={previewData.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {previewData.title}
                    </h4>
                    {previewData.status && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-400 border-emerald-500/30">
                        {previewData.status}
                      </Badge>
                    )}
                  </div>

                  {previewData.alternativeTitles && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {previewData.alternativeTitles}
                    </p>
                  )}

                  {/* Genres Preview */}
                  {previewData.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {previewData.genres.map((g, idx) => (
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
                  {previewData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {previewData.tags.map((t, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/40"
                        >
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Synopsis Preview */}
              {previewData.description && (
                <div className="pt-2 border-t border-border/20">
                  <span className="text-[11px] font-bold text-foreground block mb-1">
                    Synopsis / Description:
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed font-light">
                    {previewData.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/20 bg-card/60 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDirectImport}
            disabled={isImporting || (!previewData && !comickQuery.trim())}
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
                <span>{previewData ? "Apply Comick Metadata to Series" : "1-Click Import from Comick.dev"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
