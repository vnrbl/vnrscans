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
      const canvas = document.createElement("canvas");
      canvas.width = 1400;
      canvas.height = 380;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark background for sampling brightness threshold
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        ctx.letterSpacing = "0.06em";
      } catch {}

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Line 1: DISCOVER STORIES (Luminous white)
      ctx.font = '900 92px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText("DISCOVER STORIES", canvas.width / 2, 120);

      // Line 2: DRAWN BY IMAGINATION (White to signature Purple/Violet gradient)
      ctx.font = '900 92px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const grad = ctx.createLinearGradient(180, 0, canvas.width - 180, 0);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#f3e8ff");
      grad.addColorStop(0.65, "#c084fc");
      grad.addColorStop(1, "#a855f7");
      ctx.fillStyle = grad;
      ctx.fillText("DRAWN BY IMAGINATION", canvas.width / 2, 260);

      setDataUrl(canvas.toDataURL("image/png"));
    };

    renderTitleImage();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(renderTitleImage);
    }
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-5xl select-none">
      {/* Semantic H1 for screen readers and SEO crawlers */}
      <h1 className="sr-only">
        DISCOVER STORIES DRAWN BY IMAGINATION
      </h1>

      {dataUrl ? (
        <div className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[380px] flex items-center justify-center">
          <InteractiveParticles
            src={dataUrl}
            allowUpload={false}
            background="transparent"
            color="#ffffff"
            size={1.5}
            randomness={1.5}
            depth={3.0}
            touchRadius={0.16}
            maxDimension={420}
            className="w-full h-full"
          />
        </div>
      ) : (
        /* Fallback while canvas generates or during initial render */
        <div 
          aria-hidden="true" 
          className="mx-auto max-w-5xl text-4xl font-bold leading-[0.95] tracking-[0.06em] text-white sm:text-6xl md:text-7xl lg:text-8xl py-4"
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
