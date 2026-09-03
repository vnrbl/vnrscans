import fs from "fs";
import path from "path";
import { AI_SERIES_CHARACTERS } from "./character-ai-provider";

// ─── Data Types ─────────────────────────────────────────────────────────────

export interface CharacterBioData {
  age?: string;
  gender?: string;
  status?: string;
  roleType?: string;
  combatClass?: string;
  cultivationRealm?: string;
  physique?: string;
  innateTalent?: string;
  affiliation?: string;
  rank?: string;
  weapons?: string[];
  abilities?: string[];
  firstAppearance?: string;
  identity?: string;
}

export interface CharacterRelation {
  name: string;
  slug: string;
  relationType: string;
  description?: string;
  isSpoiler?: boolean;
  avatarUrl?: string;
}

export interface SeriesCharacter {
  id: string;
  seriesSlug: string;
  slug: string;
  name: string;
  nativeName?: string;
  aliases: string[];
  role: "MAIN" | "SUPPORTING" | "ANTAGONIST";
  roleTitle?: string;
  imageUrl: string;
  bannerUrl?: string;
  description: string;
  personality?: string;
  background?: string;
  storySignificance?: string;
  bioData: CharacterBioData;
  relationships: CharacterRelation[];
  spoilerSummary?: string;
  quotes?: string[];
  trivia?: string[];
  sourceUrl?: string;
  updatedAt: string;
}

// ─── Cache Directory Setup ──────────────────────────────────────────────────

const CACHE_DIR = path.join(process.cwd(), "data", "characters");

function getCacheFilePath(seriesSlug: string): string {
  return path.join(CACHE_DIR, `${seriesSlug.toLowerCase().trim()}.json`);
}

function readCachedCharacters(seriesSlug: string): SeriesCharacter[] | null {
  try {
    const filePath = getCacheFilePath(seriesSlug);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn(`[character-fetcher] Failed to read cache for ${seriesSlug}:`, err);
  }
  return null;
}

function writeCachedCharacters(seriesSlug: string, characters: SeriesCharacter[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const filePath = getCacheFilePath(seriesSlug);
    fs.writeFileSync(filePath, JSON.stringify(characters, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[character-fetcher] Failed to write cache for ${seriesSlug}:`, err);
  }
}

// Helper to create clean URL slugs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Known Fandom Wikis Registry ────────────────────────────────────────────

export const KNOWN_FANDOM_WIKIS: Record<string, string> = {
  "nano-machine": "nano-mashine",
  "nano-mashine": "nano-mashine",
  "i-am-the-fated-villain": "i-am-the-fated-villain",
  "fated-villain": "i-am-the-fated-villain",
  "revenge-of-the-iron-blooded-sword-hound": "revengeoftheironbloodedswordhound",
  "iron-blooded-sword-hound": "revengeoftheironbloodedswordhound",
  "solo-leveling": "solo-leveling",
  "omniscient-readers-viewpoint": "omniscient-readers-viewpoint",
  "the-beginning-after-the-end": "tbate",
  "tbate": "tbate",
  "lookism": "lookism",
  "tower-of-god": "towerofgod",
  "return-of-the-mount-hua-sect": "return-of-the-mount-hua-sect",
  "legend-of-the-northern-blade": "northern-blade",
  "surviving-the-game-as-a-barbarian": "surviving-the-game-as-a-barbarian",
  "demonic-emperor": "demonic-emperor",
  "magic-emperor": "demonic-emperor",
  "martial-peak": "martial-peak-mp",
  "apotheosis": "apotheosis",
  "tales-of-demons-and-gods": "tales-of-demons-and-gods",
  "overgeared": "overgeared",
  "second-life-ranker": "second-life-ranker",
  "chronicles-of-heavenly-demon": "chronicles-of-the-heavenly-demon",
  "reaper-of-the-drifting-moon": "reaper-of-the-drifting-moon",
};

// ─── 1. PRIORITY ONE: Fandom.com MediaWiki Scraper ──────────────────────────

export function extractFandomSubdomain(urlOrSlug: string): string {
  const trimmed = urlOrSlug.trim();
  const match = trimmed.match(/https?:\/\/([a-zA-Z0-9_-]+)\.fandom\.com/i);
  if (match) return match[1].toLowerCase();
  return slugify(trimmed);
}

async function getFandomImageUrl(subdomain: string, filename: string): Promise<string | null> {
  try {
    const cleanFile = filename.replace(/^File:/i, "").trim();
    const url = `https://${subdomain}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(
      cleanFile
    )}&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const pages = data.query?.pages || {};
    const first = Object.values(pages)[0] as any;
    return first?.imageinfo?.[0]?.url || null;
  } catch {
    return null;
  }
}

async function scrapeFandomWikiBySubdomain(
  subdomain: string,
  seriesSlug: string,
  seriesTitle: string
): Promise<SeriesCharacter[]> {
  try {
    const candidateTitles = new Set<string>();

    // 1. Check Category:Characters, Category:Male, Category:Female
    const categoryEndpoints = [
      `https://${subdomain}.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Characters&cmlimit=50&format=json`,
      `https://${subdomain}.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Male&cmlimit=30&format=json`,
      `https://${subdomain}.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Female&cmlimit=30&format=json`,
      `https://${subdomain}.fandom.com/api.php?action=query&list=allpages&aplimit=40&format=json`,
    ];

    for (const endpoint of categoryEndpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: AbortSignal.timeout(3500),
        });
        if (!res.ok) continue;
        const d: any = await res.json();
        const members = d.query?.categorymembers || d.query?.allpages || [];
        for (const m of members) {
          const title: string = m.title;
          if (
            title &&
            !title.startsWith("Category:") &&
            !title.startsWith("Template:") &&
            !title.startsWith("User:") &&
            !title.toLowerCase().includes("wiki") &&
            !title.toLowerCase().includes("main page") &&
            !title.toLowerCase().includes("cultivation") &&
            !title.toLowerCase().includes("chapter") &&
            !title.toLowerCase().includes("volume") &&
            !title.toLowerCase().includes("arc") &&
            !title.toLowerCase().includes("gallery") &&
            !title.toLowerCase().includes("martial art") &&
            !title.toLowerCase().includes("weapon") &&
            !title.toLowerCase().includes("armor") &&
            !title.toLowerCase().includes("technique")
          ) {
            candidateTitles.add(title);
          }
        }
      } catch {
        // continue
      }
    }

    if (candidateTitles.size === 0) return [];

    const allCandidateNames = Array.from(candidateTitles);
    let characterNames = allCandidateNames.slice(0, 16);

    // Sort by page length (longest pages = major characters / protagonist)
    try {
      const chunks = allCandidateNames.slice(0, 40);
      const infoUrl = `https://${subdomain}.fandom.com/api.php?action=query&titles=${encodeURIComponent(
        chunks.join("|")
      )}&prop=info&format=json`;
      const infoRes = await fetch(infoUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(4000),
      });
      if (infoRes.ok) {
        const infoData: any = await infoRes.json();
        const pagesList = Object.values(infoData.query?.pages || {}) as Array<{
          title: string;
          length?: number;
        }>;
        pagesList.sort((a, b) => (b.length || 0) - (a.length || 0));
        characterNames = pagesList.map((p) => p.title).slice(0, 16);
      }
    } catch {
      // fallback to original slice
    }

    const characters: SeriesCharacter[] = [];

    for (const [idx, pageTitle] of characterNames.entries()) {
      try {
        const parseUrl = `https://${subdomain}.fandom.com/api.php?action=parse&page=${encodeURIComponent(
          pageTitle
        )}&prop=wikitext|images&format=json`;
        const parseRes = await fetch(parseUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: AbortSignal.timeout(4000),
        });

        if (!parseRes.ok) continue;
        const parseData: any = await parseRes.json();
        const wikitext: string = parseData.parse?.wikitext?.["*"] || "";
        const images: string[] = parseData.parse?.images || [];

        // Parse Infobox Fields
        const extractField = (field: string) => {
          const match = wikitext.match(new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\|\\}\\n]+)`, "i"));
          if (!match) return undefined;
          return match[1]
            .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
            .replace(/<[^>]+>/g, " ")
            .trim();
        };

        const hangul = extractField("hangul") || extractField("korean");
        const hanja = extractField("hanja") || extractField("chinese");
        const nativeName = hangul ? (hanja ? `${hangul} (${hanja})` : hangul) : hanja;

        const titles = extractField("titles") || extractField("aliases") || extractField("title");
        const aliases: string[] = [];
        if (titles) {
          aliases.push(
            ...titles
              .split(/<br\s*\/?>|\n|,/)
              .map((s: string) => s.replace(/\{\{[^}]*\}\}/g, "").trim())
              .filter(Boolean)
          );
        }

        const gender = extractField("gender");
        const affiliation = extractField("affiliation") || extractField("faction") || extractField("clan");
        const realm = extractField("realm") || extractField("cultivation") || extractField("rank");
        const combatClass = extractField("combatClass") || extractField("class") || extractField("occupation");
        const debut = extractField("debut") || extractField("appearance");

        // Direct image
        let imageUrl = "";
        const charImage = images.find(
          (img) =>
            !img.toLowerCase().includes("spoiler") &&
            !img.toLowerCase().includes("logo") &&
            !img.toLowerCase().includes("icon") &&
            !img.toLowerCase().includes("art") &&
            !img.toLowerCase().includes("banner")
        );
        if (charImage) {
          const directUrl = await getFandomImageUrl(subdomain, charImage);
          if (directUrl) imageUrl = directUrl;
        }

        // Clean text description
        const cleanText = wikitext
          .replace(/\{\{[^}]*\}\}/g, "")
          .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
          .replace(/<[^>]+>/g, "")
          .replace(/==+[^=]+==+/g, "")
          .replace(/\|[a-zA-Z0-9_]+\s*=[^|\n]*/g, "")
          .trim();
        const description =
          cleanText.length > 50
            ? cleanText.slice(0, 420) + "..."
            : `${pageTitle} is a prominent continuous character in ${seriesTitle}.`;

        const isProtagonist =
          idx === 0 ||
          pageTitle.toLowerCase().includes("yeo woon") ||
          pageTitle.toLowerCase().includes("changge") ||
          pageTitle.toLowerCase().includes("vikir") ||
          pageTitle.toLowerCase().includes("jinwoo") ||
          pageTitle.toLowerCase().includes("bjorn");

        const isHeroine =
          pageTitle.toLowerCase().includes("mun ku") ||
          pageTitle.toLowerCase().includes("xian'er") ||
          pageTitle.toLowerCase().includes("mingkong") ||
          pageTitle.toLowerCase().includes("aiyen");

        characters.push({
          id: `fandom-${subdomain}-${slugify(pageTitle)}`,
          seriesSlug,
          slug: slugify(pageTitle),
          name: pageTitle,
          nativeName: nativeName || undefined,
          aliases,
          role: isProtagonist ? "MAIN" : "SUPPORTING",
          roleTitle: isProtagonist ? "Protagonist" : isHeroine ? "Main Heroine" : "Supporting Role",
          imageUrl,
          description,
          bioData: {
            gender,
            affiliation,
            cultivationRealm: realm,
            combatClass,
            firstAppearance: debut,
            roleType: isProtagonist ? "Protagonist" : "Supporting Role",
          },
          relationships: [],
          sourceUrl: `https://${subdomain}.fandom.com/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // continue to next character
      }
    }

    // Sort protagonist to front
    characters.sort((a, b) => {
      if (a.role === "MAIN" && b.role !== "MAIN") return -1;
      if (b.role === "MAIN" && a.role !== "MAIN") return 1;
      return 0;
    });

    return characters;
  } catch (err) {
    console.warn(`[character-fetcher] Failed scraping Fandom subdomain ${subdomain}:`, err);
    return [];
  }
}

async function fetchFromFandom(seriesTitle: string, seriesSlug: string): Promise<SeriesCharacter[]> {
  // Check known registry first
  const normalizedSlug = seriesSlug.toLowerCase().trim();
  const knownSubdomain = KNOWN_FANDOM_WIKIS[normalizedSlug];

  const subdomains = [
    knownSubdomain,
    seriesSlug.toLowerCase().trim(),
    seriesSlug.replace(/-/g, "").toLowerCase().trim(),
    seriesSlug.replace(/^the-/, "").toLowerCase().trim(),
    slugify(seriesTitle),
  ].filter(Boolean) as string[];

  for (const subdomain of Array.from(new Set(subdomains))) {
    const chars = await scrapeFandomWikiBySubdomain(subdomain, seriesSlug, seriesTitle);
    if (chars.length >= 4) {
      return chars;
    }
  }

  return [];
}

/**
 * Manually import characters from a user-supplied Fandom wiki URL
 */
export async function importCharactersFromCustomFandomUrl(
  seriesSlug: string,
  fandomUrl: string
): Promise<SeriesCharacter[]> {
  const subdomain = extractFandomSubdomain(fandomUrl);
  if (!subdomain) {
    throw new Error("Invalid Fandom wiki URL. Please provide a URL like https://nano-mashine.fandom.com");
  }

  const seriesTitle = seriesSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const characters = await scrapeFandomWikiBySubdomain(subdomain, seriesSlug, seriesTitle);

  if (characters.length === 0) {
    throw new Error(`Could not find any character pages on Fandom wiki: ${subdomain}.fandom.com`);
  }

  writeCachedCharacters(seriesSlug, characters);
  return characters;
}

// ─── 2. PRIORITY TWO: AI Knowledge Engine ───────────────────────────────────

function fetchFromAIKnowledge(seriesSlug: string, seriesTitle: string): SeriesCharacter[] {
  const normalized = seriesSlug.toLowerCase().trim();
  if (AI_SERIES_CHARACTERS[normalized]) {
    return AI_SERIES_CHARACTERS[normalized];
  }

  const titleSlug = slugify(seriesTitle);
  if (AI_SERIES_CHARACTERS[titleSlug]) {
    return AI_SERIES_CHARACTERS[titleSlug];
  }

  // Key fuzzy matching
  for (const [key, chars] of Object.entries(AI_SERIES_CHARACTERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return chars;
    }
  }

  return [];
}

// ─── 3. PRIORITY THREE: AniList Tertiary Fallback ───────────────────────────

interface AniListResponse {
  data?: {
    Media?: {
      id: number;
      siteUrl?: string;
      title?: {
        romaji?: string;
        english?: string;
        native?: string;
      };
      characters?: {
        edges?: Array<{
          role: string;
          node: {
            id: number;
            siteUrl?: string;
            name: {
              full: string;
              native?: string;
              alternative?: string[];
              alternativeSpoiler?: string[];
            };
            image?: {
              large?: string;
              medium?: string;
            };
            description?: string;
            gender?: string;
            age?: string;
          };
        }>;
      };
    };
  };
}

async function fetchFromAniList(searchTitle: string): Promise<SeriesCharacter[]> {
  try {
    const query = `
      query ($search: String) {
        Media (search: $search, type: MANGA) {
          id
          siteUrl
          title {
            romaji
            english
            native
          }
          characters (sort: [ROLE, RELEVANCE], perPage: 15) {
            edges {
              role
              node {
                id
                siteUrl
                name {
                  full
                  native
                  alternative
                  alternativeSpoiler
                }
                image {
                  large
                  medium
                }
                description
                gender
                age
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { search: searchTitle },
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];

    const json: AniListResponse = await res.json();
    const edges = json.data?.Media?.characters?.edges || [];
    if (edges.length === 0) return [];

    return edges.map((edge, idx) => {
      const node = edge.node;
      const aliases = [
        ...(node.name.alternative || []),
        ...(node.name.alternativeSpoiler || []),
      ].filter(Boolean);

      return {
        id: `anilist-${node.id}`,
        seriesSlug: slugify(searchTitle),
        slug: slugify(node.name.full),
        name: node.name.full,
        nativeName: node.name.native || undefined,
        aliases,
        role: edge.role === "MAIN" ? (idx === 0 ? "MAIN" : "SUPPORTING") : "SUPPORTING",
        roleTitle: edge.role === "MAIN" ? (idx === 0 ? "Protagonist" : "Main Heroine / Ally") : "Supporting Role",
        imageUrl: node.image?.large || node.image?.medium || "",
        description: node.description || `${node.name.full} is a prominent character in ${searchTitle}.`,
        bioData: {
          gender: node.gender || undefined,
          age: node.age || undefined,
          roleType: edge.role === "MAIN" ? "Main Cast" : "Supporting Role",
        },
        relationships: [],
        sourceUrl: node.siteUrl || json.data?.Media?.siteUrl || undefined,
        updatedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// ─── Master Resolver with Strict Hierarchy ───────────────────────────────────

export async function getOrFetchSeriesCharacters(
  seriesTitle: string,
  seriesSlug: string,
  forceRefresh = false
): Promise<SeriesCharacter[]> {
  // 0. Check local file/memory cache
  if (!forceRefresh) {
    const cached = readCachedCharacters(seriesSlug);
    if (cached && cached.length >= 5) {
      return cached;
    }
  }

  // 1. PRIORITY ONE: Fandom.com
  let characters = await fetchFromFandom(seriesTitle, seriesSlug);
  if (characters.length >= 5) {
    writeCachedCharacters(seriesSlug, characters);
    return characters;
  }

  // 2. PRIORITY TWO: AI Knowledge Engine
  const aiCharacters = fetchFromAIKnowledge(seriesSlug, seriesTitle);
  if (aiCharacters.length >= 5) {
    // If Fandom had some images or extra members, merge them
    if (characters.length > 0) {
      const merged = aiCharacters.map((aiChar) => {
        const fMatch = characters.find((fc) => fc.slug === aiChar.slug || fc.name.toLowerCase() === aiChar.name.toLowerCase());
        if (fMatch) {
          return {
            ...aiChar,
            imageUrl: fMatch.imageUrl || aiChar.imageUrl,
            sourceUrl: fMatch.sourceUrl || aiChar.sourceUrl,
          };
        }
        return aiChar;
      });
      writeCachedCharacters(seriesSlug, merged);
      return merged;
    }

    writeCachedCharacters(seriesSlug, aiCharacters);
    return aiCharacters;
  }

  // 3. PRIORITY THREE: AniList Tertiary Fallback
  characters = await fetchFromAniList(seriesTitle);
  if (characters.length === 0 && seriesSlug.includes("-")) {
    const cleanTitle = seriesSlug.replace(/-/g, " ");
    characters = await fetchFromAniList(cleanTitle);
  }

  // 4. PRIORITY FOUR: Guaranteed Fallback to Main & Key Useful Cast
  if (characters.length === 0) {
    characters = generateDefaultSeriesCharacters(seriesTitle, seriesSlug);
  }

  // Save to persistent cache
  if (characters.length > 0) {
    writeCachedCharacters(seriesSlug, characters);
  }

  return characters;
}

/**
 * Generates structured Main & Useful Characters when Fandom has no entries for this series
 */
export function generateDefaultSeriesCharacters(seriesTitle: string, seriesSlug: string): SeriesCharacter[] {
  const cleanTitle = seriesTitle.trim() || seriesSlug.replace(/-/g, " ");
  
  return [
    {
      id: `${seriesSlug}-protagonist`,
      seriesSlug,
      slug: "main-protagonist",
      name: `Protagonist of ${cleanTitle}`,
      role: "MAIN",
      roleTitle: "Main Character",
      imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=300&fit=crop&crop=face",
      description: `The resolute main character of ${cleanTitle}, determined to defy fate and ascend to the apex of power.`,
      bioData: {
        status: "Alive",
        roleType: "Main Character",
        cultivationRealm: "Rising Prodigy",
        combatClass: "Martial Artist / Awakened",
        affiliation: cleanTitle,
      },
      aliases: ["The Chosen One", "Sole Sovereign"],
      relationships: [],
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${seriesSlug}-heroine`,
      seriesSlug,
      slug: "main-heroine",
      name: "Primary Heroine",
      role: "MAIN",
      roleTitle: "Main Heroine",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
      description: `A brilliant prodigy and crucial ally fighting alongside the protagonist throughout the events of ${cleanTitle}.`,
      bioData: {
        status: "Alive",
        roleType: "Main Heroine",
        cultivationRealm: "Spiritual Peak",
        combatClass: "Elemental Arts",
        affiliation: cleanTitle,
      },
      aliases: ["Fairy of the Frost"],
      relationships: [],
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${seriesSlug}-rival`,
      seriesSlug,
      slug: "destined-rival",
      name: "Destined Rival",
      role: "ANTAGONIST",
      roleTitle: "Destined Rival",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      description: `A relentless rival and formidable powerhouse constantly clashing with the protagonist in ${cleanTitle}.`,
      bioData: {
        status: "Active",
        roleType: "Destined Rival",
        cultivationRealm: "Sovereign Realm",
        combatClass: "Heavy Blade Master",
        affiliation: "Rival Faction",
      },
      aliases: ["The Unvanquished"],
      relationships: [],
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${seriesSlug}-senior-elder`,
      seriesSlug,
      slug: "senior-mentor",
      name: "Senior Mentor",
      role: "SUPPORTING",
      roleTitle: "Venerable Guide",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
      description: `An esteemed elder and guardian who imparts lost knowledge, sacred arts, and secret insights to the main cast.`,
      bioData: {
        status: "Alive",
        roleType: "Supporting Role",
        cultivationRealm: "Transcendent Master",
        combatClass: "Daoist Grandmaster",
        affiliation: "Ancient Sect",
      },
      aliases: ["Old Daoist", "Grandmaster"],
      relationships: [],
      updatedAt: new Date().toISOString(),
    },
  ];
}

export async function getCharacterBySlug(
  seriesSlug: string,
  characterSlug: string
): Promise<SeriesCharacter | null> {
  const characters = await getOrFetchSeriesCharacters(seriesSlug.replace(/-/g, " "), seriesSlug);
  const found = characters.find(
    (c) => c.slug.toLowerCase() === characterSlug.toLowerCase() || slugify(c.name) === characterSlug.toLowerCase()
  );
  return found || null;
}
