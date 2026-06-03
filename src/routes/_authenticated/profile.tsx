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
  Eye,
  Camera,
  Code
} from "lucide-react";
import { ReadingGoals } from "@/components/profile/ReadingGoals";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { ReadingHeatmap } from "@/components/profile/ReadingHeatmap";
import { ProfileWidgets } from "@/components/profile/ProfileWidgets";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — VNRScans" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  
  // Fetch profile with all stats
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
      return { ...data, email: u.user.email };
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

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile.data) {
      setUsername(profile.data.username ?? "");
      setBio(profile.data.bio ?? "");
      setAvatarUrl(profile.data.avatar_url ?? "");
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
        })
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
    <div className="container mx-auto max-w-5xl px-8 md:px-12 lg:px-16 py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              username={username}
              onAvatarUpdated={(url) => setAvatarUrl(url)}
            />
            {profile.data?.is_vip && (
              <div className="absolute -bottom-2 -right-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 p-2">
                <Crown className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{username || "Loading..."}</h1>
                <p className="text-sm text-muted-foreground">{profile.data?.email}</p>
                
                {/* Roles & Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {userRoles.data?.includes("admin") && (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  {userRoles.data?.includes("moderator") && (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                      <Shield className="mr-1 h-3 w-3" />
                      Moderator
                    </Badge>
                  )}
                  {profile.data?.is_vip && (
                    <Badge className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-600 hover:from-yellow-500/20 hover:to-yellow-600/20">
                      <Crown className="mr-1 h-3 w-3" />
                      VIP
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    Joined {new Date(profile.data?.created_at || "").toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Level & XP */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-violet-500" />
                  <span className="font-semibold">Level {level}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {xp} / {xpForNextLevel} XP
                </span>
              </div>
              <Progress value={xpProgress} className="mt-2 h-2" />
            </div>

            {/* Bio */}
            {bio && (
              <p className="mt-4 text-sm text-muted-foreground">{bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reading Streak</p>
              <p className="text-2xl font-bold">{profile.data?.reading_streak || 0}</p>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chapters Read</p>
              <p className="text-2xl font-bold">{readingStats.data?.chapters || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Series Followed</p>
              <p className="text-2xl font-bold">{readingStats.data?.series || 0}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Achievements</p>
              <p className="text-2xl font-bold">{achievements.data?.length || 0}</p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
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

        {/* Edit Profile Tab */}
        <TabsContent value="edit">
          <Card className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={profile.data?.email ?? ""} 
                    disabled 
                    className="pl-10"
                  />
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
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="relative mt-1">
                  <Camera className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="avatar"
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)} 
                    className="pl-10"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Enter a URL to your profile picture</p>
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

              <Button type="submit" disabled={save.isPending} className="w-full">
                {save.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Reading Goals Tab */}
        <TabsContent value="goals">
          <Card className="p-6">
            <ReadingGoals />
          </Card>
        </TabsContent>

        {/* Profile Badges Tab */}
        <TabsContent value="badges">
          <Card className="p-6">
            <ProfileBadges />
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
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
                    className="flex gap-3 rounded-lg border border-border/40 bg-card p-4"
                  >
                    <div className="flex-shrink-0">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                        style={{ backgroundColor: item.achievement?.badge_color ? `${item.achievement.badge_color}20` : '#8B5CF620' }}
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
                      <p className="mt-2 text-xs text-violet-500">
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

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <div className="space-y-6">
            {/* Reading Heatmap */}
            <ReadingHeatmap />

            {/* Original Stats */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold">Your Statistics</h2>
              <div className="space-y-6">
              {/* Reading Activity */}
              <div>
                <h3 className="mb-3 font-semibold">Reading Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Chapters Read</span>
                    </div>
                    <span className="font-semibold">{readingStats.data?.chapters || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Series Followed</span>
                    </div>
                    <span className="font-semibold">{readingStats.data?.series || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <span className="font-semibold">{profile.data?.reading_streak || 0} days</span>
                  </div>
                </div>
              </div>

              {/* Community Engagement */}
              <div>
                <h3 className="mb-3 font-semibold">Community Engagement</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Comments Posted</span>
                    </div>
                    <span className="font-semibold">{readingStats.data?.comments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Ratings Given</span>
                    </div>
                    <span className="font-semibold">{readingStats.data?.ratings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-violet-500" />
                      <span className="text-sm">Achievements Unlocked</span>
                    </div>
                    <span className="font-semibold">{achievements.data?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div>
                <h3 className="mb-3 font-semibold">Level Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-violet-500" />
                      <span className="text-sm">Current Level</span>
                    </div>
                    <span className="font-semibold">Level {level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Total XP</span>
                    </div>
                    <span className="font-semibold">{xp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Next Level</span>
                    </div>
                    <span className="font-semibold">{xpForNextLevel - xp} XP needed</span>
                  </div>
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

        {/* Privacy Settings Tab */}
        <TabsContent value="privacy">
          <Card className="p-6">
            <PrivacySettings />
          </Card>
        </TabsContent>

        {/* Profile Widgets Tab - Hidden by default, can be accessed via direct link */}
        <TabsContent value="widgets">
          <Card className="p-6">
            <ProfileWidgets />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Widget Link (below tabs) */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            const tabsElement = document.querySelector('[role="tablist"]');
            const widgetButton = document.querySelector('[value="widgets"]') as HTMLElement;
            if (widgetButton) {
              widgetButton.click();
              tabsElement?.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <Code className="h-4 w-4" />
          Generate Profile Widget
        </Button>
      </div>
    </div>
  );
}