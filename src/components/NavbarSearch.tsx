"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Books,
  Buildings,
  Compass,
  Flame,
  Sparkle,
  Users,
} from "@phosphor-icons/react";
import {
  SearchModal,
  SearchTag,
  SearchResult,
} from "@/components/ui/search-modal";
import {
  buildSeriesSearchOrFilter,
  prepareSearchInput,
  rankSeriesResults,
} from "@/lib/search-utils";
import { canonicalScanlationGroup } from "@/lib/import-source-utils";

type FilterCategory = "all" | "manga" | "manhwa" | "manhua" | "novel" | "users" | "groups";

const seriesTypeLabels: Record<string, string> = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  novel: "Novel",
};

interface NavbarSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavbarSearch({ open, onOpenChange }: NavbarSearchProps) {
  const router = useRouter();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [searching, setSearching] = useState(false);
  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [groupResults, setGroupResults] = useState<string[]>([]);

  // Instant route prefetching when search dialog is opened
  useEffect(() => {
    if (open) {
      router.prefetch("/browse");
      router.prefetch("/rankings");
    }
  }, [open, router]);

  // In-memory search cache for instant sub-millisecond response on backspace/repeat
  const searchCacheRef = useRef<Map<string, { series: any[]; users: any[]; groups: string[] }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search with in-memory caching and abort cancellation
  useEffect(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ || rawQ.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSeriesResults([]);
      setUserResults([]);
      setGroupResults([]);
      setSearching(false);
      return;
    }

    const prepared = prepareSearchInput(rawQ);
    const cacheKey = `${selectedCategory}:${prepared.normalized}`;

    // Instant Cache Hit (0ms latency)
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSeriesResults(cached.series);
      setUserResults(cached.users);
      setGroupResults(cached.groups);
      setSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      const q = prepared.primaryTerm;
      if (q.length >= 2) {
        setSearching(true);
        try {
          if (selectedCategory === "users") {
            const { data: usersData, error } = await supabase
              .from("profiles")
              .select("username,avatar_url,user_level,reading_streak")
              .ilike("username", `%${q}%`)
              .abortSignal(controller.signal)
              .limit(8);

            if (controller.signal.aborted) return;
            if (error) throw error;
            const users = usersData || [];
            setUserResults(users);
            searchCacheRef.current.set(cacheKey, { series: [], users, groups: [] });
          } else if (selectedCategory === "groups") {
            const { data: groupsData, error } = await supabase
              .from("series_import_sources")
              .select("scanlation_group")
              .ilike("scanlation_group", `%${q}%`)
              .not("scanlation_group", "is", null)
              .abortSignal(controller.signal)
              .limit(10);

            if (controller.signal.aborted) return;
            if (error) throw error;
            const uniqueGroups = groupsData
              ? (Array.from(
                  new Set(groupsData.map((c: any) => canonicalScanlationGroup(c.scanlation_group)).filter(Boolean))
                ) as string[]).slice(0, 10)
              : [];
            setGroupResults(uniqueGroups);
            searchCacheRef.current.set(cacheKey, { series: [], users: [], groups: uniqueGroups });
          } else {
            // Search Series
            const seriesFilter = buildSeriesSearchOrFilter(prepared.terms);
            let queryBuilder = supabase
              .from("series")
              .select("id,slug,title,alternative_titles,description,cover_url,type,rating_average,view_count,is_trending")
              .eq("is_hidden", false)
              .or(seriesFilter)
              .abortSignal(controller.signal);

            if (selectedCategory !== "all") {
              queryBuilder = queryBuilder.eq("type", selectedCategory);
            }

            const { data: seriesData, error } = await queryBuilder.limit(24);
            if (controller.signal.aborted) return;
            if (error) throw error;

            const ranked = seriesData ? rankSeriesResults(seriesData, prepared).slice(0, 16) : [];
            setSeriesResults(ranked);
            searchCacheRef.current.set(cacheKey, { series: ranked, users: [], groups: [] });
          }
        } catch (err: any) {
          if (err?.name !== "AbortError" && !controller.signal.aborted) {
            console.error("Search error:", err);
          }
        } finally {
          if (!controller.signal.aborted) {
            setSearching(false);
          }
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCategory]);

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleNavigateSeries = (slug: string) => {
    handleClose();
    navigate({ to: "/title/$slug", params: { slug } });
  };

  const handleNavigateUser = (username: string) => {
    handleClose();
    navigate({ to: "/user/$username", params: { username } });
  };

  const handleNavigateGroup = (groupName: string) => {
    handleClose();
    navigate({ to: "/browse", search: { group: groupName } });
  };

  // Build Filter Tags ("I'm looking for...")
  const tags: SearchTag[] = useMemo(() => [
    {
      id: "all",
      label: "All",
      icon: <Sparkle className="h-3.5 w-3.5" />,
      active: selectedCategory === "all",
    },
    {
      id: "manhwa",
      label: "Manhwa",
      icon: <Flame className="h-3.5 w-3.5" />,
      active: selectedCategory === "manhwa",
    },
    {
      id: "manga",
      label: "Manga",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      active: selectedCategory === "manga",
    },
    {
      id: "manhua",
      label: "Manhua",
      icon: <Compass className="h-3.5 w-3.5" />,
      active: selectedCategory === "manhua",
    },
    {
      id: "novel",
      label: "Novels",
      icon: <Books className="h-3.5 w-3.5" />,
      active: selectedCategory === "novel",
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="h-3.5 w-3.5" />,
      active: selectedCategory === "users",
    },
    {
      id: "groups",
      label: "Groups",
      icon: <Buildings className="h-3.5 w-3.5" />,
      active: selectedCategory === "groups",
    },
  ], [selectedCategory]);

  const handleTagClick = (tag: SearchTag) => {
    const tagId = (tag.id || tag.label.toLowerCase()) as FilterCategory;
    setSelectedCategory((prev) => (prev === tagId ? "all" : tagId));
  };

  // Format search results (only when actively queried)
  const results: SearchResult[] = useMemo(() => {
    const isQuerying = searchQuery.trim().length >= 2;
    if (!isQuerying) {
      return [];
    }

    if (selectedCategory === "users") {
      return userResults.map((u) => ({
        name: u.username,
        meta: `Reader • Lv. ${u.user_level || 1} • Streak: ${u.reading_streak || 0}d`,
        avatar: u.avatar_url,
        avatarShape: "circle",
        href: `/user/${u.username}`,
        actions: [
          {
            icon: <Users className="h-4 w-4" />,
            label: "View Profile",
            onClick: () => handleNavigateUser(u.username),
          },
        ],
      }));
    }

    if (selectedCategory === "groups") {
      return groupResults.map((g) => ({
        name: g,
        meta: "Scanlation Group • Series Provider",
        avatarShape: "rounded",
        href: `/browse?group=${encodeURIComponent(g)}`,
        actions: [
          {
            icon: <Compass className="h-4 w-4" />,
            label: "Browse Series",
            onClick: () => handleNavigateGroup(g),
          },
        ],
      }));
    }

    return seriesResults.map((series) => {
      const views = series.view_count
        ? series.view_count >= 1000
          ? `${(series.view_count / 1000).toFixed(0)}k views`
          : `${series.view_count} views`
        : "Popular";
      const rating = series.rating_average ? `★ ${Number(series.rating_average).toFixed(1)}` : "★ 4.8";
      const typeLabel = seriesTypeLabels[series.type] || series.type || "Manga";

      return {
        name: series.title,
        meta: `${typeLabel} • ${rating} • ${views}`,
        avatar: series.cover_url,
        avatarShape: "rounded",
        badge: series.is_trending ? "HOT" : undefined,
        href: `/title/${series.slug}`,
        actions: [
          {
            icon: <BookOpen className="h-4 w-4" />,
            label: "Read Series",
            onClick: () => handleNavigateSeries(series.slug),
          },
        ],
      };
    });
  }, [searchQuery, selectedCategory, userResults, groupResults, seriesResults]);

  const handleSubmitQuery = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    handleClose();
    navigate({ to: "/browse", search: { search: trimmed } });
  };

  return (
    <SearchModal
      modal={true}
      open={open}
      onOpenChange={onOpenChange}
      placeholder="Search series by title, author, or press Enter to browse..."
      tags={tags}
      onTagClick={handleTagClick}
      results={results}
      resultsTitle="Search Results"
      resultsCount={results.length}
      defaultQuery={searchQuery}
      loading={searching}
      onQueryChange={setSearchQuery}
      onSubmitQuery={handleSubmitQuery}
      onSelectResult={(res) => {
        if (res.href) {
          handleClose();
          router.push(res.href);
        }
      }}
    />
  );
}

export default NavbarSearch;
