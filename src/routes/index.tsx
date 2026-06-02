import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "0Verse — Discover Manhwa Stories" },
      { name: "description", content: "Follow your favorite manhwa series, track new chapters, and dive into worlds created by talented artists." },
      { property: "og:title", content: "0Verse" },
      { property: "og:description", content: "Discover manhwa stories drawn by imagination." },
    ],
  }),
  component: Home,
});

function Home() {
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { count: seriesCount } = await supabase.from("series").select("*", { count: "exact", head: true });
      const { count: chapterCount } = await supabase.from("chapters").select("*", { count: "exact", head: true });
      return {
        chapters: chapterCount || 0,
        series: seriesCount || 0,
        readers: 10845,
      };
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-violet-950/10 to-background py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        
        <div className="container relative mx-auto px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            <span className="text-sm font-medium text-violet-400">Welcome to 0Verse</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            DISCOVER STORIES
            <br />
            <span className="text-violet-600">
              DRAWN BY IMAGINATION
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Follow your favorite manhwa series, track new chapters, and dive into worlds created by talented artists. Free, fast, and without interruptions.
          </p>
          
          <div className="mt-8">
            <Link to="/browse">
              <Button size="lg" className="h-12 bg-violet-600 px-8 text-base font-semibold hover:bg-violet-700">
                Start Reading
              </Button>
            </Link>
          </div>

          {/* Stats Banner */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-violet-500/40">
              <div className="relative text-3xl font-bold text-violet-600">
                {stats.data?.chapters.toLocaleString() || "0"}
              </div>
              <div className="relative mt-1 text-sm text-muted-foreground">NEW CHAPTERS</div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-violet-500/40">
              <div className="relative text-3xl font-bold text-violet-600">
                {stats.data?.series.toLocaleString() || "0"}
              </div>
              <div className="relative mt-1 text-sm text-muted-foreground">MANHWA SERIES</div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-violet-500/40">
              <div className="relative text-3xl font-bold text-violet-600">
                {stats.data?.readers.toLocaleString()}
              </div>
              <div className="relative mt-1 text-sm text-muted-foreground">READERS</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
