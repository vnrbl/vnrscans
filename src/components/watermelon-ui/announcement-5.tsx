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

export default function Announcement5({
  title,
  content,
  buttonText = "Explore update",
  buttonLink,
  onDismiss,
}: AnnouncementProps) {
  const displayText = content || title || "A major update just landed — experience a faster, smoother, and more refined interface.";

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative isolate flex w-full items-center justify-center overflow-hidden border-b border-white/10 px-8 py-2.5 backdrop-blur-xl">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 via-white/5 to-transparent opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/10 opacity-30 blur-2xl" />

        <div className="flex w-full max-w-4xl min-w-0 flex-row items-center justify-center gap-3 text-center pr-6">
          <p className="truncate text-xs sm:text-sm leading-snug font-medium text-zinc-100 max-w-2xl">
            {title && <span className="font-bold text-purple-400 mr-2">{title} —</span>}
            {displayText}
          </p>

          <div className="group flex items-center shrink-0">
            <Button
              size="sm"
              onClick={() => {
                if (buttonLink && typeof window !== "undefined") window.open(buttonLink, "_blank");
              }}
              className="rounded-full bg-white text-black hover:bg-white/90 px-3.5 h-7 text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <span>{buttonText}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="absolute right-2 h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
