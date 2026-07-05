"use client";

import { useEffect, useState, useRef } from "react";
import { Sliders, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NovelSettingsPanelProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const THEMES = [
  { id: "dark", name: "Pitch Black", bg: "bg-black", border: "border-neutral-800", preview: "#000000" },
  { id: "charcoal", name: "Charcoal", bg: "bg-[#0f0f10]", border: "border-neutral-800", preview: "#0f0f10" },
  { id: "sepia", name: "Warm Sepia", bg: "bg-[#f4ecd8]", border: "border-[#e4dcbf]", preview: "#f4ecd8" },
  { id: "slate", name: "Slate Grey", bg: "bg-[#0f172a]", border: "border-slate-800", preview: "#0f172a" },
];

export default function NovelSettingsPanel({
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
  theme,
  setTheme,
}: NovelSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Draggable positioning state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const draggingRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    hasMoved: false,
  });

  // Pointer drag event handlers - allows dragging from anywhere EXCEPT inputs/buttons/selects
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const target = e.target as HTMLElement;
    const isBadge = target.closest(".settings-badge-handle");

    // Block dragging on interactive elements inside the card
    if (!isBadge && (target.closest("button") || target.closest("select") || target.closest("input"))) {
      return;
    }

    draggingRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      hasMoved: false,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - draggingRef.current.startX;
      const dy = e.clientY - draggingRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        draggingRef.current.hasMoved = true;
      }

      let newX = draggingRef.current.posX + dx;
      let newY = draggingRef.current.posY + dy;

      const pad = 16;
      const widgetWidth = isExpanded ? 250 : 50;
      const widgetHeight = isExpanded ? 220 : 50;

      const maxX = 24 - pad;
      const maxY = 96 - pad;

      const minX = pad - (window.innerWidth - 24 - widgetWidth);
      const minY = pad - (window.innerHeight - 96 - widgetHeight);

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      draggingRef.current.isDragging = false;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, isExpanded]);

  // Re-clamp position on window resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setPosition((prev) => {
        const pad = 16;
        const widgetWidth = isExpanded ? 250 : 50;
        const widgetHeight = isExpanded ? 220 : 50;

        const maxX = 24 - pad;
        const maxY = 96 - pad;
        const minX = pad - (window.innerWidth - 24 - widgetWidth);
        const minY = pad - (window.innerHeight - 96 - widgetHeight);

        return {
          x: Math.max(minX, Math.min(maxX, prev.x)),
          y: Math.max(minY, Math.min(maxY, prev.y)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const handleDecreaseFont = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handleIncreaseFont = () => {
    if (fontSize < 32) setFontSize(fontSize + 2);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className="fixed bottom-24 right-6 z-50 flex flex-col items-end cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.15s ease-out",
        touchAction: "none",
      }}
    >
      {/* Collapsed Settings Toggle */}
      {!isExpanded && (
        <button
          onClick={(e) => {
            if (draggingRef.current.hasMoved) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setIsExpanded(true);
          }}
          className="settings-badge-handle flex items-center gap-1.5 rounded-full p-3 shadow-xl border border-border/50 text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-grab active:cursor-grabbing"
          title="Reader Preferences"
        >
          <Sliders className="h-4 w-4" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-xs font-semibold pr-0 group-hover:pr-1">
            Settings
          </span>
        </button>
      )}

      {/* Expanded Control Panel */}
      {isExpanded && (
        <div className="w-[250px] rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl p-3 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold tracking-tight text-foreground">Reader Options</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Collapse"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Theme selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Reading Theme
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`h-6 w-6 rounded-full border-2 transition-all relative cursor-pointer ${
                      theme === t.id ? "border-violet-600 scale-110 shadow-md" : "border-border/50 hover:scale-105"
                    }`}
                    style={{ backgroundColor: t.preview }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            {/* Font Family selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Font Family
              </label>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/20">
                <button
                  onClick={() => setFontFamily("sans-serif")}
                  className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all cursor-pointer ${
                    fontFamily === "sans-serif" ? "bg-background text-foreground shadow-sm font-sans" : "text-muted-foreground font-sans"
                  }`}
                >
                  Sans
                </button>
                <button
                  onClick={() => setFontFamily("serif")}
                  className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all cursor-pointer ${
                    fontFamily === "serif" ? "bg-background text-foreground shadow-sm font-serif" : "text-muted-foreground font-serif"
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily("mono")}
                  className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all cursor-pointer ${
                    fontFamily === "mono" ? "bg-background text-foreground shadow-sm font-mono" : "text-muted-foreground font-mono"
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Typography controls row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Font Size controls */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Font Size
                </label>
                <div className="flex items-center justify-between bg-secondary/50 rounded-lg border border-border/20 h-7 text-[10px]">
                  <button
                    onClick={handleDecreaseFont}
                    className="h-full px-2 hover:bg-secondary rounded-l-lg font-bold cursor-pointer"
                  >
                    A-
                  </button>
                  <span className="font-mono font-bold text-foreground">{fontSize}px</span>
                  <button
                    onClick={handleIncreaseFont}
                    className="h-full px-2 hover:bg-secondary rounded-r-lg font-bold cursor-pointer"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Line height selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Line Spacing
                </label>
                <div className="relative">
                  <select
                    value={lineHeight.toString()}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full text-[10px] bg-secondary/50 border border-border/20 rounded-lg p-1.5 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium text-foreground cursor-pointer h-7"
                  >
                    <option value="1.5">Compact (1.5)</option>
                    <option value="1.8">Comfort (1.8)</option>
                    <option value="2.15">Spacious (2.1)</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
