import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, BookOpen, Calendar, User, UserPlus, UserCheck, Users, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/title/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — ShadowShelf` }],
  }),
  component: SeriesDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Series not found</h1>
      <Link to="/browse" className="text-primary">Back to browse</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      Couldn't load this series: {error.message}
    </div>
  ),
});

function SeriesDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  
  // Chapter filtering and ordering state
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all");
  const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const seriesQ = useQuery({
    queryKey: ["series", "detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*,series_genres(genre:genres(id,name,slug))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const chaptersQ = useQuery({
    queryKey: ["chapters", slug, selectedGroup, sortOrder],
    queryFn: async () => {
      if (!seriesQ.data) return [];
      
      let query = supabase
        .from("chapters")
        .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at,uploaded_by,scanlation_group")
        .eq("series_id", seriesQ.data.id)
        .eq("status", "published");
      
      // Filter by scanlation group if selected
      if (selectedGroup !== "all") {
        query = query.eq("scanlation_group", selectedGroup);
      }
      
      // Order by chapter number
      query = query.order("chapter_number", { ascending: sortOrder === "asc" });
      
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).filter((c) => !c.scheduled_at || new Date(c.scheduled_at) <= new Date());
    },
    enabled: !!seriesQ.data,
  });
  
  // Filter chapters by search query (client-side)
  const filteredChapters = React.useMemo(() => {
    if (!chaptersQ.data) return [];
    if (!searchQuery.trim()) return chaptersQ.data;
    
    const query = searchQuery.toLowerCase();
    return chaptersQ.data.filter((c) => {
      const chapterNum = c.chapter_number?.toString() || "";
      const chapterTitle = c.title?.toLowerCase() || "";
      const uploader = ((c as any).uploaded_by || "").toLowerCase();
      const group = ((c as any).scanlation_group || "").toLowerCase();
      
      return (
        chapterNum.includes(query) ||
        chapterTitle.includes(query) ||
        uploader.includes(query) ||
        group.includes(query)
      );
    });
  }, [chaptersQ.data, searchQuery]);
  
  // Get unique scanlation groups for filtering
  const scanlationGroups = useQuery({
    queryKey: ["scanlation-groups", slug],
    queryFn: async () => {
      if (!seriesQ.data) return [];
      const { data, error } = await supabase
        .from("chapters")
        .select("scanlation_group")
        .eq("series_id", seriesQ.data.id)
        .eq("status", "published")
        .not("scanlation_group", "is", null);
      
      if (error) throw error;
      
      // Get unique groups
      const uniqueGroups = [...new Set(data?.map(c => c.scanlation_group).filter(Boolean) ?? [])];
      return uniqueGroups.sort();
    },
    enabled: !!seriesQ.data,
  });

  // Count followers
  const followersCount = useQuery({
    queryKey: ["followers-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const { count, error } = await supabase
        .from("user_library")
        .select("*", { count: "exact", head: true })
        .eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data,
  });

  // Check if user is following (has entry in user_library)
  const isFollowing = useQuery({
    queryKey: ["following", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return false;
      const { data } = await supabase
        .from("user_library")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!seriesQ.data,
  });

  const myRating = useQuery({
    queryKey: ["rating", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .maybeSingle();
      return data?.rating ?? null;
    },
    enabled: !!user && !!seriesQ.data,
  });

  const libraryStatus = useQuery({
    queryKey: ["library-status", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const { data } = await supabase
        .from("user_library")
        .select("reading_status")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .maybeSingle();
      return data?.reading_status ?? null;
    },
    enabled: !!user && !!seriesQ.data,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !seriesQ.data) throw new Error("Sign in to follow");
      if (isFollowing.data) {
        // Unfollow: remove from user_library
        await supabase.from("user_library").delete().eq("user_id", user.id).eq("series_id", seriesQ.data.id);
      } else {
        // Follow: add to user_library with default status "reading"
        await supabase.from("user_library").insert({ 
          user_id: user.id, 
          series_id: seriesQ.data.id,
          reading_status: "reading"
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["following", slug] });
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["followers-count", slug] });
      toast.success(isFollowing.data ? "Unfollowed" : "Following");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rate = useMutation({
    mutationFn: async (rating: number) => {
      if (!user || !seriesQ.data) throw new Error("Sign in to rate");
      const { error } = await supabase
        .from("ratings")
        .upsert({ user_id: user.id, series_id: seriesQ.data.id, rating }, { onConflict: "user_id,series_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rating", slug] });
      qc.invalidateQueries({ queryKey: ["series", "detail", slug] });
      toast.success("Rating saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Get series rank based on popularity/rating
  const seriesRank = useQuery({
    queryKey: ["series-rank", slug],
    queryFn: async () => {
      if (!seriesQ.data) return null;
      
      // Get all series ordered by view count (popularity)
      const { data, error } = await supabase
        .from("series")
        .select("id")
        .order("view_count", { ascending: false });
      
      if (error) throw error;
      
      // Find current series position
      const rank = data?.findIndex((s) => s.id === seriesQ.data.id);
      return rank !== undefined && rank >= 0 ? rank + 1 : null;
    },
    enabled: !!seriesQ.data,
  });

  // Get reading history to find last read chapter and all read chapters
  const readingHistory = useQuery({
    queryKey: ["reading-history", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return null;
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_id,chapters(slug,chapter_number)")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!seriesQ.data,
  });

  // Get all read chapters for the user
  const readChapters = useQuery({
    queryKey: ["read-chapters", slug, user?.id],
    queryFn: async () => {
      if (!user || !seriesQ.data) return new Set();
      const { data } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id);
      return new Set(data?.map((r) => r.chapter_id) ?? []);
    },
    enabled: !!user && !!seriesQ.data,
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!user || !seriesQ.data) throw new Error("Sign in to set status");
      const { error } = await supabase
        .from("user_library")
        .update({ 
          reading_status: status,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("series_id", seriesQ.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-status", slug] });
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (seriesQ.isLoading) {
    return <div className="container mx-auto px-4 py-12"><div className="h-96 animate-pulse rounded-lg bg-secondary" /></div>;
  }
  if (!seriesQ.data) return null;
  const s = seriesQ.data;

  const lastReadChapter = readingHistory.data?.chapters as
    | { slug: string; chapter_number: number }
    | null
    | undefined;
  const firstChapter = chaptersQ.data?.[chaptersQ.data.length - 1];
  const isContinue = libraryStatus.data === "reading" && lastReadChapter;
  const readChapterSlug = isContinue
    ? lastReadChapter.slug
    : firstChapter?.slug;
  const readChapterNumber = isContinue
    ? lastReadChapter.chapter_number
    : firstChapter?.chapter_number;
  const readButtonLabel = isContinue ? "Continue" : "Start reading";
  const readButtonText =
    readChapterNumber != null
      ? `${readButtonLabel} · Ch. ${readChapterNumber}`
      : readButtonLabel;

  return (
    <div>
      <div className="relative">
        {s.cover_url && (
          <div className="absolute inset-0 h-72 overflow-hidden -z-10">
            <img src={s.cover_url} alt="" className="h-full w-full object-cover opacity-20 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
        )}
        <div className="container mx-auto px-4 pt-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="mx-auto w-44 shrink-0 md:mx-0">
              <div className="aspect-[2/3] overflow-hidden rounded-lg border border-border/50 bg-secondary shadow-2xl">
                {s.cover_url ? (
                  <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><BookOpen /></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-3">
                {seriesRank.data && (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xl font-bold text-white shadow-lg">
                    #{seriesRank.data}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="uppercase">{s.type}</Badge>
                    <Badge variant="outline">{s.status}</Badge>
                    {s.release_year && <Badge variant="outline">{s.release_year}</Badge>}
                  </div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{s.title}</h1>
                  {s.alternative_titles && <p className="mt-1 text-sm text-muted-foreground">{s.alternative_titles}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {s.author && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{s.author}</span>}
                {s.artist && s.artist !== s.author && <span>Artist: {s.artist}</span>}
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{Number(s.rating_average || 0).toFixed(2)}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{followersCount.data?.toLocaleString() ?? 0} followers</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(s.series_genres as any[])?.map((sg) =>
                  sg.genre ? (
                    <Link key={sg.genre.id} to="/browse" search={{ genre: sg.genre.slug }}>
                      <Badge variant="secondary" className="hover:bg-primary/20">{sg.genre.name}</Badge>
                    </Link>
                  ) : null
                )}
              </div>
              {s.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{s.description}</p>}

              <div className="mt-6 flex flex-wrap gap-2">
                {/* Show Follow button first if not following */}
                {user && !isFollowing.data && (
                  <Button
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={() => toggleFollow.mutate()}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Follow
                  </Button>
                )}

                {/* Show reading button if following */}
                {user && isFollowing.data && chaptersQ.data && chaptersQ.data.length > 0 && readChapterSlug && (
                  <Link 
                    to="/title/$titleSlug/$chapterSlug" 
                    params={{ 
                      titleSlug: slug,
                      chapterSlug: readChapterSlug,
                    }}
                  >
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {readButtonText}
                    </Button>
                  </Link>
                )}

                {/* Show status selector only if following */}
                {user && isFollowing.data && (
                  <>
                    <Select 
                      value={libraryStatus.data ?? "reading"} 
                      onValueChange={(v) => setStatus.mutate(v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Set Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="plan_to_read">Plan to Read</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => toggleFollow.mutate()}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Following
                    </Button>
                  </>
                )}

                {/* Guest users */}
                {!user && firstChapter && (
                  <Link to="/title/$titleSlug/$chapterSlug" params={{ titleSlug: slug, chapterSlug: firstChapter.slug }}>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {firstChapter.chapter_number != null
                        ? `Start reading · Ch. ${firstChapter.chapter_number}`
                        : "Start reading"}
                    </Button>
                  </Link>
                )}
              </div>

              {user && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Your rating:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => rate.mutate(n)} aria-label={`Rate ${n}`}>
                      <Star className={`h-5 w-5 transition ${(myRating.data ?? 0) >= n ? "fill-accent text-accent" : "text-muted-foreground hover:text-accent"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Calendar className="h-5 w-5 text-primary" />
              Chapters
            </h2>
            
            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-2">
              {/* Scanlation Group Filter */}
              {scanlationGroups.data && scanlationGroups.data.length > 0 && (
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {scanlationGroups.data.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search chapters by number, title, uploader, or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {chaptersQ.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-secondary/50" />)}</div>
        ) : !filteredChapters || filteredChapters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground">
            {searchQuery ? (
              <>No chapters found matching "{searchQuery}"</>
            ) : selectedGroup !== "all" ? (
              <>No chapters from {selectedGroup}. Try selecting "All Groups".</>
            ) : (
              <>No chapters yet. Check back soon.</>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/40 bg-card">
            <table className="w-full">
              <thead className="border-b border-border/40 bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Chapter</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold hidden md:table-cell">Uploaded By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold hidden md:table-cell">Group</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Upload Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold hidden sm:table-cell">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredChapters.map((c) => {
                  const isRead = readChapters.data?.has(c.id) ?? false;
                  const isNew = new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  const showNewBadge = isNew && !isRead;
                  
                  return (
                    <tr key={c.id} className="transition hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link
                          to="/title/$titleSlug/$chapterSlug"
                          params={{ titleSlug: slug, chapterSlug: c.slug }}
                          className="flex items-center gap-2"
                        >
                          <div className={`font-medium ${isRead ? "" : ""}`} style={isRead ? { color: "#7f22fe" } : {}}>
                            Chapter {c.chapter_number}{c.title ? ` — ${c.title}` : ""}
                          </div>
                          {showNewBadge && (
                            <Badge className="bg-violet-600 hover:bg-violet-700 text-white uppercase text-xs">
                              NEW
                            </Badge>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {(c as any).uploaded_by || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {(c as any).scanlation_group ? (
                          <span className="text-sm font-medium text-violet-600">
                            {(c as any).scanlation_group}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <Badge variant="outline" className="uppercase text-xs">
                          {c.chapter_type === "novel" ? "Novel" : "Pages"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <RecommendationsSection currentSeriesId={s.id} genres={s.series_genres as any[]} />
    </div>
  );
}

// Recommendations Component
function RecommendationsSection({ currentSeriesId, genres }: { currentSeriesId: string; genres: any[] }) {
  const genreSlugs = genres?.map((sg) => sg.genre?.slug).filter(Boolean) || [];
  
  const recommendations = useQuery({
    queryKey: ["recommendations", currentSeriesId],
    queryFn: async () => {
      // Get titles with similar genres
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,series_genres(genre:genres(slug))")
        .neq("id", currentSeriesId)
        .order("rating_average", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Filter and score by genre similarity
      const scored = (data || []).map((title: any) => {
        const titleGenres = title.series_genres?.map((sg: any) => sg.genre?.slug).filter(Boolean) || [];
        const commonGenres = titleGenres.filter((g: string) => genreSlugs.includes(g));
        return {
          ...title,
          score: commonGenres.length,
        };
      });
      
      // Sort by score and return top 12
      return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score || (b.rating_average || 0) - (a.rating_average || 0))
        .slice(0, 12);
    },
  });

  if (recommendations.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-4 text-xl font-bold">Similar Titles</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations.data || recommendations.data.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="mb-4 text-xl font-bold">Similar Titles · Recommendations</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {recommendations.data.map((title: any) => (
          <Link
            key={title.id}
            to="/title/$slug"
            params={{ slug: title.slug }}
            className="group block overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
              {title.cover_url ? (
                <img
                  src={title.cover_url}
                  alt={title.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <BookOpen className="h-10 w-10" />
                </div>
              )}
              <div className="absolute left-2 top-2">
                <Badge variant="secondary" className="bg-background/80 text-xs uppercase backdrop-blur">
                  {title.type}
                </Badge>
              </div>
              {title.rating_average && Number(title.rating_average) > 0 ? (
                <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {Number(title.rating_average).toFixed(1)}
                </div>
              ) : null}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
                {title.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}