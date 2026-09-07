"use client";

import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnnouncementProps {
  title?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  onDismiss?: () => void;
}

export default function Announcement2({
  title,
  content,
  buttonText = "Join now",
  buttonLink,
  onDismiss,
}: AnnouncementProps) {
  const displayText = content || title || "Hackathon registrations are now open — build fast, ship faster, and win big.";

  return (
    <div className="flex h-full w-full items-center justify-center bg-black/40 backdrop-blur-md border-b border-purple-500/20">
      <div className="relative flex w-full items-center justify-center px-8 py-2 sm:px-4">
        <div className="flex w-full items-center justify-center gap-3">
          <div className="text-neutral-300 flex min-w-0 items-center gap-2 text-xs sm:text-sm">
            <Sparkles className="text-purple-400 h-4 w-4 shrink-0" />
            <p className="truncate max-w-2xl">
              {title && <span className="font-bold text-white mr-1.5">{title}:</span>}
              {displayText}
            </p>
          </div>
          <div className="group flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              onClick={() => {
                if (buttonLink && typeof window !== "undefined") window.open(buttonLink, "_blank");
              }}
              className="shrink-0 rounded-full h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1 px-3 shadow-sm"
            >
              <span>{buttonText}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
