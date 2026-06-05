import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { $extractChaptersFromUrl, $extractImagesFromUrl } from "@/lib/api/scraper.functions";
import type { ChapterInfo } from "@/lib/chapter-scraper";
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

export const Route = createFileRoute("/_authenticated/admin/series")({
  head: () => ({ meta: [{ title: "Admin · Titles" }] }),
  component: AdminSeries,
});

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
  is_featured: boolean;
  is_trending: boolean;
  is_hidden: boolean;
  chapter_count: string;
  genre_ids: string[];
  tag_ids: string[];
  new_genres: string;
  new_tags: string;
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
    is_featured: form.is_featured,
    is_trending: form.is_trending,
    is_hidden: form.is_hidden,
    chapter_count: form.chapter_count ? parseInt(form.chapter_count, 10) : null,
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
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
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

function AdminSeries() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
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
          "*,series_genres(genre_id,genre:genres(id,name,slug)),series_tags(tag_id,tag:tags(id,name,slug,color,icon))",
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
        query = query.eq("type", typeFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
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

  const genres = useQuery({
    queryKey: ["admin", "genres", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("genres").select("id,name,slug").order("name");
      if (error) throw error;
      return (data ?? []) as GenreOption[];
    },
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
    },
    onSuccess: () => {
      toast.success("Series created");
      setOpen(false);
      setForm(emptySeriesForm);
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
      qc.invalidateQueries({ queryKey: ["admin", "genres"] });
      qc.invalidateQueries({ queryKey: ["admin", "tags"] });
      setCurrentPage(1); // Reset to first page
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
    },
    onSuccess: () => {
      toast.success("Series updated");
      setEditingSeries(null);
      setForm(emptySeriesForm);
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
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "series"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Series deleted");
      qc.invalidateQueries({ queryKey: ["admin", "series"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (selectedSeries) {
    return <ChapterManager seriesId={selectedSeries} onBack={() => setSelectedSeries(null)} />;
  }

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
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[140px]">
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
                  onClick={() => setSelectedSeries(s.id)}
                  className="truncate text-left font-medium hover:text-primary"
                >
                  {s.title}
                </button>
                <Badge variant="outline" className="uppercase">
                  {s.type}
                </Badge>
                {s.is_hidden && <Badge variant="secondary">Hidden</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.status} · {Number(s.rating_average || 0).toFixed(1)}★ · {s.view_count} views ·{" "}
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
              onClick={() => setSelectedSeries(s.id)}
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
}: {
  form: SeriesForm;
  setForm: (form: SeriesForm) => void;
  genres: GenreOption[];
  tags: TagOption[];
}) {
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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
        <Input
          value={form.cover_url}
          onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
          placeholder="https://example.com/cover.jpg"
        />
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
        <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
          {tags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags yet. Add one below.</p>
          )}
          {tags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setForm({ ...form, tag_ids: toggleSelection(form.tag_ids, tag.id) })}
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
            );
          })}
        </div>
        <Input
          value={form.new_tags}
          onChange={(e) => setForm({ ...form, new_tags: e.target.value })}
          placeholder="Add new tags, comma separated"
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

function ChapterManager({ seriesId, onBack }: { seriesId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const series = useQuery({
    queryKey: ["admin", "series", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").eq("id", seriesId).single();
      if (error) throw error;
      return data;
    },
  });

  const chapters = useQuery({
    queryKey: ["admin", "chapters", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("series_id", seriesId)
        .order("chapter_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Get existing scanlation groups for this series only
  const scanlationGroups = useQuery({
    queryKey: ["admin", "scanlation-groups", seriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("scanlation_group")
        .eq("series_id", seriesId)
        .not("scanlation_group", "is", null);

      if (error) throw error;

      // Get unique groups
      const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
      return uniqueGroups.sort();
    },
  });

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and search chapters
  const filteredChapters = useMemo(() => {
    if (!chapters.data) return [];
    return chapters.data.filter((ch) => {
      // 1. Group filter
      if (filterGroup !== "all") {
        if (ch.scanlation_group !== filterGroup) return false;
      }

      // 2. Search term filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase().trim();
        const chNum = String(ch.chapter_number).toLowerCase();
        const chGroup = (ch.scanlation_group || "").toLowerCase();

        if (!chNum.includes(query) && !chGroup.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [chapters.data, filterGroup, searchTerm]);

  // Pagination logic
  const totalItems = filteredChapters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Slice current page items
  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChapters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChapters, currentPage]);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [form, setForm] = useState({
    chapter_number: "",
    title: "",
    image_urls: "",
    chapter_url: "",
    status: "published",
    scheduled_at: "",
    uploaded_by: "",
    scanlation_group: "",
  });
  const [extracting, setExtracting] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [seriesUrl, setSeriesUrl] = useState("");
  const [imageUrlTypeExample, setImageUrlTypeExample] = useState("");
  const [discoveredChapters, setDiscoveredChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, phase: "" });
  const [groupSelect, setGroupSelect] = useState(SCANLATION_GROUP_NONE);
  const [groupNewName, setGroupNewName] = useState("");

  const resetChapterForm = () => {
    setForm({
      chapter_number: "",
      title: "",
      image_urls: "",
      chapter_url: "",
      status: "published",
      scheduled_at: "",
      uploaded_by: "",
      scanlation_group: "",
    });
    setGroupSelect(SCANLATION_GROUP_NONE);
    setGroupNewName("");
  };

  const getScanlationGroupForUpload = () =>
    resolveScanlationGroup(
      scanlationGroups.data && scanlationGroups.data.length > 0
        ? groupSelect
        : SCANLATION_GROUP_NEW,
      groupNewName,
    );

  // Get user profile for username
  const userProfile = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill uploaded_by with username when opening upload dialog
  useEffect(() => {
    if (open && userProfile.data?.username && !form.uploaded_by) {
      setForm((prev) => ({ ...prev, uploaded_by: userProfile.data.username || "" }));
    }
  }, [open, userProfile.data?.username]);

  // Also auto-fill when bulk upload dialog opens
  useEffect(() => {
    if (bulkUploadOpen && userProfile.data?.username && !form.uploaded_by) {
      setForm((prev) => ({ ...prev, uploaded_by: userProfile.data.username || "" }));
    }
  }, [bulkUploadOpen, userProfile.data?.username]);

  const create = useMutation({
    mutationFn: async () => {
      // Extract number from chapter_number input (which can now contain text/letters)
      const parsedNum =
        parseFloat(form.chapter_number.replace(/[^\d.]/g, "")) || parseFloat(form.chapter_number);
      const chapterNum = isNaN(parsedNum) ? 0 : parsedNum;

      const scanlation_group = getScanlationGroupForUpload();

      const { data: chapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          series_id: seriesId,
          chapter_number: chapterNum,
          title: null, // Hardcoded to null to completely remove the title option feature
          slug: buildChapterSlug(chapterNum, {
            title: null,
            scanlationGroup: scanlation_group,
          }),
          chapter_type: "image",
          status: form.status as any,
          scheduled_at:
            form.status === "scheduled" && form.scheduled_at
              ? new Date(form.scheduled_at).toISOString()
              : null,
          uploaded_by: form.uploaded_by || null,
          scanlation_group,
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      const urls = form.image_urls.split("\n").filter((u) => u.trim());
      if (urls.length === 0) throw new Error("At least one image URL is required");

      const pages = urls.map((url, idx) => ({
        chapter_id: chapter.id,
        page_number: idx + 1,
        image_url: url.trim(),
      }));

      const { error: pagesError } = await supabase.from("chapter_pages").insert(pages);
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      toast.success("Chapter uploaded");
      setOpen(false);
      resetChapterForm();
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "scanlation-groups", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openChapterEdit = async (chapter: any) => {
    const { data, error } = await supabase
      .from("chapter_pages")
      .select("image_url")
      .eq("chapter_id", chapter.id)
      .order("page_number");
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingChapter(chapter);
    const { selectValue, newGroupName } = scanlationGroupToSelectValue(
      chapter.scanlation_group,
      scanlationGroups.data ?? [],
    );
    setGroupSelect(selectValue);
    setGroupNewName(newGroupName);
    setForm({
      chapter_number: String(chapter.chapter_number ?? ""),
      title: chapter.title ?? "",
      image_urls: (data ?? []).map((p) => p.image_url).join("\n"),
      chapter_url: "",
      status: chapter.status ?? "published",
      scheduled_at: chapter.scheduled_at
        ? new Date(chapter.scheduled_at).toISOString().slice(0, 16)
        : "",
      uploaded_by: chapter.uploaded_by ?? "",
      scanlation_group: chapter.scanlation_group ?? "",
    });
  };

  const extractFromUrl = async () => {
    if (!form.chapter_url.trim()) {
      toast.error("Please enter a chapter URL");
      return;
    }

    try {
      setExtracting(true);
      const result = await $extractImagesFromUrl({ data: { url: form.chapter_url } });

      if (result.success && result.images) {
        setForm({ ...form, image_urls: result.images.join("\n") });
        toast.success(`Extracted ${result.images.length} images from chapter URL`);
      } else {
        toast.error(result.error || "Failed to extract images");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to extract images");
    } finally {
      setExtracting(false);
    }
  };

  const discoverChapters = async () => {
    if (!seriesUrl.trim()) {
      toast.error("Please enter a series URL");
      return;
    }

    try {
      setExtracting(true);
      const result = await $extractChaptersFromUrl({ data: { url: seriesUrl } });

      if (result.success && result.chapters) {
        setDiscoveredChapters(result.chapters);
        // Auto-select all chapters
        setSelectedChapters(new Set(result.chapters.map((_, i) => i)));
        toast.success(`Discovered ${result.chapters.length} chapters`);
      } else {
        toast.error(result.error || "Failed to discover chapters");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to discover chapters");
    } finally {
      setExtracting(false);
    }
  };

  const toggleChapterSelection = (index: number) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChapters(newSelected);
  };

  const getImageUrlTypePrefix = (exampleUrl: string): string | null => {
    try {
      const parsed = new URL(exampleUrl.trim());
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length >= 3) {
        return `${parsed.origin}/${segments.slice(0, 3).join("/")}/`;
      }
      return `${parsed.origin}${parsed.pathname.replace(/\/[^/]*$/, "/")}`;
    } catch {
      return null;
    }
  };

  const toggleChapterSelect = (chapterId: string) => {
    const next = new Set(selectedChapterIds);
    if (next.has(chapterId)) {
      next.delete(chapterId);
    } else {
      next.add(chapterId);
    }
    setSelectedChapterIds(next);
  };

  const allVisibleChaptersSelected =
    paginatedChapters.length > 0 && paginatedChapters.every((ch) => selectedChapterIds.has(ch.id));

  const toggleSelectAllVisibleChapters = () => {
    const next = new Set(selectedChapterIds);
    if (allVisibleChaptersSelected) {
      paginatedChapters.forEach((ch) => next.delete(ch.id));
    } else {
      paginatedChapters.forEach((ch) => next.add(ch.id));
    }
    setSelectedChapterIds(next);
  };

  const deleteSelectedChaptersMutation = useMutation({
    mutationFn: async (chapterIds: string[]) => {
      const { error: deletePagesError } = await supabase
        .from("chapter_pages")
        .delete()
        .in("chapter_id", chapterIds);
      if (deletePagesError) throw deletePagesError;

      const { error } = await supabase.from("chapters").delete().in("id", chapterIds);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedChapterIds(new Set());
      toast.success("Selected chapters deleted");
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUploadChapters = async () => {
    if (selectedChapters.size === 0) {
      toast.error("Please select at least one chapter");
      return;
    }

    const imageTypeExample = imageUrlTypeExample.trim();
    const imageUrlPrefix = imageTypeExample ? getImageUrlTypePrefix(imageTypeExample) : null;
    if (imageTypeExample && !imageUrlPrefix) {
      toast.error("Please enter a valid example image URL to filter by.");
      return;
    }

    const selectedList = Array.from(selectedChapters)
      .sort((a, b) => a - b)
      .map((index) => discoveredChapters[index]);

    try {
      setBulkUploading(true);
      const scanlation_group = getScanlationGroupForUpload();

      // ── Phase 1: Parallel image extraction (batches of 5) ──────────────
      setBulkProgress({ done: 0, total: selectedList.length, phase: "Extracting images" });

      const BATCH_SIZE = 5;
      type ExtractionResult =
        | { chapter: ChapterInfo; images: string[] }
        | { chapter: ChapterInfo; error: string };
      const extractionResults: ExtractionResult[] = [];

      for (let i = 0; i < selectedList.length; i += BATCH_SIZE) {
        const batch = selectedList.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (chapter) => {
            const result = await $extractImagesFromUrl({ data: { url: chapter.url } });
            if (!result.success || !result.images?.length) {
              throw new Error(result.error || "No images found");
            }

            const images = imageUrlPrefix
              ? result.images.filter((url) => url.startsWith(imageUrlPrefix))
              : result.images;

            if (imageUrlPrefix && images.length === 0) {
              throw new Error("No images matching the example URL type were found.");
            }

            return { chapter, images };
          }),
        );

        for (let j = 0; j < batch.length; j++) {
          const r = batchResults[j];
          if (r.status === "fulfilled") {
            extractionResults.push(r.value);
          } else {
            extractionResults.push({ chapter: batch[j], error: r.reason?.message ?? "Failed" });
          }
          setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }

      const succeeded = extractionResults.filter(
        (r): r is { chapter: ChapterInfo; images: string[] } => "images" in r,
      );
      const failed = extractionResults.filter(
        (r): r is { chapter: ChapterInfo; error: string } => "error" in r,
      );

      failed.forEach((r) => {
        console.error(`Failed to extract Chapter ${r.chapter.chapterNumber}:`, r.error);
        toast.error(`Skipped Chapter ${r.chapter.chapterNumber}: ${r.error}`);
      });

      if (succeeded.length === 0) {
        toast.error("No chapters could be extracted");
        return;
      }

      // ── Phase 2: Insert chapters & pages ──────────────────────────────
      setBulkProgress({ done: 0, total: succeeded.length, phase: "Saving to database" });

      let savedCount = 0;
      let saveFailCount = 0;

      for (const { chapter, images } of succeeded) {
        try {
          // Check if chapter already exists
          const targetSlug = buildChapterSlug(chapter.chapterNumber, {
            title: null,
            scanlationGroup: scanlation_group,
          });

          const { data: existingChapter } = await supabase
            .from("chapters")
            .select("id")
            .eq("series_id", seriesId)
            .eq("slug", targetSlug)
            .maybeSingle();

          if (existingChapter) {
            // Chapter already exists, skip it
            savedCount++;
          } else {
            // Chapter doesn't exist, create it new
            const { data: newChapter, error: chapterError } = await supabase
              .from("chapters")
              .insert({
                series_id: seriesId,
                chapter_number: chapter.chapterNumber,
                title: null,
                slug: targetSlug,
                chapter_type: "image",
                status: "published",
                uploaded_by: form.uploaded_by || null,
                scanlation_group,
              })
              .select()
              .single();

            if (chapterError) throw chapterError;

            const pages = images.map((url, idx) => ({
              chapter_id: newChapter.id,
              page_number: idx + 1,
              image_url: url,
            }));

            const { error: pagesError } = await supabase.from("chapter_pages").insert(pages);
            if (pagesError) throw pagesError;

            savedCount++;
          }
        } catch (error) {
          saveFailCount++;
          console.error(`Failed to save Chapter ${chapter.chapterNumber}:`, error);
          toast.error(`Failed to save Chapter ${chapter.chapterNumber}`);
        }
        setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      toast.success(
        `Bulk upload complete: ${savedCount} saved${saveFailCount > 0 ? `, ${saveFailCount} failed` : ""}${failed.length > 0 ? `, ${failed.length} skipped` : ""}`,
      );
      setBulkUploadOpen(false);
      setSeriesUrl("");
      setDiscoveredChapters([]);
      setSelectedChapters(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "scanlation-groups", seriesId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk upload failed");
    } finally {
      setBulkUploading(false);
      setBulkProgress({ done: 0, total: 0, phase: "" });
    }
  };

  const updateChapter = useMutation({
    mutationFn: async () => {
      if (!editingChapter) throw new Error("No chapter selected");
      // Extract number from chapter_number input (which can now contain text/letters)
      const parsedNum =
        parseFloat(form.chapter_number.replace(/[^\d.]/g, "")) || parseFloat(form.chapter_number);
      const chapterNum = isNaN(parsedNum) ? 0 : parsedNum;

      const scanlation_group = getScanlationGroupForUpload();
      const { error: chapterError } = await supabase
        .from("chapters")
        .update({
          chapter_number: chapterNum,
          title: null, // Hardcoded to null to completely remove the title option feature
          slug: buildChapterSlug(chapterNum, {
            title: null,
            scanlationGroup: scanlation_group,
          }),
          status: form.status as any,
          scheduled_at:
            form.status === "scheduled" && form.scheduled_at
              ? new Date(form.scheduled_at).toISOString()
              : null,
          uploaded_by: form.uploaded_by || null,
          scanlation_group,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingChapter.id);
      if (chapterError) throw chapterError;

      const urls = form.image_urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (urls.length === 0) throw new Error("At least one image URL is required");

      const { error: deleteError } = await supabase
        .from("chapter_pages")
        .delete()
        .eq("chapter_id", editingChapter.id);
      if (deleteError) throw deleteError;

      const { error: pagesError } = await supabase.from("chapter_pages").insert(
        urls.map((url, idx) => ({
          chapter_id: editingChapter.id,
          page_number: idx + 1,
          image_url: url,
        })),
      );
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      toast.success("Chapter updated");
      setEditingChapter(null);
      resetChapterForm();
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "scanlation-groups", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => {
      await supabase.from("chapter_pages").delete().eq("chapter_id", chapterId);
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Chapter deleted");
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{series.data?.title}</h1>
          <p className="text-sm text-muted-foreground">Manage chapters</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chapters ({chapters.data?.length || 0})</h2>
        <div className="flex gap-2">
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
              >
                <Layers className="mr-1 h-4 w-4" />
                Bulk Upload from Series URL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Upload Chapters from Series URL</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Uploaded By</Label>
                    <Input
                      placeholder="Uploader name"
                      value={form.uploaded_by}
                      onChange={(e) => setForm({ ...form, uploaded_by: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-filled with your username
                    </p>
                  </div>
                  <ScanlationGroupPicker
                    groups={scanlationGroups.data ?? []}
                    selectValue={groupSelect}
                    newGroupName={groupNewName}
                    onSelectValueChange={setGroupSelect}
                    onNewGroupNameChange={setGroupNewName}
                  />
                </div>

                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                  <Label className="text-violet-600 font-semibold">Series URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/manga/title-name"
                      value={seriesUrl}
                      onChange={(e) => setSeriesUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={discoverChapters}
                      disabled={!seriesUrl.trim() || extracting}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {extracting ? "Discovering..." : "Discover Chapters"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste the series main page URL. We'll automatically discover all available
                    chapters.
                  </p>
                  <div>
                    <Label>Image URL Example (optional)</Label>
                    <Input
                      placeholder="https://cdn.asurascans.com/asura-images/chapters/..."
                      value={imageUrlTypeExample}
                      onChange={(e) => setImageUrlTypeExample(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: enter one sample image URL from the source you want. Bulk upload
                      will keep only images matching that same URL pattern.
                    </p>
                  </div>
                </div>

                {discoveredChapters.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">
                        Select Chapters to Upload ({selectedChapters.size}/
                        {discoveredChapters.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedChapters(new Set(discoveredChapters.map((_, i) => i)))
                          }
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChapters(new Set())}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto border border-border/40 rounded-lg divide-y divide-border/40">
                      {discoveredChapters.map((chapter, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-3 hover:bg-secondary/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChapters.has(index)}
                            onChange={() => toggleChapterSelection(index)}
                            className="h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">Chapter {chapter.chapterNumber}</div>
                            {chapter.title && (
                              <div className="text-sm text-muted-foreground truncate">
                                {chapter.title}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground truncate">
                              {chapter.url}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={bulkUploadChapters}
                  disabled={selectedChapters.size === 0 || bulkUploading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {bulkUploading
                    ? `${bulkProgress.phase} (${bulkProgress.done}/${bulkProgress.total})…`
                    : `Upload ${selectedChapters.size} Chapter${selectedChapters.size !== 1 ? "s" : ""}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={deleteSelectedOpen} onOpenChange={setDeleteSelectedOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={selectedChapterIds.size === 0}
                className="ml-2"
              >
                Delete Selected ({selectedChapterIds.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {selectedChapterIds.size} Selected Chapter
                  {selectedChapterIds.size !== 1 ? "s" : ""}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the selected chapters and all their pages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteSelectedChaptersMutation.mutate(Array.from(selectedChapterIds));
                    setDeleteSelectedOpen(false);
                  }}
                  disabled={deleteSelectedChaptersMutation.isPending}
                >
                  {deleteSelectedChaptersMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetChapterForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="mr-1 h-4 w-4" />
                Upload Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Chapter from URLs</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Chapter Number *</Label>
                    <Input
                      type="text"
                      placeholder="e.g., 1, 1.5, or 1a"
                      value={form.chapter_number}
                      onChange={(e) => setForm({ ...form, chapter_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chapterStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Scheduled At</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                      disabled={form.status !== "scheduled"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Uploaded By</Label>
                    <Input
                      placeholder="Uploader name"
                      value={form.uploaded_by}
                      onChange={(e) => setForm({ ...form, uploaded_by: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-filled with your username
                    </p>
                  </div>
                  <ScanlationGroupPicker
                    groups={scanlationGroups.data ?? []}
                    selectValue={groupSelect}
                    newGroupName={groupNewName}
                    onSelectValueChange={setGroupSelect}
                    onNewGroupNameChange={setGroupNewName}
                  />
                </div>

                {/* Chapter URL Extraction */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-violet-600 font-semibold">
                      Option 1: Extract from Chapter URL
                    </Label>
                    <Download className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/manga/title/chapter-1"
                      value={form.chapter_url}
                      onChange={(e) => setForm({ ...form, chapter_url: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={extractFromUrl}
                      disabled={!form.chapter_url.trim() || extracting}
                      variant="outline"
                      className="border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
                    >
                      {extracting ? "Extracting..." : "Extract"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a chapter URL from any manga/manhwa site and we'll automatically extract
                    all images.
                  </p>
                </div>

                {/* Manual URL Input */}
                <div>
                  <Label>Option 2: Manual Image URLs (one per line) *</Label>
                  <Textarea
                    rows={10}
                    placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg&#10;https://example.com/page3.jpg"
                    value={form.image_urls}
                    onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Or paste image URLs directly, one URL per line. Supports direct image links from
                    any website.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.chapter_number || !form.image_urls.trim() || create.isPending}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {create.isPending ? "Uploading..." : "Upload Chapter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Group Filter Controls */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chapters (e.g. 335)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select
            value={filterGroup}
            onValueChange={(v) => {
              setFilterGroup(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {(scanlationGroups.data || []).map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-3 py-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allVisibleChaptersSelected}
              onCheckedChange={toggleSelectAllVisibleChapters}
              aria-label="Select all visible chapters"
            />
            <div>
              <div className="text-sm font-medium">Select visible chapters</div>
              <div className="text-xs text-muted-foreground">
                {selectedChapterIds.size} selected
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedChapterIds.size === 0}
            onClick={() => setDeleteSelectedOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
        {chapters.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
        {!chapters.isLoading && chapters.data?.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No chapters yet.</div>
        )}
        {!chapters.isLoading &&
          chapters.data &&
          chapters.data.length > 0 &&
          paginatedChapters.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No chapters match your search or filter criteria.
            </div>
          )}
        {paginatedChapters.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 p-3">
            <Checkbox
              checked={selectedChapterIds.has(ch.id)}
              onCheckedChange={() => toggleChapterSelect(ch.id)}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded bg-violet-600/10 text-sm font-bold text-violet-600">
              {ch.chapter_number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to="/title/$titleSlug/$chapterSlug"
                  params={{ titleSlug: series.data?.slug || "", chapterSlug: ch.slug }}
                  className="truncate font-medium hover:text-violet-600"
                  target="_blank"
                >
                  Chapter {ch.chapter_number}
                </Link>
                <ExternalLink className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(ch.created_at).toLocaleDateString()}</span>
                {ch.scanlation_group && (
                  <>
                    <span>•</span>
                    <span className="text-violet-600">{ch.scanlation_group}</span>
                  </>
                )}
                {ch.uploaded_by && (
                  <>
                    <span>•</span>
                    <span>by {ch.uploaded_by}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openChapterEdit(ch)}
              title="Edit Chapter"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Chapter {ch.chapter_number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the chapter and all its pages.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteChapter.mutate(ch.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 bg-transparent">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-semibold">{totalItems}</span> chapters
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-sm text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={`h-8 w-8 p-0 ${currentPage === p ? "bg-violet-600 hover:bg-violet-700 text-white font-medium" : ""}`}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!editingChapter}
        onOpenChange={(v) => {
          if (!v) {
            setEditingChapter(null);
            resetChapterForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Chapter Number *</Label>
                <Input
                  type="text"
                  placeholder="e.g., 1, 1.5, or 1a"
                  value={form.chapter_number}
                  onChange={(e) => setForm({ ...form, chapter_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chapterStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  disabled={form.status !== "scheduled"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Uploaded By</Label>
                <Input
                  value={form.uploaded_by}
                  onChange={(e) => setForm({ ...form, uploaded_by: e.target.value })}
                  placeholder="Uploader name"
                />
              </div>
              <ScanlationGroupPicker
                groups={scanlationGroups.data ?? []}
                selectValue={groupSelect}
                newGroupName={groupNewName}
                onSelectValueChange={setGroupSelect}
                onNewGroupNameChange={setGroupNewName}
              />
            </div>
            <div>
              <Label>Image URLs (one per line) *</Label>
              <Textarea
                rows={12}
                value={form.image_urls}
                onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => updateChapter.mutate()}
              disabled={!form.chapter_number || !form.image_urls.trim() || updateChapter.isPending}
            >
              {updateChapter.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
