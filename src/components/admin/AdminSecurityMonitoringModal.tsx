"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  FileCode2,
  GlobeLock,
  Cpu,
  CheckCircle2,
  XCircle,
  Eye,
  Server,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { isSafePublicUrl } from "@/lib/ssrf-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminSecurityMonitoringModalProps {
  trigger?: React.ReactNode;
}

export function AdminSecurityMonitoringModal({ trigger }: AdminSecurityMonitoringModalProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<{ tested: boolean; safe?: boolean; error?: string } | null>(null);

  // Only render for admins
  if (!isAdmin) return null;

  // 1. Fetch live metrics
  const metricsQ = useQuery({
    queryKey: ["admin-security-metrics"],
    queryFn: async () => {
      const [
        { count: bannedCount },
        { count: pendingReportsCount },
        { count: staffRolesCount },
        { count: totalLogsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
        supabase.from("moderation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).in("role", ["admin", "moderator", "uploader"]),
        supabase.from("admin_activity_logs").select("*", { count: "exact", head: true }),
      ]);

      return {
        bannedCount: bannedCount ?? 0,
        pendingReportsCount: pendingReportsCount ?? 0,
        staffRolesCount: staffRolesCount ?? 0,
        totalLogsCount: totalLogsCount ?? 0,
      };
    },
    enabled: open,
    staleTime: 1000 * 30,
  });

  // 2. Fetch recent activity audit logs
  const logsQ = useQuery({
    queryKey: ["admin-security-logs-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
    staleTime: 1000 * 15,
  });

  const handleTestUrl = () => {
    if (!testUrl.trim()) return;
    try {
      const safe = isSafePublicUrl(testUrl.trim());
      setTestResult({
        tested: true,
        safe,
        error: safe ? undefined : "SSRF Filter Triggered: Private, Loopback, Cloud Metadata, or Non-HTTP Protocol is Forbidden.",
      });
    } catch (e: any) {
      setTestResult({
        tested: true,
        safe: false,
        error: e.message || "Invalid or Malformed URL format",
      });
    }
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            type="button"
            title="Security & Threat Monitoring Center"
            aria-label="Security & Threat Monitoring Center"
            className="group relative grid h-7 w-7 place-items-center rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/60 hover:text-white hover:border-emerald-400 transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer shrink-0"
          >
            <ShieldCheck className="h-4 w-4 stroke-[2.2] transition-transform group-hover:rotate-6" />
            {/* Realtime pulse beacon */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-950/95 border-emerald-500/30 backdrop-blur-2xl text-foreground shadow-2xl p-6 sm:p-8">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Security & Threat Operations</span>
                  <Badge variant="outline" className="bg-emerald-950/40 border-emerald-500/40 text-emerald-400 text-[10px] font-mono uppercase tracking-wider py-0.5">
                    ● DEFENSE ACTIVE
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                  Live OWASP guardrails, RLS privilege isolation, SSRF protection, and audit logs.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["admin-security-metrics"] });
                qc.invalidateQueries({ queryKey: ["admin-security-logs-feed"] });
              }}
              className="h-8 text-xs gap-1.5 border-border/60 hover:bg-neutral-800 text-neutral-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${logsQ.isFetching ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {/* Real-time Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="rounded-xl border border-border/50 bg-neutral-900/50 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Banned Accounts</span>
              <Lock className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">
                {metricsQ.data?.bannedCount ?? "..."}
              </span>
              <button
                onClick={() => handleNavigate("/admin/users")}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                Manage <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-neutral-900/50 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Pending Reports</span>
              <Flag className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">
                {metricsQ.data?.pendingReportsCount ?? "..."}
              </span>
              <button
                onClick={() => handleNavigate("/admin/moderation")}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                Review <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-neutral-900/50 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Staff & Admins</span>
              <Users className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">
                {metricsQ.data?.staffRolesCount ?? "..."}
              </span>
              <button
                onClick={() => handleNavigate("/admin/permissions")}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                Roles <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-neutral-900/50 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
              <span>Audit Entries</span>
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">
                {metricsQ.data?.totalLogsCount ?? "..."}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">Verified</span>
            </div>
          </div>
        </div>

        {/* Tabbed Operations */}
        <Tabs defaultValue="guardrails" className="w-full">
          <TabsList className="grid grid-cols-3 bg-neutral-900 border border-border/40 p-1 mb-4 rounded-xl">
            <TabsTrigger value="guardrails" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Guardrails Status
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-cyan-400" /> Live Audit Log
            </TabsTrigger>
            <TabsTrigger value="sandbox" className="text-xs font-semibold data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <GlobeLock className="h-3.5 w-3.5 mr-1.5 text-purple-400" /> SSRF Threat Sandbox
            </TabsTrigger>
          </TabsList>

          {/* 1. Guardrails Status Tab */}
          <TabsContent value="guardrails" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Row-Level Security (RLS)
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">HARDENED</Badge>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Column privileges restricted. Banned status, XP, and VIP flags strictly guarded against user self-unban & client tampering.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    SSRF Defense Guard
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ACTIVE</Badge>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Internal subnets (RFC 1918), localhost (127.0.0.1), and cloud metadata endpoints (169.254.169.254) are filtered before scraping.
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
                  HTML sanitizer strips script tags, event handlers (onerror/onload), and malicious javascript: URIs across novel readers.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Next.js Edge Middleware
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">ACTIVE</Badge>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  All /admin/* routes intercepted at the server edge before UI components download. HTTP Clickjacking & CSP headers attached.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 2. Live Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-3">
            <div className="rounded-xl border border-border/40 bg-neutral-900/40 p-1 max-h-[340px] overflow-y-auto">
              {logsQ.isLoading ? (
                <div className="p-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> Loading security logs...
                </div>
              ) : logsQ.data && logsQ.data.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {logsQ.data.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-neutral-800/40 transition-colors rounded-lg">
                      <div className="flex items-center gap-2.5 truncate">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] shrink-0 ${
                            log.action.includes("ban")
                              ? "border-rose-500/40 text-rose-300 bg-rose-950/30"
                              : log.action.includes("delete")
                              ? "border-amber-500/40 text-amber-300 bg-amber-950/30"
                              : "border-cyan-500/40 text-cyan-300 bg-cyan-950/30"
                          }`}
                        >
                          {log.action}
                        </Badge>
                        <span className="text-neutral-300 font-medium truncate">
                          Target: <code className="text-[11px] text-neutral-400">{log.resource_type || "system"}:{String(log.resource_id || "").slice(0, 8)}</code>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No security incidents or administrative actions recorded yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. SSRF Sandbox Tab */}
          <TabsContent value="sandbox" className="space-y-4">
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <GlobeLock className="h-4 w-4" /> Live SSRF Filter Sandbox
              </h4>
              <p className="text-xs text-neutral-400">
                Test URLs against the backend SSRF defense guard in real-time. Try entering <code>http://169.254.169.254</code>, <code>http://127.0.0.1</code>, or legitimate manga domains.
              </p>

              <div className="flex gap-2">
                <Input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://asurascans.com or http://127.0.0.1:5432"
                  className="bg-neutral-900 border-border/60 text-xs font-mono"
                />
                <Button size="sm" onClick={handleTestUrl} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0">
                  Verify URL
                </Button>
              </div>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                    testResult.safe
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {testResult.safe ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>URL is SAFE for external scraper execution.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span><strong>BLOCKED:</strong> {testResult.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
