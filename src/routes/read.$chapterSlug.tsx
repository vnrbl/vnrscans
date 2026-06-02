import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Settings, ArrowLeft, BookOpen } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/read/$chapterSlug")({
  head: ({ params }) => ({ meta: [{ title: `Read ${params.chapterSlug} — ShadowShelf` }] }),
  component: Reader,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-center text-muted-foreground">
      Couldn't open this chapter: {error.message}
    </div>
  ),
});

function Reader() {
  const { chapterSlug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      { onConflict: "user_id,series_id" } as any
    ).then(() => {});
  }, [user, chapterQ.data]);

  const idx = siblingsQ.data?.findIndex((c) => c.slug === chapterSlug) ?? -1;
  const prev = idx > 0 ? siblingsQ.data![idx - 1] : null;
  const next = idx >= 0 && siblingsQ.data && idx < siblingsQ.data.length - 1 ? siblingsQ.data[idx + 1] : null;

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
      <ReaderTopBar
        title={`Ch. ${c.chapter_number}${c.title ? " — " + c.title : ""}`}
        seriesTitle={c.series?.title ?? ""}
        seriesSlug={c.series?.slug ?? ""}
        isNovel={isNovel}
      />

      {isNovel ? (
        <NovelView content={c.novel_content ?? ""} />
      ) : (
        <ImageView pages={pagesQ.data} loading={pagesQ.isLoading} />
      )}

      <nav className="sticky bottom-0 z-30 border-t border-border/50 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prev}
            onClick={() => prev && navigate({ to: "/read/$chapterSlug", params: { chapterSlug: prev.slug } })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />Prev
          </Button>
          <Link to="/series/$slug" params={{ slug: c.series?.slug ?? "" }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <BookOpen className="h-4 w-4" /> All chapters
          </Link>
          <Button
            size="sm"
            disabled={!next}
            onClick={() => next && navigate({ to: "/read/$chapterSlug", params: { chapterSlug: next.slug } })}
          >
            Next<ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </nav>
    </div>
  );
}

function ReaderTopBar({ title, seriesTitle, seriesSlug, isNovel }: { title: string; seriesTitle: string; seriesSlug: string; isNovel: boolean }) {
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
        {isNovel && <ReaderSettings />}
      </div>
    </header>
  );
}

function ReaderSettings() {
  const [fontSize, setFontSize] = useState<number>(() => Number(typeof window !== "undefined" ? localStorage.getItem("novel.fontSize") : 0) || 18);
  const [lineHeight, setLineHeight] = useState<number>(() => Number(typeof window !== "undefined" ? localStorage.getItem("novel.lineHeight") : 0) || 1.7);
  useEffect(() => {
    document.documentElement.style.setProperty("--novel-font-size", `${fontSize}px`);
    document.documentElement.style.setProperty("--novel-line-height", String(lineHeight));
    localStorage.setItem("novel.fontSize", String(fontSize));
    localStorage.setItem("novel.lineHeight", String(lineHeight));
  }, [fontSize, lineHeight]);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>Reader settings</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <Label>Font size: {fontSize}px</Label>
            <Slider value={[fontSize]} min={14} max={28} step={1} onValueChange={(v) => setFontSize(v[0])} />
          </div>
          <div>
            <Label>Line height: {lineHeight.toFixed(2)}</Label>
            <Slider value={[lineHeight * 100]} min={120} max={220} step={5} onValueChange={(v) => setLineHeight(v[0] / 100)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
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