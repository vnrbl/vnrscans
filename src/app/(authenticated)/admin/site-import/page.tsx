"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  ExternalLink,
  Globe2,
  Loader2,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  $discoverSiteCatalog,
  $getSiteImportJob,
  $listSiteImportJobs,
  $processNextSiteImportItem,
  $queueSiteCatalogItems,
  $retryFailedSiteImportItems,
  $updateSiteImportItemMetadata,
  type SiteImportItem,
  type SiteImportJob,
  type SiteImportJobSnapshot,
  type SiteImportMode,
} from "@/lib/api/site-import.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";

type CatalogFilter = "all" | "new" | "duplicate" | "selected" | "failed";

async function requireAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again before using Site Import.");
  return token;
}

export default function SiteImportPage() {
  const [siteUrl, setSiteUrl] = useState("https://asurascans.com/browse");
  const [snapshot, setSnapshot] = useState<SiteImportJobSnapshot | null>(null);
  const [recentJobs, setRecentJobs] = useState<SiteImportJob[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [importMode, setImportMode] = useState<SiteImportMode>("all");
  const [chapterLimit, setChapterLimit] = useState(5);
  const [autoPublish, setAutoPublish] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewItem, setPreviewItem] = useState<SiteImportItem | null>(null);
  const stopRequested = useRef(false);

  const refreshRecentJobs = useCallback(async () => {
    try {
      const accessToken = await requireAccessToken();
      const result = await $listSiteImportJobs({ data: { accessToken } });
      if (result.success && result.jobs) setRecentJobs(result.jobs);
    } catch {
      // The admin layout handles signed-out users; do not flash an error while auth hydrates.
    }
  }, []);

  useEffect(() => {
    void refreshRecentJobs();
  }, [refreshRecentJobs]);

  const visibleItems = useMemo(() => {
    if (!snapshot) return [];
    const query = search.trim().toLowerCase();
    return snapshot.items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.metadata.alternativeTitles.some((title) => title.toLowerCase().includes(query)) ||
        item.metadata.author?.toLowerCase().includes(query) ||
        item.metadata.genres.some((genre) => genre.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      if (filter === "new") return !item.existing_series_id;
      if (filter === "duplicate") return !!item.existing_series_id;
      if (filter === "selected") return selectedIds.has(item.id);
      if (filter === "failed") return item.status === "failed";
      return true;
    });
  }, [filter, search, selectedIds, snapshot]);

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.id));
  const selectedCount = selectedIds.size;
  const duplicateCount = snapshot?.items.filter((item) => item.existing_series_id).length ?? 0;
  const completedProgress = snapshot ? snapshot.job.imported_items + snapshot.job.failed_items : 0;
  const progress = snapshot?.job.selected_items
    ? Math.round((completedProgress / snapshot.job.selected_items) * 100)
    : 0;

  const discoverCatalog = async () => {
    setDiscovering(true);
    try {
      const accessToken = await requireAccessToken();
      const result = await $discoverSiteCatalog({ data: { siteUrl: siteUrl.trim(), accessToken } });
      if (!result.success || !result.snapshot)
        throw new Error(result.error || "Catalog scan failed");
      setSnapshot(result.snapshot);
      setSelectedIds(new Set());
      toast.success(`Found ${result.snapshot.items.length} series from ${result.snapshot.job.source_site}.`);
      void refreshRecentJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog scan failed");
    } finally {
      setDiscovering(false);
    }
  };

  const loadJob = async (jobId: string) => {
    setLoadingJob(true);
    try {
      const accessToken = await requireAccessToken();
      const result = await $getSiteImportJob({ data: { jobId, accessToken } });
      if (!result.success || !result.snapshot)
        throw new Error(result.error || "Job could not load");
      setSnapshot(result.snapshot);
      setSelectedIds(
        new Set(result.snapshot.items.filter((item) => item.selected).map((item) => item.id)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Job could not load");
    } finally {
      setLoadingJob(false);
    }
  };

  const patchProcessedItem = (item: SiteImportItem | undefined, job: SiteImportJob | undefined) => {
    setSnapshot((current) => {
      if (!current) return current;
      return {
        job: job ?? current.job,
        items: item
          ? current.items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
          : current.items,
      };
    });
  };

  const runProcessor = async (jobId: string) => {
    stopRequested.current = false;
    setProcessing(true);
    try {
      const accessToken = await requireAccessToken();
      let hasMore = true;
      while (hasMore && !stopRequested.current) {
        const result = await $processNextSiteImportItem({ data: { jobId, accessToken } });
        patchProcessedItem(result.item, result.job);
        if (result.message) toast.success(result.message, { duration: 2200 });
        if (result.error) toast.error(result.error, { duration: 5000 });
        if (!result.success && !result.item) throw new Error(result.error || "Import stopped");
        hasMore = Boolean(result.hasMore);
      }

      const refreshed = await $getSiteImportJob({ data: { jobId, accessToken } });
      if (refreshed.success && refreshed.snapshot) setSnapshot(refreshed.snapshot);
      if (stopRequested.current) toast.info("Import paused after the current batch.");
      else toast.success("Selected import queue finished.");
      void refreshRecentJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import stopped");
    } finally {
      setProcessing(false);
    }
  };

  const queueSelected = async () => {
    if (!snapshot || selectedIds.size === 0) {
      toast.error("Select at least one series to import.");
      return;
    }
    try {
      const accessToken = await requireAccessToken();
      const result = await $queueSiteCatalogItems({
        data: {
          jobId: snapshot.job.id,
          itemIds: Array.from(selectedIds),
          importMode,
          chapterLimit,
          autoPublish,
          accessToken,
        },
      });
      if (!result.success || !result.snapshot) throw new Error(result.error || "Queue failed");
      setSnapshot(result.snapshot);
      await runProcessor(snapshot.job.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Queue failed");
    }
  };

  const retryFailed = async () => {
    if (!snapshot) return;
    try {
      const accessToken = await requireAccessToken();
      const result = await $retryFailedSiteImportItems({
        data: { jobId: snapshot.job.id, accessToken },
      });
      if (!result.success || !result.snapshot) throw new Error(result.error || "Retry failed");
      setSnapshot(result.snapshot);
      await runProcessor(snapshot.job.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    }
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of visibleItems) {
        if (allVisibleSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  };

  const replaceItem = (updated: SiteImportItem) => {
    setSnapshot((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );
    setPreviewItem(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Site Import Center</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover an entire scans catalog, review metadata, then import selected titles in
          resumable batches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discover catalog</CardTitle>
          <CardDescription>
            Select a preset catalog source or enter a catalog URL. Catalog discovery does not
            download chapter images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Presets:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSiteUrl("https://asurascans.com/browse")}
              className={siteUrl.includes("asura") ? "border-primary text-primary" : ""}
            >
              Asura Scans
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSiteUrl("https://qiscans.org/series")}
              className={siteUrl.includes("qi") ? "border-primary text-primary" : ""}
            >
              Qi Scans
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={siteUrl}
              onChange={(event) => setSiteUrl(event.target.value)}
              placeholder="https://qiscans.org/series or https://asurascans.com/browse"
              className="font-mono"
            />
            <Button onClick={discoverCatalog} disabled={discovering || !siteUrl.trim()}>
              {discovering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {discovering ? "Scanning catalog" : "Discover series"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recentJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent scans</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recentJobs.map((job) => (
              <Button
                key={job.id}
                variant={snapshot?.job.id === job.id ? "default" : "outline"}
                size="sm"
                onClick={() => loadJob(job.id)}
                disabled={loadingJob || processing}
              >
                {job.source_site} · {job.total_items} · {job.status}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {snapshot && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Catalog titles" value={snapshot.job.total_items} />
            <Metric label="Already in library" value={duplicateCount} />
            <Metric label="Selected" value={selectedCount} />
            <Metric
              label="Imported / failed"
              value={`${snapshot.job.imported_items} / ${snapshot.job.failed_items}`}
            />
          </div>

          {snapshot.job.selected_items > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Import progress</span>
                  <span className="text-muted-foreground">
                    {progress}% · {snapshot.job.status}
                  </span>
                </div>
                <Progress value={progress} />
                {snapshot.job.error && (
                  <p className="mt-2 text-sm text-destructive">{snapshot.job.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <CardTitle className="text-base">Choose series</CardTitle>
                  <CardDescription>
                    Duplicate titles can be selected to update metadata and attach the Asura source.
                  </CardDescription>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="sm:col-span-2">
                    <Label htmlFor="catalog-search">Search</Label>
                    <Input
                      id="catalog-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Title, author, genre..."
                    />
                  </div>
                  <div>
                    <Label>Filter</Label>
                    <Select
                      value={filter}
                      onValueChange={(value) => setFilter(value as CatalogFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All titles</SelectItem>
                        <SelectItem value="new">New only</SelectItem>
                        <SelectItem value="duplicate">Existing only</SelectItem>
                        <SelectItem value="selected">Selected</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Import</Label>
                    <Select
                      value={importMode}
                      onValueChange={(value) => setImportMode(value as SiteImportMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metadata">Metadata only</SelectItem>
                        <SelectItem value="latest">Latest chapters</SelectItem>
                        <SelectItem value="all">All chapters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chapter-limit">Chapter limit</Label>
                    <Input
                      id="chapter-limit"
                      type="number"
                      min={1}
                      max={100}
                      value={chapterLimit}
                      disabled={importMode !== "latest"}
                      onChange={(event) =>
                        setChapterLimit(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={autoPublish}
                    onCheckedChange={(value) => setAutoPublish(value === true)}
                  />
                  Auto-publish imported chapters
                </label>
                <Button onClick={queueSelected} disabled={processing || selectedCount === 0}>
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseZap className="mr-2 h-4 w-4" />
                  )}
                  Import selected ({selectedCount})
                </Button>
                {processing ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      stopRequested.current = true;
                    }}
                  >
                    <Pause className="mr-2 h-4 w-4" /> Pause after batch
                  </Button>
                ) : snapshot.job.status === "importing" ? (
                  <Button variant="outline" onClick={() => runProcessor(snapshot.job.id)}>
                    <Play className="mr-2 h-4 w-4" /> Resume queue
                  </Button>
                ) : null}
                {snapshot.job.failed_items > 0 && !processing && (
                  <Button variant="outline" onClick={retryFailed}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry failed
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[720px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            allVisibleSelected ? true : selectedCount > 0 ? "indeterminate" : false
                          }
                          onCheckedChange={toggleVisible}
                          aria-label="Select visible series"
                        />
                      </TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead className="hidden md:table-cell">Details</TableHead>
                      <TableHead>Chapters</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow
                        key={item.id}
                        data-state={selectedIds.has(item.id) ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => {
                              setSelectedIds((current) => {
                                const next = new Set(current);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            aria-label={`Select ${item.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-[240px] items-center gap-3">
                            {item.cover_url ? (
                              <Image
                                src={item.cover_url}
                                alt=""
                                width={48}
                                height={64}
                                className="h-16 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                No cover
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="max-w-[320px] truncate font-medium">{item.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.metadata.type} · {item.metadata.status}
                              </div>
                              {item.metadata.genres.length > 0 && (
                                <div className="mt-1 max-w-[320px] truncate text-xs text-muted-foreground">
                                  {item.metadata.genres.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-w-[260px] text-xs text-muted-foreground">
                            <div>{item.metadata.author || "Unknown author"}</div>
                            <div className="truncate">
                              Updated {formatDate(item.last_chapter_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{item.chapter_count}</div>
                          {item.imported_chapters > 0 && (
                            <div className="text-xs text-emerald-500">
                              +{item.imported_chapters} imported
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge item={item} />
                          {item.error && (
                            <div
                              className="mt-1 max-w-[240px] truncate text-xs text-destructive"
                              title={item.error}
                            >
                              {item.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewItem(item)}
                              title="Review metadata"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Open source">
                              <a href={item.source_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {visibleItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          No catalog titles match this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Showing {visibleItems.length} of {snapshot.items.length} titles. Selection applies
                across filters.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {previewItem && (
        <MetadataDialog
          key={previewItem.id}
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onSaved={replaceItem}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ item }: { item: SiteImportItem }) {
  if (item.status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="mr-1 h-3 w-3" /> Failed
      </Badge>
    );
  }
  if (item.status === "completed") {
    return (
      <Badge className="bg-emerald-600">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Imported
      </Badge>
    );
  }
  if (item.status === "queued" || item.status === "importing") {
    return (
      <Badge className="bg-violet-600">
        <Loader2 className={`mr-1 h-3 w-3 ${item.status === "importing" ? "animate-spin" : ""}`} />{" "}
        {item.status}
      </Badge>
    );
  }
  if (item.existing_series_id) return <Badge variant="secondary">Existing</Badge>;
  return <Badge variant="outline">New</Badge>;
}

function MetadataDialog({
  item,
  onClose,
  onSaved,
}: {
  item: SiteImportItem;
  onClose: () => void;
  onSaved: (item: SiteImportItem) => void;
}) {
  const metadata = item.metadata;
  const [title, setTitle] = useState(metadata.title);
  const [alternativeTitles, setAlternativeTitles] = useState(metadata.alternativeTitles.join("\n"));
  const [description, setDescription] = useState(metadata.description);
  const [coverUrl, setCoverUrl] = useState(metadata.coverUrl || "");
  const [type, setType] = useState(metadata.type);
  const [status, setStatus] = useState(metadata.status);
  const [author, setAuthor] = useState(metadata.author || "");
  const [artist, setArtist] = useState(metadata.artist || "");
  const [genres, setGenres] = useState(metadata.genres.join(", "));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const accessToken = await requireAccessToken();
      const result = await $updateSiteImportItemMetadata({
        data: {
          itemId: item.id,
          title,
          alternativeTitles: splitList(alternativeTitles),
          description,
          coverUrl: coverUrl.trim() || null,
          type,
          status,
          author: author.trim() || null,
          artist: artist.trim() || null,
          genres: splitList(genres),
          accessToken,
        },
      });
      if (!result.success || !result.item)
        throw new Error(result.error || "Metadata could not be saved");
      onSaved(result.item);
      toast.success(`${result.item.title} metadata updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Metadata could not be saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review series metadata</DialogTitle>
          <DialogDescription>
            Changes are staged here and applied when this series is imported.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <Label>Author</Label>
            <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
          </div>
          <div>
            <Label>Artist</Label>
            <Input value={artist} onChange={(event) => setArtist(event.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manga">Manga</SelectItem>
                <SelectItem value="manhwa">Manhwa</SelectItem>
                <SelectItem value="manhua">Manhua</SelectItem>
                <SelectItem value="novel">Novel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="hiatus">Hiatus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Cover URL</Label>
            <Input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Genres</Label>
            <Input
              value={genres}
              onChange={(event) => setGenres(event.target.value)}
              placeholder="Action, Fantasy, System"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Alternative titles</Label>
            <Textarea
              rows={4}
              value={alternativeTitles}
              onChange={(event) => setAlternativeTitles(event.target.value)}
              placeholder="One title per line"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={8}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save staged metadata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function splitList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function formatDate(value: string | null) {
  if (!value) return "unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString();
}
