"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isChapterReadingPath } from "@/lib/layout";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Sparkles, Compass, Library, Dice5, Flame, Crown } from "lucide-react";
import Image from "next/image";

interface SearchSeriesResult {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  type: string | null;
  status: string | null;
}

export function CommandSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSeriesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Only active while reading chapters / chapter reader pages
  const isReading = isChapterReadingPath(pathname || "");

  // Auto-close if navigating away from chapter reading
  useEffect(() => {
    if (!isReading) {
      setOpen(false);
    }
  }, [isReading]);

  // Listen for Cmd+K and custom event ONLY while reading chapters
  useEffect(() => {
    if (!isReading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-global-search", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-global-search", handleCustomOpen);
    };
  }, [isReading]);

  const searchCacheRef = useRef<Map<string, SearchSeriesResult[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search query with AbortController and instant cache
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Check memory cache for instantaneous response (<1ms)
    if (searchCacheRef.current.has(trimmed.toLowerCase())) {
      setResults(searchCacheRef.current.get(trimmed.toLowerCase())!);
      setLoading(false);
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("series")
          .select("id, slug, title, cover_url, type, status")
          .or(`title.ilike.%${trimmed}%,alternative_titles.ilike.%${trimmed}%,author.ilike.%${trimmed}%`)
          .abortSignal(controller.signal)
          .limit(8);

        if (!error && data && !controller.signal.aborted) {
          const formatted = data as SearchSeriesResult[];
          searchCacheRef.current.set(trimmed.toLowerCase(), formatted);
          setResults(formatted);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  if (!isReading) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search series, authors, novels... (Ctrl+K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[380px] p-2">
        {loading && (
          <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
            Searching series database...
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <CommandEmpty>No matching series found.</CommandEmpty>
        )}

        {results.length > 0 && (
          <CommandGroup heading="Series & Comics">
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => handleSelect(`/title/${item.slug}`)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/80 transition-colors"
              >
                {item.cover_url ? (
                  <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-neutral-900 border border-border/50">
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded bg-secondary text-xs">
                    📖
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="capitalize text-primary/90 font-medium">
                      {item.type || "manga"}
                    </span>
                    {item.status && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{item.status}</span>
                      </>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick Navigation">
          <CommandItem
            onSelect={() => handleSelect("/browse")}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Compass className="h-4 w-4 text-primary" />
            <span>Browse All Comics & Manga</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect("/novels")}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span>Light Novels Library</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect("/rankings")}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Top Rankings & Trending</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect("/leaderboard")}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Crown className="h-4 w-4 text-yellow-400" />
            <span>User Leaderboard & Season Ranks</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelect("/library")}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs"
          >
            <Library className="h-4 w-4 text-emerald-400" />
            <span>My Bookmarks & Offline Downloads</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
