import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { OptimizedImage } from "@/components/OptimizedImage";

type CarouselItem = {
  id: string;
  series: {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
    description: string | null;
    type: string;
  };
};

export function HomeHeroCarousel() {
  const { settings } = useReaderSettings();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef<boolean>(false);
  const scrollPosRef = useRef<number>(0);
  const autoScrollRafRef = useRef<number | null>(null);
  const tiltRafByCard = useRef<WeakMap<HTMLElement, number>>(new WeakMap());
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Fetch carousel series items
  const carouselSeries = useQuery({
    queryKey: ["carousel", "series"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("carousel_items")
          .select(`
            id,
            series:series_id(
              id,
              title,
              slug,
              cover_url,
              description,
              type
            )
          `)
          .eq("is_active", true)
          .order("position", { ascending: true });
        
        if (error) {
          if (error.code === '42P01') {
            console.log("carousel_items table doesn't exist yet");
            return [];
          }
          throw error;
        }
        
        return (data ?? []).filter(item => item.series) as CarouselItem[];
      } catch (err) {
        console.error("Error fetching carousel items:", err);
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const rawItems = carouselSeries.data ?? [];
  
  const items = useMemo(() => {
    if (settings.showNovelsOnHome) return rawItems;
    return rawItems.filter(item => item.series?.type !== "novel");
  }, [rawItems, settings.showNovelsOnHome]);
  
  // Shuffle function (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Shuffle items once on load (use useMemo to prevent re-shuffling on every render)
  const shuffledItems = useMemo(() => {
    return items.length > 0 ? shuffleArray(items) : [];
  }, [items.length]); // Only re-shuffle when items count changes
  
  // Cap carousel items to 12 max for ultra-smooth 60fps rendering without DOM bloat
  const displayItems = useMemo(() => {
    return shuffledItems.slice(0, 12);
  }, [shuffledItems]);

  const loopedItems = displayItems.length > 0 ? [...displayItems, ...displayItems, ...displayItems] : [];

  const metricsRef = useRef({
    itemWidth: 0,
    sectionWidth: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });

  const measureMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || container.children.length === 0 || displayItems.length === 0) return;
    const firstChild = container.children[0] as HTMLElement;
    const gap = parseFloat(window.getComputedStyle(container).gap || "16") || 16;
    const itemWidth = firstChild.offsetWidth + gap;
    const sectionWidth = displayItems.length * itemWidth;
    metricsRef.current = {
      itemWidth,
      sectionWidth,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
    };
  }, [displayItems.length]);

  const updateArrows = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const showLeft = scrollLeft > 10;
    const showRight = scrollLeft < scrollWidth - clientWidth - 10;
    setShowLeftArrow((prev) => (prev !== showLeft ? showLeft : prev));
    setShowRightArrow((prev) => (prev !== showRight ? showRight : prev));
  }, []);

  // Update metrics on resize
  useEffect(() => {
    measureMetrics();
    window.addEventListener("resize", measureMetrics, { passive: true });
    return () => window.removeEventListener("resize", measureMetrics);
  }, [measureMetrics]);

  // Infinite loop scroll logic with cached metrics (zero layout thrashing)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || displayItems.length === 0) return;

    measureMetrics();

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        const { sectionWidth } = metricsRef.current;
        if (!sectionWidth) {
          measureMetrics();
          return;
        }

        const scrollLeft = container.scrollLeft;

        // Reset to middle section when reaching edges seamlessly
        if (scrollLeft <= 5) {
          container.scrollLeft = scrollLeft + sectionWidth;
          scrollPosRef.current = container.scrollLeft;
        } else if (scrollLeft >= sectionWidth * 2) {
          container.scrollLeft = scrollLeft - sectionWidth;
          scrollPosRef.current = container.scrollLeft;
        } else if (isPausedRef.current) {
          scrollPosRef.current = scrollLeft;
        }

        updateArrows();
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [displayItems.length, measureMetrics, updateArrows]);

  // Initialize scroll to middle section
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && displayItems.length > 0) {
      const timer = setTimeout(() => {
        measureMetrics();
        const { sectionWidth } = metricsRef.current;
        if (sectionWidth > 0) {
          container.scrollLeft = sectionWidth;
          scrollPosRef.current = sectionWidth;
        }
        updateArrows();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayItems.length, measureMetrics, updateArrows]);

  // Auto-scroll continuous slide loop animation: rAF based with float sub-pixel accumulator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || displayItems.length === 0 || !isAutoScrolling) return;
    if (prefersReducedMotion.current) return;

    let isVisibleInViewport = true;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleInViewport = entry.isIntersecting;
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(container);

    let lastTime = performance.now();
    const PX_PER_SEC = 48; // Smooth 48px/sec cinematic glide

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 64);
      lastTime = now;

      if (!isPausedRef.current && isVisibleInViewport && document.visibilityState === "visible") {
        scrollPosRef.current += (delta / 1000) * PX_PER_SEC;

        const { sectionWidth } = metricsRef.current;
        if (sectionWidth > 0) {
          if (scrollPosRef.current >= sectionWidth * 2) {
            scrollPosRef.current -= sectionWidth;
          } else if (scrollPosRef.current <= 0) {
            scrollPosRef.current += sectionWidth;
          }
        }

        container.scrollLeft = scrollPosRef.current;
      }
      autoScrollRafRef.current = requestAnimationFrame(tick);
    };

    autoScrollRafRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (autoScrollRafRef.current !== null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
    };
  }, [displayItems.length, isAutoScrolling]);

  // rAF-throttled 3D tilt: previous handler ran on every mousemove (60+/sec)
  // and called getBoundingClientRect synchronously, forcing layout each event.
  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion.current) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    const map = tiltRafByCard.current;
    const pending = map.get(card);
    if (pending) cancelAnimationFrame(pending);
    const handle = requestAnimationFrame(() => {
      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      map.delete(card);
    });
    map.set(card, handle);
  }, []);

  const resetCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const pending = tiltRafByCard.current.get(card);
    if (pending) {
      cancelAnimationFrame(pending);
      tiltRafByCard.current.delete(card);
    }
    card.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    // Pause auto-scroll when user interacts
    setIsPaused(true);
    isPausedRef.current = true;
    
    const scrollAmount = 800;
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    scrollPosRef.current = newScrollLeft;
    
    // Resume auto-scroll after 4 seconds of no interaction
    setTimeout(() => {
      setIsPaused(false);
      isPausedRef.current = false;
    }, 4000);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    // Small delay to prevent flickering when moving between cards
    setTimeout(() => {
      setIsPaused(false);
      isPausedRef.current = false;
    }, 150);
  };

  if (carouselSeries.isLoading || items.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-background py-6 mt-8">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Vignette fade effect on left and right edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:w-24 md:w-40 lg:w-48" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:w-24 md:w-40 lg:w-48" />
        
        {/* Scrollable Container */}
        <div className="relative group">
          {/* Left Arrow */}
          {showLeftArrow && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-1 top-1/2 z-20 -translate-y-1/2 h-11 w-11 rounded-[4px] bg-black/75 backdrop-blur-md border border-white/15 text-white opacity-0 group-hover:opacity-100 hover:border-purple-500/60 hover:text-purple-300 hover:scale-105 transition-all shadow-xl shadow-black/80"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
            </Button>
          )}

          {/* Carousel Items */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 sm:gap-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'auto',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {loopedItems.map((item, index) => {
              const isAboveFold = index < shuffledItems.length + 4;
              return (
              <Link
                key={`${item.id}-${index}`}
                to="/title/$slug"
                params={{ slug: item.series.slug }}
                className="group/card flex-shrink-0 block"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="relative h-[240px] w-[168px] overflow-hidden rounded-[4px] border border-neutral-800/80 bg-neutral-950 transition-all duration-300 group-hover/card:border-purple-500/50 group-hover/card:shadow-[0_0_25px_-5px_rgba(168,85,247,0.3)] sm:h-[300px] sm:w-[210px] md:h-[345px] md:w-[240px] lg:h-[390px] lg:w-[270px]"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(0deg) rotateX(0deg)'
                  }}
                  onMouseMove={handleCardTilt}
                  onMouseLeave={resetCardTilt}
                >
                  {/* Cover Image */}
                  <OptimizedImage
                    src={item.series.cover_url}
                    alt={item.series.title}
                    seriesId={item.series.id}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    priority={isAboveFold}
                  />
                  
                  {/* Glass Reflection Sweep */}
                  <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -inset-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent backdrop-blur-[0.5px]" />
                  </div>
                  
                  {/* Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  
                  {/* Title on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
                    <div className="inline-block mb-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/20 backdrop-blur-md text-purple-300 text-xs font-semibold uppercase tracking-wider">
                      {item.series.type}
                    </div>
                    <h3 className="text-white text-sm sm:text-base font-bold leading-snug line-clamp-2">
                      {item.series.title}
                    </h3>
                  </div>

                  {/* Subtle Border with glass effect */}
                  <div className="absolute inset-0 border border-white/10 rounded-[4px] pointer-events-none group-hover/card:border-white/20 transition-colors" />
                </div>
              </Link>
              );
            })}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-1 top-1/2 z-20 -translate-y-1/2 h-11 w-11 rounded-[4px] bg-black/75 backdrop-blur-md border border-white/15 text-white opacity-0 group-hover:opacity-100 hover:border-purple-500/60 hover:text-purple-300 hover:scale-105 transition-all shadow-xl shadow-black/80"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5 stroke-[1.8]" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
