import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Eye, Star, Heart, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — 0Verse" },
      { name: "description", content: "Top ranked manga, manhwa, and manhua series" },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const topRated = useQuery({
    queryKey: ["rankings", "top-rated"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,view_count,status")
        .not("rating_average", "is", null)
        .order("rating_average", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 15,
  });

  const mostViewed = useQuery({
    queryKey: ["rankings", "most-viewed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,view_count,status")
        .order("view_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 15,
  });

  const mostFollowed = useQuery({
    queryKey: ["rankings", "most-followed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_most_followed_series", { limit_count: 50 });
      if (error) {
        // Fallback if function doesn't exist
        const { data: fallback, error: fallbackError } = await supabase
          .from("series")
          .select("id,slug,title,cover_url,type,rating_average,view_count,status")
          .order("view_count", { ascending: false })
          .limit(50);
        if (fallbackError) throw fallbackError;
        return fallback ?? [];
      }
      return data ?? [];
    },
    staleTime: 1000 * 60 * 15,
  });

  const trending = useQuery({
    queryKey: ["rankings", "trending"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("chapters")
        .select("series_id, series:series(id,slug,title,cover_url,type,rating_average,view_count,status)")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Count chapters per series and aggregate
      const seriesMap = new Map();
      (data ?? []).forEach((chapter: any) => {
        const series = chapter.series;
        if (!series) return;
        
        if (seriesMap.has(series.id)) {
          seriesMap.get(series.id).recentChapters++;
        } else {
          seriesMap.set(series.id, { ...series, recentChapters: 1 });
        }
      });
      
      return Array.from(seriesMap.values())
        .sort((a, b) => b.recentChapters - a.recentChapters)
        .slice(0, 50);
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-violet-600" />
            <h1 className="text-3xl font-bold">Rankings</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Discover the top-rated and most popular series on 0Verse
          </p>
        </div>

        <Tabs defaultValue="top-rated" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="top-rated">
              <Star className="mr-2 h-4 w-4" />
              Top Rated
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="most-viewed">
              <Eye className="mr-2 h-4 w-4" />
              Most Viewed
            </TabsTrigger>
            <TabsTrigger value="most-followed">
              <Heart className="mr-2 h-4 w-4" />
              Most Followed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="space-y-4">
            <RankingList data={topRated.data ?? []} loading={topRated.isLoading} type="rating" />
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <RankingList data={trending.data ?? []} loading={trending.isLoading} type="trending" />
          </TabsContent>

          <TabsContent value="most-viewed" className="space-y-4">
            <RankingList data={mostViewed.data ?? []} loading={mostViewed.isLoading} type="views" />
          </TabsContent>

          <TabsContent value="most-followed" className="space-y-4">
            <RankingList data={mostFollowed.data ?? []} loading={mostFollowed.isLoading} type="followers" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RankingList({
  data,
  loading,
  type,
}: {
  data: any[];
  loading: boolean;
  type: "rating" | "views" | "followers" | "trending";
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-border/40 bg-card p-4">
            <div className="h-8 w-8 animate-pulse rounded bg-secondary" />
            <div className="h-20 w-14 animate-pulse rounded bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No rankings available yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((series, index) => (
        <Link
          key={series.id}
          to="/title/$slug"
          params={{ slug: series.slug }}
          className="group flex items-center gap-4 rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
        >
          {/* Rank */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
            {index < 3 ? (
              <Trophy className={`h-5 w-5 ${index === 0 ? 'text-yellow-300' : index === 1 ? 'text-gray-300' : 'text-orange-300'}`} />
            ) : (
              index + 1
            )}
          </div>

          {/* Cover */}
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-secondary">
            {series.cover_url ? (
              <img
                src={series.cover_url}
                alt={series.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold group-hover:text-primary">
              {series.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs uppercase">
                {series.type}
              </Badge>
              {series.status && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {series.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden shrink-0 text-right sm:block">
            {type === "rating" && series.rating_average && (
              <div className="flex items-center gap-1 text-lg font-bold text-violet-600">
                <Star className="h-5 w-5 fill-violet-600" />
                {Number(series.rating_average).toFixed(2)}
              </div>
            )}
            {type === "views" && (
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Eye className="h-4 w-4" />
                {Number(series.view_count || 0).toLocaleString()}
              </div>
            )}
            {type === "followers" && series.follower_count && (
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Heart className="h-4 w-4" />
                {Number(series.follower_count).toLocaleString()}
              </div>
            )}
            {type === "trending" && series.recentChapters && (
              <div className="flex items-center gap-1 text-sm font-semibold text-violet-600">
                <TrendingUp className="h-4 w-4" />
                {series.recentChapters} new
              </div>
            )}
            {series.rating_average && type !== "rating" && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-current" />
                {Number(series.rating_average).toFixed(1)}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
