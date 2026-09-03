"use client";

import React, { useState, useEffect, useRef } from "react";
import { GripVertical, X } from "lucide-react";

export function LiveFpsHud() {
  const [visible, setVisible] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [frameTime, setFrameTime] = useState<number>(16.6);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Sync visibility from localStorage and global events
  useEffect(() => {
    const checkVisibility = () => {
      try {
        const active = localStorage.getItem("vnr-perf-fps-hud") === "true";
        setVisible(active);
      } catch {}
    };

    checkVisibility();

    // Load saved position
    try {
      const savedPos = localStorage.getItem("vnr-fps-pos");
      if (savedPos) {
        const parsed = JSON.parse(savedPos);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(parsed);
        }
      }
    } catch {}

    const handlePerfChange = () => checkVisibility();
    window.addEventListener("vnr-perf-change", handlePerfChange);
    window.addEventListener("storage", handlePerfChange);

    return () => {
      window.removeEventListener("vnr-perf-change", handlePerfChange);
      window.removeEventListener("storage", handlePerfChange);
    };
  }, []);

  // Frame rate calculation loop
  useEffect(() => {
    if (!visible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      frameCount++;
      const delta = now - lastTime;
      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);
        setFrameTime(parseFloat((1000 / Math.max(currentFps, 1)).toFixed(1)));
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);

  // Pointer drag listeners (works for both mouse & touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    e.preventDefault();

    const currentX = pos ? pos.x : 16;
    const currentY = pos ? pos.y : window.innerHeight - 64;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };

    setIsDragging(true);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const elWidth = elementRef.current?.offsetWidth || 190;
    const elHeight = elementRef.current?.offsetHeight || 36;

    const maxX = window.innerWidth - elWidth - 8;
    const maxY = window.innerHeight - elHeight - 8;

    const newX = Math.max(8, Math.min(maxX, dragStartRef.current.initialX + dx));
    const newY = Math.max(8, Math.min(maxY, dragStartRef.current.initialY + dy));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    if (pos) {
      try {
        localStorage.setItem("vnr-fps-pos", JSON.stringify(pos));
      } catch {}
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem("vnr-perf-fps-hud", "false");
      window.dispatchEvent(new Event("vnr-perf-change"));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  const isHighSmooth = fps >= 55;
  const style: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, bottom: "auto", right: "auto" }
    : { left: "16px", bottom: "16px" };

  return (
    <div
      ref={elementRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={style}
      className={`fixed z-[9999] flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/95 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold shadow-2xl select-none touch-none transition-shadow ${
        isDragging ? "cursor-grabbing shadow-emerald-500/30 scale-105" : "cursor-grab hover:border-emerald-400"
      }`}
      title="Drag to move FPS counter anywhere on screen"
    >
      <GripVertical className="h-3.5 w-3.5 text-neutral-500 hover:text-neutral-300 shrink-0" />
      <span className={`h-2 w-2 rounded-full shrink-0 ${isHighSmooth ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
      <span className="whitespace-nowrap">{fps} FPS</span>
      <span className="text-[10px] text-neutral-400 font-normal">({frameTime}ms)</span>
      <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold px-1 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/30 shrink-0">
        Turbo
      </span>
      <button
        type="button"
        onClick={handleClose}
        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        title="Hide FPS HUD"
      >
        <X className="h-2.5 w-2.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
