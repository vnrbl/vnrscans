"use client";

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Eye, Star, Heart, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState("top-rated");

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
    enabled: activeTab === "top-rated",
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
    enabled: activeTab === "most-viewed",
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
    enabled: activeTab === "most-followed",
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
    enabled: activeTab === "trending",
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <title>Rankings — vnrscans</title>
      <meta name="description" content="Top ranked manga, manhwa, and manhua series" />
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 relative">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Rankings</h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Discover the top-rated and most popular series on vnrscans
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 p-1 bg-secondary/30 border border-border/30 backdrop-blur-md rounded-xl">
            <TabsTrigger value="top-rated" className="rounded-lg data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Star className="mr-2 h-4 w-4" />
              Top Rated
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="most-viewed" className="rounded-lg data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Eye className="mr-2 h-4 w-4" />
              Most Viewed
            </TabsTrigger>
            <TabsTrigger value="most-followed" className="rounded-lg data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Heart className="mr-2 h-4 w-4" />
              Most Followed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="space-y-4 focus-visible:outline-none">
            <RankingList data={topRated.data ?? []} loading={topRated.isLoading} type="rating" />
          </TabsContent>

          <TabsContent value="trending" className="space-y-4 focus-visible:outline-none">
            <RankingList data={trending.data ?? []} loading={trending.isLoading} type="trending" />
          </TabsContent>

          <TabsContent value="most-viewed" className="space-y-4 focus-visible:outline-none">
            <RankingList data={mostViewed.data ?? []} loading={mostViewed.isLoading} type="views" />
          </TabsContent>

          <TabsContent value="most-followed" className="space-y-4 focus-visible:outline-none">
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
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 p-4">
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
      <Card className="p-8 text-center border-border/40 bg-card/40 backdrop-blur-sm">
        <p className="text-muted-foreground">No rankings available yet.</p>
      </Card>
    );
  }

  // Helper classes for top 3 badges
  const rankBadges = [
    "bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_15px_rgba(250,204,21,0.25)] text-amber-950 border border-yellow-300/30",
    "bg-gradient-to-br from-slate-300 via-gray-100 to-slate-400 shadow-[0_0_15px_rgba(241,245,249,0.2)] text-slate-900 border border-slate-200/20",
    "bg-gradient-to-br from-amber-700 via-amber-600 to-orange-800 shadow-[0_0_15px_rgba(194,65,12,0.15)] text-amber-50 border border-amber-600/20",
  ];

  return (
    <div className="space-y-3">
      {data.map((series, index) => (
        <Link
          key={series.id}
          to="/title/$slug"
          params={{ slug: series.slug }}
          className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/35 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/65 hover:shadow-lg hover:shadow-primary/5 hover:translate-x-1"
        >
          {/* Rank */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${index < 3 ? rankBadges[index] : 'bg-secondary/40 text-muted-foreground border border-border/40'}`}>
            {index < 3 ? (
              <Trophy className="h-4.5 w-4.5" />
            ) : (
              index + 1
            )}
          </div>

          {/* Cover */}
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-md border border-border/20">
            {series.cover_url ? (
              <img
                src={series.cover_url}
                alt={series.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold group-hover:text-primary transition-colors">
              {series.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-3xs uppercase tracking-wider font-semibold border-border/50">
                {series.type}
              </Badge>
              {series.status && (
                <Badge variant="secondary" className="text-3xs capitalize font-medium">
                  {series.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden shrink-0 text-right sm:block pr-2">
            {type === "rating" && series.rating_average && (
              <div className="flex items-center gap-1 text-lg font-black text-primary">
                <Star className="h-5 w-5 fill-primary text-primary" />
                {Number(series.rating_average).toFixed(2)}
              </div>
            )}
            {type === "views" && (
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Eye className="h-4 w-4 text-accent" />
                {Number(series.view_count || 0).toLocaleString()}
              </div>
            )}
            {type === "followers" && series.follower_count && (
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />
                {Number(series.follower_count).toLocaleString()}
              </div>
            )}
            {type === "trending" && series.recentChapters && (
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4" />
                {series.recentChapters} new
              </div>
            )}
            {series.rating_average && type !== "rating" && (
              <div className="mt-1 flex items-center gap-1 justify-end text-xs text-muted-foreground font-medium">
                <Star className="h-3 w-3 fill-primary text-primary" />
                {Number(series.rating_average).toFixed(1)}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
