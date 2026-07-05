"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
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
import { renderCommentMarkdown, COMMENT_TEXT_COLORS } from "@/lib/bbcode";
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
import { safeUrlOrNull } from "@/lib/safe-url";
import NovelSettingsPanel from "@/components/NovelSettingsPanel";

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
    enabled: !!chapterQ.data,
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

      const rows = Array.isArray(data) ? data : data ? [data] : [];
      if (rows.length === 0) return;

      let invalidated = false;
      for (const row of rows) {
        if (!row) continue;
        if (row.source === "summary") {
          if (row.leveled_up) {
            toast.success(`Level up! You're now Level ${row.new_level}`);
          }
          continue;
        }
        if (!row.xp_gained || row.xp_gained <= 0) continue;
        invalidated = true;
        const label =
          row.source === "chapter_complete"
            ? "Chapter complete"
            : row.source === "caught_up"
            ? "Caught up to latest"
            : row.source === "series_complete"
            ? "Title finished"
            : "XP earned";
        toast.success(`+${row.xp_gained} XP — ${label}`, {
          description: row.description ?? undefined,
        });
      }

      if (invalidated) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["user-stats"] });
        qc.invalidateQueries({ queryKey: ["xp-history"] });
        qc.invalidateQueries({ queryKey: ["chapter-reader-counts"] });
        qc.invalidateQueries({ queryKey: ["read-chapters"] });
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
              illustrations={pagesQ.data?.map((p: any) => p.image_url) ?? []}
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
  illustrations = [],
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
  illustrations?: string[];
}) {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState("dark");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Load preferences from localStorage on client-side mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedSize = localStorage.getItem("novel-font-size");
      const storedFamily = localStorage.getItem("novel-font-family");
      const storedLineHeight = localStorage.getItem("novel-line-height");
      const storedTheme = localStorage.getItem("novel-theme");

      if (storedSize) setFontSize(parseInt(storedSize, 10));
      if (storedFamily) setFontFamily(storedFamily);
      if (storedLineHeight) setLineHeight(parseFloat(storedLineHeight));
      if (storedTheme) setTheme(storedTheme);
    } catch (e) {
      console.error("Failed to load novel preferences", e);
    }
  }, []);

  // Track page scroll progress for the top progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll position restoration for novels
  useEffect(() => {
    if (!chapterId || !content) return;

    const scrollKey = `chapter-scroll-${chapterId}`;

    const restoreScroll = () => {
      const savedPosition = localStorage.getItem(scrollKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        setTimeout(() => {
          window.scrollTo({ top: position, behavior: "instant" });
        }, 100);
      }
    };

    const saveScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(scrollKey, scrollTop.toString());
    };

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveScrollPosition, 150);
    };

    restoreScroll();
    window.addEventListener("scroll", handleScroll);

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

  // Determine content mode (HTML vs Plain Text split)
  const isHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(content), [content]);
  const plainTextParagraphs = useMemo(() => {
    if (isHtml) return [];
    return content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [content, isHtml]);

  // Map theme styles for background, text and borders
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "charcoal":
        return {
          bg: "bg-[#0f0f10]",
          text: "text-[#d0d0d0]",
          border: "border-neutral-800",
        };
      case "sepia":
        return {
          bg: "bg-[#f4ecd8]",
          text: "text-[#3c2a21]",
          border: "border-[#e4dcbf]",
        };
      case "slate":
        return {
          bg: "bg-[#0f172a]",
          text: "text-[#cbd5e1]",
          border: "border-slate-800",
        };
      case "dark":
      default:
        return {
          bg: "bg-black",
          text: "text-[#e5e5e5]",
          border: "border-neutral-900",
        };
    }
  }, [theme]);

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 pb-16 ${themeStyles.bg} ${themeStyles.text}`}>
      {/* Top Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-violet-600 transition-all duration-75 origin-left"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-10">
        <style dangerouslySetInnerHTML={{ __html: `
          .novel-body-text p {
            margin-bottom: 2rem !important;
            line-height: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            letter-spacing: -0.012em !important;
            word-spacing: -0.02em !important;
            text-align: justify !important;
            text-justify: inter-word !important;
          }
          .novel-body-text {
            line-height: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            letter-spacing: -0.012em !important;
            word-spacing: -0.02em !important;
            text-align: justify !important;
            text-justify: inter-word !important;
          }
        `}} />
        <article
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily:
              fontFamily === "serif"
                ? "Georgia, Cambria, 'Times New Roman', Times, serif"
                : fontFamily === "mono"
                ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                : "var(--font-barlow), system-ui, sans-serif",
          }}
        >
          <header className={`mb-8 border-b ${themeStyles.border} pb-6`}>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {seriesTitle || "Novel"} — Chapter {chapterNumber}
            </h1>
            <p className="text-muted-foreground text-sm">
              Read the full chapter online at vnrscans.
            </p>
          </header>

          {illustrations && illustrations.length > 0 && (
            <div className="mb-8 space-y-4">
              {illustrations.map((url, idx) => (
                <div key={idx} className="relative w-full max-h-[600px] overflow-hidden rounded-lg border border-border/40 bg-card/10 shadow-lg">
                  {url.toLowerCase().split("?")[0].endsWith(".mp4") ? (
                    <video
                      src={url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto max-h-[600px] object-contain mx-auto"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Illustration ${idx + 1}`}
                      className="w-full h-auto max-h-[600px] object-contain mx-auto"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isHtml ? (
            <div 
              className="novel-body-text whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="novel-body-text space-y-6">
              {plainTextParagraphs.map((p, i) => (
                <p key={i}>
                  {p}
                </p>
              ))}
            </div>
          )}
        </article>

        {/* Chapter Navigation Buttons - Above Reactions */}
        <div className={`mt-10 border-t ${themeStyles.border} pt-6`}>
          <ChapterNavigation
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={onPrev}
            onNext={onNext}
            seriesSlug={seriesSlug}
          />
        </div>

        <div className={`mt-8 border-t ${themeStyles.border} pt-6`}>
          <ChapterReactions chapterId={chapterId} seriesId={seriesId} />
        </div>
      </div>

      {/* Typography & Color Theme panel */}
      <NovelSettingsPanel
        fontSize={fontSize}
        setFontSize={(size) => {
          setFontSize(size);
          localStorage.setItem("novel-font-size", size.toString());
        }}
        fontFamily={fontFamily}
        setFontFamily={(family) => {
          setFontFamily(family);
          localStorage.setItem("novel-font-family", family);
        }}
        lineHeight={lineHeight}
        setLineHeight={(height) => {
          setLineHeight(height);
          localStorage.setItem("novel-line-height", height.toString());
        }}
        theme={theme}
        setTheme={(newTheme) => {
          setTheme(newTheme);
          localStorage.setItem("novel-theme", newTheme);
        }}
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

  // Reaction emojis mapped to database check constraint values
  const reactions = [
    { type: "star", emoji: "👑", label: "GOAT" },
    { type: "thumbs_up", emoji: "🔥", label: "Hype" },
    { type: "laugh", emoji: "😱", label: "Plot Twist" },
    { type: "smile", emoji: "🤡", label: "Fraud" },
    { type: "heart", emoji: "😭", label: "Peak Fiction" },
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
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🏆 Chapter Hype & Reactions</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          {reactions.map((reaction) => {
            const count = reactionsQ.data?.[reaction.type] || 0;
            const hasReacted = userReactionsQ.data?.includes(reaction.type);

            return (
              <button
                key={reaction.type}
                onClick={() => toggleReaction.mutate(reaction.type)}
                disabled={toggleReaction.isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  hasReacted
                    ? "bg-primary/20 border-primary text-primary font-bold shadow-md scale-105"
                    : "bg-card/60 border-border/60 hover:bg-primary/10 hover:border-primary/50 text-foreground"
                }`}
                title={reaction.label}
              >
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wide">{reaction.label}</span>
                <span className="text-xs font-mono font-bold bg-secondary/80 px-1.5 py-0.5 rounded-md text-muted-foreground">{count}</span>
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
  avatar_frame?: string | null;
  accent_color?: string | null;
  user_level?: number | null;
  is_vip?: boolean | null;
  earned_tag?: string | null;
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

// Comment parsing and markdown rendering imported from @/lib/bbcode

function CommentAvatarFrame({
  avatarUrl,
  avatarFrame,
  accentColor,
  username,
  size = 36,
}: {
  avatarUrl?: string | null;
  avatarFrame: string | null;
  accentColor: string | null;
  username?: string | null;
  size?: number;
}) {
  const borderWidth = avatarFrame === "creator" ? 3 : 2; // px
  const innerSize = size - borderWidth * 2;

  const getFrameGradient = () => {
    switch (avatarFrame) {
      case "neon": return "conic-gradient(from 0deg, #A855F7, #06B6D4, #EC4899, #A855F7)";
      case "gold": return "conic-gradient(from 0deg, #a67c00, #ffd700, #ffeb99, #ffd700, #a67c00)";
      case "cyber": return "conic-gradient(from 0deg, #0ea5e9, transparent 30%, #c084fc, transparent 60%, #0ea5e9)";
      case "fire": return "conic-gradient(from 0deg, #b91c1c, #f97316, #ef4444, #b91c1c)";
      case "sakura": return "conic-gradient(from 0deg, #FDA4AF, #F472B6, #E879F9, #FDA4AF)";
      case "shadow": return "conic-gradient(from 0deg, #4f46e5, #06b6d4, #1e1b4b, #4f46e5)";
      case "qi": return "conic-gradient(from 0deg, #059669, #10B981, #FBBF24, #059669)";
      case "asura": return "conic-gradient(from 0deg, #ef4444, #7f1d1d, #ef4444)";
      case "system": return "conic-gradient(from 0deg, #06B6D4, transparent 30%, #06B6D4 50%, transparent 70%, #06B6D4)";
      case "abyss": return "conic-gradient(from 0deg, #D946EF, #4A044E, #3B0764, #D946EF)";
      case "glitch": return "conic-gradient(from 0deg, #ef4444, #06b6d4, #ef4444)";
      case "divine": return "conic-gradient(from 0deg, #FCD34D, #FFFFFF, #FFFBEB, #FCD34D)";
      case "creator": return `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor}80, transparent, ${accentColor})`;
      default: return accentColor || "#8B5CF6";
    }
  };

  const getFrameGlow = () => {
    switch (avatarFrame) {
      case "neon": return "0 0 8px rgba(168,85,247,0.5), 0 0 16px rgba(6,182,212,0.3)";
      case "gold": return "0 0 8px rgba(255,215,0,0.5), 0 0 14px rgba(255,215,0,0.25)";
      case "cyber": return "0 0 8px rgba(6,182,212,0.5), 0 0 14px rgba(192,132,252,0.25)";
      case "fire": return "0 0 10px rgba(239,68,68,0.6), 0 0 16px rgba(249,115,22,0.3)";
      case "sakura": return "0 0 8px rgba(244,114,182,0.5), 0 0 14px rgba(233,121,249,0.25)";
      case "shadow": return "0 0 10px rgba(99,102,241,0.6), 0 0 16px rgba(6,182,212,0.2)";
      case "qi": return "0 0 8px rgba(16,185,129,0.5), 0 0 14px rgba(251,191,36,0.25)";
      case "asura": return "0 0 10px rgba(239,68,68,0.7), 0 0 18px rgba(127,29,29,0.4)";
      case "system": return "0 0 8px rgba(6,182,212,0.6), 0 0 14px rgba(6,182,212,0.3)";
      case "abyss": return "0 0 10px rgba(217,70,239,0.6), 0 0 16px rgba(139,92,246,0.3)";
      case "glitch": return "0 0 8px rgba(239,68,68,0.5), 0 0 14px rgba(6,182,212,0.3)";
      case "divine": return "0 0 10px rgba(252,211,77,0.6), 0 0 16px rgba(255,255,255,0.3)";
      case "creator": return `0 0 10px ${accentColor}, 0 0 16px ${accentColor}50`;
      default: return `0 0 6px ${(accentColor || "#8B5CF6")}40`;
    }
  };

  const isAnimated = avatarFrame && avatarFrame !== "none";
  const animSpeed = avatarFrame === "fire" ? "1.5s" : avatarFrame === "neon" ? "2s" : avatarFrame === "abyss" ? "4.5s" : avatarFrame === "glitch" ? "1.2s" : "3s";

  return (
    <div
      className="relative rounded-full flex items-center justify-center flex-shrink-0"
      style={{ 
        width: size, 
        height: size,
        boxShadow: isAnimated ? getFrameGlow() : undefined,
      }}
    >
      {/* Rotating frame border */}
      {isAnimated && (
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ 
            background: getFrameGradient(),
            animation: `navRotCW ${animSpeed} linear infinite`,
          }} 
        />
      )}
      {/* Static frame border for "none" */}
      {!isAnimated && (
        <div 
          className="absolute inset-0 rounded-full border border-border/80" 
          style={{ background: accentColor || "transparent" }} 
        />
      )}
      {/* Inner background mask */}
      <div 
        className="absolute rounded-full bg-card" 
        style={{ 
          inset: isAnimated ? borderWidth : 0,
        }} 
      />

      {/* Avatar image or initial */}
      <div 
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-card z-10"
        style={{ 
          width: isAnimated ? innerSize : size, 
          height: isAnimated ? innerSize : size,
          animation: isAnimated ? `navPulse 4s ease-in-out infinite` : undefined,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username || "Profile"}
            width={innerSize}
            height={innerSize}
            className="h-full w-full object-cover rounded-full"
            decoding="async"
          />
        ) : (
          <div 
            className="h-full w-full flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${(accentColor || "#8B5CF6")}30, ${(accentColor || "#8B5CF6")}10)`,
              color: accentColor || "#8B5CF6",
            }}
          >
            {username?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>

      {/* Cyber brackets overlay */}
      {avatarFrame === "cyber" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20 animate-[navGlitch_6s_infinite]">
          <div className="absolute top-0 left-0 h-1 w-1 border-t border-l border-cyan-400 rounded-tl-sm" style={{ boxShadow: '0 0 2px cyan' }} />
          <div className="absolute top-0 right-0 h-1 w-1 border-t border-r border-cyan-400 rounded-tr-sm" style={{ boxShadow: '0 0 2px cyan' }} />
          <div className="absolute bottom-0 left-0 h-1 w-1 border-b border-l border-cyan-400 rounded-bl-sm" style={{ boxShadow: '0 0 2px cyan' }} />
          <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-cyan-400 rounded-br-sm" style={{ boxShadow: '0 0 2px cyan' }} />
        </div>
      )}

      {/* Glitch temporal overlay */}
      {avatarFrame === "glitch" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20 animate-[navGlitch_4s_infinite]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500 shadow-[0_0_2px_red]" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_2px_cyan]" />
        </div>
      )}

      {/* Divine stars tiny */}
      {avatarFrame === "divine" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-yellow-300 z-20 animate-pulse" style={{ fontSize: '6px' }}>
          ✨
        </div>
      )}

      {/* System S-RANK mini badge */}
      {avatarFrame === "system" && (
        <div className="absolute -top-0.5 -right-0.5 z-30 bg-slate-950 border border-cyan-400 text-cyan-400 text-[4px] font-black px-0.5 rounded leading-tight" style={{ boxShadow: '0 0 3px rgba(6,182,212,0.7)' }}>
          S
        </div>
      )}

      {/* Fire ember dot */}
      {avatarFrame === "fire" && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-orange-500 z-20 animate-pulse" style={{ boxShadow: '0 0 3px #ef4444' }} />
      )}

      {/* Gold crown tiny */}
      {avatarFrame === "gold" && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-400 z-20" style={{ fontSize: '7px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
          👑
        </div>
      )}

      {/* Creator crown tiny */}
      {avatarFrame === "creator" && (
        <div className="absolute -top-1.2 left-1/2 -translate-x-1/2 text-amber-400 z-20" style={{ fontSize: '7px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))', color: accentColor || undefined }}>
          👑
        </div>
      )}
    </div>
  );
}

function ChapterComments({ chapterId, seriesId }: { chapterId: string; seriesId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const currentUserProfile = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url,avatar_frame,accent_color,username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
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

      const [profilesRes, rolesRes, badgesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id,username,avatar_url,avatar_frame,accent_color,user_level,is_vip")
          .in("user_id", userIds),
        supabase
          .from("user_roles")
          .select("user_id,role")
          .in("user_id", userIds),
        supabase
          .from("user_badges")
          .select("user_id,is_equipped,badge:badge_id(name,color)")
          .in("user_id", userIds)
          .eq("is_equipped", true),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const rolesMap = new Map<string, string[]>();
      (rolesRes.data ?? []).forEach((r: any) => {
        const existing = rolesMap.get(r.user_id) ?? [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const equippedBadgeMap = new Map<string, string>();
      (badgesRes.data ?? []).forEach((b: any) => {
        if (b.badge?.name) {
          equippedBadgeMap.set(b.user_id, b.badge.name);
        }
      });

      const profileMap = new Map<string, CommentProfile>();
      (profilesRes.data ?? []).forEach((profile) => {
        const uRoles = rolesMap.get(profile.user_id) ?? [];
        let tag: string | null = null;

        if (uRoles.includes("creator")) {
          tag = "Creator";
        } else if (uRoles.includes("admin")) {
          tag = "Admin";
        } else if (equippedBadgeMap.has(profile.user_id)) {
          tag = equippedBadgeMap.get(profile.user_id)!;
        }

        profileMap.set(profile.user_id, {
          ...profile,
          earned_tag: tag,
        } as CommentProfile);
      });

      return profileMap;
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

  // Auto scroll to target comment from URL hash
  useEffect(() => {
    if (!commentsQ.isLoading && commentsQ.data && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#comment-")) {
        const id = hash.replace("#comment-", "");
        const timer = setTimeout(() => {
          const element = document.getElementById(`comment-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-1000");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 3000);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [commentsQ.isLoading, commentsQ.data]);

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
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
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
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["xp-history"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
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

  const renderComment = (comment: ChapterComment, isReply = false, isLastReply = false) => {
    const profile = profilesQ.data?.get(comment.user_id);
    const reactionCounts = reactionsQ.data?.counts.get(comment.id) ?? {};
    const isOwnComment = user?.id === comment.user_id;
    const spoilerHidden = comment.is_spoiler && !revealedSpoilers.has(comment.id);

    return (
      <article
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`${isReply ? "ml-6 pl-5 relative" : ""}`}
      >
        {isReply && (
          <>
            {/* Curved Connector Elbow */}
            <div className="absolute left-0 top-0 w-5 h-[34px] border-l-2 border-b-2 border-border/25 rounded-bl-xl pointer-events-none" />
            {/* Vertical thread continuation */}
            {!isLastReply && (
              <div className="absolute left-0 top-[34px] bottom-0 w-[2px] bg-border/25 pointer-events-none" />
            )}
          </>
        )}
        <div 
          className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:shadow-md"
          style={{
            borderLeft: profile?.accent_color ? `3px solid ${profile.accent_color}` : undefined
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0">
                <CommentAvatarFrame
                  avatarUrl={profile?.avatar_url}
                  avatarFrame={profile?.avatar_frame || 'none'}
                  accentColor={profile?.accent_color || '#8B5CF6'}
                  username={profile?.username}
                  size={36}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    className="truncate text-sm font-semibold hover:underline cursor-pointer transition-colors"
                    style={{ color: profile?.accent_color || undefined }}
                    onClick={() => navigate({ to: "/user/$username", params: { username: profile?.username || "" } })}
                  >
                    {profile?.username ?? "Reader"}
                  </span>
                  
                  {profile?.earned_tag && (
                    <span 
                      className="rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/40 font-black text-[9px] tracking-wider px-1.5 py-0.5 uppercase shadow-sm"
                      style={{
                        borderColor: profile.accent_color ? `${profile.accent_color}60` : undefined,
                        color: profile.accent_color || undefined,
                      }}
                    >
                      {profile.earned_tag}
                    </span>
                  )}

                  {profile?.user_level && (
                    <span className="rounded-full bg-secondary/80 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground border border-border/20">
                      Lvl {profile.user_level}
                    </span>
                  )}
                  
                  {profile?.is_vip && (
                    <span className="rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[8px] tracking-wider px-1.5 py-0.5 uppercase shadow-sm">
                      VIP
                    </span>
                  )}
                  
                  {comment.is_pinned && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                      PINNED
                    </span>
                  )}
                  {comment.is_spoiler && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 border border-amber-500/20">
                      SPOILER
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTimeAgo(comment.created_at)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {comment.is_spoiler && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => toggleSpoiler(comment.id)}
                  title={spoilerHidden ? "Show spoiler" : "Hide spoiler"}
                >
                  {spoilerHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                onClick={() => reportComment.mutate(comment.id)}
                disabled={!user || reportComment.isPending}
                title="Report comment"
              >
                <Flag className="h-4 w-4" />
              </Button>
              {isOwnComment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => deleteComment.mutate(comment.id)}
                  disabled={deleteComment.isPending}
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div
            className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${spoilerHidden ? "select-none rounded bg-secondary p-3 text-transparent blur-sm" : ""}`}
          >
            {spoilerHidden ? comment.content : renderCommentMarkdown(comment.content)}
          </div>

          {comment.attachment_url && !spoilerHidden && (() => {
            // Only render as a clickable link when the URL has a safe scheme.
            // This prevents stored XSS via javascript: URIs injected into
            // attachment_url.
            const safeAttachmentUrl = safeUrlOrNull(comment.attachment_url);
            if (!safeAttachmentUrl) return null;
            return (
            <a
              href={safeAttachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block max-w-sm overflow-hidden rounded-lg border border-border/50 bg-background"
            >
              <img
                src={safeAttachmentUrl}
                alt={
                  comment.attachment_alt ??
                  (comment.attachment_type === "gif" ? "Comment GIF" : "Comment image")
                }
                className="max-h-72 w-full object-contain"
                loading="lazy"
              />
            </a>
            );
          })()}

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
                  className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                      : "border-border/50 bg-background/30 hover:border-border hover:bg-muted/40 hover:text-foreground text-muted-foreground"
                  }`}
                  title={reaction.label}
                >
                  <Icon className={`h-3.5 w-3.5 transition-transform duration-200 ${active ? "scale-110" : "hover:scale-110"}`} />
                  {count > 0 && <span className="font-semibold">{count}</span>}
                </button>
              );
            })}

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs rounded-full hover:bg-muted/50 transition-colors"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="mt-4 rounded-xl border border-border/50 bg-card/60 p-3 transition-all duration-300 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 focus-within:shadow-[0_0_12px_rgba(139,92,246,0.15)]">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 mt-1">
                  <CommentAvatarFrame
                    avatarUrl={currentUserProfile.data?.avatar_url}
                    avatarFrame={currentUserProfile.data?.avatar_frame || 'none'}
                    accentColor={currentUserProfile.data?.accent_color || '#8B5CF6'}
                    username={currentUserProfile.data?.username || user?.email}
                    size={28}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Textarea
                    ref={replyContentRef}
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-16 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed"
                  />
                </div>
              </div>

              {replyAttachmentUrl && (
                <div className="mt-2 flex max-w-md gap-3 rounded-lg border border-border/50 bg-background/70 p-2">
                  <img
                    src={replyAttachmentUrl}
                    alt={replyAttachmentAlt ?? "Reply attachment preview"}
                    className="h-14 w-16 rounded-md object-cover"
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
                      className="mt-1 h-6 px-2 text-xs"
                      onClick={clearReplyAttachment}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 gap-2 bg-background/50 hover:bg-background transition-colors text-[10px] cursor-pointer"
                    disabled={!user || replyUploadingAttachment}
                  >
                    <label className="cursor-pointer">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {replyUploadingAttachment ? "Uploading" : "Attach Image"}
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
                  
                  <MarkdownToolbar
                    textarea={replyContentRef.current}
                    value={replyContent}
                    setValue={setReplyContent}
                    disabled={!user}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={replySpoiler}
                      onChange={(event) => setReplySpoiler(event.target.checked)}
                      className="rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    Mark as spoiler
                  </label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyTo(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-2 px-3 text-xs cursor-pointer"
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
                      <Send className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isReply && (repliesByParent.get(comment.id) ?? []).length > 0 && (
          <div className="mt-3 space-y-3">
            {(repliesByParent.get(comment.id) ?? [])
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((reply, index, arr) => renderComment(reply, true, index === arr.length - 1))}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-background/35 backdrop-blur-md p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comments
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Discuss this chapter with other readers.</p>
        </div>
        <Select value={sort} onValueChange={(value: any) => setSort(value)}>
          <SelectTrigger className="h-9 w-[130px] bg-background/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 rounded-xl border border-border/50 bg-card/60 p-4 transition-all duration-300 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 focus-within:shadow-[0_0_12px_rgba(139,92,246,0.15)] relative z-10">
        <div className="flex gap-4 items-start">
          {/* Active User Avatar with Frame */}
          <div className="shrink-0 mt-1">
            <CommentAvatarFrame
              avatarUrl={currentUserProfile.data?.avatar_url}
              avatarFrame={currentUserProfile.data?.avatar_frame || 'none'}
              accentColor={currentUserProfile.data?.accent_color || '#8B5CF6'}
              username={currentUserProfile.data?.username || user?.email}
              size={36}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <Textarea
              ref={contentRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={user ? "Share your thoughts..." : "Sign in to comment"}
              disabled={!user}
              className="min-h-20 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Attachment preview area */}
        {attachmentUrl && (
          <div className="mt-3 flex max-w-md gap-3 rounded-lg border border-border/50 bg-background/70 p-2">
            <img
              src={attachmentUrl}
              alt={attachmentAlt ?? "Comment attachment preview"}
              className="h-16 w-20 rounded-md object-cover"
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
                className="mt-1.5 h-6 px-2 text-xs"
                onClick={clearAttachment}
              >
                <X className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-2 bg-background/50 hover:bg-background transition-colors text-xs cursor-pointer"
              disabled={!user || uploadingAttachment}
            >
              <label className="cursor-pointer">
                <ImageIcon className="h-3.5 w-3.5" />
                {uploadingAttachment ? "Uploading" : "Attach Image"}
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
            
            <MarkdownToolbar
              textarea={contentRef.current}
              value={content}
              setValue={setContent}
              disabled={!user}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(event) => setIsSpoiler(event.target.checked)}
                className="rounded border-border bg-background text-primary focus:ring-primary"
                disabled={!user}
              />
              Mark as spoiler
            </label>
            <Button
              className="h-8 gap-2 px-4 text-xs font-semibold shadow-md shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
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
              <Send className="h-3.5 w-3.5" />
              Post Comment
            </Button>
          </div>
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
