import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Admin · Security Logs" }] }),
  component: AdminLogs,
});

function AdminLogs() {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");

  const logs = useQuery({
    queryKey: ["admin", "activity-logs", resourceFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (resourceFilter !== "all") {
        query = query.eq("resource_type", resourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (logs.data ?? []).filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.action?.toLowerCase().includes(q) ||
      row.resource_type?.toLowerCase().includes(q) ||
      row.resource_id?.toLowerCase().includes(q) ||
      row.actor_id?.toLowerCase().includes(q)
    );
  });

  const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    create: "default",
    update: "secondary",
    delete: "destructive",
    activate: "outline",
    deactivate: "outline",
    approve: "default",
    reject: "destructive",
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Track admin actions for accountability and auditing</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search action, resource, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            <SelectItem value="announcement">Announcements</SelectItem>
            <SelectItem value="banner">Banners</SelectItem>
            <SelectItem value="moderation">Moderation</SelectItem>
            <SelectItem value="user_role">User roles</SelectItem>
            <SelectItem value="permission">Permissions</SelectItem>
            <SelectItem value="achievement">Achievements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-2">
        {logs.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {filtered.length === 0 && !logs.isLoading && (
          <div className="rounded-lg border border-border/40 bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">No activity logged yet</p>
          </div>
        )}
        {filtered.map((row) => (
          <div key={row.id} className="rounded-lg border border-border/40 bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={actionColors[row.action?.split("_")[0] ?? ""] ?? "outline"}>{row.action}</Badge>
              <Badge variant="secondary">{row.resource_type}</Badge>
              {row.resource_id && (
                <span className="font-mono text-xs text-muted-foreground">{row.resource_id.slice(0, 8)}…</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {row.actor_id ? `User ${row.actor_id.slice(0, 8)}…` : "System"}
              {row.details && Object.keys(row.details as object).length > 0 && (
                <span className="ml-2 font-mono text-xs">
                  {JSON.stringify(row.details)}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
