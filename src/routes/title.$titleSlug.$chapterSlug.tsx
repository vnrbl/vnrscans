import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Home, List, Maximize, Minimize, Flag, ZoomIn, ZoomOut, Heart, Smile, ThumbsUp, Laugh, Star, MessageSquare } from "lucide-react";
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

export const Route = createFileRoute("/title/$titleSlug/$chapterSlug")({
  head: ({ params }) => ({ meta: [{ title: `Read ${params.chapterSlug} — 0Verse` }] }),
  component: Reader,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-center text-muted-foreground">
      Couldn't open this chapter: {error.message}
    </div>
  ),
});

function Reader() {
  const { titleSlug, chapterSlug } = Route.useParams();
  const seriesSlug = titleSlug;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

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

  // Keyboard navigation (Arrow keys for PC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" && prev) {
        navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } });
      } else if (e.key === "ArrowRight" && next) {
        navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, navigate, seriesSlug]);

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

  // Auto-hide controls after 3 seconds of inactivity
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsVisibleRef = useRef(true);
  const lastTapRef = useRef(0);
  const isDoubleTapToggleRef = useRef(false);

  const showControls = useCallback(() => {
    // Skip auto-show if this was triggered right after a double-tap toggle-off
    if (isDoubleTapToggleRef.current) {
      isDoubleTapToggleRef.current = false;
      return;
    }
    setControlsVisible(true);
    controlsVisibleRef.current = true;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      controlsVisibleRef.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Show controls on mouse movement or touch
  useEffect(() => {
    const handleMouseActivity = () => showControls();
    const handleScrollActivity = () => showControls();
    
    // Double tap detection for mobile
    const handleDoubleTap = (e: TouchEvent) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapRef.current;
      
      if (tapLength < 300 && tapLength > 0) {
        // Check if tap is in middle area (not on edges)
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) { lastTapRef.current = currentTime; return; }
        const screenWidth = window.innerWidth;
        const tapX = touch.clientX;
        
        // Middle 60% of screen
        if (tapX > screenWidth * 0.2 && tapX < screenWidth * 0.8) {
          e.preventDefault();
          e.stopPropagation();
          
          const newVisible = !controlsVisibleRef.current;
          controlsVisibleRef.current = newVisible;
          setControlsVisible(newVisible);
          
          // Clear any existing auto-hide timeout
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          
          if (newVisible) {
            // If showing, set auto-hide timer
            hideTimeoutRef.current = setTimeout(() => {
              setControlsVisible(false);
              controlsVisibleRef.current = false;
            }, 3000);
          } else {
            // If hiding via double-tap, prevent the scroll/touch events from immediately showing again
            isDoubleTapToggleRef.current = true;
          }
          
          // Reset lastTap to prevent triple-tap from re-triggering
          lastTapRef.current = 0;
          return;
        }
      }
      lastTapRef.current = currentTime;
    };
    
    document.addEventListener("mousemove", handleMouseActivity);
    document.addEventListener("touchstart", handleDoubleTap, { passive: false });
    document.addEventListener("scroll", handleScrollActivity);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseActivity);
      document.removeEventListener("touchstart", handleDoubleTap);
      document.removeEventListener("scroll", handleScrollActivity);
    };
  }, [showControls]);

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
      {/* Top Bar - Auto-hide */}
      <div 
        className={`transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <ReaderTopBar
          title={`Ch. ${c.chapter_number}${c.title ? " — " + c.title : ""}`}
          seriesTitle={c.series?.title ?? ""}
          seriesSlug={c.series?.slug ?? ""}
          isNovel={isNovel}
          allChapters={siblingsQ.data ?? []}
          currentChapterSlug={chapterSlug}
        />
      </div>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1">
          {isNovel ? (
            <NovelView content={c.novel_content ?? ""} />
          ) : (
            <ImageView pages={pagesQ.data} loading={pagesQ.isLoading} chapterId={c.id} />
          )}
        </div>
      </div>

      {/* Floating Controls Sidebar - Auto-hide */}
      <div 
        className={`transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <FloatingControls
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          hasPrev={!!prev}
          hasNext={!!next}
          onPrev={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
          onNext={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
          seriesSlug={seriesSlug}
          allChapters={siblingsQ.data ?? []}
          currentChapterSlug={chapterSlug}
          chapterId={c.id}
          seriesId={c.series_id}
          seriesTitle={c.series?.title ?? ""}
        />
      </div>

      {/* Bottom Nav - Auto-hide */}
      <div 
        className={`transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <nav className="sticky bottom-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur md:hidden">
          <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!prev}
              onClick={() => prev && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: prev.slug } })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />Prev
            </Button>
            <div className="flex items-center gap-2">
              <Link to="/home">
                <Button variant="ghost" size="sm" title="Home">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/title/$slug" params={{ slug: seriesSlug }}>
                <Button variant="ghost" size="sm" title="Back to title">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
              {/* Fullscreen Button - Mobile */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
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
              onClick={() => next && navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: next.slug } })}
            >
              Next<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
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
        <Link to="/title/$slug" params={{ slug: seriesSlug }} className="flex min-w-0 items-center gap-2 text-sm">
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
              onValueChange={(slug) => navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: slug } })}
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

function ImageView({ pages, loading, chapterId }: { pages?: any[]; loading: boolean; chapterId: string }) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return <div className="container mx-auto max-w-3xl px-2 py-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded bg-secondary" />)}</div>;
  }
  if (!pages || pages.length === 0) {
    return <div className="grid min-h-[50vh] place-items-center text-muted-foreground">No pages uploaded for this chapter yet.</div>;
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  return (
    <>
      {/* Zoom Controls - Sticky (Desktop Only) */}
      <div className="sticky top-20 z-20 justify-center mb-4 hidden md:flex">
        <div className="inline-flex items-center gap-2 bg-card/95 backdrop-blur border border-border/50 rounded-full px-4 py-2 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="h-8 w-8 p-0 rounded-full"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            onClick={handleZoomReset}
            className="text-sm font-medium min-w-[60px] px-2 py-1 rounded hover:bg-primary/20 transition-colors"
            title="Reset Zoom"
          >
            {zoomLevel}%
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="h-8 w-8 p-0 rounded-full"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pages with Zoom (Desktop) / Normal (Mobile) */}
      <div className="mx-auto max-w-3xl px-2 py-4">
        {pages.map((p) => (
          <img
            key={p.id}
            src={p.image_url}
            alt={`Page ${p.page_number}`}
            loading="lazy"
            className="mx-auto block w-full transition-transform duration-200"
            style={{ transform: isMobile ? 'scale(1)' : `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          />
        ))}

        {/* Reactions & Comments Section */}
        <ChapterReactions chapterId={chapterId} />
      </div>
    </>
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
          to="/title/$slug"
          params={{ slug: seriesSlug }}
          className="p-3 rounded-full hover:bg-primary/20 transition-colors"
          title="Back to title"
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
                  navigate({ to: "/title/$titleSlug/$chapterSlug", params: { titleSlug: seriesSlug, chapterSlug: ch.slug } });
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
            <SelectItem value="series">Report Title</SelectItem>
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
              <SelectItem value="series">Report Title</SelectItem>
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

// Chapter Reactions Component
function ChapterReactions({ chapterId }: { chapterId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Reaction emojis with their types
  const reactions = [
    { type: "heart", icon: Heart, label: "Love" },
    { type: "thumbs_up", icon: ThumbsUp, label: "Like" },
    { type: "laugh", icon: Laugh, label: "Funny" },
    { type: "star", icon: Star, label: "Amazing" },
    { type: "smile", icon: Smile, label: "Enjoyed" },
  ];

  // Fetch reaction counts
  const reactionsQ = useQuery({
    queryKey: ["chapter-reactions", chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("reaction_type")
        .eq("chapter_id", chapterId);
      
      if (error) throw error;

      // Count reactions by type
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch user's reactions
  const userReactionsQ = useQuery({
    queryKey: ["user-chapter-reactions", chapterId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chapter_reactions")
        .select("reaction_type")
        .eq("chapter_id", chapterId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map((r) => r.reaction_type) || [];
    },
    enabled: !!user,
  });

  // Toggle reaction
  const toggleReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) {
        toast.error("Sign in to react");
        return;
      }

      const hasReacted = userReactionsQ.data?.includes(reactionType);

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from("chapter_reactions")
          .delete()
          .eq("chapter_id", chapterId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("chapter_reactions")
          .insert({
            chapter_id: chapterId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter-reactions", chapterId] });
      qc.invalidateQueries({ queryKey: ["user-chapter-reactions", chapterId, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-12 mb-8 border-t border-border pt-8">
      {/* Reactions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">How did you like this chapter?</h3>
        <div className="flex flex-wrap gap-3">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const count = reactionsQ.data?.[reaction.type] || 0;
            const hasReacted = userReactionsQ.data?.includes(reaction.type);

            return (
              <button
                key={reaction.type}
                onClick={() => toggleReaction.mutate(reaction.type)}
                disabled={toggleReaction.isPending}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  hasReacted
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-border hover:bg-primary/10 hover:border-primary/50"
                }`}
                title={reaction.label}
              >
                <Icon className={`h-5 w-5 ${hasReacted ? "fill-current" : ""}`} />
                {count > 0 && <span className="text-sm font-medium">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comments Placeholder */}
      <div className="border border-border rounded-lg p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        <p className="text-muted-foreground">Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-2">
          Share your thoughts and discuss this chapter with other readers
        </p>
      </div>
    </div>
  );
}
