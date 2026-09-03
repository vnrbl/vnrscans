"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeaderboardClient() {
  // Season countdown timer
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
      const diff = Math.max(0, endOfMonth.getTime() - now.getTime());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-200 relative overflow-hidden flex flex-col justify-center py-12 sm:py-16">
      {/* Ambient background glows */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] pointer-events-none opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139, 92, 246, 0.25), rgba(245, 158, 11, 0.08), transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-5xl relative z-10 space-y-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400 font-sans">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-white font-medium">Leaderboard</span>
        </nav>

        {/* Central Obsidian Feature Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0c]/90 backdrop-blur-xl p-8 sm:p-12 md:p-16 text-center space-y-8 shadow-2xl relative overflow-hidden">
          {/* Subtle decorative edge lights */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute bottom-0 left-1/3 right-1/3 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-amber-300 font-bold uppercase tracking-wider">
              Season 1 • Heavenly Dao Ascension
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400">Coming Soon</span>
          </div>

          {/* Emblem with rotating aura */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #a67c00, #ffd700, #c084fc, #8B5CF6, #a67c00)",
                animation: "rotationCW 8s linear infinite",
              }}
            />
            <div className="absolute inset-[3px] rounded-full bg-neutral-950 flex items-center justify-center">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
            </div>
          </div>

          {/* Headline & Body text */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase font-heading leading-tight">
              Leaderboard Coming Soon
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-sans font-normal">
              The grand cultivation rankings, spiritual Qi accumulation, and seasonal realm rewards are currently undergoing heavenly refinement. Prepare your reading streaks and sharpen your Dao heart before the heavenly gates unseal.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-3xs font-mono uppercase tracking-widest text-neutral-500">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span>Estimated Season Unsealing</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md w-full mx-auto">
              <div className="bg-black/80 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="block text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {countdown.days}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-mono">
                  Days
                </span>
              </div>
              <div className="bg-black/80 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="block text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {String(countdown.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-mono">
                  Hours
                </span>
              </div>
              <div className="bg-black/80 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="block text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {String(countdown.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-mono">
                  Mins
                </span>
              </div>
              <div className="bg-black/80 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <span className="block text-xl sm:text-2xl font-black text-amber-300 font-mono tabular-nums">
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider font-mono">
                  Secs
                </span>
              </div>
            </div>
          </div>

          {/* Feature Teasers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            <div className="rounded-xl border border-white/5 bg-black/50 p-4 space-y-2 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm font-heading">
                  Spiritual Qi Ranking
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans font-normal">
                Earn Qi points through active reading to ascend through cultivation realms from Qi Condensation to Dao Ancestor.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/50 p-4 space-y-2 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Flame className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm font-heading">
                  Dao Heart Streaks
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans font-normal">
                Maintain continuous daily reading habits to accumulate unstoppable streak multipliers and special achievements.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/50 p-4 space-y-2 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Crown className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm font-heading">
                  Cosmetic Realm Frames
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans font-normal">
                Top seasonal cultivators permanently unlock exclusive animated avatar frames, glowing badges, and profile titles.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/5">
            <Link to="/browse">
              <Button className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs h-9 px-4 rounded-lg gap-2 cursor-pointer transition-all">
                <BookOpen className="h-4 w-4" />
                <span>Explore Series</span>
              </Button>
            </Link>

            <Link to="/">
              <Button 
                variant="ghost"
                className="hover:bg-white/5 text-neutral-400 hover:text-white text-xs h-9 px-4 rounded-lg gap-1.5 cursor-pointer"
              >
                <span>Return to Home</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
