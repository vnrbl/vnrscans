import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: (s.q as string) || "" }),
  head: () => ({ meta: [{ title: "Search — vnrscans" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [value, setValue] = useState(q || "");
  const prepared = prepareSearchInput(q || "");
  const displayTerm = getSearchDisplayTerm(q || "");

  useEffect(() => {
    const t = setTimeout(() => navigate({ search: { q: value } }), 150);
    return () => clearTimeout(t);
  }, [value, navigate]);

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
    <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8">
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
