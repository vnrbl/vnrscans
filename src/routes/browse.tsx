import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Button } from "@/components/ui/button";

type Search = {
  type?: string;
  genre?: string;
  status?: string;
  sort?: string;
};

export const Route = createFileRoute("/browse")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    type: (s.type as string) || undefined,
    genre: (s.genre as string) || undefined,
    status: (s.status as string) || undefined,
    sort: (s.sort as string) || "updated",
  }),
  head: () => ({
    meta: [
      { title: "Browse — ShadowShelf" },
      { name: "description", content: "Browse manga, manhwa, manhua, and novels by genre, type, and status." },
    ],
  }),
  component: BrowsePage,
});

const TYPES = ["manga", "manhwa", "manhua", "novel"];
const STATUSES = ["ongoing", "completed", "hiatus", "cancelled"];
const SORTS = [
  { v: "updated", l: "Recently updated" },
  { v: "rating", l: "Top rated" },
  { v: "views", l: "Most viewed" },
  { v: "new", l: "Newest" },
];

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });

  const update = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const genres = useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("genres").select("id,name,slug").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = useQuery({
    queryKey: ["browse", search],
    queryFn: async () => {
      let q = supabase.from("series").select(
        "id,slug,title,cover_url,type,rating_average,status,series_genres(genre_id)"
      );
      if (search.type) q = q.eq("type", search.type as any);
      if (search.status) q = q.eq("status", search.status as any);
      const sortMap: Record<string, [string, boolean]> = {
        updated: ["updated_at", false],
        rating: ["rating_average", false],
        views: ["view_count", false],
        new: ["created_at", false],
      };
      const [col, asc] = sortMap[search.sort || "updated"];
      q = q.order(col, { ascending: asc });
      const { data, error } = await q.limit(60);
      if (error) throw error;
      let rows = data ?? [];
      if (search.genre) {
        const g = genres.data?.find((x) => x.slug === search.genre);
        if (g) rows = rows.filter((r: any) => r.series_genres?.some((sg: any) => sg.genre_id === g.id));
      }
      return rows;
    },
    enabled: !search.genre || !!genres.data,
  });

  const activeGenre = useMemo(
    () => genres.data?.find((g) => g.slug === search.genre),
    [genres.data, search.genre]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Browse</h1>
        <p className="text-sm text-muted-foreground">Filter by type, genre, and status.</p>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-border/40 bg-card/50 p-4">
        <div className="flex flex-wrap gap-2">
          <Pill label="All types" active={!search.type} onClick={() => update({ type: undefined })} />
          {TYPES.map((t) => (
            <Pill key={t} label={t.toUpperCase()} active={search.type === t} onClick={() => update({ type: t })} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill label="Any status" active={!search.status} onClick={() => update({ status: undefined })} />
          {STATUSES.map((s) => (
            <Pill key={s} label={s} active={search.status === s} onClick={() => update({ status: s })} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill label="All genres" active={!search.genre} onClick={() => update({ genre: undefined })} />
          {(genres.data ?? []).map((g) => (
            <Pill key={g.id} label={g.name} active={search.genre === g.slug} onClick={() => update({ genre: g.slug })} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs uppercase text-muted-foreground">Sort:</span>
          {SORTS.map((s) => (
            <Pill key={s.v} label={s.l} active={(search.sort || "updated") === s.v} onClick={() => update({ sort: s.v })} />
          ))}
        </div>
      </div>

      {activeGenre && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing <span className="text-foreground">{activeGenre.name}</span>
        </div>
      )}

      <SeriesGrid items={list.data} loading={list.isLoading} emptyMessage="No series match these filters." />
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={active ? "bg-primary text-primary-foreground" : ""}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}