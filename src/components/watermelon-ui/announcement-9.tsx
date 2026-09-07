"use client";

import { Bell, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnnouncementProps {
  title?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  onDismiss?: () => void;
}

export default function Announcement9({
  title,
  content,
  buttonText = "View Details",
  buttonLink,
  onDismiss,
}: AnnouncementProps) {
  const displayText = content || title || "We updated our platform reading protocols and guidelines. Read more in our community documentation.";

  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-4">
      <div className="bg-neutral-900/80 backdrop-blur-xl text-white border-white/10 w-full max-w-2xl rounded-xl border p-4 sm:p-5 shadow-2xl relative">
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Close"
            className="absolute top-3 right-3 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 pr-6">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>

            <div>
              {title && <h4 className="text-sm font-bold text-white mb-1">{title}</h4>}
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                {displayText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end pt-1">
            {buttonLink && (
              <Button
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") window.open(buttonLink, "_blank");
                }}
                className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg px-3.5 shadow-sm flex items-center gap-1"
              >
                <span>{buttonText}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}

            {onDismiss && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="h-8 text-xs border-white/15 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg px-3"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
