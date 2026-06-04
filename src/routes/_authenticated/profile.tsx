import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { ReadingHeatmap } from "@/components/profile/ReadingHeatmap";
import { ProfileWidgets } from "@/components/profile/ProfileWidgets";
import { BannerUpload } from "@/components/profile/BannerUpload";

import { SocialLinksEditor, SocialLinksDisplay, type SocialLinksData } from "@/components/profile/SocialLinks";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — vnrscans" }] }),
  component: ProfilePage,
});

/* ─── Keyframes (injected once) ─── */
const keyframeStyles = `
@keyframes profileFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes profileStatPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes profileXpGlow {
  0%, 100% { box-shadow: 0 0 8px var(--xp-color, #8B5CF6); }
  50% { box-shadow: 0 0 20px var(--xp-color, #8B5CF6); }
}
`;

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

  // Editable state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#8B5CF6");
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

  return (
    <div className="min-h-screen">
      {/* ─── Banner + Avatar Header ─── */}
      <div
        className="relative"
        style={{ animation: "profileFadeInUp 0.5s ease-out both" }}
      >
        <BannerUpload
          currentBannerUrl={bannerUrl}
          accentColor={accentColor}
          onBannerUpdated={setBannerUrl}
        />

        {/* Avatar floating over banner */}
        <div className="container mx-auto max-w-5xl px-8 md:px-12 lg:px-16">
          <div className="relative -mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar with accent ring */}
            <div
              className="relative h-[140px] w-[140px] flex-shrink-0 rounded-full p-1"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                boxShadow: `0 0 30px ${accentColor}40`,
              }}
            >
              <div className="h-full w-full rounded-full bg-background p-0.5">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  username={username}
                  onAvatarUpdated={(url) => setAvatarUrl(url)}
                />
              </div>
              {profile.data?.is_vip && (
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

            {/* Name + meta */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{username || "Loading..."}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {userRoles.data?.includes("admin") && (
                    <Badge
                      className="border-0 text-white"
                      style={{ background: `linear-gradient(135deg, #EF4444, #DC2626)` }}
                    >
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                  {userRoles.data?.includes("moderator") && (
                    <Badge
                      className="border-0 text-white"
                      style={{ background: `linear-gradient(135deg, #3B82F6, #2563EB)` }}
                    >
                      <Shield className="mr-1 h-3 w-3" /> Mod
                    </Badge>
                  )}
                  {profile.data?.is_vip && (
                    <Badge
                      className="border-0 text-white"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                    >
                      <Crown className="mr-1 h-3 w-3" /> VIP
                    </Badge>
                  )}
                </div>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">{profile.data?.email}</p>

              {/* Social links + join date row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SocialLinksDisplay values={socialLinks} accentColor={accentColor} />
                <Badge variant="outline" className="text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  Joined {new Date(profile.data?.created_at || "").toLocaleDateString()}
                </Badge>
              </div>

              {bio && (
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">{bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Level bar ─── */}
      <div className="container mx-auto max-w-5xl px-8 md:px-12 lg:px-16 mt-6">
        <div
          className="rounded-xl border border-border/40 p-4"
          style={{
            background: `linear-gradient(135deg, ${accentColor}08, transparent)`,
          }}
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

      {/* ─── Stats Cards ─── */}
      <div
        className="container mx-auto max-w-5xl px-8 md:px-12 lg:px-16 mt-6"
        style={{ animation: "profileFadeInUp 0.6s ease-out 0.1s both" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Reading Streak"
            value={profile.data?.reading_streak || 0}
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
        className="container mx-auto max-w-5xl px-8 md:px-12 lg:px-16 mt-8 pb-12"
        style={{ animation: "profileFadeInUp 0.6s ease-out 0.2s both" }}
      >
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="edit" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Edit Profile Tab ─── */}
          <TabsContent value="edit">
            <Card className="p-6">
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
                  className="w-full h-12 text-sm font-bold rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                    color: "white",
                    boxShadow: `0 4px 20px ${accentColor}35`,
                  }}
                >
                  {save.isPending ? "Saving..." : "Save All Changes"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* ─── Reading Goals Tab ─── */}
          <TabsContent value="goals">
            <Card className="p-6">
              <ReadingGoals />
            </Card>
          </TabsContent>

          {/* ─── Profile Badges Tab ─── */}
          <TabsContent value="badges">
            <Card className="p-6">
              <ProfileBadges />
            </Card>
          </TabsContent>

          {/* ─── Achievements Tab ─── */}
          <TabsContent value="achievements">
            <Card className="p-6">
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

              <Card className="p-6">
                <h2 className="mb-4 text-xl font-bold">Your Statistics</h2>
                <div className="space-y-6">
                  {/* Reading Activity */}
                  <div>
                    <h3 className="mb-3 font-semibold">Reading Activity</h3>
                    <div className="space-y-3">
                      <StatRow icon={<BookOpen className="h-4 w-4 text-blue-500" />} label="Chapters Read" value={readingStats.data?.chapters || 0} />
                      <StatRow icon={<Star className="h-4 w-4 text-yellow-500" />} label="Series Followed" value={readingStats.data?.series || 0} />
                      <StatRow icon={<Flame className="h-4 w-4 text-orange-500" />} label="Current Streak" value={`${profile.data?.reading_streak || 0} days`} />
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
            <Card className="p-6">
              <PrivacySettings />
            </Card>
          </TabsContent>

          {/* ─── Profile Widgets Tab (hidden, accessed via button) ─── */}
          <TabsContent value="widgets">
            <Card className="p-6">
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