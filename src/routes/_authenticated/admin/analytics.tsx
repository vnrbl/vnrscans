import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, BookOpen, Eye, Heart, MessageSquare, Star, Clock, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Admin · Analytics" }] }),
  component: AdminAnalytics,
});

type TimeRange = "7d" | "30d" | "90d";

function AdminAnalytics() {
  const today = new Date().toISOString().split("T")[0];
  
  // Today's quick stats
  const todayStats = useQuery({
    queryKey: ["analytics", "today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_analytics")
        .select("*")
        .eq("date", today)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      // If no data for today, calculate it
      if (!data) {
        // Get counts directly
        const [users, series, chapters, sessions] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("series").select("id", { count: "exact", head: true }),
          supabase.from("chapters").select("id", { count: "exact", head: true }),
          supabase.from("reading_sessions").select("id", { count: "exact", head: true }).gte("started_at", today),
        ]);
        
        return {
          total_users: users.count || 0,
          total_series: series.count || 0,
          total_chapters: chapters.count || 0,
          chapters_read: sessions.count || 0,
          new_users: 0,
          new_series: 0,
          new_chapters: 0,
        };
      }
      
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Trending series (last 7 days)
  const trendingSeries = useQuery({
    queryKey: ["analytics", "trending-series"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("series")
        .select("id, title, slug, cover_url, type, view_count")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("view_count", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Most active users (by reading sessions)
  const activeUsers = useQuery({
    queryKey: ["analytics", "active-users"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("reading_sessions")
        .select("user_id, profiles!inner(username, avatar_url, reading_streak)")
        .gte("started_at", sevenDaysAgo.toISOString())
        .not("user_id", "is", null);
      
      if (error) throw error;
      
      // Count sessions per user
      const userSessions = (data || []).reduce((acc: any, session: any) => {
        const userId = session.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            username: session.profiles?.username || "Anonymous",
            avatar_url: session.profiles?.avatar_url,
            reading_streak: session.profiles?.reading_streak || 0,
            session_count: 0,
          };
        }
        acc[userId].session_count++;
        return acc;
      }, {});
      
      return Object.values(userSessions)
        .sort((a: any, b: any) => b.session_count - a.session_count)
        .slice(0, 10);
    },
  });

  // Recent chapters uploaded
  const recentChapters = useQuery({
    queryKey: ["analytics", "recent-chapters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, chapter_number, title, created_at, series!inner(title, slug)")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Genre (tag) popularity
  const popularTags = useQuery({
    queryKey: ["analytics", "popular-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug, color, icon, usage_count")
        .order("usage_count", { ascending: false })
        .limit(15);
      
      if (error) throw error;
      return data || [];
    },
  });

  const quickStats = [
    { 
      label: "Total Users", 
      value: todayStats.data?.total_users || 0, 
      change: todayStats.data?.new_users || 0,
      icon: Users,
      color: "text-blue-600"
    },
    { 
      label: "Total Titles", 
      value: todayStats.data?.total_series || 0, 
      change: todayStats.data?.new_series || 0,
      icon: BookOpen,
      color: "text-violet-600"
    },
    { 
      label: "Total Chapters", 
      value: todayStats.data?.total_chapters || 0, 
      change: todayStats.data?.new_chapters || 0,
      icon: BookOpen,
      color: "text-green-600"
    },
    { 
      label: "Chapters Read Today", 
      value: todayStats.data?.chapters_read || 0,
      icon: Eye,
      color: "text-orange-600"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform performance and insights</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  {stat.change !== undefined && stat.change > 0 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{stat.change} today
                    </p>
                  )}
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trending">Trending Content</TabsTrigger>
          <TabsTrigger value="users">Active Users</TabsTrigger>
          <TabsTrigger value="tags">Popular Genres</TabsTrigger>
          <TabsTrigger value="recent">Recent Uploads</TabsTrigger>
        </TabsList>

        {/* Trending Series */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Trending Titles (Last 7 Days)
              </CardTitle>
              <CardDescription>Most viewed titles this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingSeries.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
                {(trendingSeries.data || []).map((series, idx) => (
                  <div key={series.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    {series.cover_url ? (
                      <img src={series.cover_url} alt="" className="h-14 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-14 w-10 rounded bg-secondary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{series.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="uppercase">{series.type}</Badge>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {series.view_count.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Most Active Readers (Last 7 Days)
              </CardTitle>
              <CardDescription>Users with the most reading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeUsers.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
                {(activeUsers.data || []).map((user: any, idx: number) => (
                  <div key={user.user_id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        {user.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{user.username}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {user.session_count} chapters read
                        </span>
                        {user.reading_streak > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-600" />
                            {user.reading_streak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Popular Genres (Tags) */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Most Used Genres
              </CardTitle>
              <CardDescription>Popular genres and categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTags.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
                {(popularTags.data || []).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="gap-1 px-3 py-1.5 text-sm"
                    style={{ 
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                  >
                    {tag.icon && <span>{tag.icon}</span>}
                    {tag.name}
                    <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                      {tag.usage_count}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Uploads */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recently Uploaded Chapters
              </CardTitle>
              <CardDescription>Latest content additions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentChapters.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                )}
                {(recentChapters.data || []).map((chapter: any) => (
                  <div key={chapter.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{chapter.series?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Chapter {chapter.chapter_number}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
