import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, BookOpen, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — vnrscans" },
      { name: "description", content: "Personalized series recommendations based on your reading history" },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { user } = useAuth();

  const recommendations = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Try to get existing recommendations
      const { data: existing, error: existingError } = await supabase
        .from("user_recommendations")
        .select("series:series_id(id,slug,title,cover_url,type,rating_average,description,status)")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(20);
      
      if (existingError) throw existingError;
      
      // If no recommendations, generate them
      if (!existing || existing.length === 0) {
        await supabase.rpc("generate_user_recommendations", { target_user_id: user.id });
        
        const { data: newData, error: newError } = await supabase
          .from("user_recommendations")
          .select("series:series_id(id,slug,title,cover_url,type,rating_average,description,status)")
          .eq("user_id", user.id)
          .order("score", { ascending: false })
          .limit(20);
        
        if (newError) throw newError;
        return newData ?? [];
      }
      
      return existing ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  const basedOnGenres = useQuery({
    queryKey: ["recommendations-by-genre", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's reading history genres
      const { data: historyData, error: historyError } = await supabase
        .from("reading_history")
        .select("series:series_id(series_genres(genre:genres(slug)))")
        .eq("user_id", user.id)
        .limit(50);
      
      if (historyError) throw historyError;
      
      // Extract genre slugs
      const genreSlugs = new Set<string>();
      historyData?.forEach((h: any) => {
        h.series?.series_genres?.forEach((sg: any) => {
          if (sg.genre?.slug) genreSlugs.add(sg.genre.slug);
        });
      });
      
      if (genreSlugs.size === 0) return [];
      
      // Find series with matching genres that user hasn't read
      const { data: readSeries } = await supabase
        .from("reading_history")
        .select("series_id")
        .eq("user_id", user.id);
      
      const readSeriesIds = (readSeries ?? []).map((r) => r.series_id);
      
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,description,status,series_genres(genre:genres(slug))")
        .not("id", "in", `(${readSeriesIds.join(",") || "'00000000-0000-0000-0000-000000000000'"})`)
        .order("rating_average", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Score based on genre matches
      const scored = (data ?? []).map((series: any) => {
        const matches = series.series_genres?.filter((sg: any) => 
          genreSlugs.has(sg.genre?.slug)
        ).length || 0;
        return { ...series, genreMatches: matches };
      });
      
      return scored
        .filter((s) => s.genreMatches > 0)
        .sort((a, b) => b.genreMatches - a.genreMatches || (b.rating_average || 0) - (a.rating_average || 0))
        .slice(0, 20);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
        <Card className="max-w-md p-8 text-center border-border/40 bg-card/45 backdrop-blur-md relative z-10 shadow-xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight">Sign In for Recommendations</h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Get personalized series suggestions and reading matches based on your story bookmarks and history.
          </p>
          <Link to="/auth">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-md">
              Sign In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8 relative">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Recommendations</h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Personalized suggestions and reading matches based on your story bookmarks and history
              </p>
            </div>
          </div>
        </div>

        {/* Main Recommendations */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" /> For You
          </h2>
          {recommendations.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border/40 bg-card/40 p-1">
                  <div className="aspect-[2/3] animate-pulse rounded-lg bg-secondary" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.data && recommendations.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recommendations.data.map((rec: any) => {
                const series = rec.series;
                if (!series) return null;
                return (
                  <SeriesCard key={series.id} series={series} />
                );
              })}
            </div>
          ) : (
            <Card className="p-10 text-center border-border/40 bg-card/40 backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">
                Start reading some series to get personalized recommendations!
              </p>
              <Link to="/browse">
                <Button className="mt-4 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm">
                  Browse Series
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Genre-Based Recommendations */}
        <section>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" /> Based on Your Favorite Genres
          </h2>
          {basedOnGenres.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border/40 bg-card/40 p-1">
                  <div className="aspect-[2/3] animate-pulse rounded-lg bg-secondary" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : basedOnGenres.data && basedOnGenres.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {basedOnGenres.data.map((series: any) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center border-border/40 bg-card/40 backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">
                Read more series to unlock genre-based suggestions!
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function SeriesCard({ series }: { series: any }) {
  return (
    <Link
      to="/title/$slug"
      params={{ slug: series.slug }}
      className="group overflow-hidden rounded-xl border border-border/30 bg-card/35 p-1.5 transition-all duration-300 hover:border-primary/50 hover:bg-card/65 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-secondary relative shadow-sm border border-border/10">
        {series.cover_url ? (
          <img
            src={series.cover_url}
            alt={series.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        {series.rating_average && Number(series.rating_average) > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-bold backdrop-blur border border-border/40">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {Number(series.rating_average).toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
          {series.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-3xs uppercase tracking-wider font-semibold border-border/50">
            {series.type}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
