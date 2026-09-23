"use client";

import { Link, useNavigate } from "@/lib/router-compat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pageTitle } from "@/lib/brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Flame,
  BookOpen,
  Star,
  Calendar,
  Shield,
  Crown,
  Award,
  Sparkles,
  UserX,
  ArrowLeft,
  Clock,
  Lock,
  Orbit,
  Sword,
  MessageSquare,
  Upload,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLinksDisplay } from "@/components/profile/SocialLinks";
import { BadgeIcon, enhanceBadge } from "@/lib/profileBadges";
import { stripBbCode } from "@/lib/bbcode";
import { parseSafeAttachmentUrls } from "@/lib/safe-url";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SectionPagination } from "@/components/SectionPagination";
import { CommentAttachmentGrid } from "@/components/comments/CommentAttachmentGrid";
import { formatAppDate } from "@/lib/date";
import { getCleanChapterSlug } from "@/lib/chapter-utils";
import { PageKineticLoader } from "@/components/ui/kinetic-text-loader";
import {
  $getPublicUserRoles,
  $getPublicEquippedBadge,
  $getPublicReadingPreferences,
} from "@/lib/api/public-profile.actions";

type PublicProfileStats = {
  chapters_read: number;
  series_followed: number;
  achievements_unlocked: number;
  show_reading_history: boolean;
  show_achievements: boolean;
  show_statistics: boolean;
};

type PublicLibraryItem = {
  library_id: string;
  updated_at: string;
  reading_status: string;
  series_id: string;
  series_slug: string;
  series_title: string;
  series_cover_url: string | null;
  series_type: string;
  series_status: string;
  rating_average: number;
  view_count: number;
};


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
@keyframes titleUnderlineSweep {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes titleShimmerSweep {
  0% { background-position: -250% center; }
  100% { background-position: 250% center; }
}
@keyframes titleEmberFloat {
  0% { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
  20% { opacity: 0.8; }
  50% { transform: translateY(-10px) translateX(3px) scale(0.6); opacity: 0.6; }
  80% { opacity: 0.2; }
  100% { transform: translateY(-20px) translateX(-2px) scale(0.3); opacity: 0; }
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

export default function UserProfileContent({ username }: { username: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [uploadedPage, setUploadedPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [libraryPage, setLibraryPage] = useState(1);

  const decodedUsername = useMemo(() => {
    try {
      return decodeURIComponent(username).trim();
    } catch {
      return (username || "").trim();
    }
  }, [username]);

  // Fetch public profile by username (supports URL decoding and case-insensitive matching)
  const profile = useQuery({
    queryKey: ["public-profile", decodedUsername],
    queryFn: async () => {
      // 1. Try case-insensitive matching on decoded username
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", decodedUsername)
        .maybeSingle();

      // 2. Fallback to raw param if different
      if (!data && decodedUsername !== username) {
        const fallback = await supabase
          .from("profiles")
          .select("*")
          .ilike("username", username)
          .maybeSingle();
        data = fallback.data;
      }

      // 3. Fallback for legacy username alias 'vnr610'
      if (!data && (decodedUsername.toLowerCase() === "vnr610" || username.toLowerCase() === "vnr610")) {
        const legacy = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", "8a440e3d-b3d0-4103-a131-77c6d8572fa5")
          .maybeSingle();
        data = legacy.data;
      }

      if (error) throw error;
      return data as any;
    },
    staleTime: 30 * 1000,
  });

  // Fetch user roles
  // Fetch user roles
  const userRoles = useQuery({
    queryKey: ["public-profile-roles", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [];
      // 1. Fetch via server action (bypasses RLS so anonymous and other users see real roles)
      const serverRoles = await $getPublicUserRoles(profile.data.user_id);
      if (serverRoles && serverRoles.length > 0) return serverRoles;

      // 2. Client fallback via has_role RPC
      try {
        const [adminRes, modRes, uploaderRes] = await Promise.all([
          supabase.rpc("has_role", { _user_id: profile.data.user_id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: profile.data.user_id, _role: "moderator" }),
          supabase.rpc("has_role", { _user_id: profile.data.user_id, _role: "uploader" }),
        ]);
        const roles: string[] = [];
        if (adminRes.data) roles.push("admin");
        if (modRes.data) roles.push("moderator");
        if (uploaderRes.data) roles.push("uploader");
        if (roles.length > 0) return roles;
      } catch {}

      // 3. Fallback for legacy admin alias
      if (profile.data?.username?.toLowerCase() === "vnr610" || decodedUsername.toLowerCase() === "vnr610") {
        return ["user", "admin"];
      }

      return ["user"];
    },
    enabled: !!profile.data?.user_id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch public aggregate stats through an RPC so RLS-protected rows stay private.
  const publicStats = useQuery({
    queryKey: ["public-profile-stats", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) {
        return {
          chapters_read: 0,
          series_followed: 0,
          achievements_unlocked: 0,
          show_reading_history: false,
          show_achievements: false,
          show_statistics: false,
        } satisfies PublicProfileStats;
      }

      const { data, error } = await (supabase as any)
        .rpc("get_public_profile_stats", { _profile_user_id: profile.data.user_id })
        .maybeSingle();

      if (error) throw error;

      return {
        chapters_read: Number(data?.chapters_read ?? 0),
        series_followed: Number(data?.series_followed ?? 0),
        achievements_unlocked: Number(data?.achievements_unlocked ?? 0),
        show_reading_history: data?.show_reading_history === true,
        show_achievements: data?.show_achievements === true,
        show_statistics: data?.show_statistics === true,
      } satisfies PublicProfileStats;
    },
    enabled: !!profile.data?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch equipped badge/title for this user
  const equippedBadge = useQuery({
    queryKey: ["public-profile-equipped-badge", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return null;
      let data = await $getPublicEquippedBadge(profile.data.user_id);
      if (!data) {
        const fallback = await supabase
          .from("user_badges")
          .select(`
            *,
            badge:badge_id(*)
          `)
          .eq("user_id", profile.data.user_id)
          .eq("is_equipped", true)
          .maybeSingle();
        data = fallback.data;
      }
      if (data && data.badge) {
        data.badge = enhanceBadge(data.badge);
      }
      return data as any;
    },
    enabled: !!profile.data?.user_id && publicStats.data?.show_achievements !== false,
    staleTime: 2 * 60 * 1000,
  });

  const isProfilePublic = (profile.data?.profile_visibility ?? "public") === "public";
  // Directly sync with profiles DB record and publicStats fallback
  const showLibraries = (profile.data?.show_reading_history ?? publicStats.data?.show_reading_history ?? true) === true;
  const showAchievements = (profile.data?.show_achievements ?? publicStats.data?.show_achievements ?? true) === true;
  const showStatistics = (profile.data?.show_statistics ?? publicStats.data?.show_statistics ?? true) === true;
  const showStatsStrip = isProfilePublic && showLibraries && showAchievements && showStatistics;

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = keyframeStyles;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  useEffect(() => {
    const userId = profile.data?.user_id;
    if (!userId) return;

    const refreshPublicProfile = () => {
      qc.invalidateQueries({ queryKey: ["public-profile", decodedUsername] });
      qc.invalidateQueries({ queryKey: ["public-profile", username] });
      qc.invalidateQueries({ queryKey: ["public-profile-stats", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-library", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-reading-preferences", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-comments", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-comments-count", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-equipped-badge", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-roles", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-uploaded-series"] });
    };

    const channel = supabase
      .channel(`public-profile-sync-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reading_history", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_library", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "series_follows", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_badges", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chapters" },
        () => {
          qc.invalidateQueries({ queryKey: ["public-profile-uploaded-series"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.data?.user_id, qc, username]);

  const publicLibrary = useQuery({
    queryKey: ["public-profile-library", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [] as PublicLibraryItem[];

      const { data, error } = await supabase
        .from("user_library")
        .select(`
          id,
          updated_at,
          reading_status,
          series:series_id (
            id,
            slug,
            title,
            cover_url,
            type,
            status,
            rating_average,
            view_count,
            is_hidden
          )
        `)
        .eq("user_id", profile.data.user_id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.warn("Direct user_library query failed, trying RPC fallback:", error);
        const { data: rpcData, error: rpcError } = await (supabase as any)
          .rpc("get_public_library_items", {
            _profile_user_id: profile.data.user_id,
            _limit: 500,
          });
        if (rpcError) throw rpcError;
        return (rpcData ?? []).map((item: any) => ({
          library_id: item.library_id,
          updated_at: item.updated_at,
          reading_status: item.reading_status,
          series_id: item.series_id,
          series_slug: item.series_slug,
          series_title: item.series_title,
          series_cover_url: item.series_cover_url,
          series_type: item.series_type,
          series_status: item.series_status,
          rating_average: Number(item.rating_average ?? 0),
          view_count: Number(item.view_count ?? 0),
        })) satisfies PublicLibraryItem[];
      }

      return (data ?? [])
        .filter((item: any) => item.series && !item.series.is_hidden)
        .map((item: any) => ({
          library_id: item.id,
          updated_at: item.updated_at,
          reading_status: item.reading_status,
          series_id: item.series.id,
          series_slug: item.series.slug,
          series_title: item.series.title,
          series_cover_url: item.series.cover_url,
          series_type: item.series.type,
          series_status: item.series.status,
          rating_average: Number(item.series.rating_average ?? 0),
          view_count: Number(item.series.view_count ?? 0),
        })) satisfies PublicLibraryItem[];
    },
    enabled: !!profile.data?.user_id && showLibraries,
    staleTime: 5 * 1000,
  });

  // ─── Reading Preferences: genre breakdown from reading history (all-time, paginated) ───
  const readingPreferences = useQuery({
    queryKey: ["public-profile-reading-preferences", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [];

      // 1. Fetch aggregated preferences via server action (bypasses RLS)
      try {
        const serverPrefs = await $getPublicReadingPreferences(profile.data.user_id);
        if (serverPrefs && serverPrefs.length > 0) return serverPrefs;
      } catch (e) {
        console.error("Error in $getPublicReadingPreferences:", e);
      }

      // 2. Client fallback via get_user_reading_history_chapters RPC (which is granted to anon)
      try {
        const { data: chaptersData } = await (supabase as any).rpc("get_user_reading_history_chapters", {
          _user_id: profile.data.user_id,
          _cutoff: null,
          _limit: 2000,
        });

        const seriesChapterMap = new Map<string, number>();
        for (const ch of chaptersData || []) {
          if (ch.series_id) {
            seriesChapterMap.set(ch.series_id, (seriesChapterMap.get(ch.series_id) || 0) + 1);
          }
        }

        const seriesIds = Array.from(seriesChapterMap.keys());
        if (seriesIds.length === 0) return [];

        const allSgData: any[] = [];
        for (let i = 0; i < seriesIds.length; i += 50) {
          const batchIds = seriesIds.slice(i, i + 50);
          const { data: sgData } = await supabase
            .from("series_genres")
            .select("series_id,genre_id")
            .in("series_id", batchIds);
          if (sgData) allSgData.push(...sgData);
        }
        if (allSgData.length === 0) return [];

        const genreIds = Array.from(new Set(allSgData.map((sg: any) => sg.genre_id)));
        if (genreIds.length === 0) return [];
        const { data: genresData } = await supabase
          .from("genres")
          .select("id,name")
          .in("id", genreIds);
        if (!genresData) return [];

        const genreNameMap = new Map(genresData.map((g: any) => [g.id, g.name]));
        const seriesToGenres = new Map<string, string[]>();
        for (const sg of allSgData) {
          const gName = genreNameMap.get(sg.genre_id);
          if (!gName) continue;
          const list = seriesToGenres.get(sg.series_id) || [];
          list.push(gName);
          seriesToGenres.set(sg.series_id, list);
        }

        const genreAgg = new Map<string, { name: string; seriesSet: Set<string>; chapters: number; minutes: number }>();
        for (const [seriesId, chapCount] of seriesChapterMap.entries()) {
          const genres = seriesToGenres.get(seriesId) || [];
          for (const gName of genres) {
            const current = genreAgg.get(gName) || { name: gName, seriesSet: new Set<string>(), chapters: 0, minutes: 0 };
            current.chapters += chapCount;
            current.seriesSet.add(seriesId);
            current.minutes += chapCount * 5;
            genreAgg.set(gName, current);
          }
        }

        return Array.from(genreAgg.values())
          .map((g) => ({
            name: g.name,
            seriesCount: g.seriesSet.size,
            chapterCount: g.chapters,
            minutes: g.minutes,
          }))
          .sort((a, b) => b.chapterCount - a.chapterCount)
          .slice(0, 8);
      } catch (err) {
        console.error("Client fallback error in reading preferences:", err);
        return [];
      }
    },
    enabled: !!profile.data?.user_id && (showStatistics || showLibraries),
    staleTime: 60 * 1000,
  });

  // ─── Uploaded Series: series where user uploaded chapters (fast single-query join) ───
  const targetUsername = profile.data?.username || decodedUsername;
  const uploadedSeries = useQuery({
    queryKey: ["public-profile-uploaded-series", targetUsername],
    queryFn: async () => {
      if (!targetUsername) return [];
      // No hardcoded admin fallback: only match chapters actually uploaded by this
      // user, otherwise every profile would inherit the admin's upload history.
      const matchNames = Array.from(new Set([targetUsername, decodedUsername, username].filter(Boolean)));
      
      const { data, error } = await supabase
        .from("series")
        .select("id, slug, title, cover_url, type, status, rating_average, view_count, chapters!inner(count)")
        .eq("is_hidden", false)
        .in("chapters.uploaded_by", matchNames);

      if (error || !data) {
        console.error("Error fetching uploaded series:", error);
        return [];
      }

      return data.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        cover_url: s.cover_url,
        type: s.type,
        status: s.status,
        rating_average: s.rating_average,
        view_count: s.view_count,
        uploaded_chapter_count: s.chapters?.[0]?.count || 0,
      })).sort((a: any, b: any) => b.uploaded_chapter_count - a.uploaded_chapter_count);
    },
    enabled: !!username && isProfilePublic,
    staleTime: 60 * 1000,
  });

  // Fetch total comments count accurately from DB
  const publicCommentsCount = useQuery({
    queryKey: ["public-profile-comments-count", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return 0;
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.data.user_id)
        .eq("is_hidden", false);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!profile.data?.user_id && isProfilePublic,
    staleTime: 30 * 1000,
  });

  // Fetch user comment history (all comments)
  const commentHistory = useQuery({
    queryKey: ["public-profile-comments", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [];
      const { data, error } = await (supabase.from("comments") as any)
        .select("id,content,created_at,chapter_id,series_id,parent_id,is_spoiler,is_hidden,attachment_type,attachment_url")
        .eq("user_id", profile.data.user_id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching public comment history:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile.data?.user_id && isProfilePublic,
    staleTime: 5 * 1000,
  });

  // Fetch series info for comment history
  const commentSeriesIds = Array.from(new Set((commentHistory.data ?? []).map((c: any) => c.series_id).filter(Boolean))) as string[];
  const commentSeriesInfo = useQuery({
    queryKey: ["public-profile-comment-series", commentSeriesIds.join(",")],
    queryFn: async () => {
      if (commentSeriesIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("series")
        .select("id,title,slug,cover_url")
        .in("id", commentSeriesIds);
      if (error) return new Map();
      return new Map((data ?? []).map((s: any) => [s.id, s]));
    },
    enabled: commentSeriesIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch chapter info for comment history
  const commentChapterIds = Array.from(new Set((commentHistory.data ?? []).map((c: any) => c.chapter_id).filter(Boolean))) as string[];
  const commentChaptersInfo = useQuery({
    queryKey: ["public-profile-comment-chapters", commentChapterIds.join(",")],
    queryFn: async () => {
      if (commentChapterIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("chapters")
        .select("id,chapter_number,title,slug")
        .in("id", commentChapterIds);
      if (error) return new Map();
      return new Map((data ?? []).map((c: any) => [c.id, c]));
    },
    enabled: commentChapterIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch parent comments for comment history
  const parentCommentIds = Array.from(new Set((commentHistory.data ?? []).map((c: any) => c.parent_id).filter(Boolean))) as string[];
  const parentCommentsInfo = useQuery({
    queryKey: ["public-profile-parent-comments", parentCommentIds.join(",")],
    queryFn: async () => {
      if (parentCommentIds.length === 0) return new Map();
      const { data, error } = await (supabase.from("comments") as any)
        .select("id,content,user_id,is_spoiler,is_hidden")
        .in("id", parentCommentIds);
      if (error) {
        console.error("Error fetching parent comments:", error);
        return new Map();
      }

      const parentUserIds = Array.from(new Set((data ?? []).map((c: any) => c.user_id).filter(Boolean))) as string[];
      let profilesMap = new Map();
      if (parentUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id,username")
          .in("user_id", parentUserIds);
        if (!profilesError && profilesData) {
          profilesMap = new Map(profilesData.map((p: any) => [p.user_id, p.username]));
        }
      }

      const resultMap = new Map();
      for (const c of (data ?? [])) {
        resultMap.set(c.id, {
          id: c.id,
          content: c.content,
          is_spoiler: c.is_spoiler,
          is_hidden: c.is_hidden,
          username: profilesMap.get(c.user_id) || "Reader",
        });
      }
      return resultMap;
    },
    enabled: parentCommentIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });


  // Paginated slices (20 items per page) - must be before any conditional returns to obey Rules of Hooks
  const paginatedUploadedSeries = useMemo(() => {
    const list = uploadedSeries.data || [];
    const start = (uploadedPage - 1) * 20;
    return list.slice(start, start + 20);
  }, [uploadedSeries.data, uploadedPage]);

  const paginatedComments = useMemo(() => {
    const list = commentHistory.data || [];
    const start = (commentsPage - 1) * 20;
    return list.slice(start, start + 20);
  }, [commentHistory.data, commentsPage]);

  const paginatedLibrary = useMemo(() => {
    const list = publicLibrary.data || [];
    const start = (libraryPage - 1) * 20;
    return list.slice(start, start + 20);
  }, [publicLibrary.data, libraryPage]);

  // Loading state
  if (!mounted || profile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageKineticLoader text="Loading" />
      </div>
    );
  }

  // Not found
  if (!profile.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <UserX className="h-16 w-16 text-muted-foreground/50 mx-auto" />
          <h1 className="text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground">
            No user with the username "{decodedUsername}" exists.
          </p>
          <Link to="/home">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const accentColor = profile.data.accent_color || "#8B5CF6";
  const bannerUrl = profile.data.banner_url || "";
  const avatarUrl = profile.data.avatar_url || "";
  const xp = profile.data.experience_points || 0;
  const level = profile.data.user_level || 1;
  const xpForNextLevel = Math.pow((level + 1) * 2, 2);
  const xpProgress = ((xp % xpForNextLevel) / xpForNextLevel) * 100;
  const roles = userRoles.data ?? [];
  const profileVisibility = profile.data.profile_visibility ?? "public";

  const socialLinks = {
    social_discord: profile.data.social_discord || "",
    social_instagram: profile.data.social_instagram || "",
    social_twitter: profile.data.social_twitter || "",
    social_mal: profile.data.social_mal || "",
    social_anilist: profile.data.social_anilist || "",
    social_website: profile.data.social_website || "",
  };

  if (profileVisibility !== "public") {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 sm:px-6">
          <Card className="w-full p-8 text-center">
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-full"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">
              {profileVisibility === "friends" ? "Profile Limited" : "Private Profile"}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {profileVisibility === "friends"
                ? "This user only shares their profile with approved connections."
                : "This user has chosen to keep their profile private."}
            </p>
            <Link to="/home" className="mt-6 inline-flex">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {/* ─── Profile Header (No Banner) ─── */}
      <div
        className="relative py-10 border-b border-border/20"
        style={{
          background: `linear-gradient(180deg, ${accentColor}08, transparent)`,
        }}
      >
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Avatar with accent ring / custom frame */}
            <div
              className="relative h-[140px] w-[140px] flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                ...getAvatarFrameStyles(profile.data.avatar_frame || "none", accentColor),
                background: (profile.data.avatar_frame || "none") === "none" ? accentColor : undefined,
                padding: '4px',
              }}
            >
              {/* Smoke wisps orbiting the avatar frame */}
              {(profile.data.avatar_frame || "none") !== "none" && (
                <div className="absolute inset-0 pointer-events-none z-[25]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(profile.data.avatar_frame || "none", accentColor)}50, transparent)`, animation: 'avatarSmokeOrbit 6s linear infinite' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(profile.data.avatar_frame || "none", accentColor)}40, transparent)`, animation: 'avatarSmokeOrbit 8s linear infinite 2s' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: `radial-gradient(circle, ${getFrameSmokeColor(profile.data.avatar_frame || "none", accentColor)}35, transparent)`, animation: 'avatarSmokeOrbit 10s linear infinite 4s' }} />
                </div>
              )}
              {/* Layer 1: Spinners, double-rotators & backgrounds for custom frames */}
              {(profile.data.avatar_frame || "none") === "neon" && (
                <div className="absolute inset-0 rounded-full overflow-hidden animate-[lightningFlicker_6s_ease-in-out_infinite]">
                  {/* Double rotating rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-[rotationCW_4s_linear_infinite]" />
                  <div className="absolute inset-[2px] rounded-full bg-background z-5" />
                  <div className="absolute inset-[2px] rounded-full overflow-hidden z-6">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#EC4899,#06B6D4,#A855F7,#EC4899)] animate-[rotationCCW_3s_linear_infinite]" />
                  </div>
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "gold" && (
                <>
                  {/* Rotating golden light background ring */}
                  <div className="absolute inset-[-2px] rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99] animate-[rotationCW_10s_linear_infinite]" />
                  <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-bl from-[#ffeb99] via-[#ffd700] to-[#aa7c11] animate-[rotationCCW_8s_linear_infinite]" />
                </>
              )}
              {(profile.data.avatar_frame || "none") === "cyber" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-dashed border-cyan-400/40 animate-[rotationCCW_12s_linear_infinite] z-5" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "fire" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {/* Double volcanic swirl */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-[rotationCW_3s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full overflow-hidden z-5">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#7f1d1d,#f97316,#ef4444,#7f1d1d)] animate-[rotationCCW_4s_linear_infinite]" />
                  </div>
                </div>
              )}

              {(profile.data.avatar_frame || "none") === "sakura" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9] animate-[smoothBreath_4s_ease-in-out_infinite]" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-bl from-[#E879F9] via-[#F472B6] to-[#FDA4AF] animate-[rotationCW_8s_linear_infinite]" />
                </>
              )}
              {(profile.data.avatar_frame || "none") === "shadow" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-[rotationCW_5s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full overflow-hidden z-5">
                    <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_180deg,#1e1b4b,#06b6d4,#4f46e5,#1e1b4b)] animate-[rotationCCW_6s_linear_infinite]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[shadowWispMove_4s_ease-in-out_infinite] z-6" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "qi" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-emerald-400/40 bg-emerald-950/20 animate-[runeJadePulse_8s_linear_infinite] z-5" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "asura" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000] animate-[asuraRage_2.5s_ease-in-out_infinite] overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,transparent,#7f1d1d,transparent,#ef4444)] animate-[rotationCW_4s_linear_infinite] opacity-80" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "system" && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-950/20 animate-[asuraRage_4s_ease-in-out_infinite] overflow-hidden">
                  {/* Rotating radar sweep */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,rgba(6,182,212,0.25),transparent_40%,transparent)] animate-[rotationCW_3s_linear_infinite]" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "abyss" && (
                <div className="absolute inset-0 rounded-full bg-slate-950 overflow-hidden animate-[abyssVoidGlow_5s_ease-in-out_infinite]">
                  {/* Swirling void conic gradient */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#D946EF,#4A044E,#3B0764,#D946EF)] animate-[rotationCW_8s_linear_infinite]" />
                  <div className="absolute inset-[3px] rounded-full border border-purple-500/30 bg-purple-950/20 animate-[rotationCCW_10s_linear_infinite] z-5" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "glitch" && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500/40 bg-slate-950/20 overflow-hidden animate-[glitchFlicker_4s_linear_infinite]">
                  {/* Swirling tech rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#ef4444,#06b6d4,#ef4444)] animate-[rotationCW_4s_linear_infinite]" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "divine" && (
                <div className="absolute inset-0 rounded-full bg-amber-50/10 overflow-hidden animate-[divineHalo_4s_ease-in-out_infinite]">
                  {/* Light halo rotating rings */}
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#FCD34D,#FFFFFF,#FFFBEB,#FCD34D)] animate-[rotationCW_6s_linear_infinite]" />
                  <div className="absolute inset-[2.5px] rounded-full bg-gradient-to-bl from-[#FFFBEB] via-[#FCD34D] to-[#FFFFFF] animate-[rotationCCW_5s_linear_infinite]" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "creator" && (
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
              {(profile.data.avatar_frame || "none") !== "none" && (
                <div 
                  className="absolute rounded-full bg-background z-10" 
                  style={{
                    inset: (profile.data.avatar_frame || "none") === "creator" ? '6px' : '4px',
                  }}
                />
              )}

              {/* Layer 3: Avatar image and internal animations (z-10 relative) */}
              <div className="h-full w-full rounded-full overflow-hidden relative z-10 flex items-center justify-center">
                <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold" style={{ color: accentColor }}>
                      {username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Shimmer sweeps inside avatar for gold frame */}
                {(profile.data.avatar_frame || "none") === "gold" && (
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
                {(profile.data.avatar_frame || "none") === "cyber" && (
                  <>
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                      <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-400/75 shadow-[0_0_6px_cyan]" style={{ animation: 'cyberScan 2.5s linear infinite' }} />
                      <div className="absolute left-0 right-0 h-[1px] bg-purple-400/60 shadow-[0_0_4px_purple]" style={{ animation: 'cyberScan 3.5s linear infinite', animationDelay: '1.2s' }} />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,182,212,0.15)_95%)] pointer-events-none z-15 rounded-full" />
                  </>
                )}

                {/* System Scanline overlay + technical grid */}
                {(profile.data.avatar_frame || "none") === "system" && (
                  <>
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                      <div className="absolute left-0 right-0 h-[1px] bg-cyan-300/50 shadow-[0_0_5px_cyan]" style={{ animation: 'cyberScan 4s linear infinite', animationDelay: '0.5s' }} />
                    </div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] pointer-events-none z-15 rounded-full bg-[size:100%_4px,6px_100%]" />
                  </>
                )}
              </div>

              {/* Layer 4: Frame brackets and decorative widgets (z-20) */}
              {(profile.data.avatar_frame || "none") === "gold" && (
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

              {(profile.data.avatar_frame || "none") === "cyber" && (
                <div className="absolute inset-0 pointer-events-none z-20 animate-[cyberGlitch_8s_infinite]">
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm shadow-[0_0_4px_cyan]" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm shadow-[0_0_4px_cyan]" />
                </div>
              )}

              {(profile.data.avatar_frame || "none") === "fire" && (
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

              {(profile.data.avatar_frame || "none") === "sakura" && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                  {/* Falling 3D Blossom Drift */}
                  <span className="absolute text-[9px] select-none" style={{ animation: 'sakuraDrift3D 3.5s linear infinite', left: '16px', top: '4px' }}>🌸</span>
                  <span className="absolute text-[7px] select-none" style={{ animation: 'sakuraDrift3D 4s linear infinite', right: '24px', top: '8px', animationDelay: '1.2s' }}>🌸</span>
                  <span className="absolute text-[8px] select-none" style={{ animation: 'sakuraDrift3D 3.8s linear infinite', left: '40px', top: '0px', animationDelay: '0.6s' }}>🌸</span>
                </div>
              )}

              {(profile.data.avatar_frame || "none") === "shadow" && (
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

              {(profile.data.avatar_frame || "none") === "qi" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <Sparkles className="absolute -top-2 right-2 h-4.5 w-4.5 text-amber-300 animate-[starTwinkle_2s_ease-in-out_infinite]" />
                  <Sparkles className="absolute -bottom-1.5 left-2.5 h-3.5 w-3.5 text-emerald-300 animate-[starTwinkle_2.5s_ease-in-out_infinite]" style={{ animationDelay: '1.2s' }} />
                  <Sparkles className="absolute top-4 left-0 h-3 w-3 text-yellow-200 animate-[starTwinkle_2.2s_ease-in-out_infinite]" style={{ animationDelay: '0.6s' }} />
                </div>
              )}

              {(profile.data.avatar_frame || "none") === "asura" && (
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

              {(profile.data.avatar_frame || "none") === "system" && (
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
              {(profile.data.avatar_frame || "none") === "abyss" && (
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
              {(profile.data.avatar_frame || "none") === "glitch" && (
                <div className="absolute inset-0 pointer-events-none z-20 animate-[cyberGlitch_6s_infinite]">
                  <div className="absolute -top-1.5 left-[15%] h-1.5 w-[70%] border-t-2 border-red-500 shadow-[0_0_5px_red]" />
                  <div className="absolute -bottom-1.5 left-[15%] h-1.5 w-[70%] border-b-2 border-cyan-400 shadow-[0_0_5px_cyan]" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "divine" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 text-yellow-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.7)] animate-[starTwinkle_2s_ease-in-out_infinite] z-25">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  {/* Orbiting divine spark stars */}
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-yellow-100 animate-[starTwinkle_3s_ease-out_infinite]" />
                  <div className="absolute top-4 right-2 w-1 h-1 rounded-full bg-white animate-[starTwinkle_2.5s_ease-out_infinite_1.2s]" />
                </div>
              )}
              {(profile.data.avatar_frame || "none") === "creator" && (
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

              {profile.data.is_vip && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 rounded-full p-1.5 z-30 border border-amber-500/30 bg-zinc-900 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                >
                  <Crown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Name + Meta */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{username}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {roles.includes("admin") && (
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
                  {roles.includes("moderator") && (
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
                  {roles.includes("uploader") && (
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
                  {profile.data.is_vip && (
                    <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                      <Crown className="mr-1 h-3 w-3" /> VIP
                    </Badge>
                  )}
                </div>
              </div>

              {/* Equipped title badge */}
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
                    {/* Animated gradient underline */}
                    <span 
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none"
                      style={{ 
                        backgroundImage: `linear-gradient(90deg, transparent, ${titleColor}50, ${titleColor}, ${titleColor}50, transparent)`,
                        backgroundSize: '200% 100%',
                        animation: 'titleUnderlineSweep 3s linear infinite',
                      }}
                    />
                    
                    {/* Subtle shimmer on hover */}
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
                    <span style={{ color: titleColor }}>
                      {equippedBadge.data.badge?.name}
                    </span>
                    
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

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SocialLinksDisplay values={socialLinks} accentColor={accentColor} />
                <Badge variant="outline" className="text-xs border border-border/50 bg-secondary/20 text-muted-foreground shadow-sm">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" style={{ color: accentColor }} />
                  Joined {formatAppDate(profile.data.created_at)}
                </Badge>
              </div>

              {profile.data.bio && (
                <p 
                  className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground border border-border/30 bg-card/25 backdrop-blur-md rounded-xl p-3.5"
                >
                  {profile.data.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level bar */}
      {showStatistics && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6">
          <div
            className="rounded-xl border border-border/40 p-3 sm:p-4 bg-card/25 backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: accentColor }} />
                {roles.includes("admin") ? (
                  <span className="font-bold text-foreground text-xs sm:text-sm">Maxed Out</span>
                ) : (
                  <span className="font-bold text-xs sm:text-sm">Level {level}</span>
                )}
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              </div>
              {roles.includes("admin") ? (
                <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: accentColor }}>
                  Infinite Qi & Boundless Dao Aura
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                  {xp} / {xpForNextLevel} Qi
                </span>
              )}
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/60">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: roles.includes("admin") ? "100%" : `${xpProgress}%`,
                  background: accentColor,
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {showStatsStrip && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PublicStatCard label="Reading Streak" value={profile.data.reading_streak || 0} suffix=" days" icon={<Flame className="h-6 w-6" />} color="#F97316" />
            <PublicStatCard label="Chapters Read" value={publicStats.data?.chapters_read || 0} icon={<BookOpen className="h-6 w-6" />} color="#3B82F6" />
            <PublicStatCard label="Series Followed" value={publicStats.data?.series_followed || 0} icon={<Star className="h-6 w-6" />} color="#F59E0B" />
          </div>
        </div>
      )}

      {/* ─── Profile Content Tabs (Column Bar) ─── */}
      <div
        className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-8 pb-12"
        style={{ animation: "profileFadeInUp 0.6s ease-out 0.2s both" }}
      >
        <Tabs
          defaultValue={
            (uploadedSeries.data && uploadedSeries.data.length > 0)
              ? "uploaded"
              : showLibraries
              ? "library"
              : "preferences"
          }
          className="w-full"
          suppressHydrationWarning
        >
          {/* Column bar */}
          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <TabsList className="inline-flex sm:flex sm:w-full h-11 items-center justify-start sm:justify-center gap-1.5 p-1 bg-muted/60 rounded-xl min-w-full sm:min-w-0">
              <TabsTrigger value="uploaded" className="h-9 shrink-0 gap-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium">
                <Upload className="h-4 w-4 shrink-0" />
                <span>Uploaded</span>
                {uploadedSeries.data && uploadedSeries.data.length > 0 && (
                  <span
                    className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    {uploadedSeries.data.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="h-9 shrink-0 gap-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="h-9 shrink-0 gap-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>Comments</span>
                {(commentHistory.data?.length ?? publicCommentsCount.data ?? 0) > 0 && (
                  <span
                    className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    {commentHistory.data?.length ?? publicCommentsCount.data ?? 0}
                  </span>
                )}
              </TabsTrigger>
              {showLibraries && (
                <TabsTrigger value="library" className="h-9 shrink-0 gap-1.5 px-3 sm:px-4 text-xs sm:text-sm font-medium">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>Library</span>
                  {(publicLibrary.data?.length ?? publicStats.data?.series_followed ?? 0) > 0 && (
                    <span
                      className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                      style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                    >
                      {publicLibrary.data?.length ?? publicStats.data?.series_followed ?? 0}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ─── Uploaded Series Tab ─── */}
          <TabsContent value="uploaded" className="mt-6">
            <Card className="p-4 sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Upload className="h-5 w-5" style={{ color: accentColor }} />
                    Uploaded Series
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Series contributed and uploaded by {username}.
                  </p>
                </div>
                <Badge
                  className="text-xs font-semibold border"
                  style={{
                    borderColor: `${accentColor}30`,
                    backgroundColor: `${accentColor}12`,
                    color: accentColor,
                  }}
                >
                  {uploadedSeries.data?.length ?? 0} Series Total
                </Badge>
              </div>

              {uploadedSeries.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-border/40 p-3">
                      <div className="h-20 w-14 flex-shrink-0 animate-pulse rounded-md bg-secondary" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : uploadedSeries.data && uploadedSeries.data.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {paginatedUploadedSeries.map((series: any) => (
                      <Link
                        key={series.id}
                        to="/title/$slug"
                        params={{ slug: series.slug }}
                        className="group rounded-xl border border-border/40 bg-card/60 p-3.5 transition-all duration-200 hover:shadow-lg"
                        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.currentTarget.style.borderColor = `${accentColor}50`;
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.currentTarget.style.borderColor = "";
                        }}
                      >
                        <div className="flex gap-3.5">
                          <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm">
                            <OptimizedImage
                              src={series.cover_url}
                              alt={series.title}
                              seriesId={series.id}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <p className="truncate text-base font-semibold group-hover:text-primary transition-colors">
                                {series.title}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                                <Badge
                                  className="text-xs font-semibold border"
                                  style={{
                                    borderColor: `${accentColor}30`,
                                    backgroundColor: `${accentColor}12`,
                                    color: accentColor,
                                  }}
                                >
                                  <Upload className="mr-1 h-3 w-3" />
                                  {series.uploaded_chapter_count} chapters uploaded
                                </Badge>
                                <span className="text-muted-foreground capitalize font-medium">
                                  {series.type}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5 capitalize">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      series.status === "ongoing"
                                        ? "#10B981"
                                        : series.status === "completed"
                                        ? "#3B82F6"
                                        : "#F59E0B",
                                  }}
                                />
                                {series.status}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {Number(series.rating_average || 0).toFixed(1)}
                              </span>
                              <span>{(series.view_count || 0).toLocaleString()} views</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <SectionPagination
                    currentPage={uploadedPage}
                    totalItems={uploadedSeries.data.length}
                    pageSize={20}
                    onPageChange={setUploadedPage}
                    itemLabel="series"
                    accentColor={accentColor}
                  />
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">No series uploaded yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This user hasn't uploaded any chapters yet.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── Reading Preferences Tab ─── */}
          <TabsContent value="preferences" className="mt-6">
            <Card className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" style={{ color: accentColor }} />
                  <h2 className="text-xl font-bold">Reading Preferences</h2>
                </div>
                {readingPreferences.data && readingPreferences.data.length > 0 && (
                  <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                    {readingPreferences.data.length} Top Genres
                  </Badge>
                )}
              </div>

              {!showStatistics ? (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">Reading statistics are private</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This user has chosen to keep their reading statistics private.
                  </p>
                </div>
              ) : readingPreferences.isLoading ? (
                <div className="space-y-4 py-2">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                      <div className="h-2 w-full animate-pulse rounded bg-secondary" />
                    </div>
                  ))}
                </div>
              ) : readingPreferences.data && readingPreferences.data.length > 0 ? (
                <div className="space-y-1">
                  {readingPreferences.data.map((genre, idx) => {
                    const maxChapters = readingPreferences.data![0]?.chapterCount || 1;
                    const barPercent = Math.max(8, (genre.chapterCount / maxChapters) * 100);
                    const timeLabel =
                      genre.minutes >= 60
                        ? `${Math.floor(genre.minutes / 60)}h ${genre.minutes % 60}m`
                        : genre.minutes > 0
                        ? `${genre.minutes}m`
                        : null;
                    return (
                      <div
                        key={genre.name}
                        className="py-2.5"
                        style={{ animation: `profileFadeInUp 0.4s ease-out ${idx * 0.05}s both` }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
                            <Badge
                              className="text-xs font-bold border transition-all duration-200 hover:brightness-110 hover:scale-[1.02] shadow-sm cursor-default"
                              style={{
                                borderColor: `${accentColor}40`,
                                backgroundColor: `${accentColor}18`,
                                color: accentColor,
                              }}
                            >
                              {genre.name}
                            </Badge>
                          </div>
                          {timeLabel && (
                            <span className="text-sm font-bold text-muted-foreground">{timeLabel}</span>
                          )}
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${barPercent}%`,
                              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                              opacity: 1 - idx * 0.06,
                              boxShadow: `0 0 8px ${accentColor}40`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-8">
                          {genre.seriesCount} series, {genre.chapterCount} chapters
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">No reading history recorded yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reading chapters will automatically generate genre preferences here.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── Comments Tab ─── */}
          <TabsContent value="comments" className="mt-6">
            <Card className="p-4 sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <MessageSquare className="h-5 w-5" style={{ color: accentColor }} />
                    Recent Comments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Public comments and discussions by {username}.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                  {commentHistory.data?.length ?? 0} Comments
                </Badge>
              </div>

              {commentHistory.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-card p-4 animate-pulse">
                      <div className="h-4 w-3/4 bg-secondary/60 rounded" />
                      <div className="mt-2 h-3 w-1/2 bg-secondary/40 rounded" />
                    </div>
                  ))}
                </div>
              ) : commentHistory.data && commentHistory.data.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {paginatedComments.map((comment: any) => {
                    const seriesInfo = commentSeriesInfo.data?.get(comment.series_id);
                    const chapterInfo = commentChaptersInfo.data?.get(comment.chapter_id);
                    return (
                      <div
                        key={comment.id}
                        className="group rounded-lg border border-border/40 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-sm cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}03, transparent)`,
                        }}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("a, button, [data-media-action='true']")) return;
                          if (seriesInfo?.slug) {
                            if (chapterInfo?.slug) {
                              navigate({
                                to: "/title/$slug/$chapterSlug",
                                params: { slug: seriesInfo.slug, chapterSlug: getCleanChapterSlug(chapterInfo) },
                                hash: `comment-${comment.id}`,
                              });
                            } else {
                              navigate({
                                to: "/title/$slug",
                                params: { slug: seriesInfo.slug },
                                hash: `comment-${comment.id}`,
                              });
                            }
                          }
                        }}
                      >
                        <div className="flex gap-4 items-start">
                          {seriesInfo?.cover_url && (
                            <div className="relative h-16 w-11 overflow-hidden rounded border border-border/30 bg-secondary shrink-0 shadow-sm">
                              <OptimizedImage
                                src={seriesInfo.cover_url}
                                alt={seriesInfo.title}
                                seriesId={seriesInfo.id}
                                className="h-full w-full object-cover animate-[profileFadeInUp_0.3s_ease-out]"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {/* Reply Context */}
                            {comment.parent_id && (() => {
                              const parentComment = parentCommentsInfo.data?.get(comment.parent_id);
                              return (
                                <div 
                                  className="mb-2 border-l-2 pl-3 py-1 bg-muted/40 rounded-r text-xs text-muted-foreground transition-all duration-200 hover:bg-muted/60"
                                  style={{ borderLeftColor: accentColor }}
                                >
                                  <span className="font-semibold text-foreground/80">
                                    Replying to @{parentComment?.username || "Reader"}:
                                  </span>{" "}
                                  <span className="italic line-clamp-1 text-left">
                                    {parentComment?.is_spoiler ? (
                                      "⚠️ Spoiler comment"
                                    ) : parentComment?.is_hidden ? (
                                      "🚫 Hidden by moderator"
                                    ) : (
                                      stripBbCode(parentComment?.content || "")
                                    )}
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Comment content */}
                            {(() => {
                              if (comment.is_spoiler) {
                                return <p className="text-sm leading-relaxed italic text-muted-foreground text-left">⚠️ Spoiler comment</p>;
                              }
                              if (comment.is_hidden) {
                                return <p className="text-sm leading-relaxed italic text-muted-foreground text-left">🚫 Hidden by moderator</p>;
                              }
                              const clean = stripBbCode(comment.content || "").trim();
                              const isPlaceholderGifText = (clean.toLowerCase() === "[gif]" || clean.toLowerCase() === "[image]") && !!comment.attachment_url;
                              
                              return !isPlaceholderGifText && clean.length > 0 ? (
                                <p className="text-sm leading-relaxed text-foreground text-left">
                                  {clean.length > 200 ? clean.slice(0, 200) + "..." : clean}
                                </p>
                              ) : null;
                            })()}

                            {/* Visible GIF / Image Attachment */}
                            {comment.attachment_url && !comment.is_spoiler && !comment.is_hidden && (
                              <div
                                className="mt-2.5"
                                data-media-action="true"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <CommentAttachmentGrid
                                  urls={comment.attachment_url}
                                  type={comment.attachment_type}
                                  alt={comment.attachment_alt}
                                />
                              </div>
                            )}

                            {/* Meta row */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 text-left">
                                <Calendar className="h-3 w-3" />
                                {formatAppDate(comment.created_at)}
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
                              {chapterInfo && (
                                <>
                                  <span className="text-border">•</span>
                                  <Link
                                    to="/title/$slug/$chapterSlug"
                                    params={{ slug: seriesInfo?.slug || "", chapterSlug: getCleanChapterSlug(chapterInfo) }}
                                    className="font-medium transition-colors hover:underline"
                                    style={{ color: accentColor }}
                                  >
                                    Ch. {chapterInfo.chapter_number}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status badges */}
                          {comment.is_spoiler && (
                            <div className="shrink-0">
                              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/10">
                                Spoiler
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  <SectionPagination
                    currentPage={commentsPage}
                    totalItems={commentHistory.data.length}
                    pageSize={20}
                    onPageChange={setCommentsPage}
                    itemLabel="comments"
                    accentColor={accentColor}
                  />
                </>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No recent comments posted.
                  </p>
                </Card>
              )}
            </Card>
          </TabsContent>

          {/* ─── Library Tab ─── */}
          {showLibraries && (
            <TabsContent value="library" className="mt-6">
              <Card className="p-4 sm:p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold">
                      <BookOpen className="h-5 w-5" style={{ color: accentColor }} />
                      Library
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Public bookmarks and reading list of {username}.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                    {publicLibrary.data?.length ?? 0} Titles
                  </Badge>
                </div>

                {publicLibrary.isLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="flex gap-3 rounded-lg border border-border/40 p-3">
                        <div className="h-20 w-14 flex-shrink-0 animate-pulse rounded-md bg-secondary" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : publicLibrary.data && publicLibrary.data.length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {paginatedLibrary.map((item: PublicLibraryItem) => (
                      <Link
                        key={item.library_id}
                        to="/title/$slug"
                        params={{ slug: item.series_slug }}
                        className="group rounded-xl border border-border/40 bg-card/60 p-3.5 transition-all duration-200 hover:shadow-lg"
                        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.currentTarget.style.borderColor = `${accentColor}50`;
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.currentTarget.style.borderColor = "";
                        }}
                      >
                        <div className="flex gap-3.5">
                          <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm">
                            <OptimizedImage
                              src={item.series_cover_url}
                              alt={item.series_title}
                              seriesId={item.series_id}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <p className="truncate text-base font-semibold group-hover:text-primary transition-colors">
                                {item.series_title}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {formatLibraryStatus(item.reading_status)}
                                </Badge>
                                <span className="text-muted-foreground capitalize font-medium">
                                  {item.series_type}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Updated {formatAppDate(item.updated_at)}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                {item.rating_average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <SectionPagination
                    currentPage={libraryPage}
                    totalItems={publicLibrary.data.length}
                    pageSize={20}
                    onPageChange={setLibraryPage}
                    itemLabel="titles"
                    accentColor={accentColor}
                  />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">No public library activity yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Followed titles added to library will appear here.</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <div className="h-12" />
    </div>
  );
}

function formatLibraryStatus(status: string) {
  return status.replace(/_/g, " ");
}

function PublicStatCard({
  label,
  value,
  suffix = "",
  icon,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-2.5 sm:p-4" style={{ borderColor: `${color}20` }}>
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 sm:h-20 sm:w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      {/* Mobile view (< sm) */}
      <div className="relative flex flex-col items-center text-center sm:hidden">
        <div
          className="grid h-7 w-7 place-items-center rounded-lg mb-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <p className="text-base font-bold tracking-tight leading-none">
          {value}
          {suffix && <span className="text-[11px] font-normal text-muted-foreground ml-0.5">{suffix}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-tight">{label}</p>
      </div>

      {/* Desktop view (>= sm) */}
      <div className="relative hidden sm:flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight truncate">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </p>
        </div>
        <div
          className="grid h-12 w-12 place-items-center rounded-xl shrink-0 [&>svg]:h-6 [&>svg]:w-6"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
