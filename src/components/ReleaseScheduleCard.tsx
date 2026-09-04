"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Clock, Calendar, Bell, Sparkles, CheckCircle2, Globe, Zap, Lock, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReleaseScheduleProps {
  chapters: Array<{
    id: string;
    chapter_number: number;
    created_at: string;
    scheduled_at?: string | null;
    status?: string;
    source_url?: string | null;
    slug?: string;
  }>;
  status?: string | null;
  seriesTitle?: string;
  seriesSlug?: string;
  estimatedNextReleaseAt?: string | null;
  releaseCadence?: string | null;
}

export function ReleaseScheduleCard({
  chapters,
  status,
  seriesTitle,
  seriesSlug,
  estimatedNextReleaseAt,
  releaseCadence,
}: ReleaseScheduleProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Check tracking state
  useEffect(() => {
    if (typeof window !== "undefined" && seriesTitle) {
      try {
        const tracked = localStorage.getItem(`vnr-track-${seriesTitle}`);
        if (tracked === "true") setIsTracking(true);
      } catch {}
    }
  }, [seriesTitle]);

  const currentMaxChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return 0;
    return Math.max(...chapters.map((c) => c.chapter_number || 0));
  }, [chapters]);

  // Fetch live release schedule and chapter drops from Comick.dev & web scan sources
  const liveScheduleQ = useQuery({
    queryKey: ["live-release-schedule", seriesTitle, currentMaxChapter],
    queryFn: async () => {
      if (!seriesTitle) return null;
      const res = await fetch(
        `/api/series/release-schedule?title=${encodeURIComponent(seriesTitle)}&currentMaxChapter=${currentMaxChapter}`
      );
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      return json.data;
    },
    enabled: !!seriesTitle,
    staleTime: 1000 * 60 * 15,
  });

  const liveData = liveScheduleQ.data;

  // Determine schedule data for upcoming/next chapter
  const scheduleInfo = useMemo(() => {
    const now = new Date();

    // 1. If status is completed, no upcoming countdown needed
    if (status?.toLowerCase() === "completed" || liveData?.sourceStatus === "completed") {
      return {
        targetDate: null,
        chapterNumber: null,
        cadenceText: "Series Completed",
        sourceName: liveData?.sourceName || "Official",
        isScheduled: false,
        isUnlockingSoon: false,
        sourceUrl: null,
        isSourceAhead: false,
        aheadBy: 0,
        sourceLatestChapter: undefined,
      };
    }

    // 1. Check for upcoming confirmed scheduled chapters in database (Early Access Hold)
    const scheduled = (chapters || [])
      .filter((c) => c.status === "scheduled" || (c.scheduled_at && new Date(c.scheduled_at) > now))
      .sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0));

    if (scheduled.length > 0) {
      const futureScheduled = scheduled.filter((c) => c.scheduled_at && new Date(c.scheduled_at) > now);
      const targetCh = futureScheduled[0] || scheduled[0];
      const targetDate = targetCh.scheduled_at ? new Date(targetCh.scheduled_at) : new Date(Date.now() + 30 * 60 * 1000);

      // Group all chapters sharing the same unlock time (within 2 minutes)
      const sameBatchChapters = scheduled.filter((c) => {
        if (!c.scheduled_at) return true;
        return Math.abs(new Date(c.scheduled_at).getTime() - targetDate.getTime()) < 2 * 60 * 1000;
      });

      const nums = sameBatchChapters
        .map((c) => c.chapter_number)
        .filter((n) => typeof n === "number" && !isNaN(n))
        .sort((a, b) => a - b);

      let chapterLabel = "";
      if (nums.length === 1) {
        chapterLabel = `Ch. ${nums[0]}`;
      } else if (nums.length > 1) {
        const minNum = Math.min(...nums);
        const maxNum = Math.max(...nums);
        if (maxNum - minNum + 1 === nums.length) {
          chapterLabel = `Ch. ${minNum} - ${maxNum}`;
        } else {
          chapterLabel = `Ch. ${nums.join(", ")}`;
        }
      }

      const sourceUrl = sameBatchChapters.slice().reverse().find((c) => c.source_url)?.source_url || null;

      return {
        targetDate,
        chapterNumber: nums.length > 0 ? nums[nums.length - 1] : null,
        chapterLabel: chapterLabel || (nums.length > 0 ? `Ch. ${nums[0]}` : null),
        cadenceText: "30-Min Hold",
        sourceName: "Early Access",
        isScheduled: true,
        isUnlockingSoon: true,
        sourceUrl,
        isSourceAhead: false,
        aheadBy: 0,
        sourceLatestChapter: undefined,
      };
    }

    // 2. Priority: Live data imported from Comick.dev with update timings
    if (liveData?.found && liveData?.nextExpectedDrop) {
      let liveTarget = new Date(liveData.nextExpectedDrop);
      const sourceLatest = liveData.sourceLatestChapter || 0;

      // If the expected chapter is already imported into our list (currentMaxChapter >= sourceLatest):
      // Reset countdown to the NEXT upcoming release cycle for chapter currentMaxChapter + 1!
      if (currentMaxChapter >= sourceLatest && sourceLatest > 0) {
        while (liveTarget <= now || liveTarget.getTime() - now.getTime() < 6 * 60 * 60 * 1000) {
          liveTarget = new Date(liveTarget.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        while (liveTarget <= now) {
          liveTarget = new Date(liveTarget.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      }

      const nextChapterNum =
        currentMaxChapter >= sourceLatest && sourceLatest > 0
          ? currentMaxChapter + 1
          : liveData.isSourceAhead && sourceLatest > currentMaxChapter
          ? sourceLatest
          : (currentMaxChapter || 0) + 1;

      return {
        targetDate: liveTarget,
        chapterNumber: nextChapterNum,
        cadenceText: liveData.cadence || "Weekly",
        sourceName: liveData.sourceName || "Comick.dev",
        isScheduled: false,
        isUnlockingSoon: false,
        sourceUrl: null,
        isSourceAhead: liveData.isSourceAhead && currentMaxChapter < sourceLatest,
        aheadBy: currentMaxChapter < sourceLatest ? liveData.aheadBy : 0,
        sourceLatestChapter: liveData.sourceLatestChapter,
      };
    }

    // 4. Fallback: Check DB synced Estimated Next Release time
    if (estimatedNextReleaseAt) {
      let dbTarget = new Date(estimatedNextReleaseAt);
      while (dbTarget <= now) {
        dbTarget = new Date(dbTarget.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      return {
        targetDate: dbTarget,
        chapterNumber: (currentMaxChapter || 0) + 1,
        cadenceText: releaseCadence || "Weekly",
        sourceName: "Scans Schedule",
        isScheduled: false,
        isUnlockingSoon: false,
        sourceUrl: null,
        isSourceAhead: false,
        aheadBy: 0,
        sourceLatestChapter: undefined,
      };
    }

    // 5. Fallback: Estimate cadence from local chapters history
    if (!chapters || chapters.length === 0) return null;

    const published = chapters
      .filter((c) => c.status === "published" || !c.status)
      .slice(0, 5);

    if (published.length >= 2) {
      const dates = published.map((c) => new Date(c.created_at).getTime());
      const diffs: number[] = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const diffDays = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) diffs.push(diffDays);
      }

      if (diffs.length > 0) {
        const avgDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const lastRelease = new Date(dates[0]);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const releaseDay = dayNames[lastRelease.getDay()];

        let cadence = "Weekly";
        let addDays = 7;

        if (avgDays < 2.5) {
          cadence = "Daily / Rapid";
          addDays = 1;
        } else if (avgDays <= 9) {
          cadence = `Weekly (${releaseDay}s)`;
          addDays = 7;
        } else if (avgDays <= 18) {
          cadence = "Bi-weekly";
          addDays = 14;
        } else {
          cadence = "Monthly";
          addDays = 30;
        }

        const estimatedTarget = new Date(lastRelease.getTime() + addDays * 24 * 60 * 60 * 1000);
        while (estimatedTarget <= now) {
          estimatedTarget.setTime(estimatedTarget.getTime() + addDays * 24 * 60 * 60 * 1000);
        }

        const nextNum = (published[0].chapter_number || 0) + 1;

        return {
          targetDate: estimatedTarget,
          chapterNumber: nextNum,
          cadenceText: cadence,
          sourceName: "Local Cadence",
          isScheduled: false,
          isSourceAhead: false,
          aheadBy: 0,
          sourceLatestChapter: undefined,
        };
      }
    }

    return null;
  }, [chapters, status, liveData, currentMaxChapter]);

  // Live ticking countdown
  useEffect(() => {
    if (!scheduleInfo?.targetDate) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = scheduleInfo.targetDate!.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [scheduleInfo]);

  const handleToggleTrack = () => {
    if (!seriesTitle) return;
    const nextState = !isTracking;
    setIsTracking(nextState);
    try {
      localStorage.setItem(`vnr-track-${seriesTitle}`, String(nextState));
    } catch {}

    if (nextState) {
      toast.success("🔔 Release Notifications Enabled", {
        description: `You will be alerted when new chapters of "${seriesTitle}" drop!`,
      });
    } else {
      toast.info("Notifications muted for this series.");
    }
  };

  if (!scheduleInfo || !timeLeft) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950 p-3.5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 border border-white/10 text-purple-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              {(scheduleInfo as any).isUnlockingSoon
                ? "Early Access Hold"
                : scheduleInfo.isScheduled
                ? "Confirmed Next Release"
                : "Estimated Next Release"}
            </span>
            {((scheduleInfo as any).chapterLabel || scheduleInfo.chapterNumber) && (
              <span className="ml-1.5 text-xs font-mono font-bold text-amber-300">
                ({(scheduleInfo as any).chapterLabel || `Ch. ${scheduleInfo.chapterNumber}`})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(scheduleInfo as any).isUnlockingSoon && (
            <div className="flex items-center gap-1 rounded-full bg-amber-950/50 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
              <Lock className="h-2.5 w-2.5" />
              <span>Early Access</span>
            </div>
          )}
          {liveData?.found && !(scheduleInfo as any).isUnlockingSoon && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
              <Globe className="h-2.5 w-2.5" />
              <span>{scheduleInfo.sourceName}</span>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-300 border border-white/10">
            <Calendar className="h-2.5 w-2.5 text-purple-400" />
            <span>{scheduleInfo.cadenceText}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {/* Live Countdown Display */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-center">
          <div className="flex flex-col items-center rounded-lg bg-black border border-white/10 px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[42px]">
            <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">{timeLeft.days}</span>
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-400">Days</span>
          </div>
          <span className="font-mono text-xs text-neutral-600">:</span>
          <div className="flex flex-col items-center rounded-lg bg-black border border-white/10 px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[42px]">
            <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-400">Hours</span>
          </div>
          <span className="font-mono text-xs text-neutral-600">:</span>
          <div className="flex flex-col items-center rounded-lg bg-black border border-white/10 px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[42px]">
            <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-400">Mins</span>
          </div>
          <span className="font-mono text-xs text-neutral-600">:</span>
          <div className="flex flex-col items-center rounded-lg bg-black border border-white/10 px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[42px]">
            <span className="font-mono text-sm sm:text-base font-bold text-purple-400 tabular-nums">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-400">Secs</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(scheduleInfo as any).isUnlockingSoon && (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("chapters-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="h-7.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 px-2.5 sm:px-3 py-1 text-xs font-mono font-bold text-amber-300 shadow-sm transition-all cursor-pointer"
              title="Scroll to chapter unlock timers"
            >
              <Clock className="h-3 w-3 text-amber-400" />
              <span>View Timer</span>
            </button>
          )}
          {(scheduleInfo as any).isUnlockingSoon && (scheduleInfo as any).sourceUrl && (
            <a
              href={(scheduleInfo as any).sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7.5 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-2.5 sm:px-3 py-1 text-xs font-mono font-bold text-white shadow-sm transition-all shrink-0"
              title="Read immediately on official scans source"
            >
              <span>Read now</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button
            size="sm"
            variant={isTracking ? "secondary" : "outline"}
            onClick={handleToggleTrack}
            className={`h-7.5 text-xs font-mono font-bold gap-1.5 rounded-lg transition-all cursor-pointer ${
              isTracking ? "border-purple-500/50 text-purple-300 bg-purple-950/40" : "border-white/10 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300"
            }`}
          >
            {isTracking ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Tracking</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5 text-neutral-400" />
                <span>Track Drop</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {scheduleInfo.isSourceAhead && scheduleInfo.sourceLatestChapter && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-300">
          <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
          <span>
            <strong>Source Scans on Ch. {scheduleInfo.sourceLatestChapter}</strong> ({scheduleInfo.aheadBy} ahead) • Import / release expected soon!
          </span>
        </div>
      )}
    </div>
  );
}
