import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tags/$slug")({
  head: ({ params }) => ({ 
    meta: [{ title: `${params.slug} — Browse Tags — vnrscans` }] 
  }),
  component: TagDetailPage,
});

function TagDetailPage() {
  const { slug } = Route.useParams();

  // Get tag details
  const tag = useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Get series with this tag
  const series = useQuery({
    queryKey: ["tag-series", slug],
    queryFn: async () => {
      if (!tag.data?.id) return [];
      
      const { data, error } = await supabase
        .from("series_tags")
        .select(`
          series:series_id (
            id,
            slug,
            title,
            cover_url,
            type,
            status,
            rating_average,
            view_count,
            chapter_count,
            description
          )
        `)
        .eq("tag_id", tag.data.id);
      
      if (error) throw error;
      
      // Extract series from nested structure and filter out nulls
      return (data || [])
        .map((item: any) => item.series)
        .filter((s: any) => s !== null);
    },
    enabled: !!tag.data?.id,
  });

  if (tag.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!tag.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tag not found</h1>
          <p className="mt-2 text-muted-foreground">This tag doesn't exist</p>
          <Link to="/tags" className="mt-4 inline-block">
            <Button variant="outline">Browse All Tags</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 relative">
        {/* Back button */}
        <Link to="/tags" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to All Genres & Tags
        </Link>

        {/* Tag header */}
        <div className="mb-8 p-6 rounded-2xl border border-border/30 bg-card/25 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {tag.data.icon && <span className="text-4xl">{tag.data.icon}</span>}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: tag.data.color || undefined }}>
                {tag.data.name}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-3xs font-semibold px-2 py-0.5"
                  style={{
                    borderColor: tag.data.color || undefined,
                    backgroundColor: tag.data.color ? `${tag.data.color}15` : undefined,
                    color: tag.data.color || undefined,
                  }}
                >
                  {tag.data.usage_count} titles
                </Badge>
              </div>
            </div>
          </div>
          {tag.data.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">{tag.data.description}</p>
          )}
        </div>

        {/* Series grid */}
        <div>
          {series.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card/45 border border-border/40" />
              ))}
            </div>
          )}
          
          {series.data && series.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/25 p-12 text-center max-w-md mx-auto">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary/40 text-muted-foreground">
                <TagIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">No titles yet</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                No titles have been tagged with "{tag.data.name}" yet.
              </p>
            </div>
          )}

          {series.data && series.data.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {series.data.map((s: any) => (
                <SeriesCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
