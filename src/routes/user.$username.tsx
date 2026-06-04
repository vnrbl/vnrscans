import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pageTitle } from "@/lib/brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLinksDisplay } from "@/components/profile/SocialLinks";

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

export const Route = createFileRoute("/user/$username")({
  head: ({ params }) => ({
    meta: [{ title: pageTitle(params.username) }],
  }),
  component: PublicProfilePage,
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
    case "none":
    default:
      return {
        boxShadow: `0 0 15px ${accent}25`,
      };
  }
};

function PublicProfilePage() {
  const { username } = Route.useParams();
  const qc = useQueryClient();

  // Fetch public profile by username
  const profile = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user roles
  const userRoles = useQuery({
    queryKey: ["public-profile-roles", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.data.user_id);
      if (error) return [];
      return (data || []).map((r) => r.role);
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

  const isProfilePublic = (profile.data?.profile_visibility ?? "public") === "public";
  const showLibraries = publicStats.data?.show_reading_history === true;
  const showAchievements = publicStats.data?.show_achievements === true;
  const showStatistics = publicStats.data?.show_statistics === true;
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
      qc.invalidateQueries({ queryKey: ["public-profile", username] });
      qc.invalidateQueries({ queryKey: ["public-profile-stats", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-library", userId] });
      qc.invalidateQueries({ queryKey: ["public-profile-achievements", userId] });
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
        { event: "*", schema: "public", table: "user_achievements", filter: `user_id=eq.${userId}` },
        refreshPublicProfile
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

      const { data, error } = await (supabase as any)
        .rpc("get_public_library_items", {
          _profile_user_id: profile.data.user_id,
          _limit: 12,
        });

      if (error) throw error;
      return (data ?? []).map((item: any) => ({
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
    },
    enabled: !!profile.data?.user_id && showLibraries,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch achievements
  const achievements = useQuery({
    queryKey: ["public-profile-achievements", profile.data?.user_id],
    queryFn: async () => {
      if (!profile.data?.user_id) return [];
      const { data, error } = await supabase
        .from("user_achievements" as any)
        .select("*, achievement:achievement_id(name, description, icon, rarity, xp_reward)")
        .eq("user_id", profile.data.user_id)
        .order("unlocked_at", { ascending: false })
        .limit(8);
      if (error) return [];
      return data || [];
    },
    enabled: !!profile.data?.user_id && showAchievements,
    staleTime: 5 * 60 * 1000,
  });

  // Loading state
  if (profile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
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
            No user with the username "{username}" exists.
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
    <div className="min-h-screen">
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

              {/* Layer 2: Inner mask background to shape the 4px border */}
              {(profile.data.avatar_frame || "none") !== "none" && (
                <div className="absolute inset-[4px] rounded-full bg-background z-10" />
              )}

              {/* Layer 3: Avatar image and internal animations (z-10 relative) */}
              <div className="h-full w-full rounded-full overflow-hidden relative z-10 flex items-center justify-center">
                <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
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
                  {/* Void Sparks */}
                  <div className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_6px_#6366F1]" style={{ animation: 'fireEmbersWavy 3s ease-out infinite' }} />
                  <div className="absolute bottom-4 right-6 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]" style={{ animation: 'fireEmbersWavy 2.5s ease-out infinite', animationDelay: '1s' }} />
                  <div className="absolute bottom-1 left-10 h-1.2 w-1.2 rounded-full bg-indigo-500 shadow-[0_0_4px_#4f46e5]" style={{ animation: 'fireEmbersWavy 3.5s ease-out infinite', animationDelay: '0.5s' }} />
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
                    <Badge className="border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                  {roles.includes("moderator") && (
                    <Badge className="border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                      <Shield className="mr-1 h-3 w-3" /> Mod
                    </Badge>
                  )}
                  {roles.includes("uploader") && (
                    <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
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

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SocialLinksDisplay values={socialLinks} accentColor={accentColor} />
                <Badge variant="outline" className="text-xs border border-border/50 bg-secondary/20 text-muted-foreground shadow-sm">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" style={{ color: accentColor }} />
                  Joined {new Date(profile.data.created_at || "").toLocaleDateString()}
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
            className="rounded-xl border border-border/40 p-4 bg-card/25 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                {roles.includes("admin") ? (
                  <span className="font-bold text-foreground">Maxed Out</span>
                ) : (
                  <span className="font-bold">Level {level}</span>
                )}
                <Sparkles className="h-4 w-4 text-muted-foreground/60" />
              </div>
              {roles.includes("admin") ? (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PublicStatCard label="Reading Streak" value={profile.data.reading_streak || 0} suffix=" days" icon={<Flame className="h-6 w-6" />} color="#F97316" />
            <PublicStatCard label="Chapters Read" value={publicStats.data?.chapters_read || 0} icon={<BookOpen className="h-6 w-6" />} color="#3B82F6" />
            <PublicStatCard label="Series Followed" value={publicStats.data?.series_followed || 0} icon={<Star className="h-6 w-6" />} color="#F59E0B" />
            <PublicStatCard label="Achievements" value={publicStats.data?.achievements_unlocked || 0} icon={<Award className="h-6 w-6" />} color={accentColor} />
          </div>
        </div>
      )}

      {/* Library */}
      {showLibraries && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-8">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" style={{ color: accentColor }} />
            <h2 className="text-xl font-bold">Library</h2>
          </div>

          {publicLibrary.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="p-3">
                  <div className="flex gap-3">
                    <div className="h-20 w-14 flex-shrink-0 animate-pulse rounded-md bg-secondary" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : publicLibrary.data && publicLibrary.data.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {publicLibrary.data.map((item: PublicLibraryItem) => (
                <Link
                  key={item.library_id}
                  to="/title/$slug"
                  params={{ slug: item.series_slug }}
                  className="group rounded-lg border border-border/40 bg-card p-3 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                      {item.series_cover_url ? (
                        <img
                          src={item.series_cover_url}
                          alt={item.series_title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold group-hover:text-primary">
                        {item.series_title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs capitalize">
                          {formatLibraryStatus(item.reading_status)}
                        </Badge>
                        <span className="text-muted-foreground capitalize">
                          {item.series_type}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {item.rating_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No public library activity yet.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Achievements */}
      {showAchievements && achievements.data && achievements.data.length > 0 && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-8 pb-12">
          <h2 className="mb-4 text-xl font-bold">Recent Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.data.map((item: any) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-border/40 bg-card p-4"
                style={{ background: `linear-gradient(135deg, ${accentColor}05, transparent)` }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                    style={{ backgroundColor: `${accentColor}20` }}
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
                    Unlocked {new Date(item.unlocked_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding if no achievements */}
      {(!achievements.data || achievements.data.length === 0) && <div className="h-12" />}
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
    <Card className="group relative overflow-hidden p-4" style={{ borderColor: `${color}20` }}>
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
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
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
