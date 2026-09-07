"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import with SSR false so Three.js only executes on client
const InteractiveParticles = dynamic(
  () => import("@/components/ui/interactive-particles").then((mod) => mod.InteractiveParticles),
  { ssr: false }
);

export function HeroInteractiveTitle() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const renderTitleImage = () => {
      // Dimensions optimized for tight margins so text fills the viewport
      const canvas = document.createElement("canvas");
      canvas.width = 1500;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Pure black background for clean threshold sampling
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        ctx.letterSpacing = "0.04em";
      } catch {}

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Line 1: DISCOVER STORIES (Luminous crisp white)
      ctx.font = '900 132px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText("DISCOVER STORIES", canvas.width / 2, 105);

      // Line 2: DRAWN BY IMAGINATION (Bright luminous silver into electric violet/purple)
      ctx.font = '900 132px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const grad = ctx.createLinearGradient(120, 0, canvas.width - 120, 0);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.25, "#f3e8ff");
      grad.addColorStop(0.55, "#e9d5ff");
      grad.addColorStop(0.8, "#d8b4fe");
      grad.addColorStop(1, "#c084fc");
      ctx.fillStyle = grad;
      ctx.fillText("DRAWN BY IMAGINATION", canvas.width / 2, 255);

      setDataUrl(canvas.toDataURL("image/png"));
    };

    renderTitleImage();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(renderTitleImage);
    }
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-6xl select-none">
      {/* Semantic H1 for search engines and screen readers */}
      <h1 className="sr-only">
        DISCOVER STORIES DRAWN BY IMAGINATION
      </h1>

      {dataUrl ? (
        <div className="w-full h-[220px] sm:h-[300px] md:h-[400px] lg:h-[480px] xl:h-[520px] flex items-center justify-center">
          <InteractiveParticles
            src={dataUrl}
            allowUpload={false}
            background="transparent"
            color="#ffffff"
            size={2.2}
            randomness={1.0}
            depth={3.2}
            touchRadius={0.18}
            maxDimension={500}
            className="w-full h-full"
          />
        </div>
      ) : (
        /* Fallback while canvas generates or during SSR */
        <div 
          aria-hidden="true" 
          className="mx-auto max-w-5xl text-5xl font-bold leading-[0.95] tracking-[0.06em] text-white sm:text-7xl md:text-8xl lg:text-9xl py-6"
        >
          DISCOVER STORIES
          <br />
          <span className="text-gradient">DRAWN BY IMAGINATION</span>
        </div>
      )}
    </div>
  );
}

export default HeroInteractiveTitle;
