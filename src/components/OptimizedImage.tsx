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
  const [displaySrc, setDisplaySrc] = useState<string | null>(src);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = displaySrc ? displaySrc.toLowerCase().split("?")[0].endsWith(".mp4") : false;

  // Intersection Observer for both lazy loading and play/pause behavior for video
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isVideo) {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting) {
              setIsInView(true);
            }
          } else {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          }
        });
      },
      {
        rootMargin: isVideo ? "350px" : "250px", // Generous margin for smooth 60fps scrolling
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority, isVideo]);

  // Update displaySrc based on favorite cover in localStorage if seriesId is provided
  useEffect(() => {
    if (seriesId && typeof window !== "undefined") {
      const fav = localStorage.getItem(`fav-cover-${seriesId}`);
      if (fav) {
        setDisplaySrc(fav);
        return;
      }
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
