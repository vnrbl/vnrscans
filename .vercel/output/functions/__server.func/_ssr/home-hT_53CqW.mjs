import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-4GTNZWAa.mjs";
import { u as useAuth, B as Badge, a as Button } from "./router-DABr79Tj.mjs";
import { C as Card } from "./card-00PypCa5.mjs";
import { u as useDragScroll, D as DRAG_SCROLL_CONTAINER_CLASS } from "./useDragScroll-C5XUCbiC.mjs";
import { T as TITLE_CARD_WIDTH, a as TITLE_COVER_CLASS } from "./titleCardStyles-wF_NUguc.mjs";
import "../_libs/sonner.mjs";
import { t as History, u as ChevronLeft, n as ChevronRight, B as BookOpen, r as Star, v as Clock } from "../_libs/lucide-react.mjs";
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
import "../_libs/class-variance-authority.mjs";
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
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-scroll-area.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/date-fns.mjs";
function HomeHeroCarousel() {
  const scrollContainerRef = reactExports.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = reactExports.useState(false);
  const [showRightArrow, setShowRightArrow] = reactExports.useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = reactExports.useState(true);
  const [isPaused, setIsPaused] = reactExports.useState(false);
  const autoScrollIntervalRef = reactExports.useRef(null);
  const carouselSeries = useQuery({
    queryKey: ["carousel", "series"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("carousel_items").select(`
            id,
            series:series_id(
              id,
              title,
              slug,
              cover_url,
              description,
              type
            )
          `).eq("is_active", true).order("position", { ascending: true });
        if (error) {
          if (error.code === "42P01") {
            console.log("carousel_items table doesn't exist yet");
            return [];
          }
          throw error;
        }
        return (data ?? []).filter((item) => item.series);
      } catch (err) {
        console.error("Error fetching carousel items:", err);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1e3
    // Cache for 5 minutes
  });
  const items = carouselSeries.data ?? [];
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  const shuffledItems = reactExports.useMemo(() => {
    return items.length > 0 ? shuffleArray(items) : [];
  }, [items.length]);
  const loopedItems = shuffledItems.length > 0 ? [...shuffledItems, ...shuffledItems, ...shuffledItems] : [];
  const updateArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };
  reactExports.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || shuffledItems.length === 0) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const itemWidth = 286;
      const sectionWidth = shuffledItems.length * itemWidth;
      if (scrollLeft <= itemWidth) {
        container.scrollLeft = sectionWidth + itemWidth;
      } else if (scrollLeft >= scrollWidth - clientWidth - itemWidth) {
        container.scrollLeft = sectionWidth - clientWidth + itemWidth;
      }
      updateArrows();
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [shuffledItems.length]);
  reactExports.useEffect(() => {
    if (scrollContainerRef.current && shuffledItems.length > 0) {
      const itemWidth = 286;
      const sectionWidth = shuffledItems.length * itemWidth;
      scrollContainerRef.current.scrollLeft = sectionWidth;
      updateArrows();
    }
  }, [shuffledItems.length]);
  reactExports.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || shuffledItems.length === 0 || isPaused || !isAutoScrolling) return;
    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (container && !isPaused) {
          container.scrollLeft += 1;
        }
      }, 30);
    };
    startAutoScroll();
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [shuffledItems.length, isPaused, isAutoScrolling]);
  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    setIsPaused(true);
    const scrollAmount = 800;
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    setTimeout(() => setIsPaused(false), 5e3);
  };
  const handleMouseEnter = () => {
    setIsPaused(true);
  };
  const handleMouseLeave = () => {
    setTimeout(() => {
      setIsPaused(false);
    }, 100);
  };
  if (carouselSeries.isLoading || items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative w-full overflow-hidden bg-gradient-to-b from-background via-background/95 to-background/90 py-6 mt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 md:px-12 lg:px-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-0 bottom-0 w-32 md:w-40 lg:w-48 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 bottom-0 w-32 md:w-40 lg:w-48 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
        showLeftArrow && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "icon",
            className: "absolute left-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity",
            onClick: () => scroll("left"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-6 w-6" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: scrollContainerRef,
            className: "flex gap-4 overflow-x-auto scrollbar-hide pb-2",
            style: {
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollBehavior: "auto"
            },
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            children: loopedItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: `/title/${item.series.slug}`,
                className: "group/card flex-shrink-0 block",
                style: { perspective: "1000px" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "relative w-[210px] h-[300px] md:w-[240px] md:h-[345px] lg:w-[270px] lg:h-[390px] rounded-lg overflow-hidden shadow-lg group-hover/card:shadow-[0_20px_50px_rgba(139,92,246,0.4)] transition-all duration-300",
                    style: {
                      transformStyle: "preserve-3d",
                      transform: "rotateY(0deg) rotateX(0deg)"
                    },
                    onMouseMove: (e) => {
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = (y - centerY) / centerY * -10;
                      const rotateY = (x - centerX) / centerX * 10;
                      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                    },
                    onMouseLeave: (e) => {
                      const card = e.currentTarget;
                      card.style.transform = "rotateY(0deg) rotateX(0deg)";
                    },
                    children: [
                      item.series.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: item.series.cover_url,
                          alt: item.series.title,
                          className: "w-full h-full object-cover",
                          loading: "lazy"
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-gradient-to-br from-violet-900/20 to-violet-600/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm", children: "No Cover" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -inset-full animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent backdrop-blur-[1px]" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover/card:translate-y-0 transition-transform duration-300", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white text-sm font-semibold line-clamp-2 drop-shadow-lg", children: item.series.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 text-xs mt-1", children: item.series.type })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 border border-white/20 rounded-lg pointer-events-none group-hover/card:border-white/40 transition-colors" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-tl-lg" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-br-lg" })
                    ]
                  }
                )
              },
              `${item.id}-${index}`
            ))
          }
        ),
        showRightArrow && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "icon",
            className: "absolute right-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity",
            onClick: () => scroll("right"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-6 w-6" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
      ` })
  ] });
}
function HomePage() {
  const {
    user
  } = useAuth();
  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,description").eq("is_featured", true).limit(6);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 5,
    // 5 minutes
    gcTime: 1e3 * 60 * 10
    // 10 minutes (formerly cacheTime)
  });
  useQuery({
    queryKey: ["recent-chapters"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapters").select("id,slug,title,chapter_number,created_at,series:series_id(slug,title,cover_url)").eq("status", "published").order("created_at", {
        ascending: false
      }).limit(18);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 2,
    // 2 minutes
    gcTime: 1e3 * 60 * 5
    // 5 minutes
  });
  const readingHistory = useQuery({
    queryKey: ["home-reading-history", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("reading_history").select("id,updated_at,series_id,series:series_id(slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)").eq("user_id", user.id).order("updated_at", {
        ascending: false
      });
      if (error) throw error;
      const seriesMap = /* @__PURE__ */ new Map();
      (data ?? []).forEach((item) => {
        if (item.series_id && !seriesMap.has(item.series_id)) {
          seriesMap.set(item.series_id, item);
        }
      });
      return Array.from(seriesMap.values()).slice(0, 18);
    },
    enabled: !!user,
    staleTime: 1e3 * 60,
    // 1 minute
    gcTime: 1e3 * 60 * 5
    // 5 minutes
  });
  const followedChapters = useQuery({
    queryKey: ["home-followed-chapters", user?.id],
    queryFn: async () => {
      const {
        data: library,
        error: libError
      } = await supabase.from("user_library").select("series_id").eq("user_id", user.id);
      if (libError) throw libError;
      const seriesIds = (library ?? []).map((row) => row.series_id);
      if (seriesIds.length === 0) return [];
      const {
        data,
        error
      } = await supabase.from("chapters").select("id,slug,title,chapter_number,created_at,series:series_id(slug,title,cover_url)").in("series_id", seriesIds).eq("status", "published").order("created_at", {
        ascending: false
      }).limit(18);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 1e3 * 60 * 2,
    // 2 minutes
    gcTime: 1e3 * 60 * 5
    // 5 minutes
  });
  const popular = useQuery({
    queryKey: ["popular"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,status,view_count").order("view_count", {
        ascending: false
      }).limit(15);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 10,
    // 10 minutes
    gcTime: 1e3 * 60 * 30
    // 30 minutes
  });
  const latestUpdates = useQuery({
    queryKey: ["latest-updates"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("chapters").select("id,slug,chapter_number,title,created_at,series_id,series:series_id(id,slug,title,cover_url,type)").eq("status", "published").order("created_at", {
        ascending: false
      }).limit(100);
      if (error) throw error;
      const seriesMap = /* @__PURE__ */ new Map();
      (data || []).forEach((ch) => {
        if (!ch.series) return;
        const seriesId = ch.series.id;
        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            ...ch.series,
            latest_update: ch.created_at,
            recent_chapters: []
          });
        }
        const seriesData = seriesMap.get(seriesId);
        if (seriesData.recent_chapters.length < 5) {
          seriesData.recent_chapters.push({
            id: ch.id,
            slug: ch.slug,
            chapter_number: ch.chapter_number,
            title: ch.title,
            created_at: ch.created_at
          });
        }
      });
      return Array.from(seriesMap.values()).slice(0, 12);
    },
    staleTime: 1e3 * 60 * 2,
    // 2 minutes
    gcTime: 1e3 * 60 * 5
    // 5 minutes
  });
  const highScore = useQuery({
    queryKey: ["high-score"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("series").select("id,slug,title,cover_url,type,rating_average,status,view_count").order("rating_average", {
        ascending: false
      }).limit(15);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 10,
    // 10 minutes
    gcTime: 1e3 * 60 * 30
    // 30 minutes
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(HomeHeroCarousel, {}),
    featured.data && featured.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: featured.data.map((series) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
      slug: series.slug
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0", children: [
        series.cover_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: series.cover_url, alt: series.title, className: "h-full w-full object-cover opacity-20 blur-sm transition-all group-hover:opacity-30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex h-full min-h-[200px] flex-col justify-end p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "mb-2 w-fit text-xs uppercase", children: series.type }),
        series.rating_average && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-1 text-sm font-semibold text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "★" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: Number(series.rating_average).toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 line-clamp-2 text-xl font-bold", children: series.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-2 text-sm text-muted-foreground", children: series.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "mt-4 w-fit", children: "Read" })
      ] })
    ] }) }, series.id)) }) }),
    user && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterCarouselSection, { title: "New Chapters from Followed", description: "Latest uploads from series you follow", loading: followedChapters.isLoading, emptyMessage: "Follow series to get new chapter updates here.", chapters: followedChapters.data ?? [], timeField: "created", linkVariant: "split" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChapterCarouselSection, { title: "Reading History", description: "Pick up where you left off", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-5 w-5" }), loading: readingHistory.isLoading, emptyMessage: "No reading history yet. Start a series to see it here.", chapters: mapHistoryToChapters(readingHistory.data), timeField: "updated", linkVariant: "seriesOnly" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LatestUpdatesSection, { title: "Latest Updates", description: "Recently updated series with new chapters", series: latestUpdates.data ?? [], loading: latestUpdates.isLoading, userId: user?.id }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCarouselSection, { title: "Popular Manhwa", description: "Discover the most read manhwa series ranked by our community", series: popular.data ?? [], loading: popular.isLoading }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SeriesCarouselSection, { title: "High Score Manhwa", description: "Discover the highest rated manhwa series", series: highScore.data ?? [], loading: highScore.isLoading })
  ] });
}
function mapHistoryToChapters(rows) {
  if (!rows) return [];
  return rows.filter((row) => row.chapters?.slug && row.series?.slug).map((row) => ({
    id: row.id,
    slug: row.chapters.slug,
    title: row.chapters.title,
    chapter_number: row.chapters.chapter_number,
    created_at: row.updated_at,
    series: row.series
  }));
}
function ChapterCarouselSection({
  title,
  description,
  icon,
  loading,
  emptyMessage,
  chapters,
  timeField,
  linkVariant
}) {
  const {
    scrollRef,
    scrollBy,
    dragHandlers
  } = useDragScroll();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          icon,
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: title })
        ] }),
        description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
      ] }),
      chapters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden gap-2 md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => scrollBy("left"), className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => scrollBy("right"), className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4 overflow-hidden", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${TITLE_COVER_CLASS} animate-pulse bg-secondary` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-1/2 animate-pulse rounded bg-secondary" })
      ] })
    ] }, i)) }) : chapters.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, ...dragHandlers, className: DRAG_SCROLL_CONTAINER_CLASS, style: {
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }, children: chapters.map((chapter) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: TITLE_CARD_WIDTH, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RecentChapterCard, { chapter, timeField, linkVariant }) }, chapter.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: emptyMessage }) })
  ] });
}
function SeriesCarouselSection({
  title,
  description,
  series,
  loading
}) {
  const {
    scrollRef,
    scrollBy,
    dragHandlers
  } = useDragScroll();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: title }),
        description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
      ] }),
      series.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden gap-2 md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => scrollBy("left"), className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => scrollBy("right"), className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4 overflow-hidden", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${TITLE_COVER_CLASS} animate-pulse bg-secondary` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-1/2 animate-pulse rounded bg-secondary" })
      ] })
    ] }, i)) }) : series.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, ...dragHandlers, className: DRAG_SCROLL_CONTAINER_CLASS, style: {
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }, children: series.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$slug", params: {
      slug: item.slug
    }, className: `group ${TITLE_CARD_WIDTH} overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: TITLE_COVER_CLASS, children: [
        item.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.cover_url, alt: item.title, loading: "lazy", className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", draggable: false }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-2 top-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "bg-background/80 text-xs uppercase backdrop-blur", children: item.type }) }),
        item.rating_average && Number(item.rating_average) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-violet-600 text-violet-600" }),
          Number(item.rating_average).toFixed(1)
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary", children: item.title }) })
    ] }, item.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No series available yet." }) })
  ] });
}
function LatestUpdatesSection({
  title,
  description,
  series,
  loading,
  userId
}) {
  const readingHistoryQuery = useQuery({
    queryKey: ["latest-updates-reading-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      const {
        data,
        error
      } = await supabase.from("reading_history").select("chapter_id").eq("user_id", userId);
      if (error) throw error;
      return data?.map((d) => d.chapter_id) ?? [];
    },
    enabled: !!userId,
    staleTime: 1e3 * 60 * 2
    // 2 minutes
  });
  const readChapterIds = new Set(readingHistoryQuery.data ?? []);
  const isNewChapter = (createdAt) => {
    const now = /* @__PURE__ */ new Date();
    const chapterDate = new Date(createdAt);
    const oneDayInMs = 24 * 60 * 60 * 1e3;
    const timeDiff = now.getTime() - chapterDate.getTime();
    return timeDiff < oneDayInMs && timeDiff >= 0;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "container mx-auto px-8 md:px-12 lg:px-16 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: title }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: description })
    ] }) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border/40 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[200px] w-[140px] shrink-0 animate-pulse rounded-lg bg-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-3/4 animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-1/2 animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full animate-pulse rounded bg-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full animate-pulse rounded bg-secondary" })
      ] })
    ] }) }, i)) }) : series.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: series.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
        slug: item.slug
      }, className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-[200px] w-[140px] overflow-hidden rounded-lg bg-secondary", children: item.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.cover_url, alt: item.title, loading: "lazy", className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", draggable: false }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
          slug: item.slug
        }, className: "line-clamp-2 text-base font-bold leading-tight hover:text-violet-600", children: item.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: item.recent_chapters.map((chapter) => {
          const isRead = readChapterIds.has(chapter.id);
          const isNew = isNewChapter(chapter.created_at);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$titleSlug/$chapterSlug", params: {
            titleSlug: item.slug,
            chapterSlug: chapter.slug
          }, className: `flex items-center justify-between text-sm transition-colors ${isRead ? "text-muted-foreground hover:text-muted-foreground/80" : "hover:text-violet-600 font-medium"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2", children: [
              isRead ? /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5 shrink-0 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5 shrink-0 text-violet-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                "Chapter ",
                chapter.chapter_number
              ] }),
              isNew && !isRead && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-2.5 w-2.5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }) }),
                "NEW"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 shrink-0 text-xs text-muted-foreground", children: formatTimeAgo(chapter.created_at) })
          ] }, chapter.id);
        }) })
      ] })
    ] }) }, item.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border/40 bg-card p-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No recent updates available." }) })
  ] });
}
function RecentChapterCard({
  chapter,
  timeField = "created",
  linkVariant = "split"
}) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;
  const chapterLabel = chapter.title ? `Chapter ${chapter.chapter_number}: ${chapter.title}` : timeField === "created" ? `Chapter ${chapter.chapter_number} uploaded` : `Chapter ${chapter.chapter_number}`;
  const timeLabel = timeField === "updated" ? "Last read" : "Uploaded";
  const cover = /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: TITLE_COVER_CLASS, children: chapter.series?.cover_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: chapter.series.cover_url, alt: chapter.series.title, loading: "lazy", className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", draggable: false }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10" }) }) });
  const timeRow = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-1 text-xs text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
      timeLabel,
      " ",
      formatTimeAgo(chapter.created_at)
    ] })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
      slug: seriesSlug
    }, className: "block", children: cover }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/title/$slug", params: {
        slug: seriesSlug
      }, className: "line-clamp-2 text-sm font-semibold leading-tight text-foreground hover:text-primary", children: chapter.series?.title }),
      linkVariant === "seriesOnly" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground", children: chapterLabel }),
        timeRow
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "secondary", size: "sm", className: "mt-2 h-8 w-full text-xs font-semibold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/title/$titleSlug/$chapterSlug", params: {
          titleSlug: seriesSlug,
          chapterSlug: chapter.slug
        }, children: [
          "Ch. ",
          chapter.chapter_number
        ] }) }),
        chapter.title && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground", children: chapter.title }),
        timeRow
      ] })
    ] })
  ] });
}
function formatTimeAgo(date) {
  const seconds = Math.floor(((/* @__PURE__ */ new Date()).getTime() - new Date(date).getTime()) / 1e3);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
export {
  HomePage as component
};
