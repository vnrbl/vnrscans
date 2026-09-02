"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Globe,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Zap,
  ArrowRight,
  Search,
  Check,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { $extractCoversFromScanUrl, $autoImportSeriesCover } from "@/lib/api/scraper.actions";
import { $extractCoversFromComick } from "@/lib/api/comick-import.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ScanCoverImporterProps {
  seriesId: string;
  slug: string;
  currentCoverUrl?: string | null;
  seriesTitle?: string;
  trigger?: React.ReactNode;
}

export function ScanCoverImporter({
  seriesId,
  slug,
  currentCoverUrl,
  seriesTitle,
  trigger,
}: ScanCoverImporterProps) {
  const { user } = useAuth();
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canEdit = isAdmin || isMod || isUploader;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"scans" | "comick">("scans");
  const [scanUrl, setScanUrl] = useState("");
  const [comickQuery, setComickQuery] = useState(seriesTitle || "");
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
      return (data && data.length > 0 ? data[0] : null) as {
        id: string;
        source_url: string;
        source_site?: string;
      } | null;
    },
    enabled: open && !!seriesId,
  });

  useEffect(() => {
    if (existingSourceQ.data?.source_url && !scanUrl) {
      setScanUrl(existingSourceQ.data.source_url);
    }
  }, [existingSourceQ.data, scanUrl]);

  useEffect(() => {
    if (open && seriesTitle && !comickQuery) {
      setComickQuery(seriesTitle);
    }
  }, [open, seriesTitle, comickQuery]);

  // 1-Click Auto Import from Scan Source
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

  // Extract Covers from Scan Source
  const handleExtractFromScans = async () => {
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

  // Extract Covers from Comick.dev
  const handleExtractFromComick = async () => {
    const q = comickQuery.trim() || seriesTitle?.trim();
    if (!q) {
      toast.error("Please enter a series title to search Comick");
      return;
    }
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin");
        return;
      }
      setIsExtracting(true);
      const toastId = toast.loading(`Searching Comick.dev for "${q}"...`);
      const res = await $extractCoversFromComick({
        data: {
          query: q,
          accessToken: session.access_token,
        },
      });

      if (!res.success || !res.covers || res.covers.length === 0) {
        toast.error(res.error || "No covers found on Comick.dev", { id: toastId });
      } else {
        setExtractedCovers(res.covers);
        setSelectedCover(res.covers[0]);
        toast.success(`Found ${res.covers.length} cover(s) from Comick!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract Comick covers");
    } finally {
      setIsExtracting(false);
    }
  };

  // Apply Selected Cover and optionally save all discovered covers
  const applyCoverMutation = useMutation({
    mutationFn: async (coverToApply: string) => {
      if (!seriesId || !coverToApply) throw new Error("Invalid parameters");

      // 1. Get current series cover
      const { data: currentSeries } = await supabase
        .from("series")
        .select("cover_url")
        .eq("id", seriesId)
        .single();

      const oldCoverUrl = currentSeries?.cover_url;

      // 2. Preserve old cover in series_covers so it's never lost from cover selection
      if (oldCoverUrl && oldCoverUrl !== coverToApply) {
        const { data: oldExists } = await supabase
          .from("series_covers")
          .select("id")
          .eq("series_id", seriesId)
          .eq("image_url", oldCoverUrl)
          .maybeSingle();

        if (!oldExists) {
          await supabase.from("series_covers").insert({
            series_id: seriesId,
            image_url: oldCoverUrl,
            position: 1,
          });
        }
      }

      // 3. Update primary default cover_url to the selected one
      const { error: updateErr } = await supabase
        .from("series")
        .update({ cover_url: coverToApply, updated_at: new Date().toISOString() })
        .eq("id", seriesId);
      if (updateErr) throw updateErr;

      // 4. Add ONLY the selected cover to series_covers (and keep old cover preserved)
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
      toast.success("Selected cover applied & saved to Cover Selection!");
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
            className="gap-1.5 border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 text-xs font-semibold cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Import Cover</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-[#0e0e12] border-border/40 text-foreground overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Globe className="h-5 w-5 text-purple-400" />
            Import Cover Art & Alternative Covers
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Fetch high-resolution covers from Scan sources or Comick.dev, select your favorite, and preserve all in Cover Selection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Tabs */}
          <div className="flex rounded-xl bg-secondary/40 p-1 border border-border/30">
            <button
              type="button"
              onClick={() => setSourceType("scans")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sourceType === "scans"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌐 Scan Source (Asura / Flame / Qi)
            </button>
            <button
              type="button"
              onClick={() => setSourceType("comick")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sourceType === "comick"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📗 Comick.dev (Search Title)
            </button>
          </div>

          {sourceType === "scans" ? (
            <>
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
                    ? `Scans linked source (${new URL(existingSourceQ.data.source_url).hostname}) and previews all discovered covers.`
                    : "Enter custom scan URL below or click to auto-scan configured source."}
                </p>

                <Button
                  type="button"
                  onClick={handleAutoImport}
                  disabled={isAutoImporting || isExtracting}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs h-9 shadow-lg shadow-purple-600/20 gap-1.5 cursor-pointer"
                >
                  {isAutoImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Auto-Importing Cover...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Auto-Scan & Apply Default Cover</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Manual Scan URL Input */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Scan URL (Preview multiple candidate covers)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    placeholder="https://asuracomic.net/series/... or https://qiscans.org/..."
                    className="text-xs bg-secondary/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleExtractFromScans();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleExtractFromScans}
                    disabled={isExtracting || isAutoImporting || !scanUrl.trim()}
                    variant="outline"
                    className="shrink-0 text-xs h-9 font-semibold gap-1.5 cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        <span>Find Covers</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Comick.dev Cover Search */
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200">Fetch Covers from Comick.dev</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search by series title to discover high-resolution official volume covers from Comick.
                </p>
                <div className="flex gap-2 pt-1">
                  <Input
                    value={comickQuery}
                    onChange={(e) => setComickQuery(e.target.value)}
                    placeholder="e.g. Solo Leveling, Eleceed, Jujutsu Kaisen..."
                    className="text-xs bg-secondary/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleExtractFromComick();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleExtractFromComick}
                    disabled={isExtracting || !comickQuery.trim()}
                    className="shrink-0 text-xs h-9 font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        <span>Search Covers</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Discovered Covers Grid Selector */}
          {extractedCovers.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/20 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Select Cover to Set as Default ({extractedCovers.length} available):
                </Label>
                <span className="text-2xs text-muted-foreground">
                  (Only your selected cover will be added to Cover Selection)
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 scrollbar-thin">
                {extractedCovers.map((url, idx) => {
                  const isSelected = selectedCover === url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCover(url)}
                      className={`group relative aspect-[2/3] rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:scale-[1.03] shadow-md ${
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-black scale-102"
                          : "border-border/40 opacity-75 hover:opacity-100 hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Cover Option ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover bg-secondary"
                      />
                      {isSelected ? (
                        <div className="absolute top-1.5 right-1.5 rounded-full bg-primary text-primary-foreground p-1 shadow-lg">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          Cover #{idx + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between pt-3 border-t border-border/20 bg-card/40 p-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          {extractedCovers.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() =>
                selectedCover &&
                applyCoverMutation.mutate(selectedCover)
              }
              disabled={!selectedCover || applyCoverMutation.isPending}
              className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-md"
            >
              {applyCoverMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Covers...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Set Selected as Primary Cover</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
