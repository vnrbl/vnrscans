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
  Camera,
  Code,
  Palette,
  Link2,
  Sparkles,
} from "lucide-react";
import { ReadingGoals } from "@/components/profile/ReadingGoals";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { BadgeIcon, enhanceBadge, type ProfileBadgeRow } from "@/lib/profileBadges";
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { ReadingHeatmap } from "@/components/profile/ReadingHeatmap";
import { ProfileWidgets } from "@/components/profile/ProfileWidgets";
import { BannerUpload } from "@/components/profile/BannerUpload";
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
  0% { transform: translate(-100%, -100%) rotate(45deg); }
  35%, 100% { transform: translate(100%, 100%) rotate(45deg); }
}
@keyframes cyberScan {
  0% { top: 0%; opacity: 0; }
  10%, 90% { opacity: 0.8; }
  100% { top: 100%; opacity: 0; }
}
@keyframes fireEmbers {
  0% { transform: translateY(10px) scale(0.6); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-30px) scale(0.3); opacity: 0; }
}
@keyframes sakuraDrift {
  0% { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
  50% { opacity: 0.9; }
  100% { transform: translate(-15px, 40px) rotate(180deg); opacity: 0; }
}
@keyframes smoothBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
`;

const getAvatarFrameStyles = (frame: string, accent: string) => {
  switch (frame) {
    case "neon":
      return { boxShadow: "0 0 15px oklch(0.68 0.22 305 / 0.3)" };
    case "gold":
      return { boxShadow: "0 0 15px rgba(212, 175, 55, 0.4)" };
    case "cyber":
      return { boxShadow: "0 0 15px rgba(6, 182, 212, 0.3)" };
    case "fire":
      return { boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)" };
    case "sakura":
      return { boxShadow: "0 0 15px rgba(244, 114, 182, 0.4)" };
    case "shadow":
      return { boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)" };
    case "qi":
      return { boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)" };
    case "asura":
      return { boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)" };
    case "system":
      return { boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)" };
    case "none":
    default:
      return {
        boxShadow: `0 0 15px ${accent}25`,
      };
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
          });
      }
    }
  }, [profile.data, streaks.current, historyQuery.data, qc]);

  // Editable state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
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
      setBannerUrl(profile.data.banner_url ?? "");
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
          banner_url: bannerUrl || null,
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
              {/* Layer 1: Spinners & backgrounds for custom frames */}
              {avatarFrame === "neon" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              )}
              {avatarFrame === "gold" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99]" />
              )}
              {avatarFrame === "cyber" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              )}
              {avatarFrame === "fire" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-spin" style={{ animationDuration: '5s' }} />
                </div>
              )}
              {avatarFrame === "sakura" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9]" style={{ animation: 'smoothBreath 5s ease-in-out infinite' }} />
              )}
              {avatarFrame === "shadow" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}
              {avatarFrame === "qi" && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-spin" style={{ animationDuration: '7s' }} />
                </div>
              )}
              {avatarFrame === "asura" && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000]" style={{ animation: 'smoothBreath 3s ease-in-out infinite' }} />
              )}
              {avatarFrame === "system" && (
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-950/20" />
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

                {/* Shimmer sweep inside avatar for gold frame */}
                {avatarFrame === "gold" && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full z-20 pointer-events-none"
                    style={{ 
                      animation: 'sweepShine 4s ease-in-out infinite',
                      animationDelay: '1s'
                    }} 
                  />
                )}

                {/* Cyber grid scan overlay */}
                {avatarFrame === "cyber" && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                    <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-400/60 shadow-[0_0_6px_cyan]" style={{ animation: 'cyberScan 3s linear infinite' }} />
                  </div>
                )}

                {/* System Scanline overlay */}
                {avatarFrame === "system" && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                    <div className="absolute left-0 right-0 h-[1px] bg-cyan-300/40 shadow-[0_0_4px_cyan]" style={{ animation: 'cyberScan 4s linear infinite', animationDelay: '0.5s' }} />
                  </div>
                )}
              </div>

              {/* Layer 4: Frame brackets and decorative widgets (z-20) */}
              {avatarFrame === "gold" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-bounce" style={{ animationDuration: '4s' }}>
                    <Crown className="h-6 w-6" />
                  </div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-amber-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                    <Trophy className="h-4.5 w-4.5" />
                  </div>
                </div>
              )}

              {avatarFrame === "cyber" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm" />
                </div>
              )}

              {avatarFrame === "fire" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-orange-500 drop-shadow-[0_0_6px_#ef4444] animate-pulse">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-2 left-4 h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_4px_#ef4444]" style={{ animation: 'fireEmbers 2s ease-out infinite' }} />
                  <div className="absolute bottom-1 right-6 h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_3px_#f97316]" style={{ animation: 'fireEmbers 2.5s ease-out infinite', animationDelay: '0.8s' }} />
                </div>
              )}

              {avatarFrame === "sakura" && (
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full">
                  <span className="absolute top-1 left-4 text-[9px] select-none" style={{ animation: 'sakuraDrift 4s linear infinite' }}>🌸</span>
                  <span className="absolute top-2 right-6 text-[7px] select-none" style={{ animation: 'sakuraDrift 3.5s linear infinite', animationDelay: '1.2s' }}>🌸</span>
                </div>
              )}

              {avatarFrame === "shadow" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_5px_#6366F1]" style={{ animation: 'fireEmbers 3s ease-out infinite' }} />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#06b6d4]" style={{ animation: 'fireEmbers 2.5s ease-out infinite', animationDelay: '1s' }} />
                </div>
              )}

              {avatarFrame === "qi" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <Sparkles className="absolute -top-2 right-3 h-4.5 w-4.5 text-amber-300 animate-pulse" />
                  <Sparkles className="absolute -bottom-1 left-3 h-3.5 w-3.5 text-emerald-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
                </div>
              )}

              {avatarFrame === "asura" && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3.5 w-1.5 bg-red-600 rounded-b-md shadow-[0_0_6px_red]" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3.5 w-1.5 bg-red-600 rounded-t-md shadow-[0_0_6px_red]" />
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-3.5 bg-red-600 rounded-r-md shadow-[0_0_6px_red]" />
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-3.5 bg-red-600 rounded-l-md shadow-[0_0_6px_red]" />
                </div>
              )}

              {avatarFrame === "system" && (
                <>
                  <div className="absolute -top-2.5 -right-2.5 z-30 bg-slate-900 border border-cyan-400 text-cyan-400 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                    S-RANK
                  </div>
                  <div className="absolute -bottom-2 -left-2 z-30 bg-slate-900 border border-yellow-400 text-yellow-400 text-[7px] font-bold px-1 py-0.5 rounded">
                    LV.MAX
                  </div>
                </>
              )}

              {profile.data?.is_vip && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 rounded-full p-1.5 z-30 border border-amber-500/30 bg-zinc-900 text-amber-400"
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
                      className="border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                  {userRoles.data?.includes("moderator") && (
                    <Badge
                      className="border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Mod
                    </Badge>
                  )}
                  {userRoles.data?.includes("uploader") && (
                    <Badge
                      className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
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

              {/* Title badge */}
              {equippedBadge.data && (
                <div 
                  className="flex items-center gap-1.5 mt-2 text-xs font-semibold w-fit border rounded-full px-3 py-1 bg-secondary/10"
                  style={{ borderColor: `${equippedBadge.data.badge?.badge_color || accentColor}30` }}
                >
                  <span className="text-muted-foreground">Title:</span>
                  <span style={{ color: equippedBadge.data.badge?.badge_color || accentColor }}>
                    <BadgeIcon icon={equippedBadge.data.badge?.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-foreground">{equippedBadge.data.badge?.name}</span>
                </div>
              )}

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
                        { id: "none", name: "None", description: "Default accent ring", color: accentColor },
                        { id: "neon", name: "Neon Phoenix", description: "Rotating neon aura", color: "#EC4899" },
                        { id: "gold", name: "Golden Royal", description: "Shimmering gold border & stars", color: "#F59E0B" },
                        { id: "cyber", name: "Cyber Nexus", description: "Futuristic targeting reticle", color: "#06B6D4" },
                        { id: "fire", name: "Fiery Aura", description: "Pulsing flame glow", color: "#EF4444" },
                        { id: "sakura", name: "Sakura Dream", description: "Soft rose petals & hover lift", color: "#F472B6" },
                        { id: "shadow", name: "Shadow Monarch", description: "Dark energy shadow flames", color: "#6366F1" },
                        { id: "qi", name: "Heavenly Qi", description: "Celestial jade aura & sparkles", color: "#10B981" },
                        { id: "asura", name: "Murim Asura", description: "Deep crimson mist & rage", color: "#EF4444" },
                        { id: "system", name: "System Hunter", description: "Cosmic status window S-Rank", color: "#06B6D4" },
                      ].map((frame) => {
                        const isSelected = avatarFrame === frame.id;
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => setAvatarFrame(frame.id)}
                            className="flex items-center gap-4 rounded-xl border p-3 text-left transition-all hover:scale-[1.01] hover:bg-muted/40 focus:outline-none"
                            style={{
                              borderColor: isSelected ? accentColor : "oklch(var(--border) / 0.4)",
                              backgroundColor: isSelected ? `${accentColor}0d` : "transparent",
                            }}
                          >
                            {/* Frame Mini Preview */}
                            <div
                              className="relative h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center"
                              style={{
                                ...getAvatarFrameStyles(frame.id, accentColor),
                                background: frame.id === "none" ? accentColor : undefined,
                                padding: '2px',
                              }}
                            >
                              {/* Spinners */}
                              {frame.id === "neon" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#A855F7,#06B6D4,#EC4899,#A855F7)] animate-spin" style={{ animationDuration: '4s' }} />
                                </div>
                              )}
                              {frame.id === "gold" && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#a67c00] via-[#ffd700] to-[#ffeb99]" />
                              )}
                              {frame.id === "cyber" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#0ea5e9,transparent,#c084fc,transparent,#0ea5e9)] animate-spin" style={{ animationDuration: '8s' }} />
                                </div>
                              )}
                              {frame.id === "fire" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#b91c1c,#f97316,#ef4444,#b91c1c)] animate-spin" style={{ animationDuration: '5s' }} />
                                </div>
                              )}
                              {frame.id === "sakura" && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FDA4AF] via-[#F472B6] to-[#E879F9]" />
                              )}
                              {frame.id === "shadow" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#06b6d4,#1e1b4b,#4f46e5)] animate-spin" style={{ animationDuration: '6s' }} />
                                </div>
                              )}
                              {frame.id === "qi" && (
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                  <div className="absolute inset-[-50%] rounded-full bg-[conic-gradient(from_0deg,#059669,#10B981,#FBBF24,#059669)] animate-spin" style={{ animationDuration: '7s' }} />
                                </div>
                              )}
                              {frame.id === "asura" && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7f1d1d] via-[#b91c1c] to-[#000000]" />
                              )}
                              {frame.id === "system" && (
                                <div className="absolute inset-0 rounded-full border border-cyan-400 bg-cyan-950/20" />
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
                                <div className="absolute inset-0 pointer-events-none z-20">
                                  <div className="absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-cyan-400 rounded-tl-sm" />
                                  <div className="absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-cyan-400 rounded-tr-sm" />
                                  <div className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-cyan-400 rounded-bl-sm" />
                                  <div className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-cyan-400 rounded-br-sm" />
                                </div>
                              )}
                              {frame.id === "system" && (
                                <div className="absolute -top-1 -right-1 z-30 bg-slate-900 text-cyan-400 text-[4px] font-bold px-0.5 rounded border border-cyan-500/50 scale-75 origin-top-right">
                                  S
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm flex items-center gap-1.5">
                                {frame.name}
                                {isSelected && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-bold" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                                    Equipped
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{frame.description}</p>
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
                      <StatRow icon={<Trophy className="h-4 w-4" style={{ color: accentColor }} />} label="Current Level" value={`Level ${level}`} />
                      <StatRow icon={<TrendingUp className="h-4 w-4 text-blue-500" />} label="Total XP" value={xp} />
                      <StatRow icon={<Target className="h-4 w-4 text-green-500" />} label="Next Level" value={`${xpForNextLevel - xp} XP needed`} />
                      <div className="mt-2">
                        <Progress value={xpProgress} className="h-2" />
                        <p className="mt-1 text-center text-xs text-muted-foreground">
                          {xpProgress.toFixed(1)}% to Level {level + 1}
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
