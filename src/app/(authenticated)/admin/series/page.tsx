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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { useAuth } from "@/hooks/useAuth";
import { $extractChaptersFromUrl, $extractImagesFromUrl, $syncImportSource } from "@/lib/api/scraper.actions";
import type { ChapterInfo } from "@/lib/chapter-scraper";
import { detectImportSource } from "@/lib/import-source-utils";
import { Button } from "@/components/ui/button";
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
  const { data: chapterData, error: chError } = await supabase
    .from("chapters")
    .select("id")
    .eq("series_id", seriesId)
    .eq("chapter_number", 0)
    .maybeSingle();
  if (chError) throw chError;
  let chapter = chapterData;
  if (!chapter) {
    const { data: newCh, error } = await supabase
      .from("chapters")
      .insert({
        series_id: seriesId,
        chapter_number: 0,
        title: "Covers",
        slug: "covers",
        chapter_type: "image",
        status: "published",
        uploaded_by: "System"
      })
      .select("id")
      .single();
    if (error) throw error;
    chapter = newCh;
  }
  const { data: existingPages, error: pError } = await supabase
    .from("chapter_pages")
    .select("id")
    .eq("chapter_id", chapter.id)
    .eq("image_url", coverUrl)
    .maybeSingle();
  if (pError) throw pError;
  if (!existingPages) {
    const { data: pages, error: countError } = await supabase
      .from("chapter_pages")
      .select("page_number")
      .eq("chapter_id", chapter.id)
      .order("page_number", { ascending: false })
      .limit(1);
    if (countError) throw countError;
    const nextNum = pages && pages.length > 0 ? pages[0].page_number + 1 : 1;
    const { error: insertError } = await supabase
      .from("chapter_pages")
      .insert({
        chapter_id: chapter.id,
        page_number: nextNum,
        image_url: coverUrl
      });
    if (insertError) throw insertError;
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
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "series", id);
    },
    onSuccess: () => {
      toast.success("Series deleted");
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });



  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Titles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {list.data?.series.length || 0} of {list.data?.totalCount || 0} titles
            {list.data &&
              list.data.totalPages > 1 &&
              ` (Page ${currentPage} of ${list.data.totalPages})`}
          </div>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {list.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {list.data?.series.length === 0 && !list.isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ||
            typeFilter !== "all" ||
            statusFilter !== "all" ||
            visibilityFilter !== "all"
              ? "No titles match your filters"
              : "No titles found"}
          </div>
        )}
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
      const json = await res.json();
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

      <div className="grid gap-3 rounded-md border border-border/40 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Genres
        </div>
        <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
          {genres.length === 0 && (
            <p className="text-xs text-muted-foreground">No genres yet. Add one below.</p>
          )}
          {genres.map((genre) => {
            const selected = form.genre_ids.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() =>
                  setForm({ ...form, genre_ids: toggleSelection(form.genre_ids, genre.id) })
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selected
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-border/60 bg-secondary/40 hover:border-violet-500"
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
        <Input
          value={form.new_genres}
          onChange={(e) => setForm({ ...form, new_genres: e.target.value })}
          placeholder="Add new genres, comma separated"
        />
      </div>

      <div className="grid gap-3 rounded-md border border-border/40 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-violet-500" />
          Tags
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search existing tags..."
            className="pl-9"
          />
        </div>
        <div className="hidden max-h-36 flex-wrap gap-2 overflow-y-auto sm:flex">
          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags yet. Add one below.</p>
          )}
          {tags.length > 0 && filteredTags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags match your search.</p>
          )}
          {visibleTags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <div key={tag.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    updateWithAutoRating({
                      ...form,
                      tag_ids: toggleSelection(form.tag_ids, tag.id),
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-border/60 bg-secondary/40 hover:border-violet-500"
                  }`}
                  style={
                    !selected && tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                  }
                >
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </button>

              </div>
            );
          })}
        </div>
        <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto sm:hidden">
          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags yet. Add one below.</p>
          )}
          {tags.length > 0 && filteredTags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags match your search.</p>
          )}
          {visibleMobileTags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <div key={tag.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    updateWithAutoRating({
                      ...form,
                      tag_ids: toggleSelection(form.tag_ids, tag.id),
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-border/60 bg-secondary/40 hover:border-violet-500"
                  }`}
                  style={
                    !selected && tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                  }
                >
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </button>

              </div>
            );
          })}
        </div>
        {(hiddenTagCount > 0 || hiddenMobileTagCount > 0 || showAllTags) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAllTags((value) => !value)}
            className="justify-self-start"
          >
            {showAllTags ? (
              "Show less"
            ) : (
              <>
                <span className="hidden sm:inline">Show all {filteredTags.length} tags</span>
                <span className="sm:hidden">Show all {filteredTags.length} tags</span>
              </>
            )}
          </Button>
        )}
        <Textarea
          rows={3}
          value={form.new_tags}
          onChange={(e) => updateWithAutoRating({ ...form, new_tags: e.target.value })}
          placeholder="Add new tags, comma separated"
          className="min-h-20 resize-y"
        />
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
