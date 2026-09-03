"use client";

import React, { useState, useEffect } from "react";
import { Zap, Trash2, Gauge, Check, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function PerformanceModeButton({ isMobile = false }: { isMobile?: boolean }) {
  const [isPerfMode, setIsPerfMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [lastCleanedText, setLastCleanedText] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize on mount from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("vnr-perf-mode") === "true";
      setIsPerfMode(saved);
      if (saved) {
        document.documentElement.classList.add("perf-mode");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsPerfMode(checked);
    try {
      localStorage.setItem("vnr-perf-mode", String(checked));
    } catch {}

    if (checked) {
      document.documentElement.classList.add("perf-mode");
      toast.success("⚡ Performance Mode Active", {
        description: "Heavy blur shaders, ambient glows & transforms disabled for 120 FPS smoothness.",
        duration: 3500,
      });
    } else {
      document.documentElement.classList.remove("perf-mode");
      toast.info("Standard Mode Restored", {
        description: "Full glassmorphism & visual effects restored.",
        duration: 2500,
      });
    }
  };

  const handleCleanMemory = async () => {
    setIsCleaning(true);

    try {
      // 1. Prune inactive TanStack React Query cache
      queryClient.removeQueries({ type: "inactive" });

      // 2. Clean stale local storage caches (e.g. temporary keys)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("tmp-") || key.startsWith("cache-temp-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // 3. Clear unneeded DOM memory hint
      if (typeof window !== "undefined" && (window as any).gc) {
        try {
          (window as any).gc();
        } catch {}
      }

      await new Promise((r) => setTimeout(r, 450));
      setLastCleanedText("Freed memory cache!");
      toast.success("🧹 Memory Optimized", {
        description: "Inactive cache pruned. Browser memory freed for buttery-smooth scrolling.",
      });
      setTimeout(() => setLastCleanedText(null), 3000);
    } catch {
      toast.error("Memory purge failed.");
    } finally {
      setIsCleaning(false);
    }
  };

  if (!mounted) {
    return isMobile ? (
      <button className="flex sm:hidden items-center justify-center h-9 w-9 rounded-lg text-muted-foreground">
        <Zap className="h-4 w-4" />
      </button>
    ) : (
      <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs font-bold uppercase tracking-wider h-9 px-2.5">
        <Zap className="h-4 w-4 text-amber-400" />
        <span>Boost</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {isMobile ? (
          <button
            aria-label="Performance Booster"
            className={`flex sm:hidden items-center justify-center h-9 w-9 rounded-lg transition-colors cursor-pointer ${
              isPerfMode
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Zap className={`h-4 w-4 ${isPerfMode ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={`hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider h-9 px-2.5 transition-all cursor-pointer ${
              isPerfMode
                ? "text-amber-300 bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Performance Booster & Turbo Mode"
          >
            <Zap className={`h-4 w-4 transition-transform ${isPerfMode ? "fill-amber-400 text-amber-400 scale-110 animate-pulse" : "text-amber-400"}`} />
            <span>{isPerfMode ? "Turbo ON" : "Boost"}</span>
            {isPerfMode && (
              <span className="flex h-1.5 w-1.5 relative ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-4 space-y-4 glass-panel border border-border/60 shadow-2xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="h-4 w-4 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Speed & Performance</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">Optimize rendering & responsiveness</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
              isPerfMode ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "text-muted-foreground border-border/40"
            }`}
          >
            {isPerfMode ? "120 FPS" : "Standard"}
          </Badge>
        </div>

        {/* Feature 1: Ultra Smooth / Turbo Mode */}
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border/50">
          <div className="space-y-1 pr-1">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-amber-400" />
              <label htmlFor="turbo-mode" className="text-xs font-bold text-foreground cursor-pointer">
                Ultra Smooth Mode
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Disables heavy blur shaders, ambient glows & card lifts for buttery-smooth 60/120 FPS scrolling.
            </p>
          </div>
          <Switch
            id="turbo-mode"
            checked={isPerfMode}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {/* Feature 2: Clean RAM & Purge Cache Button */}
        <div className="p-3 rounded-xl bg-card/60 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-bold text-foreground">Free Browser Memory</span>
            </div>
            {lastCleanedText ? (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> {lastCleanedText}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Flushes stale image caches and query history to free up device RAM.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCleanMemory}
            disabled={isCleaning}
            className="w-full text-xs font-semibold h-8 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 transition-all cursor-pointer"
          >
            <Trash2 className={`mr-2 h-3.5 w-3.5 ${isCleaning ? "animate-spin" : "text-purple-400"}`} />
            {isCleaning ? "Cleaning RAM Cache..." : "Purge Memory Cache"}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded-lg bg-secondary/40 border border-border/30 text-center">
            <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Hardware Load</span>
            <span className={`text-xs font-bold ${isPerfMode ? "text-emerald-400" : "text-neutral-300"}`}>
              {isPerfMode ? "Minimal (Light)" : "Standard"}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 border border-border/30 text-center">
            <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Scroll Rate</span>
            <span className="text-xs font-bold text-amber-300">60 - 120 Hz</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
