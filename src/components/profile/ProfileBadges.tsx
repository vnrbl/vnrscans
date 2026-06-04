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
import * as Icons from "lucide-react";
import { Check, Lock, Trophy, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export const emojiToIconName: Record<string, string> = {
  '🧘‍♂️': 'Flame',
  '⚡': 'Zap',
  '💀': 'Skull',
  '⚔️': 'Swords',
  '👹': 'Flame',
  '🌅': 'Sun',
  '🌙': 'Moon',
  '🦁': 'PawPrint',
  '📜': 'Scroll',
  '⚖️': 'Scale',
  '🧪': 'FlaskConical',
  '🌌': 'Orbit',
  '👑': 'Crown',
  '🗡️': 'Sword',
  '🪶': 'Feather',
  '☯️': 'Compass',
  '🐘': 'ShieldAlert',
  '🐢': 'Shield',
  '🍶': 'FlaskConical',
  '🧙‍♂️': 'User',
  '🧑‍🦳': 'User',
  '👻': 'Ghost',
  '🩸': 'Droplet',
  '🐾': 'PawPrint',
  '😈': 'Flame',
  '🌸': 'Flower',
  '🏔️': 'Mountain',
  '🌑': 'Moon',
  '💊': 'Pills',
  '📿': 'Gem',
  '🐉': 'Sparkles',
  '🔥': 'Flame',
  '🌱': 'Sprout',
  '🧱': 'Layers',
  '🟡': 'Circle',
  '👶': 'Baby',
  '🌿': 'Leaf',
  '🔏': 'PenTool',
  '💠': 'Grid',
  '⛈️': 'CloudLightning',
  '☁️': 'Cloud',
  '🛡️': 'Shield',
  '⛺': 'Tent',
  '🏅': 'Award',
};

export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const iconName = emojiToIconName[icon] || 'Award';
  const IconComponent = (Icons as any)[iconName] || Icons.Award;
  return <IconComponent className={className} />;
}

export const difficultyWeights = {
  Easy: 1,
  Moderate: 2,
  Hard: 3,
  Godly: 4,
};

export type EnhancedBadge = ProfileBadge & {
  category: 'Badge' | 'Title';
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Godly';
};

const badgeMetadataMap: Record<string, {
  name: string;
  category: 'Badge' | 'Title';
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Godly';
  color: string;
  icon: string;
}> = {
  'Top Reader': {
    name: 'Supreme Dao Ancestor',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '🧘‍♂️',
  },
  'Speedrunner': {
    name: 'Qi Condensation Speedrunner',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#3B82F6',
    icon: '⚡',
  },
  'Completionist': {
    name: 'Grandmaster of Demonic Cultivation',
    category: 'Title',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '💀',
  },
  'Loyal Fan': {
    name: 'Sword Sect Disciple',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '⚔️',
  },
  'Streak Master': {
    name: 'Asura Demon Emperor',
    category: 'Title',
    difficulty: 'Godly',
    color: '#F59E0B',
    icon: '👹',
  },
  'Early Bird': {
    name: 'Rising Sun Qi Gatherer',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#FBBF24',
    icon: '🌅',
  },
  'Night Owl': {
    name: 'Shadow Realm Wanderer',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#6366F1',
    icon: '🌙',
  },
  'Genre Explorer': {
    name: 'Myriad Beast Emperor',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#14B8A6',
    icon: '🦁',
  },
  'Commentator': {
    name: 'Heavenly Dao Gossip Scholar',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#06B6D4',
    icon: '📜',
  },
  'Critic': {
    name: 'Supreme Immortal Judge',
    category: 'Title',
    difficulty: 'Hard',
    color: '#EC4899',
    icon: '⚖️',
  },
  'Divine Alchemist': {
    name: 'Divine Alchemist',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#10B981',
    icon: '🧪',
  },
  'Void Stepper': {
    name: 'Void Stepper',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '🌌',
  },
  'Demonic Sovereign': {
    name: 'Demonic Sovereign',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '👑',
  },
  'Sword God': {
    name: 'Sword God',
    category: 'Title',
    difficulty: 'Godly',
    color: '#3B82F6',
    icon: '🗡️',
  },
  'Nine Heavens Immortal': {
    name: 'Nine Heavens Immortal',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '🪶',
  },
  'Primordial Chaos Sage': {
    name: 'Primordial Chaos Sage',
    category: 'Title',
    difficulty: 'Godly',
    color: '#F59E0B',
    icon: '☯️',
  },
  'Dragon-Elephant Warrior': {
    name: 'Dragon-Elephant Warrior',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#F97316',
    icon: '🐘',
  },
  'Undying Hermit': {
    name: 'Undying Hermit',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#9CA3AF',
    icon: '🐢',
  },
  'Elixir Master': {
    name: 'Elixir Master',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#10B981',
    icon: '🍶',
  },
  'Heavenly Emperor': {
    name: 'Heavenly Emperor',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '👑',
  },
  'Reincarnated Elder': {
    name: 'Reincarnated Elder',
    category: 'Title',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '🧙‍♂️',
  },
  'Sect Elder': {
    name: 'Sect Elder',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#3B82F6',
    icon: '🧑‍🦳',
  },
  'Ghost Doctor': {
    name: 'Ghost Doctor',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '👻',
  },
  'Blood Shadow Assassin': {
    name: 'Blood Shadow Assassin',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#EF4444',
    icon: '🩸',
  },
  'Beast Tamer': {
    name: 'Beast Tamer',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#14B8A6',
    icon: '🐾',
  },
  'Heavenly Demon': {
    name: 'Heavenly Demon',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '😈',
  },
  'Plum Blossom Swordmaster': {
    name: 'Plum Blossom Swordmaster',
    category: 'Title',
    difficulty: 'Hard',
    color: '#EC4899',
    icon: '🌸',
  },
  'Poison Phoenix': {
    name: 'Poison Phoenix',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#10B981',
    icon: '🧪',
  },
  'Mount Hua Disciple': {
    name: 'Mount Hua Disciple',
    category: 'Title',
    difficulty: 'Easy',
    color: '#3B82F6',
    icon: '🏔️',
  },
  'Wudang Daoist': {
    name: 'Wudang Daoist',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#6366F1',
    icon: '☯️',
  },
  'Dark Heaven Assassin': {
    name: 'Dark Heaven Assassin',
    category: 'Title',
    difficulty: 'Hard',
    color: '#1F2937',
    icon: '🌑',
  },
  'Nine Nether Sovereign': {
    name: 'Nine Nether Sovereign',
    category: 'Title',
    difficulty: 'Godly',
    color: '#8B5CF6',
    icon: '💀',
  },
  'Golden Elchemist': {
    name: 'Golden Elchemist',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#F59E0B',
    icon: '💊',
  },
  'Daoist Sage': {
    name: 'Daoist Sage',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#FBBF24',
    icon: '📿',
  },
  'Spirit Beast Summoner': {
    name: 'Spirit Beast Summoner',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#14B8A6',
    icon: '🐉',
  },
  'Grandmaster of the Flame Sect': {
    name: 'Grandmaster of the Flame Sect',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#F97316',
    icon: '🔥',
  },
  'Soul Devouring Demon': {
    name: 'Soul Devouring Demon',
    category: 'Title',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '🌌',
  },
  'Immortal Venerable': {
    name: 'Immortal Venerable',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '📿',
  },
  'Qi Gathering Beginner': {
    name: 'Qi Gathering Beginner',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '🌱',
  },
  'Foundation Establishment Expert': {
    name: 'Foundation Establishment Expert',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#3B82F6',
    icon: '🧱',
  },
  'Golden Core Sage': {
    name: 'Golden Core Sage',
    category: 'Title',
    difficulty: 'Hard',
    color: '#FBBF24',
    icon: '🟡',
  },
  'Nascent Soul Monarch': {
    name: 'Nascent Soul Monarch',
    category: 'Title',
    difficulty: 'Godly',
    color: '#F59E0B',
    icon: '👶',
  },
  'Sword Initiate': {
    name: 'Sword Initiate',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#9CA3AF',
    icon: '⚔️',
  },
  'Spirit Herb Gatherer': {
    name: 'Spirit Herb Gatherer',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '🌿',
  },
  'Talisman Apprentice': {
    name: 'Talisman Apprentice',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#06B6D4',
    icon: '🔏',
  },
  'Array Formation Specialist': {
    name: 'Array Formation Specialist',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#6366F1',
    icon: '💠',
  },
  'Heavenly Tribulation Survivor': {
    name: 'Heavenly Tribulation Survivor',
    category: 'Badge',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '⛈️',
  },
  'Demonic Beast Slayer': {
    name: 'Demonic Beast Slayer',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#F97316',
    icon: '🐾',
  },
  'Divine Beast Tamer': {
    name: 'Divine Beast Tamer',
    category: 'Title',
    difficulty: 'Hard',
    color: '#14B8A6',
    icon: '🐉',
  },
  'Pill King': {
    name: 'Pill King',
    category: 'Title',
    difficulty: 'Hard',
    color: '#FBBF24',
    icon: '💊',
  },
  'Celestial Wanderer': {
    name: 'Celestial Wanderer',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#3B82F6',
    icon: '☁️',
  },
  'Nine Nether Ghost King': {
    name: 'Nine Nether Ghost King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#1F2937',
    icon: '👻',
  },
  'Mount Hua Sword Saint': {
    name: 'Mount Hua Sword Saint',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EC4899',
    icon: '🏔️',
  },
  'Dharma Protector': {
    name: 'Dharma Protector',
    category: 'Title',
    difficulty: 'Moderate',
    color: '#6366F1',
    icon: '🛡️',
  },
  'Rogue Cultivator': {
    name: 'Rogue Cultivator',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#9CA3AF',
    icon: '⛺',
  },
};

export const enhanceBadge = (badge: ProfileBadge): EnhancedBadge => {
  const key = Object.keys(badgeMetadataMap).find(
    (k) => k === badge.name || badgeMetadataMap[k].name === badge.name
  );
  const meta = key ? badgeMetadataMap[key] : null;

  let category = meta?.category || 'Badge';
  let difficulty = meta?.difficulty || 'Easy';
  let description = badge.description;

  if (badge.description && badge.description.startsWith('{')) {
    try {
      const parsed = JSON.parse(badge.description);
      category = parsed.category || category;
      difficulty = parsed.difficulty || difficulty;
      description = parsed.description || description;
    } catch (e) {
      console.error("Error parsing description JSON:", e);
    }
  }

  return {
    ...badge,
    name: meta?.name || badge.name,
    icon: meta?.icon || badge.icon || '🏅',
    badge_color: meta?.color || badge.badge_color,
    category: category as any,
    difficulty: difficulty as any,
    description: description,
  };
};

export function ProfileBadges() {
  const qc = useQueryClient();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  // Fetch user roles
  const userRoles = useQuery({
    queryKey: ["profile-roles-badges"],
    queryFn: async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return [];
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user.id);
        if (error) return [];
        return (data || []).map((r) => r.role);
      } catch (e) {
        console.error("Error fetching user roles:", e);
        return [];
      }
    },
  });
  const isAdmin = userRoles.data?.includes("admin");

  // Fetch available badges
  const availableBadges = useQuery({
    queryKey: ["profile-badges", "available"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profile_badges")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error || !data || data.length === 0) {
          // Fallback: If DB query fails or has no records, generate list from badgeMetadataMap
          return Object.keys(badgeMetadataMap).map((key, index) => ({
            id: `fallback-${index}-${key.replace(/\s+/g, '-')}`,
            name: badgeMetadataMap[key].name,
            description: `Unlock by achieving ${key} realm milestone.`,
            icon: badgeMetadataMap[key].icon,
            badge_color: badgeMetadataMap[key].color,
            requirement_type: key.toLowerCase().replace(/ /g, "_"),
            requirement_value: 100,
          })) as ProfileBadge[];
        }
        return data as ProfileBadge[];
      } catch (e) {
        console.error("Error fetching available badges:", e);
        return Object.keys(badgeMetadataMap).map((key, index) => ({
          id: `fallback-${index}-${key.replace(/\s+/g, '-')}`,
          name: badgeMetadataMap[key].name,
          description: `Unlock by achieving ${key} realm milestone.`,
          icon: badgeMetadataMap[key].icon,
          badge_color: badgeMetadataMap[key].color,
          requirement_type: key.toLowerCase().replace(/ /g, "_"),
          requirement_value: 100,
        })) as ProfileBadge[];
      }
    },
  });

  // Fetch user's earned badges
  const userBadges = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return [];

        const { data, error } = await supabase
          .from("user_badges")
          .select(`
            *,
            badge:badge_id(*)
          `)
          .eq("user_id", u.user.id);

        if (error) {
          console.error("Error fetching user badges:", error);
          return [];
        }
        return (data || []) as UserBadge[];
      } catch (e) {
        console.error("Error fetching user badges:", e);
        return [];
      }
    },
  });

  // Equip/unequip badge
  const toggleEquipBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const userBadge = userBadges.data?.find((b) => b.badge_id === badgeId);

      // If equipping, unequip all others first
      await supabase
        .from("user_badges")
        .update({ is_equipped: false })
        .eq("user_id", u.user.id);

      if (!userBadge) {
        // If they are admin and badge is not in database yet, insert it as equipped!
        const { error } = await supabase
          .from("user_badges")
          .insert({
            user_id: u.user.id,
            badge_id: badgeId,
            is_equipped: true
          });
        if (error) throw error;
      } else {
        // Toggle this badge
        const { error } = await supabase
          .from("user_badges")
          .update({ is_equipped: !userBadge.is_equipped })
          .eq("id", userBadge.id);
        if (error) throw error;
      }
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
  const equippedBadgeRaw = userBadges.data?.find((b) => b.is_equipped);
  const equippedBadge = equippedBadgeRaw ? {
    ...equippedBadgeRaw,
    badge: enhanceBadge(equippedBadgeRaw.badge)
  } : undefined;

  const enhancedUserBadges = useMemo(() => {
    const earned = (userBadges.data || []).map(ub => ({
      ...ub,
      badge: enhanceBadge(ub.badge)
    }));

    if (!isAdmin || !availableBadges.data) return earned;

    const earnedIds = new Set(earned.map(e => e.badge_id));
    const pseudoEarned = availableBadges.data
      .filter(b => !earnedIds.has(b.id))
      .map(b => ({
        id: `pseudo-${b.id}`,
        badge_id: b.id,
        earned_at: new Date().toISOString(),
        is_equipped: false,
        badge: enhanceBadge(b)
      }));

    return [...earned, ...pseudoEarned];
  }, [userBadges.data, availableBadges.data, isAdmin]);

  const earnedRealms = enhancedUserBadges
    .sort((a, b) => difficultyWeights[a.badge.difficulty] - difficultyWeights[b.badge.difficulty] || a.badge.name.localeCompare(b.badge.name));

  const lockedBadgesRaw = isAdmin ? [] : (availableBadges.data || [])
    .filter(b => !earnedBadgeIds.has(b.id))
    .map(b => enhanceBadge(b));
  const lockedRealms = lockedBadgesRaw
    .sort((a, b) => difficultyWeights[a.difficulty] - difficultyWeights[b.difficulty] || a.name.localeCompare(b.name));

  const difficultyColors = {
    Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
    Moderate: "border-sky-500/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
    Hard: "border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-purple-400",
    Godly: "border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400",
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Cultivation Badges & Titles</h2>
          <p className="text-sm text-muted-foreground">
            Break through your cultivation realms by completing achievements and milestones
          </p>
        </div>

        {/* Equipped Badge */}
        {equippedBadge && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 border-2 border-violet-500/50 bg-gradient-to-r from-violet-500/5 to-purple-500/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-lg p-3 animate-pulse"
                    style={{
                      backgroundColor: `${equippedBadge.badge.badge_color}20`,
                      color: equippedBadge.badge.badge_color,
                    }}
                  >
                    <BadgeIcon icon={equippedBadge.badge.icon} className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{equippedBadge.badge.name}</h3>
                      <Badge variant="outline" className="gap-1 bg-violet-500/10 text-violet-500 border-violet-500/30">
                        <Check className="h-3 w-3" />
                        Equipped
                      </Badge>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${difficultyColors[equippedBadge.badge.difficulty]}`}>
                        {equippedBadge.badge.difficulty}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted text-muted-foreground font-semibold">
                        {equippedBadge.badge.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {equippedBadge.badge.description}
                    </p>
                    <p className="text-xs text-violet-500 mt-2">
                      Active Dao Realm Title: currently appears next to your username
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEquipBadge.mutate(equippedBadge.badge_id);
                    }}
                  >
                    Unequip
                  </Button>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="p-3 max-w-[280px] bg-card text-card-foreground border">
              <div className="space-y-1">
                <p className="font-bold text-sm text-violet-500">{equippedBadge.badge.category}: {equippedBadge.badge.name}</p>
                <p className="text-xs">{equippedBadge.badge.description}</p>
                <div className="h-px bg-border my-1" />
                <p className="text-[10px] text-muted-foreground">
                  Requirement: {equippedBadge.badge.requirement_type.replace(/_/g, " ")} {equippedBadge.badge.requirement_value ? `(${equippedBadge.badge.requirement_value})` : ""}
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold mt-1">Status: Active Realm {equippedBadge.badge.category}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Earned Achievements Section */}
        {earnedRealms.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-xl border-b pb-2 text-violet-500">Unlocked Dao Realms ({earnedRealms.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {earnedRealms.map((userBadge) => (
                <Tooltip key={userBadge.id}>
                  <TooltipTrigger asChild>
                    <Card
                      className="p-4 cursor-pointer transition-all hover:border-violet-500/50 hover:shadow-lg relative overflow-hidden"
                      onClick={() => setSelectedBadge(userBadge)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg p-2.5"
                          style={{
                            backgroundColor: `${userBadge.badge.badge_color}20`,
                            color: userBadge.badge.badge_color,
                          }}
                        >
                          <BadgeIcon icon={userBadge.badge.icon} className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {userBadge.badge.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[9px] px-1 py-0.1 rounded border font-bold ${difficultyColors[userBadge.badge.difficulty]}`}>
                              {userBadge.badge.difficulty}
                            </span>
                            <span className="text-[9px] px-1 py-0.1 rounded border bg-muted text-muted-foreground font-semibold">
                              {userBadge.badge.category}
                            </span>
                          </div>
                        </div>
                        {userBadge.is_equipped && (
                          <Check className="h-4 w-4 text-violet-500" />
                        )}
                      </div>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="p-3 max-w-[280px] bg-card text-card-foreground border">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-violet-500">{userBadge.badge.category}: {userBadge.badge.name}</p>
                      <p className="text-xs">{userBadge.badge.description}</p>
                      <div className="h-px bg-border my-1" />
                      <p className="text-[10px] text-muted-foreground">
                        Requirement: {userBadge.badge.requirement_type.replace(/_/g, " ")} {userBadge.badge.requirement_value ? `(${userBadge.badge.requirement_value})` : ""}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-semibold mt-1">Status: Unlocked {userBadge.badge.category}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements Section */}
        {lockedRealms.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-xl border-b pb-2 text-muted-foreground">Locked Dao Realms ({lockedRealms.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {lockedRealms.map((badge) => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <Card className="p-3 opacity-60 hover:opacity-100 transition-all hover:border-dashed hover:border-violet-500/50 cursor-pointer">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500/10 text-gray-500/40 p-2.5">
                          <BadgeIcon icon={badge.icon} className="h-6 w-6 opacity-30" />
                          <Lock className="absolute h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate max-w-[120px]">{badge.name}</p>
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <span className={`text-[9px] px-1 py-0.1 rounded border font-bold ${difficultyColors[badge.difficulty]}`}>
                              {badge.difficulty}
                            </span>
                            <span className="text-[9px] px-1 py-0.1 rounded border bg-muted text-muted-foreground font-semibold">
                              {badge.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="p-3 max-w-[280px] bg-card text-card-foreground border">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-yellow-500">🔒 Locked {badge.category}: {badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">How to obtain: {badge.description}</p>
                      <div className="h-px bg-border my-1" />
                      <p className="text-[10px] text-muted-foreground">
                        Requirement: {badge.requirement_type.replace(/_/g, " ")} {badge.requirement_value ? `(${badge.requirement_value})` : ""}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {enhancedUserBadges.length === 0 && lockedBadgesRaw.length === 0 && (
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
                  className="flex h-24 w-24 items-center justify-center rounded-lg p-5"
                  style={{
                    backgroundColor: `${selectedBadge.badge.badge_color}20`,
                    color: selectedBadge.badge.badge_color,
                  }}
                >
                  <BadgeIcon icon={selectedBadge.badge.icon} className="h-14 w-14" />
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
    </TooltipProvider>
  );
}
