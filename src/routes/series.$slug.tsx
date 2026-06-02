import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, BookOpen, Calendar, User, UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/series/$slug")({
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
    queryKey: ["chapters", slug],
    queryFn: async () => {
      if (!seriesQ.data) return [];
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,chapter_number,title,chapter_type,created_at,status,scheduled_at")
        .eq("series_id", seriesQ.data.id)
        .eq("status", "published")
        .order("chapter_number", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((c) => !c.scheduled_at || new Date(c.scheduled_at) <= new Date());
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

  // Get reading history to find last read chapter
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

  if (seriesQ.isLoading) {
    return <div className="container mx-auto px-4 py-12"><div className="h-96 animate-pulse rounded-lg bg-secondary" /></div>;
  }
  if (!seriesQ.data) return null;
  const s = seriesQ.data;

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
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="uppercase">{s.type}</Badge>
                <Badge variant="outline">{s.status}</Badge>
                {s.release_year && <Badge variant="outline">{s.release_year}</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{s.title}</h1>
              {s.alternative_titles && <p className="mt-1 text-sm text-muted-foreground">{s.alternative_titles}</p>}
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
                {user && isFollowing.data && chaptersQ.data && chaptersQ.data.length > 0 && (
                  <Link 
                    to="/series/$seriesSlug/$chapterSlug" 
                    params={{ 
                      seriesSlug: slug,
                      chapterSlug: libraryStatus.data === "reading" && readingHistory.data?.chapters?.slug
                        ? readingHistory.data.chapters.slug
                        : chaptersQ.data[chaptersQ.data.length - 1].slug 
                    }}
                  >
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {libraryStatus.data === "reading" && readingHistory.data?.chapters ? "Continue" : "Start reading"}
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
                {!user && chaptersQ.data && chaptersQ.data.length > 0 && (
                  <Link to="/series/$seriesSlug/$chapterSlug" params={{ seriesSlug: slug, chapterSlug: chaptersQ.data[chaptersQ.data.length - 1].slug }}>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <BookOpen className="mr-2 h-4 w-4" /> Start reading
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
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Calendar className="h-5 w-5 text-primary" />Chapters</h2>
        {chaptersQ.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-secondary/50" />)}</div>
        ) : !chaptersQ.data || chaptersQ.data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-sm text-muted-foreground">No chapters yet. Check back soon.</div>
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/40 bg-card/50">
            {chaptersQ.data.map((c) => (
              <Link
                key={c.id}
                to="/series/$seriesSlug/$chapterSlug"
                params={{ seriesSlug: slug, chapterSlug: c.slug }}
                className="flex items-center justify-between px-4 py-3 transition hover:bg-secondary/40"
              >
                <div>
                  <div className="font-medium">Chapter {c.chapter_number}{c.title ? ` — ${c.title}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <Badge variant="outline" className="uppercase">{c.chapter_type === "novel" ? "Novel" : "Pages"}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
