import { createFileRoute } from "@tanstack/react-router";
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
  BookOpen, 
  Star, 
  Calendar,
  Settings,
  Shield,
  Crown,
  Target,
  TrendingUp,
  Award,
  Code,
  Palette,
  Link2,
  Sparkles,
  Orbit,
} from "lucide-react";
import { ReadingGoals } from "@/components/profile/ReadingGoals";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { BadgeIcon, enhanceBadge, type ProfileBadgeRow } from "@/lib/profileBadges";
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { ReadingHeatmap } from "@/components/profile/ReadingHeatmap";
import { ProfileWidgets } from "@/components/profile/ProfileWidgets";
import { AccentColorPicker } from "@/components/profile/AccentColorPicker";

import { SocialLinksEditor, SocialLinksDisplay, type SocialLinksData } from "@/components/profile/SocialLinks";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — vnrscans" }] }),
  component: ProfilePage,
});

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
    default: return accent;
  }
};

function ProfilePage() {
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
    staleTime: 2 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user achievements
  const achievements = useQuery({
    queryKey: ["profile", "achievements"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievement_id(name, description, icon, rarity, xp_reward)")
        .eq("user_id", u.user.id)
        .order("unlocked_at", { ascending: false });
      if (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
      return data || [];
    },
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000,
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

  const streaks = useMemo(() => {
    if (!historyQuery.data) return { current: 0, longest: 0 };
    
    // Extract unique dates of activity
    const dates = Array.from(new Set(
      historyQuery.data.map(item => new Date(item.updated_at).toISOString().split("T")[0])
    )).sort();

    if (dates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

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
    let hasActivityTodayOrYesterday = dates.includes(todayStr) || dates.includes(yesterdayStr);
    if (hasActivityTodayOrYesterday) {
      let searchDate = dates.includes(todayStr) ? new Date() : yesterday;
      let searchStr = searchDate.toISOString().split("T")[0];
      
      while (dates.includes(searchStr)) {
        current++;
        searchDate.setDate(searchDate.getDate() - 1);
        searchStr = searchDate.toISOString().split("T")[0];
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

  const save = useMutation({
    mutationFn: async () => {
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

  const xp = profile.data?.experience_points || 0;
  const level = profile.data?.user_level || 1;
  const xpForNextLevel = Math.pow((level + 1) * 2, 2);
  const xpProgress = ((xp % xpForNextLevel) / xpForNextLevel) * 100;
  const isAdmin = userRoles.data?.includes("admin");

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

              {/* Layer 2: Inner mask background to shape the 4px border */}
              {avatarFrame !== "none" && (
                <div className="absolute inset-[4px] rounded-full bg-background z-10" />
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
                  {/* Void Sparks */}
                  <div className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_6px_#6366F1]" style={{ animation: 'fireEmbersWavy 3s ease-out infinite' }} />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]" style={{ animation: 'fireEmbersWavy 2.5s ease-out infinite', animationDelay: '1s' }} />
                  <div className="absolute bottom-1 left-10 h-1.2 w-1.2 rounded-full bg-indigo-500 shadow-[0_0_4px_#4f46e5]" style={{ animation: 'fireEmbersWavy 3.5s ease-out infinite', animationDelay: '0.5s' }} />
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
                const titleColor = equippedBadge.data.badge?.badge_color || accentColor;
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
                        background: `linear-gradient(90deg, transparent, ${titleColor}50, ${titleColor}, ${titleColor}50, transparent)`,
                        backgroundSize: '200% 100%',
                        animation: 'titleUnderlineSweep 3s linear infinite',
                      }}
                    />
                    
                    {/* Subtle shimmer sweep across the badge */}
                    <span 
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover/title:opacity-100 transition-opacity"
                      style={{ 
                        background: `linear-gradient(105deg, transparent 40%, ${titleColor}12 50%, transparent 60%)`,
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
            label="Achievements"
            value={achievements.data?.length || 0}
            icon={<Award className="h-6 w-6" />}
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
            <TabsTrigger value="goals" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="h-9 min-w-0 gap-2 px-0 sm:px-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
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
                        { id: "neon", name: "Neon Phoenix", description: "Rotating neon aura with lightning", color: "#EC4899", gradient: 'linear-gradient(135deg, #A855F720, #EC489920, #06B6D420)' },
                        { id: "gold", name: "Golden Royal", description: "Shimmering gold border & crown", color: "#F59E0B", gradient: 'linear-gradient(135deg, #ffd70015, #F59E0B15, #ffeb9915)' },
                        { id: "cyber", name: "Cyber Nexus", description: "Futuristic holographic targeting reticle", color: "#06B6D4", gradient: 'linear-gradient(135deg, #06B6D418, #0ea5e910, #c084fc12)' },
                        { id: "fire", name: "Fiery Aura", description: "Volcanic flame ring with embers", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444418, #f9731615, #b91c1c10)' },
                        { id: "sakura", name: "Sakura Dream", description: "Enchanted blossom drift & glow", color: "#F472B6", gradient: 'linear-gradient(135deg, #F472B618, #FDA4AF15, #E879F910)' },
                        { id: "shadow", name: "Shadow Monarch", description: "Void energy tendrils & dark wisps", color: "#6366F1", gradient: 'linear-gradient(135deg, #6366F118, #4f46e515, #1e1b4b12)' },
                        { id: "qi", name: "Heavenly Qi", description: "Celestial jade runes & sparkles", color: "#10B981", gradient: 'linear-gradient(135deg, #10B98118, #05966915, #FBBF2410)' },
                        { id: "asura", name: "Murim Asura", description: "Demonic crimson mist & rage aura", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444420, #7f1d1d18, #00000015)' },
                        { id: "system", name: "System Hunter", description: "S-Rank cosmic status interface", color: "#06B6D4", gradient: 'linear-gradient(135deg, #06B6D418, #0ea5e912, #eab30810)' },
                        { id: "abyss", name: "Abyssal Void", description: "Swirling dimensional rift of pure void energy", color: "#D946EF", gradient: 'linear-gradient(135deg, #D946EF20, #4A044E18, #3B076415)' },
                        { id: "glitch", name: "Chronos Distortion", description: "Flickering temporal aberration with chromatic splits", color: "#EF4444", gradient: 'linear-gradient(135deg, #EF444415, #06B6D415, #00000020)' },
                        { id: "divine", name: "Seraphic Light", description: "Angelic golden halos & glowing divine feathers", color: "#FCD34D", gradient: 'linear-gradient(135deg, #FCD34D15, #FFFFFF12, #FFFBEB10)' },
                      ].map((frame) => {
                        const isSelected = avatarFrame === frame.id;
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => setAvatarFrame(frame.id)}
                            className="group/card relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none overflow-hidden"
                            style={{
                              borderColor: isSelected ? `${frame.color}80` : `${frame.color}20`,
                              background: isSelected ? frame.gradient : `${frame.color}06`,
                              boxShadow: isSelected 
                                ? `0 0 20px ${frame.color}15, inset 0 0 15px ${frame.color}08` 
                                : 'none',
                            }}
                          >
                            {/* Hover shimmer overlay */}
                            <div 
                              className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                              style={{ 
                                background: `linear-gradient(90deg, transparent, ${frame.color}08, transparent)`,
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
                            {/* Frame Mini Preview */}
                            <div
                              className="relative h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-110"
                              style={{
                                ...getAvatarFrameStyles(frame.id, accentColor),
                                background: frame.id === "none" ? accentColor : undefined,
                                padding: '2px',
                              }}
                            >
                              {/* Spinners scaled down */}
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
                            </div>

                            <div className="min-w-0 flex-1 relative">
                              <div className="font-semibold text-sm flex items-center gap-1.5">
                                <span style={{ color: isSelected ? frame.color : undefined, textShadow: isSelected ? `0 0 8px ${frame.color}40` : 'none' }}>
                                  {frame.name}
                                </span>
                                {isSelected && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-bold border" style={{ backgroundColor: `${frame.color}15`, color: frame.color, borderColor: `${frame.color}30`, boxShadow: `0 0 8px ${frame.color}20` }}>
                                    ✦ Equipped
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{frame.description}</p>
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
                  onChange={(key, value) =>
                    setSocialLinks((prev) => ({ ...prev, [key]: value }))
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

          {/* ─── Reading Goals Tab ─── */}
          <TabsContent value="goals">
            <Card className="p-4 sm:p-6">
              <ReadingGoals />
            </Card>
          </TabsContent>

          {/* ─── Profile Badges Tab ─── */}
          <TabsContent value="badges">
            <Card className="p-4 sm:p-6">
              <ProfileBadges />
            </Card>
          </TabsContent>

          {/* ─── Achievements Tab ─── */}
          <TabsContent value="achievements">
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-xl font-bold">Unlocked Achievements</h2>
              {achievements.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading achievements...</p>
              ) : achievements.data && achievements.data.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {achievements.data.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-lg border border-border/40 bg-card p-4 transition-all hover:border-border"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}05, transparent)`,
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div 
                          className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                          style={{ backgroundColor: item.achievement?.badge_color ? `${item.achievement.badge_color}20` : `${accentColor}20` }}
                        >
                          {item.achievement?.icon || "🏆"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.achievement?.name || "Achievement"}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.achievement?.rarity || "common"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.achievement?.description || "No description"}
                        </p>
                        <p className="mt-2 text-xs" style={{ color: accentColor }}>
                          +{item.achievement?.xp_reward || 0} XP • Unlocked {new Date(item.unlocked_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 p-8 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No achievements unlocked yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start reading to earn achievements!</p>
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
                      <StatRow icon={<Target className="h-4 w-4 text-green-500" />} label="Comments Posted" value={readingStats.data?.comments || 0} />
                      <StatRow icon={<Star className="h-4 w-4 text-purple-500" />} label="Ratings Given" value={readingStats.data?.ratings || 0} />
                      <StatRow icon={<Award className="h-4 w-4" style={{ color: accentColor }} />} label="Achievements Unlocked" value={achievements.data?.length || 0} />
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div>
                    <h3 className="mb-3 font-semibold">Level Progress</h3>
                    <div className="space-y-3">
                      <StatRow icon={<Trophy className="h-4 w-4" style={{ color: accentColor }} />} label="Current Level" value={isAdmin ? "Maxed Out" : `Level ${level}`} />
                      <StatRow icon={<TrendingUp className="h-4 w-4 text-blue-500" />} label="Total XP" value={isAdmin ? "Infinite Aura and XP" : xp} />
                      <StatRow icon={<Target className="h-4 w-4 text-green-500" />} label="Next Level" value={isAdmin ? "∞" : `${xpForNextLevel - xp} XP needed`} />
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
