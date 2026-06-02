import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Home, List, Maximize, Minimize, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/series/$seriesSlug/$chapterSlug")({
  head: ({ params }) => ({ meta: [{ title: `Read ${params.chapterSlug} — 0Verse` }] }),
  component: Reader,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-center text-muted-foreground">
      Couldn't open this chapter: {error.message}
    </div>
  ),
});

function Reader() {
  const { seriesSlug, chapterSlug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chapterQ = useQuery({
    queryKey: ["chapter", chapterSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("*, series:series(id,slug,title,type)")
        .eq("slug", chapterSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const pagesQ = useQuery({
    queryKey: ["pages", chapterQ.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_pages")
        .select("id,page_number,image_url")
        .eq("chapter_id", chapterQ.data!.id)
        .order("page_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data && chapterQ.data.chapter_type === "image",
  });

  const siblingsQ = useQuery({
    queryKey: ["chapter-siblings", chapterQ.data?.series?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,chapter_number")
        .eq("series_id", chapterQ.data!.series!.id)
        .eq("status", "published")
        .order("chapter_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!chapterQ.data?.series?.id,
  });

  // Save reading history
  useEffect(() => {
    if (!user || !chapterQ.data) return;
    supabase.from("reading_history").upsert(
      {
        user_id: user.id,
        series_id: chapterQ.data.series_id,
        chapter_id: chapterQ.data.id,
        progress: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,chapter_id" } as any
    ).then(() => {});
  }, [user, chapterQ.data]);

  useEffect(() => {
    if (!chapterQ.data?.id) return;
    supabase.rpc("increment_chapter_view", { _chapter_id: chapterQ.data.id }).then(({ error }) => {
      if (error) {
        console.error("Failed to increment chapter view", error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["chapter", chapterSlug] });
    });
  }, [chapterQ.data?.id, chapterSlug, qc]);

  const idx = siblingsQ.data?.findIndex((c) => c.slug === chapterSlug) ?? -1;
  const prev = idx > 0 ? siblingsQ.data![idx - 1] : null;
  const next = idx >= 0 && siblingsQ.data && idx < siblingsQ.data.length - 1 ? siblingsQ.data[idx + 1] : null;

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (chapterQ.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Loading chapter…</div>;
  }
  if (!chapterQ.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Chapter not found</h1>
          <Link to="/" className="text-primary">Go home</Link>
        </div>
      </div>
    );
  }

  const c = chapterQ.data;
  const isNovel = c.chapter_type === "novel";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Hidden in fullscreen */}
      {!isFullscreen && (
        <ReaderTopBar
          title={`Ch. ${c.chapter_number}${c.title ? " — " + c.title : ""}`}
          seriesTitle={c.series?.title ?? ""}
          seriesSlug={c.series?.slug ?? ""}
          isNovel={isNovel}
          allChapters={siblingsQ.data ?? []}
          currentChapterSlug={chapterSlug}
        />
      )}

      <div className="flex">
        {/* Main content */}
        <div className="flex-1">
          {isNovel ? (
            <NovelView content={c.novel_content ?? ""} />
          ) : (
            <ImageView pages={pagesQ.data} loading={pagesQ.isLoading} />
          )}
        </div>
      </div>

      {/* Floating Controls Sidebar - Always visible */}
      <FloatingControls
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        hasPrev={!!prev}
        hasNext={!!next}
        onPrev={() => prev && navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: prev.slug } })}
        onNext={() => next && navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: next.slug } })}
        seriesSlug={seriesSlug}
        allChapters={siblingsQ.data ?? []}
        currentChapterSlug={chapterSlug}
        chapterId={c.id}
        seriesId={c.series_id}
        seriesTitle={c.series?.title ?? ""}
      />

      {/* Bottom Nav - Hidden in fullscreen */}
      {!isFullscreen && (
        <nav className="sticky bottom-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur md:hidden">
          <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!prev}
              onClick={() => prev && navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: prev.slug } })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />Prev
            </Button>
            <div className="flex items-center gap-2">
              <Link to="/home">
                <Button variant="ghost" size="sm" title="Home">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/series/$slug" params={{ slug: seriesSlug }}>
                <Button variant="ghost" size="sm" title="Back to series">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
              {/* Report Button - Mobile only */}
              <ReportButton 
                chapterId={c.id} 
                seriesId={c.series_id} 
                seriesTitle={c.series?.title ?? ""} 
              />
            </div>
            <Button
              size="sm"
              disabled={!next}
              onClick={() => next && navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: next.slug } })}
            >
              Next<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

function ReaderTopBar({ 
  title, 
  seriesTitle, 
  seriesSlug, 
  isNovel, 
  allChapters, 
  currentChapterSlug 
}: { 
  title: string; 
  seriesTitle: string; 
  seriesSlug: string; 
  isNovel: boolean;
  allChapters: Array<{ id: string; slug: string; chapter_number: number }>;
  currentChapterSlug: string;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <Link to="/series/$slug" params={{ slug: seriesSlug }} className="flex min-w-0 items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <div className="min-w-0">
            <div className="truncate font-semibold">{seriesTitle}</div>
            <div className="truncate text-xs text-muted-foreground">{title}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {allChapters.length > 0 && (
            <Select 
              value={currentChapterSlug} 
              onValueChange={(slug) => navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: slug } })}
            >
              <SelectTrigger className="w-[180px]">
                <List className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {allChapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.slug}>
                    Chapter {ch.chapter_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </header>
  );
}

function ImageView({ pages, loading }: { pages?: any[]; loading: boolean }) {
  if (loading) {
    return <div className="container mx-auto max-w-3xl px-2 py-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded bg-secondary" />)}</div>;
  }
  if (!pages || pages.length === 0) {
    return <div className="grid min-h-[50vh] place-items-center text-muted-foreground">No pages uploaded for this chapter yet.</div>;
  }
  return (
    <div className="mx-auto max-w-3xl px-2 py-4">
      {pages.map((p) => (
        <img
          key={p.id}
          src={p.image_url}
          alt={`Page ${p.page_number}`}
          loading="lazy"
          className="mx-auto block w-full"
        />
      ))}
    </div>
  );
}

function NovelView({ content }: { content: string }) {
  return (
    <article
      className="mx-auto max-w-2xl px-4 py-10 text-foreground"
      style={{ fontSize: "var(--novel-font-size, 18px)", lineHeight: "var(--novel-line-height, 1.7)" }}
    >
      {content.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mb-4 whitespace-pre-wrap">{p}</p>
      ))}
    </article>
  );
}


// Floating Controls Sidebar (like in the image)
function FloatingControls({
  isFullscreen,
  toggleFullscreen,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  seriesSlug,
  allChapters,
  currentChapterSlug,
  chapterId,
  seriesId,
  seriesTitle,
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  seriesSlug: string;
  allChapters: Array<{ id: string; slug: string; chapter_number: number }>;
  currentChapterSlug: string;
  chapterId: string;
  seriesId: string;
  seriesTitle: string;
}) {
  const navigate = useNavigate();
  const [showChapters, setShowChapters] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <>
      {/* Floating Vertical Sidebar */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2 bg-card backdrop-blur-lg rounded-full p-2 border border-border/50 shadow-lg">
        {/* Previous Chapter */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Previous Chapter"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Chapter List */}
        <button
          onClick={() => setShowChapters(!showChapters)}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Chapters"
        >
          <List className="h-5 w-5" />
        </button>

        {/* Home */}
        <Link
          to="/home"
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Back to series */}
        <Link
          to="/series/$slug"
          params={{ slug: seriesSlug }}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Back to series"
        >
          <BookOpen className="h-5 w-5" />
        </Link>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        {/* Report */}
        <button
          onClick={() => setShowReport(!showReport)}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Report"
        >
          <Flag className="h-5 w-5" />
        </button>

        {/* Next Chapter */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-3 rounded-full hover:bg-primary/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Next Chapter"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Chapters Panel */}
      {showChapters && (
        <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 w-64 max-h-96 overflow-y-auto bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl">
          <div className="sticky top-0 bg-card backdrop-blur p-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-sm font-semibold">Chapters</span>
            <button onClick={() => setShowChapters(false)} className="hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {allChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  navigate({ to: "/series/$seriesSlug/$chapterSlug", params: { seriesSlug, chapterSlug: ch.slug } });
                  setShowChapters(false);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-primary/20 transition-colors ${
                  ch.slug === currentChapterSlug ? "bg-primary/30 font-medium" : ""
                }`}
              >
                Chapter {ch.chapter_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Panel */}
      {showReport && (
        <FloatingReportPanel
          onClose={() => setShowReport(false)}
          chapterId={chapterId}
          seriesId={seriesId}
          seriesTitle={seriesTitle}
        />
      )}
    </>
  );
}

// Floating Report Panel
function FloatingReportPanel({ 
  onClose, 
  chapterId, 
  seriesId, 
  seriesTitle 
}: { 
  onClose: () => void; 
  chapterId: string; 
  seriesId: string; 
  seriesTitle: string; 
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [reportType, setReportType] = useState<"chapter" | "series">("chapter");

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed right-20 top-1/2 -translate-y-1/2 z-40 w-72 bg-card backdrop-blur-lg rounded-lg border border-border/50 shadow-xl">
      <div className="sticky top-0 bg-card backdrop-blur p-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-sm font-semibold">Report Issue</span>
        <button onClick={onClose} className="hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chapter">Report Chapter</SelectItem>
            <SelectItem value="series">Report Series</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-xs text-muted-foreground">
          {reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"`}
        </div>

        <Textarea
          placeholder="Describe the issue (min 10 characters)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="resize-none text-sm"
        />
        
        <Button 
          size="sm" 
          onClick={() => submitReport.mutate()}
          disabled={!user || submitReport.isPending}
          className="w-full"
        >
          Submit Report
        </Button>
      </div>
    </div>
  );
}

// Report Button for Mobile
function ReportButton({ chapterId, seriesId, seriesTitle }: { chapterId: string; seriesId: string; seriesTitle: string }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [reportType, setReportType] = useState<"chapter" | "series">("chapter");

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to report");
      if (!reason.trim() || reason.length < 10) throw new Error("Please provide a detailed reason (min 10 characters)");
      
      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        target_type: reportType,
        target_id: reportType === "chapter" ? chapterId : seriesId,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Report Issue</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapter">Report Chapter</SelectItem>
              <SelectItem value="series">Report Series</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground">
            {reportType === "chapter" ? "Report issues with this chapter" : `Report "${seriesTitle}"`}
          </div>

          <Textarea
            placeholder="Describe the issue (min 10 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            className="resize-none"
          />
          
          <Button 
            className="w-full"
            onClick={() => submitReport.mutate()}
            disabled={!user || submitReport.isPending}
          >
            Submit Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
