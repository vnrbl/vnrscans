"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number counting up to its target when it scrolls into view.
 * Renders the final value as the initial server-rendered HTML (so the
 * real number is always present in the DOM for SEO/crawlers), then runs
 * the count-up purely as a visual enhancement on the client.
 */
export function HomeStats({ value }: { value: string }) {
  const numericTarget = parseNumeric(value);
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (numericTarget == null) return;
    const el = ref.current;
    if (!el) return;

    const startCount = () => {
      if (started.current) return;
      started.current = true;
      const duration = 1400;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * numericTarget);
        setDisplay(formatLike(current, value));
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) startCount();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numericTarget, value]);

  return (
    <div ref={ref} className="text-3xl font-bold tracking-[0.02em] text-white">
      {display}
    </div>
  );
}

/** Pulls the leading integer out of strings like "12,840+" or "342". */
function parseNumeric(value: string): number | null {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
}

/** Re-formats the animated value to match the original string's style. */
function formatLike(current: number, original: string): string {
  const hasCommas = original.includes(",");
  const suffix = original.replace(/[0-9,]/g, "");
  const numStr = hasCommas ? current.toLocaleString() : String(current);
  return `${numStr}${suffix}`;
}
