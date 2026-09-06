"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  ExternalLink,
  X,
  Pencil,
  Download,
  Layers,
  Tag,
  Sparkles,
  Search,
  RefreshCw,
  Power,
  Loader2,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { useAuth } from "@/hooks/useAuth";
import { moveToRecycleBin } from "@/lib/recycle-bin";
import { $extractChaptersFromUrl, $extractImagesFromUrl, $syncImportSource, $syncAllSeriesImportSources } from "@/lib/api/scraper.actions";
import type { ChapterInfo } from "@/lib/chapter-scraper";
import { detectImportSource } from "@/lib/import-source-utils";
import { Button } from "@/components/ui/button";
import { formatAppDate } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScanlationGroupPicker } from "@/components/admin/ScanlationGroupPicker";
import { ComickMetadataImporter } from "@/components/admin/ComickMetadataImporter";
import {
  buildChapterSlug,
  resolveScanlationGroup,
  scanlationGroupToSelectValue,
  SCANLATION_GROUP_NEW,
  SCANLATION_GROUP_NONE,
} from "@/lib/chapter-utils";


function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const seriesTypes = ["manga", "manhwa", "manhua", "novel"] as const;
const seriesStatuses = ["ongoing", "completed", "hiatus"] as const;
const chapterStatuses = ["draft", "published", "scheduled"] as const;
const contentRatings = ["safe", "suggestive", "nsfw", "pornographic"] as const;
type ContentRating = (typeof contentRatings)[number];

const contentRatingLabels: Record<ContentRating, string> = {
  safe: "Safe",
  suggestive: "Suggestive",
  nsfw: "NSFW",
  pornographic: "Pornographic",
};

const contentRatingHints: Record<ContentRating, string> = {
  safe: "General or non-sexual content.",
  suggestive: "Mild fanservice, teasing, ecchi, or mature themes.",
  nsfw: "Explicit mature nudity, smut, adult, hentai, or 18+ tags.",
  pornographic: "Porn, sex, hardcore, yaoi/yuri adult, or pornographic tags.",
};

const contentRatingRank: Record<ContentRating, number> = {
  safe: 0,
  suggestive: 1,
  nsfw: 2,
  pornographic: 3,
};

type SeriesForm = {
  title: string;
  type: string;
  status: string;
  author: string;
  artist: string;
  description: string;
  cover_url: string;
  release_year: string;
  alternative_titles: string;
  content_rating: ContentRating;
  content_rating_auto: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_hidden: boolean;
  chapter_count: string;
  genre_ids: string[];
  tag_ids: string[];
  new_genres: string;
  new_tags: string;
};

type ImportSourceRow = {
  id: string;
  series_id: string;
  source_url: string;
  source_site: string | null;
  scanlation_group: string | null;
  image_url_example: string | null;
  enabled: boolean;
  auto_publish: boolean;
  check_interval_minutes: number;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
};

type ImportLogRow = {
  id: string;
  source_id: string;
  status: "success" | "partial" | "failed";
  message: string;
  chapters_found: number;
  chapters_imported: number;
  chapters_skipped: number;
  chapters_failed: number;
  created_at: string;
};

const emptySeriesForm: SeriesForm = {
  title: "",
  type: "manga",
  status: "ongoing",
  author: "",
  artist: "",
  description: "",
  cover_url: "",
  release_year: "",
  alternative_titles: "",
  content_rating: "safe",
  content_rating_auto: true,
  is_featured: false,
  is_trending: false,
  is_hidden: false,
  chapter_count: "",
  genre_ids: [],
  tag_ids: [],
  new_genres: "",
  new_tags: "",
};

function seriesToForm(series: any): SeriesForm {
  return {
    title: series.title ?? "",
    type: series.type ?? "manga",
    status: series.status ?? "ongoing",
    author: series.author ?? "",
    artist: series.artist ?? "",
    description: series.description ?? "",
    cover_url: series.cover_url ?? "",
    release_year: series.release_year ? String(series.release_year) : "",
    alternative_titles: series.alternative_titles ?? "",
    content_rating: (series.content_rating ?? "safe") as ContentRating,
    content_rating_auto: false,
    is_featured: Boolean(series.is_featured),
    is_trending: Boolean(series.is_trending),
    is_hidden: Boolean(series.is_hidden),
    chapter_count: String(series.chapter_count || 0),
    genre_ids: ((series.series_genres as any[]) ?? []).map((sg) => sg.genre_id).filter(Boolean),
    tag_ids: ((series.series_tags as any[]) ?? []).map((st) => st.tag_id).filter(Boolean),
    new_genres: "",
    new_tags: "",
  };
}

function seriesPayloadFromForm(form: SeriesForm) {
  return {
    title: form.title,
    slug: slugify(form.title),
    type: form.type as any,
    status: form.status as any,
    author: form.author || null,
    artist: form.artist || null,
    description: form.description || null,
    cover_url: form.cover_url || null,
    release_year: form.release_year ? parseInt(form.release_year, 10) : null,
    alternative_titles: form.alternative_titles || null,
    content_rating: form.content_rating,
    is_featured: form.is_featured,
    is_trending: form.is_trending,
    is_hidden: form.is_hidden,
    updated_at: new Date().toISOString(),
  };
}

type GenreOption = { id: string; name: string; slug: string };
type TagOption = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
};

function namesFromInput(value: string) {
  return value
    .split(/[\\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizeRatingTag(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function ratingForTagName(name: string): ContentRating {
  const tag = normalizeRatingTag(name);
  if (!tag) return "safe";

  const pornographicTerms = [
    "porn",
    "pornographic",
    "hardcore",
    "sex",
    "sexual content",
    "explicit sex",
    "intercourse",
    "incest",
    "rape",
    "non consent",
    "netorare",
    "ntr",
    "adult yaoi",
    "adult yuri",
  ];
  if (pornographicTerms.some((term) => tag.includes(term))) return "pornographic";

  const nsfwTerms = [
    "nsfw",
    "18",
    "18+",
    "adult",
    "smut",
    "hentai",
    "mature",
    "explicit",
    "nudity",
    "nude",
    "lewd",
    "uncensored",
  ];
  if (nsfwTerms.some((term) => tag.includes(term))) return "nsfw";

  const suggestiveTerms = [
    "suggestive",
    "ecchi",
    "fanservice",
    "sexy",
    "sensual",
    "romance mature",
    "mild nudity",
    "revealing",
  ];
  if (suggestiveTerms.some((term) => tag.includes(term))) return "suggestive";

  return "safe";
}

function inferContentRating(tagNames: string[]) {
  return tagNames.reduce<ContentRating>((highest, tagName) => {
    const rating = ratingForTagName(tagName);
    return contentRatingRank[rating] > contentRatingRank[highest] ? rating : highest;
  }, "safe");
}

function ratingScanTermsFromForm(
  form: SeriesForm,
  genres: GenreOption[],
  tags: TagOption[],
) {
  const selectedTagNames = tags
    .filter((tag) => form.tag_ids.includes(tag.id))
    .map((tag) => tag.name);
  const selectedGenreNames = genres
    .filter((genre) => form.genre_ids.includes(genre.id))
    .map((genre) => genre.name);

  return [
    ...selectedTagNames,
    ...selectedGenreNames,
    ...namesFromInput(form.new_tags),
    ...namesFromInput(form.new_genres),
    form.title,
    form.alternative_titles,
    form.description,
  ].filter(Boolean);
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function ensureGenres(names: string[]) {
  const createdIds: string[] = [];
  for (const name of names) {
    const payload = { name, slug: slugify(name) };
    const { data, error } = await supabase
      .from("genres")
      .upsert(payload, { onConflict: "slug" } as any)
      .select("id")
      .single();
    if (error) throw error;
    if (data?.id) createdIds.push(data.id);
  }
  return createdIds;
}

async function ensureTags(names: string[]) {
  const createdIds: string[] = [];
  for (const name of names) {
    const { data, error } = await (supabase as any)
      .from("tags")
      .upsert({ name, slug: slugify(name), color: "#8B5CF6" }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    if (data?.id) createdIds.push(data.id);
  }
  return createdIds;
}

async function syncSeriesTaxonomy(seriesId: string, form: SeriesForm) {
  const [newGenreIds, newTagIds] = await Promise.all([
    ensureGenres(namesFromInput(form.new_genres)),
    ensureTags(namesFromInput(form.new_tags)),
  ]);

  const genreIds = uniqueIds([...form.genre_ids, ...newGenreIds]);
  const tagIds = uniqueIds([...form.tag_ids, ...newTagIds]);

  const { error: deleteGenresError } = await supabase
    .from("series_genres")
    .delete()
    .eq("series_id", seriesId);
  if (deleteGenresError) throw deleteGenresError;
  if (genreIds.length > 0) {
    const { error } = await supabase
      .from("series_genres")
      .insert(genreIds.map((genre_id) => ({ series_id: seriesId, genre_id })));
    if (error) throw error;
  }

  const { error: deleteTagsError } = await (supabase as any)
    .from("series_tags")
    .delete()
    .eq("series_id", seriesId);
  if (deleteTagsError) throw deleteTagsError;
  if (tagIds.length > 0) {
    const { error } = await (supabase as any)
      .from("series_tags")
      .insert(tagIds.map((tag_id: string) => ({ series_id: seriesId, tag_id })));
    if (error) throw error;
  }
}

async function syncSeriesCoverHistory(seriesId: string, coverUrl: string | null) {
  if (!coverUrl) return;
  // Check if this cover URL already exists in series_covers
  const { data: existing, error: checkErr } = await supabase
    .from("series_covers")
    .select("id")
    .eq("series_id", seriesId)
    .eq("image_url", coverUrl)
    .maybeSingle();
  if (checkErr) throw checkErr;
  if (!existing) {
    // Get next position
    const { data: lastCover, error: posErr } = await supabase
      .from("series_covers")
      .select("position")
      .eq("series_id", seriesId)
      .order("position", { ascending: false })
      .limit(1);
    if (posErr) throw posErr;
    const nextPos = lastCover && lastCover.length > 0 ? lastCover[0].position + 1 : 0;
    const { error: insertErr } = await supabase
      .from("series_covers")
      .insert({
        series_id: seriesId,
        image_url: coverUrl,
        position: nextPos,
      });
    if (insertErr) throw insertErr;
  }
}

export default function AdminSeries() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editingSeries, setEditingSeries] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const list = useQuery({
    queryKey: [
      "admin",
      "series",
      currentPage,
      searchQuery,
      typeFilter,
      statusFilter,
      visibilityFilter,
    ],
    queryFn: async () => {
      let query = supabase
        .from("series")
        .select(
          "id,slug,title,cover_url,type,status,content_rating,rating_average,view_count,release_year,author,artist,is_featured,is_trending,is_hidden,chapter_count,updated_at,series_genres(genre_id,genre:genres(id,name,slug)),series_tags(tag_id,tag:tags(id,name,slug,color,icon))",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,alternative_titles.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`,
        );
      }
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter as any);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      if (visibilityFilter === "visible") {
        query = query.eq("is_hidden", false);
      } else if (visibilityFilter === "hidden") {
        query = query.eq("is_hidden", true);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: seriesData, error, count } = await query;
      if (error) throw error;

      return {
        series: seriesData ?? [],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / itemsPerPage),
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SeriesForm>(emptySeriesForm);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleUploadImage = async (file: File) => {
    if (!user) throw new Error("Must be logged in to upload files");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("comment-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("comment-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const toastId = toast.loading("Uploading cover media...");
    try {
      const url = await handleUploadImage(file);
      setForm((prev) => ({ ...prev, cover_url: url }));
      toast.success("Cover media uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setUploadingCover(false);
    }
  };

  const genres = useQuery({
    queryKey: ["admin", "genres", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("genres").select("id,name,slug").order("name");
      if (error) throw error;
      return (data ?? []) as GenreOption[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tags = useQuery({
    queryKey: ["admin", "tags", "options"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tags")
        .select("id,name,slug,color,icon")
        .order("name");
      if (error) throw error;
      return (data ?? []) as TagOption[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .insert(seriesPayloadFromForm(form))
        .select("id")
        .single();
      if (error) throw error;
      await syncSeriesTaxonomy(data.id, form);
      await syncSeriesCoverHistory(data.id, form.cover_url || null);
      await logAdminAction("create", "series", data.id, { title: form.title });
      return data;
    },
    onSuccess: (data) => {
      const isNovel = form.type === "novel";
      toast.success("Series created");
      setOpen(false);
      setForm(emptySeriesForm);
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
      setCurrentPage(1); // Reset to first page
      
      if (isNovel && data?.id) {
        navigate({ to: "/admin/novels", search: { seriesId: data.id } });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSeries = useMutation({
    mutationFn: async () => {
      if (!editingSeries) throw new Error("No series selected");
      const { error } = await supabase
        .from("series")
        .update(seriesPayloadFromForm(form))
        .eq("id", editingSeries.id);
      if (error) throw error;
      await syncSeriesTaxonomy(editingSeries.id, form);
      await syncSeriesCoverHistory(editingSeries.id, form.cover_url || null);
      await logAdminAction("update", "series", editingSeries.id, { title: form.title });
    },
    onSuccess: () => {
      toast.success("Series updated");
      setEditingSeries(null);
      setForm(emptySeriesForm);
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async (s: any) => {
      const { error } = await supabase
        .from("series")
        .update({ is_hidden: !s.is_hidden })
        .eq("id", s.id);
      if (error) throw error;
      await logAdminAction(s.is_hidden ? "unhide" : "hide", "series", s.id, {
        title: s.title,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "series"] }),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction("delete", "tag", id);
    },
    onSuccess: () => {
      toast.success('Tag deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'tags'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      // Snapshot series to recycle bin prior to deletion
      const { data: item } = await supabase.from("series").select("*").eq("id", id).maybeSingle();
      if (item) {
        await moveToRecycleBin({
          itemType: "series",
          itemId: id,
          title: item.title,
          originalTable: "series",
          metadata: item,
          deletedBy: user?.id,
          deletedByUsername: user?.email?.split("@")[0] || "Admin",
        });
      }
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "series", id);
    },
    onSuccess: () => {
      toast.success("Series moved to Recycle Bin");
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
      qc.invalidateQueries({ queryKey: ["admin-recycle-bin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncOverlay, setSyncOverlay] = useState<{
    open: boolean;
    phase: "syncing" | "complete" | "error";
    totalSources: number;
    totalImported: number;
    results: Array<{
      sourceId: string;
      seriesId?: string;
      seriesTitle?: string;
      seriesSlug?: string;
      coverUrl?: string | null;
      sourceUrl: string;
      chaptersFound: number;
      imported: number;
      skipped: number;
      failed: number;
      status?: "success" | "partial" | "failed";
      error?: string;
      details?: Array<{ chapter: number; status: string; message?: string; pages?: number }>;
    }>;
    errorMessage?: string;
  }>({ open: false, phase: "syncing", totalSources: 0, totalImported: 0, results: [] });

  const [syncLogsOpen, setSyncLogsOpen] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "success" | "partial" | "failed">("all");
  const [logSearch, setLogSearch] = useState("");
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

  const syncLogs = useQuery({
    queryKey: ["admin", "sync-logs"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("series_import_logs")
          .select(`
            *,
            source:series_import_sources(
              id,
              source_url,
              source_site,
              scanlation_group,
              series:series(
                id,
                title,
                slug,
                cover_url,
                type
              )
            )
          `)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Retrying sync logs query without deep joins:", err);
        const { data, error } = await supabase
          .from("series_import_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data || [];
      }
    },
    enabled: syncLogsOpen,
  });

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSyncAll = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Please sign in as admin to sync series.");
        return;
      }
      setIsSyncingAll(true);
      setSyncOverlay({ open: true, phase: "syncing", totalSources: 0, totalImported: 0, results: [] });

      const res = await $syncAllSeriesImportSources({
        data: {
          accessToken: session.access_token,
          maxChaptersPerSeries: 50,
        },
      });

      if (!res.success) {
        setSyncOverlay((prev) => ({ ...prev, phase: "error", errorMessage: res.error || "Failed to sync all series" }));
      } else {
        setSyncOverlay({
          open: true,
          phase: "complete",
          totalSources: res.totalSources ?? 0,
          totalImported: res.totalImported ?? 0,
          results: res.results ?? [],
        });
        qc.invalidateQueries({ queryKey: ["admin", "series"] });
        qc.invalidateQueries({ queryKey: ["series"] });
        qc.invalidateQueries({ queryKey: ["admin", "sync-logs"] });
      }
    } catch (err: any) {
      setSyncOverlay((prev) => ({ ...prev, phase: "error", errorMessage: err.message || "Sync failed" }));
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Titles</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSyncLogsOpen(true); }}
            className="border-border/40 text-xs h-8"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Sync Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="border-purple-500/40 hover:border-purple-500 text-purple-300 hover:text-purple-200 bg-purple-950/20 text-xs h-8"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
            {isSyncingAll ? "Syncing..." : "Sync All Series"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-8">
                <Plus className="mr-1 h-3.5 w-3.5" />
                New title
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-h-[90dvh] sm:max-h-[85vh] max-w-2xl overflow-y-auto p-3.5 sm:p-6">
              <DialogHeader>
                <DialogTitle>Create title</DialogTitle>
              </DialogHeader>
              <SeriesFormFields
                form={form}
                setForm={setForm}
                genres={genres.data ?? []}
                tags={tags.data ?? []}
                uploadingCover={uploadingCover}
                onCoverFileChange={onCoverFileChange}
              />
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by title, alternative titles, author, or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-4 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="manga">MANGA</SelectItem>
              <SelectItem value="manhwa">MANHWA</SelectItem>
              <SelectItem value="manhua">MANHUA</SelectItem>
              <SelectItem value="novel">NOVEL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
            </SelectContent>
          </Select>

          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery ||
            typeFilter !== "all" ||
            statusFilter !== "all" ||
            visibilityFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setStatusFilter("all");
                setVisibilityFilter("all");
                setCurrentPage(1);
              }}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Showing {list.data?.series.length || 0} of {list.data?.totalCount || 0} titles
              {list.data &&
                list.data.totalPages > 1 &&
                ` (Page ${currentPage} of ${list.data.totalPages})`}
            </span>
            <div className="flex items-center rounded-lg border border-border/40 bg-card p-0.5">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("card")}
                title="Card view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {list.isLoading && (
        <div className="mt-6 rounded-lg border border-border/40 bg-card p-6 text-sm text-muted-foreground">Loading…</div>
      )}
      {list.data?.series.length === 0 && !list.isLoading && (
        <div className="mt-6 rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          {searchQuery ||
          typeFilter !== "all" ||
          statusFilter !== "all" ||
          visibilityFilter !== "all"
            ? "No titles match your filters"
            : "No titles found"}
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === "list" && (list.data?.series || []).length > 0 && (
        <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
          {(list.data?.series || []).map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              {s.cover_url ? (
                <img src={s.cover_url} alt="" className="h-14 w-10 rounded object-cover" />
              ) : (
                <div className="h-14 w-10 rounded bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/admin/series-chapters/$seriesId", params: { seriesId: s.id } })}
                    className="truncate text-left font-medium hover:text-primary cursor-pointer"
                  >
                    {s.title}
                  </button>
                  <Badge variant="outline" className="uppercase">
                    {s.type}
                  </Badge>
                  {s.is_hidden && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.status} · {contentRatingLabels[((s.content_rating ?? "safe") as ContentRating)]} ·{" "}
                  {Number(s.rating_average || 0).toFixed(1)}★ · {s.view_count} views ·{" "}
                  {s.chapter_count || 0} chapters
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {((s.series_genres as any[]) ?? [])
                    .map((sg) => sg.genre)
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((genre) => (
                      <Badge key={genre.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {genre.name}
                      </Badge>
                    ))}
                  {((s.series_tags as any[]) ?? [])
                    .map((st) => st.tag)
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="px-1.5 py-0 text-[10px]"
                        style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              </div>
              <a
                href={`/title/${s.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View on site"
              >
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </Button>
              </a>
              <ComickMetadataImporter
                seriesId={s.id}
                seriesTitle={s.title}
                slug={s.slug}
                trigger={
                  <Button variant="ghost" size="icon" title="Import from Comick.dev">
                    <Globe className="h-4 w-4 text-emerald-400" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/admin/series-chapters/$seriesId", params: { seriesId: s.id } })}
                title="Manage Chapters"
              >
                <Upload className="h-4 w-4 text-violet-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingSeries(s);
                  setForm(seriesToForm(s));
                }}
                title="Edit Title"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleHidden.mutate(s)}
                title={s.is_hidden ? "Show" : "Hide"}
              >
                {s.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This also removes all chapters and pages. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => del.mutate(s.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CARD VIEW ═══ */}
      {viewMode === "card" && (list.data?.series || []).length > 0 && (
        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(list.data?.series || []).map((s: any) => (
            <div
              key={s.id}
              className="group relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Cover image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Layers className="h-10 w-10 opacity-30" />
                  </div>
                )}
                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <Badge variant="outline" className="uppercase text-[10px] bg-black/60 text-white border-transparent backdrop-blur-sm">
                    {s.type}
                  </Badge>
                  {s.is_hidden && (
                    <Badge variant="secondary" className="text-[10px] bg-black/60 text-orange-300 border-transparent backdrop-blur-sm">
                      Hidden
                    </Badge>
                  )}
                </div>
                {/* Hover action overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
                  <a
                    href={`/title/${s.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on site"
                  >
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <ComickMetadataImporter
                    seriesId={s.id}
                    seriesTitle={s.title}
                    slug={s.slug}
                    trigger={
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full text-emerald-400 hover:text-emerald-300"
                        title="Import from Comick.dev"
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => navigate({ to: "/admin/series-chapters/$seriesId", params: { seriesId: s.id } })}
                    title="Manage Chapters"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      setEditingSeries(s);
                      setForm(seriesToForm(s));
                    }}
                    title="Edit Title"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => toggleHidden.mutate(s)}
                    title={s.is_hidden ? "Show" : "Hide"}
                  >
                    {s.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This also removes all chapters and pages. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(s.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {/* Card info */}
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/admin/series-chapters/$seriesId", params: { seriesId: s.id } })}
                  className="block w-full truncate text-left text-sm font-semibold hover:text-primary cursor-pointer transition-colors"
                  title={s.title}
                >
                  {s.title}
                </button>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="capitalize">{s.status}</span>
                  <span>·</span>
                  <span>{Number(s.rating_average || 0).toFixed(1)}★</span>
                  <span>·</span>
                  <span>{s.chapter_count || 0} ch</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {((s.series_genres as any[]) ?? [])
                    .map((sg) => sg.genre)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((genre) => (
                      <Badge key={genre.id} variant="secondary" className="px-1.5 py-0 text-[9px]">
                        {genre.name}
                      </Badge>
                    ))}
                  {((s.series_tags as any[]) ?? [])
                    .map((st) => st.tag)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="px-1.5 py-0 text-[9px]"
                        style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {list.data && list.data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || list.isLoading}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, list.data.totalPages) }, (_, i) => {
              let pageNum;
              if (list.data.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= list.data.totalPages - 2) {
                pageNum = list.data.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-10"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={list.isLoading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(list.data.totalPages, p + 1))}
            disabled={currentPage === list.data.totalPages || list.isLoading}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={!!editingSeries}
        onOpenChange={(v) => {
          if (!v) {
            setEditingSeries(null);
            setForm(emptySeriesForm);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit title</DialogTitle>
          </DialogHeader>
          <SeriesFormFields
            form={form}
            setForm={setForm}
            genres={genres.data ?? []}
            tags={tags.data ?? []}
            uploadingCover={uploadingCover}
            onCoverFileChange={onCoverFileChange}
          />
          <DialogFooter>
            <Button
              onClick={() => updateSeries.mutate()}
              disabled={!form.title || updateSeries.isPending}
            >
              {updateSeries.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SYNC OVERLAY ═══ */}
      {syncOverlay.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-2xl rounded-2xl border border-border/40 bg-card shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-border/30">
              {syncOverlay.phase === "syncing" && (
                <div className="flex flex-col items-center gap-4">
                  {/* Pulsing spinner */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
                    <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
                      <RefreshCw className="h-7 w-7 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight">Syncing All Series</h2>
                    <p className="mt-1 text-sm text-muted-foreground animate-pulse">
                      Discovering and importing new chapters from all sources...
                    </p>
                  </div>
                  {/* Animated progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                      style={{ width: "60%", backgroundSize: "200% 100%", animation: "shimmer 2s ease-in-out infinite" }}
                    />
                  </div>
                </div>
              )}
              {syncOverlay.phase === "complete" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-500">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight">Sync Complete</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Processed {syncOverlay.totalSources} source{syncOverlay.totalSources !== 1 ? "s" : ""} · Imported{" "}
                      <span className="font-semibold text-emerald-400">{syncOverlay.totalImported}</span> new chapter{syncOverlay.totalImported !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
              {syncOverlay.phase === "error" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight">Sync Failed</h2>
                    <p className="mt-1 text-sm text-destructive">{syncOverlay.errorMessage}</p>
                  </div>
                </div>
              )}
              {/* Close button */}
              {syncOverlay.phase !== "syncing" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8"
                  onClick={() => setSyncOverlay((prev) => ({ ...prev, open: false }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Per-series results */}
            {syncOverlay.results.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2.5">
                {syncOverlay.results.map((r, i) => {
                  const status = r.status || (r.error ? "failed" : r.failed > 0 && r.imported > 0 ? "partial" : r.failed > 0 ? "failed" : "success");
                  return (
                    <div
                      key={r.sourceId + i}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all animate-in fade-in slide-in-from-bottom-2 ${
                        status === "success"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : status === "partial"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {/* Cover Thumbnail */}
                      <div className="relative aspect-[2/3] w-10 shrink-0 rounded overflow-hidden border border-border/40 bg-secondary">
                        {r.coverUrl ? (
                          <img src={r.coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Layers className="h-4 w-4 opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-foreground">
                            {r.seriesTitle || r.sourceUrl}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${
                              status === "success"
                                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                : status === "partial"
                                ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                                : "border-red-500/50 text-red-400 bg-red-500/10"
                            }`}
                          >
                            {status}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{r.sourceUrl}</p>

                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Found: <strong className="text-foreground">{r.chaptersFound}</strong></span>
                          <span className="text-emerald-400">Imported: <strong>{r.imported}</strong></span>
                          <span>Skipped: <strong className="text-muted-foreground">{r.skipped}</strong></span>
                          {r.failed > 0 && <span className="text-red-400">Failed: <strong>{r.failed}</strong></span>}
                        </div>

                        {/* Error Reason */}
                        {r.error && (
                          <div className="mt-2 rounded bg-red-950/40 border border-red-500/30 p-2 text-xs text-red-300">
                            <strong>Reason for failure:</strong> {r.error}
                          </div>
                        )}

                        {/* Chapter Breakdown with Series Name */}
                        {r.details && r.details.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-border/20 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                              <span>Chapters ({r.details.length})</span>
                              <span>Series: <strong className="text-violet-400">{r.seriesTitle || "Series"}</strong></span>
                            </div>
                            <div className="max-h-36 overflow-y-auto rounded bg-black/40 p-1.5 space-y-1">
                              {r.details.map((d, dIdx) => (
                                <div key={dIdx} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-secondary/30">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-300 border-violet-500/20">
                                      {r.seriesTitle || "Series"}
                                    </Badge>
                                    <span className="font-semibold text-foreground">Chapter {d.chapter}</span>
                                    <span className={`text-[10px] font-medium ${d.status === "imported" ? "text-emerald-400" : d.status === "failed" ? "text-red-400" : "text-muted-foreground"}`}>
                                      ({d.status}{d.pages ? ` · ${d.pages} pages` : ""})
                                    </span>
                                  </div>
                                  {d.message && <span className="text-[10px] text-muted-foreground truncate max-w-[200px] font-mono">{d.message}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer with close button */}
            {syncOverlay.phase !== "syncing" && (
              <div className="border-t border-border/30 px-6 py-4 flex justify-end">
                <Button onClick={() => setSyncOverlay((prev) => ({ ...prev, open: false }))}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DETAILED SYNC LOGS DIALOG ═══ */}
      <Dialog open={syncLogsOpen} onOpenChange={setSyncLogsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col p-0 bg-[#0d0d12] border-border/40 text-foreground">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/20 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Detailed Sync History & Logs</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Complete chapter extraction logs, success/failure breakdowns, and error diagnostics
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            {syncLogs.data && syncLogs.data.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
                <div className="rounded-lg border border-border/30 bg-secondary/30 p-2.5 text-center">
                  <span className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold">Total Runs</span>
                  <p className="text-lg font-bold">{syncLogs.data.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-center">
                  <span className="text-2xs uppercase tracking-wider text-emerald-400 font-semibold">Imported</span>
                  <p className="text-lg font-bold text-emerald-400">
                    {syncLogs.data.reduce((acc: number, l: any) => acc + (l.chapters_imported || 0), 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/30 bg-secondary/30 p-2.5 text-center">
                  <span className="text-2xs uppercase tracking-wider text-muted-foreground font-semibold">Skipped</span>
                  <p className="text-lg font-bold text-foreground">
                    {syncLogs.data.reduce((acc: number, l: any) => acc + (l.chapters_skipped || 0), 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 text-center">
                  <span className="text-2xs uppercase tracking-wider text-red-400 font-semibold">Failed</span>
                  <p className="text-lg font-bold text-red-400">
                    {syncLogs.data.reduce((acc: number, l: any) => acc + (l.chapters_failed || 0), 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search logs by series, chapter, message, or source..."
                  className="pl-8 h-8 text-xs bg-secondary/30"
                />
                {logSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setLogSearch("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex gap-1">
                {(["all", "success", "partial", "failed"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={logFilter === f ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs capitalize"
                    onClick={() => setLogFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* Logs List Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[55vh]">
            {syncLogs.isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-xs">Loading detailed logs...</span>
              </div>
            )}

            {!syncLogs.isLoading && (!syncLogs.data || syncLogs.data.length === 0) && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No sync history records found in database.
              </div>
            )}

            {!syncLogs.isLoading &&
              (syncLogs.data || [])
                .filter((log: any) => {
                  if (logFilter !== "all" && log.status !== logFilter) return false;
                  if (logSearch.trim()) {
                    const q = logSearch.toLowerCase();
                    const msg = (log.message || "").toLowerCase();
                    const src = (log.source?.source_url || log.source_id || "").toLowerCase();
                    const sTitle = (log.source?.series?.title || "").toLowerCase();
                    const detailsArr: Array<any> = Array.isArray(log.details) ? log.details : [];
                    const matchesChapter = detailsArr.some((d: any) =>
                      String(d.chapter).toLowerCase().includes(q) ||
                      (d.series_title && d.series_title.toLowerCase().includes(q)) ||
                      (d.message && d.message.toLowerCase().includes(q))
                    );
                    return msg.includes(q) || src.includes(q) || sTitle.includes(q) || matchesChapter;
                  }
                  return true;
                })
                .map((log: any) => {
                  const isExpanded = expandedLogIds.includes(log.id);
                  const details: Array<{ chapter: number; status: string; message?: string; pages?: number; series_title?: string }> = Array.isArray(log.details) ? log.details : [];
                  const series = log.source?.series;
                  const seriesTitle = series?.title || details.find((d) => d.series_title)?.series_title || "Unknown Series";
                  const seriesCover = series?.cover_url;
                  const seriesId = series?.id;
                  const scanlationGroup = log.source?.scanlation_group;
                  const sourceUrl = log.source?.source_url;

                  const statusIcon =
                    log.status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> :
                    log.status === "partial" ? <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" /> :
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />;

                  const statusColor =
                    log.status === "success" ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50" :
                    log.status === "partial" ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" :
                    "border-red-500/30 bg-red-500/5 hover:border-red-500/50";

                  return (
                    <div key={log.id} className={`rounded-xl border p-4 transition-all shadow-sm ${statusColor}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Series Cover Thumbnail */}
                          <div className="relative aspect-[2/3] w-12 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-secondary shadow-sm">
                            {seriesCover ? (
                              <img src={seriesCover} alt={seriesTitle} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary/60">
                                <BookOpen className="h-5 w-5 opacity-40" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Series Header & Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {seriesId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSyncLogsOpen(false);
                                    navigate({ to: "/admin/series-chapters/$seriesId", params: { seriesId } });
                                  }}
                                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer text-left truncate max-w-[280px]"
                                  title={`Go to ${seriesTitle} chapters`}
                                >
                                  {seriesTitle}
                                </button>
                              ) : (
                                <span className="font-bold text-sm text-foreground truncate max-w-[280px]">
                                  {seriesTitle}
                                </span>
                              )}

                              {series?.type && (
                                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-medium">
                                  {series.type}
                                </Badge>
                              )}

                              {scanlationGroup && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                                  {scanlationGroup}
                                </Badge>
                              )}

                              <div className="ml-auto flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                                    log.status === "success" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" :
                                    log.status === "partial" ? "border-amber-500/50 text-amber-400 bg-amber-500/10" :
                                    "border-red-500/50 text-red-400 bg-red-500/10"
                                  }`}
                                >
                                  {log.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Source URL & Timestamps */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                              {sourceUrl && (
                                <span className="font-mono text-2xs truncate max-w-[320px] text-muted-foreground/80" title={sourceUrl}>
                                  {sourceUrl}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-mono text-2xs">
                                <Clock className="h-3 w-3" />
                                {formatAppDate(log.created_at)}
                              </span>
                              {log.duration_seconds && (
                                <span className="text-2xs text-muted-foreground bg-secondary px-1.5 py-0.2 rounded font-mono">
                                  {log.duration_seconds}s
                                </span>
                              )}
                            </div>

                            <p className="mt-1.5 text-xs text-foreground/90 font-medium">{log.message}</p>

                            {/* Summary counts pill */}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                              <span>Found: <strong className="text-foreground">{log.chapters_found ?? 0}</strong></span>
                              <span>Imported: <strong className="text-emerald-400">{log.chapters_imported ?? 0}</strong></span>
                              <span>Skipped: <strong className="text-muted-foreground">{log.chapters_skipped ?? 0}</strong></span>
                              {log.chapters_failed > 0 && (
                                <span>Failed: <strong className="text-red-400">{log.chapters_failed}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand Details Button */}
                        {details.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => toggleExpandLog(log.id)}
                          >
                            <span>{isExpanded ? "Hide" : "Details"} ({details.length})</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>

                      {/* Expandable Chapter-by-Chapter Details Table */}
                      {isExpanded && details.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/20 space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                              Chapter Execution Breakdown ({details.length} chapters):
                            </span>
                            <span className="text-2xs text-muted-foreground font-medium">
                              Series: <strong className="text-violet-400">{seriesTitle}</strong>
                            </span>
                          </div>
                          <div className="max-h-52 overflow-y-auto rounded-lg border border-border/30 bg-black/40 p-2 space-y-1.5">
                            {details.map((item, idx) => {
                              const isImp = item.status === "imported";
                              const isPrem = item.status === "premium_skipped";
                              const isFail = item.status === "failed";
                              const isSkip = item.status === "skipped";
                              const chSeriesTitle = item.series_title || seriesTitle;

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between gap-2 p-2 rounded text-xs ${
                                    isImp ? "bg-emerald-950/20 border border-emerald-500/20" :
                                    isPrem ? "bg-amber-950/20 border border-amber-500/20 text-amber-300" :
                                    isFail ? "bg-red-950/20 border border-red-500/20 text-red-300" :
                                    "bg-secondary/30 text-muted-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {/* Prominently show which series on EVERY chapter log */}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] shrink-0 font-semibold bg-violet-500/10 text-violet-300 border-violet-500/30 max-w-[200px] truncate"
                                      title={chSeriesTitle}
                                    >
                                      {chSeriesTitle}
                                    </Badge>

                                    <span className="font-bold text-foreground shrink-0">
                                      Chapter {item.chapter}
                                    </span>
                                    {isImp && (
                                      <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 shrink-0">
                                        Imported {item.pages ? `(${item.pages} pages)` : ""}
                                      </Badge>
                                    )}
                                    {isPrem && (
                                      <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 bg-amber-500/10 shrink-0">
                                        🔒 Premium / Locked
                                      </Badge>
                                    )}
                                    {isFail && (
                                      <Badge variant="outline" className="text-[9px] border-red-500/40 text-red-400 bg-red-500/10 shrink-0">
                                        Failed
                                      </Badge>
                                    )}
                                    {isSkip && (
                                      <Badge variant="secondary" className="text-[9px] shrink-0">
                                        Already exists
                                      </Badge>
                                    )}
                                  </div>
                                  {item.message && (
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[280px] font-mono text-right shrink-0">
                                      {item.message}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toggleSelection(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function SeriesFormFields({
  form,
  setForm,
  genres,
  tags,
  uploadingCover,
  onCoverFileChange,
}: {
  form: SeriesForm;
  setForm: (form: SeriesForm) => void;
  genres: GenreOption[];
  tags: TagOption[];
  uploadingCover?: boolean;
  onCoverFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const selectedTagNames = useMemo(() => {
    const selectedExistingTags = tags
      .filter((tag) => form.tag_ids.includes(tag.id))
      .map((tag) => tag.name);
    return [...selectedExistingTags, ...namesFromInput(form.new_tags)];
  }, [form.new_tags, form.tag_ids, tags]);
  const [tagSearch, setTagSearch] = useState("");
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const suggestTags = async () => {
    if (!form.title) {
      toast.error('Please enter a title first');
      return;
    }
    setIsSuggestingTags(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/manga?q=' + encodeURIComponent(form.title) + '&limit=1');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const json = await res.json() as { data?: any[] };
      const manga = json.data?.[0];
      if (!manga) {
        toast.error('No AI suggestions found for this title');
        return;
      }
      
      const suggestedNames = [
        ...(manga.genres?.map((g: any) => g.name) || []),
        ...(manga.themes?.map((t: any) => t.name) || [])
      ];
      
      if (suggestedNames.length === 0) {
        toast.info('No relevant tags found');
        return;
      }
      
      const newTagStr = suggestedNames.join(', ');
      updateWithAutoRating({ 
        ...form, 
        new_tags: form.new_tags ? form.new_tags + ', ' + newTagStr : newTagStr 
      });
      toast.success('AI suggested tags added!');
    } catch (err: any) {
      toast.error(err.message || 'Error suggesting tags');
    } finally {
      setIsSuggestingTags(false);
    }
  };
  const [showAllTags, setShowAllTags] = useState(false);
  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return tags;

    return tags.filter((tag) => {
      const selected = form.tag_ids.includes(tag.id);
      return (
        selected ||
        tag.name.toLowerCase().includes(query) ||
        tag.slug.toLowerCase().includes(query)
      );
    });
  }, [form.tag_ids, tagSearch, tags]);
  const visibleTags = showAllTags
    ? filteredTags
    : filteredTags.filter((tag, index) => form.tag_ids.includes(tag.id) || index < 25);
  const visibleMobileTags = showAllTags
    ? filteredTags
    : filteredTags.filter((tag, index) => form.tag_ids.includes(tag.id) || index < 10);
  const hiddenTagCount = Math.max(filteredTags.length - visibleTags.length, 0);
  const hiddenMobileTagCount = Math.max(filteredTags.length - visibleMobileTags.length, 0);
  const inferredRating = useMemo(
    () => inferContentRating(selectedTagNames),
    [selectedTagNames],
  );

  const updateWithAutoRating = (nextForm: SeriesForm) => {
    if (!nextForm.content_rating_auto) {
      setForm(nextForm);
      return;
    }

    const existingTagNames = tags
      .filter((tag) => nextForm.tag_ids.includes(tag.id))
      .map((tag) => tag.name);
    setForm({
      ...nextForm,
      content_rating: inferContentRating([...existingTagNames, ...namesFromInput(nextForm.new_tags)]),
    });
  };
  const scanRatingFromDetails = () => {
    setForm({
      ...form,
      content_rating: inferContentRating(ratingScanTermsFromForm(form, genres, tags)),
      content_rating_auto: false,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Title *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Enter series title"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seriesTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seriesStatuses.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-border/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>All Ratings</Label>
            <p className="text-xs text-muted-foreground">
              Auto rating reads selected and newly typed tags.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.content_rating_auto}
              onChange={(e) => {
                const nextForm = { ...form, content_rating_auto: e.target.checked };
                updateWithAutoRating(nextForm);
              }}
            />
            Auto
          </label>
        </div>
        <Select
          value={form.content_rating}
          onValueChange={(v) =>
            setForm({
              ...form,
              content_rating: v as ContentRating,
              content_rating_auto: false,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentRatings.map((rating) => (
              <SelectItem key={rating} value={rating}>
                {contentRatingLabels[rating]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={scanRatingFromDetails}>
          <Search className="mr-2 h-4 w-4" />
          Scan Details
        </Button>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant={
              form.content_rating === "safe"
                ? "default"
                : form.content_rating === "suggestive"
                  ? "secondary"
                  : "destructive"
            }
          >
            {contentRatingLabels[form.content_rating]}
          </Badge>
          <span>{contentRatingHints[form.content_rating]}</span>
          {form.content_rating_auto && inferredRating !== form.content_rating && (
            <span className="text-amber-500">
              Detected: {contentRatingLabels[inferredRating]}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Author</Label>
          <Input
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="Author name"
          />
        </div>
        <div>
          <Label>Artist</Label>
          <Input
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            placeholder="Artist name"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Release Year</Label>
          <Input
            type="number"
            value={form.release_year}
            onChange={(e) => setForm({ ...form, release_year: e.target.value })}
            placeholder="2024"
          />
        </div>
        <div>
          <Label>Chapter Count</Label>
          <Input
            type="number"
            value={form.chapter_count}
            onChange={(e) => setForm({ ...form, chapter_count: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label>Cover URL</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={form.cover_url}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
            placeholder="https://example.com/cover.jpg"
            className="flex-1"
          />
          <div className="relative shrink-0">
            <input
              type="file"
              accept="image/*,video/mp4"
              id="manga-cover-file-input"
              onChange={onCoverFileChange}
              className="hidden"
              disabled={uploadingCover}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("manga-cover-file-input")?.click()}
              disabled={uploadingCover}
              className="h-10"
            >
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <Label>Alternative Titles</Label>
        <Input
          value={form.alternative_titles}
          onChange={(e) => setForm({ ...form, alternative_titles: e.target.value })}
          placeholder="Alt title 1, Alt title 2"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Enter title description..."
        />
      </div>

      {/* ═══ COMICK.DEV METADATA & TAXONOMY IMPORT ═══ */}
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-bold text-emerald-200 block">
                Auto-Import Metadata & Taxonomy from Comick.dev
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically fetches and links genres, tags, description/synopsis, and high-res cover
              </p>
            </div>
          </div>

          <ComickMetadataImporter
            seriesTitle={form.title}
            onMetadataImported={(meta) => {
              setForm({
                ...form,
                description: meta.description || form.description,
                alternative_titles: meta.alternativeTitles || form.alternative_titles,
                cover_url: meta.coverUrl || form.cover_url,
                release_year: meta.releaseYear ? String(meta.releaseYear) : form.release_year,
                status: meta.status || form.status,
              });
            }}
          />
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-border/40 p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
          />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_trending}
            onChange={(e) => setForm({ ...form, is_trending: e.target.checked })}
          />
          Trending
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_hidden}
            onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
          />
          Hidden
        </label>
      </div>
    </div>
  );
}
