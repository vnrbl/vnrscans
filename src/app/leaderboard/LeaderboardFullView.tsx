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
  ArrowRight,
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
  badgeClass: string;
  borderClass: string;
  textClass: string;
  multiplier: string;
  seasonPoints: number;
  exclusiveFrame: string;
  perks: string[];
};

// ─── Cultivation Realm Tiers (Refined Site Dark Theme) ─────────────────────

export const RANK_TIERS: LeaderboardTier[] = [
  {
    id: "dao-ancestor",
    name: "Primordial Dao Ancestor (道祖)",
    title: "Supreme Heavenly Dao Ancestor",
    minRank: 1,
    maxRank: 3,
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-300",
    multiplier: "+300% Qi Gathering",
    seasonPoints: 10000,
    exclusiveFrame: "Celestial Dao Ancestor (Golden Aura)",
    perks: [
      "Exclusive 'Supreme Heavenly Dao Ancestor' Sovereign Title",
      "Primordial Dao Crown Frame & Shimmering Aura",
      "+300% Spiritual Qi Gathering Speed on all chapter reads",
      "Permanent Induction into the Heavenly Dao Pavilion Hall of Fame",
      "Golden Crown & Gilded Name across all discussions",
      "3x Free Dao Heart Shields per cycle (prevents streak decay)",
      "10,000 Realm Points granted at Season End",
    ],
  },
  {
    id: "immortal-sovereign",
    name: "Immortal Sovereign (仙尊)",
    title: "Nine Heavens Sovereign",
    minRank: 4,
    maxRank: 10,
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-300",
    multiplier: "+200% Qi Gathering",
    seasonPoints: 5000,
    exclusiveFrame: "Nine Heavens Sovereign Frame",
    perks: [
      "Exclusive 'Nine Heavens Sovereign' Title",
      "Nine Heavens Violet Sovereign Avatar Frame",
      "+200% Spiritual Qi Gathering Speed on all chapter reads",
      "Sovereign Dragon Badge on comments",
      "2x Free Dao Heart Shields per cycle",
      "5,000 Realm Points granted at Season End",
    ],
  },
  {
    id: "void-shattering",
    name: "Void Shattering Sovereign (碎虚)",
    title: "Void Monarch",
    minRank: 11,
    maxRank: 25,
    badgeClass: "bg-neutral-800/80 text-neutral-200 border-neutral-700",
    borderClass: "border-neutral-700/60",
    textClass: "text-neutral-200",
    multiplier: "+150% Qi Gathering",
    seasonPoints: 2500,
    exclusiveFrame: "Void Crystal Prismatic Frame",
    perks: [
      "Exclusive 'Void Monarch' Title",
      "Void Crystal Prismatic Avatar Frame",
      "+150% Spiritual Qi Gathering Speed",
      "Spatial Rune Emblem on Profile",
      "1x Free Dao Heart Shield per cycle",
      "2,500 Realm Points granted at Season End",
    ],
  },
  {
    id: "nascent-soul",
    name: "Nascent Soul Elder (元婴)",
    title: "Domain Elder",
    minRank: 26,
    maxRank: 50,
    badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-800",
    borderClass: "border-neutral-800",
    textClass: "text-neutral-300",
    multiplier: "+100% Qi Gathering",
    seasonPoints: 1000,
    exclusiveFrame: "Nascent Lotus Aura Frame",
    perks: [
      "Exclusive 'Domain Elder' Title",
      "Nascent Lotus Aura Avatar Frame",
      "+100% Spiritual Qi Gathering Speed",
      "1,000 Realm Points granted at Season End",
    ],
  },
  {
    id: "core-formation",
    name: "Core Formation Disciple (结丹)",
    title: "Inner Court Adept",
    minRank: 51,
    maxRank: 100,
    badgeClass: "bg-neutral-900 text-neutral-400 border-neutral-800",
    borderClass: "border-neutral-800",
    textClass: "text-neutral-400",
    multiplier: "+50% Qi Gathering",
    seasonPoints: 500,
    exclusiveFrame: "Golden Core Crest Frame",
    perks: [
      "Exclusive 'Inner Court Adept' Title",
      "+50% Spiritual Qi Gathering Speed",
      "500 Realm Points granted at Season End",
    ],
  },
  {
    id: "qi-condensation",
    name: "Qi Condensation Aspirant (炼气)",
    title: "Outer Disciple",
    minRank: 101,
    maxRank: 999999,
    badgeClass: "bg-neutral-950 text-neutral-500 border-neutral-800",
    borderClass: "border-neutral-850",
    textClass: "text-neutral-500",
    multiplier: "Standard Qi Gathering",
    seasonPoints: 100,
    exclusiveFrame: "Dao Initiate Wooden Frame",
    perks: [
      "Standard Qi Gathering on all chapter reads",
      "Participation in Dao Heavenly Rankings",
      "100 Realm Points granted at Season End",
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

// Check if user qualifies as Primordial Dao Ancestor (Admin vnr610 or level 100+)
function isDaoAncestor(username: string, level: number): boolean {
  return username.toLowerCase() === "vnr610" || level >= 100;
}

function formatCultivationLevel(username: string, level: number): string {
  if (isDaoAncestor(username, level)) {
    return "Lv. ∞ (Boundless Dao)";
  }
  return `Lv. ${level}`;
}

// ─── Professional Avatar Component with Profile-Identical Animated Frames ───

const getAvatarFrameStyles = (frame: string, accent: string) => {
  switch (frame) {
    case "neon":
      return { boxShadow: "0 0 16px rgba(168, 85, 247, 0.5), inset 0 0 8px rgba(6, 182, 212, 0.4)" };
    case "gold":
      return { boxShadow: "0 0 16px rgba(212, 175, 55, 0.55), inset 0 0 8px rgba(255, 255, 255, 0.3)" };
    case "cyber":
      return { boxShadow: "0 0 16px rgba(6, 182, 212, 0.5), inset 0 0 8px rgba(192, 132, 252, 0.3)" };
    case "fire":
      return { boxShadow: "0 0 16px rgba(239, 68, 68, 0.55), inset 0 0 8px rgba(249, 115, 22, 0.4)" };
    case "sakura":
      return { boxShadow: "0 0 16px rgba(244, 114, 182, 0.55), inset 0 0 8px rgba(253, 164, 189, 0.4)" };
    case "shadow":
      return { boxShadow: "0 0 16px rgba(99, 102, 241, 0.55), inset 0 0 10px rgba(30, 27, 75, 0.45)" };
    case "qi":
      return { boxShadow: "0 0 16px rgba(16, 185, 129, 0.55), inset 0 0 8px rgba(251, 191, 36, 0.3)" };
    case "asura":
      return { boxShadow: "0 0 20px rgba(239, 68, 68, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.85)" };
    case "system":
      return { boxShadow: "0 0 18px rgba(6, 182, 212, 0.6), inset 0 0 8px rgba(6, 182, 212, 0.4)" };
    case "abyss":
      return { boxShadow: "0 0 20px rgba(217, 70, 239, 0.65), inset 0 0 10px rgba(74, 4, 78, 0.55)" };
    case "glitch":
      return { boxShadow: "0 0 18px rgba(239, 68, 68, 0.6), inset 0 0 8px rgba(6, 182, 212, 0.4)" };
    case "divine":
      return { boxShadow: "0 0 20px rgba(252, 211, 77, 0.65), inset 0 0 8px rgba(255, 255, 255, 0.4)" };
    case "creator":
      return { boxShadow: `0 0 20px ${accent}, inset 0 0 10px ${accent}` };
    case "silver":
      return { boxShadow: "0 0 14px rgba(203, 213, 225, 0.55), inset 0 0 8px rgba(255, 255, 255, 0.3)" };
    case "bronze":
      return { boxShadow: "0 0 14px rgba(217, 119, 6, 0.55), inset 0 0 8px rgba(253, 230, 138, 0.25)" };
    case "sovereign":
      return { boxShadow: "0 0 16px rgba(139, 92, 246, 0.55), inset 0 0 8px rgba(192, 132, 252, 0.3)" };
    case "none":
    default:
      return { boxShadow: `0 0 10px ${accent}25` };
  }
};

const getFrameSmokeColor = (frame: string, accent: string) => {
  switch (frame) {
    case "neon": return "#A855F7";
    case "gold": return "#ffd700";
    case "cyber": return "#06B6D4";
    case "fire": return "#EF4444";
    case "sakura": return "#F472B6";
    case "shadow": return "#6366F1";
    case "qi": return "#10B981";
    case "asura": return "#EF4444";
    case "system": return "#06B6D4";
    case "abyss": return "#D946EF";
    case "glitch": return "#EF4444";
    case "divine": return "#FCD34D";
    case "silver": return "#CBD5E1";
    case "bronze": return "#D97706";
    case "sovereign": return "#8B5CF6";
    case "creator": return accent;
    default: return accent;
  }
};

export function LeaderboardAvatar({
  avatarUrl,
  avatarFrame,
  accentColor = "#8B5CF6",
  username,
  size = 40,
  rank,
}: {
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  accentColor?: string | null;
  username: string;
  size?: number;
  rank?: number;
}) {
  const effectiveFrame = useMemo(() => {
    if (avatarFrame && avatarFrame !== "none") {
      return avatarFrame.toLowerCase();
    }
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    if (rank && rank <= 10) return "sovereign";
    return "none";
  }, [avatarFrame, rank]);

  const hasFrame = effectiveFrame !== "none";
  const frameStyles = getAvatarFrameStyles(effectiveFrame, accentColor || "#8B5CF6");
  const smokeColor = getFrameSmokeColor(effectiveFrame, accentColor || "#8B5CF6");

  return (
    <div
      className="relative flex-shrink-0 rounded-full flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        ...frameStyles,
        background: !hasFrame ? (accentColor || "#8B5CF6") : undefined,
        padding: size >= 50 ? "3px" : "2px",
      }}
    >
      {/* Smoke wisps orbiting the avatar frame */}
      {hasFrame && size >= 40 && (
        <div className="absolute inset-0 pointer-events-none z-[25]">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${smokeColor}50, transparent)`,
              animation: "avatarSmokeOrbit 6s linear infinite",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
            style={{
              background: `radial-gradient(circle, ${smokeColor}40, transparent)`,
              animation: "avatarSmokeOrbit 8s linear infinite 2s",
            }}
          />
        </div>
      )}

      {/* Layer 1: Frame specific dual-rotating animated rings */}
      {effectiveFrame === "neon" && (
        <div className="absolute inset-0 rounded-full overflow-hidden animate-[lightningFlicker_6s_ease-in-out_infinite]">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-[rotationCW_4s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full bg-neutral-950 z-5" />
          <div className="absolute inset-[2px] rounded-full overflow-hidden z-6">
            <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#EC4899,#06B6D4,#A855F7,#EC4899)] animate-[rotationCCW_3s_linear_infinite]" />
          </div>
        </div>
      )}

      {(effectiveFrame === "gold" || rank === 1) && (
        <>
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99] animate-[rotationCW_10s_linear_infinite]" />
          <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#ffeb99] via-[#ffd700] to-[#aa7c11] animate-[rotationCCW_8s_linear_infinite]" />
        </>
      )}

      {effectiveFrame === "silver" && (
        <>
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#475569] via-[#cbd5e1] to-[#ffffff] animate-[rotationCW_10s_linear_infinite]" />
          <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#ffffff] via-[#cbd5e1] to-[#64748b] animate-[rotationCCW_8s_linear_infinite]" />
        </>
      )}

      {effectiveFrame === "bronze" && (
        <>
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#78350f] via-[#d97706] to-[#fde68a] animate-[rotationCW_10s_linear_infinite]" />
          <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#fde68a] via-[#d97706] to-[#92400e] animate-[rotationCCW_8s_linear_infinite]" />
        </>
      )}

      {effectiveFrame === "sovereign" && (
        <>
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#581c87] via-[#a855f7] to-[#e9d5ff] animate-[rotationCW_8s_linear_infinite]" />
          <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#e9d5ff] via-[#c084fc] to-[#7e22ce] animate-[rotationCCW_7s_linear_infinite]" />
        </>
      )}

      {effectiveFrame === "cyber" && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-[rotationCW_6s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full border border-dashed border-cyan-400/40 animate-[rotationCCW_12s_linear_infinite] z-5" />
        </div>
      )}

      {effectiveFrame === "fire" && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-[rotationCW_3s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full overflow-hidden z-5">
            <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#7f1d1d,#f97316,#ef4444,#7f1d1d)] animate-[rotationCCW_4s_linear_infinite]" />
          </div>
        </div>
      )}

      {effectiveFrame === "sakura" && (
        <>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9] animate-[smoothBreath_4s_ease-in-out_infinite]" />
          <div className="absolute inset-[2px] rounded-full bg-gradient-to-bl from-[#E879F9] via-[#F472B6] to-[#FDA4AF] animate-[rotationCW_8s_linear_infinite]" />
        </>
      )}

      {effectiveFrame === "shadow" && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-[rotationCW_5s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full overflow-hidden z-5">
            <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#1e1b4b,#06b6d4,#4f46e5,#1e1b4b)] animate-[rotationCCW_6s_linear_infinite]" />
          </div>
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[shadowWispMove_4s_ease-in-out_infinite] z-6" />
        </div>
      )}

      {effectiveFrame === "qi" && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-[rotationCW_6s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full border border-emerald-400/40 bg-emerald-950/20 animate-[runeJadePulse_8s_linear_infinite] z-5" />
        </div>
      )}

      {effectiveFrame === "asura" && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000] animate-[asuraRage_2.5s_ease-in-out_infinite] overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,transparent,#7f1d1d,transparent,#ef4444)] animate-[rotationCW_4s_linear_infinite] opacity-80" />
        </div>
      )}

      {effectiveFrame === "system" && (
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-950/20 animate-[asuraRage_4s_ease-in-out_infinite] overflow-hidden">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,rgba(6,182,212,0.25),transparent_40%,transparent)] animate-[rotationCW_3s_linear_infinite]" />
        </div>
      )}

      {effectiveFrame === "abyss" && (
        <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden animate-[abyssVoidGlow_5s_ease-in-out_infinite]">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#D946EF,#4A044E,#3B0764,#D946EF)] animate-[rotationCW_8s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full border border-purple-500/30 bg-purple-950/20 animate-[rotationCCW_10s_linear_infinite] z-5" />
        </div>
      )}

      {effectiveFrame === "glitch" && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500/40 bg-slate-950/20 overflow-hidden animate-[glitchFlicker_4s_linear_infinite]">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,#06b6d4,#ef4444)] animate-[rotationCW_4s_linear_infinite]" />
        </div>
      )}

      {effectiveFrame === "divine" && (
        <div className="absolute inset-0 rounded-full bg-amber-50/10 overflow-hidden animate-[divineHalo_4s_ease-in-out_infinite]">
          <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#FCD34D,#FFFFFF,#FFFBEB,#FCD34D)] animate-[rotationCW_6s_linear_infinite]" />
          <div className="absolute inset-[2px] rounded-full bg-gradient-to-bl from-[#FFFBEB] via-[#FCD34D] to-[#FFFFFF] animate-[rotationCCW_5s_linear_infinite]" />
        </div>
      )}

      {effectiveFrame === "creator" && (
        <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden" style={{
          boxShadow: `0 0 20px ${accentColor}, inset 0 0 10px ${accentColor}`,
        }}>
          <div className="absolute inset-[-55%] rounded-full" style={{
            background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor}80, transparent, ${accentColor})`,
            animation: "rotationCW 4s linear infinite",
          }} />
          <div className="absolute inset-[-55%] rounded-full" style={{
            background: `conic-gradient(from 180deg, ${accentColor}dd, transparent, #ffffffaa, transparent, ${accentColor}dd)`,
            animation: "rotationCCW 6s linear infinite",
          }} />
        </div>
      )}

      {/* Layer 2: Inner mask background to shape the ring */}
      {hasFrame && (
        <div
          className="absolute rounded-full bg-neutral-950 z-10"
          style={{
            inset: effectiveFrame === "creator" ? (size >= 50 ? "4px" : "3px") : (size >= 50 ? "3px" : "2px"),
          }}
        />
      )}

      {/* Layer 3: Avatar image or initials */}
      <div className="h-full w-full rounded-full overflow-hidden relative z-10 flex items-center justify-center bg-neutral-900">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover rounded-full"
            loading="lazy"
          />
        ) : (
          <span className="text-[11px] font-bold text-white font-sans uppercase">
            {username?.slice(0, 2) || "?"}
          </span>
        )}
      </div>

      {/* Decorative badges (crown, cyber brackets, s-rank, sparkles) */}
      {(effectiveFrame === "gold" || effectiveFrame === "creator" || rank === 1) && (
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-amber-400 z-20 pointer-events-none select-none"
          style={{
            fontSize: size >= 50 ? "14px" : "9px",
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
          }}
        >
          👑
        </div>
      )}

      {effectiveFrame === "cyber" && (
        <div className="absolute inset-[-1px] pointer-events-none z-20" style={{ animation: "glitchFlicker 6s infinite" }}>
          <div className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-cyan-400 rounded-tl-sm" style={{ boxShadow: "0 0 3px cyan" }} />
          <div className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-cyan-400 rounded-tr-sm" style={{ boxShadow: "0 0 3px cyan" }} />
          <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-cyan-400 rounded-bl-sm" style={{ boxShadow: "0 0 3px cyan" }} />
          <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-cyan-400 rounded-br-sm" style={{ boxShadow: "0 0 3px cyan" }} />
        </div>
      )}

      {effectiveFrame === "divine" && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-yellow-300 z-20 animate-pulse pointer-events-none select-none" style={{ fontSize: "8px" }}>
          ✨
        </div>
      )}

      {effectiveFrame === "system" && (
        <div
          className="absolute -top-1 -right-1 z-30 bg-slate-950 border border-cyan-400 text-cyan-400 text-[6px] font-black px-0.5 rounded leading-tight pointer-events-none select-none"
          style={{ boxShadow: "0 0 4px rgba(6,182,212,0.7)" }}
        >
          S
        </div>
      )}
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

  // Fetch real users directly from Supabase profiles
  const leaderboardQuery = useQuery({
    queryKey: ["user-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, user_level, experience_points, reading_streak, avatar_url, avatar_frame, accent_color, is_vip, created_at")
        .order("experience_points", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("[leaderboard] Error fetching profiles:", error);
        return [];
      }

      setLastUpdatedTime(new Date());
      return (data || []) as LeaderboardUser[];
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  });

  // Real-time Supabase postgres_changes subscription
  useEffect(() => {
    const channel = supabase
      .channel("profiles-leaderboard-sync")
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

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["user-leaderboard"] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

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
    return [...allUsers].sort((a, b) => {
      const xpDiff = (b.experience_points || 0) - (a.experience_points || 0);
      if (xpDiff !== 0) return xpDiff;
      return (b.user_level || 1) - (a.user_level || 1);
    });
  }, [allUsers, activeTab]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return sortedList;
    const q = searchQuery.toLowerCase().trim();
    return sortedList.filter((u) => u.username.toLowerCase().includes(q));
  }, [sortedList, searchQuery]);

  const podiumUsers = useMemo(() => {
    return sortedList.slice(0, 3);
  }, [sortedList]);

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
    <div className="min-h-screen bg-black text-neutral-200 pb-20">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 max-w-6xl py-8 space-y-8">
        {/* ─── Header: SpaceX-inspired Industrial Typography ─────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-3xs font-mono font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
              <span className="text-3xs text-neutral-500 font-mono">
                {lastUpdatedTime.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase font-heading">
              Cultivation Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl font-normal font-sans">
              Official Heavenly Dao rankings of active readers. Accumulate Spiritual Qi through chapter progress to break through realms and claim seasonal rewards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || leaderboardQuery.isFetching}
              className="border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 hover:text-white text-neutral-300 text-xs gap-1.5 h-8 px-3 rounded-lg cursor-pointer font-sans"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-purple-400" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRewardsModalOpen(true)}
              className="border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 text-xs font-semibold gap-1.5 h-8 px-3 rounded-lg cursor-pointer font-sans"
            >
              <Gift className="h-3.5 w-3.5 text-purple-400" />
              <span>Tier Rewards</span>
            </Button>
          </div>
        </div>

        {/* ─── Season Cycle Banner (Clean & Architectural) ───────────────── */}
        <div className="rounded-xl border border-white/10 bg-neutral-950 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-3xs font-mono font-bold uppercase tracking-widest text-purple-400">
                Season 1 • Heavenly Dao Ascension
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-3xs font-mono text-neutral-400 uppercase">
                Active Cycle
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-heading">
              Cycle Rank Lock & Seasonal Payout
            </h2>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed font-sans">
              Cultivators holding higher realms at the cycle boundary permanently secure exclusive cosmetic frames, profile titles, and bonus Realm Points.
            </p>
          </div>

          {/* Clean Monospace Countdown Timer */}
          <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg px-4 py-2.5 shrink-0 self-start lg:self-auto">
            <div className="flex flex-col items-center min-w-10">
              <span className="font-mono text-lg font-bold text-white tabular-nums">
                {countdown.days}
              </span>
              <span className="text-3xs font-mono uppercase tracking-widest text-neutral-500">
                Days
              </span>
            </div>
            <span className="font-mono text-neutral-700 text-sm">:</span>
            <div className="flex flex-col items-center min-w-10">
              <span className="font-mono text-lg font-bold text-white tabular-nums">
                {String(countdown.hours).padStart(2, "0")}
              </span>
              <span className="text-3xs font-mono uppercase tracking-widest text-neutral-500">
                Hours
              </span>
            </div>
            <span className="font-mono text-neutral-700 text-sm">:</span>
            <div className="flex flex-col items-center min-w-10">
              <span className="font-mono text-lg font-bold text-white tabular-nums">
                {String(countdown.minutes).padStart(2, "0")}
              </span>
              <span className="text-3xs font-mono uppercase tracking-widest text-neutral-500">
                Mins
              </span>
            </div>
            <span className="font-mono text-neutral-700 text-sm">:</span>
            <div className="flex flex-col items-center min-w-10">
              <span className="font-mono text-lg font-bold text-purple-400 tabular-nums">
                {String(countdown.seconds).padStart(2, "0")}
              </span>
              <span className="text-3xs font-mono uppercase tracking-widest text-neutral-500">
                Secs
              </span>
            </div>
          </div>
        </div>

        {/* ─── Current User Standing Dock ───────────────────────────────── */}
        {user ? (
          currentUserStanding && currentUserStanding.user ? (
            <div className="rounded-xl border border-purple-500/30 bg-[#0a0a0e] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <LeaderboardAvatar
                    avatarUrl={currentUserStanding.user.avatar_url}
                    avatarFrame={currentUserStanding.user.avatar_frame}
                    accentColor={currentUserStanding.user.accent_color}
                    username={currentUserStanding.user.username}
                    size={44}
                    rank={currentUserStanding.rank || undefined}
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-black border border-white/20 text-3xs font-mono font-bold text-white">
                    #{currentUserStanding.rank}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">
                      {currentUserStanding.user.username}
                    </span>
                    <span className="text-3xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-neutral-300 bg-white/5">
                      {isDaoAncestor(currentUserStanding.user.username, currentUserStanding.user.user_level)
                        ? "Primordial Dao Ancestor"
                        : currentUserStanding.tier.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {formatCultivationLevel(currentUserStanding.user.username, currentUserStanding.user.user_level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 flex-wrap font-mono">
                    <span>
                      Qi: <strong className="text-white font-bold">
                        {isDaoAncestor(currentUserStanding.user.username, currentUserStanding.user.user_level)
                          ? "∞ (Infinite Qi)"
                          : (currentUserStanding.user.experience_points || 0).toLocaleString()}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Streak: <strong className="text-amber-400 font-bold">{currentUserStanding.user.reading_streak || 0}d</strong>
                    </span>
                    <span>•</span>
                    <span className="text-neutral-400">{currentUserStanding.tier.multiplier}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                {currentUserStanding.xpToNextRank > 0 ? (
                  <div className="text-right text-xs">
                    <p className="text-neutral-500 font-mono text-3xs uppercase">To Next Rank</p>
                    <p className="font-mono font-bold text-purple-300">
                      +{currentUserStanding.xpToNextRank.toLocaleString()} Qi
                    </p>
                  </div>
                ) : (
                  <div className="text-right text-xs">
                    <p className="text-amber-400 font-bold">Apex Rank #1</p>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRewardsModalOpen(true)}
                  className="border-white/10 hover:border-purple-500/40 bg-neutral-900 text-xs h-8 px-3 rounded-lg"
                >
                  View Perks
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-neutral-950 p-4 flex items-center justify-between text-xs text-neutral-400">
              <span>Read chapters to gain Spiritual Qi and establish your place on the Heavenly Leaderboard.</span>
              <Button size="sm" asChild variant="outline" className="text-xs h-8 border-white/10 bg-neutral-900">
                <Link to="/browse">Browse Series</Link>
              </Button>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-white/10 bg-neutral-950 p-4 flex items-center justify-between text-xs text-neutral-400">
            <span>Sign in to save chapter progress, earn Spiritual Qi, and compete on the seasonal leaderboard.</span>
            <Button size="sm" asChild className="text-xs h-8 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        )}

        {/* ─── Navigation Tabs & Search ──────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-white/10 rounded-lg overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("exp")}
                className={`text-xs px-3.5 py-1.5 rounded font-sans font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "exp"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Spiritual Qi
              </button>
              <button
                onClick={() => setActiveTab("streak")}
                className={`text-xs px-3.5 py-1.5 rounded font-sans font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "streak"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Dao Streak
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`text-xs px-3.5 py-1.5 rounded font-sans font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "rewards"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Realm Tiers
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className={`text-xs px-3.5 py-1.5 rounded font-sans font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "rules"
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Dao Rules
              </button>
            </div>

            {/* Clean Monospace Search Bar */}
            {(activeTab === "exp" || activeTab === "streak") && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Filter cultivator name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs font-mono bg-neutral-950 border-white/10 focus-visible:ring-purple-500 rounded-lg text-white placeholder:text-neutral-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-3xs font-mono text-neutral-400 hover:text-white"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── TAB 1 & 2: LEADERBOARD CONTENT ───────────────────────────── */}
          {(activeTab === "exp" || activeTab === "streak") && (
            <div className="space-y-6">
              {/* Top 3 Podium: Clean Architectural Showcases */}
              {!searchQuery.trim() && podiumUsers.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                  {/* Rank 2 (Silver) */}
                  <div className="rounded-xl border border-zinc-500/30 bg-[#09090b] p-5 flex flex-col justify-between items-center text-center space-y-4 md:order-1 hover:border-zinc-400/50 transition-all duration-300">
                    <div className="w-full flex items-center justify-between text-3xs font-mono font-bold uppercase text-zinc-400">
                      <span>#2 Silver Peak</span>
                      <span>Elder</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <Link to="/user/$username" params={{ username: podiumUsers[1].username }}>
                        <LeaderboardAvatar
                          avatarUrl={podiumUsers[1].avatar_url}
                          avatarFrame={podiumUsers[1].avatar_frame}
                          accentColor={podiumUsers[1].accent_color}
                          username={podiumUsers[1].username}
                          size={56}
                          rank={2}
                        />
                      </Link>
                      <div>
                        <Link
                          to="/user/$username"
                          params={{ username: podiumUsers[1].username }}
                          className="font-bold text-base text-white hover:text-purple-400 transition-colors block truncate max-w-[160px]"
                        >
                          {podiumUsers[1].username}
                        </Link>
                        <p className="text-3xs font-mono text-neutral-400 mt-0.5">
                          {formatCultivationLevel(podiumUsers[1].username, podiumUsers[1].user_level)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full rounded bg-black/60 border border-white/5 py-2 px-3">
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {activeTab === "streak"
                          ? `${podiumUsers[1].reading_streak || 0} Days Streak`
                          : isDaoAncestor(podiumUsers[1].username, podiumUsers[1].user_level)
                          ? "∞ Qi"
                          : `${(podiumUsers[1].experience_points || 0).toLocaleString()} Qi`}
                      </span>
                    </div>
                  </div>

                  {/* Rank 1 (Gold - Center) */}
                  <div className="rounded-xl border border-amber-500/40 bg-[#0a0a0c] p-6 flex flex-col justify-between items-center text-center space-y-4 md:order-2 hover:border-amber-400/60 transition-all duration-300 shadow-lg shadow-amber-500/5">
                    <div className="w-full flex items-center justify-between text-3xs font-mono font-bold uppercase text-amber-400">
                      <span className="flex items-center gap-1">
                        <Crown className="h-3 w-3" /> #1 Dao Apex
                      </span>
                      <span>Sovereign</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2.5">
                      <Link to="/user/$username" params={{ username: podiumUsers[0].username }}>
                        <LeaderboardAvatar
                          avatarUrl={podiumUsers[0].avatar_url}
                          avatarFrame={podiumUsers[0].avatar_frame}
                          accentColor={podiumUsers[0].accent_color}
                          username={podiumUsers[0].username}
                          size={68}
                          rank={1}
                        />
                      </Link>
                      <div>
                        <Link
                          to="/user/$username"
                          params={{ username: podiumUsers[0].username }}
                          className="font-black text-lg text-white hover:text-amber-300 transition-colors block truncate max-w-[180px]"
                        >
                          {podiumUsers[0].username}
                        </Link>
                        <p className="text-3xs font-mono text-amber-400/90 font-bold mt-0.5">
                          {formatCultivationLevel(podiumUsers[0].username, podiumUsers[0].user_level)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full rounded bg-black/80 border border-amber-500/20 py-2.5 px-3">
                      <span className="font-mono text-base font-bold text-amber-300 tabular-nums">
                        {activeTab === "streak"
                          ? `🔥 ${podiumUsers[0].reading_streak || 0} Days Streak`
                          : isDaoAncestor(podiumUsers[0].username, podiumUsers[0].user_level)
                          ? "∞ Qi (Boundless Dao)"
                          : `${(podiumUsers[0].experience_points || 0).toLocaleString()} Qi`}
                      </span>
                    </div>
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="rounded-xl border border-amber-800/30 bg-[#09090b] p-5 flex flex-col justify-between items-center text-center space-y-4 md:order-3 hover:border-amber-700/50 transition-all duration-300">
                    <div className="w-full flex items-center justify-between text-3xs font-mono font-bold uppercase text-amber-600">
                      <span>#3 Bronze Peak</span>
                      <span>Elder</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <Link to="/user/$username" params={{ username: podiumUsers[2].username }}>
                        <LeaderboardAvatar
                          avatarUrl={podiumUsers[2].avatar_url}
                          avatarFrame={podiumUsers[2].avatar_frame}
                          accentColor={podiumUsers[2].accent_color}
                          username={podiumUsers[2].username}
                          size={56}
                          rank={3}
                        />
                      </Link>
                      <div>
                        <Link
                          to="/user/$username"
                          params={{ username: podiumUsers[2].username }}
                          className="font-bold text-base text-white hover:text-purple-400 transition-colors block truncate max-w-[160px]"
                        >
                          {podiumUsers[2].username}
                        </Link>
                        <p className="text-3xs font-mono text-neutral-400 mt-0.5">
                          {formatCultivationLevel(podiumUsers[2].username, podiumUsers[2].user_level)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full rounded bg-black/60 border border-white/5 py-2 px-3">
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {activeTab === "streak"
                          ? `${podiumUsers[2].reading_streak || 0} Days Streak`
                          : isDaoAncestor(podiumUsers[2].username, podiumUsers[2].user_level)
                          ? "∞ Qi"
                          : `${(podiumUsers[2].experience_points || 0).toLocaleString()} Qi`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Rankings Data Table (SpaceX Strict Layout) ───────────── */}
              <div className="rounded-xl border border-white/10 bg-neutral-950 overflow-hidden shadow-xl">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-black text-3xs font-mono uppercase tracking-widest text-neutral-500 border-b border-white/10">
                  <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
                  <div className="col-span-6 sm:col-span-5 md:col-span-4">Cultivator</div>
                  <div className="hidden md:block md:col-span-3">Realm Standing</div>
                  <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                    {activeTab === "streak" ? "Dao Streak" : "Spiritual Qi"}
                  </div>
                  <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                    {activeTab === "streak" ? "Total Qi" : "Level"}
                  </div>
                </div>

                {/* Table Body */}
                {filteredList.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 font-mono text-xs">
                    No cultivators found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredList.map((rowUser, index) => {
                      const originalRank = sortedList.findIndex((u) => u.id === rowUser.id) + 1;
                      const tier = getTierForRank(originalRank);
                      const isCurrentUser = user && user.id === rowUser.user_id;

                      return (
                        <div
                          key={rowUser.id}
                          className={`grid grid-cols-12 gap-2 items-center px-4 py-3 text-xs transition-colors hover:bg-white/[0.02] ${
                            isCurrentUser ? "bg-purple-950/20 border-l-2 border-l-purple-500" : ""
                          }`}
                        >
                          {/* Rank Position */}
                          <div className="col-span-2 sm:col-span-1 flex items-center justify-center font-mono font-bold">
                            {originalRank === 1 ? (
                              <span className="text-amber-400 font-black text-sm">#1</span>
                            ) : originalRank === 2 ? (
                              <span className="text-zinc-300 font-bold text-sm">#2</span>
                            ) : originalRank === 3 ? (
                              <span className="text-amber-600 font-bold text-sm">#3</span>
                            ) : (
                              <span className="text-neutral-500 font-mono text-xs">#{originalRank}</span>
                            )}
                          </div>

                          {/* Cultivator Column */}
                          <div className="col-span-6 sm:col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                            <LeaderboardAvatar
                              avatarUrl={rowUser.avatar_url}
                              avatarFrame={rowUser.avatar_frame}
                              accentColor={rowUser.accent_color}
                              username={rowUser.username}
                              size={32}
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
                                  <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    VIP
                                  </span>
                                )}
                                {isCurrentUser && (
                                  <span className="text-[9px] font-mono px-1 rounded bg-purple-600 text-white font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <p className="text-3xs font-mono text-neutral-500 truncate md:hidden">
                                {tier.name}
                              </p>
                            </div>
                          </div>

                          {/* Realm Standing Column (Desktop) */}
                          <div className="hidden md:block md:col-span-3 min-w-0">
                            <span className="text-3xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-neutral-300 bg-white/5">
                              {isDaoAncestor(rowUser.username, rowUser.user_level) ? "Primordial Dao Ancestor" : tier.name}
                            </span>
                          </div>

                          {/* Metric 1 (Qi or Streak) */}
                          <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                            {activeTab === "streak" ? (
                              <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm tabular-nums">
                                {rowUser.reading_streak || 0}d
                              </span>
                            ) : isDaoAncestor(rowUser.username, rowUser.user_level) ? (
                              <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                                ∞ <span className="text-3xs text-amber-400/80">QI</span>
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-white text-xs sm:text-sm tabular-nums">
                                {(rowUser.experience_points || 0).toLocaleString()} <span className="text-3xs text-neutral-500">QI</span>
                              </span>
                            )}
                          </div>

                          {/* Metric 2 (Level / Qi) */}
                          <div className="col-span-2 sm:col-span-3 md:col-span-2 text-right">
                            {activeTab === "streak" ? (
                              <span className="font-mono text-neutral-400 text-xs tabular-nums">
                                {isDaoAncestor(rowUser.username, rowUser.user_level)
                                  ? "∞ Qi"
                                  : `${(rowUser.experience_points || 0).toLocaleString()} Qi`}
                              </span>
                            ) : isDaoAncestor(rowUser.username, rowUser.user_level) ? (
                              <span className="font-mono font-bold text-amber-400 text-xs">
                                Lv. ∞
                              </span>
                            ) : (
                              <span className="font-mono text-neutral-300 text-xs tabular-nums">
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

          {/* ─── TAB 3: REALM TIERS & REWARDS VISUALIZER ────────────────── */}
          {activeTab === "rewards" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Season 1 Realm Tiers & Rewards</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-sans">
                  Cultivators who achieve and maintain higher realm ranks before season conclusion receive exclusive avatar frames, permanent profile titles, Qi gathering multipliers, and bonus Realm Points.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RANK_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border ${tier.borderClass} bg-[#0c0d12] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-purple-500/40 hover:bg-neutral-950 transition-all duration-300 shadow-xl relative overflow-hidden group`}
                  >
                    {/* Ambient subtle glow based on tier */}
                    <div
                      className={`absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl opacity-15 pointer-events-none ${
                        tier.id === "dao-ancestor"
                          ? "bg-amber-400"
                          : tier.id === "immortal-sovereign"
                          ? "bg-purple-500"
                          : tier.id === "void-shattering"
                          ? "bg-cyan-400"
                          : tier.id === "nascent-soul"
                          ? "bg-emerald-400"
                          : "bg-neutral-600"
                      }`}
                    />

                    <div className="space-y-3.5 relative z-10">
                      {/* Top Meta Bar: Guaranteed No Overlap */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border border-white/10 bg-white/5 text-neutral-300">
                          {tier.minRank === 101 ? "Rank 101+" : `Rank #${tier.minRank} – #${tier.maxRank}`}
                        </span>
                        <span className={`inline-flex items-center text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                          {tier.multiplier}
                        </span>
                      </div>

                      {/* Realm Heading & Sovereign Title */}
                      <div>
                        <h4 className="font-heading font-extrabold text-lg text-white tracking-tight leading-snug">
                          {tier.name}
                        </h4>
                        <p className={`text-xs font-semibold mt-1 font-sans ${tier.textClass}`}>
                          {tier.title} • <span className="font-mono text-neutral-400 font-normal">{(tier.seasonPoints || 0).toLocaleString()} Pts</span>
                        </p>
                      </div>

                      {/* Tier Perks & Benefits */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-neutral-400 block">
                          Tier Benefits
                        </span>
                        <ul className="space-y-1.5 font-sans">
                          {tier.perks.slice(0, 4).map((perk, i) => (
                            <li key={i} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-purple-400 font-bold shrink-0 mt-0.5 text-xs">•</span>
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Cosmetic Frame Footer */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-sans relative z-10">
                      <span className="text-neutral-400 font-medium">Cosmetic Reward:</span>
                      <span className="font-semibold text-purple-300 truncate max-w-[180px] text-right" title={tier.exclusiveFrame}>
                        {tier.exclusiveFrame}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 4: DAO RULES & RETENTION ───────────────────────────── */}
          {activeTab === "rules" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dao Heart Decay Card */}
                <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 border border-white/10 text-purple-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                        Dao Heart Decay & Retention
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans">Activity requirements to maintain your rank</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
                    <p>
                      To ensure competitive and genuine rankings, cultivators in the top realms must read at least <strong className="text-white font-semibold">1 chapter every 3 days</strong> to preserve their cultivation base from dissipation.
                    </p>
                    <div className="rounded-xl bg-black/60 border border-white/5 p-3.5 space-y-2.5 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Grace Period:</span>
                        <span className="text-white font-mono font-bold">7 Days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Dissipation Rate:</span>
                        <span className="text-amber-400 font-mono font-bold">-50 Qi / day</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Dao Heart Shield:</span>
                        <span className="text-emerald-400 font-mono font-bold">Absorbs 1 Day</span>
                      </div>
                    </div>
                    <p className="text-neutral-400 text-xs font-sans">
                      Reading any chapter automatically refreshes your activity timer and halts dissipation.
                    </p>
                  </div>
                </div>

                {/* How to Cultivate Card */}
                <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 border border-white/10 text-amber-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                        Qi Gathering Mechanics
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans">Actions that increase your cultivation base</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-neutral-300 font-sans">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                      <span className="text-neutral-300">Read Chapter (50%+ progress)</span>
                      <strong className="text-purple-400 font-mono font-bold text-xs">+20 Qi</strong>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                      <span className="text-neutral-300">Daily Attendance & Streak</span>
                      <strong className="text-amber-400 font-mono font-bold text-xs">+10 to +50 Qi / day</strong>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                      <span className="text-neutral-300">Achievements Unlocked</span>
                      <strong className="text-white font-mono font-bold text-xs">+100 to +500 Qi</strong>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                      <span className="text-neutral-300">Realm Multiplier Active</span>
                      <strong className="text-emerald-400 font-mono font-bold text-xs">Up to 3.0x Speed</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Rewards Dialog Modal ────────────────────────────────────────── */}
      <Dialog open={rewardsModalOpen} onOpenChange={setRewardsModalOpen}>
        <DialogContent className="max-w-xl bg-neutral-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-white uppercase">
              Season 1 Realm Rewards
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Rewards distributed to all cultivators who hold active realm standings at cycle completion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {currentUserStanding && (
              <div className="rounded-lg bg-neutral-900 border border-white/10 p-3.5 space-y-1.5">
                <span className="text-3xs font-mono uppercase text-neutral-500">Your Current Standing</span>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{currentUserStanding.tier.name}</h4>
                  <span className="text-xs font-mono font-bold text-amber-400">{currentUserStanding.tier.seasonPoints} Pts</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Qualifies for {currentUserStanding.tier.multiplier} and {currentUserStanding.tier.exclusiveFrame}.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-3xs font-mono uppercase tracking-widest text-neutral-500">Tier Prizes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {RANK_TIERS.slice(0, 4).map((tier) => (
                  <div key={tier.id} className="p-3 rounded-lg bg-neutral-900/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tier.name}</span>
                      <span className="text-3xs font-mono text-amber-400 font-bold">{tier.seasonPoints} pts</span>
                    </div>
                    <p className="text-3xs text-neutral-400">{tier.exclusiveFrame}</p>
                    <p className="text-3xs text-neutral-500">{tier.multiplier}</p>
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
