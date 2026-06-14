"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Home,
  List,
  Maximize,
  Minimize,
  Flag,
  Heart,
  Smile,
  ThumbsUp,
  Laugh,
  Star,
  MessageSquare,
  Play,
  Pause,
  ArrowUp,
  Send,
  Reply,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Palette,
  Film,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

function Link({ to, params, search, children, ...props }: any) {
  let href = to || "";
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      href = href.replace(`$${key}`, val);
    }
  }
  if (search) {
    const searchStr = new URLSearchParams(search).toString();
    if (searchStr) {
      href = `${href}?${searchStr}`;
    }
  }
  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  );
}

function useNavigate() {
  const router = useRouter();
  return (opts: any) => {
    if (opts.to && opts.params) {
      let target = opts.to;
      for (const [key, val] of Object.entries(opts.params)) {
        target = target.replace(`$${key}`, val);
      }
      router.push(target);
    } else if (opts.to) {
      router.push(opts.to);
    }
  };
}

export default function Reader({ slug, chapterSlug }: { slug: string; chapterSlug: string }) {
  const titleSlug = slug;
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
      // First get the series to ensure it exists
      const { data: seriesData, error: seriesError } = await supabase
        .from("series")
        .select("id, slug, title, type")
        .eq("slug", titleSlug)
        .single();

      if (seriesError) {
        throw seriesError;
      }
      if (!seriesData) {
        throw new Error(`Series "${titleSlug}" not found`);
      }

      // Then get the chapter that belongs to this series
      const { data, error } = await supabase
        .from("chapters")
        .select("*, series:series(id,slug,title,type)")
        .eq("slug", chapterSlug)
        .eq("series_id", seriesData.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(`Chapter "${chapterSlug}" not found in series "${seriesData.title}"`);
      }

      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
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
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const activeScanlationGroup = chapterQ.data?.scanlation_group ?? null;

  const siblingsQ = useQuery({
    queryKey: ["chapter-siblings", chapterQ.data?.series?.id, activeScanlationGroup],
    queryFn: async () => {
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
        throw error;
      }
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  const alternateGroupsQ = useQuery({
    queryKey: ["chapter-alternate-groups", chapterQ.data?.series_id, chapterQ.data?.chapter_number],
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  // Save reading history with scroll progress
  useEffect(() => {
    if (!user || !chapterQ.data) return;

    // Save initial reading history entry
    supabase
      .from("reading_history")
      .upsert(
        {
          user_id: user.id,
          series_id: chapterQ.data.series_id,
          chapter_id: chapterQ.data.id,
          progress: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chapter_id" } as any,
      )
      .then(() => {});

    // Update reading progress based on scroll position
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollHeight > 0 ? Math.min(Math.round((scrollTop / scrollHeight) * 100), 100) : 0;

      // Only update if progress has changed significantly (every 5%)
      const lastProgress = parseInt(
        localStorage.getItem(`chapter-progress-${chapterQ.data.id}`) || "0",
      );
      if (Math.abs(progress - lastProgress) >= 5) {
        localStorage.setItem(`chapter-progress-${chapterQ.data.id}`, progress.toString());
        supabase
          .from("reading_history")
          .upsert(
            {
              user_id: user.id,
              series_id: chapterQ.data.series_id,
              chapter_id: chapterQ.data.id,
              progress: progress,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,chapter_id" } as any,
          )
          .then(() => {});
      }
    };

    let progressTimeout: NodeJS.Timeout;
    const handleProgressUpdate = () => {
      clearTimeout(progressTimeout);
      progressTimeout = setTimeout(updateProgress, 500);
    };

    window.addEventListener("scroll", handleProgressUpdate);

    return () => {
      clearTimeout(progressTimeout);
      window.removeEventListener("scroll", handleProgressUpdate);
      // Final progress update when leaving
      updateProgress();
    };
  }, [user, chapterQ.data]);

  // Award XP once per chapter completion (>= 90% scroll, or chapters that fit
  // entirely on screen). The RPC itself is idempotent per (user, chapter).
  const xpAwardedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !chapterQ.data) return;

    const chapterId = chapterQ.data.id;
    let cancelled = false;

    const awardXp = async () => {
      if (xpAwardedRef.current === chapterId) return;
      xpAwardedRef.current = chapterId;

      const { data, error } = await supabase.rpc("award_chapter_completion_xp", {
        _chapter_id: chapterId,
      });
      if (cancelled || error) return;

      const result = Array.isArray(data) ? data[0] : data;
      if (!result || !result.xp_gained || result.xp_gained <= 0) return;

      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });

      if (result.leveled_up) {
        toast.success(`+${result.xp_gained} XP — Level up! You're now Level ${result.new_level}`);
      } else {
        toast.success(`+${result.xp_gained} XP earned — chapter complete!`);
      }
    };

    const checkCompletion = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      // Chapter shorter than the viewport — nothing to scroll, count as read.
      if (scrollHeight <= 0) {
        awardXp();
        return;
      }
      const progress = (scrollTop / scrollHeight) * 100;
      if (progress >= 90) {
        awardXp();
      }
    };

    // Run once shortly after mount for short chapters / restored scroll
    // positions that already exceed the threshold.
    const initialTimeout = setTimeout(checkCompletion, 800);
    window.addEventListener("scroll", checkCompletion, { passive: true });

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      window.removeEventListener("scroll", checkCompletion);
    };
  }, [user, chapterQ.data, qc]);


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
  const next =
    idx >= 0 && siblingsQ.data && idx < siblingsQ.data.length - 1 ? siblingsQ.data[idx + 1] : null;

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
                },
              });
            }

            return data;
          },
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
        navigate({
          to: "/title/$titleSlug/$chapterSlug",
          params: { titleSlug: seriesSlug, chapterSlug: prev.slug },
        });
      } else if (e.key === "ArrowRight" && next) {
        navigate({
          to: "/title/$titleSlug/$chapterSlug",
          params: { titleSlug: seriesSlug, chapterSlug: next.slug },
        });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.scrollBy({ top: autoScrollSpeed, behavior: "auto" });

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
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading chapter…
      </div>
    );
  }
  if (chapterQ.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-destructive">Error loading chapter</h1>
          <p className="mt-2 text-muted-foreground">{(chapterQ.error as Error).message}</p>
          <div className="mt-4 space-x-2">
            <Link to="/home" className="text-primary">
              Go home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/title/$slug" params={{ slug: titleSlug }} className="text-primary">
              Back to series
            </Link>
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
          <p className="mt-2 text-muted-foreground">
            Chapter "{chapterSlug}" was not found in series "{titleSlug}"
          </p>
          <div className="mt-4 space-x-2">
            <Link to="/home" className="text-primary">
              Go home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/title/$slug" params={{ slug: titleSlug }} className="text-primary">
              Back to series
            </Link>
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
              seriesId={c.series_id}
              hasPrev={!!prev}
              hasNext={!!next}
              onPrev={() =>
                prev &&
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: prev.slug },
                })
              }
              onNext={() =>
                next &&
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: next.slug },
                })
              }
              seriesSlug={seriesSlug}
              seriesTitle={c.series?.title ?? ""}
              chapterNumber={c.chapter_number}
            />
          ) : (
            <ImageView
              pages={pagesQ.data}
              loading={pagesQ.isLoading}
              chapterId={c.id}
              seriesId={c.series_id}
              hasPrev={!!prev}
              hasNext={!!next}
              onPrev={() =>
                prev &&
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: prev.slug },
                })
              }
              onNext={() =>
                next &&
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: next.slug },
                })
              }
              seriesSlug={seriesSlug}
              seriesTitle={c.series?.title ?? ""}
              chapterNumber={c.chapter_number}
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
          onPrev={() =>
            prev &&
            navigate({
              to: "/title/$titleSlug/$chapterSlug",
              params: { titleSlug: seriesSlug, chapterSlug: prev.slug },
            })
          }
          onNext={() =>
            next &&
            navigate({
              to: "/title/$titleSlug/$chapterSlug",
              params: { titleSlug: seriesSlug, chapterSlug: next.slug },
            })
          }
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
      <nav
        className={`fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur md:hidden transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prev}
            onClick={() =>
              prev &&
              navigate({
                to: "/title/$titleSlug/$chapterSlug",
                params: { titleSlug: seriesSlug, chapterSlug: prev.slug },
              })
            }
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
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
            onClick={() =>
              next &&
              navigate({
                to: "/title/$titleSlug/$chapterSlug",
                params: { titleSlug: seriesSlug, chapterSlug: next.slug },
              })
            }
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
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
                onClick={() => setAutoScrollSpeed((prev) => Math.max(1, prev - 0.5))}
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
                onClick={() => setAutoScrollSpeed((prev) => Math.min(10, prev + 0.5))}
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
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
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
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <Link
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <div className="min-w-0">
            <div className="truncate font-semibold">{seriesTitle}</div>
            <div className="truncate text-xs text-muted-foreground">{title}</div>
            {/* Screen-reader-only h1 tag for absolute SEO compliance and hierarchy */}
            <h1 className="sr-only">
              Read {seriesTitle} {title.includes("Ch. ") ? `Chapter ${title.replace("Ch. ", "")}` : title} Online Free
            </h1>
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
              onValueChange={(slug) =>
                navigate({
                  to: "/title/$titleSlug/$chapterSlug",
                  params: { titleSlug: seriesSlug, chapterSlug: slug },
                })
              }
            >
              <SelectTrigger className="w-full min-[420px]:w-[180px]">
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

function ImageView({
  pages,
  loading,
  chapterId,
  seriesId,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
  seriesTitle,
  chapterNumber,
}: {
  pages?: any[];
  loading: boolean;
  chapterId: string;
  seriesId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
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
          window.scrollTo({ top: position, behavior: "instant" });
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
    window.addEventListener("scroll", handleScroll);

    // Save scroll position when leaving the page
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [chapterId, loading, pages?.length]);

  // Clean up old scroll positions (keep only last 10 chapters per user)
  useEffect(() => {
    const cleanupOldScrollPositions = () => {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("chapter-scroll-"));
      if (keys.length > 10) {
        // Sort by timestamp (assuming newer items were added later)
        keys
          .sort()
          .slice(0, keys.length - 10)
          .forEach((key) => {
            localStorage.removeItem(key);
          });
      }
    };

    cleanupOldScrollPositions();
  }, [chapterId]);

  // NOW safe to have conditional returns - all hooks are declared above
  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-2 py-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded bg-secondary" />
        ))}
      </div>
    );
  }
  if (!pages || pages.length === 0) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        No pages uploaded for this chapter yet.
      </div>
    );
  }

  const handleImageError = (pageId: string, imageUrl: string) => {
    setImageLoading((prev) => ({ ...prev, [pageId]: false }));
    const retryCount = imageRetries[pageId] || 0;

    // Try up to 2 retries
    if (retryCount < 2) {
      setImageRetries((prev) => ({ ...prev, [pageId]: retryCount + 1 }));
      // Force reload by adding timestamp
      const img = document.querySelector(`img[data-page-id="${pageId}"]`) as HTMLImageElement;
      if (img) {
        setTimeout(
          () => {
            setImageLoading((prev) => ({ ...prev, [pageId]: true }));
            img.src =
              imageUrl +
              (imageUrl.includes("?") ? "&" : "?") +
              `retry=${retryCount + 1}&t=${Date.now()}`;
          },
          1000 * (retryCount + 1),
        ); // Progressive delay: 1s, 2s
      }
    } else {
      // Mark as failed after retries
      setImageErrors((prev) => ({ ...prev, [pageId]: true }));
    }
  };

  const handleImageLoad = (pageId: string) => {
    setImageLoading((prev) => ({ ...prev, [pageId]: false }));
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  Failed to load Page {p.page_number}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Image URL may be broken or expired
                </p>
                <button
                  onClick={() => {
                    setImageErrors((prev) => {
                      const updated = { ...prev };
                      delete updated[p.id];
                      return updated;
                    });
                    setImageRetries((prev) => {
                      const updated = { ...prev };
                      delete updated[p.id];
                      return updated;
                    });
                    setImageLoading((prev) => ({ ...prev, [p.id]: true }));
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
                  alt={`${seriesTitle || "Manga"} Chapter ${chapterNumber} Page ${p.page_number} - vnrscans`}
                  loading={idx < 2 ? "eager" : "lazy"}
                  fetchPriority={idx < 2 ? "high" : "auto"}
                  className="mx-auto block w-full transition-transform duration-200"
                  referrerPolicy="no-referrer"
                  style={{
                    opacity: imageLoading[p.id] ? 0.3 : 1,
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
        <ChapterReactions chapterId={chapterId} seriesId={seriesId} />
      </div>
    </>
  );
}

function NovelView({
  content,
  chapterId,
  seriesId,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
  seriesTitle,
  chapterNumber,
}: {
  content: string;
  chapterId: string;
  seriesId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
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
          window.scrollTo({ top: position, behavior: "instant" });
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
    window.addEventListener("scroll", handleScroll);

    // Save scroll position when leaving the page
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [chapterId, content]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <article
        className="text-foreground"
        style={{
          fontSize: "var(--novel-font-size, 18px)",
          lineHeight: "var(--novel-line-height, 1.7)",
        }}
      >
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {seriesTitle || "Novel"} — Chapter {chapterNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Read the full chapter online at vnrscans.
          </p>
        </header>
        {content.split(/\n{2,}/).map((p, i) => (
          <p key={i} className="mb-4 whitespace-pre-wrap">
            {p}
          </p>
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

      <ChapterReactions chapterId={chapterId} seriesId={seriesId} />
    </div>
  );
}

// Chapter Navigation Component
function ChapterNavigation({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
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
      <Button variant="outline" size="lg" disabled={!hasPrev} onClick={onPrev} className="flex-1">
        <ChevronLeft className="mr-2 h-5 w-5" />
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </Button>

      {/* Series Info Button (Middle) */}
      {seriesSlug && (
        <Link to="/title/$slug" params={{ slug: seriesSlug }}>
          <Button variant="secondary" size="lg" className="px-6" title="Series Info">
            <BookOpen className="h-5 w-5" />
          </Button>
        </Link>
      )}

      {/* Next Chapter or Home Button */}
      {hasNext ? (
        <Button size="lg" onClick={onNext} className="flex-1">
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      ) : (
        <Link to="/home" className="flex-1">
          <Button size="lg" className="w-full">
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
        window.scrollBy({ top: scrollAmount, behavior: "auto" });

        // Stop if reached bottom
        if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight) {
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
      if (
        autoScrollEnabled &&
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Space"].includes(e.key)
      ) {
        setAutoScrollEnabled(false);
      }
    };

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [autoScrollEnabled]);

  const toggleAutoScroll = () => {
    setAutoScrollEnabled((prev) => !prev);
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
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "hover:bg-primary/20"
          }`}
          title={autoScrollEnabled ? "Pause Auto Scroll" : "Start Auto Scroll"}
        >
          {autoScrollEnabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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
              <button onClick={() => setShowSpeedControl(false)} className="hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {scrollSpeed <= 3 ? "Slow" : scrollSpeed <= 6 ? "Medium" : "Fast"}
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
            <button
              onClick={() => setShowChapters(false)}
              className="hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[420px] p-3 space-y-1.5 scrollbar-thin">
            {allChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  navigate({
                    to: "/title/$titleSlug/$chapterSlug",
                    params: { titleSlug: seriesSlug, chapterSlug: ch.slug },
                  });
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
  seriesTitle,
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
      if (!reason.trim() || reason.length < 10)
        throw new Error("Please provide a detailed reason (min 10 characters)");

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
function ReportButton({
  chapterId,
  seriesId,
  seriesTitle,
}: {
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
      if (!reason.trim() || reason.length < 10)
        throw new Error("Please provide a detailed reason (min 10 characters)");

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
            {reportType === "chapter"
              ? "Report issues with this chapter"
              : `Report "${seriesTitle}"`}
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
function ChapterReactions({ chapterId, seriesId }: { chapterId: string; seriesId: string }) {
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
    staleTime: 1000 * 60 * 2,
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
    staleTime: 1000 * 60 * 2,
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
        const { error } = await supabase.from("chapter_reactions").insert({
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

      <ChapterComments chapterId={chapterId} seriesId={seriesId} />
    </div>
  );
}

type ChapterComment = {
  id: string;
  user_id: string;
  series_id: string | null;
  chapter_id: string | null;
  parent_id: string | null;
  content: string;
  attachment_type: "image" | "gif" | null;
  attachment_url: string | null;
  attachment_alt: string | null;
  is_hidden: boolean;
  is_spoiler: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type CommentProfile = {
  user_id: string;
  username: string;
  avatar_url: string | null;
};

const COMMENT_REACTIONS = [
  { type: "like", label: "Like", icon: ThumbsUp },
  { type: "funny", label: "Funny", icon: Laugh },
  { type: "shock", label: "Shock", icon: Smile },
  { type: "sad", label: "Sad", icon: Heart },
  { type: "angry", label: "Angry", icon: Flag },
] as const;

type CommentDraft = {
  body: string;
  parentId: string | null;
  spoiler: boolean;
  attachmentType: "image" | "gif" | null;
  attachmentUrl: string | null;
  attachmentAlt: string | null;
};

const COMMENT_TEXT_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
};

function renderCommentMarkdown(text: string): ReactNode[] {
  return text.split("\n").flatMap((line, lineIndex, lines) => {
    const nodes = renderInlineMarkdown(line, `${lineIndex}`);
    if (lineIndex < lines.length - 1) nodes.push(<br key={`br-${lineIndex}`} />);
    return nodes;
  });
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern =
    /\[color=(red|orange|yellow|green|blue|purple|pink)\]([\s\S]*?)\[\/color\]|\*\*([^*]+)\*\*|~~([^~]+)~~|`([^`]+)`|\*([^*]+)\*/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const key = `${keyPrefix}-${match.index}`;
    if (match[1]) {
      const color = match[1].toLowerCase();
      nodes.push(
        <span key={key} style={{ color: COMMENT_TEXT_COLORS[color] }}>
          {renderInlineMarkdown(match[2], key)}
        </span>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={key}>{renderInlineMarkdown(match[3], key)}</strong>);
    } else if (match[4]) {
      nodes.push(<s key={key}>{renderInlineMarkdown(match[4], key)}</s>);
    } else if (match[5]) {
      nodes.push(
        <code key={key} className="rounded bg-secondary px-1 py-0.5 text-[0.9em]">
          {match[5]}
        </code>,
      );
    } else if (match[6]) {
      nodes.push(<em key={key}>{renderInlineMarkdown(match[6], key)}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function ChapterComments({ chapterId, seriesId }: { chapterId: string; seriesId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [attachmentType, setAttachmentType] = useState<"image" | "gif" | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentAlt, setAttachmentAlt] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sort, setSort] = useState<"newest" | "top" | "oldest">("newest");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [replyAttachmentType, setReplyAttachmentType] = useState<"image" | "gif" | null>(null);
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState<string | null>(null);
  const [replyAttachmentAlt, setReplyAttachmentAlt] = useState<string | null>(null);
  const [replyUploadingAttachment, setReplyUploadingAttachment] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const replyContentRef = useRef<HTMLTextAreaElement | null>(null);

  const commentsQ = useQuery({
    queryKey: ["chapter-comments", chapterId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("comments") as any)
        .select(
          "id,user_id,series_id,chapter_id,parent_id,content,attachment_type,attachment_url,attachment_alt,is_hidden,is_spoiler,is_pinned,created_at,updated_at",
        )
        .eq("chapter_id", chapterId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChapterComment[];
    },
    staleTime: 1000 * 30,
  });

  const userIds = Array.from(new Set((commentsQ.data ?? []).map((comment) => comment.user_id)));

  const profilesQ = useQuery({
    queryKey: ["comment-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return new Map<string, CommentProfile>();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,username,avatar_url")
        .in("user_id", userIds);
      if (error) throw error;
      return new Map((data ?? []).map((profile) => [profile.user_id, profile as CommentProfile]));
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const reactionsQ = useQuery({
    queryKey: ["comment-reactions", chapterId],
    queryFn: async () => {
      const commentIds = (commentsQ.data ?? []).map((comment) => comment.id);
      if (commentIds.length === 0)
        return { counts: new Map<string, Record<string, number>>(), mine: new Set<string>() };

      const { data, error } = await (supabase.from("comment_reactions") as any)
        .select("comment_id,user_id,reaction_type")
        .in("comment_id", commentIds);
      if (error) throw error;

      const counts = new Map<string, Record<string, number>>();
      const mine = new Set<string>();
      (data ?? []).forEach((reaction: any) => {
        const bucket = counts.get(reaction.comment_id) ?? {};
        bucket[reaction.reaction_type] = (bucket[reaction.reaction_type] ?? 0) + 1;
        counts.set(reaction.comment_id, bucket);
        if (user && reaction.user_id === user.id) {
          mine.add(`${reaction.comment_id}:${reaction.reaction_type}`);
        }
      });

      return { counts, mine };
    },
    enabled: (commentsQ.data?.length ?? 0) > 0,
    staleTime: 1000 * 30,
  });

  const comments = commentsQ.data ?? [];
  const repliesByParent = new Map<string, ChapterComment[]>();
  comments
    .filter((comment) => comment.parent_id)
    .forEach((comment) => {
      const replies = repliesByParent.get(comment.parent_id!) ?? [];
      replies.push(comment);
      repliesByParent.set(comment.parent_id!, replies);
    });

  const topLevelComments = comments
    .filter((comment) => !comment.parent_id)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (sort === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "top") {
        const aTotal = Object.values(reactionsQ.data?.counts.get(a.id) ?? {}).reduce(
          (sum, count) => sum + count,
          0,
        );
        const bTotal = Object.values(reactionsQ.data?.counts.get(b.id) ?? {}).reduce(
          (sum, count) => sum + count,
          0,
        );
        if (bTotal !== aTotal) return bTotal - aTotal;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const uploadCommentImage = async (file: File) => {
    if (!user) throw new Error("Sign in to upload images");
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("comment-media").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("comment-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const createComment = useMutation({
    mutationFn: async ({
      body,
      parentId,
      spoiler,
      attachmentType,
      attachmentUrl,
      attachmentAlt,
    }: CommentDraft) => {
      if (!user) throw new Error("Sign in to comment");
      const cleanBody = body.trim();
      if (cleanBody.length < 2 && !attachmentUrl) throw new Error("Add text or attach media");
      if (cleanBody.length > 2000) throw new Error("Comment is too long");

      const { error } = await (supabase.from("comments") as any).insert({
        user_id: user.id,
        series_id: seriesId,
        chapter_id: chapterId,
        parent_id: parentId,
        content: cleanBody || (attachmentType === "gif" ? "Shared a GIF" : "Shared an image"),
        attachment_type: attachmentType,
        attachment_url: attachmentUrl,
        attachment_alt: attachmentAlt,
        is_spoiler: spoiler,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.parentId ? "Reply posted" : "Comment posted");
      setContent("");
      setIsSpoiler(false);
      setAttachmentType(null);
      setAttachmentUrl(null);
      setAttachmentAlt(null);
      setReplyTo(null);
      setReplyContent("");
      setReplySpoiler(false);
      setReplyAttachmentType(null);
      setReplyAttachmentUrl(null);
      setReplyAttachmentAlt(null);
      qc.invalidateQueries({ queryKey: ["chapter-comments", chapterId] });
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      qc.invalidateQueries({ queryKey: ["chapter-comments", chapterId] });
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleCommentReaction = useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
    }: {
      commentId: string;
      reactionType: string;
    }) => {
      if (!user) throw new Error("Sign in to react");
      const hasReacted = reactionsQ.data?.mine.has(`${commentId}:${reactionType}`);

      if (hasReacted) {
        const { error } = await (supabase.from("comment_reactions") as any)
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        if (error) throw error;
        return;
      }

      const { error } = await (supabase.from("comment_reactions") as any).insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type: reactionType,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comment-reactions", chapterId] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const reportComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("Sign in to report");
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: "comment",
        target_id: commentId,
        reason: "Reported from chapter comments",
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Comment reported"),
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleSpoiler = (commentId: string) => {
    setRevealedSpoilers((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleAttachmentUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingAttachment(true);
      const url = await uploadCommentImage(file);
      setAttachmentType(file.type === "image/gif" ? "gif" : "image");
      setAttachmentUrl(url);
      setAttachmentAlt(file.name);
      toast.success("Media attached");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload media");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleReplyAttachmentUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setReplyUploadingAttachment(true);
      const url = await uploadCommentImage(file);
      setReplyAttachmentType(file.type === "image/gif" ? "gif" : "image");
      setReplyAttachmentUrl(url);
      setReplyAttachmentAlt(file.name);
      toast.success("Media attached");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload media");
    } finally {
      setReplyUploadingAttachment(false);
    }
  };

  const clearAttachment = () => {
    setAttachmentType(null);
    setAttachmentUrl(null);
    setAttachmentAlt(null);
  };

  const clearReplyAttachment = () => {
    setReplyAttachmentType(null);
    setReplyAttachmentUrl(null);
    setReplyAttachmentAlt(null);
  };

  const insertMarkdown = (
    textarea: HTMLTextAreaElement | null,
    value: string,
    setValue: (next: string) => void,
    before: string,
    after = before,
    fallback = "text",
  ) => {
    if (!textarea) {
      setValue(`${value}${before}${fallback}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const MarkdownToolbar = ({
    textarea,
    value,
    setValue,
    disabled,
  }: {
    textarea: HTMLTextAreaElement | null;
    value: string;
    setValue: (next: string) => void;
    disabled?: boolean;
  }) => (
    <div className="flex flex-wrap gap-1 rounded-md border border-border/40 bg-background/60 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Bold"
        onClick={() => insertMarkdown(textarea, value, setValue, "**", "**", "bold text")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Italic"
        onClick={() => insertMarkdown(textarea, value, setValue, "*", "*", "italic text")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Strikethrough"
        onClick={() => insertMarkdown(textarea, value, setValue, "~~", "~~", "struck text")}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Inline code"
        onClick={() => insertMarkdown(textarea, value, setValue, "`", "`", "code")}
      >
        <Code2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Color"
        onClick={() =>
          insertMarkdown(textarea, value, setValue, "[color=purple]", "[/color]", "colored text")
        }
      >
        <Palette className="h-4 w-4" />
      </Button>
      {Object.entries(COMMENT_TEXT_COLORS).map(([name, color]) => (
        <button
          key={name}
          type="button"
          className="h-8 w-8 rounded-md border border-border/50 p-1 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          title={`${name[0].toUpperCase()}${name.slice(1)}`}
          onClick={() =>
            insertMarkdown(textarea, value, setValue, `[color=${name}]`, "[/color]", "colored text")
          }
        >
          <span className="block h-full w-full rounded-sm" style={{ backgroundColor: color }} />
        </button>
      ))}
    </div>
  );

  const renderComment = (comment: ChapterComment, isReply = false) => {
    const profile = profilesQ.data?.get(comment.user_id);
    const reactionCounts = reactionsQ.data?.counts.get(comment.id) ?? {};
    const isOwnComment = user?.id === comment.user_id;
    const spoilerHidden = comment.is_spoiler && !revealedSpoilers.has(comment.id);

    return (
      <article
        key={comment.id}
        className={`${isReply ? "ml-8 border-l border-border/50 pl-4" : ""}`}
      >
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-xs font-bold text-primary">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (profile?.username ?? "U").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {profile?.username ?? "Reader"}
                  </span>
                  {comment.is_pinned && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      PINNED
                    </span>
                  )}
                  {comment.is_spoiler && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                      SPOILER
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.created_at)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {comment.is_spoiler && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleSpoiler(comment.id)}
                >
                  {spoilerHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => reportComment.mutate(comment.id)}
                disabled={!user || reportComment.isPending}
              >
                <Flag className="h-4 w-4" />
              </Button>
              {isOwnComment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteComment.mutate(comment.id)}
                  disabled={deleteComment.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          <div
            className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${spoilerHidden ? "select-none rounded bg-secondary p-3 text-transparent blur-sm" : ""}`}
          >
            {spoilerHidden ? comment.content : renderCommentMarkdown(comment.content)}
          </div>

          {comment.attachment_url && !spoilerHidden && (
            <a
              href={comment.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block max-w-sm overflow-hidden rounded-lg border border-border/50 bg-background"
            >
              <img
                src={comment.attachment_url}
                alt={
                  comment.attachment_alt ??
                  (comment.attachment_type === "gif" ? "Comment GIF" : "Comment image")
                }
                className="max-h-72 w-full object-contain"
                loading="lazy"
              />
            </a>
          )}

          {spoilerHidden && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 h-8"
              onClick={() => toggleSpoiler(comment.id)}
            >
              Show spoiler
            </Button>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {COMMENT_REACTIONS.map((reaction) => {
              const Icon = reaction.icon;
              const count = reactionCounts[reaction.type] ?? 0;
              const active = reactionsQ.data?.mine.has(`${comment.id}:${reaction.type}`);
              return (
                <button
                  key={reaction.type}
                  onClick={() =>
                    toggleCommentReaction.mutate({
                      commentId: comment.id,
                      reactionType: reaction.type,
                    })
                  }
                  className={`flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 hover:border-primary/60 hover:bg-primary/10"
                  }`}
                  title={reaction.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="mt-4 space-y-2">
              <Textarea
                ref={replyContentRef}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Write a reply..."
                className="min-h-20 resize-none"
              />
              {replyAttachmentUrl && (
                <div className="flex max-w-md gap-3 rounded-lg border border-border/50 bg-background p-2">
                  <img
                    src={replyAttachmentUrl}
                    alt={replyAttachmentAlt ?? "Reply attachment preview"}
                    className="h-16 w-20 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      {replyAttachmentType === "gif" ? (
                        <Film className="h-3.5 w-3.5" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                      {replyAttachmentType === "gif" ? "GIF attached" : "Image attached"}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {replyAttachmentAlt ?? replyAttachmentUrl}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={clearReplyAttachment}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid gap-2 rounded-lg border border-border/40 bg-background/60 p-2 md:grid-cols-[auto_1fr]">
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2"
                    disabled={!user || replyUploadingAttachment}
                  >
                    <label>
                      <ImageIcon className="h-4 w-4" />
                      {replyUploadingAttachment ? "Uploading" : "Image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        disabled={!user || replyUploadingAttachment}
                        onChange={(event) => {
                          void handleReplyAttachmentUpload(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <MarkdownToolbar
                  textarea={replyContentRef.current}
                  value={replyContent}
                  setValue={setReplyContent}
                  disabled={!user}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={replySpoiler}
                    onChange={(event) => setReplySpoiler(event.target.checked)}
                  />
                  Mark as spoiler
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={
                      createComment.isPending ||
                      replyUploadingAttachment ||
                      (replyContent.trim().length < 2 && !replyAttachmentUrl)
                    }
                    onClick={() =>
                      createComment.mutate({
                        body: replyContent,
                        parentId: comment.id,
                        spoiler: replySpoiler,
                        attachmentType: replyAttachmentType,
                        attachmentUrl: replyAttachmentUrl,
                        attachmentAlt: replyAttachmentAlt,
                      })
                    }
                  >
                    <Send className="h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isReply && (repliesByParent.get(comment.id) ?? []).length > 0 && (
          <div className="mt-3 space-y-3">
            {(repliesByParent.get(comment.id) ?? [])
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((reply) => renderComment(reply, true))}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="rounded-lg border border-border/50 bg-background/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5" />
            Comments
          </h3>
          <p className="text-sm text-muted-foreground">Discuss this chapter with other readers.</p>
        </div>
        <Select value={sort} onValueChange={(value: any) => setSort(value)}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-5 space-y-3 rounded-lg border border-border/50 bg-card p-3">
        <Textarea
          ref={contentRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={user ? "Share your thoughts..." : "Sign in to comment"}
          disabled={!user}
          className="min-h-24 resize-none"
        />

        {attachmentUrl && (
          <div className="flex max-w-md gap-3 rounded-lg border border-border/50 bg-background p-2">
            <img
              src={attachmentUrl}
              alt={attachmentAlt ?? "Comment attachment preview"}
              className="h-20 w-24 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {attachmentType === "gif" ? (
                  <Film className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {attachmentType === "gif" ? "GIF attached" : "Image attached"}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {attachmentAlt ?? attachmentUrl}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs"
                onClick={clearAttachment}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-3 rounded-lg border border-border/40 bg-background/60 p-3 md:grid-cols-[auto_1fr]">
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              disabled={!user || uploadingAttachment}
            >
              <label>
                <ImageIcon className="h-4 w-4" />
                {uploadingAttachment ? "Uploading" : "Image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={!user || uploadingAttachment}
                  onChange={(event) => {
                    void handleAttachmentUpload(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </Button>
          </div>

          <MarkdownToolbar
            textarea={contentRef.current}
            value={content}
            setValue={setContent}
            disabled={!user}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(event) => setIsSpoiler(event.target.checked)}
              disabled={!user}
            />
            Mark as spoiler
          </label>
          <Button
            className="gap-2"
            disabled={
              !user ||
              createComment.isPending ||
              uploadingAttachment ||
              (content.trim().length < 2 && !attachmentUrl)
            }
            onClick={() =>
              createComment.mutate({
                body: content,
                parentId: null,
                spoiler: isSpoiler,
                attachmentType,
                attachmentUrl,
                attachmentAlt,
              })
            }
          >
            <Send className="h-4 w-4" />
            Post Comment
          </Button>
        </div>
      </div>

      {commentsQ.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-4">{topLevelComments.map((comment) => renderComment(comment))}</div>
      ) : (
        <div className="rounded-lg border border-border/50 p-8 text-center text-muted-foreground">
          No comments yet. Be the first to start the discussion.
        </div>
      )}
    </section>
  );
}

function formatTimeAgo(date: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
