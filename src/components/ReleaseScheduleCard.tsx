"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, Calendar, Bell, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReleaseScheduleProps {
  chapters: Array<{
    id: string;
    chapter_number: number;
    created_at: string;
    scheduled_at?: string | null;
    status?: string;
  }>;
  status?: string | null;
  seriesTitle?: string;
}

export function ReleaseScheduleCard({ chapters, status, seriesTitle }: ReleaseScheduleProps) {
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

  // Determine schedule data
  const scheduleInfo = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;

    // 1. Check for an upcoming scheduled chapter
    const now = new Date();
    const scheduled = chapters.find(
      (c) => c.scheduled_at && new Date(c.scheduled_at) > now
    );

    if (scheduled && scheduled.scheduled_at) {
      return {
        targetDate: new Date(scheduled.scheduled_at),
        chapterNumber: scheduled.chapter_number,
        cadenceText: "Official Schedule",
        isScheduled: true,
      };
    }

    // 2. If status is completed, no upcoming countdown needed
    if (status?.toLowerCase() === "completed") {
      return {
        targetDate: null,
        chapterNumber: null,
        cadenceText: "Series Completed",
        isScheduled: false,
      };
    }

    // 3. Estimate cadence from recent 4 chapters
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
        // If target already passed, push forward to next cadence
        while (estimatedTarget <= now) {
          estimatedTarget.setTime(estimatedTarget.getTime() + addDays * 24 * 60 * 60 * 1000);
        }

        const nextNum = (published[0].chapter_number || 0) + 1;

        return {
          targetDate: estimatedTarget,
          chapterNumber: nextNum,
          cadenceText: cadence,
          isScheduled: false,
        };
      }
    }

    return null;
  }, [chapters, status]);

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
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-primary/5 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/20 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">
              {scheduleInfo.isScheduled ? "Confirmed Next Release" : "Estimated Next Release"}
            </span>
            {scheduleInfo.chapterNumber && (
              <span className="ml-1.5 text-xs text-primary font-semibold">
                (Ch. {scheduleInfo.chapterNumber})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40">
          <Calendar className="h-3 w-3 text-primary" />
          <span>{scheduleInfo.cadenceText}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {/* Live Countdown Display */}
        <div className="flex items-center gap-2 text-center">
          <div className="flex flex-col items-center rounded-lg bg-background/80 border border-border/50 px-2.5 py-1 min-w-[42px]">
            <span className="font-mono text-sm font-bold text-foreground">{timeLeft.days}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Days</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">:</span>
          <div className="flex flex-col items-center rounded-lg bg-background/80 border border-border/50 px-2.5 py-1 min-w-[42px]">
            <span className="font-mono text-sm font-bold text-foreground">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Hours</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">:</span>
          <div className="flex flex-col items-center rounded-lg bg-background/80 border border-border/50 px-2.5 py-1 min-w-[42px]">
            <span className="font-mono text-sm font-bold text-foreground">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Mins</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">:</span>
          <div className="flex flex-col items-center rounded-lg bg-background/80 border border-border/50 px-2.5 py-1 min-w-[42px]">
            <span className="font-mono text-sm font-bold text-primary animate-pulse">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Secs</span>
          </div>
        </div>

        {/* Notify Button */}
        <Button
          size="sm"
          variant={isTracking ? "secondary" : "outline"}
          onClick={handleToggleTrack}
          className={`h-8 text-xs font-semibold gap-1.5 transition-all ${
            isTracking ? "border-primary/50 text-primary bg-primary/15" : "border-border/60 hover:border-primary/40"
          }`}
        >
          {isTracking ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Tracking</span>
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Track Drop</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
