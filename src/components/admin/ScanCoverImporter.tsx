"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Loader2, CheckCircle2, Image as ImageIcon, Sparkles, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { $extractCoversFromScanUrl, $autoImportSeriesCover } from "@/lib/api/scraper.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface ScanCoverImporterProps {
  seriesId: string;
  slug: string;
  currentCoverUrl?: string | null;
  trigger?: React.ReactNode;
}

export function ScanCoverImporter({ seriesId, slug, currentCoverUrl, trigger }: ScanCoverImporterProps) {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canEdit = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [extractedCovers, setExtractedCovers] = useState<string[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);

  // Check if series has an existing import source
  const existingSourceQ = useQuery({
    queryKey: ["series-import-source", seriesId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("series_import_sources")
        .select("id, source_url, source_site")
        .eq("series_id", seriesId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as { id: string; source_url: string; source_site?: string } | null;
    },
    enabled: open && !!seriesId,
  });

  useEffect(() => {
    if (existingSourceQ.data?.source_url && !scanUrl) {
      setScanUrl(existingSourceQ.data.source_url);
    }
  }, [existingSourceQ.data, scanUrl]);

  // 1-Click Auto Import Cover (Zero URL input needed)
  const handleAutoImport = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }
      setIsAutoImporting(true);
      const toastId = toast.loading("Auto-scanning series source for high-res cover...");
      const res = await $autoImportSeriesCover({
        data: {
          seriesId,
          accessToken: session.access_token,
          customUrl: scanUrl.trim() || undefined,
        },
      });

      if (!res.success || !res.coverUrl) {
        toast.error(res.error || "Failed to auto-import cover", { id: toastId });
      } else {
        toast.success(res.message || "Cover picture imported and set successfully!", { id: toastId });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
        qc.invalidateQueries({ queryKey: ["series", "covers", seriesId] });
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Auto-import failed");
    } finally {
      setIsAutoImporting(false);
    }
  };

  const handleExtract = async () => {
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
      setIsExtracting(true);
      const toastId = toast.loading("Extracting covers from scan source...");
      const res = await $extractCoversFromScanUrl({
        data: {
          url: scanUrl.trim(),
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.covers || res.covers.length === 0) {
        toast.error(res.error || "No covers found on that page", { id: toastId });
      } else {
        setExtractedCovers(res.covers);
        setSelectedCover(res.covers[0]);
        toast.success(`Found ${res.covers.length} cover picture(s)!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract covers");
    } finally {
      setIsExtracting(false);
    }
  };

  const applyCoverMutation = useMutation({
    mutationFn: async (coverToApply: string) => {
      if (!seriesId || !coverToApply) throw new Error("Invalid parameters");

      // 1. Update series cover_url
      const { error: updateErr } = await supabase
        .from("series")
        .update({ cover_url: coverToApply, updated_at: new Date().toISOString() })
        .eq("id", seriesId);
      if (updateErr) throw updateErr;

      // 2. Add to series_covers if not exists
      const { data: existing } = await supabase
        .from("series_covers")
        .select("id")
        .eq("series_id", seriesId)
        .eq("image_url", coverToApply)
        .maybeSingle();

      if (!existing) {
        await supabase.from("series_covers").insert({
          series_id: seriesId,
          image_url: coverToApply,
          position: 0,
        });
      }
    },
    onSuccess: () => {
      toast.success("Cover picture updated successfully!");
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["series", "covers", seriesId] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 text-xs font-semibold"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Import Cover</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#0e0e12] border-border/40 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Globe className="h-5 w-5 text-purple-400" />
            Import Cover Picture from Scan
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Auto-scan the series source and apply high-quality cover photos instantly with 1-click
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1-Click Auto Scan Banner */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200">1-Click Auto-Scan Cover</span>
              </div>
              {existingSourceQ.data?.source_site && (
                <span className="text-2xs uppercase px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
                  {existingSourceQ.data.source_site}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {existingSourceQ.data?.source_url
                ? `Scans linked source (${new URL(existingSourceQ.data.source_url).hostname}) and updates cover automatically.`
                : "Automatically scans the configured series source or custom URL below."}
            </p>

            <Button
              type="button"
              onClick={handleAutoImport}
              disabled={isAutoImporting || isExtracting}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs h-9 shadow-lg shadow-purple-600/20 gap-1.5"
            >
              {isAutoImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Auto-Importing Cover...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Auto-Scan & Apply Cover (1-Click)</span>
                </>
              )}
            </Button>
          </div>

          {/* Manual URL Input / Candidate Preview Option */}
          <div className="space-y-2 pt-2 border-t border-border/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">Scan URL (Optional / Override)</Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="https://asuracomic.net/series/... or https://qiscans.org/..."
                className="text-xs bg-secondary/30"
              />
              <Button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || isAutoImporting || !scanUrl.trim()}
                variant="outline"
                className="shrink-0 text-xs h-9 font-semibold"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Preview All"
                )}
              </Button>
            </div>
          </div>

          {/* Discovered Covers Candidate Grid */}
          {extractedCovers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/20">
              <Label className="text-xs font-semibold text-purple-300">
                Select Cover to Apply ({extractedCovers.length} found):
              </Label>
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {extractedCovers.map((url, idx) => {
                  const isSelected = selectedCover === url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCover(url)}
                      className={`group relative aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-102 ${
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

        <DialogFooter className="flex justify-between items-center sm:justify-between pt-2 border-t border-border/10">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
          {extractedCovers.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => selectedCover && applyCoverMutation.mutate(selectedCover)}
              disabled={!selectedCover || applyCoverMutation.isPending}
              className="font-bold bg-primary hover:bg-primary/90"
            >
              {applyCoverMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Set Selected as Cover"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
