import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag as TagIcon, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/tags")({
  head: () => ({ meta: [{ title: "Browse Tags — 0Verse" }] }),
  component: TagsPage,
});

function TagsPage() {
  const tags = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const trendingTags = useQuery({
    queryKey: ["tags", "trending"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_tags", { limit_count: 10 });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <TagIcon className="h-8 w-8 text-violet-600" />
            <h1 className="text-3xl font-bold">Browse by Tags</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Discover titles by genre, theme, and category
          </p>
        </div>

        {/* Trending Tags */}
        {trendingTags.data && trendingTags.data.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Trending This Month
            </h2>
            <div className="flex flex-wrap gap-3">
              {trendingTags.data.map((tag: any) => (
                <Link
                  key={tag.tag_id}
                  to="/tags/$slug"
                  params={{ slug: tag.tag_slug }}
                  className="transition-transform hover:scale-105"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer gap-1 px-4 py-2 text-base"
                    style={{
                      borderColor: tag.tag_color,
                      backgroundColor: `${tag.tag_color}15`,
                      color: tag.tag_color,
                    }}
                  >
                    {tag.tag_name}
                    <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-xs">
                      {tag.usage_count}
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Tags */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">All Tags</h2>
          {tags.isLoading && (
            <p className="text-muted-foreground">Loading tags...</p>
          )}
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(tags.data || []).map((tag) => (
              <Link
                key={tag.id}
                to="/tags/$slug"
                params={{ slug: tag.slug }}
              >
                <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tag.icon && <span className="text-2xl">{tag.icon}</span>}
                        <h3 className="font-semibold" style={{ color: tag.color }}>
                          {tag.name}
                        </h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.usage_count}
                      </Badge>
                    </div>
                    {tag.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tag.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
