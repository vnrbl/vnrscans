"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Lock,
  RefreshCw,
  ExternalLink,
  Users,
  Flag,
  GlobeLock,
  CheckCircle2,
  XCircle,
  Eye,
  Server,
  Zap,
  Terminal,
  Download,
  Search,
  Key,
  Shield,
  Radio,
  FileCode,
  FileSpreadsheet,
  AlertOctagon,
  Cpu,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { assertSafePublicUrl, isSafePublicUrl } from "@/lib/ssrf-guard";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();

  // Filter & Search states for Audit Logs
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState<string>("");

  // SSRF Sandbox state
  const [testUrl, setTestUrl] = useState<string>("");
  const [ssrfResult, setSsrfResult] = useState<{
    tested: boolean;
    safe?: boolean;
    hostname?: string;
    protocol?: string;
    error?: string;
    details?: string;
  } | null>(null);

  // XSS Sandbox state
  const [xssInput, setXssInput] = useState<string>(
    `<div class="chapter-content">
  <p>Legitimate Novel Text</p>
  <img src="x" onerror="alert('XSS Extracted: ' + document.cookie)" />
  <script>fetch('/api/steal?token=' + localStorage.getItem('token'))</script>
  <a href="javascript:void(document.location='https://evil.com')">Click for Free Coins</a>
</div>`
  );

  // 1. Fetch Real-time Telemetry Metrics
  const metricsQ = useQuery({
    queryKey: ["cyber-security-metrics"],
    queryFn: async () => {
      const [
        { count: bannedCount },
        { count: pendingReportsCount },
        { count: staffRolesCount },
        { count: totalLogsCount },
        { count: totalUsersCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
        supabase.from("moderation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).in("role", ["admin", "moderator", "uploader"]),
        supabase.from("admin_activity_logs").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      return {
        bannedCount: bannedCount ?? 0,
        pendingReportsCount: pendingReportsCount ?? 0,
        staffRolesCount: staffRolesCount ?? 0,
        totalLogsCount: totalLogsCount ?? 0,
        totalUsersCount: totalUsersCount ?? 0,
      };
    },
    staleTime: 1000 * 30,
  });

  // 2. Fetch Live Audit Logs Feed
  const logsQ = useQuery({
    queryKey: ["cyber-security-logs-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 15,
  });

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const raw = logsQ.data ?? [];
    return raw.filter((log) => {
      const matchesSearch =
        !logSearch.trim() ||
        log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        String(log.resource_id || "").toLowerCase().includes(logSearch.toLowerCase()) ||
        String(log.resource_type || "").toLowerCase().includes(logSearch.toLowerCase()) ||
        String(log.actor_id || "").toLowerCase().includes(logSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (logFilter === "all") return true;
      if (logFilter === "ban") return log.action.includes("ban");
      if (logFilter === "delete") return log.action.includes("delete") || log.action.includes("remove");
      if (logFilter === "role") return log.action.includes("role") || log.action.includes("permission");
      return true;
    });
  }, [logsQ.data, logFilter, logSearch]);

  // SSRF Evaluation Handler
  const handleTestSsrf = (urlToTest?: string) => {
    const target = urlToTest || testUrl;
    if (!target.trim()) return;

    try {
      const parsed = assertSafePublicUrl(target.trim());
      setSsrfResult({
        tested: true,
        safe: true,
        hostname: parsed.hostname,
        protocol: parsed.protocol,
        details: "URL is public, uses HTTP/HTTPS, and does not resolve to RFC 1918, Loopback, or Cloud Metadata.",
      });
    } catch (e: any) {
      setSsrfResult({
        tested: true,
        safe: false,
        error: e.message || "Threat Detected: Blocked by SSRF Guard",
        details: "Request intercepted before any outbound socket/fetch connection was established.",
      });
    }
  };

  // Export logs to CSV
  const handleExportCsv = () => {
    const data = logsQ.data ?? [];
    if (data.length === 0) {
      toast.error("No log entries available to export");
      return;
    }

    const headers = ["Timestamp", "Action", "Actor ID", "Resource Type", "Resource ID", "IP Address"];
    const rows = data.map((l) => [
      new Date(l.created_at).toISOString(),
      `"${l.action}"`,
      `"${l.actor_id || ""}"`,
      `"${l.resource_type || ""}"`,
      `"${l.resource_id || ""}"`,
      `"${l.ip_address || "N/A"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Security audit logs exported to CSV");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Defense HUD ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-inner">
              <ShieldAlert className="h-7 w-7 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
                  Cyber Threat & Security Operations Center
                </h1>
                <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-mono text-[11px] uppercase tracking-wider py-0.5">
                  ● DEFCON 5 / OPTIMAL
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Continuous real-time posture analysis, RLS isolation, SSRF sentinel, and cryptographic audit monitoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["cyber-security-metrics"] });
                qc.invalidateQueries({ queryKey: ["cyber-security-logs-feed"] });
                toast.success("Security telemetry refreshed");
              }}
              className="h-9 gap-2 border-emerald-500/30 bg-neutral-900/60 text-emerald-300 hover:bg-emerald-950/40 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${logsQ.isFetching ? "animate-spin text-emerald-400" : ""}`} />
              Refresh Telemetry
            </Button>
            <Button
              size="sm"
              onClick={handleExportCsv}
              className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Download className="h-4 w-4" /> Export Logs
            </Button>
          </div>
        </div>

        {/* Real-time Telemetry Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <Card className="border-border/50 bg-neutral-900/40 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                <span>Quarantined / Bans</span>
                <Lock className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {metricsQ.data?.bannedCount ?? "..."}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Enforced via Service Role</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-neutral-900/40 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                <span>Pending Flagged</span>
                <Flag className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {metricsQ.data?.pendingReportsCount ?? "..."}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Moderation Queue</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-neutral-900/40 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                <span>Elevated Accounts</span>
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {metricsQ.data?.staffRolesCount ?? "..."}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Admin, Mod, Uploader</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-neutral-900/40 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                <span>Audit Logs Stored</span>
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {metricsQ.data?.totalLogsCount ?? "..."}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Immutable Trail</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-neutral-900/40 backdrop-blur-md col-span-2 md:col-span-1">
            <CardContent className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                <span>Registered Users</span>
                <ShieldCheck className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {metricsQ.data?.totalUsersCount ?? "..."}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Protected by RLS</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Active Defensive Matrix Status (6 Core Shield Systems) ─────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" /> Core Defensive Guardrails & Protections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Row-Level Security (RLS)
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">HARDENED</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Column grants revoked for <code>is_banned</code>, <code>ban_reason</code>, and <code>banned_at</code>. Database trigger strictly prevents user self-unban & client tampering.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                SSRF Defense Sentinel
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ACTIVE</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Outbound scraper requests inspect resolved targets to block private subnets (RFC 1918), loopback (127.0.0.1), and cloud instance metadata (169.254.169.254).
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Stored XSS Sanitizer
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ENFORCED</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Novel and rich text rendering passes through strict AST sanitizer stripping inline event handlers (<code>onerror</code>, <code>onload</code>) and executable script tags.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Next.js Edge Firewall
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">PROTECTED</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Edge middleware intercepts all <code>/admin/*</code> routes before any React code or sensitive UI components download on unauthorized devices.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                API & Webhook Secret Auth
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ENFORCED</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Inbound webhooks (e.g. <code>/api/webhooks/new-user</code>) strictly verify incoming webhook signatures, returning 401 Unauthorized upon signature mismatch.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Sliding-Window Rate Limiter
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ARMED</Badge>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Public forms (e.g. <code>/api/contact</code>) throttle brute-force and spam submissions via per-IP sliding window rate limiting.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Tabbed Operations Suite ────────────────────────────────────── */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid grid-cols-4 bg-neutral-900 border border-border/40 p-1 rounded-xl">
          <TabsTrigger value="logs" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
            <Activity className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Live Audit Feed
          </TabsTrigger>
          <TabsTrigger value="ssrf" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
            <GlobeLock className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> SSRF Threat Sandbox
          </TabsTrigger>
          <TabsTrigger value="xss" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
            <Terminal className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> XSS Sanitizer Analyzer
          </TabsTrigger>
          <TabsTrigger value="session" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
            <Key className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Session Claims
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Live Audit Logs Feed ── */}
        <TabsContent value="logs" className="space-y-3 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-border/40">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search action, actor ID, or resource..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="h-8 bg-neutral-950 border-border/50 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {["all", "ban", "delete", "role"].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={logFilter === f ? "default" : "outline"}
                  onClick={() => setLogFilter(f)}
                  className={`h-8 text-xs capitalize ${logFilter === f ? "bg-primary font-bold text-white" : "border-border/50 text-neutral-400"}`}
                >
                  {f === "all" ? "All Logs" : f}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-neutral-950/60 overflow-hidden">
            {logsQ.isLoading ? (
              <div className="p-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> Loading security audit trail...
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="divide-y divide-border/20">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-900/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-[240px]">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] shrink-0 ${
                          log.action.includes("ban")
                            ? "border-rose-500/40 text-rose-300 bg-rose-950/30"
                            : log.action.includes("delete") || log.action.includes("remove")
                            ? "border-amber-500/40 text-amber-300 bg-amber-950/30"
                            : "border-cyan-500/40 text-cyan-300 bg-cyan-950/30"
                        }`}
                      >
                        {log.action}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="text-neutral-200 font-semibold">
                          Target: <code className="text-neutral-400">{log.resource_type || "system"}:{String(log.resource_id || "").slice(0, 12)}</code>
                        </span>
                        {log.details && (
                          <span className="text-[11px] text-neutral-500 font-mono truncate max-w-md">
                            {JSON.stringify(log.details)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-neutral-500 font-mono text-[11px]">
                      <span>Actor: {String(log.actor_id || "System").slice(0, 8)}...</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-neutral-500">
                No security incidents matching current filter.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: SSRF Sandbox ── */}
        <TabsContent value="ssrf" className="space-y-4 mt-4">
          <Card className="border-purple-500/30 bg-purple-950/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <GlobeLock className="h-4 w-4" /> Live SSRF & Network Threat Sandbox
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Test any URL, private IP range, loopback, or cloud metadata endpoint against the active SSRF Defense Guard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="e.g. http://169.254.169.254 or http://127.0.0.1:5432 or https://asurascans.com"
                  className="bg-neutral-900 border-border/60 text-xs font-mono"
                />
                <Button onClick={() => handleTestSsrf()} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0">
                  Inspect URL
                </Button>
              </div>

              {/* Preset Attack Simulation Buttons */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-neutral-400 font-semibold">Simulate Attack Payloads:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = "http://169.254.169.254/latest/meta-data/";
                    setTestUrl(u);
                    handleTestSsrf(u);
                  }}
                  className="h-7 text-[11px] border-rose-500/40 text-rose-300 bg-rose-950/20"
                >
                  AWS Metadata (169.254.169.254)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = "http://127.0.0.1:8000/internal-api";
                    setTestUrl(u);
                    handleTestSsrf(u);
                  }}
                  className="h-7 text-[11px] border-rose-500/40 text-rose-300 bg-rose-950/20"
                >
                  Localhost (127.0.0.1)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = "http://192.168.1.1/admin";
                    setTestUrl(u);
                    handleTestSsrf(u);
                  }}
                  className="h-7 text-[11px] border-rose-500/40 text-rose-300 bg-rose-950/20"
                >
                  RFC 1918 Private LAN
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = "https://images.unsplash.com/photo-example";
                    setTestUrl(u);
                    handleTestSsrf(u);
                  }}
                  className="h-7 text-[11px] border-emerald-500/40 text-emerald-300 bg-emerald-950/20"
                >
                  Legitimate Public CDN
                </Button>
              </div>

              {ssrfResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    ssrfResult.safe
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {ssrfResult.safe ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span>PASSED — TARGET IS PUBLIC & SAFE</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-rose-400" />
                        <span>BLOCKED — SSRF INTRUSION THWARTED</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300">{ssrfResult.error || ssrfResult.details}</p>
                  {ssrfResult.hostname && (
                    <p className="font-mono text-[11px] text-neutral-400">
                      Hostname: <code>{ssrfResult.hostname}</code> | Protocol: <code>{ssrfResult.protocol}</code>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: XSS Sandbox ── */}
        <TabsContent value="xss" className="space-y-4 mt-4">
          <Card className="border-amber-500/30 bg-amber-950/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Live Stored XSS Payload Sanitizer
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Inspect how malicious scripts, inline event handlers, and javascript: links are stripped before HTML rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">Untrusted Raw Input HTML:</label>
                  <Textarea
                    value={xssInput}
                    onChange={(e) => setXssInput(e.target.value)}
                    rows={8}
                    className="bg-neutral-900 border-border/60 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">Sanitized Clean Output:</label>
                  <div className="h-[175px] overflow-y-auto rounded-md bg-neutral-950 p-3 border border-emerald-500/30 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                    {sanitizeHtml(xssInput) || "(Empty or fully stripped)"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Session Claims ── */}
        <TabsContent value="session" className="space-y-4 mt-4">
          <Card className="border-emerald-500/30 bg-neutral-950">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Key className="h-4 w-4" /> Active Authenticated Session & Cryptographic Claims
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                JWT claims and role authorizations associated with the current connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-900 rounded-lg border border-border/40">
                  <span className="text-xs text-neutral-500 block">User Identifier (UID)</span>
                  <code className="text-xs text-white font-mono">{user?.id || "Anonymous"}</code>
                </div>
                <div className="p-3 bg-neutral-900 rounded-lg border border-border/40">
                  <span className="text-xs text-neutral-500 block">Email Identity</span>
                  <code className="text-xs text-white font-mono">{user?.email || "N/A"}</code>
                </div>
                <div className="p-3 bg-neutral-900 rounded-lg border border-border/40">
                  <span className="text-xs text-neutral-500 block">Privilege Tier</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                    {isAdmin ? "SUPER_ADMIN" : "STANDARD_USER"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
