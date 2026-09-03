"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top-of-screen progress bar that fires on every client-side navigation.
 * Uses a fake-progress approach: quickly jumps to 80%, then completes when the
 * new pathname is committed (i.e. the page has rendered).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start progress when pathname changes are *about* to happen.
  // We detect this by intercepting clicks on <a> tags.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      // Internal link — start the bar
      startProgress();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Complete the bar when the pathname actually changes (navigation committed)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      completeProgress();
    }
  }, [pathname]);

  function startProgress() {
    if (completeTimer.current) clearTimeout(completeTimer.current);
    setProgress(0);
    setVisible(true);
    // Jump to 80% on next tick and let CSS ease it out smoothly without JS re-render loop
    requestAnimationFrame(() => {
      setProgress(80);
    });
  }

  function completeProgress() {
    setProgress(100);
    completeTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
  }

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "3px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, oklch(0.68 0.22 305), oklch(0.78 0.16 200))`,
          boxShadow: `0 0 10px oklch(0.68 0.22 305 / 0.7)`,
          transition: progress === 100 ? "width 0.2s ease-out, opacity 0.35s ease" : "width 1.2s cubic-bezier(0.1, 0.5, 0.1, 1)",
          opacity: visible ? 1 : 0,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
