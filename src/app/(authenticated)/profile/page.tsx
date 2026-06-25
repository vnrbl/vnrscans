"use client";

import { Link } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Trophy,
  Flame,
  MessageSquare,
  BookOpen,
  Star,
  Calendar,
  Settings,
  Shield,
  Crown,
  TrendingUp,
  Award,
  Code,
  Palette,
  Link2,
  Sparkles,
  Orbit,
  Sword,
  Lock,
} from "lucide-react";

import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { BadgeIcon, enhanceBadge, type ProfileBadgeRow } from "@/lib/profileBadges";
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { ReadingHeatmap } from "@/components/profile/ReadingHeatmap";
import { ProfileWidgets } from "@/components/profile/ProfileWidgets";
import { AccentColorPicker } from "@/components/profile/AccentColorPicker";

import { SocialLinksEditor, SocialLinksDisplay, type SocialLinksData } from "@/components/profile/SocialLinks";
import { xpSourceLabel } from "@/lib/xp";
import { stripBbCode } from "@/lib/bbcode";


/* ─── Keyframes (injected once) ─── */
const keyframeStyles = `
@keyframes profileFadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes profileStatPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
@keyframes sweepShine {
  0% { transform: translate(-120%, -120%) rotate(45deg); }
  30%, 100% { transform: translate(120%, 120%) rotate(45deg); }
}
@keyframes sweepShineSecondary {
  0% { transform: translate(-120%, -120%) rotate(45deg); }
  45%, 100% { transform: translate(120%, 120%) rotate(45deg); }
}
@keyframes cyberScan {
  0% { top: 0%; opacity: 0; }
  5%, 95% { opacity: 0.8; }
  100% { top: 100%; opacity: 0; }
}
@keyframes fireEmbersWavy {
  0% { transform: translate(0, 15px) scale(0.5); opacity: 0; }
  25% { transform: translate(-8px, -5px) scale(0.8); opacity: 0.8; }
  50% { transform: translate(6px, -25px) scale(0.6); opacity: 0.9; }
  75% { transform: translate(-4px, -45px) scale(0.4); opacity: 0.5; }
  100% { transform: translate(2px, -65px) scale(0.2); opacity: 0; }
}
@keyframes sakuraDrift3D {
  0% { transform: translate3d(0, -25px, 0) rotate3d(1, 1, 0, 0deg); opacity: 0; }
  20% { opacity: 0.9; }
  80% { opacity: 0.8; }
  100% { transform: translate3d(-20px, 50px, 0) rotate3d(1, 1, 1, 360deg); opacity: 0; }
}
@keyframes smoothBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.025); }
}
@keyframes rotationCW {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes rotationCCW {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}
@keyframes cyberGlitch {
  0%, 100% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg) brightness(1); }
  2% { transform: translate(-1px, 1px) skew(-2deg); filter: hue-rotate(90deg) brightness(1.2); }
  4% { transform: translate(1px, -1px) skew(3deg); filter: hue-rotate(-90deg) brightness(0.9); }
  6% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg) brightness(1); }
  94% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg) brightness(1); }
  96% { transform: translate(2px, -2px) skew(4deg); filter: hue-rotate(180deg) brightness(1.3); }
  98% { transform: translate(-2px, 2px) skew(-3deg); filter: hue-rotate(-180deg) brightness(0.8); }
}
@keyframes lightningFlicker {
  0%, 100% { opacity: 1; filter: brightness(1) drop-shadow(0 0 10px rgba(168,85,247,0.3)); }
  5% { opacity: 0.85; filter: brightness(1.2) drop-shadow(0 0 15px rgba(6,182,212,0.6)); }
  10% { opacity: 1; filter: brightness(1) drop-shadow(0 0 10px rgba(168,85,247,0.3)); }
  35% { opacity: 1; }
  36% { opacity: 0.9; filter: brightness(1.3) drop-shadow(0 0 20px rgba(236,72,153,0.7)); }
  38% { opacity: 1; filter: brightness(1) drop-shadow(0 0 10px rgba(168,85,247,0.3)); }
}
@keyframes runeJadePulse {
  0% { transform: scale(1) rotate(0deg); opacity: 0.7; }
  50% { transform: scale(1.03) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.7; }
}
@keyframes asuraRage {
  0%, 100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 8px rgba(239,68,68,0.5)); }
  50% { transform: scale(1.04); filter: brightness(1.25) drop-shadow(0 0 22px rgba(239,68,68,0.9)); }
}
@keyframes starTwinkle {
  0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
  50% { transform: scale(1.1) rotate(90deg); opacity: 1; }
}
@keyframes shadowWispMove {
  0% { transform: scale(1) translate(0, 0); opacity: 0.2; }
  50% { transform: scale(1.08) translate(3px, -3px); opacity: 0.5; filter: blur(3px); }
  100% { transform: scale(1) translate(0, 0); opacity: 0.2; }
}
@keyframes smokeRise {
  0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; filter: blur(2px); }
  15% { opacity: 0.5; }
  40% { transform: translateY(-12px) translateX(4px) scale(1.1); opacity: 0.35; filter: blur(4px); }
  70% { transform: translateY(-22px) translateX(-3px) scale(1.3); opacity: 0.15; filter: blur(6px); }
  100% { transform: translateY(-35px) translateX(2px) scale(1.5); opacity: 0; filter: blur(8px); }
}
@keyframes smokeRise2 {
  0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; filter: blur(3px); }
  20% { opacity: 0.4; }
  50% { transform: translateY(-15px) translateX(-5px) scale(1.0); opacity: 0.25; filter: blur(5px); }
  80% { transform: translateY(-28px) translateX(3px) scale(1.2); opacity: 0.1; filter: blur(7px); }
  100% { transform: translateY(-40px) translateX(-1px) scale(1.4); opacity: 0; filter: blur(9px); }
}
@keyframes flameTextPulse {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 4px var(--flame-color, #ef4444)); text-shadow: 0 0 8px var(--flame-color, #ef4444); }
  25% { filter: brightness(1.15) drop-shadow(0 0 8px var(--flame-color, #ef4444)); text-shadow: 0 0 12px var(--flame-color, #ef4444), 0 0 20px var(--flame-glow, #f97316); }
  50% { filter: brightness(1.3) drop-shadow(0 0 12px var(--flame-color, #ef4444)); text-shadow: 0 0 16px var(--flame-color, #ef4444), 0 0 30px var(--flame-glow, #f97316), 0 0 45px var(--flame-outer, #fbbf24); }
  75% { filter: brightness(1.1) drop-shadow(0 0 6px var(--flame-color, #ef4444)); text-shadow: 0 0 10px var(--flame-color, #ef4444), 0 0 18px var(--flame-glow, #f97316); }
}
@keyframes flameFlicker {
  0%, 100% { opacity: 0.7; transform: scaleY(1) scaleX(1); }
  10% { opacity: 0.9; transform: scaleY(1.05) scaleX(0.97); }
  20% { opacity: 0.75; transform: scaleY(0.98) scaleX(1.02); }
  30% { opacity: 0.85; transform: scaleY(1.03) scaleX(0.99); }
  40% { opacity: 0.8; transform: scaleY(0.97) scaleX(1.01); }
  50% { opacity: 0.9; transform: scaleY(1.04) scaleX(0.98); }
  60% { opacity: 0.75; transform: scaleY(1.0) scaleX(1.0); }
  70% { opacity: 0.85; transform: scaleY(0.99) scaleX(1.01); }
  80% { opacity: 0.8; transform: scaleY(1.02) scaleX(0.99); }
  90% { opacity: 0.9; transform: scaleY(0.98) scaleX(1.02); }
}
@keyframes avatarSmokeOrbit {
  0% { transform: rotate(0deg) translateX(78px) rotate(0deg) scale(0.7); opacity: 0; filter: blur(3px); }
  15% { opacity: 0.35; }
  50% { transform: rotate(180deg) translateX(78px) rotate(-180deg) scale(1.1); opacity: 0.2; filter: blur(5px); }
  85% { opacity: 0.1; }
  100% { transform: rotate(360deg) translateX(78px) rotate(-360deg) scale(0.7); opacity: 0; filter: blur(3px); }
}
@keyframes titleEmberFloat {
  0% { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
  20% { opacity: 0.8; }
  50% { transform: translateY(-10px) translateX(3px) scale(0.6); opacity: 0.6; }
  80% { opacity: 0.2; }
  100% { transform: translateY(-20px) translateX(-2px) scale(0.3); opacity: 0; }
}
@keyframes frameCardShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes abyssVoidGlow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(217, 70, 239, 0.45)); transform: scale(1); }
  50% { filter: brightness(1.25) drop-shadow(0 0 22px rgba(139, 92, 246, 0.75)); transform: scale(1.03); }
}
@keyframes glitchFlicker {
  0%, 100% { transform: scale(1) skew(0deg); opacity: 1; filter: hue-rotate(0deg); }
  10% { transform: scale(1.02) skew(1deg); opacity: 0.95; filter: hue-rotate(30deg); }
  20% { transform: scale(0.98) skew(-1deg); opacity: 0.9; filter: hue-rotate(-30deg); }
  30% { transform: scale(1) skew(0deg); opacity: 1; filter: hue-rotate(0deg); }
}
@keyframes divineHalo {
  0%, 100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 10px rgba(252, 211, 77, 0.5)); }
  50% { transform: scale(1.03); filter: brightness(1.25) drop-shadow(0 0 24px rgba(253, 224, 71, 0.8)); }
}
@keyframes fireTongue {
  0%, 100% {
    transform: scaleY(1) skewX(0deg) scaleX(1);
    opacity: 0.85;
    filter: blur(1.5px) brightness(1);
  }
  25% {
    transform: scaleY(1.2) skewX(4deg) scaleX(0.95);
    opacity: 1;
    filter: blur(1px) brightness(1.25);
  }
  50% {
    transform: scaleY(0.9) skewX(-3deg) scaleX(1.05);
    opacity: 0.75;
    filter: blur(2px) brightness(0.9);
  }
  75% {
    transform: scaleY(1.3) skewX(-5deg) scaleX(0.9);
    opacity: 0.95;
    filter: blur(1px) brightness(1.35);
  }
}
@keyframes titleUnderlineSweep {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes titleShimmerSweep {
  0% { background-position: -250% center; }
  100% { background-position: 250% center; }
}
@keyframes shadowExtraction {
  0% { transform: translateY(0) scaleY(0.7) scaleX(1); opacity: 0; filter: blur(2px); }
  50% { transform: translateY(-12px) scaleY(1.2) scaleX(0.8); opacity: 0.55; filter: blur(1.5px); }
  100% { transform: translateY(-25px) scaleY(1.5) scaleX(0.5); opacity: 0; filter: blur(3px); }
}
@keyframes bloodDrip {
  0% { transform: translateY(-15px) scaleY(0.8) scaleX(1.2); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translateY(12px) scaleY(1.3) scaleX(0.7); opacity: 0.95; }
  80% { transform: translateY(28px) scaleY(1) scaleX(1); opacity: 0.35; }
  100% { transform: translateY(38px) scaleY(0.8) scaleX(1.2); opacity: 0; }
}
@keyframes abyssBreath {
  0%, 100% { opacity: 0.5; transform: scale(1); filter: blur(1px); }
  50% { opacity: 0.95; transform: scale(1.03); filter: blur(2.5px); }
}
@keyframes abyssWarp {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.3; }
  50% { transform: translate(-6px, 6px) scale(0.6) rotate(180deg); opacity: 0.8; filter: blur(1.5px); }
  100% { transform: translate(0, 0) scale(1) rotate(360deg); opacity: 0.3; }
}
@keyframes creatorReflection {
  0% { transform: translate(-150%, -150%) rotate(45deg); }
  35%, 100% { transform: translate(150%, 150%) rotate(45deg); }
}
`;

const getAvatarFrameStyles = (frame: string, accent: string) => {
  switch (frame) {
    case "bronze":
      return { boxShadow: "0 0 12px rgba(205, 127, 50, 0.45), inset 0 0 6px rgba(255, 255, 255, 0.15)" };
    case "iron":
      return { boxShadow: "0 0 12px rgba(112, 128, 144, 0.45), inset 0 0 6px rgba(255, 255, 255, 0.1)" };
    case "silver":
      return { boxShadow: "0 0 16px rgba(192, 192, 192, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.2)" };
    case "platinum":
      return { boxShadow: "0 0 20px rgba(229, 228, 226, 0.55), inset 0 0 10px rgba(6, 182, 212, 0.25)" };
    case "apprentice":
      return { boxShadow: "0 0 12px rgba(210, 180, 140, 0.45), inset 0 0 6px rgba(255, 255, 255, 0.15)" };
    case "scholar":
      return { boxShadow: "0 0 15px rgba(143, 188, 143, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.2)" };
    case "sage":
      return { boxShadow: "0 0 20px rgba(0, 250, 154, 0.55), inset 0 0 10px rgba(0, 250, 154, 0.25)" };
    case "elder":
      return { boxShadow: "0 0 22px rgba(218, 112, 214, 0.6), inset 0 0 12px rgba(218, 112, 214, 0.3)" };
    case "immortal":
      return { boxShadow: "0 0 25px rgba(255, 215, 0, 0.7), inset 0 0 12px rgba(255, 215, 0, 0.4)" };
    case "neon":
      return { boxShadow: "0 0 20px rgba(168, 85, 247, 0.45), inset 0 0 10px rgba(6, 182, 212, 0.35)" };
    case "gold":
      return { boxShadow: "0 0 20px rgba(212, 175, 55, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.25)" };
    case "cyber":
      return { boxShadow: "0 0 20px rgba(6, 182, 212, 0.45), inset 0 0 10px rgba(192, 132, 252, 0.25)" };
    case "fire":
      return { boxShadow: "0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(249, 115, 22, 0.35)" };
    case "sakura":
      return { boxShadow: "0 0 20px rgba(244, 114, 182, 0.5), inset 0 0 8px rgba(253, 164, 189, 0.35)" };
    case "shadow":
      return { boxShadow: "0 0 20px rgba(99, 102, 241, 0.55), inset 0 0 12px rgba(30, 27, 75, 0.45)" };
    case "qi":
      return { boxShadow: "0 0 20px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(251, 191, 36, 0.25)" };
    case "asura":
      return { boxShadow: "0 0 25px rgba(239, 68, 68, 0.65), inset 0 0 12px rgba(0, 0, 0, 0.85)" };
    case "system":
      return { boxShadow: "0 0 22px rgba(6, 182, 212, 0.55), inset 0 0 10px rgba(6, 182, 212, 0.35)" };
    case "abyss":
      return { boxShadow: "0 0 25px rgba(217, 70, 239, 0.6), inset 0 0 12px rgba(74, 4, 78, 0.5)" };
    case "glitch":
      return { boxShadow: "0 0 22px rgba(239, 68, 68, 0.55), inset 0 0 10px rgba(6, 182, 212, 0.35)" };
    case "divine":
      return { boxShadow: "0 0 25px rgba(252, 211, 77, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.35)" };
    case "creator":
      return { boxShadow: `0 0 25px ${accent}, inset 0 0 12px ${accent}` };
    case "none":
    default:
      return {
        boxShadow: `0 0 15px ${accent}25`,
      };
  }
};

const getFrameSmokeColor = (frame: string, accent: string) => {
  switch (frame) {
    case "bronze": return "#CD7F32";
    case "iron": return "#708090";
    case "silver": return "#C0C0C0";
    case "platinum": return "#E5E4E2";
    case "apprentice": return "#D2B48C";
    case "scholar": return "#8FBC8F";
    case "sage": return "#00FA9A";
    case "elder": return "#DA70D6";
    case "immortal": return "#FFD700";
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
    case "creator": return accent;
    default: return accent;
  }
};

const FRAME_REQUIREMENTS: Record<string, {
  level?: number;
  chapters?: number;
  streak?: number;
  series?: number;
  text: string;
}> = {
  none: { text: "Always unlocked" },
  creator: { text: "Exclusive to Administrators" },
  bronze: { level: 5, text: "Reach Level 5" },
  iron: { level: 10, text: "Reach Level 10" },
  silver: { level: 20, text: "Reach Level 20" },
  sakura: { level: 30, text: "Reach Level 30" },
  platinum: { level: 40, text: "Reach Level 40" },
  neon: { level: 50, text: "Reach Level 50" },
  qi: { level: 80, text: "Reach Level 80" },
  cyber: { level: 100, text: "Reach Level 100" },
  gold: { level: 150, text: "Reach Level 150" },
  glitch: { level: 250, text: "Reach Level 250" },
  apprentice: { chapters: 100, text: "Read 100+ chapters" },
  scholar: { chapters: 200, text: "Read 200+ chapters" },
  sage: { chapters: 400, text: "Read 400+ chapters" },
  elder: { chapters: 500, text: "Read 500+ chapters" },
  immortal: { chapters: 800, text: "Read 800+ chapters" },
  asura: { streak: 100, text: "Maintain a 100-day reading streak" },
  divine: { streak: 300, text: "Maintain a 300-day reading streak" },
  system: { series: 200, text: "Follow 200+ series" },
  fire: { chapters: 1000, text: "Read 1000+ chapters" },
  shadow: { chapters: 3000, text: "Read 3000+ chapters" },
  abyss: { chapters: 5000, text: "Read 5000+ chapters" },
};

export default function ProfilePage() {
  const qc = useQueryClient();
  
  // Inject keyframes once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = keyframeStyles;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Fetch profile with all data
  const profile = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return { ...data, email: u.user.email } as any;
    },
    staleTime: 0,
  });

  // Fetch equipped badge/title
  const equippedBadge = useQuery({
    queryKey: ["profile", "equipped-badge"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badge_id(*)
        `)
        .eq("user_id", u.user.id)
        .eq("is_equipped", true)
        .maybeSingle();
      if (error) {
        console.error("Error fetching equipped badge:", error);
        return null;
      }
      if (data && data.badge) {
        data.badge = enhanceBadge(data.badge);
      }
      return data as any;
    },
    staleTime: 0,
  });

  // Fetch user comment history
  const commentHistory = useQuery({
    queryKey: ["profile", "comment-history"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await (supabase.from("comments") as any)
        .select("id,content,created_at,chapter_id,series_id,is_spoiler,is_hidden,attachment_type,attachment_url")
        .eq("user_id", u.user.id)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Error fetching comment history:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 0,
  });

  // Fetch series info for comment history
  const commentSeriesIds = Array.from(new Set((commentHistory.data ?? []).map((c: any) => c.series_id).filter(Boolean))) as string[];
  const commentSeriesInfo = useQuery({
    queryKey: ["profile", "comment-series", commentSeriesIds.join(",")],
    queryFn: async () => {
      if (commentSeriesIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("series")
        .select("id,title,slug")
        .in("id", commentSeriesIds);
      if (error) return new Map();
      return new Map((data ?? []).map((s: any) => [s.id, s]));
    },
    enabled: commentSeriesIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch reading stats
  const readingStats = useQuery({
    queryKey: ["profile", "reading-stats"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { chapters: 0, series: 0, comments: 0, ratings: 0 };
      
      const [chaptersRead, seriesFollowed, commentsCount, ratingsCount] = await Promise.all([
        supabase.from("reading_history").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase.from("series_follows").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
        supabase.from("ratings").select("*", { count: "exact", head: true }).eq("user_id", u.user.id),
      ]);

      return {
        chapters: chaptersRead.count || 0,
        series: seriesFollowed.count || 0,
        comments: commentsCount.count || 0,
        ratings: ratingsCount.count || 0,
      };
    },
    staleTime: 0,
  });

  // Fetch user roles
  const userRoles = useQuery({
    queryKey: ["profile", "roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      if (error) return [];
      return (data || []).map((r) => r.role);
    },
    staleTime: 0,
  });

  // Fetch reading history timestamps to compute streak
  const historyQuery = useQuery({
    queryKey: ["profile", "reading-history-dates"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("reading_history")
        .select("updated_at")
        .eq("user_id", u.user.id);

      if (error) throw error;
      return data || [];
    }
  });

  // XP history ledger — newest first, capped to a few hundred rows.
  const xpHistory = useQuery({
    queryKey: ["xp-history", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("id,amount,source,reference_id,reference_type,description,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 1000,
  });

  // Resolve series links for ledger rows that reference one.
  const xpSeriesIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of xpHistory.data ?? []) {
      if (row.reference_type === "series" && row.reference_id) ids.add(row.reference_id);
    }
    return Array.from(ids);
  }, [xpHistory.data]);

  const xpSeriesLookup = useQuery({
    queryKey: ["xp-history", "series-lookup", xpSeriesIds.join(",")],
    queryFn: async () => {
      if (xpSeriesIds.length === 0) return new Map<string, { slug: string; title: string }>();
      const { data, error } = await supabase
        .from("series")
        .select("id,slug,title")
        .in("id", xpSeriesIds);
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.id, { slug: row.slug, title: row.title }]));
    },
    enabled: xpSeriesIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve chapter links (slug + chapter_number + parent series slug).
  const xpChapterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of xpHistory.data ?? []) {
      if (row.reference_type === "chapter" && row.reference_id) ids.add(row.reference_id);
    }
    return Array.from(ids);
  }, [xpHistory.data]);

  const xpChapterLookup = useQuery({
    queryKey: ["xp-history", "chapter-lookup", xpChapterIds.join(",")],
    queryFn: async () => {
      if (xpChapterIds.length === 0)
        return new Map<string, { slug: string; chapter_number: number; series_slug: string; series_title: string }>();
      const { data, error } = await supabase
        .from("chapters")
        .select("id,slug,chapter_number,series:series_id(slug,title)")
        .in("id", xpChapterIds);
      if (error) throw error;
      return new Map(
        (data ?? []).map((row: any) => [
          row.id,
          {
            slug: row.slug,
            chapter_number: row.chapter_number,
            series_slug: row.series?.slug ?? "",
            series_title: row.series?.title ?? "",
          },
        ]),
      );
    },
    enabled: xpChapterIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const streaks = useMemo(() => {
    if (!historyQuery.data) return { current: 0, longest: 0 };
    
    const toLocalYYYYMMDD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Extract unique dates of activity
    const dates = Array.from(new Set(
      historyQuery.data.map(item => toLocalYYYYMMDD(new Date(item.updated_at)))
    )).sort();

    if (dates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    const todayStr = toLocalYYYYMMDD(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalYYYYMMDD(yesterday);

    // Compute longest streak
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      longest = Math.max(longest, tempStreak);
    }

    // Compute current streak
    const hasActivityTodayOrYesterday = dates.includes(todayStr) || dates.includes(yesterdayStr);
    if (hasActivityTodayOrYesterday) {
      const searchDate = dates.includes(todayStr) ? new Date() : yesterday;
      let searchStr = toLocalYYYYMMDD(searchDate);
      
      while (dates.includes(searchStr)) {
        current++;
        searchDate.setDate(searchDate.getDate() - 1);
        searchStr = toLocalYYYYMMDD(searchDate);
      }
    }

    return { current, longest };
  }, [historyQuery.data]);

  // Synchronize streak with profiles table
  useEffect(() => {
    if (profile.data && historyQuery.data) {
      const dbStreak = profile.data.reading_streak || 0;
      if (streaks.current !== dbStreak) {
        supabase
          .from("profiles")
          .update({ reading_streak: streaks.current } as any)
          .eq("user_id", profile.data.user_id)
          .then(() => {
            qc.invalidateQueries({ queryKey: ["profile"] });
            qc.invalidateQueries({ queryKey: ["user-stats"] });
          });
      }
    }
  }, [profile.data, streaks.current, historyQuery.data, qc]);

  // Editable state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [avatarFrame, setAvatarFrame] = useState("none");
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({
    social_discord: "",
    social_instagram: "",
    social_twitter: "",
    social_mal: "",
    social_anilist: "",
    social_website: "",
  });

  useEffect(() => {
    if (profile.data) {
      setUsername(profile.data.username ?? "");
      setBio(profile.data.bio ?? "");
      setAvatarUrl(profile.data.avatar_url ?? "");
      setAccentColor(profile.data.accent_color ?? "#8B5CF6");
      setAvatarFrame(profile.data.avatar_frame ?? "none");
      setSocialLinks({
        social_discord: profile.data.social_discord ?? "",
        social_instagram: profile.data.social_instagram ?? "",
        social_twitter: profile.data.social_twitter ?? "",
        social_mal: profile.data.social_mal ?? "",
        social_anilist: profile.data.social_anilist ?? "",
        social_website: profile.data.social_website ?? "",
      });
    }
  }, [profile.data]);

  const xp = profile.data?.experience_points || 0;
  const level = profile.data?.user_level || 1;
  const xpForNextLevel = Math.pow((level + 1) * 2, 2);
  const xpProgress = ((xp % xpForNextLevel) / xpForNextLevel) * 100;
  const isAdmin = userRoles.data?.includes("admin");

  const isFrameUnlocked = (frameId: string) => {
    if (frameId === "creator") return isAdmin;
    if (isAdmin || frameId === "none") return true;
    const req = FRAME_REQUIREMENTS[frameId];
    if (!req) return true;

    if (req.level && level < req.level) return false;
    
    const stats = readingStats.data || { chapters: 0, series: 0, comments: 0, ratings: 0 };
    if (req.chapters && stats.chapters < req.chapters) return false;
    if (req.series && stats.series < req.series) return false;
    
    const streakVal = streaks.current || 0;
    if (req.streak && streakVal < req.streak) return false;

    return true;
  };

  const save = useMutation({
    mutationFn: async () => {
      const unlocked = isFrameUnlocked(avatarFrame);
      if (!unlocked) throw new Error("This avatar frame is locked: " + (FRAME_REQUIREMENTS[avatarFrame]?.text || ""));

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username, 
          bio, 
          avatar_url: avatarUrl || null,
          accent_color: accentColor,
          avatar_frame: avatarFrame,
          social_discord: socialLinks.social_discord || null,
          social_instagram: socialLinks.social_instagram || null,
          social_twitter: socialLinks.social_twitter || null,
          social_mal: socialLinks.social_mal || null,
          social_anilist: socialLinks.social_anilist || null,
          social_website: socialLinks.social_website || null,
        } as any)
        .eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      {/* ─── Profile Header (No Banner) ─── */}
      <div
        className="relative py-10 border-b border-border/20"
        style={{
          animation: "profileFadeInUp 0.5s ease-out both",
          background: `linear-gradient(180deg, ${accentColor}08, transparent)`,
        }}
      >
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Avatar with accent ring / custom frame */}
            <div
              className="relative h-[140px] w-[140px] flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                ...getAvatarFrameStyles(avatarFrame, accentColor),
                background: avatarFrame === "none" ? accentColor : undefined,
                padding: '4px',
              }}
            >
              {/* Smoke wisps orbiting the avatar frame */}
              {avatarFrame !== "none" && (
                <div className="absolute inset-0 pointer-events-none z-[25]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(avatarFrame, accentColor)}50, transparent)`, animation: 'avatarSmokeOrbit 6s linear infinite' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(avatarFrame, accentColor)}40, transparent)`, animation: 'avatarSmokeOrbit 8s linear infinite 2s' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(avatarFrame, accentColor)}35, transparent)`, animation: 'avatarSmokeOrbit 10s linear infinite 4s' }} />
                </div>
              )}
              {/* Layer 1: Spinners, double-rotators & backgrounds for custom frames */}
              {avatarFrame === "bronze" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8c521a] via-[#cd7f32] to-[#ffb677] animate-[smoothBreath_5s_ease-in-out_infinite]" />
              )}
              {avatarFrame === "iron" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3a4454] via-[#708090] to-[#b0c4de] animate-[smoothBreath_5s_ease-in-out_infinite]" />
              )}
              {avatarFrame === "silver" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f7f7f] via-[#C0C0C0] to-[#ffffff] animate-[smoothBreath_4s_ease-in-out_infinite]" />
              )}
              {avatarFrame === "platinum" && (
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#d3d3d3,#E5E4E2,#06B6D4,#d3d3d3)] animate-[rotationCW_6s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "apprentice" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#a0522d] via-[#D2B48C] to-[#ffebcd]" />
              )}
              {avatarFrame === "scholar" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2e8b57] via-[#8FBC8F] to-[#f0fff0]" />
              )}
              {avatarFrame === "sage" && (
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#00FA9A,transparent,#20B2AA,transparent,#00FA9A)] animate-[rotationCW_5s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "elder" && (
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#DA70D6,#8A2BE2,#DA70D6)] animate-[rotationCW_4s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "immortal" && (
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950 animate-[divineHalo_4s_ease-in-out_infinite]">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#FFD700,#FFA500,#FF8C00,#FFD700)] animate-[rotationCW_3s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "neon" && (
                <div className="absolute inset-0 rounded-full overflow-hidden animate-[lightningFlicker_6s_ease-in-out_infinite]">
                  {/* Double rotating rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-[rotationCW_4s_linear_infinite]" />
                  <div className="absolute inset-[2px] rounded-full bg-background z-5" />
                  <div className="absolute inset-[2px] rounded-full overflow-hidden z-6">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#EC4899,#06B6D4,#A855F7,#EC4899)] animate-[rotationCCW_3s_linear_infinite]" />
                  </div>
                </div>
              )}
              {avatarFrame === "gold" && (
                <>
                  {/* Rotating golden light background ring */}
                  <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99] animate-[rotationCW_10s_linear_infinite]" />
                  <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#ffeb99] via-[#ffd700] to-[#aa7c11] animate-[rotationCCW_8s_linear_infinite]" />
                </>
              )}
              {avatarFrame === "cyber" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-dashed border-cyan-400/40 animate-[rotationCCW_12s_linear_infinite] z-5" />
                </div>
              )}
              {avatarFrame === "fire" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {/* Double volcanic swirl */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-[rotationCW_3s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full overflow-hidden z-5">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#7f1d1d,#f97316,#ef4444,#7f1d1d)] animate-[rotationCCW_4s_linear_infinite]" />
                  </div>
                </div>
              )}

              {avatarFrame === "sakura" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9] animate-[smoothBreath_4s_ease-in-out_infinite]" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-bl from-[#E879F9] via-[#F472B6] to-[#FDA4AF] animate-[rotationCW_8s_linear_infinite]" />
                </>
              )}
              {avatarFrame === "shadow" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-[rotationCW_5s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full overflow-hidden z-5">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#1e1b4b,#06b6d4,#4f46e5,#1e1b4b)] animate-[rotationCCW_6s_linear_infinite]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[shadowWispMove_4s_ease-in-out_infinite] z-6" />
                </div>
              )}
              {avatarFrame === "qi" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-emerald-400/40 bg-emerald-950/20 animate-[runeJadePulse_8s_linear_infinite] z-5" />
                </div>
              )}
              {avatarFrame === "asura" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000] animate-[asuraRage_2.5s_ease-in-out_infinite] overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,transparent,#7f1d1d,transparent,#ef4444)] animate-[rotationCW_4s_linear_infinite] opacity-80" />
                </div>
              )}
              {avatarFrame === "system" && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-950/20 animate-[asuraRage_4s_ease-in-out_infinite] overflow-hidden">
                  {/* Rotating radar sweep */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,rgba(6,182,212,0.25),transparent_40%,transparent)] animate-[rotationCW_3s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "abyss" && (
                <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden animate-[abyssVoidGlow_5s_ease-in-out_infinite]">
                  {/* Swirling void conic gradient */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#D946EF,#4A044E,#3B0764,#D946EF)] animate-[rotationCW_8s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-purple-500/30 bg-purple-950/20 animate-[rotationCCW_10s_linear_infinite] z-5" />
                </div>
              )}
              {avatarFrame === "glitch" && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500/40 bg-slate-950/20 overflow-hidden animate-[glitchFlicker_4s_linear_infinite]">
                  {/* Swirling tech rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,#06b6d4,#ef4444)] animate-[rotationCW_4s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "divine" && (
                <div className="absolute inset-0 rounded-full bg-amber-50/10 overflow-hidden animate-[divineHalo_4s_ease-in-out_infinite]">
                  {/* Light halo rotating rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#FCD34D,#FFFFFF,#FFFBEB,#FCD34D)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full bg-gradient-to-bl from-[#FFFBEB] via-[#FCD34D] to-[#FFFFFF] animate-[rotationCCW_5s_linear_infinite]" />
                </div>
              )}
              {avatarFrame === "creator" && (
                <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden" style={{
                  boxShadow: `0 0 30px ${accentColor}, inset 0 0 15px ${accentColor}`,
                }}>
                  <div className="absolute inset-[-55%] rounded-full" style={{
                    background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor}80, transparent, ${accentColor})`,
                    animation: 'rotationCW 4s linear infinite',
                  }} />
                  <div className="absolute inset-[-55%] rounded-full" style={{
                    background: `conic-gradient(from 180deg, ${accentColor}dd, transparent, #ffffffaa, transparent, ${accentColor}dd)`,
                    animation: 'rotationCCW 6s linear infinite',
                  }} />
                </div>
              )}

              {/* Layer 2: Inner mask background to shape the border */}
              {avatarFrame !== "none" && (
                <div 
                  className="absolute rounded-full bg-background z-10" 
                  style={{
                    inset: avatarFrame === "creator" ? '6px' : '4px',
                  }}
                />
              )}

              {/* Layer 3: Avatar image and internal animations (z-10 relative) */}
              <div className="h-full w-full rounded-full overflow-hidden relative z-10 flex items-center justify-center">
                <div className="w-full h-full p-0.5 rounded-full bg-background">
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    username={username}
                    onAvatarUpdated={(url) => setAvatarUrl(url)}
                  />
                </div>

                {/* Shimmer sweeps inside avatar for gold frame */}
                {avatarFrame === "gold" && (
                  <>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full z-20 pointer-events-none"
                      style={{ 
                        animation: 'sweepShine 3.5s ease-in-out infinite',
                        animationDelay: '1s'
                      }} 
                    />
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/35 to-transparent -translate-x-full z-20 pointer-events-none"
                      style={{ 
                        animation: 'sweepShineSecondary 5s ease-in-out infinite',
                        animationDelay: '2.5s'
                      }} 
                    />
                  </>
                )}

                {/* Cyber double scan overlays + matrix grid */}
                {avatarFrame === "cyber" && (
                  <>
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                      <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-400/75 shadow-[0_0_6px_cyan]" style={{ animation: 'cyberScan 2.5s linear infinite' }} />
                      <div className="absolute left-0 right-0 h-[1px] bg-purple-400/60 shadow-[0_0_4px_purple]" style={{ animation: 'cyberScan 3.5s linear infinite', animationDelay: '1.2s' }} />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,182,212,0.15)_95%)] pointer-events-none z-15 rounded-full" />
                  </>
                )}

                {/* System Scanline overlay + technical grid */}
                {avatarFrame === "system" && (
                  <>
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                      <div className="absolute left-0 right-0 h-[1px] bg-cyan-300/50 shadow-[0_0_5px_cyan]" style={{ animation: 'cyberScan 4s linear infinite', animationDelay: '0.5s' }} />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] pointer-events-none z-15 rounded-full bg-[size:100%_4px,6px_100%]" />
                  </>
                )}
              </div>

              {/* Layer 4: Frame brackets and decorative widgets (z-20) */}
              {avatarFrame === "bronze" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Floating Bronze Sparks */}
                  <div className="absolute bottom-1 left-3 w-1.5 h-1.5 rounded-full bg-orange-600 animate-[fireEmbersWavy_3s_ease-out_infinite]" />
                  <div className="absolute top-4 right-3 w-1 h-1 rounded-full bg-yellow-600 animate-[fireEmbersWavy_4s_ease-out_infinite_1.5s]" />
                </div>
              )}

              {avatarFrame === "iron" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Heavy Iron cardinal bolts */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-1.5 bg-[#4f5660] rounded-b border border-slate-500 shadow-[0_0_3px_rgba(0,0,0,0.5)] z-25" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3.5 w-1.5 bg-[#4f5660] rounded-t border border-slate-500 shadow-[0_0_3px_rgba(0,0,0,0.5)] z-25" />
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-1.5 bg-[#4f5660] rounded-r border border-slate-500 shadow-[0_0_3px_rgba(0,0,0,0.5)] z-25" />
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-1.5 bg-[#4f5660] rounded-l border border-slate-500 shadow-[0_0_3px_rgba(0,0,0,0.5)] z-25" />
                  {/* Sparks */}
                  <div className="absolute bottom-2 left-4 w-1 h-1 rounded-full bg-red-600 animate-[fireEmbersWavy_2s_ease-out_infinite]" />
                  <div className="absolute bottom-3 right-4 w-0.8 h-0.8 rounded-full bg-orange-500 animate-[fireEmbersWavy_2.5s_ease-out_infinite_0.8s]" />
                </div>
              )}

              {avatarFrame === "silver" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Shield at the bottom */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center bg-slate-800 border border-slate-300 text-slate-300 rounded-md p-1 scale-90 shadow-md">
                    <Shield className="h-4 w-4 text-slate-300 drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]" />
                  </div>
                  {/* Orbiting silver stars */}
                  <Sparkles className="absolute top-2 left-2 h-4 w-4 text-slate-200 animate-[starTwinkle_2s_ease-in-out_infinite]" />
                  <Sparkles className="absolute top-3 right-3 h-3 w-3 text-white animate-[starTwinkle_2.5s_ease-in-out_infinite_0.8s]" />
                </div>
              )}

              {avatarFrame === "platinum" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Tech corners */}
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm shadow-[0_0_4px_cyan]" />
                  {/* Blue light sweep */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: 'radial-gradient(circle, #22d3ee, transparent)', animation: 'avatarSmokeOrbit 6s linear infinite' }} />
                </div>
              )}

              {avatarFrame === "apprentice" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Left & Right scroll rollers */}
                  <div className="absolute top-[15%] left-[-3px] bottom-[15%] w-2 bg-[#8b5a2b] border border-[#5c3a21] rounded-full z-25 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
                  <div className="absolute top-[15%] right-[-3px] bottom-[15%] w-2 bg-[#8b5a2b] border border-[#5c3a21] rounded-full z-25 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
                  {/* Ink droplets */}
                  <div className="absolute bottom-2 left-6 w-1.5 h-1.5 rounded-full bg-slate-900 animate-[fireEmbersWavy_3s_ease-out_infinite]" />
                  <div className="absolute bottom-3 right-6 w-1 h-1 rounded-full bg-slate-800 animate-[fireEmbersWavy_4s_ease-out_infinite_1.2s]" />
                </div>
              )}

              {avatarFrame === "scholar" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Jade Rollers with Gold ends */}
                  <div className="absolute top-[12%] left-[-3px] bottom-[12%] w-2.5 bg-emerald-700 border-y-2 border-x border-[#ffd700] rounded-sm z-25 shadow-md" />
                  <div className="absolute top-[12%] right-[-3px] bottom-[12%] w-2.5 bg-emerald-700 border-y-2 border-x border-[#ffd700] rounded-sm z-25 shadow-md" />
                  {/* Sparkles */}
                  <Sparkles className="absolute -top-1.5 left-4 h-3.5 w-3.5 text-yellow-300 animate-[starTwinkle_2s_ease-in-out_infinite]" />
                  <Sparkles className="absolute -bottom-1.5 right-4 h-3.5 w-3.5 text-emerald-300 animate-[starTwinkle_2.5s_ease-in-out_infinite_1.2s]" />
                </div>
              )}

              {avatarFrame === "sage" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Book at the bottom */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center bg-slate-900 border border-emerald-400 text-emerald-400 rounded-md p-1 scale-90 shadow-[0_0_6px_#10B981]">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                  </div>
                  {/* Pulsing rune borders */}
                  <div className="absolute inset-[2px] rounded-full border border-dashed border-emerald-400/40 animate-[rotationCCW_12s_linear_infinite]" />
                </div>
              )}

              {avatarFrame === "elder" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Amethyst runes rotating */}
                  <div className="absolute inset-[3px] rounded-full border border-dotted border-purple-400/60 animate-[rotationCCW_8s_linear_infinite]" />
                  {/* Void dust */}
                  <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-purple-600/65 blur-[0.5px] animate-[abyssWarp_5s_infinite]" />
                  <div className="absolute bottom-[20%] right-[20%] w-2.5 h-2.5 rounded-full bg-indigo-900/60 blur-[1px] animate-[abyssWarp_7s_infinite_1.5s]" />
                </div>
              )}

              {avatarFrame === "immortal" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Solar Flame Crown at top */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_8px_#ffd700] animate-[asuraRage_2s_ease-in-out_infinite] z-25">
                    <Flame className="h-5.5 w-5.5" />
                  </div>
                  {/* Orbiting sparks */}
                  <Sparkles className="absolute top-2 left-3 h-4 w-4 text-yellow-100 animate-[starTwinkle_2s_ease-in-out_infinite]" />
                  <Sparkles className="absolute bottom-2 right-3 h-3.5 w-3.5 text-white animate-[starTwinkle_2.5s_ease-in-out_infinite_1s]" />
                </div>
              )}

              {avatarFrame === "gold" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Glow halo ring behind crown */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400/25 blur-sm animate-pulse z-20" />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-amber-400 drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)] animate-[smoothBreath_3s_ease-in-out_infinite] z-25">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-amber-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                    <Trophy className="h-4.5 w-4.5" />
                  </div>
                  {/* Floating Gold Dust */}
                  <div className="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-[fireEmbersWavy_3s_ease-out_infinite]" />
                  <div className="absolute bottom-3 right-4 w-1 h-1 rounded-full bg-amber-200 animate-[fireEmbersWavy_4s_ease-out_infinite_1.5s]" />
                  <div className="absolute top-6 left-3 w-1.2 h-1.2 rounded-full bg-yellow-400 animate-[fireEmbersWavy_3.5s_ease-out_infinite_0.8s]" />
                </div>
              )}

              {avatarFrame === "cyber" && (
                <div className="absolute inset-0 pointer-events-none z-20 animate-[cyberGlitch_8s_infinite]">
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm shadow-[0_0_4px_cyan]" />
                </div>
              )}

              {avatarFrame === "fire" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-orange-500 drop-shadow-[0_0_8px_#ef4444] animate-[asuraRage_2.5s_ease-in-out_infinite] z-25">
                    <Flame className="h-5.5 w-5.5" />
                  </div>
                  {/* Layered Ember Storm */}
                  <div className="absolute bottom-1 left-4 h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_#ef4444]" style={{ animation: 'fireEmbersWavy 2s ease-out infinite' }} />
                  <div className="absolute bottom-2 right-5 h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_3px_#f97316]" style={{ animation: 'fireEmbersWavy 2.5s ease-out infinite', animationDelay: '0.7s' }} />
                  <div className="absolute bottom-3 left-8 h-1.2 w-1.2 rounded-full bg-red-500 shadow-[0_0_4px_#b91c1c]" style={{ animation: 'fireEmbersWavy 3s ease-out infinite', animationDelay: '1.2s' }} />
                  <div className="absolute bottom-2 right-10 h-0.8 w-0.8 rounded-full bg-yellow-300 shadow-[0_0_3px_white]" style={{ animation: 'fireEmbersWavy 1.8s ease-out infinite', animationDelay: '0.4s' }} />
                </div>
              )}

              {avatarFrame === "sakura" && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                  {/* Falling 3D Blossom Drift */}
                  <span className="absolute text-[9px] select-none" style={{ animation: 'sakuraDrift3D 3.5s linear infinite', left: '16px', top: '4px' }}>🌸</span>
                  <span className="absolute text-[7px] select-none" style={{ animation: 'sakuraDrift3D 4s linear infinite', right: '24px', top: '8px', animationDelay: '1.2s' }}>🌸</span>
                  <span className="absolute text-[8px] select-none" style={{ animation: 'sakuraDrift3D 3.8s linear infinite', left: '40px', top: '0px', animationDelay: '0.6s' }}>🌸</span>
                </div>
              )}

              {avatarFrame === "shadow" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Solo Leveling Glowing Monarch Eyes */}
                  <div className="absolute -top-1.5 left-[38%] w-3 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] rotate-[-12deg] animate-pulse z-30" />
                  <div className="absolute -top-1.5 right-[38%] w-3 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] rotate-[12deg] animate-pulse z-30" />
                  
                  {/* Shadow Extraction wisps */}
                  <div className="absolute -bottom-2 left-[15%] w-3 h-7 bg-cyan-400/25 blur-[1px] rounded-t-full animate-[shadowExtraction_1.5s_ease-out_infinite]" style={{ transform: 'rotate(-15deg)' }} />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-8 bg-indigo-500/20 blur-[1.5px] rounded-t-full animate-[shadowExtraction_2s_ease-out_infinite_0.4s]" />
                  <div className="absolute -bottom-2 right-[15%] w-3 h-7 bg-purple-500/25 blur-[1px] rounded-t-full animate-[shadowExtraction_1.7s_ease-out_infinite_0.2s]" style={{ transform: 'rotate(15deg)' }} />

                  {/* Void Sparks */}
                  <div className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_6px_#6366F1]" style={{ animation: 'fireEmbersWavy 3s ease-out infinite' }} />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]" style={{ animation: 'fireEmbersWavy 2.5s ease-out infinite', animationDelay: '1s' }} />
                </div>
              )}

              {avatarFrame === "qi" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <Sparkles className="absolute -top-2 right-2 h-4.5 w-4.5 text-amber-300 animate-[starTwinkle_2s_ease-in-out_infinite]" />
                  <Sparkles className="absolute -bottom-1.5 left-2.5 h-3.5 w-3.5 text-emerald-300 animate-[starTwinkle_2.5s_ease-in-out_infinite]" style={{ animationDelay: '1.2s' }} />
                  <Sparkles className="absolute top-4 left-0 h-3 w-3 text-yellow-200 animate-[starTwinkle_2.2s_ease-in-out_infinite]" style={{ animationDelay: '0.6s' }} />
                </div>
              )}

              {avatarFrame === "asura" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Demonic Eye Flash */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse z-30" />
                  
                  {/* Crossed bloody swords */}
                  <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-35 animate-[smoothBreath_3s_ease-in-out_infinite]">
                    <Sword className="h-6.5 w-6.5 text-red-700 drop-shadow-[0_0_5px_red] rotate-[-45deg] translate-x-1.5" />
                    <Sword className="h-6.5 w-6.5 text-red-700 drop-shadow-[0_0_5px_red] rotate-[45deg] -translate-x-1.5" />
                  </div>

                  {/* Dripping blood drops */}
                  <div className="absolute bottom-[-15px] left-[35%] w-1 h-2 bg-red-600 rounded-full animate-[bloodDrip_2.5s_infinite] shadow-[0_0_3px_red]" />
                  <div className="absolute bottom-[-15px] right-[35%] w-1.2 h-2 bg-red-600 rounded-full animate-[bloodDrip_3s_infinite_1.2s] shadow-[0_0_3px_red]" />

                  {/* Sword guards brackets */}
                  <div className="absolute inset-0 animate-[smoothBreath_3s_ease-in-out_infinite]">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-4 w-2 bg-red-700 rounded-b-md shadow-[0_0_6px_red] border border-red-500" />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-4 w-2 bg-red-700 rounded-t-md shadow-[0_0_6px_red] border border-red-500" />
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-4 bg-red-700 rounded-r-md shadow-[0_0_6px_red] border border-red-500" />
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-2 w-4 bg-red-700 rounded-l-md shadow-[0_0_6px_red] border border-red-500" />
                  </div>
                </div>
              )}

              {avatarFrame === "system" && (
                <>
                  <div className="absolute -top-2.5 -right-2.5 z-30 bg-slate-950 border-2 border-cyan-400 text-cyan-400 text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(6,182,212,0.7)] animate-[cyberGlitch_10s_infinite]">
                    S-RANK
                  </div>
                  <div className="absolute -bottom-2 -left-2 z-30 bg-slate-950 border border-yellow-400 text-yellow-400 text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_4px_rgba(234,179,8,0.5)]">
                    LV.MAX
                  </div>
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400 animate-pulse" />
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400 animate-pulse" />
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400 animate-pulse" />
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400 animate-pulse" />
                  </div>
                </>
              )}
              {avatarFrame === "abyss" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-fuchsia-400 drop-shadow-[0_0_8px_#D946EF] animate-[asuraRage_3s_ease-in-out_infinite] z-25">
                    <Orbit className="h-5.5 w-5.5" />
                  </div>
                  {/* Swirling Abyssal Orbs */}
                  <div className="absolute bottom-2 left-4 h-2 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_6px_#D946EF]" style={{ animation: 'fireEmbersWavy 2.8s ease-out infinite' }} />
                  <div className="absolute bottom-3 right-5 h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#8B5CF6]" style={{ animation: 'fireEmbersWavy 3.2s ease-out infinite', animationDelay: '0.8s' }} />

                  {/* Darkness vignette consuming the avatar */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#000000_100%)] rounded-full mix-blend-multiply opacity-90" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(168,85,247,0.25)_95%)] rounded-full animate-[abyssBreath_4s_ease-in-out_infinite]" />

                  {/* Void dust / darkness particles */}
                  <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-purple-950/80 blur-[0.5px] animate-[abyssWarp_6s_infinite]" />
                  <div className="absolute bottom-[25%] right-[25%] w-3 h-3 rounded-full bg-black blur-[1px] animate-[abyssWarp_8s_infinite_2s]" />
                </div>
              )}
              {avatarFrame === "glitch" && (
                <div className="absolute inset-0 pointer-events-none z-20 animate-[cyberGlitch_6s_infinite]">
                  <div className="absolute -top-1.5 left-[15%] h-1.5 w-[70%] border-t-2 border-red-500 shadow-[0_0_5px_red]" />
                  <div className="absolute -bottom-1.5 left-[15%] h-1.5 w-[70%] border-b-2 border-cyan-400 shadow-[0_0_5px_cyan]" />
                </div>
              )}
              {avatarFrame === "divine" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 text-yellow-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.7)] animate-[starTwinkle_2s_ease-in-out_infinite] z-25">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  {/* Orbiting divine spark stars */}
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-yellow-100 animate-[starTwinkle_3s_ease-out_infinite]" />
                  <div className="absolute top-4 right-2 w-1 h-1 rounded-full bg-white animate-[starTwinkle_2.5s_ease-out_infinite_1.2s]" />
                </div>
              )}
              {avatarFrame === "creator" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Crown with dynamic glowing accent aura */}
                  <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full blur-md animate-pulse" style={{ backgroundColor: `${accentColor}40` }} />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-[smoothBreath_2.5s_ease-in-out_infinite] z-25" style={{ color: accentColor }}>
                    <Crown className="h-7 w-7" style={{ fill: accentColor, filter: `drop-shadow(0 0 5px ${accentColor})` }} />
                  </div>
                  
                  {/* Extra border design: Orbiting outer segmented rings */}
                  <div className="absolute inset-[-5px] rounded-full border-2 animate-[rotationCCW_8s_linear_infinite]" style={{
                    borderColor: `${accentColor}80 transparent ${accentColor}80 transparent`,
                  }} />
                  <div className="absolute inset-[-9px] rounded-full border border-dashed animate-[rotationCW_12s_linear_infinite]" style={{
                    borderColor: `${accentColor}50`,
                  }} />

                  {/* Orbiting light spots */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full" style={{ background: `radial-gradient(circle, ${accentColor}, transparent)`, animation: 'avatarSmokeOrbit 5s linear infinite' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: `radial-gradient(circle, #ffffff, transparent)`, animation: 'avatarSmokeOrbit 7s linear infinite 2s' }} />

                  {/* Floating Sparks matching accent color */}
                  <div className="absolute bottom-1 left-2 h-1.5 w-1.5 rounded-full shadow-lg" style={{ backgroundColor: accentColor, animation: 'fireEmbersWavy 3s ease-out infinite', boxShadow: `0 0 6px ${accentColor}` }} />
                  <div className="absolute bottom-3 right-3 h-2 w-2 rounded-full shadow-lg" style={{ backgroundColor: accentColor, animation: 'fireEmbersWavy 3.5s ease-out infinite 1.5s', boxShadow: `0 0 8px ${accentColor}` }} />
                  <div className="absolute bottom-5 left-5 h-1 w-1 rounded-full" style={{ backgroundColor: '#ffffff', animation: 'fireEmbersWavy 2.5s ease-out infinite 0.8s', boxShadow: '0 0 4px #ffffff' }} />

                  {/* Glowing S-RANK S-tier labels */}
                  <div className="absolute -top-1.5 -right-2.5 z-30 bg-slate-950 border-2 font-black px-1.5 py-0.5 rounded text-[8px] tracking-wider" style={{ borderColor: accentColor, color: accentColor, boxShadow: `0 0 8px ${accentColor}` }}>
                    CREATOR
                  </div>
                  <div className="absolute -bottom-2 -left-2.5 z-30 bg-slate-950 border font-black px-1.5 py-0.5 rounded text-[7px] text-white" style={{ borderColor: `${accentColor}80`, boxShadow: `0 0 5px ${accentColor}50` }}>
                    ⭐ ADMIN
                  </div>
                </div>
              )}

              {profile.data?.is_vip && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 rounded-full p-1.5 z-30 border border-amber-500/30 bg-zinc-900 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                >
                  <Crown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-2">
              {/* Username + role badges row */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{username || "Loading..."}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {userRoles.data?.includes("admin") && (
                    <Badge
                      style={{
                        borderColor: `${accentColor}30`,
                        backgroundColor: `${accentColor}12`,
                        color: accentColor,
                      }}
                      className="border transition-all duration-200 hover:brightness-110 hover:scale-[1.02] shadow-sm backdrop-blur-sm cursor-default"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                  {userRoles.data?.includes("moderator") && (
                    <Badge
                      style={{
                        borderColor: `${accentColor}30`,
                        backgroundColor: `${accentColor}12`,
                        color: accentColor,
                      }}
                      className="border transition-all duration-200 hover:brightness-110 hover:scale-[1.02] shadow-sm backdrop-blur-sm cursor-default"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Mod
                    </Badge>
                  )}
                  {userRoles.data?.includes("uploader") && (
                    <Badge
                      style={{
                        borderColor: `${accentColor}30`,
                        backgroundColor: `${accentColor}12`,
                        color: accentColor,
                      }}
                      className="border transition-all duration-200 hover:brightness-110 hover:scale-[1.02] shadow-sm backdrop-blur-sm cursor-default"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Uploader
                    </Badge>
                  )}
                  {profile.data?.is_vip && (
                    <Badge
                      className="border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    >
                      <Crown className="mr-1 h-3 w-3" /> VIP
                    </Badge>
                  )}
                </div>
              </div>

              {/* Title badge with refined animated effect */}
              {equippedBadge.data && (() => {
                let titleColor = equippedBadge.data.badge?.badge_color || accentColor;
                if (equippedBadge.data.badge?.name === "The Creator") {
                  titleColor = accentColor;
                }
                return (
                  <div 
                    className="group/title relative flex items-center gap-2 mt-2 text-xs font-bold w-fit border rounded-full px-4 py-1.5 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      borderColor: `${titleColor}35`,
                      background: `linear-gradient(135deg, ${titleColor}0a, transparent)`,
                    }}
                  >
                    {/* Animated gradient underline that sweeps left to right */}
                    <span 
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
                      style={{ 
                        backgroundImage: `linear-gradient(90deg, transparent, ${titleColor}50, ${titleColor}, ${titleColor}50, transparent)`,
                        backgroundSize: '200% 100%',
                        animation: 'titleUnderlineSweep 3s linear infinite',
                      }}
                    />
                    
                    {/* Subtle shimmer sweep across the badge */}
                    <span 
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover/title:opacity-100 transition-opacity"
                      style={{ 
                        backgroundImage: `linear-gradient(105deg, transparent 40%, ${titleColor}12 50%, transparent 60%)`,
                        backgroundSize: '250% 100%',
                        animation: 'titleShimmerSweep 2s ease-in-out infinite',
                      }}
                    />

                    {/* Tiny floating ember particles */}
                    <span className="absolute -top-0.5 left-[25%] w-[3px] h-[3px] rounded-full pointer-events-none" style={{ background: titleColor, opacity: 0.6, animation: 'titleEmberFloat 2.5s ease-out infinite' }} />
                    <span className="absolute -top-0.5 left-[65%] w-[2px] h-[2px] rounded-full pointer-events-none" style={{ background: titleColor, opacity: 0.5, animation: 'titleEmberFloat 3s ease-out infinite 1.2s' }} />

                    <span className="text-muted-foreground">Title:</span>
                    <span style={{ color: titleColor }}>
                      <BadgeIcon icon={equippedBadge.data.badge?.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span 
                      style={{ color: titleColor }}
                    >
                      {equippedBadge.data.badge?.name}
                    </span>
                    
                    {/* Small flame icon with gentle animation */}
                    <Flame 
                      className="h-3 w-3 ml-0.5" 
                      style={{ 
                        color: titleColor,
                        animation: 'flameFlicker 1.5s ease-in-out infinite',
                        opacity: 0.8,
                      }} 
                    />
                  </div>
                );
              })()}

              {/* Email */}
              <p className="mt-2 text-sm text-muted-foreground">{profile.data?.email}</p>

              {/* Social links + join date row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SocialLinksDisplay values={socialLinks} accentColor={accentColor} />
                <Badge variant="outline" className="text-xs border border-border/50 bg-secondary/20 text-muted-foreground shadow-sm">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" style={{ color: accentColor }} />
                  Joined {new Date(profile.data?.created_at || "").toLocaleDateString()}
                </Badge>
              </div>

              {/* Bio */}
              {bio && (
                <p 
                  className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground border border-border/30 bg-card/25 backdrop-blur-md rounded-xl p-3.5"
                >
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Level bar ─── */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6">
        <div
          className="rounded-xl border border-border/30 bg-card/25 backdrop-blur-md p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" style={{ color: accentColor }} />
              {isAdmin ? (
                <span className="font-bold text-foreground">Maxed Out</span>
              ) : (
                <span className="font-bold">Level {level}</span>
              )}
              <Sparkles className="h-4 w-4 text-muted-foreground/60" />
            </div>
            {isAdmin ? (
              <span className="text-sm font-semibold" style={{ color: accentColor }}>
                Infinite XP & Aura
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {xp} / {xpForNextLevel} XP
              </span>
            )}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: isAdmin ? '100%' : `${xpProgress}%`,
                background: accentColor,
                opacity: 0.9,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div
        className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6"
        style={{ animation: "profileFadeInUp 0.6s ease-out 0.1s both" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Reading Streak"
            value={streaks.current}
            suffix=" days"
            icon={<Flame className="h-6 w-6" />}
            accentColor="#F97316"
          />
          <StatCard
            label="Chapters Read"
            value={readingStats.data?.chapters || 0}
            icon={<BookOpen className="h-6 w-6" />}
            accentColor="#3B82F6"
          />
          <StatCard
            label="Series Followed"
            value={readingStats.data?.series || 0}
            icon={<Star className="h-6 w-6" />}
            accentColor="#F59E0B"
          />
          <StatCard
            label="Comments"
            value={readingStats.data?.comments || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div
        className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6 pb-12"
        style={{ animation: "profileFadeInUp 0.6s ease-out 0.2s both" }}
      >
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-6 gap-1 p-1">
            <TabsTrigger value="edit" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="xp" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">XP</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Edit Profile Tab ─── */}
          <TabsContent value="edit">
            <Card className="p-4 sm:p-6">
              <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-8">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <User className="h-5 w-5" style={{ color: accentColor }} />
                    Basic Info
                  </h3>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" value={profile.data?.email ?? ""} disabled className="pl-10" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="username"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        minLength={3} 
                        required 
                        className="pl-10"
                        placeholder="Your username"
                      />
                    </div>
                  </div>



                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio"
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500 characters</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-border/50" />

                {/* Appearance Customization Section */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Palette className="h-5 w-5" style={{ color: accentColor }} />
                    Appearance Customization
                  </h3>

                  <AccentColorPicker value={accentColor} onChange={setAccentColor} />

                  {/* Avatar Frame Selection */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-pulse" style={{ color: accentColor }} />
                      <Label className="text-base font-semibold">Avatar Frame</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Equip a premium animated frame around your avatar image.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { id: "none", name: "None", description: "Default accent ring", color: accentColor, gradient: 'none' },
                        { id: "creator", name: "The Creator", description: "Universal administrator status. Responsive to custom colors.", color: accentColor, gradient: `linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.1), transparent)` },
                        // Level-based (Initiate to Vanguard)
                        { id: "bronze", name: "Bronze Initiate", description: "Polished bronze alloy ring of the novice reader", color: "#CD7F32", gradient: 'linear-gradient(135deg, #CD7F3220, #8c521a15, #ffb67710)' },
                        { id: "iron", name: "Iron Warrior", description: "Heavy dark iron ring forged through persistence", color: "#708090", gradient: 'linear-gradient(135deg, #70809020, #3a445415, #b0c4de10)' },
                        { id: "silver", name: "Silver Knight", description: "Shining silver standard of the dedicated reader", color: "#C0C0C0", gradient: 'linear-gradient(135deg, #C0C0C020, #7f7f7f15, #ffffff10)' },
                        { id: "sakura", name: "Sakura Dream", description: "Enchanted blossom drift & glow", color: "#F472B6", gradient: 'linear-gradient(135deg, #F472B618, #FDA4AF15, #E879F910)' },
                        { id: "platinum", name: "Platinum Vanguard", description: "Refined platinum band with soft cyan starlight sweeps", color: "#E5E4E2", gradient: 'linear-gradient(135deg, #E5E4E220, #d3d3d315, #06B6D415)' },
                        { id: "neon", name: "Neon Phoenix", description: "Rotating neon aura with lightning", color: "#EC4899", gradient: 'linear-gradient(135deg, #A855F720, #EC489920, #06B6D420)' },
                        { id: "qi", name: "Heavenly Qi", description: "Celestial jade runes & sparkles", color: "#10B981", gradient: 'linear-gradient(135deg, #10B98118, #05966915, #FBBF2410)' },
                        { id: "cyber", name: "Cyber Nexus", description: "Futuristic holographic targeting reticle", color: "#06B6D4", gradient: 'linear-gradient(135deg, #06B6D418, #0ea5e910, #c084fc12)' },
                        { id: "gold", name: "Golden Royal", description: "Shimmering gold border & crown", color: "#F59E0B", gradient: 'linear-gradient(135deg, #ffd70015, #F59E0B15, #ffeb9915)' },
                        { id: "glitch", name: "Chronos Distortion", description: "Flickering temporal aberration with chromatic splits", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444415, #06B6D415, #00000020)' },
                        // Chapter-based (Scholar to Immortal)
                        { id: "apprentice", name: "Manga Scholar", description: "Weathered parchment scroll representing initial studies", color: "#D2B48C", gradient: 'linear-gradient(135deg, #D2B48C20, #a0522d15, #ffebcd10)' },
                        { id: "scholar", name: "Scroll Keeper", description: "Jade-inlaid border of an avid reader of ancient scripts", color: "#8FBC8F", gradient: 'linear-gradient(135deg, #8FBC8F20, #2e8b5715, #f0fff010)' },
                        { id: "sage", name: "Sage Reader", description: "Pulsing mystical jade mist reflecting ancient wisdom", color: "#00FA9A", gradient: 'linear-gradient(135deg, #00FA9A20, #20B2AA15, #00FA9A10)' },
                        { id: "elder", name: "Lore Master", description: "Deep amethyst runic ring denoting high library status", color: "#DA70D6", gradient: 'linear-gradient(135deg, #DA70D620, #8A2BE215, #DA70D610)' },
                        { id: "immortal", name: "Immortal Reader", description: "Radiant spiritual flames of one who has transcended regular lore", color: "#FFD700", gradient: 'linear-gradient(135deg, #FFD70020, #FFA50015, #FF8C0010)' },
                        { id: "fire", name: "Fiery Aura", description: "Volcanic flame ring with embers", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444418, #f9731615, #b91c1c10)' },
                        { id: "shadow", name: "Shadow Monarch", description: "Void energy tendrils & dark wisps", color: "#6366F1", gradient: 'linear-gradient(135deg, #6366F118, #4f46e515, #1e1b4b12)' },
                        { id: "abyss", name: "Abyssal Void", description: "Swirling dimensional rift of pure void energy", color: "#D946EF", gradient: 'linear-gradient(135deg, #D946EF20, #4A044E18, #3B076415)' },
                        // Streak & Series based
                        { id: "asura", name: "Murim Asura", description: "Demonic crimson mist & rage aura", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444420, #7f1d1d18, #00000015)' },
                        { id: "divine", name: "Seraphic Light", description: "Angelic golden halos & glowing divine feathers", color: "#FCD34D", gradient: 'linear-gradient(135deg, #FCD34D15, #FFFFFF12, #FFFBEB10)' },
                        { id: "system", name: "System Hunter", description: "S-Rank cosmic status interface", color: "#06B6D4", gradient: 'linear-gradient(135deg, #06B6D418, #0ea5e912, #eab30810)' },
                      ].map((frame) => {
                        const isSelected = avatarFrame === frame.id;
                        const unlocked = isFrameUnlocked(frame.id);
                        const req = FRAME_REQUIREMENTS[frame.id];
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => {
                              if (!unlocked) {
                                toast.error(`Unlock requirement: ${req?.text || ""}`);
                                return;
                              }
                              setAvatarFrame(frame.id);
                            }}
                            className={`group/card relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-300 focus:outline-none overflow-hidden ${unlocked ? 'hover:scale-[1.02]' : 'opacity-75 bg-secondary/10 border-dashed cursor-not-allowed'}`}
                            style={{
                              borderColor: isSelected 
                                ? `${frame.color}80` 
                                : !unlocked 
                                  ? 'var(--border)' 
                                  : `${frame.color}20`,
                              background: isSelected 
                                ? frame.gradient 
                                : !unlocked 
                                  ? 'rgba(0, 0, 0, 0.15)' 
                                  : `${frame.color}06`,
                              boxShadow: isSelected 
                                ? `0 0 20px ${frame.color}15, inset 0 0 15px ${frame.color}08` 
                                : 'none',
                            }}
                          >
                            {/* Hover shimmer overlay */}
                            <div 
                              className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                              style={{ 
                                backgroundImage: `linear-gradient(90deg, transparent, ${frame.color}08, transparent)`,
                                backgroundSize: '200% 100%',
                                animation: 'frameCardShimmer 2s linear infinite',
                              }}
                            />
                            {/* Active glow dot */}
                            {isSelected && (
                              <div 
                                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                                style={{ 
                                  background: frame.color,
                                  boxShadow: `0 0 6px ${frame.color}, 0 0 12px ${frame.color}60`,
                                }}
                              />
                            )}
                            <div
                              className="relative h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-110"
                              style={{
                                ...getAvatarFrameStyles(frame.id, accentColor),
                                background: frame.id === "none" ? accentColor : undefined,
                                padding: '2px',
                              }}
                            >
                              {/* Spinners scaled down */}
                              {frame.id === "bronze" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8c521a] via-[#cd7f32] to-[#ffb677] animate-[smoothBreath_5s_ease-in-out_infinite]" />
                                  <div className="absolute bottom-0.5 left-1 w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />
                                </>
                              )}
                              {frame.id === "iron" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3a4454] via-[#708090] to-[#b0c4de] animate-[smoothBreath_5s_ease-in-out_infinite]" />
                                  <div className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                                </>
                              )}
                              {frame.id === "silver" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f7f7f] via-[#C0C0C0] to-[#ffffff] animate-[smoothBreath_4s_ease-in-out_infinite]" />
                                  <div className="absolute top-0.5 left-1.5 w-1 h-1 rounded-full bg-white animate-ping" />
                                </>
                              )}
                              {frame.id === "platinum" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                                  <div className="absolute inset-[-55%] rounded-full bg-[conic-gradient(from_0deg,#d3d3d3,#E5E4E2,#06B6D4,#d3d3d3)] animate-[rotationCW_6s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full bg-background z-5" />
                                  <div className="absolute top-0 left-0 h-1 w-1 border-t border-l border-cyan-400 z-10" />
                                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-cyan-400 z-10" />
                                </div>
                              )}
                              {frame.id === "apprentice" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#a0522d] via-[#D2B48C] to-[#ffebcd]" />
                                  <div className="absolute top-[20%] left-[-1px] bottom-[20%] w-0.8 bg-[#8b5a2b] z-20" />
                                  <div className="absolute top-[20%] right-[-1px] bottom-[20%] w-0.8 bg-[#8b5a2b] z-20" />
                                </>
                              )}
                              {frame.id === "scholar" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2e8b57] via-[#8FBC8F] to-[#f0fff0]" />
                                  <div className="absolute top-[20%] left-[-1px] bottom-[20%] w-1 bg-emerald-700 z-20 border border-yellow-400" />
                                  <div className="absolute top-[20%] right-[-1px] bottom-[20%] w-1 bg-emerald-700 z-20 border border-yellow-400" />
                                </>
                              )}
                              {frame.id === "sage" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                                  <div className="absolute inset-[-55%] rounded-full bg-[conic-gradient(from_0deg,#00FA9A,transparent,#20B2AA,transparent,#00FA9A)] animate-[rotationCW_5s_linear_infinite]" />
                                  <div className="absolute inset-[1.5px] rounded-full border border-dashed border-emerald-400/40 animate-[rotationCCW_10s_linear_infinite] z-5" />
                                </div>
                              )}
                              {frame.id === "elder" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950">
                                  <div className="absolute inset-[-55%] rounded-full bg-[conic-gradient(from_0deg,#DA70D6,#8A2BE2,#DA70D6)] animate-[rotationCW_4s_linear_infinite]" />
                                  <div className="absolute inset-[1.5px] rounded-full border border-dotted border-purple-400/40 animate-[rotationCCW_8s_linear_infinite] z-5" />
                                </div>
                              )}
                              {frame.id === "immortal" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-950 animate-[divineHalo_4s_ease-in-out_infinite]">
                                  <div className="absolute inset-[-55%] rounded-full bg-[conic-gradient(from_0deg,#FFD700,#FFA500,#FF8C00,#FFD700)] animate-[rotationCW_3s_linear_infinite]" />
                                </div>
                              )}
                              {frame.id === "neon" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden animate-[lightningFlicker_6s_ease-in-out_infinite]">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-[rotationCW_4s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full bg-background z-5" />
                                  <div className="absolute inset-[1px] rounded-full overflow-hidden z-6">
                                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#EC4899,#06B6D4,#A855F7,#EC4899)] animate-[rotationCCW_3s_linear_infinite]" />
                                  </div>
                                </div>
                              )}
                              {frame.id === "gold" && (
                                <>
                                  <div className="absolute inset-[-1px] rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99] animate-[rotationCW_10s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full bg-gradient-to-bl from-[#ffeb99] via-[#ffd700] to-[#aa7c11] animate-[rotationCCW_8s_linear_infinite]" />
                                </>
                              )}
                              {frame.id === "cyber" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-[rotationCW_6s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full border border-dashed border-cyan-400/40 animate-[rotationCCW_12s_linear_infinite] z-5" />
                                </div>
                              )}
                              {frame.id === "fire" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-[rotationCW_3s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full overflow-hidden z-5">
                                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#7f1d1d,#f97316,#ef4444,#7f1d1d)] animate-[rotationCCW_4s_linear_infinite]" />
                                  </div>
                                </div>
                              )}
                              {frame.id === "sakura" && (
                                <>
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9] animate-[smoothBreath_4s_ease-in-out_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full bg-gradient-to-bl from-[#E879F9] via-[#F472B6] to-[#FDA4AF] animate-[rotationCW_8s_linear_infinite]" />
                                </>
                              )}
                              {frame.id === "shadow" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-[rotationCW_5s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full overflow-hidden z-5">
                                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#1e1b4b,#06b6d4,#4f46e5,#1e1b4b)] animate-[rotationCCW_6s_linear_infinite]" />
                                  </div>
                                </div>
                              )}
                              {frame.id === "qi" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-[rotationCW_6s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full border border-emerald-400/40 bg-emerald-950/20 animate-[runeJadePulse_8s_linear_infinite] z-5" />
                                </div>
                              )}
                              {frame.id === "asura" && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000] animate-[asuraRage_2.5s_ease-in-out_infinite] overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,transparent,#7f1d1d,transparent,#ef4444)] animate-[rotationCW_4s_linear_infinite] opacity-80" />
                                </div>
                              )}
                              {frame.id === "system" && (
                                <div className="absolute inset-0 rounded-full border border-cyan-400 bg-cyan-950/20 animate-[asuraRage_4s_ease-in-out_infinite] overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,rgba(6,182,212,0.25),transparent_40%,transparent)] animate-[rotationCW_3s_linear_infinite]" />
                                </div>
                              )}
                              {frame.id === "abyss" && (
                                <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden animate-[abyssVoidGlow_5s_ease-in-out_infinite]">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#D946EF,#4A044E,#3B0764,#D946EF)] animate-[rotationCW_8s_linear_infinite]" />
                                  <div className="absolute inset-[1px] rounded-full bg-background z-5" />
                                </div>
                              )}
                              {frame.id === "glitch" && (
                                <div className="absolute inset-0 rounded-full border border-red-500/40 bg-slate-950/20 overflow-hidden animate-[glitchFlicker_4s_linear_infinite]">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,#06b6d4,#ef4444)] animate-[rotationCW_4s_linear_infinite]" />
                                </div>
                              )}
                              {frame.id === "divine" && (
                                <div className="absolute inset-0 rounded-full bg-amber-50/10 overflow-hidden animate-[divineHalo_4s_ease-in-out_infinite]">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#FCD34D,#FFFFFF,#FFFBEB,#FCD34D)] animate-[rotationCW_6s_linear_infinite]" />
                                </div>
                              )}
                              {frame.id === "creator" && (
                                <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden" style={{
                                  boxShadow: `0 0 15px ${accentColor}, inset 0 0 8px ${accentColor}`,
                                }}>
                                  <div className="absolute inset-[-55%] rounded-full" style={{
                                    background: `conic-gradient(from 0deg, ${accentColor}, transparent, ${accentColor}80, transparent, ${accentColor})`,
                                    animation: 'rotationCW 4s linear infinite',
                                  }} />
                                </div>
                              )}

                              {frame.id !== "none" && (
                                <div className="absolute inset-[2.5px] rounded-full bg-background z-10" />
                              )}

                              <div className="h-full w-full rounded-full bg-background flex items-center justify-center relative z-10 overflow-hidden p-0.5">
                                <span className="text-[9px] font-black" style={{ color: frame.color }}>
                                  {username?.slice(0, 2)?.toUpperCase() || "YO"}
                                </span>
                              </div>

                              {/* Overlays scaled down */}
                              {frame.id === "cyber" && (
                                <div className="absolute inset-0 pointer-events-none z-20 animate-[cyberGlitch_8s_infinite]">
                                  <div className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-cyan-400 rounded-tl-sm shadow-[0_0_3px_cyan]" />
                                  <div className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-cyan-400 rounded-tr-sm shadow-[0_0_3px_cyan]" />
                                  <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-cyan-400 rounded-bl-sm shadow-[0_0_3px_cyan]" />
                                  <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-cyan-400 rounded-br-sm shadow-[0_0_3px_cyan]" />
                                </div>
                              )}
                              {frame.id === "system" && (
                                <div className="absolute -top-1 -right-1 z-30 bg-slate-950 text-cyan-400 text-[4px] font-black px-0.5 rounded border border-cyan-400 shadow-[0_0_3px_cyan] scale-75 origin-top-right">
                                  S
                                </div>
                              )}
                              {frame.id === "divine" && (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-yellow-300 z-20 scale-75 origin-top" style={{ fontSize: '8px' }}>
                                  ✨
                                </div>
                              )}
                              {frame.id === "creator" && (
                                <div className="absolute -top-1.2 left-1/2 -translate-x-1/2 text-amber-400 z-20 scale-75 origin-top" style={{ fontSize: '8px', color: accentColor }}>
                                  👑
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 relative">
                              <div className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                                <span style={{ color: isSelected ? frame.color : undefined, textShadow: isSelected ? `0 0 8px ${frame.color}40` : 'none' }}>
                                  {frame.name}
                                </span>
                                {!unlocked && (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                {isSelected && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-bold border" style={{ backgroundColor: `${frame.color}15`, color: frame.color, borderColor: `${frame.color}30`, boxShadow: `0 0 8px ${frame.color}20` }}>
                                    ✦ Equipped
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {!unlocked && req ? (
                                  <span className="text-destructive font-medium flex items-center gap-1">
                                    🔒 {req.text}
                                  </span>
                                ) : (
                                  <span className="truncate block">{frame.description}</span>
                                )}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-border/50" />

                {/* Social Links Section */}
                <SocialLinksEditor
                  values={socialLinks}
                  onChange={(key: string, value: string) =>
                    setSocialLinks((prev: any) => ({ ...prev, [key]: value }))
                  }
                />

                <Button
                  type="submit"
                  disabled={save.isPending}
                  className="w-full h-12 text-sm font-bold rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    backgroundColor: accentColor,
                    color: "white",
                  }}
                >
                  {save.isPending ? "Saving..." : "Save All Changes"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* ─── Profile Badges Tab ─── */}
          <TabsContent value="badges">
            <Card className="p-4 sm:p-6">
              <ProfileBadges accentColor={accentColor} />
            </Card>
          </TabsContent>

          {/* ─── Comment History Tab ─── */}
          <TabsContent value="comments">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" style={{ color: accentColor }} />
                  Comment History
                </h2>
                <Badge variant="outline" className="text-xs">
                  {commentHistory.data?.length || 0} comments
                </Badge>
              </div>
              {commentHistory.isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-lg border border-border/40 bg-card p-4 animate-pulse">
                      <div className="h-4 w-3/4 bg-secondary/60 rounded" />
                      <div className="mt-2 h-3 w-1/2 bg-secondary/40 rounded" />
                    </div>
                  ))}
                </div>
              ) : commentHistory.data && commentHistory.data.length > 0 ? (
                <div className="space-y-3">
                  {commentHistory.data.map((comment: any) => {
                    const seriesInfo = commentSeriesInfo.data?.get(comment.series_id);
                    return (
                      <div
                        key={comment.id}
                        className="group rounded-lg border border-border/40 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}03, transparent)`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Comment content */}
                            <p className="text-sm leading-relaxed text-foreground">
                              {comment.is_spoiler ? (
                                <span className="italic text-muted-foreground">⚠️ Spoiler comment</span>
                              ) : comment.is_hidden ? (
                                <span className="italic text-muted-foreground">🚫 Hidden by moderator</span>
                              ) : (
                                (() => {
                                  const clean = stripBbCode(comment.content || "");
                                  return clean.length > 200 ? clean.slice(0, 200) + "..." : clean;
                                })()
                              )}
                            </p>

                            {/* Attachment indicator */}
                            {comment.attachment_url && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>📎</span>
                                <span>{comment.attachment_type === "gif" ? "GIF" : "Image"} attached</span>
                              </div>
                            )}

                            {/* Meta row */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(comment.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                              <span className="text-border">•</span>
                              <span>{new Date(comment.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                              {seriesInfo && (
                                <>
                                  <span className="text-border">•</span>
                                  <Link
                                    to="/title/$slug"
                                    params={{ slug: seriesInfo.slug }}
                                    className="font-medium transition-colors hover:underline"
                                    style={{ color: accentColor }}
                                  >
                                    {seriesInfo.title}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status badges */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {comment.is_spoiler && (
                              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/10">
                                Spoiler
                              </Badge>
                            )}
                            {comment.is_hidden && (
                              <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No comments posted yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start reading and join the conversation!</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── Statistics Tab ─── */}
          <TabsContent value="stats">
            <div className="space-y-6">
              <ReadingHeatmap />

              <Card className="p-4 sm:p-6">
                <h2 className="mb-4 text-xl font-bold">Your Statistics</h2>
                <div className="space-y-6">
                  {/* Reading Activity */}
                  <div>
                    <h3 className="mb-3 font-semibold">Reading Activity</h3>
                    <div className="space-y-3">
                      <StatRow icon={<BookOpen className="h-4 w-4 text-blue-500" />} label="Chapters Read" value={readingStats.data?.chapters || 0} />
                      <StatRow icon={<Star className="h-4 w-4 text-yellow-500" />} label="Series Followed" value={readingStats.data?.series || 0} />
                      <StatRow icon={<Flame className="h-4 w-4 text-orange-500" />} label="Current Streak" value={`${streaks.current} days`} />
                    </div>
                  </div>

                  {/* Community Engagement */}
                  <div>
                    <h3 className="mb-3 font-semibold">Community Engagement</h3>
                    <div className="space-y-3">
                      <StatRow icon={<MessageSquare className="h-4 w-4 text-green-500" />} label="Comments Posted" value={readingStats.data?.comments || 0} />
                      <StatRow icon={<Star className="h-4 w-4 text-purple-500" />} label="Ratings Given" value={readingStats.data?.ratings || 0} />
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div>
                    <h3 className="mb-3 font-semibold">Level Progress</h3>
                    <div className="space-y-3">
                      <StatRow icon={<Trophy className="h-4 w-4" style={{ color: accentColor }} />} label="Current Level" value={isAdmin ? "Maxed Out" : `Level ${level}`} />
                      <StatRow icon={<TrendingUp className="h-4 w-4 text-blue-500" />} label="Total XP" value={isAdmin ? "Infinite Aura and XP" : xp} />
                      <StatRow icon={<TrendingUp className="h-4 w-4 text-green-500" />} label="Next Level" value={isAdmin ? "∞" : `${xpForNextLevel - xp} XP needed`} />
                      <div className="mt-2">
                        <Progress value={isAdmin ? 100 : xpProgress} className="h-2" />
                        <p className="mt-1 text-center text-xs text-muted-foreground">
                          {isAdmin ? "Infinite Aura and XP — beyond all levels" : `${xpProgress.toFixed(1)}% to Level ${level + 1}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ─── XP History Tab ─── */}
          <TabsContent value="xp">
            <Card className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
                    XP History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Every XP grant, newest first.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {xpHistory.data?.length ?? 0} entries
                </Badge>
              </div>

              {xpHistory.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/60" />
                  ))}
                </div>
              ) : xpHistory.data && xpHistory.data.length > 0 ? (
                <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/40 bg-card">
                  {xpHistory.data.map((row) => {
                    const series =
                      row.reference_type === "series" && row.reference_id
                        ? xpSeriesLookup.data?.get(row.reference_id)
                        : null;
                    const chapter =
                      row.reference_type === "chapter" && row.reference_id
                        ? xpChapterLookup.data?.get(row.reference_id)
                        : null;

                    return (
                      <div
                        key={row.id}
                        className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-secondary/30"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">
                              {xpSourceLabel(row.source)}
                            </span>
                            {chapter && (
                              <Link
                                to="/title/$slug/$chapterSlug"
                                params={{ slug: chapter.series_slug, chapterSlug: chapter.slug }}
                                className="text-xs font-medium hover:underline"
                                style={{ color: accentColor }}
                              >
                                {chapter.series_title} · Ch. {chapter.chapter_number}
                              </Link>
                            )}
                            {series && (
                              <Link
                                to="/title/$slug"
                                params={{ slug: series.slug }}
                                className="text-xs font-medium hover:underline"
                                style={{ color: accentColor }}
                              >
                                {series.title}
                              </Link>
                            )}
                          </div>
                          {row.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {row.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(row.created_at).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <Badge
                          className={`shrink-0 text-xs font-semibold ${
                            row.amount >= 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : "border-red-500/40 bg-red-500/10 text-red-400"
                          }`}
                          variant="outline"
                        >
                          {row.amount >= 0 ? "+" : ""}
                          {row.amount} XP
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No XP earned yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Read a chapter, follow a series, or finish a title to start your ledger.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── Privacy Settings Tab ─── */}
          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          {/* ─── Profile Widgets Tab (hidden, accessed via button) ─── */}
          <TabsContent value="widgets">
            <Card className="p-4 sm:p-6">
              <ProfileWidgets />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Widget Link */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const widgetButton = document.querySelector('[value="widgets"]') as HTMLElement;
              if (widgetButton) {
                widgetButton.click();
                widgetButton.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <Code className="h-4 w-4" />
            Generate Profile Widget
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function StatCard({
  label,
  value,
  suffix = "",
  icon,
  accentColor,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <Card
      className="group relative overflow-hidden p-4 transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: `${accentColor}20`,
      }}
    >
      {/* Subtle accent glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accentColor }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-base font-normal text-muted-foreground">{suffix}</span>}
          </p>
        </div>
        <div
          className="grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
