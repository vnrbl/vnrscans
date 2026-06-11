import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Admin · Security Logs" }] }),
  component: AdminLogs,
});

type LogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  user_agent: string | null;
  created_at: string;
};

const ACTION_CONFIG: Record<string, { color: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  create: { color: "default", icon: CheckCircle2 },
  update: { color: "secondary", icon: Activity },
  delete: { color: "destructive", icon: XCircle },
  activate: { color: "default", icon: CheckCircle2 },
  deactivate: { color: "outline", icon: XCircle },
  approve: { color: "default", icon: CheckCircle2 },
  reject: { color: "destructive", icon: XCircle },
  assign_role: { color: "default", icon: User },
  revoke_role: { color: "destructive", icon: AlertTriangle },
  moderation_approved: { color: "default", icon: CheckCircle2 },
  moderation_rejected: { color: "destructive", icon: XCircle },
};

function getActionConfig(action: string) {
  const key = action?.split("_")[0] ?? "";
  return ACTION_CONFIG[action] || ACTION_CONFIG[key] || { color: "outline" as const, icon: Activity };
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString();
}

const ITEMS_PER_PAGE = 50;

function AdminLogs() {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  // Compute date range filter
  const dateFrom = useMemo(() => {
    if (dateRange === "all") return null;
    const now = new Date();
    switch (dateRange) {
      case "1h": return new Date(now.getTime() - 3600 * 1000);
      case "24h": return new Date(now.getTime() - 24 * 3600 * 1000);
      case "7d": return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      default: return null;
    }
  }, [dateRange]);

  const logs = useQuery({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  // Resolve actor usernames
  const actorIds = useMemo(() => {
    return Array.from(new Set((logs.data ?? []).map(r => r.actor_id).filter(Boolean))) as string[];
  }, [logs.data]);

  const actorProfiles = useQuery({
    queryKey: ["admin", "log-actors", actorIds.join(",")],
    queryFn: async () => {
      if (actorIds.length === 0) return new Map<string, string>();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,username")
        .in("user_id", actorIds);
      if (error) return new Map<string, string>();
      return new Map((data ?? []).map(p => [p.user_id, p.username || "Unknown"]));
    },
    enabled: actorIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Filter and paginate
  const filtered = useMemo(() => {
    let result = logs.data ?? [];
    
    if (resourceFilter !== "all") {
      result = result.filter(r => r.resource_type === resourceFilter);
    }

    if (actionFilter !== "all") {
      result = result.filter(r => r.action?.startsWith(actionFilter));
    }

    if (dateFrom) {
      const fromTime = dateFrom.getTime();
      result = result.filter(r => new Date(r.created_at).getTime() >= fromTime);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) => {
        const username = actorProfiles.data?.get(row.actor_id ?? "") ?? "";
        return (
          row.action?.toLowerCase().includes(q) ||
          row.resource_type?.toLowerCase().includes(q) ||
          row.resource_id?.toLowerCase().includes(q) ||
          row.actor_id?.toLowerCase().includes(q) ||
          username.toLowerCase().includes(q) ||
          JSON.stringify(row.details ?? {}).toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs.data, search, resourceFilter, actionFilter, dateFrom, actorProfiles.data]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedLogs = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const all = logs.data ?? [];
    const last24h = all.filter(r => new Date(r.created_at).getTime() > Date.now() - 24 * 3600 * 1000);
    const uniqueActors = new Set(all.map(r => r.actor_id).filter(Boolean)).size;
    const destructive = all.filter(r => r.action?.includes("delete") || r.action?.includes("revoke") || r.action?.includes("reject")).length;
    return {
      total: all.length,
      last24h: last24h.length,
      uniqueActors,
      destructive,
    };
  }, [logs.data]);

  // Unique resource types from data
  const resourceTypes = useMemo(() => {
    return Array.from(new Set((logs.data ?? []).map(r => r.resource_type).filter(Boolean)));
  }, [logs.data]);

  // Unique action prefixes
  const actionTypes = useMemo(() => {
    return Array.from(new Set((logs.data ?? []).map(r => r.action?.split("_")[0]).filter(Boolean)));
  }, [logs.data]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    const headers = ["Timestamp", "Actor", "Action", "Resource Type", "Resource ID", "Details"];
    const rows = filtered.map(row => [
      new Date(row.created_at).toISOString(),
      actorProfiles.data?.get(row.actor_id ?? "") || row.actor_id || "System",
      row.action,
      row.resource_type,
      row.resource_id || "",
      JSON.stringify(row.details ?? {}),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security & Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track admin actions for accountability and auditing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => logs.refetch()}
            disabled={logs.isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${logs.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.last24h}</p>
              <p className="text-xs text-muted-foreground">Last 24 Hours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10 text-green-500">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueActors}</p>
              <p className="text-xs text-muted-foreground">Unique Actors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.destructive}</p>
              <p className="text-xs text-muted-foreground">Destructive Actions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/40">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Resource type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resources</SelectItem>
              {resourceTypes.map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionTypes.map(t => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(0); }}>
            <SelectTrigger className="w-full">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {paginatedLogs.length} of {filtered.length} events
          {filtered.length !== (logs.data?.length ?? 0) && ` (filtered from ${logs.data?.length ?? 0})`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {logs.isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="p-4 border-border/40 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-16 bg-secondary/60 rounded" />
                  <div className="h-5 w-20 bg-secondary/40 rounded" />
                  <div className="flex-1" />
                  <div className="h-4 w-24 bg-secondary/30 rounded" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!logs.isLoading && filtered.length === 0 && (
          <Card className="border-border/40 p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No activity logged yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin actions like creating banners, managing users, and moderating content will appear here.
            </p>
          </Card>
        )}

        {paginatedLogs.map((row) => {
          const expanded = expandedIds.has(row.id);
          const config = getActionConfig(row.action);
          const ActIcon = config.icon;
          const actorName = actorProfiles.data?.get(row.actor_id ?? "") || null;
          const hasDetails = row.details && Object.keys(row.details).length > 0;

          return (
            <Card
              key={row.id}
              className="border-border/40 overflow-hidden transition-all duration-200 hover:border-border/60"
            >
              <button
                className="w-full p-3 sm:p-4 text-left"
                onClick={() => toggleExpand(row.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ActIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Badge variant={config.color} className="text-xs">
                    {row.action?.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {row.resource_type?.replace(/_/g, " ")}
                  </Badge>
                  {row.resource_id && (
                    <span className="font-mono text-xs text-muted-foreground bg-secondary/40 px-1.5 py-0.5 rounded">
                      {row.resource_id.slice(0, 8)}…
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span className="hidden sm:inline">
                      {actorName ? (
                        <span className="font-medium text-foreground">{actorName}</span>
                      ) : row.actor_id ? (
                        <span className="font-mono">{row.actor_id.slice(0, 8)}…</span>
                      ) : (
                        "System"
                      )}
                      <span className="mx-1.5 text-border">·</span>
                    </span>
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(row.created_at)}
                    {(hasDetails || row.user_agent) && (
                      expanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    )}
                  </span>
                </div>

                {/* Mobile: show actor below */}
                <div className="sm:hidden mt-2 text-xs text-muted-foreground">
                  {actorName ? (
                    <span>by <span className="font-medium text-foreground">{actorName}</span></span>
                  ) : row.actor_id ? (
                    <span>by <span className="font-mono">{row.actor_id.slice(0, 8)}…</span></span>
                  ) : (
                    <span>by System</span>
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="border-t border-border/30 bg-secondary/10 px-4 py-3 space-y-2">
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <span className="font-medium text-muted-foreground">Full Timestamp:</span>{" "}
                      <span className="text-foreground">{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Actor ID:</span>{" "}
                      <span className="font-mono text-foreground">{row.actor_id || "N/A"}</span>
                    </div>
                    {actorName && (
                      <div>
                        <span className="font-medium text-muted-foreground">Actor Username:</span>{" "}
                        <span className="text-foreground">{actorName}</span>
                      </div>
                    )}
                    {row.resource_id && (
                      <div>
                        <span className="font-medium text-muted-foreground">Resource ID:</span>{" "}
                        <span className="font-mono text-foreground">{row.resource_id}</span>
                      </div>
                    )}
                  </div>
                  {hasDetails && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Details:</span>
                      <pre className="mt-1 rounded-md bg-background border border-border/30 p-3 text-xs font-mono overflow-x-auto text-foreground">
                        {JSON.stringify(row.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  {row.user_agent && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">User Agent:</span>
                      <p className="mt-1 text-xs text-muted-foreground break-all">{row.user_agent}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
