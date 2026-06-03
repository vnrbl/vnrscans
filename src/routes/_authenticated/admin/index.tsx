import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, BookOpen, Users, MessageSquare, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — VNRScans" }] }),
  component: AdminHome,
});

function useCount(table: string, filter?: (q: any) => any) {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

function AdminHome() {
  const series = useCount("series");
  const chapters = useCount("chapters");
  const profiles = useCount("profiles");
  const comments = useCount("comments");
  const reports = useCount("reports", (q) => q.eq("status", "open"));

  const cards = [
    { label: "Series", value: series.data, icon: Library },
    { label: "Chapters", value: chapters.data, icon: BookOpen },
    { label: "Users", value: profiles.data, icon: Users },
    { label: "Comments", value: comments.data, icon: MessageSquare },
    { label: "Open reports", value: reports.data, icon: Flag },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Overview of your platform.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold">{c.value ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}