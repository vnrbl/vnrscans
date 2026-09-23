import { createClient } from "@supabase/supabase-js";
import { after, NextResponse } from "next/server";
import { $repairReportedChapter, $syncDueScheduledSeries } from "@/lib/api/scraper.actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ActionBody = {
  action?: string;
  query?: string;
  seriesId?: string;
  hidden?: boolean;
  reportNoChanges?: boolean;
};

function authorized(request: Request) {
  const expected = process.env.TELEGRAM_ACTION_SECRET;
  const supplied = request.headers.get("x-telegram-action-secret");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) mismatch |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  return mismatch === 0;
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server-side Supabase admin credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function notifyWorker(payload: Record<string, unknown>) {
  const workerUrl = process.env.WORKER_URL || process.env.NEXT_PUBLIC_WORKER_URL;
  const secret = process.env.TELEGRAM_ACTION_SECRET;
  if (!workerUrl || !secret) throw new Error("Telegram Worker callback is not configured");
  const response = await fetch(`${workerUrl.replace(/\/$/, "")}/telegram/action-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Site-Action-Secret": secret },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Worker callback failed with HTTP ${response.status}`);
}

async function runImportsAndNotify(reportNoChanges: boolean) {
  try {
    const internalSecret = process.env.TELEGRAM_ACTION_SECRET;
    if (!internalSecret) throw new Error("Telegram action secret is not configured");
    const result = await $syncDueScheduledSeries({
      data: { accessToken: internalSecret, forceAll: false, maxChaptersPerSeries: 25, maxSourcesPerRun: 5 },
    });
    await notifyWorker({
      type: "source_scan",
      success: result.success !== false,
      totalDue: result.totalDue ?? 0,
      totalEligible: result.totalEligible ?? 0,
      totalPending: result.totalPending ?? 0,
      totalProcessed: result.totalProcessed ?? 0,
      totalImported: result.totalImported ?? 0,
      results: result.results ?? [],
      error: result.error,
      reportNoChanges,
    });
  } catch (error) {
    console.error("[TelegramActions] Source scan failed:", error);
    try {
      await notifyWorker({
        type: "source_scan",
        success: false,
        totalDue: 0,
        totalProcessed: 0,
        totalImported: 0,
        results: [],
        error: error instanceof Error ? error.message : "Source scan failed",
        reportNoChanges,
      });
    } catch (notifyError) {
      console.error("[TelegramActions] Failed to report source scan error:", notifyError);
    }
  }
}

type ReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  created_at: string;
};

function isBrokenChapterReport(reason: string) {
  return /\b(broken|not loading|doesn't load|does not load|won't load|blank pages?|missing pages?|images? (?:are )?(?:broken|missing|blank|not loading)|page(?:s)? unavailable|404|corrupt|unreadable)\b/i.test(reason);
}

function reportNumber(id: string) {
  return `RPT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function processOpenReportsAndNotify() {
  const admin = getAdminClient();
  try {
    const { data: reports, error } = await admin
      .from("reports")
      .select("id,target_type,target_id,reason,created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(5);
    if (error) throw error;

    const outcomes: Array<{ id: string; nextStatus: "resolved" | "reviewing" }> = [];
    const alerts: Array<{ eventKey: string; message: string }> = [];
    for (const report of (reports || []) as ReportRow[]) {
      const reportNo = reportNumber(report.id);
      let title = "Unknown item";
      let link = "";
      let target = report.target_type;
      let repairResult: Awaited<ReturnType<typeof $repairReportedChapter>> | null = null;

      if (report.target_type === "chapter") {
        const { data: chapter, error: chapterError } = await admin
          .from("chapters")
          .select("id,chapter_number,series_id,slug,series:series(title,slug)")
          .eq("id", report.target_id)
          .maybeSingle();
        if (chapterError) throw chapterError;
        const series = Array.isArray(chapter?.series) ? chapter.series[0] : chapter?.series;
        title = series?.title || "Unknown series";
        target = `chapter ${chapter?.chapter_number ?? "(removed)"}`;
        if (series?.slug && chapter?.slug) link = `${process.env.SITE_URL || "https://www.vnrscans.com"}/title/${series.slug}/${chapter.slug}`;

        if (chapter && isBrokenChapterReport(report.reason)) {
          repairResult = await $repairReportedChapter({
            data: { chapterId: chapter.id, internalSecret: process.env.TELEGRAM_ACTION_SECRET || "" },
          });
        }
      } else if (report.target_type === "series") {
        const { data: series, error: seriesError } = await admin
          .from("series")
          .select("title,slug")
          .eq("id", report.target_id)
          .maybeSingle();
        if (seriesError) throw seriesError;
        title = series?.title || "Unknown series";
        if (series?.slug) link = `${process.env.SITE_URL || "https://www.vnrscans.com"}/title/${series.slug}`;
      }

      const resolved = repairResult?.success === true;
      outcomes.push({ id: report.id, nextStatus: resolved ? "resolved" : "reviewing" });
      const statusText = resolved
        ? `✅ Auto-resolved: ${repairResult?.message || "chapter pages refreshed"}.`
        : repairResult
          ? `⚠️ I couldn't repair it automatically: ${repairResult.error || "source recovery failed"}. Please review it.`
          : "⚠️ This report needs your review.";
      alerts.push({
        eventKey: `report:${report.id}`,
        message: `${statusText}\nReport No. ${reportNo}\n${title} — ${target}\nReason: ${report.reason.slice(0, 500)}${link ? `\n${link}` : ""}`,
      });
    }

    await notifyWorker({ type: "site_alerts", complete: true, alerts });

    for (const outcome of outcomes) {
      const { error: updateError } = await admin
        .from("reports")
        .update({ status: outcome.nextStatus })
        .eq("id", outcome.id)
        .eq("status", "open");
      if (updateError) console.error("[TelegramActions] Could not update processed report status:", updateError);
    }
  } catch (error) {
    console.error("[TelegramActions] Report processing failed:", error);
    try {
      await notifyWorker({
        type: "site_alerts",
        complete: true,
        alerts: [{
          eventKey: `reports-error:${new Date().toISOString().slice(0, 13)}`,
          message: `⚠️ Site report monitor failed: ${error instanceof Error ? error.message.slice(0, 400) : "unknown error"}`,
        }],
      });
    } catch (notifyError) {
      console.error("[TelegramActions] Could not report the site monitor error:", notifyError);
    }
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ActionBody;
  try {
    body = await request.json() as ActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "run_due_imports") {
    after(() => runImportsAndNotify(body.reportNoChanges === true));
    return NextResponse.json({ accepted: true, message: "Source scan started" }, { status: 202 });
  }

  if (body.action === "process_site_reports") {
    after(() => processOpenReportsAndNotify());
    return NextResponse.json({ accepted: true, message: "Site report scan started" }, { status: 202 });
  }

  if (body.action === "find_series") {
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 100) : "";
    if (query.length < 2) return NextResponse.json({ error: "Provide a series title to search" }, { status: 400 });
    try {
      const escaped = query.replace(/[,*()%]/g, " ").replace(/\s+/g, " ").trim();
      const { data, error } = await getAdminClient()
        .from("series")
        .select("id,title,slug,is_hidden")
        .or(`title.ilike.%${escaped}%,alternative_titles.ilike.%${escaped}%`)
        .limit(6);
      if (error) throw error;
      return NextResponse.json({ series: data ?? [] });
    } catch (error) {
      console.error("[TelegramActions] Catalog lookup failed:", error);
      return NextResponse.json({ error: "Catalog lookup failed" }, { status: 500 });
    }
  }

  if (body.action === "set_series_visibility") {
    if (typeof body.seriesId !== "string" || typeof body.hidden !== "boolean") {
      return NextResponse.json({ error: "A series ID and visibility are required" }, { status: 400 });
    }
    try {
      const { data, error } = await getAdminClient()
        .from("series")
        .update({ is_hidden: body.hidden })
        .eq("id", body.seriesId)
        .select("id,title,slug,is_hidden")
        .single();
      if (error) throw error;
      return NextResponse.json({ series: data });
    } catch (error) {
      console.error("[TelegramActions] Catalog visibility update failed:", error);
      return NextResponse.json({ error: "Catalog update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown Telegram action" }, { status: 400 });
}
