import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  });

  const items = carouselSeries.data ?? [];
  // Triple the items for infinite loop effect
  const loopedItems = items.length > 0 ? [...items, ...items, ...items] : [];

  const updateArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Infinite loop scroll logic
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || items.length === 0) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const itemWidth = 196; // 180px card + 16px gap
      const sectionWidth = items.length * itemWidth;
      
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
  }, [items.length]);

  // Initialize scroll to middle section
  useEffect(() => {
    if (scrollContainerRef.current && items.length > 0) {
      const itemWidth = 196;
      const sectionWidth = items.length * itemWidth;
      scrollContainerRef.current.scrollLeft = sectionWidth;
      updateArrows();
    }
  }, [items.length]);

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || items.length === 0 || isPaused || !isAutoScrolling) return;

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
  }, [items.length, isPaused, isAutoScrolling]);

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
    setIsPaused(false);
  };

  if (carouselSeries.isLoading || items.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-background/95 to-background/90 py-6 mt-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Scrollable Container */}
        <div 
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Left Arrow */}
          {showLeftArrow && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Carousel Items */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'auto',
            }}
          >
            {loopedItems.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                to={`/title/${item.series.slug}`}
                className="group/card flex-shrink-0"
              >
                <div className="relative w-[140px] h-[200px] md:w-[160px] md:h-[230px] lg:w-[180px] lg:h-[260px] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  {/* Cover Image */}
                  {item.series.cover_url ? (
                    <img
                      src={item.series.cover_url}
                      alt={item.series.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/20 to-violet-600/20 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Cover</span>
                    </div>
                  )}
                  
                  {/* Glass Reflection Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none">
                    {/* Animated glass reflection sweep */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -inset-full animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                    </div>
                    
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent backdrop-blur-[1px]" />
                    
                    {/* Subtle shimmer */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                  </div>
                  
                  {/* Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  
                  {/* Title on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white text-sm font-semibold line-clamp-2 drop-shadow-lg">
                      {item.series.title}
                    </h3>
                    <p className="text-white/80 text-xs mt-1">
                      {item.series.type}
                    </p>
                  </div>

                  {/* Subtle Border with glass effect */}
                  <div className="absolute inset-0 border border-white/20 rounded-lg pointer-events-none group-hover/card:border-white/40 transition-colors" />
                  
                  {/* Corner highlights for glass effect */}
                  <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-tl-lg" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-br-lg" />
                </div>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-6 w-6" />
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
