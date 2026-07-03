import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  priority = false,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  const isVideo = src ? src.toLowerCase().split("?")[0].endsWith(".mp4") : false;

  if (isVideo && src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover transition-opacity duration-300 opacity-100"
          draggable={false}
        />
      </div>
    );
  }

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary text-muted-foreground ${fallbackClassName || className}`}
      >
        <BookOpen className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary" />
      )}
      {isInView && (
        <img
          src={src}
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
