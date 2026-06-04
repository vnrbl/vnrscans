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
        .from("user_achievements")
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
      {/* Banner */}
      <div className="group relative h-48 w-full overflow-hidden rounded-2xl sm:h-56 md:h-64">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${username}'s banner`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10, transparent)`,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, oklch(0.21 0.006 286 / 0.8), transparent 60%)",
          }}
        />
      </div>

      {/* Avatar + Info */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="relative -mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <div
            className="relative h-[140px] w-[140px] flex-shrink-0 rounded-full p-1"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
              boxShadow: `0 0 30px ${accentColor}40`,
            }}
          >
            <div className="h-full w-full rounded-full bg-background p-0.5">
              <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold" style={{ color: accentColor }}>
                    {username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
            </div>
            {profile.data.is_vip && (
              <div
                className="absolute -bottom-1 -right-1 rounded-full p-2"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  boxShadow: "0 0 15px #F59E0B50",
                }}
              >
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Name + Meta */}
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">{username}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {roles.includes("admin") && (
                  <Badge className="border-0 text-white" style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                    <Shield className="mr-1 h-3 w-3" /> Admin
                  </Badge>
                )}
                {roles.includes("moderator") && (
                  <Badge className="border-0 text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}>
                    <Shield className="mr-1 h-3 w-3" /> Mod
                  </Badge>
                )}
                {roles.includes("uploader") && (
                  <Badge className="border-0 text-white" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    <Shield className="mr-1 h-3 w-3" /> Uploader
                  </Badge>
                )}
                {profile.data.is_vip && (
                  <Badge className="border-0 text-white" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                    <Crown className="mr-1 h-3 w-3" /> VIP
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SocialLinksDisplay values={socialLinks} accentColor={accentColor} />
              <Badge variant="outline" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Joined {new Date(profile.data.created_at || "").toLocaleDateString()}
              </Badge>
            </div>

            {profile.data.bio && (
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">{profile.data.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Level bar */}
      {showStatistics && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12 lg:px-16 mt-6">
          <div
            className="rounded-xl border border-border/40 p-4"
            style={{ background: `linear-gradient(135deg, ${accentColor}08, transparent)` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                <span className="font-bold">Level {level}</span>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                {xp} / {xpForNextLevel} XP
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${xpProgress}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}CC)`,
                  boxShadow: `0 0 12px ${accentColor}60`,
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
              {publicLibrary.data.map((item) => (
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
