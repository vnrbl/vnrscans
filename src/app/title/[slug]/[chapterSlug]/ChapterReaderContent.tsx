"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef, useMemo, useCallback, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  ArrowDown,
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
  Sparkles,
  Flame,
  Download,
  CheckCircle2,
  Loader2,
  SunMoon,
  Search,
  Lock,
  Unlock,
  ExternalLink,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderCommentMarkdown, COMMENT_TEXT_COLORS } from "@/lib/bbcode";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LiveWebGifPicker } from "@/components/comments/LiveWebGifPicker";
import { saveChapterReadingPosition, getChapterReadingPosition } from "@/lib/reading-position";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { isChapterSavedOffline, saveChapterOffline } from "@/lib/offlineStorage";
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
import { safeUrlOrNull, serializeAttachmentUrls, parseSafeAttachmentUrls } from "@/lib/safe-url";
import { CommentAttachmentGrid } from "@/components/comments/CommentAttachmentGrid";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import NovelSettingsPanel from "@/components/NovelSettingsPanel";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split("?")[0];
  return cleanUrl.endsWith(".mp4");
};

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

export default function Reader({
  slug,
  chapterSlug,
  initialChapterData,
  initialPagesData,
  initialSiblingsData,
}: {
  slug: string;
  chapterSlug: string;
  initialChapterData?: any;
  initialPagesData?: any[];
  initialSiblingsData?: any[];
}) {
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

  // Eye-comfort filter sync
  const { settings, updateSettings } = useReaderSettings();
  const currentFilter = settings.readingFilter || "normal";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("reader-filter-oled", "reader-filter-warm", "reader-filter-dim");
    if (currentFilter !== "normal") {
      root.classList.add(`reader-filter-${currentFilter}`);
    }
    return () => {
      root.classList.remove("reader-filter-oled", "reader-filter-warm", "reader-filter-dim");
    };
  }, [currentFilter]);

  const cycleFilter = () => {
    const filters: Array<"normal" | "warm" | "oled" | "dim"> = ["normal", "warm", "oled", "dim"];
    const nextIdx = (filters.indexOf(currentFilter) + 1) % filters.length;
    const nextFilter = filters[nextIdx];
    updateSettings({ readingFilter: nextFilter });
    toast.info(`Eye Comfort: ${nextFilter.toUpperCase()}`, { duration: 1500 });
  };

  // Offline chapter download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  // Admin & staff role check
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canManage = isAdmin || isMod || isUploader;

  const [adminViewBypassed, setAdminViewBypassed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && initialChapterData?.id) {
      return sessionStorage.getItem(`admin-view-${initialChapterData.id}`) === "true";
    }
    return false;
  });

  const handleViewAsAdmin = useCallback((chapterId: string, chapterNumber: number) => {
    if (typeof window !== "undefined" && chapterId) {
      sessionStorage.setItem(`admin-view-${chapterId}`, "true");
    }
    setAdminViewBypassed(true);
    // Force immediate refetch of chapter pages for admin preview
    qc.invalidateQueries({ queryKey: ["pages"] });
    qc.refetchQueries({ queryKey: ["pages", chapterId] });
    toast.success(`Admin view enabled for Chapter ${chapterNumber}!`, {
      description: "You are viewing as admin. This chapter remains locked for regular visitors.",
    });
  }, [qc]);

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
    initialData: initialChapterData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  const pagesQ = useQuery({
    queryKey: ["pages", chapterQ.data?.id],
    queryFn: async () => {
      if (!chapterQ.data?.id) return [];
      const { data, error } = await supabase
        .from("chapter_pages")
        .select("id,page_number,image_url")
        .eq("chapter_id", chapterQ.data.id)
        .order("page_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data?.id,
    initialData: initialPagesData && initialPagesData.length > 0 ? initialPagesData : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Automatically trigger refetch if chapter is loaded but pages array is empty
  useEffect(() => {
    if (chapterQ.data?.id && !pagesQ.isLoading && (!pagesQ.data || pagesQ.data.length === 0)) {
      pagesQ.refetch();
    }
  }, [chapterQ.data?.id, pagesQ.data, pagesQ.isLoading, pagesQ.refetch]);

  const activeScanlationGroup = chapterQ.data?.scanlation_group ?? null;

  const siblingsQ = useQuery({
    queryKey: ["chapter-siblings", chapterQ.data?.series?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,chapter_number,scanlation_group")
        .eq("series_id", chapterQ.data!.series!.id)
        .in("status", ["published", "scheduled"])
        .order("chapter_number", { ascending: true });

      if (error) {
        throw error;
      }
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series?.id,
    initialData: initialSiblingsData,
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
        .in("status", ["published", "scheduled"])
        .order("scanlation_group", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series_id && chapterQ.data?.chapter_number != null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  useEffect(() => {
    if (chapterQ.data?.id) {
      setIsDownloaded(isChapterSavedOffline(chapterQ.data.id));
    }
  }, [chapterQ.data?.id]);

  const handleDownload = async () => {
    if (!chapterQ.data || !pagesQ.data || pagesQ.data.length === 0) {
      toast.error("Chapter pages still loading. Please wait.");
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await saveChapterOffline(chapterQ.data, pagesQ.data, (percent) => {
        setDownloadProgress(percent);
      });
      setIsDownloaded(true);
      toast.success("💾 Chapter Saved Offline!", {
        description: `All ${pagesQ.data.length} pages are ready for reading without internet.`,
      });
    } catch (err: any) {
      toast.error("Failed to save chapter offline", { description: err?.message });
    } finally {
      setIsDownloading(false);
    }
  };

  // Top-level Scroll Management on Chapter Change:
  // - New/Unvisited chapters: start cleanly from top (0)
  // - Previously visited chapters: resume from where the reader left off
  const activeChapterIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!chapterQ.data?.id) return;
    const chId = chapterQ.data.id;

    if (activeChapterIdRef.current !== chId) {
      activeChapterIdRef.current = chId;

      const savedPos = getChapterReadingPosition(chId);
      const hasProgress =
        savedPos &&
        ((savedPos.pageIndex != null && savedPos.pageIndex > 0) ||
          savedPos.scrollTop > 80 ||
          (savedPos.scrollRatio && savedPos.scrollRatio > 0.04));

      if (!hasProgress) {
        // Immediate clean start from top
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (typeof document !== "undefined") {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }
    }
  }, [chapterQ.data?.id, chapterSlug]);

  // Save reading history with scroll progress
  useEffect(() => {
    if (!chapterQ.data) return;
    const ch = chapterQ.data;

    // Update reading progress based on scroll position.
    // Note: Per user directive, a chapter is ONLY added to reading history once completed at least 50%.
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      const progress =
        scrollHeight > 0 ? Math.min(Math.round(scrollRatio * 100), 100) : 0;

      if (progress > 0) {
        const lastLocalProgress = parseInt(
          localStorage.getItem(`chapter-progress-${ch.id}`) || "0",
          10
        );
        if (Math.abs(progress - lastLocalProgress) >= 3 || lastLocalProgress === 0) {
          localStorage.setItem(`chapter-progress-${ch.id}`, progress.toString());
        }
      }

      if (user && progress >= 50) {
        // Only update database if progress has changed significantly (every 5%) or first reaching 50%
        const lastDbProgress = parseInt(
          localStorage.getItem(`chapter-db-progress-${ch.id}`) || "0",
          10
        );
        if (Math.abs(progress - lastDbProgress) >= 5 || lastDbProgress < 50) {
          localStorage.setItem(`chapter-db-progress-${ch.id}`, progress.toString());
          supabase
            .from("reading_history")
            .upsert(
              {
                user_id: user.id,
                series_id: ch.series_id,
                chapter_id: ch.id,
                progress: progress,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,chapter_id" } as any,
            )
            .then(() => {});
        }
      }
    };

    let progressTimeout: NodeJS.Timeout;
    const handleProgressUpdate = () => {
      clearTimeout(progressTimeout);
      progressTimeout = setTimeout(updateProgress, 300);
    };

    window.addEventListener("scroll", handleProgressUpdate, { passive: true });

    return () => {
      clearTimeout(progressTimeout);
      window.removeEventListener("scroll", handleProgressUpdate);
      // Final progress update when leaving
      updateProgress();
    };
  }, [user, chapterQ.data, seriesSlug]);

  // Award Qi strictly once at the very end/last of the chapter.
  const xpAwardedRef = useRef<string | null>(null);
  const awardXp = useCallback(async () => {
    if (!user || !chapterQ.data) return;
    const chapterId = chapterQ.data.id;
    if (xpAwardedRef.current === chapterId) return;
    xpAwardedRef.current = chapterId;

    const { data, error } = await supabase.rpc("award_chapter_completion_xp", {
      _chapter_id: chapterId,
    });
    if (error) return;

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
          : "Qi gathered";
      toast.success(`+${row.xp_gained} Qi — ${label}`, {
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

    // Synchronize reading history to all sister scan sources with the same chapter number in this series
    const chNum = chapterQ.data?.chapter_number;
    const chSeriesId = chapterQ.data?.series_id;
    if (chNum != null && chSeriesId) {
      supabase
        .from("chapters")
        .select("id")
        .eq("series_id", chSeriesId)
        .eq("chapter_number", chNum)
        .then(({ data: sisterChapters }) => {
          if (sisterChapters && sisterChapters.length > 1) {
            const sisterRows = sisterChapters
              .filter((sc) => sc.id !== chapterId)
              .map((sc) => ({
                user_id: user.id,
                series_id: chSeriesId,
                chapter_id: sc.id,
                progress: 100,
                xp_awarded: true,
                updated_at: new Date().toISOString(),
              }));
            if (sisterRows.length > 0) {
              supabase.from("reading_history").upsert(sisterRows, { onConflict: "user_id,chapter_id" } as any).then(() => {});
            }
          }
        });
    }
  }, [user, chapterQ.data, qc]);

  useEffect(() => {
    if (!user || !chapterQ.data) return;

    // Check if user has reached the very bottom/end of the chapter
    const checkCompletion = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Only check when content has fully loaded and rendered
      if (scrollHeight > 400) {
        const reachedBottom = (scrollTop >= scrollHeight - 120) || ((scrollTop / scrollHeight) * 100 >= 98.5);
        if (reachedBottom) {
          awardXp();
        }
      }
    };

    // IntersectionObserver strictly on the end-of-chapter anchor element
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              awardXp();
            }
          }
        },
        { rootMargin: "0px 0px 50px 0px" }
      );

      const anchor = document.getElementById("chapter-bottom-completion-anchor");
      if (anchor) {
        observer.observe(anchor);
      }
    }

    window.addEventListener("scroll", checkCompletion, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", checkCompletion);
    };
  }, [user, chapterQ.data, awardXp]);


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

  const { prev, next } = useMemo(() => {
    const siblings = siblingsQ.data ?? [];
    const currentNum = chapterQ.data?.chapter_number;

    if (siblings.length === 0 || currentNum == null || isNaN(currentNum)) {
      const idx = siblings.findIndex((c) => c.slug === chapterSlug);
      const p = idx > 0 ? siblings[idx - 1] : null;
      const n = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
      return { prev: p, next: n };
    }

    const normGroup = (g?: string | null) => g?.trim().toLowerCase() || null;
    const currentGroup = normGroup(activeScanlationGroup);

    // Candidates strictly greater than current chapter number (never same chapter!)
    const greater = siblings.filter(
      (c) => typeof c.chapter_number === "number" && c.chapter_number > currentNum
    );
    // Candidates strictly lesser than current chapter number (never same chapter!)
    const lesser = siblings.filter(
      (c) => typeof c.chapter_number === "number" && c.chapter_number < currentNum
    );

    let nextChapter: (typeof siblings)[0] | null = null;
    if (greater.length > 0) {
      const minNextNum = Math.min(...greater.map((c) => c.chapter_number));
      const candidates = greater.filter((c) => c.chapter_number === minNextNum);
      // Prefer same scanlation group, fallback to first available
      nextChapter = candidates.find((c) => normGroup(c.scanlation_group) === currentGroup) ?? candidates[0];
    }

    let prevChapter: (typeof siblings)[0] | null = null;
    if (lesser.length > 0) {
      const maxPrevNum = Math.max(...lesser.map((c) => c.chapter_number));
      const candidates = lesser.filter((c) => c.chapter_number === maxPrevNum);
      // Prefer same scanlation group, fallback to first available
      prevChapter = candidates.find((c) => normGroup(c.scanlation_group) === currentGroup) ?? candidates[0];
    }

    return { prev: prevChapter, next: nextChapter };
  }, [siblingsQ.data, chapterQ.data?.chapter_number, chapterSlug, activeScanlationGroup]);

  // Clean deduplicated chapter list for drawer and top bar dropdown (one entry per chapter number)
  const navChapters = useMemo(() => {
    const raw = siblingsQ.data ?? [];
    if (raw.length === 0) return [];

    const normGroup = (g?: string | null) => g?.trim().toLowerCase() || null;
    const currentGroup = normGroup(activeScanlationGroup);

    const map = new Map<number, (typeof raw)[0]>();
    const sorted = [...raw].sort((a, b) => a.chapter_number - b.chapter_number);

    for (const ch of sorted) {
      const existing = map.get(ch.chapter_number);
      if (!existing) {
        map.set(ch.chapter_number, ch);
        continue;
      }
      // Always keep the current chapter being read
      if (ch.slug === chapterSlug) {
        map.set(ch.chapter_number, ch);
        continue;
      }
      // Otherwise prefer active scanlation group
      if (existing.slug !== chapterSlug) {
        const existingMatches = normGroup(existing.scanlation_group) === currentGroup;
        const chMatches = normGroup(ch.scanlation_group) === currentGroup;
        if (!existingMatches && chMatches) {
          map.set(ch.chapter_number, ch);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.chapter_number - b.chapter_number);
  }, [siblingsQ.data, chapterSlug, activeScanlationGroup]);

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

                  // 🚀 Zero-Wait Smart Image Preloader:
                  // Preload top 4 images into browser image cache so next chapter paints in 0ms!
                  if (pageData && typeof window !== "undefined") {
                    pageData.slice(0, 4).forEach((p) => {
                      if (p.image_url) {
                        const img = new window.Image();
                        img.src = p.image_url;
                      }
                    });
                  }

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

    // Start hardware-synced 60/120fps auto-scrolling
    let lastTime = performance.now();
    let isRunning = true;

    const tick = (now: number) => {
      if (!isRunning) return;
      const delta = Math.min(now - lastTime, 64);
      lastTime = now;
      const pixels = (delta / 16.67) * autoScrollSpeed;
      window.scrollBy(0, pixels);

      // Stop if reached bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
        setIsAutoScrolling(false);
        return;
      }

      autoScrollIntervalRef.current = requestAnimationFrame(tick) as unknown as NodeJS.Timeout;
    };

    autoScrollIntervalRef.current = requestAnimationFrame(tick) as unknown as NodeJS.Timeout;

    return () => {
      isRunning = false;
      if (autoScrollIntervalRef.current) {
        cancelAnimationFrame(autoScrollIntervalRef.current as unknown as number);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  // Redirect stale /covers URLs to the series page (covers are no longer a chapter)
  useEffect(() => {
    if (chapterSlug === "covers") {
      navigate({ to: `/title/${titleSlug}` });
    }
  }, [chapterSlug, titleSlug, navigate]);

  if (chapterSlug === "covers") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Redirecting…
      </div>
    );
  }

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
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-clip">
      {/* Top Bar - Auto-hide */}
      <div
        className={`sticky top-0 z-30 w-full transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <ReaderTopBar
          title={`Ch. ${c.chapter_number}`}
          seriesTitle={c.series?.title ?? ""}
          seriesSlug={c.series?.slug ?? ""}
          isNovel={isNovel}
          allChapters={navChapters}
          currentChapterSlug={chapterSlug}
          alternateGroups={alternateGroupsQ.data ?? []}
          currentGroup={activeScanlationGroup}
          currentFilter={currentFilter}
          onCycleFilter={cycleFilter}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          isDownloaded={isDownloaded}
          onDownload={handleDownload}
        />
      </div>

      <div className="w-full max-w-full">
        {/* Main content */}
        <div className="w-full max-w-full">
          {c.scheduled_at && new Date(c.scheduled_at) > new Date() && settings.enable30MinHold !== false && !adminViewBypassed ? (
            <ScheduledChapterUnlockView
              chapter={c}
              seriesSlug={seriesSlug}
              onViewAsAdmin={() => handleViewAsAdmin(c.id, c.chapter_number)}
              onUnlock={() => {
                qc.invalidateQueries({ queryKey: ["pages", c.id] });
                qc.invalidateQueries({ queryKey: ["chapter", slug, chapterSlug] });
                qc.invalidateQueries({ queryKey: ["chapters"] });
              }}
            />
          ) : (
            <>
              {c.scheduled_at && new Date(c.scheduled_at) > new Date() && settings.enable30MinHold !== false && (
                <div className="sticky top-16 z-30 mb-3 flex items-center gap-2.5 rounded-lg border border-amber-500/40 bg-amber-950/90 px-4 py-2.5 text-xs backdrop-blur-md shadow-lg text-amber-300">
                  <Lock className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                  <span>
                    <strong>Viewing as Admin:</strong> Chapter {c.chapter_number} is currently on hold for regular readers until{" "}
                    {new Date(c.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Only you have bypass access.
                  </span>
                </div>
              )}
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
              onNext={() => {
                awardXp();
                if (next) {
                  navigate({
                    to: "/title/$titleSlug/$chapterSlug",
                    params: { titleSlug: seriesSlug, chapterSlug: next.slug },
                  });
                }
              }}
              seriesSlug={seriesSlug}
              seriesTitle={c.series?.title ?? ""}
              chapterNumber={c.chapter_number}
              chapterSlug={c.slug || chapterSlug}
              illustrations={pagesQ.data?.map((p: any) => p.image_url) ?? []}
            />
          ) : (
            <ImageView
              pages={pagesQ.data}
              loading={pagesQ.isLoading}
              onRefresh={() => pagesQ.refetch()}
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
              onNext={() => {
                awardXp();
                if (next) {
                  navigate({
                    to: "/title/$titleSlug/$chapterSlug",
                    params: { titleSlug: seriesSlug, chapterSlug: next.slug },
                  });
                }
              }}
              seriesSlug={seriesSlug}
              seriesTitle={c.series?.title ?? ""}
              chapterNumber={c.chapter_number}
              chapterSlug={c.slug || chapterSlug}
            />
          )}
        </>
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
          onNext={() => {
            awardXp();
            if (next) {
              navigate({
                to: "/title/$titleSlug/$chapterSlug",
                params: { titleSlug: seriesSlug, chapterSlug: next.slug },
              });
            }
          }}
          seriesSlug={seriesSlug}
          allChapters={navChapters}
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
  currentFilter,
  onCycleFilter,
  isDownloading,
  downloadProgress,
  isDownloaded,
  onDownload,
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
  currentFilter?: string;
  onCycleFilter?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  isDownloaded?: boolean;
  onDownload?: () => void;
}) {
  const navigate = useNavigate();
  const showGroupSwitcher = alternateGroups.length > 1;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/95 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2 sm:py-2.5">
        <Link
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="flex min-w-0 items-center gap-2 text-sm hover:opacity-85 transition-opacity shrink-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-xs sm:text-sm text-foreground max-w-[105px] min-[360px]:max-w-[140px] sm:max-w-xs">
              {seriesTitle}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{title}</div>
            {/* Screen-reader-only h1 tag for absolute SEO compliance and hierarchy */}
            <h1 className="sr-only">
              Read {seriesTitle} {title.includes("Ch. ") ? `Chapter ${title.replace("Ch. ", "")}` : title} Online Free
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Search Shortcut */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-global-search"))}
            title="Search (Ctrl+K)"
            className="h-8 sm:h-9 w-8 sm:w-9 grid place-items-center rounded-lg border border-border/50 bg-background/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Eye Comfort Filter Toggle */}
          {onCycleFilter && (
            <button
              type="button"
              onClick={onCycleFilter}
              title={`Eye Comfort Filter: ${currentFilter?.toUpperCase()}`}
              className="flex items-center gap-1 text-xs h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            >
              <SunMoon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="hidden min-[500px]:inline capitalize text-[11px] font-medium">{currentFilter}</span>
            </button>
          )}

          {/* Offline Download Button */}
          {!isNovel && onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading || isDownloaded}
              title={isDownloaded ? "Saved Offline" : "Save Chapter Offline"}
              className={`flex items-center gap-1 text-xs h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                isDownloaded
                  ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-400"
                  : "border-border/50 bg-background/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span className="text-[11px] font-mono">{downloadProgress}%</span>
                </>
              ) : isDownloaded ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden min-[560px]:inline text-[11px] font-medium">Offline</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden min-[560px]:inline text-[11px] font-medium">Save</span>
                </>
              )}
            </button>
          )}

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
              <SelectTrigger className="w-[85px] sm:w-[130px] text-xs h-8 sm:h-9">
                <SelectValue placeholder="Group" />
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
            <span className="hidden text-xs text-muted-foreground md:inline">{currentGroup}</span>
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
              <SelectTrigger className="w-[110px] min-[360px]:w-[125px] sm:w-[165px] text-xs h-8 sm:h-9 px-2 sm:px-2.5">
                <List className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {allChapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.slug} className="text-xs">
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

function ScheduledChapterUnlockView({
  chapter,
  seriesSlug,
  onUnlock,
  onViewAsAdmin,
}: {
  chapter: any;
  seriesSlug: string;
  onUnlock: () => void;
  onViewAsAdmin?: () => void;
}) {
  const { isAdmin, isMod, isUploader } = useIsAdmin();
  const canManage = isAdmin || isMod || isUploader;
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const targetDate = useMemo(() => new Date(chapter.scheduled_at), [chapter.scheduled_at]);

  const handleAdminVerificationAndView = async () => {
    setIsVerifyingAdmin(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData.user) {
        toast.error("Access denied: Please sign in with an administrator or staff account.");
        return;
      }

      // Query roles from user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      if (rolesError) {
        throw rolesError;
      }

      const roles = (rolesData ?? []).map((r: any) => r.role);
      const isStaff =
        isAdmin ||
        isMod ||
        isUploader ||
        roles.includes("admin") ||
        roles.includes("moderator") ||
        roles.includes("uploader");

      if (!isStaff) {
        toast.error("Access denied: You do not have administrator or staff permissions.");
        return;
      }

      toast.success("Administrator verified! Opening chapter reader...");
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`admin-view-${chapter.id}`, "true");
      }
      onViewAsAdmin?.();
    } catch (err: any) {
      toast.error(`Verification error: ${err.message || "Failed to verify administrator status"}`);
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onUnlock();
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onUnlock]);

  const sourceUrl = chapter.source_url;
  const sourceName = chapter.uploaded_by || chapter.scanlation_group || "Official Scans Source";

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card/95 via-card/75 to-background/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
        {/* Glow backdrop */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-inner animate-pulse">
          <Lock className="h-8 w-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
          <Clock className="h-3.5 w-3.5" />
          30-Minute Early Access Hold
        </span>

        <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">
          Chapter {chapter.chapter_number} Unlocks Soon!
        </h2>

        <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
          This newly imported chapter has a 30-minute early-access hold on vnrscans before unlocking for free.
        </p>

        {/* Live Timer Box */}
        <div className="mt-5 flex items-center justify-center gap-3">
          {(timeLeft?.hours ?? 0) > 0 && (
            <>
              <div className="flex flex-col items-center rounded-xl bg-background/90 border border-amber-500/40 px-4 py-2 min-w-[70px]">
                <span className="font-mono text-2xl font-black text-amber-300">
                  {String(timeLeft?.hours ?? 0).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase font-semibold text-neutral-400">Hours</span>
              </div>
              <span className="font-mono text-xl font-bold text-amber-400 animate-pulse">:</span>
            </>
          )}
          <div className="flex flex-col items-center rounded-xl bg-background/90 border border-amber-500/40 px-4 py-2 min-w-[70px]">
            <span className="font-mono text-2xl font-black text-amber-300">
              {String(timeLeft?.minutes ?? 0).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase font-semibold text-neutral-400">Minutes</span>
          </div>
          <span className="font-mono text-xl font-bold text-amber-400 animate-pulse">:</span>
          <div className="flex flex-col items-center rounded-xl bg-background/90 border border-amber-500/40 px-4 py-2 min-w-[70px]">
            <span className="font-mono text-2xl font-black text-amber-300">
              {String(timeLeft?.seconds ?? 0).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase font-semibold text-neutral-400">Seconds</span>
          </div>
        </div>

        {/* Action card for Read Now on source */}
        {sourceUrl && (
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Support the Scans Group
              </span>
              <span className="text-[11px] text-neutral-400">{sourceName}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-300">
              Want to read right now without waiting? Read Chapter {chapter.chapter_number} directly on the scan source:
            </p>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>(Read now) on {sourceName}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Staff / Admin Section with "View as Admin" */}
        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-left shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              Staff / Admin Access
            </span>
            <span className="text-[10px] font-mono rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 font-semibold border border-amber-500/30">
              Admin Only
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
            Staff and administrators can verify privileges to immediately read this chapter without unlocking it for regular visitors.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              onClick={handleAdminVerificationAndView}
              disabled={isVerifyingAdmin}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm py-2.5 gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              title="Verify administrator status and view chapter immediately"
            >
              {isVerifyingAdmin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Admin Access...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>View as Admin</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <NextLink
            href={`/title/${seriesSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Chapter List
          </NextLink>
        </div>
      </div>
    </div>
  );
}

function ImageView({
  pages,
  loading,
  onRefresh,
  chapterId,
  seriesId,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
  seriesTitle,
  chapterNumber,
  chapterSlug,
}: {
  pages?: any[];
  loading: boolean;
  onRefresh?: () => void;
  chapterId: string;
  seriesId: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterSlug?: string;
}) {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { user } = useAuth();

  // Image error handling state - moved to top
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageRetries, setImageRetries] = useState<Record<string, number>>({});
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  // Exact reading position tracking & continue where left off prompt
  type ContinuePromptData = {
    targetPage: number;
    percent: number;
    scrollRatio: number;
    scrollTop: number;
  };
  const [continuePrompt, setContinuePrompt] = useState<ContinuePromptData | null>(null);
  const restoredChapterRef = useRef<string | null>(null);
  const activePageRef = useRef(0);
  const isRestoringRef = useRef(true);
  const restoreLockUntilRef = useRef(0);
  const currentChapterSlug = chapterSlug || chapterNumber.toString();

  // Release restoration guard ONLY after restoration lock window has passed
  useEffect(() => {
    const handleUserInteraction = () => {
      if (Date.now() < restoreLockUntilRef.current) return;
      isRestoringRef.current = false;
    };
    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  // Safe scroll helper that locks restoration guard and scrolls accurately
  const performScrollToTarget = useCallback(
    (targetPg: number, sRatio?: number, sTop?: number, smooth: boolean = true) => {
      isRestoringRef.current = true;
      restoreLockUntilRef.current = Date.now() + (smooth ? 1500 : 400);

      let scrolled = false;
      if (targetPg > 0) {
        const targetEl = document.getElementById(`chapter-page-${targetPg}`);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const targetY = rect.top + (window.pageYOffset || document.documentElement.scrollTop) - 56;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: smooth ? "smooth" : "instant",
          });
          scrolled = true;
        }
      }

      if (!scrolled) {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight > 0 && sRatio != null && sRatio > 0) {
          window.scrollTo({
            top: sRatio * scrollHeight,
            behavior: smooth ? "smooth" : "instant",
          });
          scrolled = true;
        } else if (sTop != null && sTop > 50) {
          window.scrollTo({
            top: sTop,
            behavior: smooth ? "smooth" : "instant",
          });
          scrolled = true;
        }
      }

      if (scrolled) {
        const releaseGuard = () => {
          const remaining = Math.max(0, restoreLockUntilRef.current - Date.now());
          setTimeout(() => {
            isRestoringRef.current = false;
          }, remaining);
        };

        if (typeof window !== "undefined" && "onscrollend" in window) {
          const onEnd = () => {
            window.removeEventListener("scrollend", onEnd);
            releaseGuard();
          };
          window.addEventListener("scrollend", onEnd, { once: true, passive: true });
          setTimeout(onEnd, smooth ? 1400 : 300);
        } else {
          setTimeout(releaseGuard, smooth ? 1400 : 300);
        }
      }

      return scrolled;
    },
    []
  );

  // Track scroll position and visible page element
  useEffect(() => {
    if (!chapterId || loading || !pages?.length) return;

    const handleScroll = () => {
      // Do NOT overwrite saved position while page is mounting, restoring, or in grace lock
      if (isRestoringRef.current || Date.now() < restoreLockUntilRef.current) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      // Find which page is currently centered/visible in the viewport
      const viewportMid = window.innerHeight / 2;
      let visibleIdx = 0;
      for (let i = 0; i < pages.length; i++) {
        const el = document.getElementById(`chapter-page-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportMid && rect.bottom >= 0) {
            visibleIdx = i;
          }
        }
      }
      activePageRef.current = visibleIdx;

      saveChapterReadingPosition({
        chapterId,
        seriesSlug,
        chapterSlug: currentChapterSlug,
        chapterNumber,
        pageIndex: visibleIdx,
        scrollRatio,
        scrollTop,
      });
    };

    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 120);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", throttledScroll);
      if (!isRestoringRef.current && Date.now() >= restoreLockUntilRef.current) {
        handleScroll();
      }
    };
  }, [chapterId, seriesSlug, chapterNumber, currentChapterSlug, loading, pages?.length]);

  // Restore exact left-off place for visited chapters OR start from top for new chapters
  useEffect(() => {
    if (!chapterId || loading || !pages?.length) return;

    if (restoredChapterRef.current !== chapterId) {
      restoredChapterRef.current = chapterId;
      isRestoringRef.current = true;
      restoreLockUntilRef.current = Date.now() + 1500;

      // Prevent automatic browser scroll injection
      if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      const savedPos = getChapterReadingPosition(chapterId);
      const savedLocalProgress = parseInt(
        localStorage.getItem(`chapter-progress-${chapterId}`) || "0",
        10
      );

      let targetPage = savedPos ? Math.min(Math.max(0, savedPos.pageIndex || 0), pages.length - 1) : 0;
      let percent = savedPos?.scrollRatio ? Math.round(savedPos.scrollRatio * 100) : savedLocalProgress;
      if (targetPage === 0 && savedLocalProgress > 5) {
        targetPage = Math.min(Math.floor((savedLocalProgress / 100) * pages.length), pages.length - 1);
      }

      const hasProgress =
        (targetPage > 0 || (savedPos?.scrollRatio && savedPos.scrollRatio > 0.04) || (savedPos?.scrollTop && savedPos.scrollTop > 80) || savedLocalProgress > 5) &&
        percent < 98;

      // 1. BRAND NEW OR UNREAD CHAPTER: ALWAYS START FROM TOP
      if (!hasProgress) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (typeof document !== "undefined") {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        setContinuePrompt(null);
        const timer = setTimeout(() => {
          isRestoringRef.current = false;
        }, 300);
        return () => clearTimeout(timer);
      }

      // 2. RETURNING READERS: REDIRECT DIRECTLY TO MIDDLE & SHOW PROMPT
      const finalPercent = Math.max(
        percent,
        targetPage > 0 ? Math.round(((targetPage + 1) / pages.length) * 100) : 0
      );
      const promptData: ContinuePromptData = {
        targetPage,
        percent: finalPercent,
        scrollRatio: savedPos?.scrollRatio || (finalPercent / 100),
        scrollTop: savedPos?.scrollTop || 0,
      };
      setContinuePrompt(promptData);

      let cancelled = false;
      let attempts = 0;
      const maxAttempts = 20;

      // Direct smooth scroll to where they left off once layout mounts
      const attemptRedirect = () => {
        if (cancelled) return;
        attempts++;
        const scrolled = performScrollToTarget(
          targetPage,
          promptData.scrollRatio,
          promptData.scrollTop,
          true
        );
        if (!scrolled && attempts < maxAttempts) {
          setTimeout(attemptRedirect, 150);
        }
      };

      const redirectTimer = setTimeout(attemptRedirect, 350);

      return () => {
        cancelled = true;
        clearTimeout(redirectTimer);
      };
    }
  }, [chapterId, loading, pages, performScrollToTarget]);

  // Clean up old scroll positions (keep only last 10 chapters per user)
  useEffect(() => {
    const cleanupOldScrollPositions = () => {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("vnr-reading-pos-"));
      if (keys.length > 20) {
        keys
          .sort()
          .slice(0, keys.length - 20)
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
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground p-6 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-base text-neutral-300 font-medium">No pages loaded for this chapter yet.</p>
          <p className="text-xs text-neutral-400">
            Pages may be loading or finalizing from the server. Click below to load pages.
          </p>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/40 hover:bg-primary/20 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Load / Refresh Pages</span>
            </Button>
          )}
        </div>
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
      {/* Floating Continue Where You Left Off Prompt (Matching site purple theme & user screenshot) */}
      {continuePrompt && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto select-none">
          <div className="flex items-center gap-2 pl-4 pr-2.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-2xl shadow-purple-950/80 border border-purple-400/40 backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={() => {
                performScrollToTarget(
                  continuePrompt.targetPage,
                  continuePrompt.scrollRatio,
                  continuePrompt.scrollTop,
                  true
                );
              }}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white hover:text-purple-100 transition-colors cursor-pointer"
            >
              <ArrowDown className="h-4 w-4 stroke-[2.5] shrink-0 animate-bounce" />
              <span>Continue where you left off</span>
              {continuePrompt.percent > 0 && (
                <span className="text-3xs bg-black/25 px-1.5 py-0.5 rounded font-mono font-bold">
                  {continuePrompt.percent}%
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setContinuePrompt(null);
              }}
              className="ml-1 p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss continue prompt"
            >
              <X className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Pages */}
      <div className="mx-auto max-w-3xl w-full px-0 sm:px-2 py-2 sm:py-4">
        {pages.map((p, idx) => (
          <div key={p.id} id={`chapter-page-${idx}`} data-page-index={idx} className="relative scroll-mt-14 reader-page-container w-full max-w-full">
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
                {isVideoUrl(p.image_url) ? (
                  <video
                    data-page-id={p.id}
                    src={p.image_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="mx-auto block w-full transition-transform duration-200"
                    style={{
                      opacity: imageLoading[p.id] ? 0.3 : 1,
                    }}
                    onLoadedData={() => handleImageLoad(p.id)}
                    onError={() => handleImageError(p.id, p.image_url)}
                  />
                ) : (
                  <img
                    data-page-id={p.id}
                    src={p.image_url}
                    alt={`${seriesTitle || "Manga"} Chapter ${chapterNumber} Page ${p.page_number} - vnrscans`}
                    loading={
                      idx < 2 || (continuePrompt?.targetPage != null && Math.abs(idx - continuePrompt.targetPage) <= 2)
                        ? "eager"
                        : "lazy"
                    }
                    decoding="async"
                    fetchPriority={
                      idx < 2 || (continuePrompt?.targetPage != null && Math.abs(idx - continuePrompt.targetPage) <= 2)
                        ? "high"
                        : "auto"
                    }
                    className="mx-auto block w-full max-w-full h-auto object-contain transition-transform duration-200"
                    referrerPolicy="no-referrer"
                    style={{
                      opacity: imageLoading[p.id] ? 0.3 : 1,
                    }}
                    onLoad={() => handleImageLoad(p.id)}
                    onError={() => handleImageError(p.id, p.image_url)}
                  />
                )}
              </>
            )}
          </div>
        ))}

        {/* Chapter bottom completion anchor - triggers Qi when reaching the end */}
        <div id="chapter-bottom-completion-anchor" className="h-4 w-full" />

        {/* Chapter Navigation Buttons - Above Reactions */}
        <ChapterNavigation
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={onPrev}
          onNext={onNext}
          seriesSlug={seriesSlug}
        />

        {/* Like & Memes Section */}
        <ChapterLikeAndMemes chapterId={chapterId} seriesId={seriesId} />
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
  chapterSlug,
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
  chapterSlug?: string;
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

  // Exact reading position tracking & continue where left off prompt for novels
  type NovelContinuePromptData = {
    percent: number;
    scrollRatio: number;
    scrollTop: number;
  };
  const [continuePrompt, setContinuePrompt] = useState<NovelContinuePromptData | null>(null);
  const restoredNovelChapterRef = useRef<string | null>(null);
  const isRestoringRef = useRef(true);
  const restoreLockUntilRef = useRef(0);
  const currentChapterSlug = chapterSlug || chapterNumber.toString();

  // Release restoration guard ONLY after restoration grace window has passed
  useEffect(() => {
    const handleUserInteraction = () => {
      if (Date.now() < restoreLockUntilRef.current) return;
      isRestoringRef.current = false;
    };
    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  // Safe scroll helper that locks restoration guard and scrolls accurately
  const performNovelScrollToTarget = useCallback(
    (sRatio?: number, sTop?: number, smooth: boolean = true) => {
      isRestoringRef.current = true;
      restoreLockUntilRef.current = Date.now() + (smooth ? 1500 : 400);

      let scrolled = false;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && sRatio != null && sRatio > 0) {
        window.scrollTo({ top: sRatio * scrollHeight, behavior: smooth ? "smooth" : "instant" });
        scrolled = true;
      } else if (sTop != null && sTop > 50) {
        window.scrollTo({ top: sTop, behavior: smooth ? "smooth" : "instant" });
        scrolled = true;
      }

      if (scrolled) {
        const releaseGuard = () => {
          const remaining = Math.max(0, restoreLockUntilRef.current - Date.now());
          setTimeout(() => {
            isRestoringRef.current = false;
          }, remaining);
        };

        if (typeof window !== "undefined" && "onscrollend" in window) {
          const onEnd = () => {
            window.removeEventListener("scrollend", onEnd);
            releaseGuard();
          };
          window.addEventListener("scrollend", onEnd, { once: true, passive: true });
          setTimeout(onEnd, smooth ? 1400 : 300);
        } else {
          setTimeout(releaseGuard, smooth ? 1400 : 300);
        }
      }

      return scrolled;
    },
    []
  );

  // Track page scroll progress for the top progress bar & position saving
  useEffect(() => {
    if (!chapterId || !content) return;

    const handleScroll = () => {
      if (isRestoringRef.current || Date.now() < restoreLockUntilRef.current) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);

      saveChapterReadingPosition({
        chapterId,
        seriesSlug,
        chapterSlug: currentChapterSlug,
        chapterNumber,
        pageIndex: 0,
        scrollRatio,
        scrollTop,
      });
    };

    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 120);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", throttledScroll);
      if (!isRestoringRef.current && Date.now() >= restoreLockUntilRef.current) {
        handleScroll();
      }
    };
  }, [chapterId, content, seriesSlug, chapterNumber, currentChapterSlug]);

  // Restore exact scroll position on visited chapters OR start from top on new chapters
  useEffect(() => {
    if (!chapterId || !content) return;

    if (restoredNovelChapterRef.current !== chapterId) {
      restoredNovelChapterRef.current = chapterId;
      isRestoringRef.current = true;
      restoreLockUntilRef.current = Date.now() + 1500;

      if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      const savedPos = getChapterReadingPosition(chapterId);
      const savedLocalProgress = parseInt(
        localStorage.getItem(`chapter-progress-${chapterId}`) || "0",
        10
      );

      const percent = savedPos?.scrollRatio
        ? Math.round(savedPos.scrollRatio * 100)
        : savedLocalProgress;
      const hasProgress =
        (savedPos && (savedPos.scrollTop > 60 || (savedPos.scrollRatio && savedPos.scrollRatio > 0.04))) ||
        (savedLocalProgress > 5 && savedLocalProgress < 98);

      if (!hasProgress) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (typeof document !== "undefined") {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        setContinuePrompt(null);
        const timer = setTimeout(() => {
          isRestoringRef.current = false;
        }, 300);
        return () => clearTimeout(timer);
      }

      const promptData: NovelContinuePromptData = {
        percent,
        scrollRatio: savedPos?.scrollRatio || percent / 100,
        scrollTop: savedPos?.scrollTop || 0,
      };
      setContinuePrompt(promptData);

      const redirectTimer = setTimeout(() => {
        performNovelScrollToTarget(promptData.scrollRatio, promptData.scrollTop, true);
      }, 350);

      return () => clearTimeout(redirectTimer);
    }
  }, [chapterId, content, performNovelScrollToTarget]);

  // Determine content mode (HTML vs Plain Text split)
  const isHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(content), [content]);
  const plainTextParagraphs = useMemo(() => {
    if (isHtml) return [];
    return content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [content, isHtml]);

  // Theme color definitions
  const themeStyles = {
    dark: {
      bg: "bg-[#121212]",
      text: "text-[#e0e0e0]",
      border: "border-neutral-800",
      accent: "text-primary",
      meta: "text-neutral-400",
      card: "bg-neutral-900/50",
    },
    light: {
      bg: "bg-[#fcfbf9]",
      text: "text-[#242424]",
      border: "border-neutral-200",
      accent: "text-primary",
      meta: "text-neutral-500",
      card: "bg-neutral-100/50",
    },
    sepia: {
      bg: "bg-[#f4ecd8]",
      text: "text-[#5b4636]",
      border: "border-[#e0d6be]",
      accent: "text-[#8c6b4f]",
      meta: "text-[#8c7a6b]",
      card: "bg-[#ede2c8]/60",
    },
    midnight: {
      bg: "bg-[#0b0e14]",
      text: "text-[#b0b8c4]",
      border: "border-[#1e2638]",
      accent: "text-blue-400",
      meta: "text-[#62728d]",
      card: "bg-[#121722]",
    },
  }[theme as "dark" | "light" | "sepia" | "midnight"] || {
    bg: "bg-background",
    text: "text-foreground",
    border: "border-border",
    accent: "text-primary",
    meta: "text-muted-foreground",
    card: "bg-card",
  };

  return (
    <div className={`relative min-h-screen ${themeStyles.bg} ${themeStyles.text} transition-colors duration-300`}>
      {/* Floating Continue Where You Left Off Prompt for Novels */}
      {continuePrompt && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto select-none">
          <div className="flex items-center gap-2 pl-4 pr-2.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-2xl shadow-purple-950/80 border border-purple-400/40 backdrop-blur-md transition-all">
            <button
              type="button"
              onClick={() => {
                performNovelScrollToTarget(continuePrompt.scrollRatio, continuePrompt.scrollTop, true);
              }}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white hover:text-purple-100 transition-colors cursor-pointer"
            >
              <ArrowDown className="h-4 w-4 stroke-[2.5] shrink-0 animate-bounce" />
              <span>Continue where you left off</span>
              {continuePrompt.percent > 0 && (
                <span className="text-3xs bg-black/25 px-1.5 py-0.5 rounded font-mono font-bold">
                  {continuePrompt.percent}%
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setContinuePrompt(null);
              }}
              className="ml-1 p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss continue prompt"
            >
              <X className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-40">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Title Header */}
        <div className={`mb-8 border-b ${themeStyles.border} pb-6 text-center`}>
          <p className={`text-xs uppercase tracking-widest ${themeStyles.meta} mb-1 font-semibold`}>
            {seriesTitle}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Chapter {chapterNumber}
          </h1>
        </div>

        {/* Content Body */}
        <article
          className="font-novel leading-relaxed select-text"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            lineHeight: lineHeight,
          }}
        >
          {/* Illustrations if any exist */}
          {illustrations && illustrations.length > 0 && (
            <div className="mb-8 space-y-4">
              {illustrations.map((url, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-border/40 shadow-md">
                  {isVideoUrl(url) ? (
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
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
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

        {/* Chapter bottom completion anchor - triggers Qi when reaching the end */}
        <div id="chapter-bottom-completion-anchor" className="h-4 w-full" />

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
          <ChapterLikeAndMemes chapterId={chapterId} seriesId={seriesId} />
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

// Chapter Like and Memes Component
function ChapterLikeAndMemes({ chapterId, seriesId }: { chapterId: string; seriesId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [likeBurst, setLikeBurst] = useState(false);

  // Chapter hype and community reaction types
  const memeReactions = [
    { type: "star", emoji: "🗿", label: "Peak Fiction" },
    { type: "thumbs_up", emoji: "🔥", label: "Nah, I'd Win" },
    { type: "smile", emoji: "🍿", label: "Absolute Cinema" },
    { type: "laugh", emoji: "😭", label: "Emotional Damage" },
    { type: "skull", emoji: "💀", label: "Bro is Cooked" },
    { type: "mindblown", emoji: "🤯", label: "Mind Blown" },
    { type: "goat", emoji: "🐐", label: "He is HIM" },
    { type: "cliffhanger", emoji: "⏳", label: "Cliffhanger Pain" },
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

  const toggleReaction = useMutation({
    mutationFn: async ({
      reactionType,
      hasReacted,
    }: {
      reactionType: string;
      hasReacted: boolean;
    }) => {
      if (!user) throw new Error("Sign in to react");

      if (hasReacted) {
        const { error } = await supabase
          .from("chapter_reactions")
          .delete()
          .eq("chapter_id", chapterId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chapter_reactions").insert({
          chapter_id: chapterId,
          user_id: user.id,
          reaction_type: reactionType,
        });
        if (error) throw error;
      }
    },
    onMutate: async ({ reactionType, hasReacted }) => {
      // Cancel queries to prevent race conditions
      await qc.cancelQueries({ queryKey: ["chapter-reactions", chapterId] });
      await qc.cancelQueries({ queryKey: ["user-chapter-reactions", chapterId, user?.id] });

      const prevReactions = qc.getQueryData<Record<string, number>>(["chapter-reactions", chapterId]) || {};
      const prevUserReactions = qc.getQueryData<string[]>(["user-chapter-reactions", chapterId, user?.id]) || [];

      // Optimistically calculate new reaction counts
      const currentCount = prevReactions[reactionType] || 0;
      const nextCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;
      const nextReactions = { ...prevReactions, [reactionType]: nextCount };

      // Optimistically update user reacted list
      const nextUserReactions = hasReacted
        ? prevUserReactions.filter((r) => r !== reactionType)
        : [...prevUserReactions, reactionType];

      qc.setQueryData(["chapter-reactions", chapterId], nextReactions);
      qc.setQueryData(["user-chapter-reactions", chapterId, user?.id], nextUserReactions);

      if (reactionType === "heart" && !hasReacted) {
        setLikeBurst(true);
        setTimeout(() => setLikeBurst(false), 1200);
      }

      return { prevReactions, prevUserReactions };
    },
    onError: (e: Error, _, context) => {
      if (context) {
        qc.setQueryData(["chapter-reactions", chapterId], context.prevReactions);
        qc.setQueryData(["user-chapter-reactions", chapterId, user?.id], context.prevUserReactions);
      }
      toast.error(e.message || "Failed to update reaction");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["chapter-reactions", chapterId] });
      qc.invalidateQueries({ queryKey: ["user-chapter-reactions", chapterId, user?.id] });
    },
  });

  const handleToggleReaction = (reactionType: string) => {
    if (!user) {
      toast.error("Please sign in to react or like this chapter");
      return;
    }
    const hasReacted = userReactionsQ.data?.includes(reactionType) ?? false;
    toggleReaction.mutate({ reactionType, hasReacted });
  };

  const isLiked = userReactionsQ.data?.includes("heart");
  const likeCount = reactionsQ.data?.["heart"] || 0;

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mt-12 mb-8 border-t border-border/50 pt-8">
      {/* Primary Like Feature */}
      <div className="mb-8 rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 via-card/40 to-background/80 p-6 sm:p-8 shadow-xl backdrop-blur-md text-center flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl flex items-center justify-center gap-2">
          <span>Show Some Love for This Chapter!</span>
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
          Enjoyed reading? Drop a like to support the scans and climb the hype ladder.
        </p>

        {/* Big Animated Like Button */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={() => handleToggleReaction("heart")}
            className={`group relative flex items-center gap-3 px-9 py-4 rounded-full font-bold text-base transition-all duration-300 transform active:scale-95 cursor-pointer shadow-xl select-none ${
              isLiked
                ? "bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 text-white shadow-pink-500/30 ring-2 ring-pink-400/60 scale-105"
                : "bg-secondary/80 hover:bg-pink-500/10 text-foreground border border-border hover:border-pink-500/40 hover:text-pink-400"
            }`}
          >
            <Heart
              className={`h-6 w-6 transition-all duration-300 ${
                isLiked ? "fill-current scale-110 animate-bounce" : "group-hover:scale-110 text-pink-400"
              }`}
            />
            <span>{isLiked ? "Liked!" : "Like Chapter"}</span>
            <span
              className={`ml-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                isLiked ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground"
              }`}
            >
              {likeCount.toLocaleString()}
            </span>

            {/* Like burst floating hearts */}
            {likeBurst && (
              <span className="absolute -top-6 text-2xl animate-ping pointer-events-none">
                💖
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chapter Memes & Reactions Stats Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold flex items-center gap-2 text-foreground">
            <span className="text-xl">🏆</span>
            <span>Quick Chapter Hype & Reactions</span>
          </h4>
          <button
            onClick={scrollToComments}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Jump to comments</span>
            <span>⬇</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {memeReactions.map((reaction) => {
            const count = reactionsQ.data?.[reaction.type] || 0;
            const hasReacted = userReactionsQ.data?.includes(reaction.type) || false;

            return (
              <button
                key={reaction.type}
                onClick={() => handleToggleReaction(reaction.type)}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 transform active:scale-95 cursor-pointer select-none ${
                  hasReacted
                    ? "bg-primary/20 border-primary text-primary font-bold shadow-md shadow-primary/10 scale-[1.02]"
                    : "bg-card/60 border-border/60 hover:bg-primary/10 hover:border-primary/50 text-foreground hover:shadow-sm"
                }`}
                title={reaction.label}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-125 select-none">{reaction.emoji}</span>
                  <span className="text-xs font-bold truncate">{reaction.label}</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-all shrink-0 ml-1.5 ${
                  hasReacted ? "bg-primary/30 text-primary" : "bg-secondary/80 text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments section — deferred until user reaches near bottom */}
      <LazyChapterComments chapterId={chapterId} seriesId={seriesId} />
    </div>
  );
}

function LazyChapterComments({ chapterId, seriesId }: { chapterId: string; seriesId: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || shouldLoad) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} id="comments-section" className="min-h-[200px]">
      {shouldLoad ? (
        <ChapterComments chapterId={chapterId} seriesId={seriesId} />
      ) : (
        <div className="flex h-24 items-center justify-center text-xs text-muted-foreground animate-pulse border border-border/40 rounded-xl bg-card/20">
          Loading discussion and comments...
        </div>
      )}
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

// Media attachment renderer with multi-image support (up to 5 images), responsive grid, and interactive lightbox
function CommentAttachmentMedia({
  urls,
  alt,
  type,
}: {
  urls: string | string[] | null | undefined;
  alt?: string | null;
  type?: "image" | "gif" | null;
}) {
  return <CommentAttachmentGrid urls={urls} alt={alt} type={type} />;
}

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

function ChapterComments({
  chapterId,
  seriesId,
  pendingMeme,
  onClearPendingMeme,
}: {
  chapterId: string;
  seriesId: string;
  pendingMeme?: { url: string; name: string } | null;
  onClearPendingMeme?: () => void;
}) {
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
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [attachmentAlt, setAttachmentAlt] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "top" | "oldest">("newest");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [replyAttachmentType, setReplyAttachmentType] = useState<"image" | "gif" | null>(null);
  const [replyAttachmentUrls, setReplyAttachmentUrls] = useState<string[]>([]);
  const [replyAttachmentAlt, setReplyAttachmentAlt] = useState<string | null>(null);
  const [replyUploadingAttachment, setReplyUploadingAttachment] = useState(false);
  const [replyUploadProgressText, setReplyUploadProgressText] = useState<string | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const replyContentRef = useRef<HTMLTextAreaElement | null>(null);
  const [showMemePicker, setShowMemePicker] = useState(false);
  const [replyShowMemePicker, setReplyShowMemePicker] = useState(false);

  const attachmentUrl = serializeAttachmentUrls(attachmentUrls);
  const replyAttachmentUrl = serializeAttachmentUrls(replyAttachmentUrls);

  // Sync incoming meme from external Chapter Meme Vault
  useEffect(() => {
    if (pendingMeme) {
      setAttachmentType(pendingMeme.url.endsWith(".gif") ? "gif" : "image");
      setAttachmentUrls([pendingMeme.url]);
      setAttachmentAlt(pendingMeme.name);
      onClearPendingMeme?.();
      requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    }
  }, [pendingMeme, onClearPendingMeme]);

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
        series_id: seriesId || null,
        chapter_id: chapterId || null,
        parent_id: parentId || null,
        content: cleanBody || (attachmentType === "gif" ? "[GIF]" : "[Meme]"),
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
      setAttachmentUrls([]);
      setAttachmentAlt(null);
      setReplyTo(null);
      setReplyContent("");
      setReplySpoiler(false);
      setReplyAttachmentType(null);
      setReplyAttachmentUrls([]);
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
      hasReacted,
    }: {
      commentId: string;
      reactionType: string;
      hasReacted: boolean;
    }) => {
      if (!user) throw new Error("Sign in to react");

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
    onMutate: async ({ commentId, reactionType, hasReacted }) => {
      await qc.cancelQueries({ queryKey: ["comment-reactions", chapterId] });

      const prevData = qc.getQueryData<{
        counts: Map<string, Record<string, number>>;
        mine: Set<string>;
      }>(["comment-reactions", chapterId]);

      if (prevData) {
        const nextCounts = new Map(prevData.counts);
        const nextMine = new Set(prevData.mine);
        const key = `${commentId}:${reactionType}`;

        const commentBucket = { ...(nextCounts.get(commentId) || {}) };
        const currentCount = commentBucket[reactionType] || 0;

        if (hasReacted) {
          nextMine.delete(key);
          commentBucket[reactionType] = Math.max(0, currentCount - 1);
        } else {
          nextMine.add(key);
          commentBucket[reactionType] = currentCount + 1;
        }

        nextCounts.set(commentId, commentBucket);
        qc.setQueryData(["comment-reactions", chapterId], { counts: nextCounts, mine: nextMine });
      }

      return { prevData };
    },
    onError: (error: Error, _, context) => {
      if (context?.prevData) {
        qc.setQueryData(["comment-reactions", chapterId], context.prevData);
      }
      toast.error(error.message || "Failed to update reaction");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["comment-reactions", chapterId] }),
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

  const handleAttachmentUpload = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!user) {
      toast.error("Please sign in to upload images");
      return;
    }
    const files = Array.from(fileList);
    const maxAllowed = 5;
    const currentCount = attachmentUrls.length;
    const remainingSlots = maxAllowed - currentCount;

    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed per comment");
      return;
    }

    let filesToUpload = files;
    if (files.length > remainingSlots) {
      toast.warning(`Maximum 5 images allowed. Uploading first ${remainingSlots} image${remainingSlots === 1 ? "" : "s"}.`);
      filesToUpload = files.slice(0, remainingSlots);
    }

    try {
      setUploadingAttachment(true);
      const newUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Uploading ${i + 1}/${filesToUpload.length}...`);
        try {
          const url = await uploadCommentImage(file);
          newUrls.push(url);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Error"}`);
        }
      }

      if (newUrls.length > 0) {
        setAttachmentType("image");
        setAttachmentUrls((prev) => [...prev, ...newUrls].slice(0, 5));
        setAttachmentAlt(filesToUpload[0]?.name || "Comment image");
        toast.success(`Attached ${newUrls.length} image${newUrls.length > 1 ? "s" : ""}`);
      }
    } finally {
      setUploadingAttachment(false);
      setUploadProgressText(null);
    }
  };

  const handleReplyAttachmentUpload = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!user) {
      toast.error("Please sign in to upload images");
      return;
    }
    const files = Array.from(fileList);
    const maxAllowed = 5;
    const currentCount = replyAttachmentUrls.length;
    const remainingSlots = maxAllowed - currentCount;

    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed per comment");
      return;
    }

    let filesToUpload = files;
    if (files.length > remainingSlots) {
      toast.warning(`Maximum 5 images allowed. Uploading first ${remainingSlots} image${remainingSlots === 1 ? "" : "s"}.`);
      filesToUpload = files.slice(0, remainingSlots);
    }

    try {
      setReplyUploadingAttachment(true);
      const newUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setReplyUploadProgressText(`Uploading ${i + 1}/${filesToUpload.length}...`);
        try {
          const url = await uploadCommentImage(file);
          newUrls.push(url);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Error"}`);
        }
      }

      if (newUrls.length > 0) {
        setReplyAttachmentType("image");
        setReplyAttachmentUrls((prev) => [...prev, ...newUrls].slice(0, 5));
        setReplyAttachmentAlt(filesToUpload[0]?.name || "Reply image");
        toast.success(`Attached ${newUrls.length} image${newUrls.length > 1 ? "s" : ""}`);
      }
    } finally {
      setReplyUploadingAttachment(false);
      setReplyUploadProgressText(null);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachmentUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (next.length === 0) {
        setAttachmentType(null);
        setAttachmentAlt(null);
      }
      return next;
    });
  };

  const clearAttachment = () => {
    setAttachmentType(null);
    setAttachmentUrls([]);
    setAttachmentAlt(null);
  };

  const removeReplyAttachment = (indexToRemove: number) => {
    setReplyAttachmentUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (next.length === 0) {
        setReplyAttachmentType(null);
        setReplyAttachmentAlt(null);
      }
      return next;
    });
  };

  const clearReplyAttachment = () => {
    setReplyAttachmentType(null);
    setReplyAttachmentUrls([]);
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

          {Boolean(
            comment.content &&
            !["[gif]", "[meme]", "[media]", "[attachment]", "shared a meme/image", "shared a gif", "shared a meme", "shared an image", "shared a sticker"].includes(comment.content.trim().toLowerCase())
          ) && (
            <div
              className={`mt-2.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground/90 ${spoilerHidden ? "select-none rounded bg-secondary p-2.5 sm:p-3 text-transparent blur-sm" : ""}`}
            >
              {spoilerHidden ? comment.content : renderCommentMarkdown(comment.content)}
            </div>
          )}

          {comment.attachment_url && !spoilerHidden && (
            <CommentAttachmentMedia
              urls={comment.attachment_url}
              alt={comment.attachment_alt}
              type={comment.attachment_type}
            />
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
                  onClick={() => {
                    if (!user) {
                      toast.error("Please sign in to react");
                      return;
                    }
                    toggleCommentReaction.mutate({
                      commentId: comment.id,
                      reactionType: reaction.type,
                      hasReacted: Boolean(active),
                    });
                  }}
                  className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none ${
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

              {replyAttachmentUrls.length > 0 && (
                <div className="mt-2.5 rounded-lg border border-border/50 bg-background/70 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border/30">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      {replyAttachmentType === "gif" ? (
                        <Film className="h-3.5 w-3.5" />
                      ) : (
                        <Flame className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {replyAttachmentType === "gif"
                          ? "GIF attached"
                          : `Attached Images (${replyAttachmentUrls.length}/5)`}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={clearReplyAttachment}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Remove all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {replyAttachmentUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative h-16 w-20 rounded-md overflow-hidden border border-border/60 bg-black/40 shrink-0 shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`Reply attachment ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/75 text-[9px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeReplyAttachment(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 hover:bg-destructive text-white opacity-80 hover:opacity-100 transition-all cursor-pointer"
                          title="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-8 gap-1.5 transition-colors text-xs font-semibold cursor-pointer ${
                      replyShowMemePicker
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
                    }`}
                    onClick={() => setReplyShowMemePicker((prev) => !prev)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{replyShowMemePicker ? "Hide Memes & GIFs" : "Search Memes & GIFs"}</span>
                    {replyShowMemePicker ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 gap-2 bg-background/50 hover:bg-background transition-colors text-[10px] cursor-pointer"
                    disabled={!user || replyUploadingAttachment || replyAttachmentUrls.length >= 5}
                  >
                    <label className={replyAttachmentUrls.length >= 5 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}>
                      <ImageIcon className="h-3.5 w-3.5" />
                      {replyUploadingAttachment
                        ? (replyUploadProgressText || "Uploading...")
                        : replyAttachmentUrls.length > 0
                        ? `Add Image (${replyAttachmentUrls.length}/5)`
                        : "Attach Image"}
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        disabled={!user || replyUploadingAttachment || replyAttachmentUrls.length >= 5}
                        onChange={(event) => {
                          void handleReplyAttachmentUpload(event.target.files);
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
                        (replyContent.trim().length < 2 && replyAttachmentUrls.length === 0)
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

              {/* Inline Reply Live Web GIF Picker */}
              {replyShowMemePicker && (
                <LiveWebGifPicker
                  compact
                  onSelectGif={(gif) => {
                    setReplyAttachmentType("gif");
                    setReplyAttachmentUrls([gif.url]);
                    setReplyAttachmentAlt(gif.title);
                    toast.success("Attached GIF!");
                    setReplyShowMemePicker(false);
                  }}
                  onClose={() => setReplyShowMemePicker(false)}
                />
              )}
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
              placeholder={user ? "Share your thoughts or drop a meme..." : "Sign in to comment"}
              disabled={!user}
              className="min-h-20 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Attachment preview area */}
        {attachmentUrls.length > 0 && (
          <div className="mt-3 rounded-xl border border-border/50 bg-background/80 p-3 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                {attachmentType === "gif" ? (
                  <Film className="h-3.5 w-3.5" />
                ) : (
                  <Flame className="h-3.5 w-3.5" />
                )}
                <span>
                  {attachmentType === "gif"
                    ? "GIF attached"
                    : `Attached Images (${attachmentUrls.length}/5)`}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={clearAttachment}
              >
                <X className="mr-1 h-3 w-3" />
                Remove all
              </Button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {attachmentUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative h-20 w-24 sm:h-24 sm:w-28 rounded-lg overflow-hidden border border-border/60 bg-black/40 shadow-sm shrink-0"
                >
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white/90">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-destructive text-white opacity-80 hover:opacity-100 transition-all shadow cursor-pointer"
                    title="Remove this image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Web Meme & GIF Search Trigger Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 transition-colors text-xs font-semibold cursor-pointer ${
                showMemePicker
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
              }`}
              disabled={!user}
              onClick={() => setShowMemePicker((prev) => !prev)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{showMemePicker ? "Hide Memes & GIFs" : "Search Memes & GIFs"}</span>
              {showMemePicker ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-2 bg-background/50 hover:bg-background transition-colors text-xs cursor-pointer"
              disabled={!user || uploadingAttachment || attachmentUrls.length >= 5}
            >
              <label className={attachmentUrls.length >= 5 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}>
                <ImageIcon className="h-3.5 w-3.5" />
                {uploadingAttachment
                  ? (uploadProgressText || "Uploading...")
                  : attachmentUrls.length > 0
                  ? `Add Image (${attachmentUrls.length}/5)`
                  : "Attach Image"}
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={!user || uploadingAttachment || attachmentUrls.length >= 5}
                  onChange={(event) => {
                    void handleAttachmentUpload(event.target.files);
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
                (content.trim().length < 2 && attachmentUrls.length === 0)
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

        {/* Inline Live Web GIF Picker */}
        {showMemePicker && (
          <LiveWebGifPicker
            onSelectGif={(gif) => {
              setAttachmentType("gif");
              setAttachmentUrls([gif.url]);
              setAttachmentAlt(gif.title);
              toast.success("Attached GIF!");
              setShowMemePicker(false);
            }}
            onClose={() => setShowMemePicker(false)}
          />
        )}
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
