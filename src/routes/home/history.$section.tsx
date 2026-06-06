import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/OptimizedImage";

type HistorySection = "followed-chapters" | "reading-history" | "latest-updates";
type Period = "day" | "week" | "month" | "all";

type HistorySearch = {
  period?: Period;
};

type ChapterItem = {
  id: string;
  slug: string;
  title: string | null;
  chapter_number: number;
  created_at: string;
  series: { slug: string; title: string; cover_url: string | null } | null;
};

const SECTION_META: Record<HistorySection, { title: string; description: string; requiresAuth: boolean; timeLabel: string }> = {
  "followed-chapters": {
    title: "New Chapters from Followed",
    description: "Chapter uploads from series in your library.",
    requiresAuth: true,
    timeLabel: "Uploaded",
  },
  "reading-history": {
    title: "Reading History",
    description: "Chapters you opened, grouped by when you read them.",
    requiresAuth: true,
    timeLabel: "Read",
  },
  "latest-updates": {
    title: "Latest Updates",
    description: "All recently published chapters across the site.",
    requiresAuth: false,
    timeLabel: "Uploaded",
  },
};

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "day", label: "1 Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

export const Route = createFileRoute("/home/history/$section")({
  validateSearch: (search: Record<string, unknown>): HistorySearch => {
    const period = search.period;
    return {
      period: period === "week" || period === "month" || period === "all" ? period : "day",
    };
  },
  head: () => ({
    meta: [
      { title: "Home History - vnrscans" },
      { name: "description", content: "Browse home section history by time period." },
    ],
  }),
  component: HomeHistoryPage,
});

function HomeHistoryPage() {
  const { section } = Route.useParams();
  const { period = "day" } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();

  const sectionKey = isHistorySection(section) ? section : null;
  const meta = sectionKey ? SECTION_META[sectionKey] : null;

  const chapters = useQuery({
    queryKey: ["home-history", sectionKey, period, user?.id],
    queryFn: async () => {
      if (!sectionKey) return [];
      if (sectionKey === "followed-chapters") return fetchFollowedChapters(user!.id, period);
      if (sectionKey === "reading-history") return fetchReadingHistory(user!.id, period);
      return fetchLatestUpdates(period);
    },
    enabled: !!sectionKey && (!meta?.requiresAuth || !!user) && !authLoading,
    staleTime: 1000 * 60 * 2,
  });

  if (!sectionKey || !meta) {
    return (
      <main className="container mx-auto min-h-screen px-4 py-24">
        <Button asChild variant="ghost" className="mb-6 gap-2">
          <Link to="/home">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Section not found</h1>
      </main>
    );
  }

  const needsLogin = meta.requiresAuth && !authLoading && !user;

  return (
    <main className="container mx-auto min-h-screen px-4 py-20 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/home">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              asChild
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              className="h-9"
            >
              <Link
                to="/home/history/$section"
                params={{ section: sectionKey }}
                search={{ period: item.value }}
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {needsLogin ? (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          Sign in to view this history.
        </div>
      ) : chapters.isLoading || authLoading ? (
        <HistoryGridSkeleton />
      ) : (chapters.data ?? []).length > 0 ? (
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          {(chapters.data ?? []).map((chapter) => (
            <HistoryChapterCard key={chapter.id} chapter={chapter} timeLabel={meta.timeLabel} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/40 bg-card p-8 text-center text-muted-foreground">
          No chapters found for this period.
        </div>
      )}
    </main>
  );
}

async function fetchFollowedChapters(userId: string, period: Period): Promise<ChapterItem[]> {
  const { data: library, error: libError } = await supabase
    .from("user_library" as any)
    .select("series_id")
    .eq("user_id", userId);
  if (libError) throw libError;

  const seriesIds = ((library ?? []) as unknown as Array<{ series_id: string }>).map((row) => row.series_id);
  if (seriesIds.length === 0) return [];

  let query = supabase
    .from("chapters")
    .select("id,slug,title,chapter_number,created_at,series:series_id(slug,title,cover_url)")
    .in("series_id", seriesIds)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(120);

  const cutoff = getCutoffDate(period);
  if (cutoff) query = query.gte("created_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ChapterItem[];
}

async function fetchReadingHistory(userId: string, period: Period): Promise<ChapterItem[]> {
  let query = supabase
    .from("reading_history")
    .select("id,updated_at,series:series_id(slug,title,cover_url),chapters:chapter_id(slug,chapter_number,title)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(120);

  const cutoff = getCutoffDate(period);
  if (cutoff) query = query.gte("updated_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row.series?.slug && row.chapters?.slug)
    .map((row) => ({
      id: row.id,
      slug: row.chapters.slug,
      title: row.chapters.title,
      chapter_number: row.chapters.chapter_number,
      created_at: row.updated_at,
      series: row.series,
    }));
}

async function fetchLatestUpdates(period: Period): Promise<ChapterItem[]> {
  let query = supabase
    .from("chapters")
    .select("id,slug,title,chapter_number,created_at,series:series_id(slug,title,cover_url)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(120);

  const cutoff = getCutoffDate(period);
  if (cutoff) query = query.gte("created_at", cutoff);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ChapterItem[];
}

function HistoryChapterCard({ chapter, timeLabel }: { chapter: ChapterItem; timeLabel: string }) {
  const seriesSlug = chapter.series?.slug;
  if (!seriesSlug) return null;

  return (
    <article className="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Link to="/title/$titleSlug/$chapterSlug" params={{ titleSlug: seriesSlug, chapterSlug: chapter.slug }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <OptimizedImage
            src={chapter.series?.cover_url ?? null}
            alt={chapter.series?.title ?? ""}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute bottom-2 left-2 gap-1 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow backdrop-blur">
            <BookOpen className="h-3 w-3" />
            Ch.{chapter.chapter_number}
          </Badge>
        </div>
      </Link>
      <div className="p-3">
        <Link to="/title/$slug" params={{ slug: seriesSlug }} className="line-clamp-2 text-sm font-semibold leading-tight hover:text-primary">
          {chapter.series?.title}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {timeLabel} {formatTimeAgo(chapter.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function HistoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
          <div className="aspect-[3/4] animate-pulse bg-secondary" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function isHistorySection(section: string): section is HistorySection {
  return section === "followed-chapters" || section === "reading-history" || section === "latest-updates";
}

function getCutoffDate(period: Period): string | null {
  if (period === "all") return null;

  const date = new Date();
  if (period === "day") date.setDate(date.getDate() - 1);
  if (period === "week") date.setDate(date.getDate() - 7);
  if (period === "month") date.setMonth(date.getMonth() - 1);
  return date.toISOString();
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
