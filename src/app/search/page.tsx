"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Input } from "@/components/ui/input";
import {
  buildSeriesSearchOrFilter,
  getSearchDisplayTerm,
  prepareSearchInput,
  rankSeriesResults,
} from "@/lib/search-utils";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get("q") || "";
  const [value, setValue] = useState(q);
  const prepared = prepareSearchInput(q);
  const displayTerm = getSearchDisplayTerm(q);

  // Sync state if URL changes externally
  useEffect(() => {
    setValue(q);
  }, [q]);

  // Debounced search update to URL query params
  useEffect(() => {
    const t = setTimeout(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (value.trim()) {
        current.set("q", value);
      } else {
        current.delete("q");
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`);
    }, 150);
    return () => clearTimeout(t);
  }, [value, router, pathname, searchParams]);

  const results = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!prepared.primaryTerm || prepared.primaryTerm.length < 2) return [];
      const searchFilter = buildSeriesSearchOrFilter(prepared.terms);
      if (!searchFilter) return [];

      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,alternative_titles,description,cover_url,type,rating_average,status,view_count,author,artist,is_trending")
        .eq("is_hidden", false)
        .or(searchFilter)
        .limit(60);
      if (error) throw error;
      return rankSeriesResults(data ?? [], prepared).slice(0, 40);
    },
    enabled: prepared.primaryTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Search</h1>
      <div className="relative my-6">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by title, author, alt title, or paste a link..."
          className="pl-10 h-12 text-base"
        />
      </div>
      {prepared.primaryTerm.length >= 2 ? (
        <SeriesGrid
          items={results.data}
          loading={results.isLoading}
          emptyMessage={`No results for "${displayTerm}"`}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Type at least 2 characters or paste a title link.</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl animate-pulse">Loading Search...</h1>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
