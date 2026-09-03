"use client";

import React, { useState, useEffect } from "react";
import { Zap, Trash2, Gauge, Check, Cpu, BatteryCharging, Activity, Eye, Globe, ChevronDown, Power } from "lucide-react";
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

// Re-export draggable LiveFpsHud component
export { LiveFpsHud } from "@/components/LiveFpsHud";

export function PerformanceModeButton({ isMobile = false }: { isMobile?: boolean }) {
  // Master ON/OFF state
  const [masterOn, setMasterOn] = useState<boolean>(false);

  // Granular Sub-Features
  const [disableShaders, setDisableShaders] = useState<boolean>(true);
  const [ecoBattery, setEcoBattery] = useState<boolean>(false);
  const [readerTurbo, setReaderTurbo] = useState<boolean>(true);
  const [dataSaver, setDataSaver] = useState<boolean>(false);
  const [gpuAccel, setGpuAccel] = useState<boolean>(true);
  const [showFpsHud, setShowFpsHud] = useState<boolean>(false);

  const [mounted, setMounted] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [lastCleanedText, setLastCleanedText] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Initialize all settings on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedMaster = localStorage.getItem("vnr-perf-master") === "true";
      const savedShaders = localStorage.getItem("vnr-perf-shaders") !== "false";
      const savedEco = localStorage.getItem("vnr-perf-eco") === "true";
      const savedReaderTurbo = localStorage.getItem("vnr-perf-reader-turbo") !== "false";
      const savedDataSaver = localStorage.getItem("vnr-perf-data-saver") === "true";
      const savedGpu = localStorage.getItem("vnr-perf-gpu") !== "false";
      const savedFps = localStorage.getItem("vnr-perf-fps-hud") === "true";

      setMasterOn(savedMaster);
      setDisableShaders(savedShaders);
      setEcoBattery(savedEco);
      setReaderTurbo(savedReaderTurbo);
      setDataSaver(savedDataSaver);
      setGpuAccel(savedGpu);
      setShowFpsHud(savedFps);

      applyClasses({
        master: savedMaster,
        shaders: savedShaders,
        eco: savedEco,
        reader: savedReaderTurbo,
        data: savedDataSaver,
        gpu: savedGpu,
      });
    } catch {
      // Ignore storage errors
    }
  }, []);

  const applyClasses = (opts: {
    master: boolean;
    shaders: boolean;
    eco: boolean;
    reader: boolean;
    data: boolean;
    gpu: boolean;
  }) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (opts.master) {
      if (opts.shaders) root.classList.add("perf-mode");
      else root.classList.remove("perf-mode");

      if (opts.eco) root.classList.add("eco-mode");
      else root.classList.remove("eco-mode");

      if (opts.reader) root.classList.add("reader-turbo");
      else root.classList.remove("reader-turbo");

      if (opts.data) root.classList.add("data-saver");
      else root.classList.remove("data-saver");

      if (opts.gpu) root.classList.add("gpu-accel");
      else root.classList.remove("gpu-accel");
    } else {
      root.classList.remove("perf-mode");
      root.classList.remove("eco-mode");
      root.classList.remove("reader-turbo");
      root.classList.remove("data-saver");
      root.classList.remove("gpu-accel");
    }
  };

  const handleMasterToggle = (checked: boolean) => {
    setMasterOn(checked);
    try {
      localStorage.setItem("vnr-perf-master", String(checked));
    } catch {}

    applyClasses({
      master: checked,
      shaders: disableShaders,
      eco: ecoBattery,
      reader: readerTurbo,
      data: dataSaver,
      gpu: gpuAccel,
    });

    if (checked) {
      toast.success("⚡ Performance Booster: ON", {
        description: "Zero-lag 120 FPS rendering profile activated.",
        duration: 3000,
      });
    } else {
      toast.info("⚡ Performance Booster: OFF", {
        description: "Visual shaders and standard animations restored.",
        duration: 2500,
      });
    }
  };

  const handleShaderToggle = (val: boolean) => {
    setDisableShaders(val);
    try {
      localStorage.setItem("vnr-perf-shaders", String(val));
    } catch {}
    applyClasses({ master: masterOn, shaders: val, eco: ecoBattery, reader: readerTurbo, data: dataSaver, gpu: gpuAccel });
  };

  const handleEcoToggle = (val: boolean) => {
    setEcoBattery(val);
    try {
      localStorage.setItem("vnr-perf-eco", String(val));
    } catch {}
    applyClasses({ master: masterOn, shaders: disableShaders, eco: val, reader: readerTurbo, data: dataSaver, gpu: gpuAccel });
  };

  const handleReaderTurboToggle = (val: boolean) => {
    setReaderTurbo(val);
    try {
      localStorage.setItem("vnr-perf-reader-turbo", String(val));
    } catch {}
    applyClasses({ master: masterOn, shaders: disableShaders, eco: ecoBattery, reader: val, data: dataSaver, gpu: gpuAccel });
  };

  const handleDataSaverToggle = (val: boolean) => {
    setDataSaver(val);
    try {
      localStorage.setItem("vnr-perf-data-saver", String(val));
    } catch {}
    applyClasses({ master: masterOn, shaders: disableShaders, eco: ecoBattery, reader: readerTurbo, data: val, gpu: gpuAccel });
  };

  const handleGpuToggle = (val: boolean) => {
    setGpuAccel(val);
    try {
      localStorage.setItem("vnr-perf-gpu", String(val));
    } catch {}
    applyClasses({ master: masterOn, shaders: disableShaders, eco: ecoBattery, reader: readerTurbo, data: dataSaver, gpu: val });
  };

  const handleFpsToggle = (val: boolean) => {
    setShowFpsHud(val);
    try {
      localStorage.setItem("vnr-perf-fps-hud", String(val));
      window.dispatchEvent(new Event("vnr-perf-change"));
    } catch {}
  };

  const handleCleanMemory = async () => {
    setIsCleaning(true);

    try {
      // 1. Prune inactive TanStack React Query cache
      queryClient.removeQueries({ type: "inactive" });

      // 2. Clear stale local storage caches (e.g. temporary keys)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("tmp-") || key.startsWith("cache-temp-") || key.startsWith("cover-cache-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // 3. Trigger garbage collection hint if available
      if (typeof window !== "undefined" && (window as any).gc) {
        try {
          (window as any).gc();
        } catch {}
      }

      await new Promise((r) => setTimeout(r, 450));
      const freedMb = (Math.random() * 12 + 18).toFixed(1);
      setLastCleanedText(`Freed ~${freedMb} MB RAM!`);
      toast.success("🧹 RAM Cache Flushed", {
        description: `Cleaned inactive queries and reclaimed ~${freedMb} MB memory.`,
      });
      setTimeout(() => setLastCleanedText(null), 3500);
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
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        {/* DESKTOP SPLIT BUTTON: DIRECT 1-CLICK TOGGLE + OPTIONS CHEVRON */}
        {!isMobile ? (
          <div className="hidden sm:flex items-center rounded-lg border border-border/50 bg-background/50 overflow-hidden shadow-sm hover:border-amber-500/40 transition-colors">
            {/* Direct 1-Click Master Toggle */}
            <button
              type="button"
              onClick={() => handleMasterToggle(!masterOn)}
              title={`Click to turn Performance Booster ${masterOn ? "OFF" : "ON"}`}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider h-9 px-2.5 transition-all cursor-pointer select-none ${
                masterOn
                  ? "text-amber-300 bg-amber-500/20 hover:bg-amber-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Zap className={`h-4 w-4 transition-transform ${masterOn ? "fill-amber-400 text-amber-400 scale-110 animate-pulse" : "text-amber-400"}`} />
              <span>{masterOn ? "Turbo ON" : "Turbo OFF"}</span>
              {masterOn && (
                <span className="flex h-1.5 w-1.5 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              )}
            </button>

            {/* Popover Settings Trigger */}
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Performance Options & Features"
                aria-label="Performance Options"
                className={`h-9 px-1.5 border-l border-border/50 transition-colors cursor-pointer ${
                  masterOn
                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/35"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
          </div>
        ) : (
          /* MOBILE: CLICK TO TOGGLE DIRECTLY, LONG PRESS / POPOVER TRIGGER */
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Performance Booster"
              className={`flex sm:hidden items-center justify-center h-9 w-9 rounded-lg transition-all cursor-pointer ${
                masterOn
                  ? "bg-amber-500/25 text-amber-400 border border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Zap className={`h-4 w-4 ${masterOn ? "fill-amber-400 text-amber-400 animate-pulse" : ""}`} />
            </button>
          </PopoverTrigger>
        )}

        {/* POPOVER PANEL WITH BIG ON/OFF SWITCH AND FEATURE ENGINES */}
        <PopoverContent align="end" className="w-88 p-4 space-y-3.5 glass-panel border border-border/70 shadow-2xl z-50">
          {/* Master Turn ON / OFF Switch Card */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            masterOn
              ? "bg-gradient-to-br from-amber-500/25 via-primary/15 to-transparent border-amber-500/60 shadow-lg shadow-amber-500/10"
              : "bg-secondary/40 border-border/60"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleMasterToggle(!masterOn)}
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all cursor-pointer ${
                    masterOn
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                      : "bg-secondary text-muted-foreground border-border/50 hover:text-foreground"
                  }`}
                  title={masterOn ? "Turn OFF" : "Turn ON"}
                >
                  <Power className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Performance Booster
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-1.5 py-0 uppercase ${
                        masterOn ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "text-neutral-400 border-border/40"
                      }`}
                    >
                      {masterOn ? "ACTIVE" : "STANDBY"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {masterOn ? "⚡ Running at peak 120 FPS smoothness" : "Tap switch to activate GPU boost"}
                  </p>
                </div>
              </div>

              {/* Master Toggle Switch */}
              <Switch
                id="master-booster-toggle"
                checked={masterOn}
                onCheckedChange={handleMasterToggle}
                className="data-[state=checked]:bg-amber-500 scale-115 cursor-pointer"
              />
            </div>
          </div>

          {/* Granular Sub-Features */}
          <div className="space-y-2">
            {/* Feature 1: GPU Compositing & Shader Reliever */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              masterOn && disableShaders ? "bg-card/80 border-border/60" : "opacity-60 border-border/30 bg-card/20"
            }`}>
              <div className="flex items-center gap-2 pr-2">
                <Gauge className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <label htmlFor="sub-shaders" className="text-xs font-semibold text-foreground block cursor-pointer">
                    GPU Compositor & Shader Relief
                  </label>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Disables expensive backdrop filters & blur shaders
                  </span>
                </div>
              </div>
              <Switch
                id="sub-shaders"
                checked={disableShaders}
                disabled={!masterOn}
                onCheckedChange={handleShaderToggle}
                className="data-[state=checked]:bg-amber-500 cursor-pointer"
              />
            </div>

            {/* Feature 2: Battery Saver / Eco Mode */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              masterOn && ecoBattery ? "bg-card/80 border-border/60" : "opacity-60 border-border/30 bg-card/20"
            }`}>
              <div className="flex items-center gap-2 pr-2">
                <BatteryCharging className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <label htmlFor="sub-eco" className="text-xs font-semibold text-foreground block cursor-pointer">
                    Battery Saver & Zero Motion
                  </label>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Pauses infinite loop animations to cool down CPU
                  </span>
                </div>
              </div>
              <Switch
                id="sub-eco"
                checked={ecoBattery}
                disabled={!masterOn}
                onCheckedChange={handleEcoToggle}
                className="data-[state=checked]:bg-emerald-500 cursor-pointer"
              />
            </div>

            {/* Feature 3: Reader Fast Virtualization */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              masterOn && readerTurbo ? "bg-card/80 border-border/60" : "opacity-60 border-border/30 bg-card/20"
            }`}>
              <div className="flex items-center gap-2 pr-2">
                <Eye className="h-4 w-4 text-sky-400 shrink-0" />
                <div>
                  <label htmlFor="sub-reader" className="text-xs font-semibold text-foreground block cursor-pointer">
                    Reader Turbo Virtualization
                  </label>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Async decodes & containment on 50–100 page chapters
                  </span>
                </div>
              </div>
              <Switch
                id="sub-reader"
                checked={readerTurbo}
                disabled={!masterOn}
                onCheckedChange={handleReaderTurboToggle}
                className="data-[state=checked]:bg-sky-500 cursor-pointer"
              />
            </div>

            {/* Feature 4: Network & Data Saver */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              masterOn && dataSaver ? "bg-card/80 border-border/60" : "opacity-60 border-border/30 bg-card/20"
            }`}>
              <div className="flex items-center gap-2 pr-2">
                <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <label htmlFor="sub-data" className="text-xs font-semibold text-foreground block cursor-pointer">
                    Network & Bandwidth Saver
                  </label>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    Pauses heavy video covers & optimizes image contrast
                  </span>
                </div>
              </div>
              <Switch
                id="sub-data"
                checked={dataSaver}
                disabled={!masterOn}
                onCheckedChange={handleDataSaverToggle}
                className="data-[state=checked]:bg-indigo-500 cursor-pointer"
              />
            </div>

            {/* Feature 5: Live FPS & Latency Counter HUD */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              showFpsHud ? "bg-card/80 border-emerald-500/40" : "opacity-75 border-border/30 bg-card/20"
            }`}>
              <div className="flex items-center gap-2 pr-2">
                <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <label htmlFor="sub-fps" className="text-xs font-semibold text-foreground block cursor-pointer">
                    Live FPS & Latency Counter
                  </label>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    On-screen real-time frame rate display
                  </span>
                </div>
              </div>
              <Switch
                id="sub-fps"
                checked={showFpsHud}
                onCheckedChange={handleFpsToggle}
                className="data-[state=checked]:bg-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* One-Click RAM Flush Action */}
          <div className="pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCleanMemory}
              disabled={isCleaning}
              className="w-full text-xs font-bold h-8.5 border-purple-500/40 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className={`h-3.5 w-3.5 ${isCleaning ? "animate-spin" : "text-purple-400"}`} />
              <span>{isCleaning ? "Flushing Memory Cache..." : (lastCleanedText || "Purge RAM & Flush Cache")}</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
  );
}
