import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Admin - Reports" }] }),
  component: AdminReports,
});

type ReportWithContext = {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { user_id: string; username: string; avatar_url: string | null } | null;
  series: { id: string; title: string; slug: string; cover_url?: string | null } | null;
  chapter: {
    id: string;
    slug: string;
    chapter_number: number;
    title: string | null;
    series_id: string;
  } | null;
};

type ReportStatus = Database["public"]["Enums"]["report_status"];
type ProfileContext = { user_id: string; username: string; avatar_url: string | null };
type SeriesContext = { id: string; title: string; slug: string; cover_url?: string | null };
type ChapterContext = {
  id: string;
  slug: string;
  chapter_number: number;
  title: string | null;
  series_id: string;
  series?: SeriesContext | null;
};

function AdminReports() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async (): Promise<ReportWithContext[]> => {
      const { data: reports, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const rows = reports ?? [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
      const seriesTargetIds = rows
        .filter((r) => r.target_type === "series")
        .map((r) => r.target_id);
      const chapterTargetIds = rows
        .filter((r) => r.target_type === "chapter")
        .map((r) => r.target_id);

      const [{ data: profiles }, { data: seriesTargets }, { data: chapterTargets }] =
        await Promise.all([
          userIds.length
            ? supabase
                .from("profiles")
                .select("user_id, username, avatar_url")
                .in("user_id", userIds)
            : Promise.resolve({ data: [] }),
          seriesTargetIds.length
            ? supabase.from("series").select("id, title, slug, cover_url").in("id", seriesTargetIds)
            : Promise.resolve({ data: [] }),
          chapterTargetIds.length
            ? supabase
                .from("chapters")
                .select(
                  "id, slug, chapter_number, title, series_id, series:series_id(id, title, slug)",
                )
                .in("id", chapterTargetIds)
            : Promise.resolve({ data: [] }),
        ]);

      const profileRows = (profiles ?? []) as ProfileContext[];
      const seriesRows = (seriesTargets ?? []) as SeriesContext[];
      const chapterRows = (chapterTargets ?? []) as ChapterContext[];

      const profileMap = new Map(profileRows.map((p) => [p.user_id, p]));
      const seriesMap = new Map(seriesRows.map((s) => [s.id, s]));
      const chapterMap = new Map(chapterRows.map((ch) => [ch.id, ch]));

      return rows.map((report) => {
        const chapter = chapterMap.get(report.target_id) ?? null;
        const series =
          report.target_type === "series"
            ? (seriesMap.get(report.target_id) ?? null)
            : (chapter?.series ?? null);

        return {
          ...report,
          reporter: profileMap.get(report.user_id) ?? null,
          series,
          chapter: report.target_type === "chapter" ? chapter : null,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review who reported content, which series it belongs to, and the exact chapter when
          available.
        </p>
      </div>

      <div className="mt-6 divide-y divide-border/40 rounded-lg border border-border/40 bg-card">
        {q.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading reports...</div>}
        {!q.isLoading && (q.data ?? []).length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No reports.</div>
        )}
        {(q.data ?? []).map((report) => (
          <div key={report.id} className="flex flex-col gap-4 p-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{report.target_type}</Badge>
                <Badge variant="outline">{report.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <InfoBlock
                  label="Reported by"
                  value={report.reporter?.username || `User ${report.user_id.slice(0, 8)}`}
                  subValue={report.user_id}
                />
                <InfoBlock
                  label="Series"
                  value={report.series?.title || "Unknown series"}
                  href={report.series?.slug ? `/title/${report.series.slug}` : undefined}
                />
                <InfoBlock
                  label="Chapter"
                  value={
                    report.chapter
                      ? `Chapter ${report.chapter.chapter_number}${
                          report.chapter.title ? `: ${report.chapter.title}` : ""
                        }`
                      : report.target_type === "series"
                        ? "Series report"
                        : "Unknown chapter"
                  }
                  href={
                    report.chapter?.slug && report.series?.slug
                      ? `/title/${report.series.slug}/${report.chapter.slug}`
                      : undefined
                  }
                />
              </div>

              <div>
                <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Reason
                </div>
                <div className="rounded-md border border-border/40 bg-background/60 p-3 text-sm">
                  {report.reason}
                </div>
                <div className="mt-2 break-all text-xs text-muted-foreground">
                  Target ID: {report.target_id}
                </div>
              </div>
            </div>

            {report.status === "open" && (
              <div className="flex gap-2 xl:shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus.mutate({ id: report.id, status: "resolved" })}
                >
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStatus.mutate({ id: report.id, status: "dismissed" })}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  subValue,
  href,
}: {
  label: string;
  value: string;
  subValue?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
      {subValue && <div className="truncate text-xs text-muted-foreground">{subValue}</div>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="min-w-0 rounded-md border border-border/40 p-3 hover:border-primary/60"
      >
        {content}
      </a>
    );
  }

  return <div className="min-w-0 rounded-md border border-border/40 p-3">{content}</div>;
}
