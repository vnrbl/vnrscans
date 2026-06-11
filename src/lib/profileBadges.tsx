import type { LucideIcon } from "lucide-react";
import {
  Flame, Zap, Skull, Swords, Sun, Moon, PawPrint, Scroll, Scale, FlaskConical,
  Orbit, Crown, Sword, Feather, Compass, ShieldAlert, Shield, User, Ghost,
  Droplet, Flower, Mountain, Pill, Gem, Sparkles, Sprout, Layers, Circle,
  Baby, Leaf, PenTool, Grid, CloudLightning, Cloud, Tent, Award, HardHat,
  Triangle, Dna, Loader, Eye, Wand, Target, Map, Bomb, Magnet, Waves,
  Snowflake, Wind, Settings, Bird, Dog, Minus, Laugh, AlertTriangle, Stars,
  CircleDot, Link, Flag
} from "lucide-react";

const IconMap: Record<string, LucideIcon> = {
  Flame, Zap, Skull, Swords, Sun, Moon, PawPrint, Scroll, Scale, FlaskConical,
  Orbit, Crown, Sword, Feather, Compass, ShieldAlert, Shield, User, Ghost,
  Droplet, Flower, Mountain, Pill, Gem, Sparkles, Sprout, Layers, Circle,
  Baby, Leaf, PenTool, Grid, CloudLightning, Cloud, Tent, Award, HardHat,
  Triangle, Dna, Loader, Eye, Wand, Target, Map, Bomb, Magnet, Waves,
  Snowflake, Wind, Settings, Bird, Dog, Minus, Laugh, AlertTriangle, Stars,
  CircleDot, Link, Flag
};

export type BadgeCategory = "Title" | "Badge" | "Tag";
export type BadgeDifficulty = "Easy" | "Moderate" | "Hard" | "Godly";

export type ProfileBadgeRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  badge_color: string | null;
  requirement_type: string;
  requirement_value: number | null;
  is_active: boolean | null;
  created_at: string | null;
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
    name: "Bronze Initiate",
    description: "Follow 10+ series",
    icon: "🌱",
    requirement_type: "series_followed",
    requirement_value: 10,
    badge_color: "#CD7F32",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Iron Warrior",
    description: "Read 30 chapters in a single day",
    icon: "🧱",
    requirement_type: "daily_chapters",
    requirement_value: 30,
    badge_color: "#708090",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Silver Knight",
    description: "Explore 5+ different genres",
    icon: "⚔️",
    requirement_type: "genres_explored",
    requirement_value: 5,
    badge_color: "#C0C0C0",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Sakura Dream",
    description: "Maintain a 15-day reading streak",
    icon: "🌸",
    requirement_type: "reading_streak",
    requirement_value: 15,
    badge_color: "#F472B6",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Platinum Vanguard",
    description: "Rate 15+ series",
    icon: "🛡️",
    requirement_type: "ratings_given",
    requirement_value: 15,
    badge_color: "#E5E4E2",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Neon Phoenix",
    description: "Read 150+ chapters",
    icon: "⚡",
    requirement_type: "chapters_read",
    requirement_value: 150,
    badge_color: "#EC4899",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Heavenly Qi",
    description: "Follow 30+ series",
    icon: "📿",
    requirement_type: "series_followed",
    requirement_value: 30,
    badge_color: "#10B981",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Cyber Nexus",
    description: "Read 500+ chapters",
    icon: "💠",
    requirement_type: "chapters_read",
    requirement_value: 500,
    badge_color: "#06B6D4",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Golden Royal",
    description: "Maintain a 50-day reading streak",
    icon: "👑",
    requirement_type: "reading_streak",
    requirement_value: 50,
    badge_color: "#F59E0B",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Chronos Distortion",
    description: "Read 80 chapters in a single day",
    icon: "🌀",
    requirement_type: "daily_chapters",
    requirement_value: 80,
    badge_color: "#EF4444",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Manga Scholar",
    description: "Post 25+ comments",
    icon: "📜",
    requirement_type: "comments_posted",
    requirement_value: 25,
    badge_color: "#D2B48C",
    category: "Badge",
    difficulty: "Easy",
  },
  {
    name: "Scroll Keeper",
    description: "Follow 40+ series",
    icon: "📜",
    requirement_type: "series_followed",
    requirement_value: 40,
    badge_color: "#8FBC8F",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Sage Reader",
    description: "Explore 8+ different genres",
    icon: "🧪",
    requirement_type: "genres_explored",
    requirement_value: 8,
    badge_color: "#00FA9A",
    category: "Badge",
    difficulty: "Moderate",
  },
  {
    name: "Lore Master",
    description: "Post 150+ comments",
    icon: "📜",
    requirement_type: "comments_posted",
    requirement_value: 150,
    badge_color: "#DA70D6",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Immortal Reader",
    description: "Maintain a 100-day reading streak",
    icon: "🧘‍♂️",
    requirement_type: "reading_streak",
    requirement_value: 100,
    badge_color: "#FFD700",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Fiery Aura",
    description: "Rate 75+ series",
    icon: "🔥",
    requirement_type: "ratings_given",
    requirement_value: 75,
    badge_color: "#EF4444",
    category: "Title",
    difficulty: "Hard",
  },
  {
    name: "Shadow Monarch",
    description: "Read 2500+ chapters",
    icon: "🌑",
    requirement_type: "chapters_read",
    requirement_value: 2500,
    badge_color: "#6366F1",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Abyssal Void",
    description: "Explore 25+ different genres",
    icon: "🌑",
    requirement_type: "genres_explored",
    requirement_value: 25,
    badge_color: "#D946EF",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Murim Asura",
    description: "Completed 30+ series",
    icon: "👹",
    requirement_type: "series_completed",
    requirement_value: 30,
    badge_color: "#EF4444",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "Seraphic Light",
    description: "Follow 150+ series",
    icon: "🪶",
    requirement_type: "series_followed",
    requirement_value: 150,
    badge_color: "#FCD34D",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "System Hunter",
    description: "Read 200 chapters in a single day",
    icon: "⚡",
    requirement_type: "daily_chapters",
    requirement_value: 200,
    badge_color: "#06B6D4",
    category: "Title",
    difficulty: "Godly",
  },
  {
    name: "The Creator",
    description: "Universal administrator status. Responsive to custom colors.",
    icon: "👑",
    requirement_type: "role_admin",
    requirement_value: 1,
    badge_color: "#8B5CF6",
    category: "Title",
    difficulty: "Godly",
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

/** Fallback rows when `profile_badges` is empty or unreachable — matches DB JSON shape. */
export function fallbackBadgeRows(): ProfileBadgeRow[] {
  return CANONICAL_PROFILE_BADGES.map((b, index) => ({
    id: `fallback-${index}-${b.name.replace(/\s+/g, "-")}`,
    name: b.name,
    description: encodeBadgeDescription(b.description, b.category, b.difficulty),
    icon: b.icon,
    badge_color: b.badge_color,
    requirement_type: b.requirement_type,
    requirement_value: b.requirement_value,
    is_active: true,
    created_at: null,
  }));
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
  const icon = legacy?.icon ?? (badge.icon || "🏅");
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
  "🧪": "FlaskConical",
  "🌌": "Orbit",
  "👑": "Crown",
  "🗡️": "Sword",
  "🪶": "Feather",
  "☯️": "Compass",
  "🐘": "ShieldAlert",
  "🐢": "Shield",
  "🍶": "FlaskConical",
  "🧙‍♂️": "User",
  "🧑‍🦳": "User",
  "👻": "Ghost",
  "🩸": "Droplet",
  "🐾": "PawPrint",
  "😈": "Flame",
  "🌸": "Flower",
  "🏔️": "Mountain",
  "🌑": "Moon",
  "💊": "Pill",
  "📿": "Gem",
  "🐉": "Sparkles",
  "🔥": "Flame",
  "🌱": "Sprout",
  "🧱": "Layers",
  "🟡": "Circle",
  "👶": "Baby",
  "🌿": "Leaf",
  "🔏": "PenTool",
  "💠": "Grid",
  "⛈️": "CloudLightning",
  "☁️": "Cloud",
  "🛡️": "Shield",
  "⛺": "Tent",
  "🏅": "Award",
  // manhwa / korean webtoon extras
  "🪖": "HardHat",
  "🔱": "Triangle",
  "🧬": "Dna",
  "🕳️": "Circle",
  "🌀": "Loader",
  "🔮": "Eye",
  "🪄": "Wand",
  "🏹": "Target",
  "🗺️": "Map",
  "💣": "Bomb",
  "🧲": "Magnet",
  "🕯️": "Flame",
  "🌊": "Waves",
  "❄️": "Snowflake",
  "🌪️": "Wind",
  "⚗️": "FlaskConical",
  "🔩": "Settings",
  "💥": "Zap",
  "🦅": "Bird",
  "🐺": "Dog",
  "🐍": "Minus",
  "🦊": "Laugh",
  "🐯": "AlertTriangle",
  "🦋": "Sparkles",
  "👁️": "Eye",
  "🌙✨": "Stars",
  "🧿": "CircleDot",
  "⛓️": "Link",
  "🏴": "Flag",
};

export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const iconName = emojiToIconName[icon] || "Award";
  const IconComponent = IconMap[iconName] || Award;
  return <IconComponent className={className} />;
}

export const PROFILE_BADGES_QUERY_KEY = ["profile-badges"] as const;

/** Extended badge metadata for cultivation-themed badges */
export const EXTENDED_BADGE_METADATA: Record<string, {
  name: string;
  category: BadgeCategory;
  difficulty: BadgeDifficulty;
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

  // ─── Manhwa / Korean Webtoon Titles ───────────────────────────────────────

  // ── Solo Leveling inspired ──
  'Shadow Monarch': {
    name: 'Shadow Monarch',
    category: 'Title',
    difficulty: 'Godly',
    color: '#1E1B4B',
    icon: '🌑',
  },
  'S-Rank Hunter': {
    name: 'S-Rank Hunter',
    category: 'Title',
    difficulty: 'Godly',
    color: '#FBBF24',
    icon: '🏹',
  },
  'Arise': {
    name: 'Arise',
    category: 'Title',
    difficulty: 'Godly',
    color: '#4F46E5',
    icon: '🌑',
  },
  'Gate Raider': {
    name: 'Gate Raider',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#7C3AED',
    icon: '🌀',
  },
  'E-Rank No More': {
    name: 'E-Rank No More',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#6B7280',
    icon: '🌱',
  },
  'Double Dungeon Survivor': {
    name: 'Double Dungeon Survivor',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#8B5CF6',
    icon: '🕳️',
  },

  // ── Omniscient Reader's Viewpoint inspired ──
  'Kim Dokja': {
    name: 'Sole Reader',
    category: 'Title',
    difficulty: 'Godly',
    color: '#2563EB',
    icon: '📿',
  },
  'Constellation': {
    name: 'Constellation',
    category: 'Title',
    difficulty: 'Hard',
    color: '#6D28D9',
    icon: '🌌',
  },
  'Dokkaebi Host': {
    name: 'Dokkaebi Host',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#059669',
    icon: '🔮',
  },
  'Incarnation': {
    name: 'Incarnation',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#7C3AED',
    icon: '🧬',
  },
  'Way of the King': {
    name: 'Way of the King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#DC2626',
    icon: '🔱',
  },

  // ── The Beginning After the End / TBATE inspired ──
  'King Grey': {
    name: 'King Grey',
    category: 'Title',
    difficulty: 'Godly',
    color: '#374151',
    icon: '🗡️',
  },
  'Mana Arts Master': {
    name: 'Mana Arts Master',
    category: 'Title',
    difficulty: 'Hard',
    color: '#3B82F6',
    icon: '🪄',
  },
  'Reincarnated Prodigy': {
    name: 'Reincarnated Prodigy',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#8B5CF6',
    icon: '🧬',
  },
  'Dicathen Hero': {
    name: 'Dicathen Hero',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#2563EB',
    icon: '🛡️',
  },

  // ── Tower of God inspired ──
  'Irregular': {
    name: 'Irregular',
    category: 'Title',
    difficulty: 'Godly',
    color: '#0EA5E9',
    icon: '🌀',
  },
  'Tower Climber': {
    name: 'Tower Climber',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#64748B',
    icon: '🏔️',
  },
  'Floor Guardian': {
    name: 'Floor Guardian',
    category: 'Title',
    difficulty: 'Hard',
    color: '#B45309',
    icon: '🛡️',
  },
  'Shinsu Master': {
    name: 'Shinsu Master',
    category: 'Title',
    difficulty: 'Hard',
    color: '#7DD3FC',
    icon: '🌊',
  },
  'Twenty-Fifth Baam': {
    name: 'Light of the Tower',
    category: 'Title',
    difficulty: 'Godly',
    color: '#FCD34D',
    icon: '🕯️',
  },

  // ── Nano Machine / Murim inspired ──
  'Nano Machine User': {
    name: 'Nano Machine User',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#06B6D4',
    icon: '🧲',
  },
  'Murim Supreme': {
    name: 'Murim Supreme',
    category: 'Title',
    difficulty: 'Godly',
    color: '#DC2626',
    icon: '⚔️',
  },
  'Chun Mu-Won': {
    name: 'Martial Arts Prodigy',
    category: 'Title',
    difficulty: 'Hard',
    color: '#92400E',
    icon: '🔱',
  },
  'Murim Alliance Chief': {
    name: 'Murim Alliance Chief',
    category: 'Title',
    difficulty: 'Hard',
    color: '#B45309',
    icon: '🪖',
  },

  // ── Overgeared / Gaming Webtoon inspired ──
  'Overgeared King': {
    name: 'Overgeared King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#F59E0B',
    icon: '👑',
  },
  'Legendary Blacksmith': {
    name: 'Legendary Blacksmith',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#92400E',
    icon: '🔩',
  },
  'Grid': {
    name: 'Pagma\'s Successor',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '🔥',
  },

  // ── Reincarnation / Regression themes ──
  'The Regressor': {
    name: 'The Regressor',
    category: 'Title',
    difficulty: 'Hard',
    color: '#7C3AED',
    icon: '🔮',
  },
  'Loop Breaker': {
    name: 'Loop Breaker',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#6366F1',
    icon: '🌀',
  },
  'Second Life Reader': {
    name: 'Second Life Reader',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '🧬',
  },
  'Reincarnated Villain': {
    name: 'Reincarnated Villain',
    category: 'Title',
    difficulty: 'Hard',
    color: '#991B1B',
    icon: '😈',
  },
  'Returner': {
    name: 'Returner',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#4B5563',
    icon: '🌀',
  },

  // ── Dungeon / Hunter webtoon themes ──
  'Dungeon Master': {
    name: 'Dungeon Master',
    category: 'Title',
    difficulty: 'Hard',
    color: '#7C3AED',
    icon: '🕳️',
  },
  'Raid Leader': {
    name: 'Raid Leader',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#F97316',
    icon: '🏹',
  },
  'Awakened One': {
    name: 'Awakened One',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#3B82F6',
    icon: '⚡',
  },
  'Hidden Boss Slayer': {
    name: 'Hidden Boss Slayer',
    category: 'Title',
    difficulty: 'Godly',
    color: '#DC2626',
    icon: '💥',
  },
  'Monarch of Destruction': {
    name: 'Monarch of Destruction',
    category: 'Title',
    difficulty: 'Godly',
    color: '#1F2937',
    icon: '💣',
  },

  // ── The Legendary Mechanic / System ──
  'System User': {
    name: 'System User',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#06B6D4',
    icon: '🧲',
  },
  'Mechanic God': {
    name: 'Mechanic God',
    category: 'Title',
    difficulty: 'Godly',
    color: '#64748B',
    icon: '🔩',
  },
  'Secret Class Student': {
    name: 'Secret Class Student',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#10B981',
    icon: '🌿',
  },

  // ── Villain / Anti-Hero ──
  'Demon King': {
    name: 'Demon King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#7F1D1D',
    icon: '👹',
  },
  'The True Villain': {
    name: 'The True Villain',
    category: 'Title',
    difficulty: 'Hard',
    color: '#1F2937',
    icon: '🏴',
  },
  'Dark Hero': {
    name: 'Dark Hero',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#374151',
    icon: '🌑',
  },
  'Fallen Angel': {
    name: 'Fallen Angel',
    category: 'Title',
    difficulty: 'Hard',
    color: '#4B5563',
    icon: '🪶',
  },
  'Chaos Bringer': {
    name: 'Chaos Bringer',
    category: 'Title',
    difficulty: 'Godly',
    color: '#991B1B',
    icon: '🌀',
  },

  // ── Martial Arts Peak Titles ──
  'Heavenly Demon Cult Master': {
    name: 'Heavenly Demon Cult Master',
    category: 'Title',
    difficulty: 'Godly',
    color: '#7C1D1D',
    icon: '😈',
  },
  'Undefeated Fist King': {
    name: 'Undefeated Fist King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#DC2626',
    icon: '🔱',
  },
  'Ten Thousand Poison Cultivator': {
    name: 'Ten Thousand Poison Cultivator',
    category: 'Title',
    difficulty: 'Hard',
    color: '#65A30D',
    icon: '🐍',
  },
  'Dragon Blood Warrior': {
    name: 'Dragon Blood Warrior',
    category: 'Title',
    difficulty: 'Hard',
    color: '#B91C1C',
    icon: '🐉',
  },
  'Ice and Fire Dual Cultivator': {
    name: 'Ice and Fire Dual Cultivator',
    category: 'Title',
    difficulty: 'Hard',
    color: '#7DD3FC',
    icon: '❄️',
  },
  'Storm Emperor': {
    name: 'Storm Emperor',
    category: 'Title',
    difficulty: 'Godly',
    color: '#6366F1',
    icon: '🌪️',
  },

  // ── Alchemy / Crafting ──
  'Grandmaster Alchemist': {
    name: 'Grandmaster Alchemist',
    category: 'Title',
    difficulty: 'Hard',
    color: '#D97706',
    icon: '⚗️',
  },
  'Poison Doctor': {
    name: 'Poison Doctor',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#16A34A',
    icon: '🧪',
  },
  'Flame Alchemist': {
    name: 'Flame Alchemist',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#F97316',
    icon: '🔥',
  },

  // ── Spirit / Summon themes ──
  'Spirit King': {
    name: 'Spirit King',
    category: 'Title',
    difficulty: 'Godly',
    color: '#A78BFA',
    icon: '👁️',
  },
  'Contract Summoner': {
    name: 'Contract Summoner',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#8B5CF6',
    icon: '⛓️',
  },
  'Phoenix Bloodline': {
    name: 'Phoenix Bloodline',
    category: 'Title',
    difficulty: 'Godly',
    color: '#EF4444',
    icon: '🦅',
  },
  'White Tiger Sovereign': {
    name: 'White Tiger Sovereign',
    category: 'Title',
    difficulty: 'Hard',
    color: '#F1F5F9',
    icon: '🐯',
  },
  'Nine-Tailed Fox': {
    name: 'Nine-Tailed Fox',
    category: 'Title',
    difficulty: 'Hard',
    color: '#F97316',
    icon: '🦊',
  },
  'Silver Wolf Berserker': {
    name: 'Silver Wolf Berserker',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#94A3B8',
    icon: '🐺',
  },

  // ── Reader-activity themed (manhwa reading culture) ──
  'Chapter Hunter': {
    name: 'Chapter Hunter',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#0EA5E9',
    icon: '🏹',
  },
  'Manhwa Addict': {
    name: 'Manhwa Addict',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#EC4899',
    icon: '🦋',
  },
  'Raw Reader': {
    name: 'Raw Reader',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#F59E0B',
    icon: '🗺️',
  },
  'Spoiler Seeker': {
    name: 'Spoiler Seeker',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#EF4444',
    icon: '🧿',
  },
  'All-Nighter': {
    name: 'All-Nighter',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#6366F1',
    icon: '🌑',
  },
  'One More Chapter Syndrome': {
    name: 'One More Chapter Syndrome',
    category: 'Title',
    difficulty: 'Easy',
    color: '#8B5CF6',
    icon: '💥',
  },
  'Cliffhanger Survivor': {
    name: 'Cliffhanger Survivor',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#DC2626',
    icon: '⛓️',
  },
  'Waiting Room Regular': {
    name: 'Waiting Room Regular',
    category: 'Badge',
    difficulty: 'Easy',
    color: '#9CA3AF',
    icon: '⛺',
  },
  'Hiatus Endurer': {
    name: 'Hiatus Endurer',
    category: 'Badge',
    difficulty: 'Hard',
    color: '#6B7280',
    icon: '🐢',
  },
  'MTL Translator': {
    name: 'MTL Translator',
    category: 'Badge',
    difficulty: 'Moderate',
    color: '#059669',
    icon: '🗺️',
  },
  'The Creator': {
    name: 'The Creator',
    category: 'Title',
    difficulty: 'Godly',
    color: '#8B5CF6',
    icon: '👑',
  },
};

/**
 * Enhanced badge normalization that merges legacy names, JSON metadata, and extended metadata
 */
export function enhanceBadge(badge: ProfileBadgeRow): NormalizedBadge {
  // First check extended metadata
  const extendedKey = Object.keys(EXTENDED_BADGE_METADATA).find(
    (k) => k === badge.name || EXTENDED_BADGE_METADATA[k].name === badge.name
  );
  const extendedMeta = extendedKey ? EXTENDED_BADGE_METADATA[extendedKey] : null;

  // Then check legacy map
  const legacy = LEGACY_BADGE_NAME_MAP[badge.name];
  
  // Parse JSON description if present
  const parsed = parseBadgeDescription(badge.description);

  // Priority: JSON > Extended Metadata > Legacy > Default
  const name = extendedMeta?.name || legacy?.name || badge.name;
  const icon = extendedMeta?.icon || legacy?.icon || badge.icon || '🏅';
  const badge_color = extendedMeta?.color || legacy?.color || badge.badge_color;
  const category = parsed.isJsonConfigured 
    ? parsed.category 
    : extendedMeta?.category || legacy?.category || parsed.category;
  const difficulty = parsed.isJsonConfigured 
    ? parsed.difficulty 
    : extendedMeta?.difficulty || legacy?.difficulty || parsed.difficulty;
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
