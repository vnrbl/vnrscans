"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export interface SpotlightNavbarProps {
  items?: NavItem[];
  className?: string;
  onItemClick?: (item: NavItem, index: number) => void;
  defaultActiveIndex?: number;
}

export function SpotlightNavbar({
  items = [
    { label: "Home", href: "/home" },
    { label: "Browse", href: "/browse" },
    { label: "Rankings", href: "/rankings" },
    { label: "Novels", href: "/novels" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  className,
  onItemClick,
  defaultActiveIndex = 0,
}: SpotlightNavbarProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const matchedIndex = items.findIndex((item) => {
    if (item.href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(item.href);
  });

  const [activeIndex, setActiveIndex] = useState(matchedIndex !== -1 ? matchedIndex : -1);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  useEffect(() => {
    setActiveIndex(matchedIndex);
  }, [matchedIndex]);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
    };

    const handleMouseLeave = () => {
      setHoverX(null);
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
      if (activeItem) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;

        animate(spotlightX.current, targetX, {
          type: "spring",
          stiffness: 200,
          damping: 20,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty("--spotlight-x", `${v}px`);
          },
        });
      }
    };

    nav.addEventListener("mousemove", handleMouseMove);
    nav.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      nav.removeEventListener("mousemove", handleMouseMove);
      nav.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeIndex]);

  // Handle Ambience movement
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);

    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;

      animate(ambienceX.current, targetX, {
        type: "spring",
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty("--ambience-x", `${v}px`);
        },
      });
    }
  }, [activeIndex]);

  const handleItemClick = (item: NavItem, index: number) => {
    setActiveIndex(index);
    onItemClick?.(item, index);
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <nav
        ref={navRef}
        style={
          {
            "--spotlight-color": "rgba(192, 132, 252, 0.2)",
            "--ambience-color": "rgba(168, 85, 247, 1)",
          } as React.CSSProperties
        }
        className="relative h-10 transition-all duration-300 overflow-hidden bg-transparent"
      >
        <ul className="relative flex items-center h-full px-2 gap-1 z-10">
          {items.map((item, idx) => (
            <li key={idx} className="relative h-full flex items-center justify-center">
              <a
                href={item.href}
                data-index={idx}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item, idx);
                }}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors duration-200 rounded-lg",
                  activeIndex === idx
                    ? "text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* 1. Moving Spotlight Beam */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-full z-[1] transition-opacity duration-300 rounded-lg"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(120px circle at var(--spotlight-x, 50%) 100%, var(--spotlight-color) 0%, transparent 60%)`,
          }}
        />

        {/* 2. Active Ambience Underline */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2] transition-opacity duration-300"
          style={{
            opacity: activeIndex >= 0 ? 1 : 0,
            background: `radial-gradient(70px circle at var(--ambience-x, 50%) 0%, var(--ambience-color) 0%, transparent 100%)`,
          }}
        />
      </nav>
    </div>
  );
}
