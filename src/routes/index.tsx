import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShadowShelf — Read Manga, Manhwa, Manhua & Novels" },
      { name: "description", content: "Discover original, licensed manga, manhwa, manhua, and novels. Dark, fast, ad-free reader." },
      { property: "og:title", content: "ShadowShelf" },
      { property: "og:description", content: "Original & licensed manga, manhwa, manhua, and novels." },
    ],
  }),
  component: Home,
});

function useSeriesQuery(key: string, build: (q: ReturnType<typeof supabase.from<"series", any>>) => any) {
  return useQuery({
    queryKey: ["series", key],
    queryFn: async () => {
      const { data, error } = await build(supabase.from("series"));
      if (error) throw error;
      return data ?? [];
    },
  });
}

function Section({ title, icon: Icon, to, children }: { title: string; icon: any; to?: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h2>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const featured = useQuery({
    queryKey: ["series", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,description,status")
        .eq("is_featured", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const trending = useQuery({
    queryKey: ["series", "trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status")
        .order("view_count", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const latest = useQuery({
    queryKey: ["series", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status")
        .order("updated_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const popular = useQuery({
    queryKey: ["series", "popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title,cover_url,type,rating_average,status")
        .order("rating_average", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4">
      {/* Hero */}
      <section className="relative my-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-secondary/40 p-8 md:p-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.15),transparent_55%)]" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Original & licensed content only
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Step into the <span className="text-gradient">ShadowShelf</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Read manga, manhwa, manhua, and novels in a clean dark reader. Bookmark, rate, and pick up where you left off.
          </p>
          {featured.data && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border border-border/40 bg-background/60 p-4 backdrop-blur">
              {featured.data.cover_url && (
                <img src={featured.data.cover_url} alt={featured.data.title} className="h-20 w-14 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase text-muted-foreground">Featured</div>
                <div className="truncate font-semibold">{featured.data.title}</div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{featured.data.description}</p>
              </div>
              <Link to="/series/$slug" params={{ slug: featured.data.slug }}>
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Read</Button>
              </Link>
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Link to="/browse"><Button variant="default" className="bg-primary">Browse library</Button></Link>
            <Link to="/search"><Button variant="outline">Search titles</Button></Link>
          </div>
        </div>
      </section>

      <Section title="Trending now" icon={Flame} to="/browse">
        <SeriesGrid items={trending.data} loading={trending.isLoading} />
      </Section>
      <Section title="Latest updates" icon={Clock} to="/browse">
        <SeriesGrid items={latest.data} loading={latest.isLoading} />
      </Section>
      <Section title="Top rated" icon={TrendingUp} to="/browse">
        <SeriesGrid items={popular.data} loading={popular.isLoading} />
      </Section>
    </div>
  );
}
