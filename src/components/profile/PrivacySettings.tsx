import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Eye, EyeOff, Lock, Globe, Users } from "lucide-react";

export function PrivacySettings() {
  const qc = useQueryClient();
  
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [showReadingHistory, setShowReadingHistory] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);

  // Fetch privacy settings
  const privacySettings = useQuery({
    queryKey: ["privacy-settings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("profile_visibility, show_reading_history, show_achievements, show_statistics")
        .eq("user_id", u.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (privacySettings.data) {
      setProfileVisibility(privacySettings.data.profile_visibility || "public");
      setShowReadingHistory(privacySettings.data.show_reading_history !== false);
      setShowAchievements(privacySettings.data.show_achievements !== false);
      setShowStatistics(privacySettings.data.show_statistics !== false);
    }
  }, [privacySettings.data]);

  // Save settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          profile_visibility: profileVisibility,
          show_reading_history: showReadingHistory,
          show_achievements: showAchievements,
          show_statistics: showStatistics,
        })
        .eq("user_id", u.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["privacy-settings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Privacy settings updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const visibilityOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can view your profile",
      icon: Globe,
    },
    {
      value: "friends",
      label: "Friends Only",
      description: "Only your friends can view your profile",
      icon: Users,
    },
    {
      value: "private",
      label: "Private",
      description: "Only you can view your profile",
      icon: Lock,
    },
  ];

  const selectedOption = visibilityOptions.find(
    (opt) => opt.value === profileVisibility
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">Privacy Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control who can see your profile information
        </p>
      </div>

      {/* Profile Visibility */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-500" />
            <h3 className="font-semibold">Profile Visibility</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose who can see your profile and activity
          </p>

          <Select value={profileVisibility} onValueChange={setProfileVisibility}>
            <SelectTrigger className="h-auto min-h-12 px-3 py-2 text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex min-w-0 items-center gap-2">
                    <option.icon className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{option.label}</p>
                      <p className="whitespace-normal text-xs leading-snug text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedOption && (
            <div className="rounded-lg border border-border/40 bg-muted/50 p-3">
              <div className="flex min-w-0 items-start gap-2 text-sm">
                <selectedOption.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                <span className="min-w-0 text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedOption.label}:</span>{" "}
                  {selectedOption.description}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Content Visibility */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-violet-500" />
            <h3 className="font-semibold">Content Visibility</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose what information others can see on your profile
          </p>

          {/* Reading History */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <Label htmlFor="reading-history" className="cursor-pointer">
                Reading History
              </Label>
              <p className="text-xs text-muted-foreground">
                Show chapters you've read and series you're following
              </p>
            </div>
            <Switch
              id="reading-history"
              checked={showReadingHistory}
              onCheckedChange={setShowReadingHistory}
            />
          </div>

          <div className="border-t border-border/40" />

          {/* Achievements */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <Label htmlFor="achievements" className="cursor-pointer">
                Achievements & Badges
              </Label>
              <p className="text-xs text-muted-foreground">
                Display your earned achievements and equipped badges
              </p>
            </div>
            <Switch
              id="achievements"
              checked={showAchievements}
              onCheckedChange={setShowAchievements}
            />
          </div>

          <div className="border-t border-border/40" />

          {/* Statistics */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <Label htmlFor="statistics" className="cursor-pointer">
                Statistics & Analytics
              </Label>
              <p className="text-xs text-muted-foreground">
                Show your reading stats, level, and progress
              </p>
            </div>
            <Switch
              id="statistics"
              checked={showStatistics}
              onCheckedChange={setShowStatistics}
            />
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 border-violet-500/20 bg-violet-500/5">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Privacy Note</p>
            <p className="text-muted-foreground">
              Your email address is always private. These settings only control what
              appears on your public profile page.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={() => saveSettings.mutate()}
        disabled={saveSettings.isPending}
        className="w-full"
      >
        {saveSettings.isPending ? "Saving..." : "Save Privacy Settings"}
      </Button>
    </div>
  );
}
