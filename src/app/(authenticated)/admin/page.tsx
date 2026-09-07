"use client";

import { Link, useNavigate } from "@/lib/router-compat";
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

export default function AdminHome() {
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

      <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl liquid-glass-card p-3.5 sm:p-5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-neutral-400 font-medium truncate">{card.label}</span>
              <card.icon className="h-4 w-4 text-purple-400 shrink-0 ml-1 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight text-white font-mono">{card.value ?? "-"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">Management Queue</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quick links for the work that usually needs admin attention first.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs rounded-full border-white/15 hover:border-purple-400/40 liquid-glass">
            <Link to="/admin/comments">Review comments</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {managementQueues.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-2xl liquid-glass-card p-3.5 sm:p-4 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.tone} shrink-0`} />
                    <span className="font-semibold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors">{item.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
                <span className="rounded-lg liquid-glass-pill px-2.5 py-1 text-xs sm:text-sm font-bold font-mono text-purple-300 shrink-0">
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
