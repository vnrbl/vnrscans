import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Input } from "@/components/ui/input";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: (s.q as string) || "" }),
  head: () => ({ meta: [{ title: "Search — ShadowShelf" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [value, setValue] = useState(q || "");

  useEffect(() => {
    const t = setTimeout(() => navigate({ search: { q: value } }), 250);
    return () => clearTimeout(t);
  }, [value, navigate]);

  const results = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q || q.length < 2) return [];
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count")
        .or(`title.ilike.%${q}%,alternative_titles.ilike.%${q}%,author.ilike.%${q}%`)
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Search</h1>
      <div className="relative my-6">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by title, author, or alt title..."
          className="pl-10 h-12 text-base"
        />
      </div>
      {q && q.length >= 2 ? (
        <SeriesGrid items={results.data} loading={results.isLoading} emptyMessage={`No results for "${q}"`} />
      ) : (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      )}
    </div>
  );
}