import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  EyeOff,
  Flag,
  Image as ImageIcon,
  Library,
  MessageSquare,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin - vnrscans" }] }),
  component: AdminHome,
});

function useCount(table: string, scope = "all", filter?: (q: any) => any) {
  return useQuery({
    queryKey: ["count", table, scope],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function AdminHome() {
  const series = useCount("series");
  const chapters = useCount("chapters");
  const profiles = useCount("profiles");
  const comments = useCount("comments");
  const reports = useCount("reports", "open", (q) => q.eq("status", "open"));
  const hiddenComments = useCount("comments", "hidden", (q) => q.eq("is_hidden", true));
  const mediaComments = useCount("comments", "media", (q) => q.not("attachment_url", "is", null));
  const spoilerComments = useCount("comments", "spoilers", (q) => q.eq("is_spoiler", true));

  const cards = [
    { label: "Series", value: series.data, icon: Library },
    { label: "Chapters", value: chapters.data, icon: BookOpen },
    { label: "Users", value: profiles.data, icon: Users },
    { label: "Comments", value: comments.data, icon: MessageSquare },
    { label: "Open Reports", value: reports.data, icon: Flag },
  ];

  const managementQueues = [
    {
      label: "Open Reports",
      description: "Reader reports waiting for review.",
      value: reports.data,
      icon: Flag,
      to: "/admin/reports",
      tone: "text-destructive",
    },
    {
      label: "Hidden Comments",
      description: "Comments currently removed from public view.",
      value: hiddenComments.data,
      icon: EyeOff,
      to: "/admin/comments",
      tone: "text-amber-500",
    },
    {
      label: "Media Comments",
      description: "Image and GIF comments to spot-check.",
      value: mediaComments.data,
      icon: ImageIcon,
      to: "/admin/comments",
      tone: "text-primary",
    },
    {
      label: "Spoiler Comments",
      description: "Spoiler-marked discussion across chapters.",
      value: spoilerComments.data,
      icon: AlertTriangle,
      to: "/admin/comments",
      tone: "text-amber-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Overview of your platform.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{card.value ?? "-"}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Management Queue</h2>
            <p className="text-sm text-muted-foreground">
              Quick links for the work that usually needs admin attention first.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/comments">Review comments</Link>
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {managementQueues.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-lg border border-border/40 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.tone}`} />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-1 text-sm font-bold">
                  {item.value ?? "-"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
