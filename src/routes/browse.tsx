import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, LayoutGrid, List, Star, X, BookOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
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

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Manga — 0Verse" },
      { name: "description", content: "Discover your next favorite series" },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [contentRating, setContentRating] = useState("all");
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [duration, setDuration] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch genres from tags table
  const genres = useQuery({
    queryKey: ["tags-as-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id,name,slug,color,icon")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
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

  // Clear all filters
  const clearFilters = () => {
    setTypeFilters([]);
    setGenreFilters([]);
    setStatusFilter("all");
    setContentRating("all");
    setDuration("all");
  };

  const hasActiveFilters = typeFilters.length > 0 || genreFilters.length > 0 || 
    statusFilter !== "all" || contentRating !== "all" || duration !== "all";

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

  // All manhwa
  const allManhwa = useQuery({
    queryKey: ["browse-manhwa", typeFilters, statusFilter, contentRating, genreFilters, sortBy, duration, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("series")
        .select("id,slug,title,alternative_titles,description,cover_url,type,rating_average,status,author,artist,release_year,created_at,updated_at,view_count,content_rating,chapter_count,series_tags(tag:tags(id,name,slug,color,icon))");

      // Apply type filters (multiple selection)
      if (typeFilters.length > 0) {
        query = query.in("type", typeFilters);
      }
      
      // Apply other filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (contentRating !== "all") {
        query = query.eq("content_rating", contentRating);
      }
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
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
      
      // Calculate chapter count for series without manual count
      const seriesWithChapters = await Promise.all(
        (data ?? []).map(async (s: any) => {
          // If chapter_count is manually set and > 0, use it
          if (s.chapter_count && s.chapter_count > 0) {
            return s;
          }
          
          // Otherwise, calculate from actual chapters
          const { data: chapters } = await supabase
            .from("chapters")
            .select("chapter_number")
            .eq("series_id", s.id)
            .eq("status", "published");
          
          // Get unique base chapter numbers
          const uniqueChapters = new Set(
            (chapters ?? []).map((ch) => Math.floor(ch.chapter_number))
          );
          
          return {
            ...s,
            chapter_count: uniqueChapters.size,
          };
        })
      );
      
      // Filter by genres (tags) if selected - series must have ALL selected genres
      let filtered = seriesWithChapters;
      if (genreFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series: any) => {
          const seriesGenres = series.series_tags?.map((st: any) => st.tag?.slug).filter(Boolean) || [];
          // Check if series has ALL selected genres
          return genreFilters.every(selectedGenre => seriesGenres.includes(selectedGenre));
        });
      }
      
      return filtered;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Browse Manga</h1>
          <p className="mt-2 text-muted-foreground">Discover your next favorite series</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search manga by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-4"
            />
          </div>
        </div>

        {/* All Filters in One Row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Type Multi-Select Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 min-w-[140px] justify-start">
                {typeFilters.length > 0 ? (
                  <span className="truncate">
                    Type ({typeFilters.length})
                  </span>
                ) : (
                  "Type"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
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
              <Button variant="outline" className="h-9 min-w-[140px] justify-start">
                {genreFilters.length > 0 ? (
                  <span className="truncate">
                    Genre ({genreFilters.length})
                  </span>
                ) : (
                  "Genre"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[700px] p-3" align="start">
              <div className="mb-2 text-sm font-medium">Select Genres</div>
              {genres.isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-5 gap-1">
                  {genres.data?.map((genre) => (
                    <div
                      key={genre.id}
                      onClick={() => toggleGenre(genre.slug)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div 
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border`}
                        style={{
                          borderColor: genreFilters.includes(genre.slug) ? genre.color : undefined,
                          backgroundColor: genreFilters.includes(genre.slug) ? genre.color : undefined,
                        }}
                      >
                        {genreFilters.includes(genre.slug) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      {genre.icon && <span className="text-sm">{genre.icon}</span>}
                      <span className="text-xs truncate">{genre.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
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
            <SelectTrigger className="h-9 w-[140px]">
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

          {/* Duration Filter */}          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-9 w-[140px]">
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
            <SelectTrigger className="h-9 w-[140px]">
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
            {(typeFilters.length > 0 || genreFilters.length > 0) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {typeFilters.length > 0 && `${typeFilters.length} type${typeFilters.length > 1 ? 's' : ''}`}
                {typeFilters.length > 0 && genreFilters.length > 0 && ' • '}
                {genreFilters.length > 0 && `${genreFilters.length} genre${genreFilters.length > 1 ? 's' : ''}`} selected
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
          <div key={i} className="h-32 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 p-12 text-center">
        <p className="text-muted-foreground">No manga found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((s, index) => (
        <Link
          key={s.id}
          to="/title/$slug"
          params={{ slug: s.slug }}
          className="flex gap-4 rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
        >
          {/* Ranking Number */}
          <div className="flex shrink-0 items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 text-lg font-bold text-violet-600">
              #{index + 1}
            </div>
          </div>

          {/* Cover Image */}
          <div className="w-32 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-md lg:w-40">
            {s.cover_url ? (
              <img src={s.cover_url} alt={s.title} className="h-48 w-full object-cover lg:h-60" />
            ) : (
              <div className="flex h-48 lg:h-60 items-center justify-center text-muted-foreground">
                <BookOpen className="h-10 w-10" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Rating */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg line-clamp-1 hover:text-violet-600 transition-colors">{s.title}</h3>
                {s.alternative_titles && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.alternative_titles}</p>
                )}
              </div>
              {s.rating_average && Number(s.rating_average) > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold">{Number(s.rating_average).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs uppercase font-semibold">{s.type}</Badge>
              <Badge variant="outline" className="text-xs">{s.status}</Badge>
              {s.content_rating && (
                <Badge 
                  variant={s.content_rating === "safe" ? "default" : s.content_rating === "suggestive" ? "secondary" : "destructive"} 
                  className="text-xs uppercase"
                >
                  {s.content_rating}
                </Badge>
              )}
              {s.release_year && (
                <Badge variant="outline" className="text-xs">{s.release_year}</Badge>
              )}
            </div>

            {/* Metadata with icons */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {s.chapter_count && s.chapter_count > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="font-medium">{s.chapter_count}</span>
                  <span>chapters</span>
                </span>
              )}
              {s.view_count && s.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Views:</span> {s.view_count.toLocaleString()}
                </span>
              )}
            </div>

            {/* Author/Artist */}
            {(s.author || s.artist) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {s.author && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Author:</span> {s.author}
                  </span>
                )}
                {s.artist && s.artist !== s.author && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Artist:</span> {s.artist}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {s.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {s.description}
              </p>
            )}

            {/* Genres (Tags) */}
            <div className="flex flex-wrap gap-1">
              {(s.series_tags as any[])?.slice(0, 5).map((st) =>
                st.tag ? (
                  <Badge 
                    key={st.tag.id} 
                    variant="secondary" 
                    className="text-xs hover:bg-violet-600/20"
                    style={{
                      borderColor: st.tag.color,
                      backgroundColor: `${st.tag.color}10`,
                      color: st.tag.color,
                    }}
                  >
                    {st.tag.icon && <span className="mr-1">{st.tag.icon}</span>}
                    {st.tag.name}
                  </Badge>
                ) : null
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
