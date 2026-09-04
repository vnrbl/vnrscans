"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Flame, Film, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSafeAttachmentUrls } from "@/lib/safe-url";

interface CommentAttachmentGridProps {
  urls: string[] | string | null | undefined;
  alt?: string | null;
  type?: "image" | "gif" | null;
  className?: string;
}

export function CommentAttachmentGrid({
  urls,
  alt,
  type,
  className = "",
}: CommentAttachmentGridProps) {
  const safeUrls = Array.isArray(urls)
    ? urls.filter(Boolean).slice(0, 5)
    : parseSafeAttachmentUrls(urls);

  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});

  const isGif = type === "gif" || (safeUrls.length === 1 && safeUrls[0]?.toLowerCase().includes(".gif"));

  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const showNext = useCallback(() => {
    setActiveLightboxIndex((curr) => {
      if (curr === null) return null;
      return (curr + 1) % safeUrls.length;
    });
  }, [safeUrls.length]);

  const showPrev = useCallback(() => {
    setActiveLightboxIndex((curr) => {
      if (curr === null) return null;
      return (curr - 1 + safeUrls.length) % safeUrls.length;
    });
  }, [safeUrls.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        showNext();
      } else if (e.key === "ArrowLeft") {
        showPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, showNext, showPrev]);

  if (!safeUrls || safeUrls.length === 0) {
    return null;
  }

  // Render Single Image
  if (safeUrls.length === 1) {
    const url = safeUrls[0];
    const isLoaded = loadedMap[0];
    const hasError = errorMap[0];

    return (
      <>
        <div className={`mt-2 inline-block max-w-full sm:max-w-md ${className}`}>
          <div
            onClick={() => openLightbox(0)}
            className="group relative block overflow-hidden rounded-xl border border-border/50 bg-black/40 hover:border-primary/50 transition-all duration-200 shadow-sm cursor-pointer select-none max-w-full"
          >
            {hasError ? (
              <div className="flex items-center gap-2.5 p-3 bg-secondary/30 rounded-xl border border-border/40">
                <span className="text-xl">⚠️</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{alt || "Comment Media"}</p>
                  <span className="text-[10px] text-muted-foreground">Media unavailable</span>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-center bg-secondary/10">
                <img
                  src={url}
                  alt={alt ?? (isGif ? "Comment GIF" : "Comment Image")}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="max-h-56 sm:max-h-72 w-auto max-w-full object-contain rounded-xl group-hover:scale-[1.01] transition-transform duration-200 block"
                  onLoad={() => setLoadedMap((prev) => ({ ...prev, 0: true }))}
                  onError={() => {
                    setErrorMap((prev) => ({ ...prev, 0: true }));
                  }}
                />
              </div>
            )}

            {!hasError && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-primary flex items-center gap-1 border border-primary/30 pointer-events-none">
                {isGif ? <Film className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                <span>{isGif ? "GIF" : "MEME"}</span>
              </div>
            )}

            <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <ZoomIn className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {activeLightboxIndex !== null && renderLightbox()}
      </>
    );
  }

  // Multi-image Grids (2 to 5 images)
  return (
    <>
      <div className={`mt-2.5 max-w-full sm:max-w-lg ${className}`}>
        {/* Top bar info indicator for multiple images */}
        <div className="flex items-center gap-1.5 mb-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Flame className="h-3 w-3 text-primary" />
          <span>{safeUrls.length} Images attached</span>
        </div>

        {/* 2 Images Layout */}
        {safeUrls.length === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {safeUrls.map((url, idx) => renderGridThumbnail(url, idx, "aspect-[4/3] h-36 sm:h-44"))}
          </div>
        )}

        {/* 3 Images Layout */}
        {safeUrls.length === 3 && (
          <div className="grid grid-cols-3 gap-2">
            {safeUrls.map((url, idx) => renderGridThumbnail(url, idx, "aspect-square h-28 sm:h-36"))}
          </div>
        )}

        {/* 4 Images Layout */}
        {safeUrls.length === 4 && (
          <div className="grid grid-cols-2 gap-2">
            {safeUrls.map((url, idx) => renderGridThumbnail(url, idx, "aspect-[4/3] h-32 sm:h-40"))}
          </div>
        )}

        {/* 5 Images Layout: Top 2, Bottom 3 */}
        {safeUrls.length === 5 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {safeUrls.slice(0, 2).map((url, idx) => renderGridThumbnail(url, idx, "aspect-[4/3] h-32 sm:h-40"))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {safeUrls.slice(2, 5).map((url, idx) => renderGridThumbnail(url, idx + 2, "aspect-square h-24 sm:h-32"))}
            </div>
          </div>
        )}
      </div>

      {activeLightboxIndex !== null && renderLightbox()}
    </>
  );

  function renderGridThumbnail(url: string, idx: number, heightClass: string) {
    const isLoaded = loadedMap[idx];
    const hasError = errorMap[idx];

    return (
      <div
        key={idx}
        onClick={() => openLightbox(idx)}
        className={`group relative overflow-hidden rounded-xl border border-border/60 bg-black/40 hover:border-primary/60 transition-all duration-200 cursor-pointer select-none shadow-sm ${heightClass}`}
      >
        {!isLoaded && !hasError && (
          <div className="h-full w-full animate-pulse bg-secondary/80 flex items-center justify-center text-muted-foreground text-xs">
            Loading...
          </div>
        )}

        {hasError ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-secondary/50 p-2 text-center">
            <span className="text-xl">⚠️</span>
            <span className="text-2xs text-muted-foreground mt-1">Image {idx + 1}</span>
          </div>
        ) : (
          <img
            src={url}
            alt={alt ? `${alt} (${idx + 1})` : `Comment image ${idx + 1}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 block"
            onLoad={() => setLoadedMap((prev) => ({ ...prev, [idx]: true }))}
            onError={() => {
              setErrorMap((prev) => ({ ...prev, [idx]: true }));
              setLoadedMap((prev) => ({ ...prev, [idx]: true }));
            }}
          />
        )}

        {/* Index Pill Overlay */}
        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10 pointer-events-none">
          {idx + 1}/{safeUrls.length}
        </span>

        {/* Hover zoom icon */}
        <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="h-3 w-3" />
        </div>
      </div>
    );
  }

  function renderLightbox() {
    if (activeLightboxIndex === null) return null;
    const currentUrl = safeUrls[activeLightboxIndex];

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer select-none"
        onClick={closeLightbox}
      >
        <div
          className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between px-2 py-2 mb-2 text-white">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-bold tracking-wider">
                {activeLightboxIndex + 1} / {safeUrls.length}
              </span>
              {alt && <span className="text-xs text-white/80 font-medium truncate max-w-xs">{alt}</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 cursor-pointer"
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Image Viewport */}
          <div className="relative flex items-center justify-center max-w-full w-full">
            {safeUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 sm:-left-12 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full h-10 w-10 border border-white/20 shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            <img
              src={currentUrl}
              alt={alt ? `${alt} (${activeLightboxIndex + 1})` : `Full image ${activeLightboxIndex + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black/40"
            />

            {safeUrls.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:-right-12 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full h-10 w-10 border border-white/20 shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Bottom Thumbnail Navigation Strip (if > 1 image) */}
          {safeUrls.length > 1 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 bg-black/40 rounded-xl border border-white/10">
              {safeUrls.map((thumbUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveLightboxIndex(idx)}
                  className={`relative shrink-0 h-12 w-14 sm:h-14 sm:w-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeLightboxIndex === idx
                      ? "border-primary scale-105 shadow-md ring-2 ring-primary/40"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-white">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
