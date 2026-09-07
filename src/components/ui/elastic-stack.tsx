"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ElasticStackItem {
  id: string | number;
  image?: string | null;
  name?: string;
  href?: string;
}

export interface ElasticStackProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ElasticStackItem[];
  itemSize?: number;
  overlap?: number;
  pushForce?: number;
  onItemClick?: (item: ElasticStackItem, index: number) => void;
}

export function ElasticStack({
  items,
  itemSize = 36,
  overlap,
  pushForce,
  className,
  onItemClick,
  ...props
}: ElasticStackProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = items.length;
  // Compute responsive defaults based on itemSize
  const computedOverlap = overlap ?? Math.round(itemSize * 0.32);
  const computedPushForce = pushForce ?? Math.max(6, Math.round(itemSize * 0.22));

  // Custom spring-like easing from the original physics animation
  const springEasing = "linear(0, 0.79 14.4%, 1.026 22.4%, 1.164 31.2%, 1.207 38.2%, 1.208 46.2%, 1.033 80%, 1)";

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn("inline-flex items-center cursor-pointer select-none py-1", className)}
      onMouseLeave={() => setHoveredIndex(null)}
      {...props}
    >
      {items.map((item, i) => {
        let translateX = 0;
        let scale = 1;
        let zIndex = i; // Base stacking order
        const isHovered = hoveredIndex === i;

        if (hoveredIndex !== null) {
          if (i > hoveredIndex) {
            translateX = Math.min(computedPushForce * (total - i - 1), computedOverlap * 1.5);
          } else if (i < hoveredIndex) {
            translateX = -Math.min(computedPushForce * i, computedOverlap * 1.5);
          } else {
            scale = 1.28;
            zIndex = 100;
          }
        }

        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredIndex(i)}
            onClick={() => onItemClick?.(item, i)}
            title={item.name || `Reader ${i + 1}`}
            className={cn(
              "relative flex items-center justify-center rounded-full transition-all duration-500 bg-neutral-900",
              "border-2 border-background ring-1 ring-white/10",
              isHovered ? "shadow-lg shadow-purple-500/20 ring-purple-400/50" : "shadow-sm"
            )}
            style={{
              width: itemSize,
              height: itemSize,
              marginLeft: i === 0 ? 0 : -computedOverlap,
              transform: `translateX(${translateX}px) scale(${scale})`,
              transitionTimingFunction: springEasing,
              zIndex,
            }}
          >
            {/* Tooltip on hover */}
            {isHovered && item.name && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-[11px] font-sans font-medium text-white whitespace-nowrap z-[120] shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                {item.name}
              </span>
            )}

            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={item.image} 
                alt={item.name || `Avatar ${i}`}
                className="w-full h-full object-cover rounded-full pointer-events-none"
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-neutral-300 bg-neutral-800">
                {item.name ? item.name.charAt(0).toUpperCase() : i + 1}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ElasticStack;
