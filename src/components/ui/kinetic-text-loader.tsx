"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KineticTextLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export function KineticTextLoader({ 
  className, 
  text = "Loading", 
  size = "md",
  fullPage = false,
  ...props 
}: KineticTextLoaderProps) {
  const letters = text.split("");

  const sizeClasses = {
    sm: "scale-[0.55] -my-6",
    md: "scale-75 md:scale-90 lg:scale-100",
    lg: "scale-90 sm:scale-100 md:scale-110",
  };

  const content = (
    <div 
      className={cn("relative flex items-center justify-center font-light select-none", className)} 
      style={{ fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      {...props}
    >
      <style>{`
        @keyframes ktl-dotMove {
          0%, 100% { transform: rotate(180deg) translate(-80px, -10px) rotate(-180deg); }
          50% { transform: rotate(0deg) translate(-81px, 10px) rotate(0deg); }
        }
        @keyframes ktl-letterStretch {
          0%, 100% { transform: scale(1, 0.35); transform-origin: 100% 75%; }
          8%, 28% { transform: scale(1, 1.4); transform-origin: 100% 67%; }
          37% { transform: scale(1, 0.875); transform-origin: 100% 75%; }
          46% { transform: scale(1, 1.03); transform-origin: 100% 75%; }
          50%, 97% { transform: scale(1); transform-origin: 100% 75%; }
        }
        @keyframes ktl-l-bounce {
          0%, 45%, 70%, 100% { transform: scaleY(1.11); }
          49% { transform: scaleY(0.31); }
          50% { transform: scaleY(0.16); }
          53% { transform: scaleY(0.63); }
          60% { transform: scaleY(1.275); }
          68% { transform: scaleY(1.04); }
        }
      `}</style>
      
      <div className={cn("relative origin-center", sizeClasses[size])}>
        {/* The moving bouncing dot with purple accent glow */}
        <div 
          className="absolute z-10 top-[40px] left-[85px] w-[6px] h-[6px] bg-purple-500 dark:bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.85)]"
          style={{ animation: "ktl-dotMove 1800ms cubic-bezier(0.25,0.25,0.75,0.75) infinite" }}
        />
        
        <p className="relative m-0 whitespace-nowrap text-[3.75rem] text-neutral-800 dark:text-neutral-100 font-light" aria-label={text}>
          {letters.map((char, index) => {
            if (index === 0 && char.toUpperCase() === 'L') {
              return (
                <span 
                  key={index} 
                  className="inline-block relative tracking-[8px] transform origin-[100%_70%]"
                  style={{ animation: "ktl-l-bounce 1800ms cubic-bezier(0.25,0.25,0.75,0.75) infinite" }}
                >
                  {char}
                </span>
              );
            }
            
            if (index === 4 && char.toLowerCase() === 'i') {
              return (
                <span 
                  key={index} 
                  className="inline-block relative tracking-[8px] transform origin-[100%_70%]"
                  style={{ animation: "ktl-letterStretch 1800ms cubic-bezier(0.25,0.23,0.73,0.75) infinite" }}
                >
                  {char === 'i' ? 'ı' : char}
                </span>
              );
            }

            return (
              <span key={index} className="inline-block relative tracking-[8px]">
                {char}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}

export function PageKineticLoader({ 
  text = "Loading", 
  className 
}: { 
  text?: string; 
  className?: string;
}) {
  return (
    <div className={cn("min-h-[50vh] sm:min-h-[65vh] w-full flex items-center justify-center p-4", className)}>
      <KineticTextLoader text={text} size="md" />
    </div>
  );
}

export default KineticTextLoader;
