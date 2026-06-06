import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Home, List, Maximize, Minimize, Flag, Heart, Smile, ThumbsUp, Laugh, Star, MessageSquare, Play, Pause, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/title/$titleSlug/$chapterSlug")({
  head: ({ params }) => ({ meta: [{ title: `Read ${params.chapterSlug} — vnrscans` }] }),
  component: Reader,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-center text-muted-foreground">
      Couldn't open this chapter: {error.message}
    </div>
  ),
});

function Reader() {
  const { titleSlug, chapterSlug } = Route.useParams();
  const seriesSlug = titleSlug;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  // All state hooks must be at the top, before any conditional returns
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(2);
  const lastScrollYRef = useRef(0);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const chapterQ = useQuery({
    queryKey: ["chapter", titleSlug, chapterSlug],
    queryFn: async () => {
      console.log(`Loading chapter: titleSlug=${titleSlug}, chapterSlug=${chapterSlug}`);
      
      // First get the series to ensure it exists
      const { data: seriesData, error: seriesError } = await supabase
        .from("series")
        .select("id, slug, title, type")
        .eq("slug", titleSlug)
        .single();
      
      if (seriesError) {
        console.error(`Series error for slug ${titleSlug}:`, seriesError);
        throw seriesError;
      }
      if (!seriesData) {
        console.error(`No series found for slug: ${titleSlug}`);
        throw new Error(`Series "${titleSlug}" not found`);
      }

      console.log(`Found series: ${seriesData.title} (ID: ${seriesData.id})`);

      // Then get the chapter that belongs to this series
      const { data, error } = await supabase
        .from("chapters")
        .select("*, series:series(id,slug,title,type)")
        .eq("slug", chapterSlug)
        .eq("series_id", seriesData.id)
        .maybeSingle();
      
      if (error) {
        console.error(`Chapter error for slug ${chapterSlug} in series ${seriesData.id}:`, error);
        throw error;
      }
      
      if (!data) {
        console.error(`No chapter found: chapterSlug=${chapterSlug}, seriesId=${seriesData.id}`);
        throw new Error(`Chapter "${chapterSlug}" not found in series "${seriesData.title}"`);
      }

      console.log(`Found chapter: Ch.${data.chapter_number} in ${data.series?.title} (Chapter ID: ${data.id})`);
      return data;
    },
  });

  const pagesQ = useQuery({
    queryKey: ["pages", chapterQ.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_pages")
        .select("id,page_number,image_url")
        .eq("chapter_id", chapterQ.data!.id)
        .order("page_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data && chapterQ.data.chapter_type === "image",
  });

  const activeScanlationGroup = chapterQ.data?.scanlation_group ?? null;

  const siblingsQ = useQuery({
    queryKey: ["chapter-siblings", chapterQ.data?.series?.id, activeScanlationGroup],
    queryFn: async () => {
      console.log(`Loading siblings for series ID: ${chapterQ.data!.series!.id}`);
      let query = supabase
        .from("chapters")
        .select("id,slug,chapter_number,scanlation_group")
        .eq("series_id", chapterQ.data!.series!.id)
        .eq("status", "published");

      if (activeScanlationGroup) {
        query = query.eq("scanlation_group", activeScanlationGroup);
      } else {
        query = query.is("scanlation_group", null);
      }

      const { data, error } = await query.order("chapter_number");
      if (error) {
        console.error("Siblings query error:", error);
        throw error;
      }
      console.log(`Found ${data?.length || 0} sibling chapters`);
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series?.id,
  });

  const alternateGroupsQ = useQuery({
    queryKey: [
      "chapter-alternate-groups",
      chapterQ.data?.series_id,
      chapterQ.data?.chapter_number,
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,scanlation_group,chapter_number")
        .eq("series_id", chapterQ.data!.series_id)
        .eq("chapter_number", chapterQ.data!.chapter_number)
        .eq("status", "published")
        .order("scanlation_group", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series_id && chapterQ.data?.chapter_number != null,
  });

  // Save reading history with scroll progress
  useEffect(() => {
    if (!user || !chapterQ.data) return;
    
    // Save initial reading history entry
    supabase.from("reading_history").upsert(
      {
        user_id: user.id,
        series_id: chapterQ.data.series_id,
        chapter_id: chapterQ.data.id,
        progress: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,chapter_id" } as any
    ).then(() => {});

    // Update reading progress based on scroll position
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(Math.round((scrollTop / scrollHeight) * 100), 100) : 0;
      
      // Only update if progress has changed significantly (every 5%)
      const lastProgress = parseInt(localStorage.getItem(`chapter-progress-${chapterQ.data.id}`) || '0');
      if (Math.abs(progress - lastProgress) >= 5) {
        localStorage.setItem(`chapter-progress-${chapterQ.data.id}`, progress.toString());
        supabase.from("reading_history").upsert(
          {
            user_id: user.id,
            series_id: chapterQ.data.series_id,
            chapter_id: chapterQ.data.id,
            progress: progress,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,chapter_id" } as any
        ).then(() => {});
      }
    };

    let progressTimeout: NodeJS.Timeout;
    const handleProgressUpdate = () => {
      clearTimeout(progressTimeout);
      progressTimeout = setTimeout(updateProgress, 500);
    };

    window.addEventListener('scroll', handleProgressUpdate);

    return () => {
      clearTimeout(progressTimeout);
      window.removeEventListener('scroll', handleProgressUpdate);
      // Final progress update when leaving
      updateProgress();
    };
  }, [user, chapterQ.data]);

  useEffect(() => {
    if (!chapterQ.data?.id) return;
    supabase.rpc("increment_chapter_view", { _chapter_id: chapterQ.data.id }).then(({ error }) => {
      if (error) {
        console.error("Failed to increment chapter view", error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["chapter", chapterSlug] });
    });
  }, [chapterQ.data?.id, chapterSlug, qc]);

  const idx = siblingsQ.data?.findIndex((c) => c.slug === chapterSlug) ?? -1;
  const prev = idx > 0 ? siblingsQ.data![idx - 1] : null;
  const next = idx >= 0 && siblingsQ.data && idx < siblingsQ.data.length - 1 ? siblingsQ.data[idx + 1] : null;

  // Prefetch next chapter when scroll progress is >= 50%
  const prefetchedNextRef = useRef<string | null>(null);
  useEffect(() => {
    if (!next || !chapterQ.data?.series?.id) return;
    
    // Check if we already prefetched this next chapter slug
    if (prefetchedNextRef.current === next.slug) return;

    const handleScrollPrefetch = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      if (progress >= 50) {
        prefetchedNextRef.current = next.slug;
        window.removeEventListener("scroll", handleScrollPrefetch);

        console.log(`Prefetching next chapter in background: ${next.slug}`);

        const nextChapterSlug = next.slug;
        const seriesData = chapterQ.data.series;

        // Prefetch next chapter metadata
        qc.prefetchQuery({
          queryKey: ["chapter", titleSlug, nextChapterSlug],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("chapters")
              .select("*, series:series(id,slug,title,type)")
              .eq("slug", nextChapterSlug)
              .eq("series_id", seriesData!.id)
              .maybeSingle();
            
            if (error) throw error;
            if (!data) throw new Error("Next chapter not found");
            
            // Side effect: also prefetch next chapter's pages if it is an image type!
            if (data.chapter_type === "image") {
              qc.prefetchQuery({
                queryKey: ["pages", data.id],
                queryFn: async () => {
                  const { data: pageData, error: pageError } = await supabase
                    .from("chapter_pages")
                    .select("id,page_number,image_url")
                    .eq("chapter_id", data.id)
                    .order("page_number");
                  if (pageError) throw pageError;
                  return pageData ?? [];
                }
              });
            }

            return data;
          }
        });
      }
    };

    window.addEventListener("scroll", handleScrollPrefetch, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollPrefetch);
    };
  }, [next, chapterQ.data, titleSlug, qc]);

  // Keyboard navigation (Arrow keys for PC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" && prev) {
        navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } });
      } else if (e.key === "ArrowRight" && next) {
        navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, navigate, seriesSlug]);

  // Keep reader controls in the last scroll direction state:
  // scrolling down hides them, scrolling up shows them and leaves them visible.
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollYRef.current;

          if (currentScrollY <= 8) {
            setControlsVisible(true);
            setShowScrollTop(false);
          } else if (showChapters || showSpeedControl) {
            setControlsVisible(true);
            setShowScrollTop(currentScrollY > 300);
          } else if (Math.abs(delta) > 8) {
            const isScrollingUp = delta < 0;

            if (isScrollingUp) {
              setControlsVisible(true);
            } else {
              setControlsVisible(false);
            }

            setShowScrollTop(currentScrollY > 300 && isScrollingUp);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    lastScrollYRef.current = window.scrollY;
    setControlsVisible(window.scrollY <= 8 || showChapters || showSpeedControl);
    setShowScrollTop(false);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showChapters, showSpeedControl]);

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
  };

  // Auto-scroll effect (mobile only)
  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    // Only enable on mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      setIsAutoScrolling(false);
      return;
    }

    // Start auto-scrolling
    autoScrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: autoScrollSpeed, behavior: 'auto' });
      
      // Stop if reached bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
        setIsAutoScrolling(false);
      }
    }, 16); // ~60fps

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  if (chapterQ.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Loading chapter…</div>;
  }
  if (chapterQ.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-destructive">Error loading chapter</h1>
          <p className="mt-2 text-muted-foreground">{(chapterQ.error as Error).message}</p>
          <div className="mt-4 space-x-2">
            <Link to="/home" className="text-primary">Go home</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/title/$slug" params={{ slug: titleSlug }} className="text-primary">Back to series</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!chapterQ.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Chapter not found</h1>
          <p className="mt-2 text-muted-foreground">Chapter "{chapterSlug}" was not found in series "{titleSlug}"</p>
          <div className="mt-4 space-x-2">
            <Link to="/home" className="text-primary">Go home</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/title/$slug" params={{ slug: titleSlug }} className="text-primary">Back to series</Link>
          </div>
        </div>
      </div>
    );
  }

  const c = chapterQ.data;
  const isNovel = c.chapter_type === "novel";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Auto-hide */}
      <div 
        className={`sticky top-0 z-30 transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <ReaderTopBar
          title={`Ch. ${c.chapter_number}`}
          seriesTitle={c.series?.title ?? ""}
          seriesSlug={c.series?.slug ?? ""}
          isNovel={isNovel}
          allChapters={siblingsQ.data ?? []}
          currentChapterSlug={chapterSlug}
          alternateGroups={alternateGroupsQ.data ?? []}
          currentGroup={activeScanlationGroup}
        />
      </div>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1">
          {isNovel ? (
            <NovelView 
              content={c.novel_content ?? ""} 
              chapterId={c.id}
              hasPrev={!!prev}
              hasNext={!!next}
              onPrev={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
              onNext={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
              seriesSlug={seriesSlug}
            />
          ) : (
            <ImageView 
              pages={pagesQ.data} 
              loading={pagesQ.isLoading} 
              chapterId={c.id}
              hasPrev={!!prev}
              hasNext={!!next}
              onPrev={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
              onNext={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
              seriesSlug={seriesSlug}
            />
          )}
        </div>
      </div>

      {/* Floating Controls Sidebar - Scroll-based visibility */}
      <div 
        className={`transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <FloatingControls
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          hasPrev={!!prev}
          hasNext={!!next}
          onPrev={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
          onNext={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
          seriesSlug={seriesSlug}
          allChapters={siblingsQ.data ?? []}
          currentChapterSlug={chapterSlug}
          chapterId={c.id}
          seriesId={c.series_id}
          seriesTitle={c.series?.title ?? ""}
          showChapters={showChapters}
          setShowChapters={setShowChapters}
          showSpeedControl={showSpeedControl}
          setShowSpeedControl={setShowSpeedControl}
        />
      </div>

      {/* Bottom Nav - Fixed at bottom (Mobile only) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur md:hidden transition-transform duration-300 ${
        controlsVisible ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prev}
            onClick={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />Prev
          </Button>
          <div className="flex items-center gap-1">
            <Link to="/home">
              <Button variant="ghost" size="sm" title="Home">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/title/$slug" params={{ slug: seriesSlug }}>
              <Button variant="ghost" size="sm" title="Back to title">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            {/* Auto-scroll Button - Mobile only */}
            <Button 
              variant={isAutoScrolling ? "default" : "ghost"}
              size="sm" 
              onClick={toggleAutoScroll}
              title={isAutoScrolling ? "Stop Auto-scroll" : "Start Auto-scroll"}
            >
              {isAutoScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            {/* Fullscreen Button - Mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            {/* Report Button - Mobile only */}
            <ReportButton 
              chapterId={c.id} 
              seriesId={c.series_id} 
              seriesTitle={c.series?.title ?? ""} 
            />
          </div>
          <Button
            size="sm"
            disabled={!next}
            onClick={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
          >
            Next<ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Auto-scroll Speed Control - Mobile only */}
      {isAutoScrolling && (
        <div className="fixed bottom-16 left-1/2 z-40 -translate-x-1/2 rounded-full bg-background/95 px-4 py-2 shadow-lg backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Speed:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setAutoScrollSpeed(prev => Math.max(1, prev - 0.5))}
                disabled={autoScrollSpeed <= 1}
              >
                -
              </Button>
              <span className="min-w-[3ch] text-center text-sm font-medium">
                {autoScrollSpeed.toFixed(1)}x
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setAutoScrollSpeed(prev => Math.min(10, prev + 0.5))}
                disabled={autoScrollSpeed >= 10}
              >
                +
              </Button>
            </div>
            {/* Divider */}
            <div className="h-6 w-px bg-border"></div>
            {/* Pause Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={toggleAutoScroll}
              title="Pause Auto-scroll"
            >
              <Pause className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Scroll to Top Button - Both Mobile and Desktop */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 right-6 z-40 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl md:bottom-6 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        title="Scroll to top"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}

function ReaderTopBar({
  title,
  seriesTitle,
  seriesSlug,
  isNovel,
  allChapters,
  currentChapterSlug,
  alternateGroups,
  currentGroup,
}: {
  title: string;
  seriesTitle: string;
  seriesSlug: string;
  isNovel: boolean;
  allChapters: Array<{ id: string; slug: string; chapter_number: number }>;
  currentChapterSlug: string;
  alternateGroups: Array<{
    id: string;
    slug: string;
    scanlation_group: string | null;
    chapter_number: number;
  }>;
  currentGroup: string | null;
}) {
  const navigate = useNavigate();
  const showGroupSwitcher = alternateGroups.length > 1;

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-2 px-8 py-3">
        <Link to="/title/$slug" params={{ slug: seriesSlug }} className="flex min-w-0 items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <div className="min-w-0">
            <div className="truncate font-semibold">{seriesTitle}</div>
            <div className="truncate text-xs text-muted-foreground">{title}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {showGroupSwitcher && (
            <Select
              value={currentChapterSlug}
              onValueChange={(slug) =>
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: slug },
                })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Scan group" />
              </SelectTrigger>
              <SelectContent>
                {alternateGroups.map((ch) => (
                  <SelectItem key={ch.id} value={ch.slug}>
                    {ch.scanlation_group || "Default"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!showGroupSwitcher && currentGroup && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{currentGroup}</span>
          )}
          {allChapters.length > 0 && (
            <Select
              value={currentChapterSlug}
              onValueChange={(slug) => navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: slug } })}
            >
              <SelectTrigger className="w-[180px]">
                <List className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {allChapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.slug}>
                    Chapter {ch.chapter_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </header>
  );
}

function ImageView({ pages, loading, chapterId, hasPrev, hasNext, onPrev, onNext, seriesSlug }: { 
  pages?: any[]; 
  loading: boolean; 
  chapterId: string; 
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
}) {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { user } = useAuth();
  
  // Image error handling state - moved to top
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageRetries, setImageRetries] = useState<Record<string, number>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  // Scroll position restoration
  useEffect(() => {
    if (!chapterId || loading || !pages?.length) return;

    const scrollKey = `chapter-scroll-${chapterId}`;
    
    // Restore scroll position after pages load
    const restoreScroll = () => {
      const savedPosition = localStorage.getItem(scrollKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        setTimeout(() => {
          window.scrollTo({ top: position, behavior: 'instant' });
        }, 100); // Small delay to ensure images are rendered
      }
    };

    // Save scroll position periodically
    const saveScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(scrollKey, scrollTop.toString());
    };

    // Throttled scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 150);
    };

    // Restore scroll position when pages are loaded
    restoreScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    // Save scroll position when leaving the page
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chapterId, loading, pages?.length]);

  // Clean up old scroll positions (keep only last 10 chapters per user)
  useEffect(() => {
    const cleanupOldScrollPositions = () => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('chapter-scroll-'));
      if (keys.length > 10) {
        // Sort by timestamp (assuming newer items were added later)
        keys.sort().slice(0, keys.length - 10).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    };

    cleanupOldScrollPositions();
  }, [chapterId]);

  // NOW safe to have conditional returns - all hooks are declared above
  if (loading) {
    return <div className="container mx-auto max-w-3xl px-2 py-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded bg-secondary" />)}</div>;
  }
  if (!pages || pages.length === 0) {
    return <div className="grid min-h-[50vh] place-items-center text-muted-foreground">No pages uploaded for this chapter yet.</div>;
  }

  const handleImageError = (pageId: string, imageUrl: string) => {
    setImageLoading(prev => ({ ...prev, [pageId]: false }));
    const retryCount = imageRetries[pageId] || 0;
    
    // Try up to 2 retries
    if (retryCount < 2) {
      setImageRetries(prev => ({ ...prev, [pageId]: retryCount + 1 }));
      // Force reload by adding timestamp
      const img = document.querySelector(`img[data-page-id="${pageId}"]`) as HTMLImageElement;
      if (img) {
        setTimeout(() => {
          setImageLoading(prev => ({ ...prev, [pageId]: true }));
          img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + `retry=${retryCount + 1}&t=${Date.now()}`;
        }, 1000 * (retryCount + 1)); // Progressive delay: 1s, 2s
      }
    } else {
      // Mark as failed after retries
      setImageErrors(prev => ({ ...prev, [pageId]: true }));
    }
  };

  const handleImageLoad = (pageId: string) => {
    setImageLoading(prev => ({ ...prev, [pageId]: false }));
  };

  return (
    <>
      {/* Pages */}
      <div className="mx-auto max-w-3xl px-2 py-4">
        {pages.map((p, idx) => (
          <div key={p.id} className="relative">
            {imageErrors[p.id] ? (
              // Error fallback UI
              <div className="mx-auto flex aspect-[2/3] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 text-center">
                <div className="rounded-full bg-destructive/20 p-4 text-destructive">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">Failed to load Page {p.page_number}</p>
                <p className="mt-1 text-xs text-muted-foreground">Image URL may be broken or expired</p>
                <button
                  onClick={() => {
                    setImageErrors(prev => {
                      const updated = { ...prev };
                      delete updated[p.id];
                      return updated;
                    });
                    setImageRetries(prev => {
                      const updated = { ...prev };
                      delete updated[p.id];
                      return updated;
                    });
                    setImageLoading(prev => ({ ...prev, [p.id]: true }));
                  }}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {imageLoading[p.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary/80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                )}
                <img
                  data-page-id={p.id}
                  src={p.image_url}
                  alt={`Page ${p.page_number}`}
                  loading={idx < 2 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : "auto"}
                  className="mx-auto block w-full transition-transform duration-200"
                  style={{ 
                    opacity: imageLoading[p.id] ? 0.3 : 1
                  }}
                  onLoad={() => handleImageLoad(p.id)}
                  onError={() => handleImageError(p.id, p.image_url)}
                />
              </>
            )}
          </div>
        ))}

        {/* Chapter Navigation Buttons - Above Reactions */}
        <ChapterNavigation 
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={onPrev}
          onNext={onNext}
          seriesSlug={seriesSlug}
        />

        {/* Reactions & Comments Section */}
        <ChapterReactions chapterId={chapterId} />
      </div>
    </>
  );
}

function NovelView({ content, chapterId, hasPrev, hasNext, onPrev, onNext, seriesSlug }: { 
  content: string; 
  chapterId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
}) {
  // Scroll position restoration for novels
  useEffect(() => {
    if (!chapterId || !content) return;

    const scrollKey = `chapter-scroll-${chapterId}`;
    
    // Restore scroll position after content loads
    const restoreScroll = () => {
      const savedPosition = localStorage.getItem(scrollKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        setTimeout(() => {
          window.scrollTo({ top: position, behavior: 'instant' });
        }, 100);
      }
    };

    // Save scroll position periodically
    const saveScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(scrollKey, scrollTop.toString());
    };

    // Throttled scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 150);
    };

    // Restore scroll position when content is loaded
    restoreScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    // Save scroll position when leaving the page
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chapterId, content]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <article
        className="text-foreground"
        style={{ fontSize: "var(--novel-font-size, 18px)", lineHeight: "var(--novel-line-height, 1.7)" }}
      >
        {content.split(/\n{2,}/).map((p, i) => (
          <p key={i} className="mb-4 whitespace-pre-wrap">{p}</p>
        ))}
      </article>

      {/* Chapter Navigation Buttons - Above Reactions */}
      <ChapterNavigation 
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={onPrev}
        onNext={onNext}
        seriesSlug={seriesSlug}
      />
    </div>
  );
}


// Chapter Navigation Component
function ChapterNavigation({ 
  hasPrev, 
  hasNext, 
  onPrev, 
  onNext,
  seriesSlug 
}: { 
  hasPrev: boolean; 
  hasNext: boolean; 
  onPrev: () => void; 
  onNext: () => void;
  seriesSlug?: string;
}) {
  return (
    <div className="my-8 flex items-center justify-between gap-3">
      {/* Previous Chapter Button */}
      <Button
        variant="outline"
        size="lg"
        disabled={!hasPrev}
        onClick={onPrev}
        className="flex-1"
      >
        <ChevronLeft className="mr-2 h-5 w-5" />
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </Button>

      {/* Series Info Button (Middle) */}
      {seriesSlug && (
        <Link to="/title/$slug" params={{ slug: seriesSlug }}>
          <Button
            variant="secondary"
            size="lg"
            className="px-6"
            title="Series Info"
          >
            <BookOpen className="h-5 w-5" />
          </Button>
        </Link>
      )}

      {/* Next Chapter or Home Button */}
      {hasNext ? (
        <Button
          size="lg"
          onClick={onNext}
          className="flex-1"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      ) : (
        <Link to="/home" className="flex-1">
          <Button
            size="lg"
            className="w-full"
          >
            <Home className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">Home</span>
          </Button>
        </Link>
      )}
    </div>
  );
}

// Floating Controls Sidebar (like in the image)
function FloatingControls({
  isFullscreen,
  toggleFullscreen,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
  allChapters,
  currentChapterSlug,
  chapterId,
  seriesId,
  seriesTitle,
  showChapters,
  setShowChapters,
  showSpeedControl,
  setShowSpeedControl,
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
  allChapters: Array<{ id: string; slug: string; chapter_number: number }>;
  currentChapterSlug: string;
  chapterId: string;
  seriesId: string;
  seriesTitle: string;
  showChapters: boolean;
  setShowChapters: (show: boolean) => void;
  showSpeedControl: boolean;
  setShowSpeedControl: (show: boolean) => void;
}) {
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3); // 1-10 scale, 3 = slow
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScrollEnabled) {
      // Clear any existing interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      // Calculate scroll amount based on speed (1-10 scale)
      // Speed 1 = 0.5px per 16ms, Speed 10 = 5px per 16ms
      const scrollAmount = scrollSpeed * 0.5;
      
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: scrollAmount, behavior: 'auto' });
        
        // Stop if reached bottom
        if ((window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight) {
          setAutoScrollEnabled(false);
        }
      }, 16); // ~60fps

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }
  }, [autoScrollEnabled, scrollSpeed]);

  // Stop auto-scroll on manual scroll or interaction
  useEffect(() => {
    const handleUserScroll = (e: WheelEvent | TouchEvent) => {
      if (autoScrollEnabled) {
        setAutoScrollEnabled(false);
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (autoScrollEnabled && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.key)) {
        setAutoScrollEnabled(false);
      }
    };

    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [autoScrollEnabled]);

  const toggleAutoScroll = () => {
    setAutoScrollEnabled(prev => !prev);
    if (!autoScrollEnabled) {
      setShowSpeedControl(false);
    }
  };

  return (
    <>
      {/* Floating Vertical Sidebar */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2 bg-card backdrop-blur-lg rounded-full p-2 border border-border/50 shadow-lg">
        {/* Previous Chapter */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Previous Chapter"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Auto Scroll Toggle */}
        <button
          onClick={toggleAutoScroll}
          className={`p-3 rounded-full transition-colors ${
            autoScrollEnabled 
              ? 'bg-violet-600 text-white hover:bg-violet-700' 
              : 'hover:bg-primary/20'
          }`}
          title={autoScrollEnabled ? "Pause Auto Scroll" : "Start Auto Scroll"}
        >
          {autoScrollEnabled ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        {/* Speed Control Button */}
        {autoScrollEnabled && (
          <button
            onClick={() => setShowSpeedControl(!showSpeedControl)}
            className="p-3 rounded-full hover:bg-primary/20 transition-colors text-xs font-bold"
            title="Adjust Speed"
          >
            {scrollSpeed}x
          </button>
        )}

        {/* Chapter List */}
        <button
          onClick={() => setShowChapters(!showChapters)}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Chapters"
        >
          <List className="h-5 w-5" />
        </button>

        {/* Home */}
        <Link
          to="/home"
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Back to series */}
        <Link
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Back to title"
        >
          <BookOpen className="h-5 w-5" />
        </Link>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        {/* Report */}
        <button
          onClick={() => setShowReport(!showReport)}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Report"
        >
          <Flag className="h-5 w-5" />
        </button>

        {/* Next Chapter */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Next Chapter"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Speed Control Panel */}
      {showSpeedControl && autoScrollEnabled && (
        <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 w-56 bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Scroll Speed</span>
              <button 
                onClick={() => setShowSpeedControl(false)}
                className="hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {scrollSpeed <= 3 ? 'Slow' : scrollSpeed <= 6 ? 'Medium' : 'Fast'}
            </div>
          </div>
          
          {/* Speed Slider */}
          <input
            type="range"
            min="1"
            max="10"
            value={scrollSpeed}
            onChange={(e) => setScrollSpeed(Number(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
          
          {/* Speed Presets */}
          <div className="flex justify-between mt-3 gap-2">
            <Button
              variant={scrollSpeed === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setScrollSpeed(2)}
              className="flex-1 text-xs"
            >
              Slow
            </Button>
            <Button
              variant={scrollSpeed === 5 ? "default" : "outline"}
              size="sm"
              onClick={() => setScrollSpeed(5)}
              className="flex-1 text-xs"
            >
              Medium
            </Button>
            <Button
              variant={scrollSpeed === 8 ? "default" : "outline"}
              size="sm"
              onClick={() => setScrollSpeed(8)}
              className="flex-1 text-xs"
            >
              Fast
            </Button>
          </div>
        </div>
      )}

      {/* Chapters Panel */}
      {showChapters && (
        <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 w-80 max-h-[500px] overflow-hidden bg-card backdrop-blur-lg rounded-xl border border-border/50 shadow-2xl">
          <div className="sticky top-0 bg-card/95 backdrop-blur-md p-4 border-b border-border/50 flex items-center justify-between">
            <span className="text-base font-bold">Chapters</span>
            <button onClick={() => setShowChapters(false)} className="hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[420px] p-3 space-y-1.5 scrollbar-thin">
            {allChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: ch.slug } });
                  setShowChapters(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-primary/20 transition-all ${
                  ch.slug === currentChapterSlug 
                    ? "bg-violet-600 text-white font-semibold shadow-md" 
                    : "hover:shadow-sm"
                }`}
              >
                Chapter {ch.chapter_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Panel */}
      {showReport && (
        <FloatingReportPanel
          onClose={() => setShowReport(false)}
          chapterId={chapterId}
          seriesId={seriesId}
          seriesTitle={seriesTitle}
        />
      )}
    </>
  );
}

// Floating Report Panel
function FloatingReportPanel({ 
  onClose, 
  chapterId, 
  seriesId, 
  seriesTitle 
}: { 
  onClose: () => void; 
  chapterId: string; 
  seriesId: string; 
  seriesTitle: string; 
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [reportType, setReportType] = useState<"chapter" | "series">("chapter");

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 w-72 bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl">
      <div className="sticky top-0 bg-card backdrop-blur p-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-sm font-semibold">Report Issue</span>
        <button onClick={onClose} className="hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chapter">Report Chapter</SelectItem>
            <SelectItem value="series">Report Title</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-xs text-muted-foreground">
          {reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"`}
        </div>

        <Textarea
          placeholder="Describe the issue (min 10 characters)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="resize-none text-sm"
        />
        
        <Button 
          size="sm" 
          onClick={() => submitReport.mutate()}
          disabled={!user || submitReport.isPending}
          className="w-full"
        >
          Submit Report
        </Button>
      </div>
    </div>
  );
}

// Report Button for Mobile
function ReportButton({ chapterId, seriesId, seriesTitle }: { chapterId: string; seriesId: string; seriesTitle: string }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [reportType, setReportType] = useState<"chapter" | "series">("chapter");

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Report Issue</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapter">Report Chapter</SelectItem>
              <SelectItem value="series">Report Title</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground">
            {reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"`}
          </div>

          <Textarea
            placeholder="Describe the issue (min 10 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            className="resize-none"
          />
          
          <Button 
            className="w-full"
            onClick={() => submitReport.mutate()}
            disabled={!user || submitReport.isPending}
          >
            Submit Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Chapter Reactions Component
function ChapterReactions({ chapterId }: { chapterId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Reaction emojis with their types
  const reactions = [
    { type: "heart", icon: Heart, label: "Love" },
    { type: "thumbs_up", icon: ThumbsUp, label: "Like" },
    { type: "laugh", icon: Laugh, label: "Funny" },
    { type: "star", icon: Star, label: "Amazing" },
    { type: "smile", icon: Smile, label: "Enjoyed" },
  ];

  // Fetch reaction counts
  const reactionsQ = useQuery({
    queryKey: ["chapter-reactions", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("reaction_type")
        .eq("chapter_id", chapterId);
      
      if (error) throw error;

      // Count reactions by type
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch user's reactions
  const userReactionsQ = useQuery({
    queryKey: ["user-chapter-reactions", chapterId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("reaction_type")
        .eq("chapter_id", chapterId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map((r) => r.reaction_type) || [];
    },
    enabled: !!user,
  });

  // Toggle reaction
  const toggleReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) {
        toast.error("Sign in to react");
        return;
      }

      const hasReacted = userReactionsQ.data?.includes(reactionType);

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from("chapter_reactions")
          .delete()
          .eq("chapter_id", chapterId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("chapter_reactions")
          .insert({
            chapter_id: chapterId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter-reactions", chapterId] });
      qc.invalidateQueries({ queryKey: ["user-chapter-reactions", chapterId, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-12 mb-8 border-t border-border pt-8">
      {/* Reactions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">How did you like this chapter?</h3>
        <div className="flex flex-wrap gap-3">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const count = reactionsQ.data?.[reaction.type] || 0;
            const hasReacted = userReactionsQ.data?.includes(reaction.type);

            return (
              <button
                key={reaction.type}
                onClick={() => toggleReaction.mutate(reaction.type)}
                disabled={toggleReaction.isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  hasReacted
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-border hover:bg-primary/10 hover:border-primary/50"
                }`}
                title={reaction.label}
              >
                <Icon className={`h-5 w-5 ${hasReacted ? "fill-current" : ""}`} />
                {count > 0 && <span className="text-sm font-medium">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments Placeholder */}
      <div className="border border-border rounded-lg p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        <p className="text-muted-foreground">Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-2">
          Share your thoughts and discuss this chapter with other readers
        </p>
      </div>
    </div>
  );
}
