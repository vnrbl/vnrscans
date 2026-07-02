"use client";

import React, { useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Star, Eye, Search, Clock, ChevronRight, User, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/OptimizedImage";

export type NovelSeries = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  type: string;
  rating_average: number;
  status: string;
  view_count: number;
  updated_at: string;
  author: string | null;
  artist: string | null;
  recent_chapters: {
    id: string;
    slug: string;
    chapter_number: number;
    title: string | null;
    created_at: string;
  }[];
};

interface NovelsClientProps {
  initialNovels: NovelSeries[];
}

export default function NovelsClient({ initialNovels }: NovelsClientProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time query to fetch latest novels and chapters
  const novelsQuery = useQuery({
    queryKey: ["novels-list"],
    initialData: initialNovels,
    queryFn: async () => {
      const { data: novels, error: novelsError } = await supabase
        .from("series")
        .select("id,slug,title,description,cover_url,type,rating_average,status,view_count,updated_at,author,artist")
        .eq("type", "novel")
        .eq("is_hidden", false)
        .order("view_count", { ascending: false });

      if (novelsError) throw novelsError;

      if (novels && novels.length > 0) {
        const seriesIds = novels.map(n => n.id);
        const { data: chapters, error: chaptersError } = await supabase
          .from("chapters")
          .select("id,slug,chapter_number,title,created_at,series_id")
          .in("series_id", seriesIds)
          .eq("status", "published")
          .order("chapter_number", { ascending: false });

        if (chaptersError) throw chaptersError;

        const chaptersBySeries = new Map<string, any[]>();
        (chapters ?? []).forEach(ch => {
          const existing = chaptersBySeries.get(ch.series_id) ?? [];
          if (existing.length < 3) {
            existing.push(ch);
          }
          chaptersBySeries.set(ch.series_id, existing);
        });

        return novels.map(n => ({
          ...n,
          recent_chapters: (chaptersBySeries.get(n.id) ?? []).map(ch => ({
            id: ch.id,
            slug: ch.slug,
            chapter_number: Number(ch.chapter_number),
            title: ch.title,
            created_at: ch.created_at,
          }))
        })) as NovelSeries[];
      }
      return [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Query reading history to show read statuses for chapters
  const readingHistoryQuery = useQuery({
    queryKey: ["novels-reading-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reading_history")
        .select("chapter_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map(d => d.chapter_id) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const readChapterIds = useMemo(() => new Set(readingHistoryQuery.data ?? []), [readingHistoryQuery.data]);

  // Filter novels based on search query
  const filteredNovels = useMemo(() => {
    const list = novelsQuery.data ?? [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.description && n.description.toLowerCase().includes(query)) ||
        (n.author && n.author.toLowerCase().includes(query))
    );
  }, [novelsQuery.data, searchQuery]);

  const featuredNovel = useMemo(() => {
    return filteredNovels[0] || null;
  }, [filteredNovels]);

  const remainingNovels = useMemo(() => {
    return filteredNovels.slice(1);
  }, [filteredNovels]);

  const isNewChapter = (createdAt: string) => {
    const now = new Date();
    const chapterDate = new Date(createdAt);
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const timeDiff = now.getTime() - chapterDate.getTime();
    return timeDiff < twoHoursInMs && timeDiff >= 0;
  };

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Book className="h-3.5 w-3.5" /> Premium Light & Web Novels
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:leading-tight">
              Web Novels Hub
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Dive into our library of customizable light novels and web novels. Custom theme coloring, adjustable typography, and progress tracking built right into the reader.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search novels, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-card/50 border-border/60 focus-visible:ring-primary"
            />
          </div>
        </div>

        {filteredNovels.length === 0 ? (
          <div className="rounded-lg border border-border/40 bg-card p-12 text-center max-w-xl mx-auto mt-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No novels found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We couldn't find any novels matching your search query. Try searching for other terms or check back later!
            </p>
          </div>
        ) : (
          <>
            {/* Featured Novel (Hero Section) */}
            {featuredNovel && !searchQuery.trim() && (
              <div className="mb-14">
                <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-2xl">
                  <div className="grid md:grid-cols-12 gap-0 items-center">
                    <div className="md:col-span-7 relative h-64 sm:h-80 md:h-[420px] overflow-hidden">
                      <OptimizedImage
                        src={featuredNovel.cover_url}
                        alt={featuredNovel.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent md:hidden" />
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-semibold">
                        Featured Novel
                      </Badge>
                    </div>

                    <div className="md:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
                          <span className="text-primary font-bold uppercase tracking-wider">
                            {featuredNovel.status}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-violet-600 text-violet-600" />{" "}
                            {featuredNovel.rating_average ? Number(featuredNovel.rating_average).toFixed(1) : "0.0"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />{" "}
                            {featuredNovel.view_count ? featuredNovel.view_count.toLocaleString() : "0"} Views
                          </span>
                        </div>

                        <Link
                          to="/title/$slug"
                          params={{ slug: featuredNovel.slug }}
                          className="text-xl sm:text-2xl font-bold tracking-tight hover:text-primary transition-colors leading-snug"
                        >
                          {featuredNovel.title}
                        </Link>

                        <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {featuredNovel.description || `Read ${featuredNovel.title} online on vnrscans.`}
                        </p>

                        {featuredNovel.author && (
                          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>Author: <span className="text-foreground font-semibold">{featuredNovel.author}</span></span>
                          </div>
                        )}
                      </div>

                      {/* Featured Novel Recent Chapters */}
                      <div className="mt-6 pt-6 border-t border-border/40">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Recent Chapters
                        </h4>
                        {featuredNovel.recent_chapters.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No chapters published yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {featuredNovel.recent_chapters.map((chapter) => {
                              const isRead = readChapterIds.has(chapter.id);
                              const isNew = isNewChapter(chapter.created_at);
                              return (
                                <Link
                                  key={chapter.id}
                                  to="/title/$titleSlug/$chapterSlug"
                                  params={{ titleSlug: featuredNovel.slug, chapterSlug: chapter.slug }}
                                  className={`flex items-center justify-between text-sm transition-colors p-2 rounded-lg bg-background/40 hover:bg-background/80 ${
                                    isRead ? "text-muted-foreground hover:text-foreground" : "text-foreground hover:text-primary font-semibold"
                                  }`}
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <BookOpen className={`h-3.5 w-3.5 shrink-0 ${isRead ? "text-green-600" : "text-primary"}`} />
                                    <span className="truncate">
                                      Chapter {chapter.chapter_number} {chapter.title ? ` - ${chapter.title}` : ""}
                                    </span>
                                    {isNew && !isRead && (
                                      <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                    {formatTimeAgo(chapter.created_at)}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Novels Grid */}
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Novel Updates & Releases
              </h3>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(searchQuery.trim() ? filteredNovels : remainingNovels).map((novel) => (
                  <Card
                    key={novel.id}
                    className="flex flex-col justify-between overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl w-full group"
                  >
                    <div>
                      {/* Cover & General Badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
                        <OptimizedImage
                          src={novel.cover_url}
                          alt={novel.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <Badge variant="secondary" className="absolute top-3 left-3 bg-background/80 backdrop-blur text-[10px] font-semibold uppercase">
                          {novel.status}
                        </Badge>
                        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur font-bold">
                          <Star className="h-3 w-3 fill-violet-600 text-violet-600" />
                          {novel.rating_average ? Number(novel.rating_average).toFixed(1) : "0.0"}
                        </div>
                      </div>

                      <CardContent className="p-5 pb-3">
                        <Link
                          to="/title/$slug"
                          params={{ slug: novel.slug }}
                          className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors leading-snug"
                        >
                          {novel.title}
                        </Link>

                        {novel.author && (
                          <p className="text-[11px] text-muted-foreground mt-1 mb-2">
                            By {novel.author}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {novel.description || `Read ${novel.title} online on vnrscans.`}
                        </p>
                      </CardContent>
                    </div>

                    {/* Chapter features section inside the grid card */}
                    <div className="p-5 pt-3 mt-auto border-t border-border/30">
                      <div className="space-y-2">
                        {novel.recent_chapters.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-2">No chapters published yet.</p>
                        ) : (
                          novel.recent_chapters.map((chapter) => {
                            const isRead = readChapterIds.has(chapter.id);
                            const isNew = isNewChapter(chapter.created_at);
                            return (
                              <Link
                                key={chapter.id}
                                to="/title/$titleSlug/$chapterSlug"
                                params={{ titleSlug: novel.slug, chapterSlug: chapter.slug }}
                                className={`flex items-center justify-between text-xs transition-colors py-1 hover:text-primary ${
                                  isRead ? "text-muted-foreground" : "text-foreground font-semibold"
                                }`}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                  {isRead ? (
                                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-green-600" />
                                  ) : (
                                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  )}
                                  <span className="truncate">
                                    Chapter {chapter.chapter_number}
                                  </span>
                                  {isNew && !isRead && (
                                    <span className="shrink-0 flex items-center rounded-full bg-violet-600 px-1 py-0.2 text-[8px] font-bold text-white">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                                  {formatTimeAgo(chapter.created_at)}
                                </span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-end">
                        <Link
                          to="/title/$slug"
                          params={{ slug: novel.slug }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                        >
                          View Series <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
