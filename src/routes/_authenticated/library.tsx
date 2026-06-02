import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "My Library — ShadowShelf" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const bookmarks = useQuery({
    queryKey: ["library", "bookmarks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("series:series(id,slug,title,cover_url,type,rating_average,status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => r.series).filter(Boolean);
    },
  });

  const history = useQuery({
    queryKey: ["library", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_history")
        .select("updated_at,chapter:chapters(slug,chapter_number,title),series:series(id,slug,title,cover_url,type,rating_average,status)")
        .order("updated_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Library</h1>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Continue reading</h2>
        {history.isLoading ? (
          <div className="h-32 animate-pulse rounded bg-secondary" />
        ) : (history.data?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground">
            No reading history yet. <Link to="/browse" className="text-primary">Find something to read.</Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {history.data!.map((h: any) => (
              <Link key={h.series?.id} to="/read/$chapterSlug" params={{ chapterSlug: h.chapter?.slug ?? "" }} className="flex gap-3 rounded-lg border border-border/40 bg-card/50 p-3 hover:border-primary/40">
                {h.series?.cover_url && <img src={h.series.cover_url} alt="" className="h-20 w-14 rounded object-cover" />}
                <div className="min-w-0">
                  <div className="truncate font-medium">{h.series?.title}</div>
                  <div className="text-xs text-muted-foreground">Chapter {h.chapter?.chapter_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(h.updated_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Bookmarks</h2>
        <SeriesGrid items={bookmarks.data} loading={bookmarks.isLoading} emptyMessage="Bookmark series to find them here." />
      </section>
    </div>
  );
}