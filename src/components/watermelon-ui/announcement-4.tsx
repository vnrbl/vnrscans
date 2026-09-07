"use client";

import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnnouncementProps {
  title?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  onDismiss?: () => void;
}

export default function Announcement4({
  title,
  content,
  buttonText = "See what’s new",
  buttonLink,
  onDismiss,
}: AnnouncementProps) {
  const displayText = content || title || "A better version is here — faster, cleaner, and built to scale with you.";

  return (
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-3">
      <div className="border-purple-500/30 bg-purple-950/20 relative isolate flex w-full items-center justify-center overflow-hidden rounded-xl border px-4 py-2 sm:py-2.5 tracking-tight shadow-lg backdrop-blur-md">
        {/* Glow left */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl pointer-events-none"
        >
          <div
            style={{
              clipPath:
                "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
            }}
            className="from-purple-500 to-indigo-500 aspect-[577/310] w-[36rem] bg-gradient-to-r opacity-30"
          />
        </div>

        {/* Glow right */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl pointer-events-none"
        >
          <div
            style={{
              clipPath:
                "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
            }}
            className="from-purple-500 to-pink-500 aspect-[577/310] w-[36rem] bg-gradient-to-r opacity-30"
          />
        </div>

        <div className="relative z-10 flex-col items-center space-y-2 text-xs sm:text-sm sm:flex sm:flex-row sm:gap-3 sm:space-y-0 text-center sm:text-left pr-6">
          <div className="text-white font-medium truncate max-w-xl">
            {title && <span className="font-bold text-purple-300 mr-2">[{title}]</span>}
            {displayText}
          </div>

          <div className="group flex items-center justify-center gap-3">
            <div className="bg-purple-400 hidden size-1 rounded-full sm:block" />

            <Button
              size="sm"
              onClick={() => {
                if (buttonLink && typeof window !== "undefined") window.open(buttonLink, "_blank");
              }}
              className="text-white text-xs h-7 rounded-lg border border-white/20 bg-white/10 shadow-sm hover:bg-white/20 transition-all cursor-pointer"
            >
              <span>{buttonText}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ml-1" />
            </Button>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="text-neutral-400 hover:text-white absolute right-2 h-7 w-7 rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
