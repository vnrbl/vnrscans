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
  Heart,
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

async function requireAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again before running the scraper.");
  return token;
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
  estimated_next_release_at?: string | null;
  release_cadence?: string | null;
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

export default function ChapterManager({ seriesId, onBack }: { seriesId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const series = useQuery({
    queryKey: ["admin", "series", seriesId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("series")
          .select("id,title,slug,cover_url,type,status")
          .eq("id", seriesId)
          .single();
        if (error) {
          console.error("Supabase series query error:", error);
          throw error;
        }
        return data;
      } catch (err) {
        console.error("Series fetch failed:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const chapters = useQuery({
    queryKey: ["admin", "chapters", seriesId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("chapters")
          .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group,novel_content")
          .eq("series_id", seriesId)
          .order("chapter_number", { ascending: false });
        if (error) {
          console.error("Supabase chapters query error:", error);
          throw error;
        }
        return data ?? [];
      } catch (err) {
        console.error("Chapters fetch failed:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  // Get existing scanlation groups for this series only
  const scanlationGroups = useQuery({
    queryKey: ["admin", "scanlation-groups", seriesId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("chapters")
          .select("scanlation_group")
          .eq("series_id", seriesId)
          .not("scanlation_group", "is", null);

        if (error) {
          console.error("Supabase scanlation groups query error:", error);
          throw error;
        }

        // Get unique groups
        const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
        return uniqueGroups.sort();
      } catch (err) {
        console.error("Scanlation groups fetch failed:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const importSources = useQuery({
    queryKey: ["admin", "series-import-sources", seriesId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("series_import_sources")
        .select("*")
        .eq("series_id", seriesId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ImportSourceRow[];
    },
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const importLogs = useQuery({
    queryKey: ["admin", "series-import-logs", seriesId, importSources.data?.map((s) => s.id).join(",")],
    queryFn: async () => {
      const sourceIds = importSources.data?.map((source) => source.id) ?? [];
      if (sourceIds.length === 0) return [] as ImportLogRow[];
      const { data, error } = await (supabase as any)
        .from("series_import_logs")
        .select("*")
        .in("source_id", sourceIds)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ImportLogRow[];
    },
    enabled: !!importSources.data,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const chapterLikeCounts = useQuery({
    queryKey: ["admin", "chapter-like-counts", seriesId],
    queryFn: async () => {
      const { data: chs } = await supabase
        .from("chapters")
        .select("id")
        .eq("series_id", seriesId);

      if (!chs || chs.length === 0) return new Map<string, number>();
      const ids = chs.map((c) => c.id);

      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("chapter_id")
        .in("chapter_id", ids)
        .eq("reaction_type", "heart");

      if (error) return new Map<string, number>();
      const countMap = new Map<string, number>();
      (data ?? []).forEach((row) => {
        if (row.chapter_id) {
          countMap.set(row.chapter_id, (countMap.get(row.chapter_id) || 0) + 1);
        }
      });
      return countMap;
    },
    staleTime: 1000 * 60 * 2,
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
    novel_content: "",
  });
  const [extracting, setExtracting] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [deleteUrlOpen, setDeleteUrlOpen] = useState(false);
  const [seriesUrl, setSeriesUrl] = useState("");
  const [imageUrlTypeExample, setImageUrlTypeExample] = useState("");
  const [deleteUrl, setDeleteUrl] = useState("");
  const [deleteNegativeUrl, setDeleteNegativeUrl] = useState("");
  const [deleteUrlResults, setDeleteUrlResults] = useState<
    {
      id: string;
      chapter_id: string;
      page_number: number;
      image_url: string;
    }[]
  >([]);
  const [deleteUrlLoading, setDeleteUrlLoading] = useState(false);
  const [deleteUrlStatus, setDeleteUrlStatus] = useState("");
  const [discoveredChapters, setDiscoveredChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, phase: "" });
  const [groupSelect, setGroupSelect] = useState(SCANLATION_GROUP_NONE);
  const [groupNewName, setGroupNewName] = useState("");
  const [autoSourceUrl, setAutoSourceUrl] = useState("");
  const [autoSourceSite, setAutoSourceSite] = useState("");
  const [autoSourceGroup, setAutoSourceGroup] = useState("");
  const [autoSourceImageExample, setAutoSourceImageExample] = useState("");
  const [autoSourceInterval, setAutoSourceInterval] = useState("60");
  const [autoSourcePublish, setAutoSourcePublish] = useState(true);
  const [autoSourceEnabled, setAutoSourceEnabled] = useState(true);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

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
      novel_content: "",
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

  const scanlationGroupLabel = (group: string | null) => group || "No Group";

  const handleAutoSourceUrlChange = (value: string) => {
    setAutoSourceUrl(value);
    const detected = detectImportSource(value);
    setAutoSourceSite(detected.sourceSite);
    setAutoSourceGroup(detected.scanlationGroup);
    setAutoSourceImageExample(detected.imageUrlExample ?? "");
  };

  const resetAutoSourceForm = () => {
    setAutoSourceUrl("");
    setAutoSourceSite("");
    setAutoSourceGroup("");
    setAutoSourceImageExample("");
    setAutoSourceInterval("60");
    setAutoSourcePublish(true);
    setAutoSourceEnabled(true);
  };

  const saveImportSourceMutation = useMutation({
    mutationFn: async () => {
      const sourceUrl = autoSourceUrl.trim();
      if (!sourceUrl) throw new Error("Source URL is required.");
      new URL(sourceUrl);

      const detected = detectImportSource(sourceUrl);
      const interval = Number.parseInt(autoSourceInterval, 10);
      const { error } = await (supabase as any).from("series_import_sources").insert({
        series_id: seriesId,
        source_url: sourceUrl,
        source_site: autoSourceSite.trim() || detected.sourceSite,
        scanlation_group: autoSourceGroup.trim() || detected.scanlationGroup || null,
        image_url_example: autoSourceImageExample.trim() || detected.imageUrlExample || null,
        enabled: autoSourceEnabled,
        auto_publish: autoSourcePublish,
        check_interval_minutes: Number.isFinite(interval) ? Math.max(interval, 10) : 60,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Auto import source saved.");
      resetAutoSourceForm();
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", seriesId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateImportSourceMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ImportSourceRow> }) => {
      const { error } = await (supabase as any)
        .from("series_import_sources")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", seriesId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteImportSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("series_import_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Auto import source deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "series-import-logs", seriesId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkImportSourceNow = async (sourceId: string) => {
    setSyncingSourceId(sourceId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again before running auto import.");

      const result = await $syncImportSource({
        data: { sourceId, accessToken, maxChapters: 10 },
      });

      if (!result.success) {
        throw new Error(result.error || "Auto import failed.");
      }

      toast.success(
        `Auto import complete: ${result.imported} imported, ${result.failed} failed.`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "scanlation-groups", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "series-import-sources", seriesId] });
      qc.invalidateQueries({ queryKey: ["admin", "series-import-logs", seriesId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto import failed.");
    } finally {
      setSyncingSourceId(null);
    }
  };

  const findExistingChapterByNumberAndGroup = async (
    chapterNumber: number,
    scanlationGroup: string | null,
  ) => {
    let query = (supabase as any)
      .from("chapters")
      .select("id")
      .eq("series_id", seriesId)
      .eq("chapter_number", chapterNumber)
      .limit(1);

    query = scanlationGroup
      ? query.eq("scanlation_group", scanlationGroup)
      : query.is("scanlation_group", null);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  };

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
      setForm((prev) => ({ ...prev, uploaded_by: userProfile.data?.username || "" }));
    }
  }, [open, userProfile.data?.username]);

  // Also auto-fill when bulk upload dialog opens
  useEffect(() => {
    if (bulkUploadOpen && userProfile.data?.username && !form.uploaded_by) {
      setForm((prev) => ({ ...prev, uploaded_by: userProfile.data?.username || "" }));
    }
  }, [bulkUploadOpen, userProfile.data?.username]);

  const create = useMutation({
    mutationFn: async () => {
      // Extract number from chapter_number input (which can now contain text/letters)
      const parsedNum =
        parseFloat(form.chapter_number.replace(/[^\d.]/g, "")) || parseFloat(form.chapter_number);
      const chapterNum = isNaN(parsedNum) ? 0 : parsedNum;

      const scanlation_group = getScanlationGroupForUpload();

      const existingChapter = await findExistingChapterByNumberAndGroup(
        chapterNum,
        scanlation_group,
      );
      if (existingChapter) {
        throw new Error(
          `Chapter ${chapterNum} already exists for ${scanlationGroupLabel(scanlation_group)}. Existing chapter was not replaced.`,
        );
      }

      const isNovel = series.data?.type === "novel";

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
          chapter_type: isNovel ? "novel" : "image",
          novel_content: isNovel ? form.novel_content || null : null,
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

      if (!isNovel) {
        const urls = form.image_urls.split("\n").filter((u) => u.trim());
        if (urls.length === 0) throw new Error("At least one image URL is required");

        const pages = urls.map((url, idx) => ({
          chapter_id: chapter.id,
          page_number: idx + 1,
          image_url: url.trim(),
        }));

        const { error: pagesError } = await supabase.from("chapter_pages").insert(pages);
        if (pagesError) throw pagesError;
      }

      await logAdminAction("create", "chapter", chapter.id, {
        series_id: seriesId,
        chapter_number: chapterNum,
        scanlation_group,
        pages: isNovel ? 0 : form.image_urls.split("\n").filter((u) => u.trim()).length,
      });
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
    const isNovel = series.data?.type === "novel";
    let imageUrlsVal = "";

    if (!isNovel) {
      const { data, error } = await supabase
        .from("chapter_pages")
        .select("image_url")
        .eq("chapter_id", chapter.id)
        .order("page_number");
      if (error) {
        toast.error(error.message);
        return;
      }
      imageUrlsVal = (data ?? []).map((p) => p.image_url).join("\n");
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
      image_urls: imageUrlsVal,
      chapter_url: "",
      status: chapter.status ?? "published",
      scheduled_at: chapter.scheduled_at
        ? new Date(chapter.scheduled_at).toISOString().slice(0, 16)
        : "",
      uploaded_by: chapter.uploaded_by ?? "",
      scanlation_group: chapter.scanlation_group ?? "",
      novel_content: chapter.novel_content ?? "",
    });
  };

  const extractFromUrl = async () => {
    if (!form.chapter_url.trim()) {
      toast.error("Please enter a chapter URL");
      return;
    }

    try {
      setExtracting(true);
      const result = await $extractImagesFromUrl({
        data: {
          url: form.chapter_url,
          imageUrlExample: imageUrlTypeExample.trim(),
          accessToken: await requireAccessToken(),
        },
      });

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
      const result = await $extractChaptersFromUrl({
        data: { url: seriesUrl, accessToken: await requireAccessToken() },
      });

      if (result.success && result.chapters) {
        setDiscoveredChapters(result.chapters);
        // Auto-select all chapters
        setSelectedChapters(new Set(result.chapters.map((_: any, i: number) => i)));
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

  const getImageUrlOrigin = (exampleUrl: string): string | null => {
    try {
      return new URL(exampleUrl.trim()).origin;
    } catch {
      return null;
    }
  };

  const isNumberedImageUrl = (url: string) => {
    try {
      const filename = new URL(url).pathname.split("/").pop() ?? "";
      return /^(?:page[_-]?)?\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
    } catch {
      return false;
    }
  };

  const isQimanhwaUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("qimanhwa.com") || hostname.includes("qiscans.org");
    } catch {
      return url.toLowerCase().includes("qimanhwa.com") || url.toLowerCase().includes("qiscans");
    }
  };

  const isAsuraUrl = (url: string) => {
    try {
      return new URL(url).hostname.toLowerCase().includes("asurascans.com");
    } catch {
      return url.toLowerCase().includes("asurascans.com");
    }
  };

  const filterImagesByExampleUrl = (
    images: string[],
    exampleUrl: string,
    imageUrlPrefix: string | null,
  ) => {
    if (!exampleUrl || !imageUrlPrefix) return images;

    if (isQimanhwaUrl(exampleUrl)) {
      const numberedImages = images.filter((url) => isQimanhwaUrl(url) && isNumberedImageUrl(url));
      if (numberedImages.length > 0) return numberedImages;
    }

    const prefixMatches = images.filter((url) => url.startsWith(imageUrlPrefix));
    if (prefixMatches.length > 0) return prefixMatches;

    const exampleOrigin = getImageUrlOrigin(exampleUrl);
    if (exampleOrigin) {
      const originMatches = images.filter((url) => {
        try {
          return new URL(url).origin === exampleOrigin;
        } catch {
          return url.startsWith(exampleOrigin);
        }
      });

      if (originMatches.length > 0) return originMatches;
    }

    console.info(
      "Image URL example did not match extracted image paths; using all extracted images for this chapter.",
    );
    return images;
  };

  const chapterNumberMap = useMemo(
    () => new Map((chapters.data ?? []).map((ch) => [ch.id, ch.chapter_number])),
    [chapters.data],
  );

  const reindexChapterPages = async (chapterId: string) => {
    const { data: remainingPages, error: fetchPagesError } = await supabase
      .from("chapter_pages")
      .select("id, page_number")
      .eq("chapter_id", chapterId)
      .order("page_number", { ascending: true });

    if (fetchPagesError || !remainingPages) return;

    for (let idx = 0; idx < remainingPages.length; idx += 1) {
      const page = remainingPages[idx];
      const correctPageNum = idx + 1;
      if (page.page_number !== correctPageNum) {
        await supabase
          .from("chapter_pages")
          .update({ page_number: correctPageNum })
          .eq("id", page.id);
      }
    }
  };

  type UrlMatcher = { value: string; mode: "exact" | "prefix" };

  const parseUrlMatchers = (value: string): UrlMatcher[] =>
    Array.from(
      new Set(
        value
          .split(/\r?\n/)
          .map((url) => url.trim())
          .filter(Boolean),
      ),
    )
      .map((url): UrlMatcher => {
        if (url.endsWith("*")) {
          return { value: url.slice(0, -1).trim(), mode: "prefix" };
        }

        if (url.endsWith("...")) {
          return { value: url.slice(0, -3).trim(), mode: "prefix" };
        }

        return { value: url, mode: "exact" };
      })
      .filter((matcher) => matcher.value.length > 0);

  const matchesUrlRule = (imageUrl: string, matcher: UrlMatcher) =>
    matcher.mode === "prefix" ? imageUrl.startsWith(matcher.value) : imageUrl === matcher.value;

  const matchesAnyUrlRule = (imageUrl: string, matchers: UrlMatcher[]) =>
    matchers.some((matcher) => matchesUrlRule(imageUrl, matcher));

  const findAndDeleteUrl = async () => {
    const positiveMatchers = parseUrlMatchers(deleteUrl);
    const negativeMatchers = parseUrlMatchers(deleteNegativeUrl);

    if (positiveMatchers.length === 0) {
      toast.error("Please enter at least one positive URL or prefix to delete.");
      return;
    }

    if (!chapters.data || chapters.data.length === 0) {
      toast.error("No chapters available to search.");
      return;
    }

    setDeleteUrlLoading(true);
    setDeleteUrlResults([]);
    setDeleteUrlStatus("");

    const chapterIds = chapters.data.map((ch) => ch.id);
    const { data, error } = await supabase
      .from("chapter_pages")
      .select("id, chapter_id, page_number, image_url")
      .in("chapter_id", chapterIds);

    if (error) {
      toast.error(error.message);
      setDeleteUrlLoading(false);
      return;
    }

    const matchedPages = (data ?? []).filter(
      (page) =>
        matchesAnyUrlRule(page.image_url, positiveMatchers) &&
        !matchesAnyUrlRule(page.image_url, negativeMatchers),
    );

    if (matchedPages.length === 0) {
      setDeleteUrlStatus("No deletable matches found for the provided positive/negative rules.");
      toast.success("No page entries matched those delete rules.");
      setDeleteUrlLoading(false);
      return;
    }

    setDeleteUrlResults(matchedPages);
    setDeleteUrlStatus(
      `Found ${matchedPages.length} deletable page(s) from ${positiveMatchers.length} positive rule(s)${negativeMatchers.length > 0 ? `, excluding ${negativeMatchers.length} negative rule(s)` : ""}. Deleting...`,
    );

    const { error: deleteError } = await supabase
      .from("chapter_pages")
      .delete()
      .in(
        "id",
        matchedPages.map((page) => page.id),
      );

    if (deleteError) {
      toast.error(deleteError.message);
      setDeleteUrlLoading(false);
      return;
    }

    const affectedChapterIds = Array.from(new Set(matchedPages.map((page) => page.chapter_id)));
    for (const chapterId of affectedChapterIds) {
      await reindexChapterPages(chapterId);
    }

    setDeleteUrlStatus(
      `Deleted ${matchedPages.length} page entries from ${affectedChapterIds.length} chapter(s).`,
    );
    toast.success(`Deleted ${matchedPages.length} matching page entries.`);
    setDeleteUrlLoading(false);
    qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
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
      await logAdminAction("bulk_delete", "chapter", undefined, {
        series_id: seriesId,
        count: chapterIds.length,
      });
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
      const uploadableList: ChapterInfo[] = [];
      let skippedExistingCount = 0;

      for (const chapter of selectedList) {
        const num = Number(chapter.chapterNumber);
        const existingInLocal = (chapters.data ?? []).some(
          (c) => Number(c.chapter_number) === num,
        );
        const existingChapter =
          existingInLocal ||
          (await findExistingChapterByNumberAndGroup(
            chapter.chapterNumber,
            scanlation_group,
          ));

        if (existingChapter) {
          skippedExistingCount++;
          console.info(
            `Skipped Chapter ${chapter.chapterNumber}: already exists in series.`,
          );
        } else {
          uploadableList.push(chapter);
        }
      }

      if (skippedExistingCount > 0) {
        toast.info(
          `Skipped ${skippedExistingCount} existing chapter${skippedExistingCount !== 1 ? "s" : ""}.`,
        );
      }

      if (uploadableList.length === 0) {
        toast.success("All selected chapters already exist. Nothing was replaced.");
        return;
      }

      // ── Phase 1: Parallel image extraction (batches of 5) ──────────────
      setBulkProgress({ done: 0, total: uploadableList.length, phase: "Extracting images" });

      const isAsuraBulkImport =
        isAsuraUrl(seriesUrl) || selectedList.some((chapter) => isAsuraUrl(chapter.url));
      const BATCH_SIZE = isAsuraBulkImport ? 2 : 5;
      type ExtractionResult =
        | { chapter: ChapterInfo; images: string[] }
        | { chapter: ChapterInfo; error: string };
      const extractionResults: ExtractionResult[] = [];
      const bulkAccessToken = await requireAccessToken();

      for (let i = 0; i < uploadableList.length; i += BATCH_SIZE) {
        const batch = uploadableList.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (chapter) => {
            const result = await $extractImagesFromUrl({
              data: {
                url: chapter.url,
                imageUrlExample: imageTypeExample,
                accessToken: bulkAccessToken,
              },
            });
            if (!result.success || !result.images?.length) {
              throw new Error(result.error || "No images found");
            }

            const images = filterImagesByExampleUrl(
              result.images,
              imageTypeExample,
              imageUrlPrefix,
            );

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
          const targetSlug = buildChapterSlug(chapter.chapterNumber, {
            title: null,
            scanlationGroup: scanlation_group,
          });

          const existingChapter = await findExistingChapterByNumberAndGroup(
            chapter.chapterNumber,
            scanlation_group,
          );

          if (existingChapter) {
            skippedExistingCount++;
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
        `Bulk upload complete: ${savedCount} saved${skippedExistingCount > 0 ? `, ${skippedExistingCount} existing skipped` : ""}${saveFailCount > 0 ? `, ${saveFailCount} failed` : ""}${failed.length > 0 ? `, ${failed.length} extraction skipped` : ""}`,
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
      const isNovel = series.data?.type === "novel";

      const { error: chapterError } = await supabase
        .from("chapters")
        .update({
          chapter_number: chapterNum,
          title: null, // Hardcoded to null to completely remove the title option feature
          slug: buildChapterSlug(chapterNum, {
            title: null,
            scanlationGroup: scanlation_group,
          }),
          chapter_type: isNovel ? "novel" : "image",
          novel_content: isNovel ? form.novel_content || null : null,
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

      if (!isNovel) {
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
      } else {
        // If it's a novel, make sure we clean up any chapter pages if it was previously an image chapter
        await supabase
          .from("chapter_pages")
          .delete()
          .eq("chapter_id", editingChapter.id);
      }

      await logAdminAction("update", "chapter", editingChapter.id, {
        series_id: seriesId,
        chapter_number: chapterNum,
      });
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
      await logAdminAction("delete", "chapter", chapterId, { series_id: seriesId });
    },
    onSuccess: () => {
      toast.success("Chapter deleted");
      qc.invalidateQueries({ queryKey: ["admin", "chapters", seriesId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Handle loading and error states
  if (series.isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading series...</p>
      </div>
    );
  }

  if (series.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error loading series: {series.error instanceof Error ? series.error.message : "Unknown error"}</p>
        <Button onClick={onBack}>Go back</Button>
      </div>
    );
  }

  if (!series.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Series not found</p>
        <Button onClick={onBack}>Go back</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{series.data.title}</h1>
          <p className="text-sm text-muted-foreground">Manage chapters</p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-border/50 bg-card p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <RefreshCw className="h-4 w-4 text-violet-600" />
              Auto Import Source
            </h2>
            <p className="text-sm text-muted-foreground">
              Save origin URLs once, then check for new chapters without replacing existing group
              uploads.
            </p>
          </div>
          <Badge variant="outline">
            {importSources.data?.length ?? 0} source{(importSources.data?.length ?? 0) !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_auto]">
          <div>
            <Label>Origin Series URL</Label>
            <Input
              placeholder="https://qimanhwa.com/series/high-martial-world..."
              value={autoSourceUrl}
              onChange={(e) => handleAutoSourceUrlChange(e.target.value)}
            />
          </div>
          <div>
            <Label>Detected Site</Label>
            <Input
              placeholder="Qi Scans, Asura Scans..."
              value={autoSourceSite}
              onChange={(e) => setAutoSourceSite(e.target.value)}
            />
          </div>
          <div>
            <Label>Group / Scans</Label>
            <Input
              placeholder="Auto detected"
              value={autoSourceGroup}
              onChange={(e) => setAutoSourceGroup(e.target.value)}
            />
          </div>
          <div>
            <Label>Every</Label>
            <Select value={autoSourceInterval} onValueChange={setAutoSourceInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="360">6 hours</SelectItem>
                <SelectItem value="1440">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => saveImportSourceMutation.mutate()}
              disabled={saveImportSourceMutation.isPending || !autoSourceUrl.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {saveImportSourceMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div>
            <Label>Image URL Example</Label>
            <Input
              placeholder="Optional; auto-filled for known sources"
              value={autoSourceImageExample}
              onChange={(e) => setAutoSourceImageExample(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <Checkbox
              checked={autoSourcePublish}
              onCheckedChange={(checked) => setAutoSourcePublish(checked === true)}
            />
            Auto publish
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <Checkbox
              checked={autoSourceEnabled}
              onCheckedChange={(checked) => setAutoSourceEnabled(checked === true)}
            />
            Enabled
          </label>
        </div>

        {importSources.data && importSources.data.length > 0 && (
          <div className="mt-4 space-y-3">
            {importSources.data.map((source) => {
              const lastLog = importLogs.data?.find((log) => log.source_id === source.id);
              return (
                <div
                  key={source.id}
                  className="rounded-lg border border-border/40 bg-background p-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={source.enabled ? "bg-green-600" : "bg-zinc-600"}>
                          {source.enabled ? "Enabled" : "Paused"}
                        </Badge>
                        <span className="font-semibold">
                          {source.source_site || detectImportSource(source.source_url).sourceSite}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {scanlationGroupLabel(source.scanlation_group)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {source.source_url}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Last checked:{" "}
                        {source.last_checked_at
                          ? new Date(source.last_checked_at).toLocaleString()
                          : "Never"}
                        {source.last_error ? (
                          <span className="ml-2 text-red-500">{source.last_error}</span>
                        ) : null}
                      </div>
                      {source.estimated_next_release_at && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                          <span>⏱️ Estimated next drop:</span>
                          <span>{new Date(source.estimated_next_release_at).toLocaleString()}</span>
                          {source.release_cadence && (
                            <span className="text-muted-foreground">({source.release_cadence})</span>
                          )}
                        </div>
                      )}
                      {lastLog && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last run: {lastLog.message} Found {lastLog.chapters_found}, imported{" "}
                          {lastLog.chapters_imported}, failed {lastLog.chapters_failed}.
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateImportSourceMutation.mutate({
                            id: source.id,
                            patch: { enabled: !source.enabled } as Partial<ImportSourceRow>,
                          })
                        }
                        disabled={updateImportSourceMutation.isPending}
                      >
                        <Power className="mr-1 h-3.5 w-3.5" />
                        {source.enabled ? "Pause" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => checkImportSourceNow(source.id)}
                        disabled={syncingSourceId === source.id}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <RefreshCw
                          className={`mr-1 h-3.5 w-3.5 ${syncingSourceId === source.id ? "animate-spin" : ""}`}
                        />
                        {syncingSourceId === source.id ? "Checking..." : "Check Now"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteImportSourceMutation.mutate(source.id)}
                        disabled={deleteImportSourceMutation.isPending}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                <div className="grid gap-3 sm:grid-cols-2">
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
                      Optional: enter one sample image URL from the source you prefer. If no
                      extracted images match that pattern, bulk upload will use all extracted
                      images for that chapter.
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
          <Dialog open={deleteUrlOpen} onOpenChange={setDeleteUrlOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
              >
                <Search className="mr-1 h-4 w-4" />
                Delete by URL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Delete Chapter Pages by URL Rules</DialogTitle>
                <DialogDescription>
                  Positive URLs are deleted. Negative URLs are protected and excluded from the
                  delete result.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Positive URLs to delete</Label>
                  <Textarea
                    placeholder={
                      "https://cdn.example.com/path/to/image-001.jpg\nhttps://cdn.example.com/path/to/chapter-10/*"
                    }
                    value={deleteUrl}
                    onChange={(e) => setDeleteUrl(e.target.value)}
                    className="min-h-32"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    One exact URL per line. End a line with * or ... to delete every URL with that
                    prefix.
                  </p>
                </div>
                <div>
                  <Label>Negative URLs to keep</Label>
                  <Textarea
                    placeholder={
                      "https://cdn.example.com/path/to/image-003.jpg\nhttps://cdn.example.com/path/to/keep-folder/*"
                    }
                    value={deleteNegativeUrl}
                    onChange={(e) => setDeleteNegativeUrl(e.target.value)}
                    className="min-h-24"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional. Matching URLs are protected even if they match a positive rule.
                  </p>
                </div>
                {deleteUrlStatus && (
                  <div className="rounded-lg border border-border/50 bg-muted p-3 text-sm text-muted-foreground">
                    {deleteUrlStatus}
                  </div>
                )}
                {deleteUrlResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Matched Pages</Label>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background p-3">
                      {deleteUrlResults.map((result) => (
                        <div
                          key={result.id}
                          className="rounded-md border border-border/30 p-2 mb-2 last:mb-0"
                        >
                          <div className="text-sm font-medium">
                            Chapter {chapterNumberMap.get(result.chapter_id) ?? "?"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Page {result.page_number}
                          </div>
                          <div className="text-xs truncate text-foreground/80">
                            {result.image_url}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={findAndDeleteUrl}
                  disabled={deleteUrlLoading || !deleteUrl.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {deleteUrlLoading ? "Searching and deleting..." : "Search and Delete"}
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
                <div className="grid gap-3 sm:grid-cols-3">
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
                <div className="grid gap-3 sm:grid-cols-2">
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

                {series.data?.type === "novel" ? (
                  <div>
                    <Label>Novel Content (HTML supported) *</Label>
                    <Textarea
                      rows={15}
                      placeholder="<p>Write or paste your novel chapter here...</p>"
                      value={form.novel_content}
                      onChange={(e) => setForm({ ...form, novel_content: e.target.value })}
                      className="font-mono text-sm mt-1.5"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Write or paste your novel chapter text here. HTML tags like &lt;p&gt; and &lt;strong&gt; are supported.
                    </p>
                  </div>
                ) : (
                  <>
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
                      <div>
                        <Label>Image URL Example (optional)</Label>
                        <Input
                          placeholder="https://storage.vortexscans.org/upload/series/..."
                          value={imageUrlTypeExample}
                          onChange={(e) => setImageUrlTypeExample(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional: enter one sample image URL from the source you prefer.
                        </p>
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
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    !form.chapter_number ||
                    (series.data?.type === "novel" ? !form.novel_content.trim() : !form.image_urls.trim()) ||
                    create.isPending
                  }
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
                <Badge variant="outline" className="text-[10px] gap-1 text-pink-400 border-pink-500/30 bg-pink-500/10 font-bold px-1.5 py-0">
                  <Heart className="h-2.5 w-2.5 fill-pink-500 text-pink-500" />
                  {chapterLikeCounts.data?.get(ch.id) || 0}
                </Badge>
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
            <div className="grid gap-3 sm:grid-cols-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            {series.data?.type === "novel" ? (
              <div>
                <Label>Novel Content (HTML supported) *</Label>
                <Textarea
                  rows={15}
                  value={form.novel_content}
                  onChange={(e) => setForm({ ...form, novel_content: e.target.value })}
                  className="font-mono text-sm mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Edit your novel chapter text. HTML tags like &lt;p&gt; and &lt;strong&gt; are supported.
                </p>
              </div>
            ) : (
              <div>
                <Label>Image URLs (one per line) *</Label>
                <Textarea
                  rows={12}
                  value={form.image_urls}
                  onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => updateChapter.mutate()}
              disabled={
                !form.chapter_number ||
                (series.data?.type === "novel" ? !form.novel_content.trim() : !form.image_urls.trim()) ||
                updateChapter.isPending
              }
            >
              {updateChapter.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
