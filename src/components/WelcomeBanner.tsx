"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, BookOpen, Heart, History, Share2, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "vnr_welcome_banner_dismissed_at";
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // re-show after a week away

/** Quick "how to use the site" pointers shown under the welcome copy. */
const TIPS = [
  { icon: BookOpen, label: "Read free — no signup needed" },
  { icon: History, label: "Continue where you left off" },
  { icon: BookmarkPlus, label: "Follow series & build a library" },
  { icon: Zap, label: "Earn XP & unlock achievements" },
];

/**
 * WelcomeBanner — animated welcome / thanks / recommend strip at the top of
 * the home page. Dismissal is remembered (localStorage) for 7 days so
 * returning visitors occasionally see it again. Respects reduced motion
 * globally via the site's prefers-reduced-motion guard in styles.css.
 */
export default function WelcomeBanner() {
  const [visible, setVisible] = useState(false); // false until client check → avoids SSR flash
  const [mounted, setMounted] = useState(false);
  const [shareUrl, setShareUrl] = useState("https://www.vnrscans.com");

  useEffect(() => {
    setMounted(true);
    setShareUrl(window.location.origin);
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const weekGone = Date.now() - dismissedAt > RESHOW_AFTER_MS;
      if (!dismissedAt || weekGone) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  const share = async () => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({
          title: "vnrscans",
          text: "I'm reading manga, manhwa & novels on vnrscans — come check it out!",
          url: shareUrl,
        });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied — share it with your friends!");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  if (!mounted || !visible) return null;

  return (
    <section
      aria-label="Welcome message"
      className="welcome-banner relative mx-4 mt-4 overflow-hidden rounded-2xl border border-primary/20 sm:mx-6 lg:mx-8"
    >
      {/* Animated aurora gradient background */}
      <div className="welcome-banner__aurora pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Drifting glow orbs */}
      <div className="welcome-banner__orb welcome-banner__orb--a pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
      <div className="welcome-banner__orb welcome-banner__orb--b pointer-events-none absolute -bottom-28 right-8 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" aria-hidden="true" />

      {/* Twinkling stars */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="welcome-banner__star absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${(i * 71 + 13) % 100}%`,
              top: `${(i * 37 + 11) % 80 + 5}%`,
              animationDelay: `${(i % 7) * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-start gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
        <div className="flex items-start gap-4">
          {/* Pulsing icon */}
          <div className="welcome-banner__badge flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 shadow-lg shadow-primary/30">
            <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
          </div>

          <div>
            <p className="welcome-banner__rise font-display text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              Welcome to{" "}
              <span className="welcome-banner__shine bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
                vnrscans
              </span>
            </p>
            <p className="welcome-banner__rise welcome-banner__rise--late mt-1 max-w-xl text-sm leading-relaxed text-neutral-300">
              Thanks for visiting us — we&apos;re glad you&apos;re here. Enjoying
              the reads?{" "}
              <button
                type="button"
                onClick={share}
                className="focus-ring inline-flex items-center gap-1 rounded-sm font-semibold text-primary transition-colors hover:text-fuchsia-300"
              >
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                Recommend us to your friends
              </button>
            </p>

            {/* How-to-use tips */}
            <div className="mt-3 grid w-full max-w-xl grid-cols-1 gap-1.5 sm:grid-cols-2">
              {TIPS.map((tip, i) => (
                <div
                  key={tip.label}
                  className="welcome-banner__rise flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                >
                  <tip.icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-xs font-medium text-neutral-300">{tip.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={share}
            className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:scale-[1.03] hover:bg-primary/90 active:scale-95 sm:flex-none"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share vnrscans
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss welcome message"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
