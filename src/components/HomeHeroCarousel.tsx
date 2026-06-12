import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const items = carouselSeries.data ?? [];
  
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
  
  // Triple the shuffled items for infinite loop effect
  const loopedItems = shuffledItems.length > 0 ? [...shuffledItems, ...shuffledItems, ...shuffledItems] : [];

  const updateArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Infinite loop scroll logic
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || shuffledItems.length === 0) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const itemWidth = 286; // 270px card + 16px gap (1.5x of 196)
      const sectionWidth = shuffledItems.length * itemWidth;
      
      // Reset to middle section when reaching edges
      if (scrollLeft <= itemWidth) {
        container.scrollLeft = sectionWidth + itemWidth;
      } else if (scrollLeft >= scrollWidth - clientWidth - itemWidth) {
        container.scrollLeft = sectionWidth - clientWidth + itemWidth;
      }
      
      updateArrows();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [shuffledItems.length]);

  // Initialize scroll to middle section
  useEffect(() => {
    if (scrollContainerRef.current && shuffledItems.length > 0) {
      const itemWidth = 286; // 270px card + 16px gap
      const sectionWidth = shuffledItems.length * itemWidth;
      scrollContainerRef.current.scrollLeft = sectionWidth;
      updateArrows();
    }
  }, [shuffledItems.length]);

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || shuffledItems.length === 0 || isPaused || !isAutoScrolling) return;

    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (container && !isPaused) {
          // Smooth continuous scroll (1px every 30ms = ~33px per second)
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    // Pause auto-scroll when user interacts
    setIsPaused(true);
    
    const scrollAmount = 800;
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    
    // Resume auto-scroll after 5 seconds of no interaction
    setTimeout(() => setIsPaused(false), 5000);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    // Small delay to prevent flickering when moving between cards
    setTimeout(() => {
      setIsPaused(false);
    }, 100);
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
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded bg-black/85 border border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-6 w-6 stroke-[1.5]" />
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
            {loopedItems.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                to="/title/$slug"
                params={{ slug: item.series.slug }}
                className="group/card flex-shrink-0 block"
                style={{ perspective: '1000px' }}
              >
                <div 
                  className="relative h-[240px] w-[168px] overflow-hidden rounded border border-neutral-800 transition-all duration-300 group-hover/card:border-neutral-500 sm:h-[300px] sm:w-[210px] md:h-[345px] md:w-[240px] lg:h-[390px] lg:w-[270px]"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(0deg) rotateX(0deg)'
                  }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = ((y - centerY) / centerY) * -10; // -10 to 10 degrees
                    const rotateY = ((x - centerX) / centerX) * 10; // -10 to 10 degrees
                    
                    card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.transform = 'rotateY(0deg) rotateX(0deg)';
                  }}
                >
                  {/* Cover Image */}
                  {item.series.cover_url ? (
                    <img
                      src={item.series.cover_url}
                      alt={item.series.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm font-light uppercase tracking-wider">No Cover</span>
                    </div>
                  )}
                  
                  {/* Glass Reflection Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none">
                    {/* Animated glass reflection sweep */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -inset-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    </div>
                    
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent backdrop-blur-[0.5px]" />
                  </div>
                  
                  {/* Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  
                  {/* Title on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover/card:translate-y-0 transition-transform duration-350">
                    <h3 className="text-white text-xs font-bold uppercase tracking-[0.02em] leading-tight line-clamp-2">
                      {item.series.title}
                    </h3>
                    <p className="text-neutral-400 text-3xs font-semibold uppercase tracking-wider mt-1.5">
                      {item.series.type}
                    </p>
                  </div>

                  {/* Subtle Border with glass effect */}
                  <div className="absolute inset-0 border border-white/10 rounded pointer-events-none group-hover/card:border-white/30 transition-colors" />
                  
                  {/* Corner highlights for glass effect */}
                  <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-tl" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-br" />
                </div>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded bg-black/85 border border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-6 w-6 stroke-[1.5]" />
            </Button>
          )}
        </div>
      </div>

      <style>{`
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
      `}</style>
    </section>
  );
}
