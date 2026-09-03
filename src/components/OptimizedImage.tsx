import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
  seriesId?: string;
}

// Shared singleton IntersectionObserver for all cards sitewide
type ImageObserverCallback = (isIntersecting: boolean) => void;
let sharedImageObserver: IntersectionObserver | null = null;
const observerCallbacks = new WeakMap<Element, ImageObserverCallback>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return null;
  if (!sharedImageObserver) {
    sharedImageObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = observerCallbacks.get(entry.target);
          if (cb) cb(entry.isIntersecting);
        }
      },
      { rootMargin: "300px" }
    );
  }
  return sharedImageObserver;
}

const favCoverCache = new Map<string, string | null>();

export function OptimizedImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  priority = false,
  onLoad,
  seriesId,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const [displaySrc, setDisplaySrc] = useState<string | null>(() => {
    if (seriesId && typeof window !== "undefined") {
      if (favCoverCache.has(seriesId)) return favCoverCache.get(seriesId) ?? src;
      try {
        const fav = localStorage.getItem(`fav-cover-${seriesId}`);
        favCoverCache.set(seriesId, fav);
        if (fav) return fav;
      } catch {}
    }
    return src;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = displaySrc ? displaySrc.toLowerCase().split("?")[0].endsWith(".mp4") : false;

  // Single shared observer eliminates 50-100 separate C++ observer instances per page
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      setIsIntersecting(true);
      return;
    }

    const el = containerRef.current;
    const observer = getSharedObserver();

    if (!observer) {
      setIsInView(true);
      setIsIntersecting(true);
      return;
    }

    observerCallbacks.set(el, (intersecting) => {
      setIsIntersecting(intersecting);
      if (intersecting) {
        setIsInView(true);
        if (!isVideo) {
          observer.unobserve(el);
          observerCallbacks.delete(el);
        }
      }
    });

    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observerCallbacks.delete(el);
    };
  }, [priority, isVideo]);

  // Update displaySrc if src or seriesId prop changes
  useEffect(() => {
    if (seriesId && typeof window !== "undefined") {
      if (favCoverCache.has(seriesId)) {
        setDisplaySrc(favCoverCache.get(seriesId) ?? src);
        return;
      }
      try {
        const fav = localStorage.getItem(`fav-cover-${seriesId}`);
        favCoverCache.set(seriesId, fav);
        if (fav) {
          setDisplaySrc(fav);
          return;
        }
      } catch {}
    }
    setDisplaySrc(src);
  }, [src, seriesId]);

  // Control video playback based on viewport intersection
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    if (isIntersecting) {
      videoRef.current.play().catch(() => {
        // Handle autoplay blocking gracefully
      });
    } else {
      videoRef.current.pause();
    }
  }, [isIntersecting, isVideo]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  if (!displaySrc || error) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center bg-secondary text-muted-foreground ${fallbackClassName || className}`}
      >
        <BookOpen className="h-10 w-10" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
        {isInView ? (
          <video
            ref={videoRef}
            src={displaySrc}
            loop
            muted
            playsInline
            className="h-full w-full object-cover transition-opacity duration-300 opacity-100"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary" />
      )}
      {isInView && (
        <img
          src={displaySrc}
          alt={alt}
          width={300}
          height={450}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      )}
    </div>
  );
}
