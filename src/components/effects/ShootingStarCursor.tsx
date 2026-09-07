"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isChapterReadingPath } from "@/lib/layout";

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  decay: number;
  color: string;
  glowColor: string;
  rotation: number;
  rotSpeed: number;
  isStar: boolean; // true = 4-pointed star, false = round stardust speck
}

const CELESTIAL_COLORS = [
  { color: "#ffffff", glow: "rgba(255, 255, 255, 0.95)" },  // Pure white star core
  { color: "#f5f3ff", glow: "rgba(237, 233, 254, 0.9)" },   // Ethereal soft lavender
  { color: "#e9d5ff", glow: "rgba(216, 180, 254, 0.85)" },  // Luminous violet
  { color: "#d8b4fe", glow: "rgba(192, 132, 252, 0.85)" },  // Bright lavender-purple sparkle
  { color: "#c084fc", glow: "rgba(168, 85, 247, 0.85)" },  // Radiant purple
  { color: "#a855f7", glow: "rgba(147, 51, 234, 0.8)" },   // Vivid brand purple
  { color: "#8b5cf6", glow: "rgba(139, 92, 246, 0.8)" },   // Signature VNR Scans violet
  { color: "#7c3aed", glow: "rgba(124, 58, 237, 0.75)" },  // Deep cosmic violet
  { color: "#818cf8", glow: "rgba(99, 102, 241, 0.7)" },   // Subtle indigo nebula accent
];

export function ShootingStarCursor() {
  const pathname = usePathname() || "";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasMouse, setHasMouse] = useState(false);

  // Check if current page is chapter reading
  const isReading = isChapterReadingPath(pathname);

  // Check for mouse/fine pointer support
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(pointer: fine)");
    setHasMouse(media.matches);

    const handler = (e: MediaQueryListEvent) => setHasMouse(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    // Disable effect completely on touch devices or while reading chapters
    if (!hasMouse || isReading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const particles: StarParticle[] = [];
    const mouse = {
      x: -1000,
      y: -1000,
      lastX: -1000,
      lastY: -1000,
      speed: 0,
      active: false,
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const createParticle = (x: number, y: number, angleOffset: number, speedMult: number): StarParticle => {
      const palette = CELESTIAL_COLORS[Math.floor(Math.random() * CELESTIAL_COLORS.length)];
      const angle = angleOffset + (Math.random() - 0.5) * 1.6;
      const speed = (0.2 + Math.random() * 1.4) * speedMult;
      const isStar = Math.random() < 0.28; // ~28% are 4-pointed sparkle stars
      const size = isStar ? 2.5 + Math.random() * 3.2 : 0.8 + Math.random() * 2.2;

      return {
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.08, // gentle cosmic gravity
        size,
        maxSize: size,
        alpha: 0.85 + Math.random() * 0.15,
        decay: 0.016 + Math.random() * 0.024, // fades over ~0.8-1.4s
        color: palette.color,
        glowColor: palette.glow,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        isStar,
      };
    };

    const emitParticles = (startX: number, startY: number, endX: number, endY: number) => {
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const perpAngle = angle + Math.PI / 2;

      // Density based on distance traveled so fast mouse movements leave smooth continuous trails
      const steps = Math.min(Math.max(Math.floor(dist / 3), 1), 22);

      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const curX = startX + dx * t;
        const curY = startY + dy * t;

        // Emit 1 to 3 particles per step
        const count = dist > 40 ? 3 : dist > 15 ? 2 : 1;
        for (let j = 0; j < count; j++) {
          if (particles.length < 320) {
            particles.push(createParticle(curX, curY, perpAngle, Math.min(dist * 0.04, 1.6)));
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const newX = e.clientX;
      const newY = e.clientY;

      if (!mouse.active) {
        mouse.x = newX;
        mouse.y = newY;
        mouse.lastX = newX;
        mouse.lastY = newY;
        mouse.active = true;
        return;
      }

      emitParticles(mouse.lastX, mouse.lastY, newX, newY);

      mouse.lastX = newX;
      mouse.lastY = newY;
      mouse.x = newX;
      mouse.y = newY;
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // Draw 4-pointed sparkle star
    const drawSparkleStar = (c: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
      c.beginPath();
      const innerR = r * 0.22;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const x1 = cx + Math.cos(a) * r;
        const y1 = cy + Math.sin(a) * r;
        if (i === 0) c.moveTo(x1, y1);
        else c.lineTo(x1, y1);

        const aMid = a + Math.PI / 4;
        const x2 = cx + Math.cos(aMid) * innerR;
        const y2 = cy + Math.sin(aMid) * innerR;
        c.lineTo(x2, y2);
      }
      c.closePath();
      c.fill();
    };

    // Main render loop
    let isRunning = true;
    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96; // air drag
        p.vy *= 0.96;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = p.isStar ? 8 : 4;

        if (p.isStar) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawSparkleStar(ctx, 0, 0, p.size * (0.6 + p.alpha * 0.4));
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, p.size * (0.4 + p.alpha * 0.6)), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [hasMouse, isReading]);

  // If reading chapters or touch-only device, render nothing
  if (!hasMouse || isReading) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[99999] select-none"
      aria-hidden="true"
    />
  );
}
