"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, LayoutGrid, List, Star, X, BookOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { buildSeriesSearchOrFilter, prepareSearchInput, rankSeriesResults } from "@/lib/search-utils";
import { AddNewSeriesDialog } from "@/components/admin/AddNewSeriesDialog";

export type BrowseGenre = { id: string; name: string; slug: string };
export type BrowseTag = { id: string; name: string; slug: string; color: string | null; icon: string | null };
export type BrowseInitialData = {
  genres?: BrowseGenre[];
  tags?: BrowseTag[];
  defaultManhwa?: any[];
};

function BrowsePageContent({ initialData }: { initialData?: BrowseInitialData }) {
  const { settings } = useReaderSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlSearch = searchParams.get("search") || "";
  const urlGroup = searchParams.get("group") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlTag = searchParams.get("tag") || "";
  const urlType = searchParams.get("type") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [groupFilter, setGroupFilter] = useState(urlGroup);

  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setGroupFilter(urlGroup);
  }, [urlGroup]);

  const [typeFilters, setTypeFilters] = useState<string[]>(urlType ? [urlType] : []);
  const [statusFilter, setStatusFilter] = useState("all");
  const [contentRating, setContentRating] = useState("all");
  const [genreFilters, setGenreFilters] = useState<string[]>(urlGenre ? [urlGenre] : []);
  const [tagFilters, setTagFilters] = useState<string[]>(urlTag ? [urlTag] : []);
  const [sortBy, setSortBy] = useState("latest");
  const [duration, setDuration] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (urlType) {
      setTypeFilters((prev) => (prev.includes(urlType) ? prev : [...prev, urlType]));
    }
  }, [urlType]);

  useEffect(() => {
    if (urlGenre) {
      setGenreFilters((prev) => (prev.includes(urlGenre) ? prev : [...prev, urlGenre]));
    }
  }, [urlGenre]);

  useEffect(() => {
    if (urlTag) {
      setTagFilters((prev) => (prev.includes(urlTag) ? prev : [...prev, urlTag]));
    }
  }, [urlTag]);

  // Fetch genres (only those that actually exist on series)
  const genres = useQuery({
    queryKey: ["genres", "active-series"],
    initialData: initialData?.genres,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("id,name,slug,series_genres!inner(series_id)")
        .order("name");

      if (error) {
        const { data: fallback, error: fbError } = await supabase
          .from("genres")
          .select("id,name,slug")
          .order("name");
        if (fbError) throw fbError;
        return fallback ?? [];
      }

      const unique = new Map<string, { id: string; name: string; slug: string }>();
      (data ?? []).forEach((g: any) => {
        if (!unique.has(g.id)) {
          unique.set(g.id, { id: g.id, name: g.name, slug: g.slug });
        }
      });
      return Array.from(unique.values());
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Fetch tags (only those that actually exist on series)
  const tags = useQuery({
    queryKey: ["tags", "active-series"],
    initialData: initialData?.tags,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id,name,slug,color,icon,series_tags!inner(series_id)")
        .order("name");

      if (error) {
        const { data: fallback, error: fbError } = await supabase
          .from("tags")
          .select("id,name,slug,color,icon")
          .order("name");
        if (fbError) throw fbError;
        return (fallback ?? []) as any[];
      }

      const unique = new Map<string, any>();
      (data ?? []).forEach((t: any) => {
        if (!unique.has(t.id)) {
          unique.set(t.id, { id: t.id, name: t.name, slug: t.slug, color: t.color, icon: t.icon });
        }
      });
      return Array.from(unique.values());
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  // Toggle type filter
  const toggleType = (type: string) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle genre filter
  const toggleGenre = (slug: string) => {
    setGenreFilters(prev => 
      prev.includes(slug) 
        ? prev.filter(g => g !== slug)
        : [...prev, slug]
    );
  };

  // Toggle tag filter
  const toggleTag = (slug: string) => {
    setTagFilters(prev => 
      prev.includes(slug) 
        ? prev.filter(t => t !== slug)
        : [...prev, slug]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setTypeFilters([]);
    setGenreFilters([]);
    setTagFilters([]);
    setStatusFilter("all");
    setContentRating("all");
    setDuration("all");
    setGroupFilter("");
    
    // Clear URL parameters
    const params = new URLSearchParams(searchParams.toString());
    params.delete("group");
    params.delete("genre");
    params.delete("tag");
    params.delete("type");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = typeFilters.length > 0 || genreFilters.length > 0 || tagFilters.length > 0 || 
    statusFilter !== "all" || contentRating !== "all" || duration !== "all" || !!groupFilter;

  // Type options
  const typeOptions = [
    { value: "manga", label: "MANGA" },
    { value: "manhwa", label: "MANHWA" },
    { value: "manhua", label: "MANHUA" },
    { value: "novel", label: "NOVEL" },
  ];

  // Calculate date filter for duration
  const getDateFilter = () => {
    if (duration === "all") return null;
    const now = new Date();
    switch (duration) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return null;
    }
  };

  // Use server-prefetched data only when the user hasn't changed any filter yet
  // (i.e. landed on /browse with no query string and no toggled filters).
  const isDefaultBrowseState =
    typeFilters.length === 0 &&
    statusFilter === "all" &&
    contentRating === "all" &&
    genreFilters.length === 0 &&
    tagFilters.length === 0 &&
    sortBy === "latest" &&
    duration === "all" &&
    !searchQuery &&
    !groupFilter;

  // All manhwa
  const allManhwa = useQuery({
    queryKey: ["browse-manhwa", typeFilters, statusFilter, contentRating, genreFilters, tagFilters, sortBy, duration, searchQuery, groupFilter],
    initialData: isDefaultBrowseState ? initialData?.defaultManhwa : undefined,
    queryFn: async () => {
      let query = supabase
        .from("series")
        .select("id,slug,title,alternative_titles,description,cover_url,type,rating_average,status,author,artist,release_year,created_at,updated_at,view_count,content_rating,chapter_count,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug))")
        .eq("is_hidden", false);

      // Apply scanlation group filter
      if (groupFilter) {
        const { data: chaptersWithGroup } = await supabase
          .from("chapters")
          .select("series_id")
          .ilike("scanlation_group", groupFilter);
        
        const seriesIds = Array.from(new Set((chaptersWithGroup || []).map((c: any) => c.series_id).filter(Boolean)));
        if (seriesIds.length > 0) {
          query = query.in("id", seriesIds);
        } else {
          // If no chapters found for group, force empty result by filtering on dummy id
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      // Apply type filters (multiple selection)
      if (typeFilters.length > 0) {
        query = query.in("type", typeFilters as any);
      }
      
      // Apply other filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      if (contentRating !== "all") {
        query = query.eq("content_rating", contentRating as any);
      }
      const preparedSearch = prepareSearchInput(searchQuery);
      if (preparedSearch.primaryTerm) {
        const searchFilter = buildSeriesSearchOrFilter(preparedSearch.terms);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }

      // Duration filter (popular in timeframe)
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte("updated_at", dateFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case "latest":
          query = query.order("updated_at", { ascending: false });
          break;
        case "popular":
          query = query.order("view_count", { ascending: false });
          break;
        case "rating":
          query = query.order("rating_average", { ascending: false });
          break;
        case "title":
          query = query.order("title", { ascending: true });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        default:
          query = query.order("updated_at", { ascending: false });
      }

      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      
      const fetchedSeries = data ?? [];
      const chapterCountBySeries = new Map<string, number>();
      
      if (fetchedSeries.length > 0) {
        const { data: chapters } = await supabase
          .from("chapters")
          .select("series_id,chapter_number")
          .in("series_id", fetchedSeries.map((s: any) => s.id))
          .eq("status", "published");

        const uniqueChaptersBySeries = new Map<string, Set<number>>();
        (chapters ?? []).forEach((chapter: any) => {
          const existing = uniqueChaptersBySeries.get(chapter.series_id) ?? new Set<number>();
          existing.add(Math.floor(chapter.chapter_number));
          uniqueChaptersBySeries.set(chapter.series_id, existing);
        });

        uniqueChaptersBySeries.forEach((chaptersSet, seriesId) => {
          chapterCountBySeries.set(seriesId, chaptersSet.size);
        });
      }

      const seriesWithChapters = fetchedSeries.map((s: any) => {
        const actualCount = chapterCountBySeries.get(s.id) ?? 0;
        return {
          ...s,
          chapter_count: actualCount > 0 ? actualCount : (s.chapter_count ?? 0),
        };
      });
      
      // Filter by genres if selected - series must have ALL selected genres
      let filtered = seriesWithChapters;
      if (genreFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series: any) => {
          const seriesGenres = series.series_genres?.map((sg: any) => sg.genre?.slug).filter(Boolean) || [];
          // Check if series has ALL selected genres
          return genreFilters.every(selectedGenre => seriesGenres.includes(selectedGenre));
        });
      }

      // Filter by tags if selected - series must have ALL selected tags
      if (tagFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series: any) => {
          const seriesTags = series.series_tags?.map((st: any) => st.tag?.slug).filter(Boolean) || [];
          // Check if series has ALL selected tags
          return tagFilters.every(selectedTag => seriesTags.includes(selectedTag));
        });
      }
      
      return searchQuery ? rankSeriesResults(filtered, preparedSearch) : filtered;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.04em] text-white">Browse Catalog</h1>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground font-light">Explore indexed series by genre, tags, status, and community ratings</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 stroke-[1.8]" />
            <Input
              type="text"
              placeholder="Search manga by title, author or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-4 rounded-[4px] bg-surface-1/90 border border-hairline focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white placeholder:text-neutral-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* All Filters in One Row */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          {/* Type Multi-Select Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-start sm:min-w-[140px] sm:w-auto">
                {typeFilters.length > 0 ? (
                  <span className="truncate">
                    Type ({typeFilters.length})
                  </span>
                ) : (
                  "Type"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(200px,calc(100vw-1rem))] p-0" align="start">
              <Command>
                <CommandGroup>
                  {typeOptions.map((type) => (
                    <CommandItem
                      key={type.value}
                      onSelect={() => toggleType(type.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                          typeFilters.includes(type.value) 
                            ? "border-violet-600 bg-violet-600" 
                            : "border-input"
                        }`}>
                          {typeFilters.includes(type.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span>{type.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Genre Multi-Select Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-start sm:min-w-[140px] sm:w-auto">
                {genreFilters.length > 0 ? (
                  <span className="truncate">
                    Genre ({genreFilters.length})
                  </span>
                ) : (
                  "Genre"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-1rem)] p-3 sm:w-[min(700px,calc(100vw-2rem))]" align="start">
              <div className="mb-2 text-sm font-medium">Select Genres</div>
              {genres.isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid max-h-[55vh] grid-cols-1 gap-1 overflow-y-auto min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                  {genres.data?.map((genre) => (
                    <div
                      key={genre.id}
                      onClick={() => toggleGenre(genre.slug)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div 
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          genreFilters.includes(genre.slug)
                            ? "border-violet-600 bg-violet-600"
                            : "border-input"
                        }`}
                      >
                        {genreFilters.includes(genre.slug) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-xs truncate">{genre.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Tag Multi-Select Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-start sm:min-w-[140px] sm:w-auto">
                {tagFilters.length > 0 ? (
                  <span className="truncate">
                    Tag ({tagFilters.length})
                  </span>
                ) : (
                  "Tag"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-1rem)] p-3 sm:w-[min(700px,calc(100vw-2rem))]" align="start">
              <div className="mb-2 text-sm font-medium">Select Tags</div>
              {tags.isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid max-h-[55vh] grid-cols-1 gap-1 overflow-y-auto min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                  {tags.data?.map((tag) => (
                    <div
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div 
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border`}
                        style={{
                          borderColor: tagFilters.includes(tag.slug) ? (tag.color || "#8b5cf6") : undefined,
                          backgroundColor: tagFilters.includes(tag.slug) ? (tag.color || "#8b5cf6") : undefined,
                        }}
                      >
                        {tagFilters.includes(tag.slug) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      {tag.icon && <span className="text-sm">{tag.icon}</span>}
                      <span className="text-xs truncate">{tag.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
            </SelectContent>
          </Select>

          {/* Content Rating Filter */}
          <Select value={contentRating} onValueChange={setContentRating}>
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="suggestive">Suggestive</SelectItem>
              <SelectItem value="nsfw">NSFW</SelectItem>
              <SelectItem value="pornographic">Pornographic</SelectItem>
            </SelectContent>
          </Select>

          {/* Duration Filter */}
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>

          {groupFilter && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 bg-violet-500/10 text-primary border border-violet-500/20 text-xs font-semibold h-9 rounded-lg">
              Group: {groupFilter}
              <X 
                className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" 
                onClick={() => {
                  setGroupFilter("");
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("group");
                  router.replace(`${pathname}?${params.toString()}`);
                }}
              />
            </Badge>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {allManhwa.data?.length || 0} manga found
            </p>
            {(typeFilters.length > 0 || genreFilters.length > 0 || tagFilters.length > 0) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {typeFilters.length > 0 && `${typeFilters.length} type${typeFilters.length > 1 ? 's' : ''}`}
                {typeFilters.length > 0 && (genreFilters.length > 0 || tagFilters.length > 0) && ' • '}
                {genreFilters.length > 0 && `${genreFilters.length} genre${genreFilters.length > 1 ? 's' : ''}`}
                {genreFilters.length > 0 && tagFilters.length > 0 && ' • '}
                {tagFilters.length > 0 && `${tagFilters.length} tag${tagFilters.length > 1 ? 's' : ''}`} selected
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Manhwa Grid/List */}
        {viewMode === "grid" ? (
          <SeriesGrid 
            items={allManhwa.data} 
            loading={allManhwa.isLoading} 
            emptyMessage="No manga found. Try adjusting your filters or search query."
            showRank={sortBy === "popular" || sortBy === "rating"}
          />
        ) : (
          <SeriesList 
            items={allManhwa.data} 
            loading={allManhwa.isLoading} 
          />
        )}
      </div>
    </div>
  );
}

// List View Component
function SeriesList({ items, loading }: { items?: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-[4px] shimmer-dark" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="glass-panel rounded-[4px] p-12 text-center">
        <p className="text-sm text-muted-foreground font-light">No manga found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((s, index) => (
        <Link
          key={s.id}
          href={`/title/${s.slug}`}
          className="glass-card group flex gap-4 rounded-[4px] p-3.5 hover-lift transition-all"
        >
          {/* Ranking Number */}
          <div className="flex shrink-0 items-start">
            <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-purple-950/40 border border-purple-500/30 text-sm font-mono font-bold text-purple-300 shadow-sm">
              #{index + 1}
            </div>
          </div>

          {/* Cover Image */}
          <div className="w-28 shrink-0 overflow-hidden rounded-[4px] bg-neutral-950 shadow-md sm:w-36">
            <OptimizedImage src={s.cover_url} alt={s.title} seriesId={s.id} className="h-40 w-full object-cover sm:h-52 transition-transform duration-500 group-hover:scale-105" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2 py-0.5">
            {/* Title and Rating */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-white group-hover:text-purple-400 transition-colors line-clamp-1">{s.title}</h3>
                {s.alternative_titles && (
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{s.alternative_titles}</p>
                )}
              </div>
              {s.rating_average && Number(s.rating_average) > 0 && (
                <div className="flex items-center gap-1 rounded border border-white/10 bg-black/75 px-2 py-0.5 text-xs backdrop-blur-md text-amber-300 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(s.rating_average).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="badge-glass text-xs font-medium uppercase py-0.5 px-2">{s.type}</Badge>
              <Badge variant="outline" className="text-xs capitalize py-0.5 px-2 bg-surface-1 border-border/40 text-neutral-300">{s.status}</Badge>
              {s.content_rating && (
                <Badge 
                  variant="outline"
                  className={`text-xs uppercase py-0.5 px-2 ${
                    s.content_rating === "safe" ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/40" : "bg-neutral-900 text-neutral-400 border-border/30"
                  }`}
                >
                  {s.content_rating}
                </Badge>
              )}
              {s.release_year && (
                <Badge variant="outline" className="text-xs py-0.5 px-2 bg-surface-1 border-border/40 text-neutral-400">{s.release_year}</Badge>
              )}
            </div>

            {/* Metadata with icons */}
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              {s.chapter_count && s.chapter_count > 0 && (
                <span className="flex items-center gap-1 text-neutral-300">
                  <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                  <span>{s.chapter_count} chs</span>
                </span>
              )}
              {s.view_count && s.view_count > 0 && (
                <span>
                  {s.view_count.toLocaleString()} views
                </span>
              )}
            </div>

            {/* Description */}
            {s.description && (
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-light">
                {s.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function BrowsePage({ initialData }: { initialData?: BrowseInitialData }) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading browse page...</div>}>
      <BrowsePageContent initialData={initialData} />
    </Suspense>
  );
}
