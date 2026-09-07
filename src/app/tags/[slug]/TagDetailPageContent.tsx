"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeriesCard } from "@/components/SeriesCard";
import { SeriesGrid } from "@/components/SeriesGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TagDetailPageContent({
  slug,
  initialTag,
  initialSeries,
}: {
  slug: string;
  initialTag?: any;
  initialSeries?: any[];
}) {
  // Get tag details
  const tag = useQuery({
    queryKey: ["tag", slug],
    initialData: initialTag,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Get series with this tag
  const series = useQuery({
    queryKey: ["tag-series", slug],
    initialData: initialSeries,
    queryFn: async () => {
      if (!tag.data?.id) return [];
      
      const { data, error } = await supabase
        .from("series_tags")
        .select(`
          series:series_id (
            id,
            slug,
            title,
            cover_url,
            type,
            status,
            rating_average,
            view_count,
            chapter_count,
            description
          )
        `)
        .eq("tag_id", tag.data.id);
      
      if (error) throw error;
      
      // Extract series from nested structure and filter out nulls
      const fetchedSeries = (data || [])
        .map((item: any) => item.series)
        .filter((s: any) => s !== null);

      if (fetchedSeries.length === 0) return [];

      // Fetch actual chapter counts for all fetched series to ensure sync
      const { data: chapters } = await supabase
        .from("chapters")
        .select("series_id,chapter_number")
        .in("series_id", fetchedSeries.map((s: any) => s.id))
        .eq("status", "published");

      const uniqueChaptersBySeries = new Map<string, Set<number>>();
      (chapters ?? []).forEach((chapter: any) => {
        const existing = uniqueChaptersBySeries.get(chapter.series_id) ?? new Set<number>();
        existing.add(Math.floor(chapter.chapter_number));
        uniqueChaptersBySeries.set(chapter.series_id, existing);
      });

      const chapterCountBySeries = new Map<string, number>();
      uniqueChaptersBySeries.forEach((chaptersSet, seriesId) => {
        chapterCountBySeries.set(seriesId, chaptersSet.size);
      });

      return fetchedSeries.map((s: any) => {
        const actualCount = chapterCountBySeries.get(s.id) ?? 0;
        return {
          ...s,
          chapter_count: actualCount > 0 ? actualCount : (s.chapter_count ?? 0),
        };
      });
    },
    enabled: !!tag.data?.id,
  });

  if (tag.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!tag.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tag not found</h1>
          <p className="mt-2 text-muted-foreground">This tag doesn't exist</p>
          <Link href="/tags" className="mt-4 inline-block">
            <Button variant="outline">Browse All Tags</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 relative">
        {/* Back button */}
        <Link href="/tags" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to All Genres & Tags
        </Link>

        {/* Tag header */}
        <div className="mb-8 p-6 rounded-2xl border border-border/30 bg-card/25 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {tag.data.icon && <span className="text-4xl">{tag.data.icon}</span>}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: tag.data.color || undefined }}>
                {tag.data.name}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-3xs font-semibold px-2 py-0.5"
                  style={{
                    borderColor: tag.data.color || undefined,
                    backgroundColor: tag.data.color ? `${tag.data.color}15` : undefined,
                    color: tag.data.color || undefined,
                  }}
                >
                  {tag.data.usage_count} titles
                </Badge>
              </div>
            </div>
          </div>
          {tag.data.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">{tag.data.description}</p>
          )}
        </div>

        {/* Series grid */}
        <div>
          <SeriesGrid
            items={series.data}
            loading={series.isLoading}
            emptyMessage={`No titles have been tagged with "${tag.data.name}" yet.`}
          />
        </div>
      </div>
    </div>
  );
}
