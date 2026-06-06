import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon, Layers, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/tags")({
  head: () => ({ 
    meta: [
      { title: "Browse Genres & Tags — vnrscans" },
      { name: "description", content: "Explore titles on vnrscans by genre, theme, or descriptive tags" }
    ] 
  }),
  component: TagsPage,
});

function TagsPage() {
  // Fetch genres (main taxonomies)
  const genres = useQuery({
    queryKey: ["genres-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genres")
        .select("*, series_genres(count)")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tags (descriptive keyword taxonomies)
  const tags = useQuery({
    queryKey: ["tags-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 relative">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5">
              <TagIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Genres & Tags</h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Discover your next read by category, story theme, and descriptive keywords
              </p>
            </div>
          </div>
        </div>

        {/* 1. Genres Section (Main Categories) */}
        <section className="mb-12">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Layers className="h-5 w-5 text-primary" />
            Story Genres
          </h2>
          {genres.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-card/45 border border-border/40" />
              ))}
            </div>
          ) : (genres.data || []).length === 0 ? (
            <Card className="p-8 text-center border-border/40 bg-card/40 backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">No genres available yet.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(genres.data || []).map((genre: any) => {
                const count = genre.series_genres?.[0]?.count ?? 0;
                return (
                  <Link
                    key={genre.id}
                    to="/browse"
                    search={{ genre: genre.slug }}
                    className="group"
                  >
                    <Card className="h-full border-border/30 bg-card/35 transition-all duration-300 hover:border-primary/50 hover:bg-card/65 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-bold group-hover:text-primary transition-colors">
                          {genre.name}
                        </span>
                        {count > 0 && (
                          <Badge variant="secondary" className="text-3xs font-semibold px-2 py-0.5">
                            {count} titles
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Descriptive Tags Section */}
        <section>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Sparkles className="h-5 w-5 text-accent" />
            Descriptive Tags
          </h2>
          {tags.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-card/45 border border-border/40" />
              ))}
            </div>
          ) : (tags.data || []).length === 0 ? (
            <Card className="p-8 text-center border-border/40 bg-card/40 backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">No descriptive tags created yet.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(tags.data || []).map((tag) => (
                <Link
                  key={tag.id}
                  to="/tags/$slug"
                  params={{ slug: tag.slug }}
                >
                  <Card className="group h-full border-border/30 bg-card/35 transition-all duration-300 hover:border-primary/50 hover:bg-card/65 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-2px]">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {tag.icon && <span className="text-xl">{tag.icon}</span>}
                            <h3 className="font-bold transition-colors group-hover:text-primary" style={{ color: tag.color }}>
                              {tag.name}
                            </h3>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-3xs font-semibold px-2 py-0.5 border-border/50"
                            style={{
                              borderColor: tag.color,
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                            }}
                          >
                            {tag.usage_count}
                          </Badge>
                        </div>
                        {tag.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
