"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Sparkles, Globe, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LiveGif {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  width?: number;
  height?: number;
  source?: string;
}

interface LiveWebGifPickerProps {
  onSelectGif: (gif: { url: string; title: string }) => void;
  onClose?: () => void;
  compact?: boolean;
}

const PRESET_TOPICS = [
  { label: "🔥 Hype", query: "anime hype" },
  { label: "🍿 Cinema", query: "absolute cinema" },
  { label: "🗿 Peak", query: "peak fiction" },
  { label: "💀 Cooked", query: "anime bro is cooked" },
  { label: "😂 Laugh", query: "anime laughing" },
  { label: "😭 Crying", query: "anime crying emotional" },
  { label: "🤯 Shocked", query: "anime shocked" },
  { label: "🐐 Gojo / HIM", query: "gojo nah id win" },
  { label: "✨ Sukuna", query: "sukuna malevolent shrine" },
  { label: "🐱 Cats", query: "cat meme" },
];

export function LiveWebGifPicker({
  onSelectGif,
  onClose,
  compact = false,
}: LiveWebGifPickerProps) {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>("anime hype");
  const [gifs, setGifs] = useState<LiveGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGifs = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = (await res.json()) as { gifs?: LiveGif[] };
      setGifs(data.gifs || []);
    } catch (err: any) {
      console.error("Live GIF fetch error:", err);
      setError("Could not load live GIFs. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load with default topic
  useEffect(() => {
    fetchGifs(activeTopic);
  }, []);

  // Debounced search when user types
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveTopic("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchGifs(val.trim() || "anime reaction");
    }, 400);
  };

  const handleSelectTopic = (topic: typeof PRESET_TOPICS[number]) => {
    setActiveTopic(topic.query);
    setQuery("");
    fetchGifs(topic.query);
  };

  const handleClear = () => {
    setQuery("");
    setActiveTopic("anime hype");
    fetchGifs("anime hype");
  };

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-card/95 p-3 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
      {/* Header & Search Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search live web GIFs & memes (Gojo, Cinema, Hype, Cats)..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
            className="w-full h-9 sm:h-10 rounded-xl border border-border/60 bg-background/80 pl-9 pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 sm:h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={onClose}
          >
            <ChevronUp className="h-3.5 w-3.5 mr-1" />
            <span>Hide</span>
          </Button>
        )}
      </div>

      {/* Preset Topics Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/30 mb-3 touch-pan-x">
        <div className="flex items-center gap-1 text-[10px] font-bold text-primary/80 uppercase tracking-wider shrink-0 pr-1">
          <Globe className="h-3 w-3" />
          <span>Live Web:</span>
        </div>
        {PRESET_TOPICS.map((topic) => {
          const isSelected = activeTopic === topic.query;
          return (
            <button
              key={topic.label}
              type="button"
              onClick={() => handleSelectTopic(topic)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border/60"
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      {/* Results Container */}
      <div className="relative min-h-[160px] max-h-64 sm:max-h-80 overflow-y-auto pr-1 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Searching the web for live GIFs...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-rose-400 text-center">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs">{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchGifs(query || activeTopic)}
              className="mt-2 text-xs h-7"
            >
              Try Again
            </Button>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-1.5">
            <Sparkles className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-xs font-medium">No GIFs found for &ldquo;{query || activeTopic}&rdquo;</p>
            <p className="text-[11px] text-muted-foreground/70">Try searching for an anime name, reaction, or meme topic!</p>
          </div>
        ) : (
          <div
            className={`grid ${
              compact
                ? "grid-cols-2 xs:grid-cols-3 sm:grid-cols-4"
                : "grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
            } gap-2`}
          >
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectGif({ url: gif.url, title: gif.title })}
                className="group relative aspect-video sm:aspect-square w-full rounded-xl overflow-hidden border border-border/40 bg-secondary/30 hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 transition-all duration-200 transform active:scale-95 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary"
                title={gif.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.thumbnail || gif.url}
                  alt={gif.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to full gif url if thumbnail fails
                    const target = e.currentTarget;
                    if (target.src !== gif.url) {
                      target.src = gif.url;
                    }
                  }}
                />

                {/* Bottom title gradient banner */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] font-medium text-white line-clamp-1 leading-tight">
                    {gif.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="mt-2.5 pt-2 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground/80">
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3 text-primary/60" /> Live Web Search (Giphy, Tenor & Media)
        </span>
        <span>Tap any GIF to attach to comment</span>
      </div>
    </div>
  );
}
