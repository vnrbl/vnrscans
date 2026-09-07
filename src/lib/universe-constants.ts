export interface UniverseInfo {
  name: string;
  slug: string;
  badge: string;
  colorClass: string;
  borderClass: string;
  bgGradient: string;
  description: string;
  knownSlugs?: string[];
}

export const PRESET_UNIVERSES: UniverseInfo[] = [
  {
    name: "Nano Machine Universe",
    slug: "nano-machine-universe",
    badge: "🦾 Nano Murim",
    colorClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    bgGradient: "from-emerald-950/30 via-slate-900/40 to-card",
    description: "The martial arts & high-tech demonic cult epic created by Jeolmu Hyeon, bridging Nano Machine, Myst, Might, Mayhem, and Absolute Sword Sense.",
    knownSlugs: ["nano-machine", "myst-might-mayhem", "absolute-sword-sense", "descent-of-the-demon-god", "invincible-mumu"],
  },
  {
    name: "Woogak Murim Universe",
    slug: "woogak-murim-universe",
    badge: "⚔️ Woogak Universe",
    colorClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    bgGradient: "from-rose-950/30 via-slate-900/40 to-card",
    description: "The gritty, brutal martial arts universe written by master author Woogak, connecting Legend of the Northern Blade, Reaper of the Drifting Moon, and Martial Artist Lee Gwak.",
    knownSlugs: ["00-legend-of-the-northern-blade", "01-reaper-of-the-drifting-moon", "martial-artist-lee-gwak", "fist-demon-of-mount-hua"],
  },
  {
    name: "Blue String",
    slug: "blue-string",
    badge: "⚡ Blue String",
    colorClass: "text-sky-400",
    borderClass: "border-sky-500/30",
    bgGradient: "from-sky-950/30 via-slate-900/40 to-card",
    description: "YLAB's interconnected Blue String universe exploring high school juvenile law, street fighting, bullying retaliation, and raw teen hierarchy.",
    knownSlugs: ["the-bully-in-charge", "study-group", "hanlim-gym", "to-not-die", "get-schooled", "king-of-the-octagon", "the-world-is-money-and-power"],
  },
  {
    name: "PTJ Universe",
    slug: "ptj-universe",
    badge: "🥊 PTJ Universe",
    colorClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    bgGradient: "from-purple-950/30 via-slate-900/40 to-card",
    description: "The explosive shared world of Park Tae-Jun (PTJ Comics), linking Lookism, Questism, Viral Hit (How to Fight), Manager Kim, and Juvenile Offender.",
    knownSlugs: ["lookism", "questism", "viral-hit", "how-to-fight", "manager-kim", "juvenile-offender", "baek-xx", "my-life-as-a-loser"],
  },
  {
    name: "Super String",
    slug: "super-string",
    badge: "🌌 Super String",
    colorClass: "text-violet-400",
    borderClass: "border-violet-500/30",
    bgGradient: "from-violet-950/30 via-slate-900/40 to-card",
    description: "YLAB's grand cinematic multiverse connecting supernatural heroes, ancient exorcists, and terror operatives across time and space.",
    knownSlugs: ["terror-man", "revival-man", "island", "blade-of-the-phantom-master", "distant-sky", "neolithic-girl", "kangtawoo", "housekeeper"],
  },
  {
    name: "Sing Shong Universe",
    slug: "sing-shong-universe",
    badge: "✨ Sing Shong",
    colorClass: "text-indigo-400",
    borderClass: "border-indigo-500/30",
    bgGradient: "from-indigo-950/30 via-slate-900/40 to-card",
    description: "The world-line and nightmare scenarios created by Sing Shong, featuring Omniscient Reader's Viewpoint and The World After the Fall.",
    knownSlugs: ["the-world-after-the-fall", "omniscient-reader", "omniscient-readers-viewpoint"],
  },
  {
    name: "Solo Leveling Universe",
    slug: "solo-leveling-universe",
    badge: "👑 Shadow Monarch",
    colorClass: "text-fuchsia-400",
    borderClass: "border-fuchsia-500/30",
    bgGradient: "from-fuchsia-950/30 via-slate-900/40 to-card",
    description: "The global hunter and Shadow Monarch franchise, connecting Solo Leveling and Solo Leveling: Ragnarok.",
    knownSlugs: ["solo-leveling", "solo-leveling-ragnarok"],
  },
  {
    name: "The Breaker Universe",
    slug: "the-breaker-universe",
    badge: "🥋 The Breaker",
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    bgGradient: "from-amber-950/30 via-slate-900/40 to-card",
    description: "The modern urban murim saga following the Nine Arts Dragon and Shiwoon Yi across The Breaker, New Waves, and Eternal Force.",
    knownSlugs: ["the-breaker", "the-breaker-new-waves", "the-breaker-eternal-force"],
  },
  {
    name: "Peerless Dad Universe",
    slug: "peerless-dad-universe",
    badge: "🛡️ Noh Ga-Jang",
    colorClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    bgGradient: "from-orange-950/30 via-slate-900/40 to-card",
    description: "The interconnected martial and continental universe created by author Noh Ga-Jang, linking Peerless Dad, Red Storm, and The Great Master.",
    knownSlugs: ["peerless-dad", "red-storm", "the-great-master", "administrator-kang-jin-lee"],
  },
];

export const UNIVERSE_ROLES = [
  "Main Story",
  "Prequel",
  "Sequel",
  "Spin-off",
  "Side Story",
  "Connected Series",
] as const;

export function getUniverseMetadata(universeName?: string | null): UniverseInfo {
  if (!universeName) {
    return {
      name: "",
      slug: "",
      badge: "🌌 Shared Universe",
      colorClass: "text-primary",
      borderClass: "border-primary/30",
      bgGradient: "from-primary/10 via-card/50 to-card",
      description: "Series that take place in the same continuous world or storyline.",
    };
  }

  const clean = universeName.trim().toLowerCase();
  const found = PRESET_UNIVERSES.find(
    (u) =>
      u.name.toLowerCase() === clean ||
      u.slug === clean ||
      clean.includes(u.name.toLowerCase()) ||
      u.name.toLowerCase().includes(clean)
  );

  if (found) return found;

  return {
    name: universeName,
    slug: universeName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    badge: "🌌 Shared Universe",
    colorClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    bgGradient: "from-purple-950/30 via-slate-900/40 to-card",
    description: `Official shared universe featuring interconnected titles and shared world lore.`,
  };
}
