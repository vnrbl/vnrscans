"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, LayoutGrid, List, Star, X, BookOpen, Check, Layers, Infinity as InfinityIcon, Loader2, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { SectionPagination } from "@/components/SectionPagination";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
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
import { PageKineticLoader } from "@/components/ui/kinetic-text-loader";

export type BrowseGenre = { id: string; name: string; slug: string };
export type BrowseTag = { id: string; name: string; slug: string; color: string | null; icon: string | null };
export type BrowseInitialData = {
  genres?: BrowseGenre[];
  tags?: BrowseTag[];
  defaultManhwa?: any[];
};

const CORE_GENRES_SET = new Set([
  "action", "adventure", "boys love", "comedy", "crime", "cyberpunk", "drama", 
  "ecchi", "erotica", "fantasy", "girls love", "harem", "historical", "horror", 
  "isekai", "josei", "martial arts", "mecha", "medical", "mystery", "psychological", 
  "reincarnation", "romance", "sci-fi", "seinen", "shoujo", "shounen", "slice of life", 
  "sports", "supernatural", "thriller", "wuxia", "xianxia", "xuanhuan", "yaoi", "yuri",
  "monsters", "magic", "cultivation", "webtoon", "manhwa", "manhua", "manga"
]);

const DEFAULT_PAGE_SIZE = 28;

function useGridPageSize() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      // Desktop xl (>= 1280px) has 7 columns in SeriesGrid: 7 cols * 4 rows = 28 cards (completely filled!)
      if (w >= 1280) setPageSize(28);
      // Desktop lg (1024px - 1279px) has 6 columns: 6 cols * 4 rows = 24 cards
      else if (w >= 1024) setPageSize(24);
      // Tablet md (768px - 1023px) has 5 columns: 5 cols * 5 rows = 25 cards
      else if (w >= 768) setPageSize(25);
      // Mobile/tablet sm (640px - 767px) has 4 columns: 4 cols * 6 rows = 24 cards
      else if (w >= 540) setPageSize(24);
      // Mobile has 2 columns: 2 cols * 12 rows = 24 cards
      else setPageSize(24);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return pageSize;
}

function BrowsePageContent({ initialData }: { initialData?: BrowseInitialData }) {
  const qc = useQueryClient();
  const { settings } = useReaderSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Real-time synchronization: automatically update the catalog when any series or chapter is added, updated, or removed in the DB
  useEffect(() => {
    const channel = supabase
      .channel("browse-catalog-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "series" },
        () => {
          qc.invalidateQueries({ queryKey: ["browse-manhwa"] });
          qc.invalidateQueries({ queryKey: ["genres"] });
          qc.invalidateQueries({ queryKey: ["tags"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chapters" },
        () => {
          qc.invalidateQueries({ queryKey: ["browse-manhwa"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const urlSearch = searchParams.get("search") || "";
  const urlGroup = searchParams.get("group") || "";
  const urlGenre = searchParams.get("genre") || "";
  const urlTag = searchParams.get("tag") || "";
  const urlType = searchParams.get("type") || "";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(urlSearch);
  const [groupFilter, setGroupFilter] = useState(urlGroup);

  useEffect(() => {
    setSearchQuery(urlSearch);
    setDebouncedSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Pagination and Infinite Scroll states
  const pageSize = useGridPageSize();
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const pageParam = parseInt(new URLSearchParams(window.location.search).get("page") || "", 10);
      if (!Number.isNaN(pageParam) && pageParam >= 1) return pageParam;
      const savedPage = parseInt(sessionStorage.getItem("vnr_browse_page") || "", 10);
      if (!Number.isNaN(savedPage) && savedPage >= 1) return savedPage;
    }
    return Number.isNaN(urlPage) || urlPage < 1 ? 1 : urlPage;
  });
  const [browseMode, setBrowseMode] = useState<"paged" | "infinite">("paged");
  const [infiniteCount, setInfiniteCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedCount = parseInt(sessionStorage.getItem("vnr_browse_infinite_count") || "", 10);
      if (!Number.isNaN(savedCount) && savedCount > DEFAULT_PAGE_SIZE) return savedCount;
    }
    return DEFAULT_PAGE_SIZE;
  });
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initialize browseMode preference from localStorage on client mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("vnr_browse_mode");
      if (savedMode === "infinite" || savedMode === "paged") {
        setBrowseMode(savedMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const isInitialMountRef = useRef(true);
  useEffect(() => {
    isInitialMountRef.current = false;
  }, []);

  const resetPageToFirst = () => {
    setCurrentPage(1);
    setInfiniteCount(pageSize);
    try {
      sessionStorage.setItem("vnr_browse_page", "1");
      sessionStorage.removeItem("vnr_browse_scroll_pos");
      sessionStorage.removeItem("vnr_browse_infinite_count");
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Sync currentPage from url when user navigates using back/forward or restore saved page
  useEffect(() => {
    const pageParam = parseInt(searchParams.get("page") || "", 10);
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage((prev) => (prev !== pageParam ? pageParam : prev));
      try {
        sessionStorage.setItem("vnr_browse_page", String(pageParam));
      } catch {}
    } else if (currentPage > 1) {
      // If URL does not have page param but currentPage was restored from sessionStorage, sync it to URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(currentPage));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, currentPage, pathname, router]);

  // Track scroll position and active page so returning from a series restores the exact scroll area
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    let scrollTimer: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        try {
          if (window.scrollY > 0) {
            sessionStorage.setItem("vnr_browse_scroll_pos", String(Math.round(window.scrollY)));
            sessionStorage.setItem("vnr_browse_page", String(currentPage));
            if (browseMode === "infinite") {
              sessionStorage.setItem("vnr_browse_infinite_count", String(infiniteCount));
            }
          }
        } catch {}
      }, 80);
    };

    const handleClickLink = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("a");
      const href = target?.getAttribute("href");
      if (target && href && (href.includes("/title/") || href.startsWith("/title"))) {
        try {
          sessionStorage.setItem("vnr_browse_scroll_pos", String(Math.round(window.scrollY)));
          sessionStorage.setItem("vnr_browse_page", String(currentPage));
          if (browseMode === "infinite") {
            sessionStorage.setItem("vnr_browse_infinite_count", String(infiniteCount));
          }
        } catch {}
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClickLink, { capture: true, passive: true });

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClickLink, { capture: true });
    };
  }, [currentPage, browseMode, infiniteCount]);

  useEffect(() => {
    if (urlType) {
      setTypeFilters([urlType]);
    }
  }, [urlType]);

  useEffect(() => {
    if (urlGenre) {
      setGenreFilters([urlGenre]);
      if (!urlTag) {
        setTagFilters([]);
      }
    }
  }, [urlGenre, urlTag]);

  useEffect(() => {
    if (urlTag) {
      setTagFilters([urlTag]);
      if (!urlGenre) {
        setGenreFilters([]);
      }
    }
  }, [urlTag, urlGenre]);

  // Fetch genres (including core manhwa/manga genres from series tags)
  const genres = useQuery({
    queryKey: ["genres", "active-series"],
    initialData: initialData?.genres,
    queryFn: async () => {
      const [genresRes, tagsRes] = await Promise.all([
        supabase
          .from("genres")
          .select("id,name,slug,series_genres!inner(series_id)")
          .order("name"),
        supabase
          .from("tags")
          .select("id,name,slug,series_tags!inner(series_id)")
          .order("name"),
      ]);

      const unique = new Map<string, { id: string; name: string; slug: string }>();

      const genresList = genresRes.data ?? [];
      genresList.forEach((g: any) => {
        if (g?.slug && !unique.has(g.slug.toLowerCase())) {
          unique.set(g.slug.toLowerCase(), { id: g.id, name: g.name, slug: g.slug });
        }
      });

      // Also include active core genres from tags (e.g. cultivation, martial arts, reincarnation)
      const tagsList = tagsRes.data ?? [];
      tagsList.forEach((t: any) => {
        const slug = (t?.slug || "").toLowerCase().trim();
        const name = (t?.name || "").toLowerCase().trim();
        if ((CORE_GENRES_SET.has(slug) || CORE_GENRES_SET.has(name)) && !unique.has(slug)) {
          unique.set(slug, { id: t.id, name: t.name, slug: t.slug });
        }
      });

      return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    resetPageToFirst();
  };

  // Toggle genre filter
  const toggleGenre = (slug: string) => {
    setGenreFilters(prev => {
      const exists = prev.includes(slug);
      const next = exists ? prev.filter(g => g !== slug) : [...prev, slug];
      if (exists && urlGenre === slug) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("genre");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
      return next;
    });
    resetPageToFirst();
  };

  // Toggle tag filter
  const toggleTag = (slug: string) => {
    setTagFilters(prev => {
      const exists = prev.includes(slug);
      const next = exists ? prev.filter(t => t !== slug) : [...prev, slug];
      if (exists && urlTag === slug) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("tag");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
      return next;
    });
    resetPageToFirst();
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
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    resetPageToFirst();
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    resetPageToFirst();
  };

  const handleRatingChange = (val: string) => {
    setContentRating(val);
    resetPageToFirst();
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    resetPageToFirst();
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    resetPageToFirst();
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
    !debouncedSearchQuery &&
    !groupFilter;

  // All manhwa
  const allManhwa = useQuery({
    queryKey: ["browse-manhwa", typeFilters, statusFilter, contentRating, genreFilters, tagFilters, sortBy, duration, debouncedSearchQuery, groupFilter],
    initialData: isDefaultBrowseState ? initialData?.defaultManhwa : undefined,
    initialDataUpdatedAt: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      const preparedSearch = prepareSearchInput(debouncedSearchQuery);
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

      // Fetch all series from DB without artificial small limits
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
      
      // Helper to collect all taxonomy slugs and normalized names for a series
      const getSeriesTaxonomy = (s: any) => {
        const identifiers = new Set<string>();

        (s.series_genres || []).forEach((sg: any) => {
          if (sg?.genre?.slug) {
            identifiers.add(String(sg.genre.slug).toLowerCase().trim());
          }
          if (sg?.genre?.name) {
            identifiers.add(String(sg.genre.name).toLowerCase().trim());
          }
        });

        (s.series_tags || []).forEach((st: any) => {
          if (st?.tag?.slug) {
            identifiers.add(String(st.tag.slug).toLowerCase().trim());
          }
          if (st?.tag?.name) {
            identifiers.add(String(st.tag.name).toLowerCase().trim());
          }
        });

        return identifiers;
      };

      // Filter by genres if selected - series must have ALL selected genres
      let filtered = seriesWithChapters;
      if (genreFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series: any) => {
          const identifiers = getSeriesTaxonomy(series);
          return genreFilters.every((selectedGenre) =>
            identifiers.has(selectedGenre.toLowerCase().trim())
          );
        });
      }

      // Filter by tags if selected - series must have ALL selected tags
      if (tagFilters.length > 0 && filtered.length > 0) {
        filtered = filtered.filter((series: any) => {
          const identifiers = getSeriesTaxonomy(series);
          return tagFilters.every((selectedTag) =>
            identifiers.has(selectedTag.toLowerCase().trim())
          );
        });
      }
      
      return debouncedSearchQuery ? rankSeriesResults(filtered, preparedSearch) : filtered;
    },
    staleTime: 1000 * 5, // 5s stale time for snappy browsing always in sync with DB
    gcTime: 1000 * 60 * 20,
  });

  const totalItems = allManhwa.data?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = totalItems > 0 ? Math.min(Math.max(1, currentPage), totalPages) : currentPage;

  // Paginated or infinite slice
  const paginatedItems = useMemo(() => {
    if (!allManhwa.data) return [];
    if (browseMode === "infinite") {
      return allManhwa.data.slice(0, infiniteCount);
    }
    const start = (activePage - 1) * pageSize;
    return allManhwa.data.slice(start, start + pageSize);
  }, [allManhwa.data, browseMode, activePage, infiniteCount, pageSize]);

  const rankOffset = browseMode === "paged" ? (activePage - 1) * pageSize : 0;

  // Infinite scroll IntersectionObserver hook
  useEffect(() => {
    if (browseMode !== "infinite") return;
    if (infiniteCount >= totalItems) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setInfiniteCount((prev) => Math.min(prev + pageSize, totalItems));
            setIsLoadingMore(false);
          }, 150);
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [browseMode, infiniteCount, totalItems, isLoadingMore, pageSize]);

  // Restore scroll position after series items render on page return
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (allManhwa.isLoading || !paginatedItems || paginatedItems.length === 0) return;

    try {
      const savedScroll = sessionStorage.getItem("vnr_browse_scroll_pos");
      if (savedScroll) {
        const targetY = parseInt(savedScroll, 10);
        if (!Number.isNaN(targetY) && targetY > 0) {
          let attempts = 0;
          let cancelled = false;
          const maxAttempts = 35;

          const performRestore = () => {
            if (cancelled) return;
            attempts++;

            window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });

            if (Math.abs(window.scrollY - targetY) < 30 || attempts >= maxAttempts) {
              scrollRestoredRef.current = true;
              return;
            }

            setTimeout(performRestore, 50);
          };

          const t = setTimeout(performRestore, 40);
          return () => {
            cancelled = true;
            clearTimeout(t);
          };
        }
      }
    } catch {}
    scrollRestoredRef.current = true;
  }, [paginatedItems, allManhwa.isLoading]);

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
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (currentPage !== 1) {
                  setCurrentPage(1);
                  try {
                    sessionStorage.setItem("vnr_browse_page", "1");
                    sessionStorage.removeItem("vnr_browse_scroll_pos");
                  } catch {}
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("page");
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                }
              }}
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
                          genreFilters.some((g) => g.toLowerCase() === genre.slug.toLowerCase())
                            ? "border-violet-600 bg-violet-600"
                            : "border-input"
                        }`}
                      >
                        {genreFilters.some((g) => g.toLowerCase() === genre.slug.toLowerCase()) && (
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
                          borderColor: tagFilters.some((t) => t.toLowerCase() === tag.slug.toLowerCase()) ? (tag.color || "#8b5cf6") : undefined,
                          backgroundColor: tagFilters.some((t) => t.toLowerCase() === tag.slug.toLowerCase()) ? (tag.color || "#8b5cf6") : undefined,
                        }}
                      >
                        {tagFilters.some((t) => t.toLowerCase() === tag.slug.toLowerCase()) && (
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
          <Select value={statusFilter} onValueChange={handleStatusChange}>
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
          <Select value={contentRating} onValueChange={handleRatingChange}>
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
          <Select value={duration} onValueChange={handleDurationChange}>
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

          <Select value={sortBy} onValueChange={handleSortChange}>
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
                  resetPageToFirst();
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("group");
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                }}
              />
            </Badge>
          )}

          {genreFilters.map((slug) => {
            const genreObj = genres.data?.find((g) => g.slug.toLowerCase() === slug.toLowerCase());
            const label = genreObj?.name || slug;
            return (
              <Badge
                key={`genre-${slug}`}
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 bg-violet-500/10 text-primary border border-violet-500/20 text-xs font-semibold h-9 rounded-lg capitalize"
              >
                Genre: {label}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-foreground"
                  onClick={() => toggleGenre(slug)}
                />
              </Badge>
            );
          })}

          {tagFilters.map((slug) => {
            const tagObj = tags.data?.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
            const label = tagObj?.name || slug;
            return (
              <Badge
                key={`tag-${slug}`}
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold h-9 rounded-lg capitalize"
              >
                Tag: {label}
                <X
                  className="h-3.5 w-3.5 cursor-pointer hover:text-foreground"
                  onClick={() => toggleTag(slug)}
                />
              </Badge>
            );
          })}

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

        {/* Results Count & View Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {totalItems} manga found
              </p>
              {totalItems > 0 && (
                <span className="text-xs text-muted-foreground">
                  {browseMode === "paged"
                    ? `• Page ${activePage} of ${totalPages}`
                    : `• Showing ${Math.min(infiniteCount, totalItems)} of ${totalItems}`}
                </span>
              )}
            </div>
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

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Paged vs Infinite Scroll Switcher */}
            <div className="flex items-center rounded-lg border border-border/40 bg-card/70 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setBrowseMode("paged");
                  try {
                    localStorage.setItem("vnr_browse_mode", "paged");
                  } catch {
                    // ignore
                  }
                }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  browseMode === "paged"
                    ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Page navigation (same to history pages)"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Pages</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrowseMode("infinite");
                  try {
                    localStorage.setItem("vnr_browse_mode", "infinite");
                  } catch {
                    // ignore
                  }
                }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  browseMode === "infinite"
                    ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Continuous infinite scrolling"
              >
                <InfinityIcon className="h-3.5 w-3.5" />
                <span>Infinite Scroll</span>
              </button>
            </div>

            {/* Grid vs List View Toggle */}
            <div className="flex items-center rounded-lg border border-border/40 bg-card/70 p-0.5 shadow-sm">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="icon" 
                className="h-7 w-7 rounded-md cursor-pointer"
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="icon" 
                className="h-7 w-7 rounded-md cursor-pointer"
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Manhwa Grid/List */}
        {viewMode === "grid" ? (
          <SeriesGrid 
            items={paginatedItems} 
            loading={allManhwa.isLoading} 
            emptyMessage="No manga found. Try adjusting your filters or search query."
            showRank={sortBy === "popular" || sortBy === "rating"}
            rankOffset={rankOffset}
          />
        ) : (
          <SeriesList 
            items={paginatedItems} 
            loading={allManhwa.isLoading} 
            rankOffset={rankOffset}
          />
        )}

        {/* Pagination Controls / Infinite Scroll Sentinel */}
        {!allManhwa.isLoading && totalItems > 0 && (
          browseMode === "paged" ? (
            <SectionPagination
              currentPage={activePage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => {
                setCurrentPage(p);
                try {
                  sessionStorage.setItem("vnr_browse_page", String(p));
                  sessionStorage.setItem("vnr_browse_scroll_pos", "0");
                } catch {}
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(p));
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              itemLabel="manga"
              accentColor="#8B5CF6"
            />
          ) : (
            <div className="mt-8 space-y-4">
              {infiniteCount < totalItems ? (
                <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-300">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span>Loading more series ({Math.min(infiniteCount, totalItems)} of {totalItems})...</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInfiniteCount((prev) => Math.min(prev + pageSize, totalItems))}
                    className="h-8 text-xs cursor-pointer border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/30"
                  >
                    Load More Manga
                  </Button>
                </div>
              ) : (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/30 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="font-medium text-foreground">You've reached the end</span>
                    <span>• All {totalItems} manga loaded</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="h-8 text-xs gap-1.5 hover:text-foreground cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Back to top
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// List View Component
function SeriesList({ items, loading, rankOffset = 0 }: { items?: any[]; loading: boolean; rankOffset?: number }) {
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
              #{rankOffset + index + 1}
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
              <Badge variant="outline" className="badge-glass text-3xs font-semibold uppercase tracking-wider py-0.5 px-1.5 leading-none rounded-[3px]">{s.type}</Badge>
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
    <Suspense fallback={<PageKineticLoader />}>
      <BrowsePageContent initialData={initialData} />
    </Suspense>
  );
}
