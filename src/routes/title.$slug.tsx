import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, BookOpen, UserPlus, UserCheck, Users, ArrowUpDown, Search, Trophy, Flag, History, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
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
import { useDragScroll, DRAG_SCROLL_CONTAINER_CLASS } from "@/hooks/useDragScroll";
import { TITLE_CARD_WIDTH, TITLE_COVER_CLASS } from "@/components/titleCardStyles";

export const Route = createFileRoute("/title/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — vnrscans` }],
  }),
  component: SeriesDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-8 py-16 text-center">
      <h1 className="text-2xl font-bold">Series not found</h1>
      <Link to="/browse" className="text-primary">Back to browse</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-8 py-16 text-center text-muted-foreground">
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
        .select("*,series_genres(genre:genres(id,name,slug)),series_tags(tag:tags(id,name,slug,color,icon))")
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

      if (selectedGroup !== "all") {
        query = query.eq("scanlation_group", selectedGroup);
      }

      query = query.order("chapter_number", { ascending: sortOrder === "asc" });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).filter((c) => !c.scheduled_at || new Date(c.scheduled_at) <= new Date());
    },
    enabled: !!seriesQ.data,
  });

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

  // Calculate unique chapter count (base chapters only, ignoring .1, .2 variants)
  const uniqueChapterCount = React.useMemo(() => {
    if (!chaptersQ.data) return 0;
    const uniqueChapters = new Set(
      chaptersQ.data.map((ch) => Math.floor(ch.chapter_number))
    );
    return uniqueChapters.size;
  }, [chaptersQ.data]);

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

      const uniqueGroups = [...new Set(data?.map((c) => c.scanlation_group).filter(Boolean) ?? [])];
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

  const ratingsCount = useQuery({
    queryKey: ["ratings-count", slug],
    queryFn: async () => {
      if (!seriesQ.data) return 0;
      const { count, error } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true })
        .eq("series_id", seriesQ.data.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!seriesQ.data,
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
    return <div className="container mx-auto px-8 py-12"><div className="h-96 animate-pulse rounded-lg bg-secondary" /></div>;
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
  const readButtonLabel = isContinue ? "Resume" : "Start reading";
  const readButtonText =
    readChapterNumber != null
      ? `${readButtonLabel} Ch. ${readChapterNumber}`
      : readButtonLabel;

  const genres = ((s.series_genres as any[]) ?? [])
    .map((sg) => sg.genre)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;
  const tags = ((s.series_tags as any[]) ?? [])
    .map((st: any) => st.tag)
    .filter(Boolean) as Array<{ id: string; name: string; slug: string; color: string; icon: string }>;
  const authors = splitNames(s.author);
  const artists = splitNames(s.artist);
  const contentRating = (s as { content_rating?: string }).content_rating;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background cover image */}
      {s.cover_url && (
        <div className="absolute top-0 left-0 w-full h-[480px] pointer-events-none overflow-hidden z-0 select-none">
          <img
            src={s.cover_url}
            alt=""
            className="w-full h-full object-cover opacity-[0.22] saturate-[1.1] scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        </div>
      )}

      {/* Background glow in other areas */}
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-6 lg:py-8 relative z-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Left sidebar — cover & actions */}
          <aside className="mx-auto w-full max-w-[220px] shrink-0 lg:mx-0">
            <div className="overflow-hidden rounded-xl border border-border/40 bg-secondary shadow-2xl transition-all duration-300 hover:border-primary/30">
              {s.cover_url ? (
                <img src={s.cover_url} alt={s.title} className="aspect-[2/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-muted-foreground">
                  <BookOpen className="h-12 w-12" />
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {chaptersQ.data && chaptersQ.data.length > 0 && readChapterSlug && (
                <Link
                  to="/title/$titleSlug/$chapterSlug"
                  params={{ titleSlug: slug, chapterSlug: readChapterSlug }}
                  className="block"
                >
                  <Button className="h-11 w-full bg-primary text-base font-semibold hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {readButtonText}
                  </Button>
                </Link>
              )}

              {user && !isFollowing.data && (
                <Button
                  className="h-11 w-full bg-primary/90 font-semibold hover:bg-primary text-primary-foreground"
                  onClick={() => toggleFollow.mutate()}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow
                </Button>
              )}

              {user && isFollowing.data && (
                <Select
                  value={libraryStatus.data ?? "reading"}
                  onValueChange={(v) => setStatus.mutate(v)}
                >
                  <SelectTrigger className="h-11 w-full border-primary/40 bg-primary/10 font-semibold text-primary">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      <SelectValue placeholder="Reading" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="plan_to_read">Plan to Read</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {user && isFollowing.data && (
                <Button
                  variant="outline"
                  className="h-10 w-full border-border/60"
                  onClick={() => toggleFollow.mutate()}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Following
                </Button>
              )}
            </div>

            {user && (
              <div className="mt-5 flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => rate.mutate(n)} aria-label={`Rate ${n}`}>
                    <Star
                      className={`h-5 w-5 transition duration-200 ${
                        (myRating.data ?? 0) >= n
                          ? "fill-primary text-primary filter drop-shadow-[0_0_4px_rgba(236,72,153,0.2)]"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Right — metadata */}
          <main className="min-w-0 flex-1">
            <nav className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <Link to="/home" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link to="/browse" search={{ type: s.type }} className="hover:text-primary transition-colors">
                {s.type}
              </Link>
            </nav>

            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="rounded-md uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5 bg-secondary/50">
                {s.type}
              </Badge>
              {contentRating && (
                <Badge
                  className={`rounded-md uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5 ${
                    contentRating === "safe"
                      ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      : contentRating === "suggestive"
                        ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                        : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  }`}
                >
                  {contentRating}
                </Badge>
              )}
              {s.release_year && (
                <Badge variant="outline" className="rounded-md text-[10px] font-semibold px-2 py-0.5 border-border/50">
                  {s.release_year}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 rounded-md capitalize text-[10px] font-semibold px-2 py-0.5 border-border/50">
                {s.status === "ongoing" && (
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {statusLabel(s.status)}
              </Badge>
            </div>

            <h1 className="text-3xl font-black tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-tight text-foreground">
              {s.title}
            </h1>

            {s.alternative_titles && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">{s.alternative_titles}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {seriesRank.data && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 font-semibold text-primary shadow-sm shadow-primary/5">
                  <Trophy className="h-4 w-4" />
                  #{seriesRank.data.toLocaleString()}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-bold text-foreground">
                  {Number(s.rating_average || 0).toFixed(1)}
                </span>
                by {ratingsCount.data?.toLocaleString() ?? 0} users
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-semibold text-foreground">
                  {followersCount.data?.toLocaleString() ?? 0}
                </span>{" "}
                followed
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{Number(s.view_count || 0).toLocaleString()}</span> views
              </span>
            </div>

            {s.description && (
              <div className="mt-5 max-w-3xl">
                <ExpandableSynopsis text={s.description} />
              </div>
            )}

            {genres.length > 0 && (
              <MetaSection label="Genres">
                {genres.map((genre) => (
                  <MetaPill key={genre.id} href="/browse" search={{ genre: genre.slug }}>
                    {genre.name}
                  </MetaPill>
                ))}
              </MetaSection>
            )}

            {tags.length > 0 && (
              <MetaSection label="Tags">
                {tags.map((tag) => (
                  <MetaPill key={tag.id} href="/browse" search={{ tag: tag.slug }}>
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                  </MetaPill>
                ))}
              </MetaSection>
            )}

            {authors.length > 0 && (
              <MetaSection label="Authors">
                {authors.map((name) => (
                  <MetaPill key={name}>{name}</MetaPill>
                ))}
              </MetaSection>
            )}

            {artists.length > 0 && (
              <MetaSection label="Artists">
                {artists.map((name) => (
                  <MetaPill key={name}>{name}</MetaPill>
                ))}
              </MetaSection>
            )}

            <MetaSection label="Info">
              <MetaPill>Updated {new Date(s.updated_at).toLocaleDateString()}</MetaPill>
              {uniqueChapterCount > 0 && (
                <button
                  onClick={() => {
                    const chaptersSection = document.getElementById('chapters-section');
                    chaptersSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {uniqueChapterCount} chapters
                </button>
              )}
              <MetaPill className="capitalize">{s.type}</MetaPill>
            </MetaSection>
          </main>
        </div>

        {/* Chapters + Recommendations */}
        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_340px]">
          <section id="chapters-section">
            <div className="mb-4 flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold">
                  Chapters {uniqueChapterCount > 0 && <span className="text-muted-foreground">({uniqueChapterCount})</span>}
                </h2>

                <div className="flex flex-wrap gap-2">
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                  </Button>
                </div>
              </div>

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
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-secondary/50" />
                ))}
              </div>
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
                      <th className="hidden px-4 py-3 text-left text-sm font-semibold md:table-cell">Uploaded By</th>
                      <th className="hidden px-4 py-3 text-left text-sm font-semibold md:table-cell">Group</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Upload Date</th>
                      <th className="hidden px-4 py-3 text-right text-sm font-semibold sm:table-cell">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredChapters.map((c) => {
                      const isRead = readChapters.data?.has(c.id) ?? false;
                      const isNew = new Date(c.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000);
                      const showNewBadge = isNew && !isRead;

                      return (
                        <tr key={c.id} className="transition hover:bg-secondary/40">
                          <td className="px-4 py-3">
                            <Link
                              to="/title/$titleSlug/$chapterSlug"
                              params={{ titleSlug: slug, chapterSlug: c.slug }}
                              className="flex items-center gap-2"
                            >
                              <span className="font-medium" style={isRead ? { color: "#7f22fe" } : undefined}>
                                Chapter {c.chapter_number}
                                {c.title ? ` — ${c.title}` : ""}
                              </span>
                              {showNewBadge && (
                                <Badge className="bg-violet-600 text-xs uppercase text-white hover:bg-violet-700">
                                  NEW
                                </Badge>
                              )}
                            </Link>
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {(c as { uploaded_by?: string }).uploaded_by || "—"}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            {(c as { scanlation_group?: string }).scanlation_group ? (
                              <span className="text-sm font-medium text-violet-600">
                                {(c as { scanlation_group?: string }).scanlation_group}
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
                          <td className="hidden px-4 py-3 text-right sm:table-cell">
                            <Badge variant="outline" className="text-xs uppercase">
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
          </section>

          <RecommendationsSidebar currentSeriesId={s.id} genres={s.series_genres as any[]} />
        </div>
      </div>
    </div>
  );
}

// Recommendations sidebar carousel
function RecommendationsSidebar({ currentSeriesId, genres }: { currentSeriesId: string; genres: any[] }) {
  const genreSlugs = genres?.map((sg) => sg.genre?.slug).filter(Boolean) || [];
  const { scrollRef, scrollBy, dragHandlers } = useDragScroll<HTMLDivElement>();

  const recommendations = useQuery({
    queryKey: ["recommendations", currentSeriesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status,series_genres(genre:genres(slug))")
        .neq("id", currentSeriesId)
        .order("rating_average", { ascending: false })
        .limit(50);

      if (error) throw error;

      const scored = (data || []).map((title: any) => {
        const titleGenres = title.series_genres?.map((sg: any) => sg.genre?.slug).filter(Boolean) || [];
        const commonGenres = titleGenres.filter((g: string) => genreSlugs.includes(g));
        return { ...title, score: commonGenres.length };
      });

      return scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || (b.rating_average || 0) - (a.rating_average || 0))
        .slice(0, 12);
    },
  });

  return (
    <aside className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recommendations</h2>
        {(recommendations.data?.length ?? 0) > 0 && (
          <div className="hidden gap-1 md:flex">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollBy("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {recommendations.isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${TITLE_CARD_WIDTH} shrink-0`}>
              <div className={`${TITLE_COVER_CLASS} animate-pulse bg-secondary`} />
            </div>
          ))}
        </div>
      ) : !recommendations.data || recommendations.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No similar titles found.</p>
      ) : (
        <div
          ref={scrollRef}
          {...dragHandlers}
          className={DRAG_SCROLL_CONTAINER_CLASS}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recommendations.data.map((title: any) => (
            <Link
              key={title.id}
              to="/title/$slug"
              params={{ slug: title.slug }}
              className={`group ${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg`}
            >
              <div className={TITLE_COVER_CLASS}>
                {title.cover_url ? (
                  <img
                    src={title.cover_url}
                    alt={title.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
                {title.rating_average && Number(title.rating_average) > 0 ? (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
                    <Star className="h-3 w-3 fill-violet-500 text-violet-500" />
                    {Number(title.rating_average).toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-2 text-xs font-semibold leading-tight group-hover:text-violet-400">
                  {title.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

function MetaSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function MetaPill({
  children,
  href,
  search,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  search?: Record<string, string>;
  className?: string;
}) {
  const pillClass = `inline-flex rounded-md bg-secondary/70 px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary ${className}`;

  if (href) {
    return (
      <Link to={href} search={search} className={pillClass}>
        {children}
      </Link>
    );
  }

  return <span className={pillClass}>{children}</span>;
}

function ExpandableSynopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {expanded || !isLong ? text : `${text.slice(0, 320).trim()}…`}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1 font-medium text-violet-400 hover:text-violet-300 hover:underline"
        >
          [{expanded ? "view less" : "view more"}]
        </button>
      )}
    </p>
  );
}

function splitNames(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function statusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "Releasing";
    case "completed":
      return "Completed";
    case "hiatus":
      return "Hiatus";
    default:
      return status;
  }
}
