import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { o as Route$c, u as useAuth, a as Button, S as Select, b as SelectTrigger, d as SelectValue, e as SelectContent, f as SelectItem, T as Textarea, c as cn } from "./router-1xbLZGbP.mjs";
import { R as Root, T as Trigger, P as Portal, C as Content, b as Close, a as Title, O as Overlay, D as Description } from "../_libs/radix-ui__react-dialog.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as ChevronLeft, H as House, B as BookOpen, a4 as Minimize, a5 as Maximize, n as ChevronRight, F as ArrowLeft, x as List, a6 as Pause, a7 as Play, a8 as ZoomIn, a9 as ZoomOut, a3 as Flag, s as Heart, aa as ThumbsUp, ab as Laugh, r as Star, ac as Smile, j as MessageSquare, X } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/vercel__analytics.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-scroll-area.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/date-fns.mjs";
const Sheet = Root;
const SheetTrigger = Trigger;
const SheetPortal = Portal;
const SheetOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = reactExports.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, { ref, className: cn(sheetVariants({ side }), className), ...props, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
    ] }),
    children
  ] })
] }));
SheetContent.displayName = Content.displayName;
const SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
SheetHeader.displayName = "SheetHeader";
const SheetTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = Title.displayName;
const SheetDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = Description.displayName;
function Reader() {
  const {
    titleSlug,
    chapterSlug
  } = Route$c.useParams();
  const seriesSlug = titleSlug;
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  const [controlsVisible, setControlsVisible] = reactExports.useState(true);
  const [zoomLevel, setZoomLevel2] = reactExports.useState(100);
  const [lastScrollY, setLastScrollY] = reactExports.useState(0);
  const [scrollingDown, setScrollingDown] = reactExports.useState(false);
  const [showChapters, setShowChapters] = reactExports.useState(false);
  const [showSpeedControl, setShowSpeedControl] = reactExports.useState(false);
  const chapterQ = useQuery({
    queryKey: ["chapter", titleSlug, chapterSlug],
    queryFn: async () => {
      console.log(`Loading chapter: titleSlug=${titleSlug}, chapterSlug=${chapterSlug}`);
      const {
        data: seriesData,
        error: seriesError
      } = await supabase.from("series").select("id, slug, title, type").eq("slug", titleSlug).single();
      if (seriesError) {
        console.error(`Series error for slug ${titleSlug}:`, seriesError);
        throw seriesError;
      }
      if (!seriesData) {
        console.error(`No series found for slug: ${titleSlug}`);
        throw new Error(`Series "${titleSlug}" not found`);
      }
      console.log(`Found series: ${seriesData.title} (ID: ${seriesData.id})`);
      const {
        data,
        error
      } = await supabase.from("chapters").select("*, series:series(id,slug,title,type)").eq("slug", chapterSlug).eq("series_id", seriesData.id).maybeSingle();
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
    }
  });
  const pagesQ = useQuery({
    queryKey: ["pages", chapterQ.data?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapter_pages").select("id,page_number,image_url").eq("chapter_id", chapterQ.data.id).order("page_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data && chapterQ.data.chapter_type === "image"
  });
  const siblingsQ = useQuery({
    queryKey: ["chapter-siblings", chapterQ.data?.series?.id],
    queryFn: async () => {
      console.log(`Loading siblings for series ID: ${chapterQ.data.series.id}`);
      const {
        data,
        error
      } = await supabase.from("chapters").select("id,slug,chapter_number").eq("series_id", chapterQ.data.series.id).eq("status", "published").order("chapter_number");
      if (error) {
        console.error("Siblings query error:", error);
        throw error;
      }
      console.log(`Found ${data?.length || 0} sibling chapters`);
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series?.id
  });
  reactExports.useEffect(() => {
    if (!user || !chapterQ.data) return;
    supabase.from("reading_history").upsert({
      user_id: user.id,
      series_id: chapterQ.data.series_id,
      chapter_id: chapterQ.data.id,
      progress: 0,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }, {
      onConflict: "user_id,chapter_id"
    }).then(() => {
    });
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(Math.round(scrollTop / scrollHeight * 100), 100) : 0;
      const lastProgress = parseInt(localStorage.getItem(`chapter-progress-${chapterQ.data.id}`) || "0");
      if (Math.abs(progress - lastProgress) >= 5) {
        localStorage.setItem(`chapter-progress-${chapterQ.data.id}`, progress.toString());
        supabase.from("reading_history").upsert({
          user_id: user.id,
          series_id: chapterQ.data.series_id,
          chapter_id: chapterQ.data.id,
          progress,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }, {
          onConflict: "user_id,chapter_id"
        }).then(() => {
        });
      }
    };
    let progressTimeout;
    const handleProgressUpdate = () => {
      clearTimeout(progressTimeout);
      progressTimeout = setTimeout(updateProgress, 500);
    };
    window.addEventListener("scroll", handleProgressUpdate);
    return () => {
      clearTimeout(progressTimeout);
      window.removeEventListener("scroll", handleProgressUpdate);
      updateProgress();
    };
  }, [user, chapterQ.data]);
  reactExports.useEffect(() => {
    if (!chapterQ.data?.id) return;
    supabase.rpc("increment_chapter_view", {
      _chapter_id: chapterQ.data.id
    }).then(({
      error
    }) => {
      if (error) {
        console.error("Failed to increment chapter view", error);
        return;
      }
      qc.invalidateQueries({
        queryKey: ["chapter", chapterSlug]
      });
    });
  }, [chapterQ.data?.id, chapterSlug, qc]);
  const idx = siblingsQ.data?.findIndex((c2) => c2.slug === chapterSlug) ?? -1;
  const prev = idx > 0 ? siblingsQ.data[idx - 1] : null;
  const next = idx >= 0 && siblingsQ.data && idx < siblingsQ.data.length - 1 ? siblingsQ.data[idx + 1] : null;
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" && prev) {
        navigate({
          to: "/title/$titleSlug/$chapterSlug",
          params: {
            titleSlug: seriesSlug,
            chapterSlug: prev.slug
          }
        });
      } else if (e.key === "ArrowRight" && next) {
        navigate({
          to: "/title/$titleSlug/$chapterSlug",
          params: {
            titleSlug: seriesSlug,
            chapterSlug: next.slug
          }
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, navigate, seriesSlug]);
  reactExports.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (Math.abs(currentScrollY - lastScrollY) > 10) {
            const isScrollingDown = currentScrollY > lastScrollY;
            setScrollingDown(isScrollingDown);
            setLastScrollY(currentScrollY);
            if (!showChapters && !showSpeedControl) {
              setControlsVisible(!isScrollingDown || currentScrollY < 100);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, showChapters, showSpeedControl]);
  reactExports.useEffect(() => {
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
  const hideTimeoutRef = reactExports.useRef(null);
  const controlsVisibleRef = reactExports.useRef(true);
  const lastTapRef = reactExports.useRef(0);
  const isDoubleTapToggleRef = reactExports.useRef(false);
  const showControls = reactExports.useCallback(() => {
    if (isDoubleTapToggleRef.current) {
      isDoubleTapToggleRef.current = false;
      return;
    }
    setControlsVisible(true);
    controlsVisibleRef.current = true;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (window.innerWidth < 768) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!showChapters && !showSpeedControl) {
          setControlsVisible(false);
          controlsVisibleRef.current = false;
        }
      }, 3e3);
    }
  }, [showChapters, showSpeedControl]);
  reactExports.useEffect(() => {
    showControls();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showControls]);
  reactExports.useEffect(() => {
    const handleMouseActivity = () => showControls();
    const handleScrollActivity = () => showControls();
    const handleDoubleTap = (e) => {
      const currentTime = (/* @__PURE__ */ new Date()).getTime();
      const tapLength = currentTime - lastTapRef.current;
      if (tapLength < 300 && tapLength > 0) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) {
          lastTapRef.current = currentTime;
          return;
        }
        const screenWidth = window.innerWidth;
        const tapX = touch.clientX;
        if (tapX > screenWidth * 0.2 && tapX < screenWidth * 0.8) {
          e.preventDefault();
          e.stopPropagation();
          const newVisible = !controlsVisibleRef.current;
          controlsVisibleRef.current = newVisible;
          setControlsVisible(newVisible);
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          if (newVisible) {
            hideTimeoutRef.current = setTimeout(() => {
              setControlsVisible(false);
              controlsVisibleRef.current = false;
            }, 3e3);
          } else {
            isDoubleTapToggleRef.current = true;
          }
          lastTapRef.current = 0;
          return;
        }
      }
      lastTapRef.current = currentTime;
    };
    document.addEventListener("mousemove", handleMouseActivity);
    document.addEventListener("touchstart", handleDoubleTap, {
      passive: false
    });
    document.addEventListener("scroll", handleScrollActivity);
    return () => {
      document.removeEventListener("mousemove", handleMouseActivity);
      document.removeEventListener("touchstart", handleDoubleTap);
      document.removeEventListener("scroll", handleScrollActivity);
    };
  }, [showControls]);
  if (chapterQ.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-background text-muted-foreground", children: "Loading chapter…" });
  }
  if (chapterQ.error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-background p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-destructive", children: "Error loading chapter" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: chapterQ.error.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "text-primary", children: "Go home" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "•" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
          slug: titleSlug
        }, className: "text-primary", children: "Back to series" })
      ] })
    ] }) });
  }
  if (!chapterQ.data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-background p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Chapter not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        'Chapter "',
        chapterSlug,
        '" was not found in series "',
        titleSlug,
        '"'
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "text-primary", children: "Go home" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "•" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
          slug: titleSlug
        }, className: "text-primary", children: "Back to series" })
      ] })
    ] }) });
  }
  const c = chapterQ.data;
  const isNovel = c.chapter_type === "novel";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `transition-transform duration-300 ${controlsVisible ? "translate-y-0" : "-translate-y-full"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReaderTopBar, { title: `Ch. ${c.chapter_number}${c.title ? " — " + c.title : ""}`, seriesTitle: c.series?.title ?? "", seriesSlug: c.series?.slug ?? "", isNovel, allChapters: siblingsQ.data ?? [], currentChapterSlug: chapterSlug }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: isNovel ? /* @__PURE__ */ jsxRuntimeExports.jsx(NovelView, { content: c.novel_content ?? "", chapterId: c.id, hasPrev: !!prev, hasNext: !!next, onPrev: () => prev && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: prev.slug
      }
    }), onNext: () => next && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: next.slug
      }
    }), seriesSlug }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ImageView, { pages: pagesQ.data, loading: pagesQ.isLoading, chapterId: c.id, zoomLevel, hasPrev: !!prev, hasNext: !!next, onPrev: () => prev && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: prev.slug
      }
    }), onNext: () => next && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: next.slug
      }
    }), seriesSlug }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FloatingControls, { isFullscreen, toggleFullscreen, hasPrev: !!prev, hasNext: !!next, onPrev: () => prev && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: prev.slug
      }
    }), onNext: () => next && navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: next.slug
      }
    }), seriesSlug, allChapters: siblingsQ.data ?? [], currentChapterSlug: chapterSlug, chapterId: c.id, seriesId: c.series_id, seriesTitle: c.series?.title ?? "", isNovel, zoomLevel, onZoomIn: () => setZoomLevel2((prev2) => Math.min(prev2 + 25, 200)), onZoomOut: () => setZoomLevel2((prev2) => Math.max(prev2 - 25, 50)), onZoomReset: () => setZoomLevel2(100), showChapters, setShowChapters, showSpeedControl, setShowSpeedControl }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `transition-transform duration-300 ${controlsVisible ? "translate-y-0" : "translate-y-full"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "sticky bottom-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex items-center justify-between gap-2 px-8 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", disabled: !prev, onClick: () => prev && navigate({
        to: "/title/$titleSlug/$chapterSlug",
        params: {
          titleSlug: seriesSlug,
          chapterSlug: prev.slug
        }
      }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "mr-1 h-4 w-4" }),
        "Prev"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", title: "Home", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
          slug: seriesSlug
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", title: "Back to title", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: toggleFullscreen, title: isFullscreen ? "Exit Fullscreen" : "Fullscreen", children: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx(Minimize, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ReportButton, { chapterId: c.id, seriesId: c.series_id, seriesTitle: c.series?.title ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", disabled: !next, onClick: () => next && navigate({
        to: "/title/$titleSlug/$chapterSlug",
        params: {
          titleSlug: seriesSlug,
          chapterSlug: next.slug
        }
      }), children: [
        "Next",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
      ] })
    ] }) }) })
  ] });
}
function ReaderTopBar({
  title,
  seriesTitle,
  seriesSlug,
  isNovel,
  allChapters,
  currentChapterSlug
}) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex items-center justify-between gap-2 px-8 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
      slug: seriesSlug
    }, className: "flex min-w-0 items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-semibold", children: seriesTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs text-muted-foreground", children: title })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: allChapters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: currentChapterSlug, onValueChange: (slug) => navigate({
      to: "/title/$titleSlug/$chapterSlug",
      params: {
        titleSlug: seriesSlug,
        chapterSlug: slug
      }
    }), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectTrigger, { className: "w-[180px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "mr-2 h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select Chapter" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: allChapters.map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: ch.slug, children: [
        "Chapter ",
        ch.chapter_number
      ] }, ch.id)) })
    ] }) })
  ] }) });
}
function ImageView({
  pages,
  loading,
  chapterId,
  zoomLevel,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug
}) {
  const [isMobile, setIsMobile] = reactExports.useState(false);
  useAuth();
  reactExports.useRef(null);
  reactExports.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  reactExports.useEffect(() => {
    if (!chapterId || loading || !pages?.length) return;
    const scrollKey = `chapter-scroll-${chapterId}`;
    const restoreScroll = () => {
      const savedPosition = localStorage.getItem(scrollKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        setTimeout(() => {
          window.scrollTo({
            top: position,
            behavior: "instant"
          });
        }, 100);
      }
    };
    const saveScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(scrollKey, scrollTop.toString());
    };
    let scrollTimeout;
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
  }, [chapterId, loading, pages?.length]);
  reactExports.useEffect(() => {
    const cleanupOldScrollPositions = () => {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("chapter-scroll-"));
      if (keys.length > 10) {
        keys.sort().slice(0, keys.length - 10).forEach((key) => {
          localStorage.removeItem(key);
        });
      }
    };
    cleanupOldScrollPositions();
  }, [chapterId]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto max-w-3xl px-2 py-6 space-y-2", children: Array.from({
      length: 4
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[2/3] animate-pulse rounded bg-secondary" }, i)) });
  }
  if (!pages || pages.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-[50vh] place-items-center text-muted-foreground", children: "No pages uploaded for this chapter yet." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-2 py-4", children: [
    pages.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: `Page ${p.page_number}`, loading: "lazy", className: "mx-auto block w-full transition-transform duration-200", style: {
      transform: isMobile ? "scale(1)" : `scale(${zoomLevel / 100})`,
      transformOrigin: "top center"
    } }, p.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterNavigation, { hasPrev, hasNext, onPrev, onNext, seriesSlug }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterReactions, { chapterId })
  ] }) });
}
function NovelView({
  content,
  chapterId,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug
}) {
  reactExports.useEffect(() => {
    if (!chapterId || !content) return;
    const scrollKey = `chapter-scroll-${chapterId}`;
    const restoreScroll = () => {
      const savedPosition = localStorage.getItem(scrollKey);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        setTimeout(() => {
          window.scrollTo({
            top: position,
            behavior: "instant"
          });
        }, 100);
      }
    };
    const saveScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      localStorage.setItem(scrollKey, scrollTop.toString());
    };
    let scrollTimeout;
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-4 py-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "text-foreground", style: {
      fontSize: "var(--novel-font-size, 18px)",
      lineHeight: "var(--novel-line-height, 1.7)"
    }, children: content.split(/\n{2,}/).map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 whitespace-pre-wrap", children: p }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterNavigation, { hasPrev, hasNext, onPrev, onNext, seriesSlug })
  ] });
}
function ChapterNavigation({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-8 flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "lg", disabled: !hasPrev, onClick: onPrev, className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "mr-2 h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Previous" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Prev" })
    ] }),
    seriesSlug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
      slug: seriesSlug
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "lg", className: "px-6", title: "Series Info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5" }) }) }),
    hasNext ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", onClick: onNext, className: "flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Next" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Next" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-2 h-5 w-5" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "mr-2 h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Home" })
    ] }) })
  ] });
}
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
  isNovel,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  showChapters,
  setShowChapters,
  showSpeedControl,
  setShowSpeedControl
}) {
  const navigate = useNavigate();
  const [showReport, setShowReport] = reactExports.useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = reactExports.useState(false);
  const [scrollSpeed, setScrollSpeed] = reactExports.useState(3);
  const scrollIntervalRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (autoScrollEnabled) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      const scrollAmount = scrollSpeed * 0.5;
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({
          top: scrollAmount,
          behavior: "auto"
        });
        if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight) {
          setAutoScrollEnabled(false);
        }
      }, 16);
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
  reactExports.useEffect(() => {
    const handleUserScroll = (e) => {
      if (autoScrollEnabled) {
        setAutoScrollEnabled(false);
      }
    };
    const handleKeyPress = (e) => {
      if (autoScrollEnabled && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Space"].includes(e.key)) {
        setAutoScrollEnabled(false);
      }
    };
    window.addEventListener("wheel", handleUserScroll, {
      passive: true
    });
    window.addEventListener("touchmove", handleUserScroll, {
      passive: true
    });
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2 bg-card backdrop-blur-lg rounded-full p-2 border border-border/50 shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onPrev, disabled: !hasPrev, className: "p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "Previous Chapter", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleAutoScroll, className: `p-3 rounded-full transition-colors ${autoScrollEnabled ? "bg-violet-600 text-white hover:bg-violet-700" : "hover:bg-primary/20"}`, title: autoScrollEnabled ? "Pause Auto Scroll" : "Start Auto Scroll", children: autoScrollEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-5 w-5" }) }),
      autoScrollEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowSpeedControl(!showSpeedControl), className: "p-3 rounded-full hover:bg-primary/20 transition-colors text-xs font-bold", title: "Adjust Speed", children: [
        scrollSpeed,
        "x"
      ] }),
      !isNovel && zoomLevel !== void 0 && onZoomIn && onZoomOut && onZoomReset && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-border/50 my-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onZoomIn, disabled: zoomLevel >= 200, className: "p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "Zoom In", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: onZoomReset, className: "p-3 rounded-full hover:bg-primary/20 transition-colors flex items-center justify-center text-xs font-semibold", title: "Reset Zoom (100%)", children: [
          zoomLevel,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onZoomOut, disabled: zoomLevel <= 50, className: "p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "Zoom Out", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-border/50 my-1" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowChapters(!showChapters), className: "p-3 rounded-full hover:bg-primary/20 transition-colors", title: "Chapters", children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "p-3 rounded-full hover:bg-primary/20 transition-colors", title: "Home", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
        slug: seriesSlug
      }, className: "p-3 rounded-full hover:bg-primary/20 transition-colors", title: "Back to title", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleFullscreen, className: "p-3 rounded-full hover:bg-primary/20 transition-colors", title: isFullscreen ? "Exit Fullscreen" : "Fullscreen", children: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx(Minimize, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowReport(!showReport), className: "p-3 rounded-full hover:bg-primary/20 transition-colors", title: "Report", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onNext, disabled: !hasNext, className: "p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "Next Chapter", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-5 w-5" }) })
    ] }),
    showSpeedControl && autoScrollEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed right-20 top-1/2 -translate-y-1/2 z-40 w-56 bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: "Scroll Speed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowSpeedControl(false), className: "hover:text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-3", children: scrollSpeed <= 3 ? "Slow" : scrollSpeed <= 6 ? "Medium" : "Fast" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: "1", max: "10", value: scrollSpeed, onChange: (e) => setScrollSpeed(Number(e.target.value)), className: "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-violet-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mt-3 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: scrollSpeed === 2 ? "default" : "outline", size: "sm", onClick: () => setScrollSpeed(2), className: "flex-1 text-xs", children: "Slow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: scrollSpeed === 5 ? "default" : "outline", size: "sm", onClick: () => setScrollSpeed(5), className: "flex-1 text-xs", children: "Medium" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: scrollSpeed === 8 ? "default" : "outline", size: "sm", onClick: () => setScrollSpeed(8), className: "flex-1 text-xs", children: "Fast" })
      ] })
    ] }),
    showChapters && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed right-20 top-1/2 -translate-y-1/2 z-40 w-80 max-h-[500px] overflow-hidden bg-card backdrop-blur-lg rounded-xl border border-border/50 shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 bg-card/95 backdrop-blur-md p-4 border-b border-border/50 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-bold", children: "Chapters" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowChapters(false), className: "hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-y-auto max-h-[420px] p-3 space-y-1.5 scrollbar-thin", children: allChapters.map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
        navigate({
          to: "/title/$titleSlug/$chapterSlug",
          params: {
            titleSlug: seriesSlug,
            chapterSlug: ch.slug
          }
        });
        setShowChapters(false);
      }, className: `w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-primary/20 transition-all ${ch.slug === currentChapterSlug ? "bg-violet-600 text-white font-semibold shadow-md" : "hover:shadow-sm"}`, children: [
        "Chapter ",
        ch.chapter_number
      ] }, ch.id)) })
    ] }),
    showReport && /* @__PURE__ */ jsxRuntimeExports.jsx(FloatingReportPanel, { onClose: () => setShowReport(false), chapterId, seriesId, seriesTitle })
  ] });
}
function FloatingReportPanel({
  onClose,
  chapterId,
  seriesId,
  seriesTitle
}) {
  const {
    user
  } = useAuth();
  const [reason, setReason] = reactExports.useState("");
  const [reportType, setReportType] = reactExports.useState("chapter");
  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      const {
        error
      } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
      onClose();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed right-20 top-1/2 -translate-y-1/2 z-40 w-72 bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 bg-card backdrop-blur p-3 border-b border-border/50 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: "Report Issue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "hover:text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: reportType, onValueChange: (v) => setReportType(v), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "chapter", children: "Report Chapter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "series", children: "Report Title" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Describe the issue (min 10 characters)...", value: reason, onChange: (e) => setReason(e.target.value), rows: 5, className: "resize-none text-sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => submitReport.mutate(), disabled: !user || submitReport.isPending, className: "w-full", children: "Submit Report" })
    ] })
  ] });
}
function ReportButton({
  chapterId,
  seriesId,
  seriesTitle
}) {
  const {
    user
  } = useAuth();
  const [reason, setReason] = reactExports.useState("");
  const [reportType, setReportType] = reactExports.useState("chapter");
  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      const {
        error
      } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "h-4 w-4" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "bottom", className: "h-[400px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "Report Issue" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: reportType, onValueChange: (v) => setReportType(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "chapter", children: "Report Chapter" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "series", children: "Report Title" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "Describe the issue (min 10 characters)...", value: reason, onChange: (e) => setReason(e.target.value), rows: 6, className: "resize-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: () => submitReport.mutate(), disabled: !user || submitReport.isPending, children: "Submit Report" })
      ] })
    ] })
  ] });
}
function ChapterReactions({
  chapterId
}) {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const reactions = [{
    type: "heart",
    icon: Heart,
    label: "Love"
  }, {
    type: "thumbs_up",
    icon: ThumbsUp,
    label: "Like"
  }, {
    type: "laugh",
    icon: Laugh,
    label: "Funny"
  }, {
    type: "star",
    icon: Star,
    label: "Amazing"
  }, {
    type: "smile",
    icon: Smile,
    label: "Enjoyed"
  }];
  const reactionsQ = useQuery({
    queryKey: ["chapter-reactions", chapterId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapter_reactions").select("reaction_type").eq("chapter_id", chapterId);
      if (error) throw error;
      const counts = {};
      data?.forEach((r) => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      return counts;
    }
  });
  const userReactionsQ = useQuery({
    queryKey: ["user-chapter-reactions", chapterId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data,
        error
      } = await supabase.from("chapter_reactions").select("reaction_type").eq("chapter_id", chapterId).eq("user_id", user.id);
      if (error) throw error;
      return data?.map((r) => r.reaction_type) || [];
    },
    enabled: !!user
  });
  const toggleReaction = useMutation({
    mutationFn: async (reactionType) => {
      if (!user) {
        toast.error("Sign in to react");
        return;
      }
      const hasReacted = userReactionsQ.data?.includes(reactionType);
      if (hasReacted) {
        const {
          error
        } = await supabase.from("chapter_reactions").delete().eq("chapter_id", chapterId).eq("user_id", user.id).eq("reaction_type", reactionType);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from("chapter_reactions").insert({
          chapter_id: chapterId,
          user_id: user.id,
          reaction_type: reactionType
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["chapter-reactions", chapterId]
      });
      qc.invalidateQueries({
        queryKey: ["user-chapter-reactions", chapterId, user?.id]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 mb-8 border-t border-border pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-4", children: "How did you like this chapter?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: reactions.map((reaction) => {
        const Icon = reaction.icon;
        const count = reactionsQ.data?.[reaction.type] || 0;
        const hasReacted = userReactionsQ.data?.includes(reaction.type);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleReaction.mutate(reaction.type), disabled: toggleReaction.isPending, className: `flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${hasReacted ? "bg-primary/20 border-primary text-primary" : "border-border hover:bg-primary/10 hover:border-primary/50"}`, title: reaction.label, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-5 w-5 ${hasReacted ? "fill-current" : ""}` }),
          count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: count })
        ] }, reaction.type);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border rounded-lg p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-2", children: "Comments" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Coming Soon" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Share your thoughts and discuss this chapter with other readers" })
    ] })
  ] });
}
export {
  Reader as component
};
