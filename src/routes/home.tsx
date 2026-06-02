import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — 0Verse" },
      { name: "description", content: "Discover and read the latest manhwa series with 0Verse." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  // Featured manhwa carousel
  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,description")
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Recently added chapters
  const recentChapters = useQuery({
    queryKey: ["recent-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,title,chapter_number,created_at,series:series_id(slug,title)")
        .order("created_at", { ascending: false })
        .limit(18);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Popular manhwa
  const popular = useQuery({
    queryKey: ["popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count")
        .order("view_count", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  // High score manhwa
  const highScore = useQuery({
    queryKey: ["high-score"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,view_count")
        .order("rating_average", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Featured Section */}
      {featured.data && featured.data.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.data.map((series) => (
              <Link key={series.id} to="/series/$slug" params={{ slug: series.slug }}>
                <Card className="group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="absolute inset-0">
                    {series.cover_url && (
                      <img
                        src={series.cover_url}
                        alt={series.title}
                        className="h-full w-full object-cover opacity-20 blur-sm transition-all group-hover:opacity-30"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  </div>
                  <div className="relative flex h-full min-h-[200px] flex-col justify-end p-6">
                    <Badge variant="secondary" className="mb-2 w-fit text-xs uppercase">
                      {series.type}
                    </Badge>
                    {series.rating_average && (
                      <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-primary">
                        <span>★</span>
                        <span>{Number(series.rating_average).toFixed(2)}</span>
                      </div>
                    )}
                    <h3 className="mb-2 line-clamp-2 text-xl font-bold">{series.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{series.description}</p>
                    <Button size="sm" className="mt-4 w-fit">
                      Read
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recently Added</h2>
        </div>
        {recentChapters.isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : recentChapters.data && recentChapters.data.length > 0 ? (
          <div className="space-y-2">
            {recentChapters.data.map((chapter: any) => (
              <Link
                key={chapter.id}
                to="/series/$slug"
                params={{ slug: chapter.series?.slug || "" }}
                className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 p-3 transition-all hover:border-primary/50 hover:bg-card"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{chapter.series?.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Ch. {chapter.chapter_number}</span>
                    {chapter.title && <span className="truncate">• {chapter.title}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(chapter.created_at)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border/40 bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No chapters available yet.</p>
          </div>
        )}
      </section>

      {/* Popular Manhwa Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Popular Manhwa</h2>
          <p className="text-sm text-muted-foreground">Discover the most read manhwa series ranked by our community</p>
        </div>
        <SeriesGrid items={popular.data} loading={popular.isLoading} />
      </section>

      {/* High Score Manhwa Section */}
      <section className="bg-secondary/20 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">High Score Manhwa</h2>
            <p className="text-sm text-muted-foreground">Discover the highest rated manhwa series</p>
          </div>
          <SeriesGrid items={highScore.data} loading={highScore.isLoading} />
        </div>
      </section>
    </div>
  );
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
