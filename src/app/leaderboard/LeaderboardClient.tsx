"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  Shield,
  Sparkles,
  Award,
  Swords,
  Search,
  Clock,
  Gift,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Data Types ─────────────────────────────────────────────────────────────

export type LeaderboardUser = {
  id: string;
  user_id: string;
  username: string;
  user_level: number;
  experience_points: number;
  reading_streak: number;
  avatar_url: string | null;
  avatar_frame: string | null;
  accent_color: string | null;
  is_vip: boolean;
  created_at: string;
};

export type LeaderboardTier = {
  id: string;
  name: string;
  title: string;
  minRank: number;
  maxRank: number;
  badgeColor: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  xpMultiplier: string;
  seasonPoints: number;
  exclusiveFrame: string;
  perks: string[];
};

// ─── Game Rank Tier Definitions ─────────────────────────────────────────────

export const RANK_TIERS: LeaderboardTier[] = [
  {
    id: "grand-monarch",
    name: "Grand Monarch",
    title: "Supreme Dao Monarch",
    minRank: 1,
    maxRank: 3,
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    gradient: "from-amber-500/30 via-yellow-500/15 to-transparent",
    borderColor: "border-amber-500/60",
    glowColor: "rgba(245, 158, 11, 0.4)",
    textColor: "text-amber-400",
    xpMultiplier: "+300% Bonus XP",
    seasonPoints: 10000,
    exclusiveFrame: "Celestial Grand Monarch (Animated Gold Aura)",
    perks: [
      "Exclusive 'Supreme Dao Monarch' Legendary Profile Title",
      "Grand Monarch Animated Golden Crown Frame",
      "+300% Bonus XP on every chapter read",
      "Permanent Induction into the vnrscans Hall of Fame",
      "Golden Crown Icon & Shimmering Name in all comments",
      "3x Free Streak Shields per season (prevents streak loss)",
      "10,000 Realm Points granted at Season End",
    ],
  },
  {
    id: "sovereign",
    name: "S-Rank Sovereign",
    title: "Demon Emperor",
    minRank: 4,
    maxRank: 10,
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/50",
    gradient: "from-red-600/25 via-orange-600/15 to-transparent",
    borderColor: "border-red-500/50",
    glowColor: "rgba(239, 68, 68, 0.35)",
    textColor: "text-red-400",
    xpMultiplier: "+200% Bonus XP",
    seasonPoints: 5000,
    exclusiveFrame: "Crimson Asura Sovereign (Infernal Flame Aura)",
    perks: [
      "Exclusive 'Demon Emperor' Mythic Profile Title",
      "Crimson Asura Sovereign Avatar Frame",
      "+200% Bonus XP on every chapter read",
      "Infernal Flame Badge on comments and discussions",
      "2x Free Streak Shields per season",
      "5,000 Realm Points granted at Season End",
    ],
  },
  {
    id: "diamond",
    name: "Diamond Vanguard",
    title: "Vanguard Monarch",
    minRank: 11,
    maxRank: 25,
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
    gradient: "from-cyan-500/20 via-blue-600/10 to-transparent",
    borderColor: "border-cyan-500/40",
    glowColor: "rgba(6, 182, 212, 0.3)",
    textColor: "text-cyan-400",
    xpMultiplier: "+150% Bonus XP",
    seasonPoints: 2500,
    exclusiveFrame: "Diamond Crystal Prismatic Frame",
    perks: [
      "Exclusive 'Vanguard Monarch' Epic Profile Title",
      "Diamond Crystal Prismatic Avatar Frame",
      "+150% Bonus XP on every chapter read",
      "Diamond Sparkle Emblem on Profile",
      "1x Free Streak Shield per season",
      "2,500 Realm Points granted at Season End",
    ],
  },
  {
    id: "platinum",
    name: "Platinum Hunter",
    title: "High Disciple",
    minRank: 26,
    maxRank: 50,
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    gradient: "from-purple-500/20 via-pink-600/10 to-transparent",
    borderColor: "border-purple-500/40",
    glowColor: "rgba(168, 85, 247, 0.25)",
    textColor: "text-purple-400",
    xpMultiplier: "+100% Bonus XP",
    seasonPoints: 1200,
    exclusiveFrame: "Platinum Edge Vanguard Frame",
    perks: [
      "Exclusive 'High Disciple' Rare Profile Title",
      "Platinum Edge Avatar Frame",
      "+100% Bonus XP on every chapter read",
      "Platinum Hunter Ribbon on Profile",
      "1,200 Realm Points granted at Season End",
    ],
  },
  {
    id: "gold",
    name: "Gold Adventurer",
    title: "Ascendant Reader",
    minRank: 51,
    maxRank: 100,
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    gradient: "from-yellow-500/15 via-amber-600/10 to-transparent",
    borderColor: "border-yellow-500/30",
    glowColor: "rgba(234, 179, 8, 0.2)",
    textColor: "text-yellow-400",
    xpMultiplier: "+50% Bonus XP",
    seasonPoints: 600,
    exclusiveFrame: "Golden Crest Avatar Border",
    perks: [
      "Exclusive 'Ascendant Reader' Profile Title",
      "Golden Crest Avatar Border",
      "+50% Bonus XP on all chapter reads",
      "600 Realm Points granted at Season End",
    ],
  },
  {
    id: "aspirant",
    name: "Aspirant Cultivator",
    title: "Rising Disciple",
    minRank: 101,
    maxRank: 999999,
    badgeColor: "bg-neutral-800/60 text-neutral-300 border-neutral-700/60",
    gradient: "from-neutral-800/30 via-neutral-900/10 to-transparent",
    borderColor: "border-neutral-800",
    glowColor: "rgba(255, 255, 255, 0.05)",
    textColor: "text-neutral-300",
    xpMultiplier: "+10% Daily Reading XP",
    seasonPoints: 200,
    exclusiveFrame: "Iron & Bronze Insignia",
    perks: [
      "Standard Realm Reader Title",
      "Daily reading XP progression",
      "Climb to Top 100 to unlock exclusive animated cosmetics and rewards",
    ],
  },
];

export function getTierForRank(rank: number): LeaderboardTier {
  for (const tier of RANK_TIERS) {
    if (rank >= tier.minRank && rank <= tier.maxRank) {
      return tier;
    }
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

// ─── Mini Avatar Frame Component ────────────────────────────────────────────

function LeaderboardAvatar({
  avatarUrl,
  avatarFrame,
  accentColor,
  username,
  size = 44,
  rank,
}: {
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  accentColor?: string | null;
  username: string;
  size?: number;
  rank?: number;
}) {
  const accent = accentColor || "#8B5CF6";
  const frame = avatarFrame || (rank === 1 ? "gold" : rank === 2 ? "divine" : rank === 3 ? "asura" : "none");

  const getFrameGradient = () => {
    switch (frame) {
      case "gold":
        return "conic-gradient(from 0deg, #a67c00, #ffd700, #ffeb99, #ffd700, #a67c00)";
      case "fire":
        return "conic-gradient(from 0deg, #b91c1c, #f97316, #ef4444, #b91c1c)";
      case "asura":
        return "conic-gradient(from 0deg, #ef4444, #7f1d1d, #ef4444)";
      case "cyber":
        return "conic-gradient(from 0deg, #0ea5e9, transparent 30%, #c084fc, transparent 60%, #0ea5e9)";
      case "neon":
        return "conic-gradient(from 0deg, #A855F7, #06B6D4, #EC4899, #A855F7)";
      case "divine":
        return "conic-gradient(from 0deg, #FCD34D, #FFFFFF, #FFFBEB, #FCD34D)";
      case "shadow":
        return "conic-gradient(from 0deg, #4f46e5, #06b6d4, #1e1b4b, #4f46e5)";
      case "qi":
        return "conic-gradient(from 0deg, #059669, #10B981, #FBBF24, #059669)";
      case "system":
        return "conic-gradient(from 0deg, #06B6D4, transparent 30%, #06B6D4 50%, transparent 70%, #06B6D4)";
      case "creator":
        return `conic-gradient(from 0deg, ${accent}, transparent, ${accent}80, transparent, ${accent})`;
      default:
        return rank === 1
          ? "conic-gradient(from 0deg, #ffd700, #ffb700, #ffd700)"
          : accent;
    }
  };

  const isAnimated = frame !== "none" || (rank && rank <= 3);
  const borderWidth = 2.5;
  const innerSize = size - borderWidth * 2;

  return (
    <div
      className="relative rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {isAnimated && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: getFrameGradient(),
            animation: "navRotCW 3.5s linear infinite",
          }}
        />
      )}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-neutral-900 border border-black/40 text-white font-bold"
        style={{ width: innerSize, height: innerSize }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-xs uppercase">{username.slice(0, 2)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────

export function LeaderboardClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"exp" | "streak" | "rewards" | "rules">("exp");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<LeaderboardUser | null>(null);

  // Season countdown timer: Target is end of current month UTC
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Target: 28 days cycle or end of current month
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

  // ─── Supabase Data Fetching ───────────────────────────────────────────────

  const leaderboardQuery = useQuery({
    queryKey: ["user-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, user_level, experience_points, reading_streak, avatar_url, avatar_frame, accent_color, is_vip, created_at")
        .not("username", "is", null)
        .order("experience_points", { ascending: false })
        .order("user_level", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLastUpdatedTime(new Date());
      return (data ?? []) as LeaderboardUser[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // ─── Realtime Updates Subscription ────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("public-profiles-leaderboard-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-leaderboard"] });
          setLastUpdatedTime(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["user-leaderboard"] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  // ─── Filter & Sorting Logic ───────────────────────────────────────────────

  const allUsers = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);

  // Sorted list according to current tab
  const sortedList = useMemo(() => {
    if (activeTab === "streak") {
      return [...allUsers].sort((a, b) => {
        const streakDiff = (b.reading_streak || 0) - (a.reading_streak || 0);
        if (streakDiff !== 0) return streakDiff;
        return (b.experience_points || 0) - (a.experience_points || 0);
      });
    }
    // Default: EXP / Level
    return [...allUsers].sort((a, b) => {
      const xpDiff = (b.experience_points || 0) - (a.experience_points || 0);
      if (xpDiff !== 0) return xpDiff;
      return (b.user_level || 1) - (a.user_level || 1);
    });
  }, [allUsers, activeTab]);

  // Search filtered list
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return sortedList;
    const q = searchQuery.toLowerCase().trim();
    return sortedList.filter((u) => u.username.toLowerCase().includes(q));
  }, [sortedList, searchQuery]);

  // Podium top 3 (only when not searching)
  const podiumUsers = useMemo(() => {
    return sortedList.slice(0, 3);
  }, [sortedList]);

  // Logged in user standing
  const currentUserStanding = useMemo(() => {
    if (!user) return null;
    const index = sortedList.findIndex((u) => u.user_id === user.id);
    if (index === -1) {
      return {
        user: null,
        rank: null,
        tier: RANK_TIERS[RANK_TIERS.length - 1],
        xpToNextRank: 100,
      };
    }
    const rank = index + 1;
    const currentUser = sortedList[index];
    const prevUser = index > 0 ? sortedList[index - 1] : null;
    const xpToNextRank = prevUser
      ? Math.max(1, (prevUser.experience_points || 0) - (currentUser.experience_points || 0) + 1)
      : 0;

    return {
      user: currentUser,
      rank,
      tier: getTierForRank(rank),
      xpToNextRank,
    };
  }, [user, sortedList]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-16">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-gradient from-purple-900/10 via-amber-900/5 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 relative">
        {/* ─── Header & Live Realtime Bar ───────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/30">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xs font-bold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Realtime Updates
              </span>
              <span className="text-2xs text-muted-foreground font-mono">
                Synced {lastUpdatedTime.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-400 shrink-0 stroke-[2.2]" />
              Hunter Leaderboard
            </h1>
            <p className="mt-1 text-sm text-neutral-400 max-w-2xl">
              Real-time standings of top readers & cultivators. Hold your rank to claim exclusive animated frames, custom titles, and weekly multipliers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || leaderboardQuery.isFetching}
              className="border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 hover:text-white text-neutral-300 text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setRewardsModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-bold text-xs gap-1.5 h-9 shadow-lg shadow-purple-950/40"
            >
              <Gift className="h-4 w-4" />
              Rank Rewards
            </Button>
          </div>
        </div>

        {/* ─── Season 1 Banner & Countdown ─────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-neutral-950 to-purple-950/40 p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-300 text-3xs uppercase font-extrabold px-2 py-0.5">
                  Season 1: Ascension of Monarchs
                </Badge>
                <span className="text-xs text-neutral-400">• Ends in</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Season End Rank Lock & Reward Payout
              </h2>
              <p className="text-xs text-neutral-400 max-w-xl">
                Maintain rank tier until the season concludes to permanently secure the season's avatar frames, title tags, and bonus Realm Points.
              </p>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 sm:gap-3 bg-black/60 border border-white/10 rounded-xl p-2.5 sm:px-4 backdrop-blur-md shrink-0">
              <div className="flex flex-col items-center min-w-12">
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">{countdown.days}</span>
                <span className="text-3xs uppercase tracking-wider text-neutral-400">Days</span>
              </div>
              <span className="font-mono text-lg font-bold text-neutral-600">:</span>
              <div className="flex flex-col items-center min-w-12">
                <span className="font-mono text-xl sm:text-2xl font-black text-white">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="text-3xs uppercase tracking-wider text-neutral-400">Hours</span>
              </div>
              <span className="font-mono text-lg font-bold text-neutral-600">:</span>
              <div className="flex flex-col items-center min-w-12">
                <span className="font-mono text-xl sm:text-2xl font-black text-white">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="text-3xs uppercase tracking-wider text-neutral-400">Mins</span>
              </div>
              <span className="font-mono text-lg font-bold text-neutral-600">:</span>
              <div className="flex flex-col items-center min-w-12">
                <span className="font-mono text-xl sm:text-2xl font-black text-purple-400">{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="text-3xs uppercase tracking-wider text-neutral-400">Secs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Current Logged-in User Standing Card ─────────────────────── */}
        {user ? (
          currentUserStanding && currentUserStanding.user ? (
            <div className="mt-6 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/50 via-neutral-900 to-neutral-950 p-4 relative overflow-hidden shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <LeaderboardAvatar
                      avatarUrl={currentUserStanding.user.avatar_url}
                      avatarFrame={currentUserStanding.user.avatar_frame}
                      accentColor={currentUserStanding.user.accent_color}
                      username={currentUserStanding.user.username}
                      size={52}
                      rank={currentUserStanding.rank || undefined}
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 text-3xs font-black text-amber-300">
                      #{currentUserStanding.rank}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white">{currentUserStanding.user.username}</span>
                      <Badge variant="outline" className={`text-3xs uppercase font-extrabold px-2 py-0.5 ${currentUserStanding.tier.badgeColor}`}>
                        {currentUserStanding.tier.name}
                      </Badge>
                      <span className="text-xs text-purple-300 font-semibold">
                        Lv. {currentUserStanding.user.user_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 flex-wrap">
                      <span>Total XP: <strong className="text-white">{(currentUserStanding.user.experience_points || 0).toLocaleString()}</strong></span>
                      <span>Streak: <strong className="text-amber-400">🔥 {currentUserStanding.user.reading_streak || 0} days</strong></span>
                      <span className="text-emerald-400 font-semibold">{currentUserStanding.tier.xpMultiplier}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  {currentUserStanding.xpToNextRank > 0 ? (
                    <div className="text-right text-xs">
                      <p className="text-neutral-400">Next Rank in</p>
                      <p className="font-mono font-bold text-amber-300">{currentUserStanding.xpToNextRank.toLocaleString()} XP</p>
                    </div>
                  ) : (
                    <div className="text-right text-xs">
                      <p className="text-amber-400 font-bold">Apex of the Realm 👑</p>
                      <p className="text-neutral-400">Rank #1 Overall</p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRewardsModalOpen(true)}
                    className="border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs h-9"
                  >
                    My Rewards
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-border/40 bg-neutral-900/40 p-4 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>You haven't earned your realm rank yet. Read chapters to gain XP and appear on the Leaderboard!</span>
              </div>
              <Button size="sm" asChild variant="secondary" className="text-xs h-8">
                <Link to="/browse">Start Reading</Link>
              </Button>
            </div>
          )
        ) : (
          <div className="mt-6 rounded-xl border border-border/40 bg-neutral-900/40 p-4 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span>Join the seasonal competition to rank up and claim exclusive animated frames and titles.</span>
            </div>
            <Button size="sm" asChild className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white">
              <Link to="/auth">Sign In to Compete</Link>
            </Button>
          </div>
        )}

        {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                <TabsTrigger
                  value="exp"
                  className="rounded-lg text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white font-semibold"
                >
                  <Trophy className="mr-1.5 h-3.5 w-3.5" />
                  EXP & Level
                </TabsTrigger>
                <TabsTrigger
                  value="streak"
                  className="rounded-lg text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white font-semibold"
                >
                  <Flame className="mr-1.5 h-3.5 w-3.5" />
                  Reading Streak
                </TabsTrigger>
                <TabsTrigger
                  value="rewards"
                  className="rounded-lg text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold"
                >
                  <Gift className="mr-1.5 h-3.5 w-3.5" />
                  Rank Tiers
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="rounded-lg text-xs data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-semibold"
                >
                  <Shield className="mr-1.5 h-3.5 w-3.5" />
                  Rank Rules
                </TabsTrigger>
              </TabsList>

              {/* Search Bar */}
              {(activeTab === "exp" || activeTab === "streak") && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <Input
                    type="text"
                    placeholder="Search hunter username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-neutral-900 border-neutral-800 focus-visible:ring-purple-500 rounded-xl text-white placeholder:text-neutral-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs text-neutral-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─── TAB 1 & 2: LEADERBOARD CONTENT (EXP & STREAK) ──────── */}
            {(activeTab === "exp" || activeTab === "streak") && (
              <div className="space-y-8">
                {/* ─── Top 3 Grand Monarchs Podium (shown when not searching) ─ */}
                {!searchQuery.trim() && podiumUsers.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 pb-2">
                    {/* Rank 2 (Silver) */}
                    <PodiumCard
                      user={podiumUsers[1]}
                      rank={2}
                      label="2nd Place"
                      tierName="S-Rank Sovereign"
                      badgeColor="bg-slate-400/20 text-slate-200 border-slate-400/40"
                      glowColor="rgba(148, 163, 184, 0.4)"
                      activeTab={activeTab}
                    />

                    {/* Rank 1 (Gold - Center - Highest) */}
                    <PodiumCard
                      user={podiumUsers[0]}
                      rank={1}
                      label="Grand Monarch"
                      tierName="Grand Monarch"
                      badgeColor="bg-amber-400/25 text-amber-300 border-amber-400/60"
                      glowColor="rgba(251, 191, 36, 0.5)"
                      isFirstPlace={true}
                      activeTab={activeTab}
                    />

                    {/* Rank 3 (Bronze) */}
                    <PodiumCard
                      user={podiumUsers[2]}
                      rank={3}
                      label="3rd Place"
                      tierName="S-Rank Sovereign"
                      badgeColor="bg-amber-700/20 text-amber-400 border-amber-700/40"
                      glowColor="rgba(180, 83, 9, 0.35)"
                      activeTab={activeTab}
                    />
                  </div>
                )}

                {/* ─── Rankings List Table ───────────────────────────── */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-900/90 text-2xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                    <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                    <div className="col-span-6 sm:col-span-5 md:col-span-4">Hunter / Cultivator</div>
                    <div className="hidden md:block md:col-span-3">Tier & Title</div>
                    <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                      {activeTab === "streak" ? "Reading Streak" : "Experience"}
                    </div>
                    <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                      {activeTab === "streak" ? "Total EXP" : "Level"}
                    </div>
                  </div>

                  {/* Table Rows */}
                  {filteredList.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400">
                      <Search className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                      <p className="font-semibold text-sm">No cultivators found matching "{searchQuery}"</p>
                      <p className="text-xs text-neutral-500 mt-1">Try searching for a different username</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-900">
                      {filteredList.map((rowUser, index) => {
                        const originalRank = sortedList.findIndex((u) => u.id === rowUser.id) + 1;
                        const tier = getTierForRank(originalRank);
                        const isCurrentUser = user && user.id === rowUser.user_id;

                        return (
                          <div
                            key={rowUser.id}
                            className={`grid grid-cols-12 gap-2 items-center px-4 py-3 text-xs transition-colors hover:bg-neutral-900/60 ${
                              isCurrentUser ? "bg-purple-950/25 border-l-2 border-l-purple-500" : ""
                            }`}
                          >
                            {/* Rank Position Column */}
                            <div className="col-span-2 sm:col-span-1 flex items-center justify-center font-mono">
                              {originalRank === 1 ? (
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-sm shadow-sm shadow-amber-500/20">
                                  👑
                                </span>
                              ) : originalRank === 2 ? (
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400/20 text-slate-300 border border-slate-400/40 font-black text-sm">
                                  🥈
                                </span>
                              ) : originalRank === 3 ? (
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/40 font-black text-sm">
                                  🥉
                                </span>
                              ) : originalRank <= 10 ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-red-500/15 text-red-400 font-bold text-xs border border-red-500/30">
                                  #{originalRank}
                                </span>
                              ) : originalRank <= 25 ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/20">
                                  #{originalRank}
                                </span>
                              ) : (
                                <span className="text-neutral-400 font-semibold text-xs">
                                  #{originalRank}
                                </span>
                              )}
                            </div>

                            {/* User Info Column */}
                            <div className="col-span-6 sm:col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                              <LeaderboardAvatar
                                avatarUrl={rowUser.avatar_url}
                                avatarFrame={rowUser.avatar_frame}
                                accentColor={rowUser.accent_color}
                                username={rowUser.username}
                                size={36}
                                rank={originalRank}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Link
                                    to="/user/$username"
                                    params={{ username: rowUser.username }}
                                    className="font-bold text-white hover:text-purple-400 transition-colors truncate max-w-[140px] sm:max-w-[180px]"
                                  >
                                    {rowUser.username}
                                  </Link>
                                  {rowUser.is_vip && (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-[9px] py-0 px-1 font-bold">
                                      VIP
                                    </Badge>
                                  )}
                                  {isCurrentUser && (
                                    <Badge className="bg-purple-600 text-white text-[9px] py-0 px-1">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-3xs text-neutral-400 truncate md:hidden">
                                  {tier.name} • Lv. {rowUser.user_level}
                                </p>
                              </div>
                            </div>

                            {/* Tier & Title Column (desktop) */}
                            <div className="hidden md:block md:col-span-3 min-w-0">
                              <Badge
                                variant="outline"
                                className={`text-3xs font-extrabold px-2 py-0.5 uppercase tracking-wider ${tier.badgeColor}`}
                              >
                                {tier.name}
                              </Badge>
                              <span className="block text-3xs text-neutral-400 mt-0.5 truncate font-medium">
                                {tier.title}
                              </span>
                            </div>

                            {/* Stat 1 Column */}
                            <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                              {activeTab === "streak" ? (
                                <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                                  🔥 {rowUser.reading_streak || 0}d
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-white text-xs sm:text-sm">
                                  {(rowUser.experience_points || 0).toLocaleString()} <span className="text-3xs font-normal text-purple-400">XP</span>
                                </span>
                              )}
                            </div>

                            {/* Stat 2 Column */}
                            <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                              {activeTab === "streak" ? (
                                <span className="font-mono text-neutral-300 text-xs">
                                  {(rowUser.experience_points || 0).toLocaleString()} XP
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-purple-300 text-xs bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                                  Lv. {rowUser.user_level}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 3: SEASON TIERS & REWARDS VISUALIZER ───────────── */}
            {activeTab === "rewards" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/40 bg-neutral-900/40 p-5">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Season 1 Rank Tier Breakdown & Rewards
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Just like competitive games, staying in your rank rewards you with permanent cosmetics, animated profile frames, multiplier boosters, and bonus Realm Points distributed at the end of each season.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {RANK_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      className={`rounded-2xl border ${tier.borderColor} bg-neutral-950 p-5 flex flex-col justify-between relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.01]`}
                      style={{
                        boxShadow: `0 0 25px -5px ${tier.glowColor}`,
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-xs font-black uppercase tracking-wider py-0.5 px-2.5 ${tier.badgeColor}`}
                          >
                            {tier.name}
                          </Badge>
                          <span className="font-mono font-bold text-xs text-neutral-400">
                            {tier.minRank === 101 ? "Rank 101+" : `Rank #${tier.minRank} - #${tier.maxRank}`}
                          </span>
                        </div>

                        <div>
                          <h4 className={`text-xl font-black ${tier.textColor}`}>{tier.title}</h4>
                          <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                            {tier.xpMultiplier} • {tier.seasonPoints} Season Points
                          </p>
                        </div>

                        <div className="rounded-lg bg-neutral-900/80 p-2.5 border border-neutral-800 text-xs space-y-1.5">
                          <p className="text-3xs uppercase font-bold text-neutral-400">Exclusive Cosmetic</p>
                          <p className="font-semibold text-white text-xs">{tier.exclusiveFrame}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <p className="text-3xs uppercase font-bold text-neutral-400 tracking-wider">Perks & Retention Benefits:</p>
                          <ul className="space-y-1">
                            {tier.perks.map((perk, i) => (
                              <li key={i} className="text-xs text-neutral-300 flex items-start gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-neutral-900 flex items-center justify-between text-2xs text-neutral-400">
                        <span>Prizes awarded at season reset</span>
                        <span className="text-amber-400 font-bold">Guaranteed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 4: RANK RULES & ANTI-DECAY ─────────────────────── */}
            {activeTab === "rules" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Anti-Decay Card */}
                  <div className="rounded-2xl border border-red-500/30 bg-neutral-950 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Rank Decay & Immunity</h3>
                        <p className="text-xs text-neutral-400">Keep active to preserve your realm standing</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                      <p>
                        To ensure active and competitive leaderboards, hunters in the top 100 ranks must read at least <strong className="text-white">1 chapter every 3 days</strong> to remain immune from rank decay.
                      </p>
                      <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Inactive Grace Period:</span>
                          <span className="text-white font-bold">7 Days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Decay Penalty (after 7 days):</span>
                          <span className="text-red-400 font-bold">-50 XP per day</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Streak Freeze Shield:</span>
                          <span className="text-emerald-400 font-bold">Blocks 1 day of decay</span>
                        </div>
                      </div>
                      <p className="text-neutral-400">
                        Decay stops automatically as soon as you open and complete reading a chapter!
                      </p>
                    </div>
                  </div>

                  {/* How XP Works Card */}
                  <div className="rounded-2xl border border-purple-500/30 bg-neutral-950 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">How to Earn Realm XP</h3>
                        <p className="text-xs text-neutral-400">Everything that awards experience points</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs text-neutral-300">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <span>Read Chapter (50%+ progress)</span>
                        <strong className="text-purple-300">+20 XP</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <span>Daily Login & Reading Streak</span>
                        <strong className="text-amber-400">+10 to +50 XP / day</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <span>Unlock Achievements</span>
                        <strong className="text-emerald-400">+100 to +500 XP</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <span>Rank Multiplier Active</span>
                        <strong className="text-amber-300">Up to 3.0x Multiplier</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Retention Payout Schedule */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-neutral-950 via-amber-950/20 to-neutral-950 p-6 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Gift className="h-5 w-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Weekly Retention Payout</h3>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                    Every Sunday at 23:59 UTC, an automated snapshot of the leaderboard is taken. Any user who has successfully held their rank tier for at least 5 consecutive days is awarded a bonus weekly stipend of Realm Points and receives a 7-day extended streak shield!
                  </p>
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* ─── Rewards Dialog Modal ────────────────────────────────────────── */}
      <Dialog open={rewardsModalOpen} onOpenChange={setRewardsModalOpen}>
        <DialogContent className="max-w-2xl bg-neutral-950 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-white">
              <Gift className="h-5 w-5 text-amber-400" />
              Season 1 Rank Rewards
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Rewards are distributed at the end of each season cycle to all hunters who maintain their rank tiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            {currentUserStanding && (
              <div className="rounded-xl bg-purple-950/30 border border-purple-500/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Your Current Projected Reward:</span>
                  <Badge variant="outline" className={`text-3xs font-extrabold uppercase ${currentUserStanding.tier.badgeColor}`}>
                    {currentUserStanding.tier.name}
                  </Badge>
                </div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentUserStanding.tier.title}</span>
                  <span className="text-xs font-normal text-amber-300">({currentUserStanding.tier.seasonPoints} Points)</span>
                </h4>
                <p className="text-xs text-neutral-300">
                  Holds {currentUserStanding.tier.xpMultiplier} and {currentUserStanding.tier.exclusiveFrame}.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Tier Prizes at Season End</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {RANK_TIERS.slice(0, 4).map((tier) => (
                  <div key={tier.id} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{tier.name}</span>
                      <span className="text-2xs text-amber-400 font-mono font-bold">{tier.seasonPoints} pts</span>
                    </div>
                    <p className="text-3xs text-neutral-400">{tier.exclusiveFrame}</p>
                    <p className="text-2xs text-emerald-400 font-semibold">{tier.xpMultiplier}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Top 3 Podium Card Component ────────────────────────────────────────────

function PodiumCard({
  user,
  rank,
  label,
  tierName,
  badgeColor,
  glowColor,
  isFirstPlace = false,
  activeTab,
}: {
  user: LeaderboardUser;
  rank: number;
  label: string;
  tierName: string;
  badgeColor: string;
  glowColor: string;
  isFirstPlace?: boolean;
  activeTab: "exp" | "streak";
}) {
  const heightClass = isFirstPlace
    ? "h-80 md:h-88 border-amber-500/60 bg-gradient-to-t from-amber-950/40 via-neutral-950 to-neutral-900 md:order-2"
    : rank === 2
    ? "h-72 md:h-76 border-slate-400/40 bg-gradient-to-t from-slate-900/30 via-neutral-950 to-neutral-900 md:order-1"
    : "h-68 md:h-72 border-amber-800/40 bg-gradient-to-t from-amber-950/20 via-neutral-950 to-neutral-900 md:order-3";

  return (
    <div
      className={`rounded-2xl border ${heightClass} p-5 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
      style={{
        boxShadow: `0 0 30px -5px ${glowColor}`,
      }}
    >
      {/* Crown for #1 */}
      {isFirstPlace && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <span className="text-2xl animate-bounce">👑</span>
        </div>
      )}

      {/* Top Tag */}
      <div className="w-full flex items-center justify-between pt-1">
        <Badge variant="outline" className={`text-3xs uppercase font-black tracking-wider py-0.5 px-2 ${badgeColor}`}>
          #{rank} • {label}
        </Badge>
        <span className="text-3xs text-purple-400 font-bold uppercase">
          {tierName}
        </span>
      </div>

      {/* Center Avatar & Info */}
      <div className="flex flex-col items-center gap-2">
        <Link to="/user/$username" params={{ username: user.username }}>
          <LeaderboardAvatar
            avatarUrl={user.avatar_url}
            avatarFrame={user.avatar_frame}
            accentColor={user.accent_color}
            username={user.username}
            size={isFirstPlace ? 76 : 64}
            rank={rank}
          />
        </Link>

        <div>
          <Link
            to="/user/$username"
            params={{ username: user.username }}
            className="font-black text-base sm:text-lg text-white hover:text-purple-400 transition-colors block truncate max-w-[180px]"
          >
            {user.username}
          </Link>
          <p className="text-2xs text-purple-300 font-bold">
            Level {user.user_level} Cultivator
          </p>
        </div>
      </div>

      {/* Bottom Pedestal Stat */}
      <div className="w-full rounded-xl bg-black/60 border border-white/10 p-2.5 backdrop-blur-md">
        {activeTab === "streak" ? (
          <div>
            <span className="font-mono text-lg font-black text-amber-400">🔥 {user.reading_streak || 0}</span>
            <span className="text-3xs uppercase text-neutral-400 block tracking-wider font-semibold">Day Streak</span>
          </div>
        ) : (
          <div>
            <span className="font-mono text-lg font-black text-white">{(user.experience_points || 0).toLocaleString()}</span>
            <span className="text-3xs uppercase text-purple-400 block tracking-wider font-bold">Experience Points</span>
          </div>
        )}
      </div>
    </div>
  );
}
