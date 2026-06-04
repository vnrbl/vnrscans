import type { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

export type BadgeCategory = "Title" | "Badge" | "Tag";
export type BadgeDifficulty = "Easy" | "Moderate" | "Hard" | "Godly";

export type ProfileBadgeRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  badge_color: string;
  requirement_type: string;
  requirement_value: number | null;
  is_active?: boolean;
};

export type NormalizedBadge = ProfileBadgeRow & {
  category: BadgeCategory;
  difficulty: BadgeDifficulty;
  description: string;
};

export const difficultyWeights: Record<BadgeDifficulty, number> = {
  Easy: 1,
  Moderate: 2,
  Hard: 3,
  Godly: 4,
};

export const difficultyColors: Record<BadgeDifficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  Moderate: "border-sky-500/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
  Hard: "border-purple-500/30 bg-purple-500/10 text-purple-500 dark:text-purple-400",
  Godly: "border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400",
};

/** Legacy generic names → canonical cultivation names (DB sync migration uses the same map). */
export const LEGACY_BADGE_NAME_MAP: Record<
  string,
  { name: string; category: BadgeCategory; difficulty: BadgeDifficulty; icon: string; color: string }
> = {
  "Top Reader": {
    name: "Supreme Dao Ancestor",
    category: "Title",
    difficulty: "Godly",
    icon: "🧘‍♂️",
    color: "#EF4444",
  },
  Speedrunner: {
    name: "Qi Condensation Speedrunner",
    category: "Badge",
    difficulty: "Moderate",
    icon: "⚡",
    color: "#3B82F6",
  },
  Completionist: {
    name: "Grandmaster of Demonic Cultivation",
    category: "Title",
    difficulty: "Hard",
    icon: "💀",
    color: "#8B5CF6",
  },
  "Loyal Fan": {
    name: "Sword Sect Disciple",
    category: "Badge",
    difficulty: "Easy",
    icon: "⚔️",
    color: "#10B981",
  },
  "Streak Master": {
    name: "Asura Demon Emperor",
    category: "Title",
    difficulty: "Godly",
    icon: "👹",
    color: "#F59E0B",
  },
  "Early Bird": {
    name: "Rising Sun Qi Gatherer",
    category: "Badge",
    difficulty: "Easy",
    icon: "🌅",
    color: "#FBBF24",
  },
  "Night Owl": {
    name: "Shadow Realm Wanderer",
    category: "Badge",
    difficulty: "Easy",
    icon: "🌙",
    color: "#6366F1",
  },
  "Genre Explorer": {
    name: "Myriad Beast Emperor",
    category: "Title",
    difficulty: "Moderate",
    icon: "🦁",
    color: "#14B8A6",
  },
  Commentator: {
    name: "Heavenly Dao Gossip Scholar",
    category: "Badge",
    difficulty: "Moderate",
    icon: "📜",
    color: "#06B6D4",
  },
  Critic: {
    name: "Supreme Immortal Judge",
    category: "Title",
    difficulty: "Hard",
    icon: "⚖️",
    color: "#EC4899",
  },
};

/** Canonical seed data — profile and admin both use DB rows derived from this list. */
export const CANONICAL_PROFILE_BADGES: Array<{
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  badge_color: string;
  category: BadgeCategory;
  difficulty: BadgeDifficulty;
}> = [
  {
    name: "Supreme Dao Ancestor",
    description: "Read 1000+ chapters",
    icon: "🧘‍♂️",
    requirement_type: "chapters_read",
    requirement_value: 1000,
    badge_color: "#EF4444",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Qi Condensation Speedrunner",
    description: "Read 50 chapters in one day",
    icon: "⚡",
    requirement_type: "daily_chapters",
    requirement_value: 50,
    badge_color: "#3B82F6",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Grandmaster of Demonic Cultivation",
    description: "Completed 20+ series",
    icon: "💀",
    requirement_type: "series_completed",
    requirement_value: 20,
    badge_color: "#8B5CF6",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Sword Sect Disciple",
    description: "Followed 50+ series",
    icon: "⚔️",
    requirement_type: "series_followed",
    requirement_value: 50,
    badge_color: "#10B981",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Asura Demon Emperor",
    description: "Maintained 100-day streak",
    icon: "👹",
    requirement_type: "reading_streak",
    requirement_value: 100,
    badge_color: "#F59E0B",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Rising Sun Qi Gatherer",
    description: "Read before 6 AM",
    icon: "🌅",
    requirement_type: "early_reader",
    requirement_value: 1,
    badge_color: "#FBBF24",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Shadow Realm Wanderer",
    description: "Read after midnight",
    icon: "🌙",
    requirement_type: "night_reader",
    requirement_value: 1,
    badge_color: "#6366F1",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Myriad Beast Emperor",
    description: "Read 10+ different genres",
    icon: "🦁",
    requirement_type: "genres_explored",
    requirement_value: 10,
    badge_color: "#14B8A6",
    category: "Title",
    difficulty: "Moderate",
  },
  {
    name: "Heavenly Dao Gossip Scholar",
    description: "Posted 100+ comments",
    icon: "📜",
    requirement_type: "comments_posted",
    requirement_value: 100,
    badge_color: "#06B6D4",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Supreme Immortal Judge",
    description: "Rated 50+ series",
    icon: "⚖️",
    requirement_type: "ratings_given",
    requirement_value: 50,
    badge_color: "#EC4899",
    category: "Title",
    difficulty: "Hard",
  },
];

export function encodeBadgeDescription(
  description: string,
  category: BadgeCategory,
  difficulty: BadgeDifficulty
): string {
  return JSON.stringify({
    description: description.trim(),
    category,
    difficulty,
  });
}

export function parseBadgeDescription(rawDescription: string | null): {
  description: string;
  category: BadgeCategory;
  difficulty: BadgeDifficulty;
  isJsonConfigured: boolean;
} {
  if (!rawDescription) {
    return { description: "", category: "Badge", difficulty: "Easy", isJsonConfigured: false };
  }
  if (rawDescription.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawDescription);
      return {
        description: parsed.description || "",
        category: parsed.category || "Badge",
        difficulty: parsed.difficulty || "Easy",
        isJsonConfigured: true,
      };
    } catch {
      // fall through
    }
  }
  return {
    description: rawDescription,
    category: "Badge",
    difficulty: "Easy",
    isJsonConfigured: false,
  };
}

export function normalizeProfileBadge(badge: ProfileBadgeRow): NormalizedBadge {
  const legacy = LEGACY_BADGE_NAME_MAP[badge.name];
  const parsed = parseBadgeDescription(badge.description);

  const name = legacy?.name ?? badge.name;
  const icon = legacy?.icon ?? badge.icon || "🏅";
  const badge_color = legacy?.color ?? badge.badge_color;
  const category = parsed.isJsonConfigured ? parsed.category : legacy?.category ?? parsed.category;
  const difficulty = parsed.isJsonConfigured ? parsed.difficulty : legacy?.difficulty ?? parsed.difficulty;
  const description = parsed.isJsonConfigured
    ? parsed.description
    : legacy
      ? CANONICAL_PROFILE_BADGES.find((b) => b.name === name)?.description ?? parsed.description
      : parsed.description;

  return {
    ...badge,
    name,
    icon,
    badge_color,
    category,
    difficulty,
    description,
  };
}

export function sortBadgesByDifficulty<T extends { difficulty: BadgeDifficulty; name: string }>(
  badges: T[]
): T[] {
  return [...badges].sort(
    (a, b) =>
      difficultyWeights[a.difficulty] - difficultyWeights[b.difficulty] ||
      a.name.localeCompare(b.name)
  );
}

export const emojiToIconName: Record<string, string> = {
  "🧘‍♂️": "Flame",
  "⚡": "Zap",
  "💀": "Skull",
  "⚔️": "Swords",
  "👹": "Flame",
  "🌅": "Sun",
  "🌙": "Moon",
  "🦁": "PawPrint",
  "📜": "Scroll",
  "⚖️": "Scale",
  "🏅": "Award",
};

export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const iconName = emojiToIconName[icon] || "Award";
  const IconComponent = ((Icons as Record<string, LucideIcon>)[iconName] || Icons.Award) as LucideIcon;
  return <IconComponent className={className} />;
}

export const PROFILE_BADGES_QUERY_KEY = ["profile-badges"] as const;
