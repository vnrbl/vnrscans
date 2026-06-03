import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
  target_series_id: string | null;
  series?: { slug: string } | null;
};

const SWIPE_THRESHOLD = 50;

export function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);
  const touchStart = useRef({ x: 0, y: 0 });

  const banners = useQuery({
    queryKey: ["banners", "hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, series:target_series_id(slug)")
        .eq("position", "hero")
        .eq("is_active", true)
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const items = banners.data ?? [];

  useEffect(() => {
    if (!items.length) return;
    const id = items[index]?.id;
    if (id) supabase.rpc("increment_banner_view", { banner_id: id });
  }, [index, items]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (banners.isLoading || items.length === 0) return null;

  const current = items[index];
  const href =
    current.link_url ||
    (current.series?.slug ? `/title/${current.series.slug}` : null);
  const isExternal = href?.startsWith("http");

  const trackClick = () => {
    supabase.rpc("increment_banner_click", { banner_id: current.id });
  };

  const inner = (
    <div
      className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-xl border border-border/40 p-8 md:min-h-[280px]"
      style={{
        backgroundColor: current.background_color ?? "#8B5CF6",
        color: current.text_color ?? "#FFFFFF",
      }}
    >
      {current.image_url && (
        <img
          src={current.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-2xl font-bold md:text-3xl">{current.title}</h2>
        {current.description && (
          <p className="mt-2 text-sm opacity-90 md:text-base">{current.description}</p>
        )}
        {href && (
          <span className="mt-4 inline-block rounded-md bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur">
            {current.link_text ?? "Learn More"}
          </span>
        )}
      </div>
    </div>
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t || items.length <= 1) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) setIndex((i) => (i + 1) % items.length);
    else setIndex((i) => (i - 1 + items.length) % items.length);
  };

  return (
    <section className="container mx-auto px-8 py-4">
      <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {href ? (
          isExternal ? (
            <a href={href} onClick={trackClick} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <Link to={href} onClick={trackClick}>
              {inner}
            </Link>
          )
        ) : (
          inner
        )}

        {items.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full opacity-80"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full opacity-80"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="mt-3 flex justify-center gap-1.5">
              {items.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
