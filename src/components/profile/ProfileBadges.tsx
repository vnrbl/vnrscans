import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Lock, Check, Star, Sparkles } from "lucide-react";
import { useState } from "react";

type ProfileBadge = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  badge_color: string;
  requirement_type: string;
  requirement_value: number | null;
};

type UserBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  is_equipped: boolean;
  badge: ProfileBadge;
};

const rarityColors: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#10B981",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#F59E0B",
};

export function ProfileBadges() {
  const qc = useQueryClient();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  // Fetch available badges
  const availableBadges = useQuery({
    queryKey: ["profile-badges", "available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_badges")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return (data || []) as ProfileBadge[];
    },
  });

  // Fetch user's earned badges
  const userBadges = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];

      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badge_id(*)
        `)
        .eq("user_id", u.user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserBadge[];
    },
  });

  // Equip/unequip badge
  const toggleEquipBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const userBadge = userBadges.data?.find((b) => b.badge_id === badgeId);
      if (!userBadge) throw new Error("Badge not found");

      // If equipping, unequip all others first
      if (!userBadge.is_equipped) {
        await supabase
          .from("user_badges")
          .update({ is_equipped: false })
          .eq("user_id", u.user.id);
      }

      // Toggle this badge
      const { error } = await supabase
        .from("user_badges")
        .update({ is_equipped: !userBadge.is_equipped })
        .eq("id", userBadge.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-badges"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Badge updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const earnedBadgeIds = new Set(userBadges.data?.map((b) => b.badge_id) || []);
  const equippedBadge = userBadges.data?.find((b) => b.is_equipped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Profile Badges</h2>
        <p className="text-sm text-muted-foreground">
          Earn badges by completing achievements and milestones
        </p>
      </div>

      {/* Equipped Badge */}
      {equippedBadge && (
        <Card className="p-4 border-2 border-violet-500/50 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl"
              style={{ backgroundColor: `${equippedBadge.badge.badge_color}20` }}
            >
              {equippedBadge.badge.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{equippedBadge.badge.name}</h3>
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" />
                  Equipped
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {equippedBadge.badge.description}
              </p>
              <p className="text-xs text-violet-500 mt-2">
                This badge appears next to your username
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleEquipBadge.mutate(equippedBadge.badge_id)}
            >
              Unequip
            </Button>
          </div>
        </Card>
      )}

      {/* Earned Badges */}
      {userBadges.data && userBadges.data.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Earned Badges ({userBadges.data.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userBadges.data.map((userBadge) => (
              <Card
                key={userBadge.id}
                className="p-4 cursor-pointer transition-all hover:border-violet-500/50 hover:shadow-lg"
                onClick={() => setSelectedBadge(userBadge)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                    style={{ backgroundColor: `${userBadge.badge.badge_color}20` }}
                  >
                    {userBadge.badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {userBadge.badge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                  {userBadge.is_equipped && (
                    <Check className="h-4 w-4 text-violet-500" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {availableBadges.data && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Locked Badges ({availableBadges.data.length - earnedBadgeIds.size})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {availableBadges.data
              .filter((badge) => !earnedBadgeIds.has(badge.id))
              .slice(0, 8)
              .map((badge) => (
                <Card key={badge.id} className="p-3 opacity-60">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500/10">
                      <Lock className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">???</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badge.requirement_type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!userBadges.data || userBadges.data.length === 0) && (
        <Card className="p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Badges Earned Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep reading and engaging to earn badges!
          </p>
        </Card>
      )}

      {/* Badge Detail Dialog */}
      {selectedBadge && (
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Badge Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Badge Display */}
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-lg text-5xl"
                  style={{
                    backgroundColor: `${selectedBadge.badge.badge_color}20`,
                  }}
                >
                  {selectedBadge.badge.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedBadge.badge.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBadge.badge.description}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Earned</span>
                  <span className="font-medium">
                    {new Date(selectedBadge.earned_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">
                    {selectedBadge.badge.requirement_type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <Button
                className="w-full"
                onClick={() => {
                  toggleEquipBadge.mutate(selectedBadge.badge_id);
                  setSelectedBadge(null);
                }}
              >
                {selectedBadge.is_equipped ? (
                  <>Unequip Badge</>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Equip Badge
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
