"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(accessToken: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Missing Supabase public credentials");

  const userClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(accessToken);
  if (error || !user) throw new Error("Invalid session");

  const admin = getAdminSupabase();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = roles?.some((r) => r.role === "admin" || r.role === "creator" || r.role === "moderator" || r.role === "uploader");
  if (!isAdmin) throw new Error("Unauthorized: Admin or Uploader access required");

  return user;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── COMICK GENRE & TAG ID DICTIONARY ──────────────────────────────
const COMICK_GENRE_MAP: Record<number | string, string> = {
  1: "Gender Bender",
  2: "Adult",
  3: "Mature",
  244: "Action",
  245: "Adventure",
  247: "Comedy",
  250: "Drama",
  252: "Fantasy",
  255: "Historical",
  256: "Horror",
  258: "Mecha",
  259: "Medical",
  261: "Mystery",
  263: "Psychological",
  264: "Romance",
  266: "Sci-Fi",
  267: "Shoujo Ai",
  268: "Shounen Ai",
  269: "Slice of Life",
  271: "Sports",
  273: "Tragedy",
  275: "Yaoi",
  276: "Yuri",
  278: "Isekai",
  288: "Crime",
  289: "Magical Girls",
  290: "Philosophical",
  291: "Superhero",
  292: "Thriller",
  293: "Wuxia",
};

const COMICK_TAG_MAP: Record<number | string, string> = {
  4: "Mahjong",
  5: "Adult Cast",
  6: "Space",
  7: "Shounen",
  8: "Detective",
  9: "Team Sports",
  10: "Love Polygon",
  11: "Visual Arts",
  12: "Josei",
  13: "Racing",
  14: "Seinen",
  15: "Suspense",
  16: "School",
  17: "Combat Sports",
  18: "Gag Humor",
  19: "Avant Garde",
  20: "Organized Crime",
  21: "Vampire",
  22: "Gourmet",
  23: "Super Power",
  24: "Video Game",
  25: "Shoujo",
  26: "Strategy Game",
  27: "Mythology",
  28: "CGDCT",
  29: "Mahou Shoujo",
  30: "Urban Fantasy",
  31: "Girls Love",
  32: "Childcare",
  33: "Parody",
  34: "Showbiz",
  35: "Boys Love",
  36: "Hentai",
  37: "Magical Sex Shift",
  38: "Otaku Culture",
  39: "Workplace",
  40: "Iyashikei",
  41: "Kids",
  42: "Performing Arts",
  43: "High Stakes Game",
  44: "Anthropomorphic",
  45: "Idols (Female)",
  46: "Erotica",
  47: "Pets",
  48: "Educational",
  49: "Idols (Male)",
  50: "Love Status Quo",
  243: "4-Koma",
  246: "Award Winning",
  248: "Cooking",
  249: "Doujinshi",
  251: "Ecchi",
  253: "Gyaru",
  254: "Harem",
  257: "Martial Arts",
  260: "Music",
  262: "Oneshot",
  265: "School Life",
  270: "Smut",
  272: "Supernatural",
  274: "Long Strip",
  277: "Video Games",
  279: "Adaptation",
  280: "Anthology",
  281: "Web Comic",
  282: "Full Color",
  283: "User Created",
  284: "Official Colored",
  285: "Fan Colored",
  286: "Gore",
  287: "Sexual Violence",
  294: "Aliens",
  295: "Animals",
  296: "Crossdressing",
  297: "Demons",
  298: "Delinquents",
  299: "Genderswap",
  300: "Ghosts",
  301: "Monster Girls",
  302: "Loli",
  303: "Magic",
  304: "Military",
  305: "Monsters",
  306: "Ninja",
  307: "Office Workers",
  308: "Police",
  309: "Post-Apocalyptic",
  310: "Reincarnation",
  311: "Reverse Harem",
  312: "Samurai",
  313: "Shota",
  314: "Survival",
  315: "Time Travel",
  316: "Vampires",
  317: "Traditional Games",
  318: "Virtual Reality",
  319: "Zombies",
  320: "Incest",
  321: "Mafia",
  322: "Villainess",
};

export interface ComickExtractedMetadata {
  title: string;
  slug: string;
  hid?: string;
  description: string;
  alternativeTitles: string;
  genres: string[];
  tags: string[];
  status?: string;
  releaseYear?: number;
  coverUrl?: string;
  rating?: string;
  author?: string;
  artist?: string;
  country?: string;
  comickUrl?: string;
}

export interface ComickSearchResultItem {
  id: number | string;
  hid: string;
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  rating?: string;
  userFollowCount?: number;
  status?: string;
  year?: number;
  country?: string;
}

/**
 * Parses a search item from Comick API v1.0
 */
function parseComickItem(item: any): ComickExtractedMetadata {
  const title = item.title || "";
  const rawDesc = item.desc || item.description || item.parsed || "";
  const description = rawDesc
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\[url=[^\]]+\]([\s\S]*?)\[\/url\]/gi, "$1")
    .replace(/\[\/?(b|i|u|s|color|spoiler|quote)[^\]]*\]/gi, "")
    .replace(/\n*---\s*\*\*Links:\*\*[\s\S]*$/i, "")
    .replace(/\n*---\s*Links:[\s\S]*$/i, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  // Alternative titles
  const altTitles: string[] = [];
  if (Array.isArray(item.md_titles)) {
    item.md_titles.forEach((t: any) => {
      if (t?.title && typeof t.title === "string") altTitles.push(t.title);
    });
  } else if (Array.isArray(item.alt_titles)) {
    item.alt_titles.forEach((t: string) => altTitles.push(t));
  } else if (typeof item.alt_titles === "string") {
    altTitles.push(item.alt_titles);
  }

  // Genres & Tags resolution via dictionary
  const genres: string[] = [];
  const tags: string[] = [];

  if (Array.isArray(item.genres)) {
    item.genres.forEach((gId: any) => {
      const numId = Number(gId);
      if (COMICK_GENRE_MAP[numId]) {
        genres.push(COMICK_GENRE_MAP[numId]);
      } else if (COMICK_TAG_MAP[numId]) {
        tags.push(COMICK_TAG_MAP[numId]);
      } else if (typeof gId === "string") {
        genres.push(gId);
      }
    });
  }

  if (Array.isArray(item.md_comic_md_genres)) {
    item.md_comic_md_genres.forEach((entry: any) => {
      const g = entry.md_genres || entry;
      const name = g?.name?.trim();
      if (name) {
        if (g.type === "genre" || !g.type) {
          genres.push(name);
        } else {
          tags.push(name);
        }
      }
    });
  }

  // Demographic
  if (item.demographic === 1) tags.push("Shounen");
  else if (item.demographic === 2) tags.push("Shoujo");
  else if (item.demographic === 3) tags.push("Seinen");
  else if (item.demographic === 4) tags.push("Josei");
  else if (typeof item.demographic === "string") tags.push(item.demographic);

  // Cover URL
  let coverUrl = "";
  if (Array.isArray(item.md_covers) && item.md_covers.length > 0 && item.md_covers[0].b2key) {
    coverUrl = `https://meo.comick.pictures/${item.md_covers[0].b2key}`;
  } else if (item.cover_url) {
    coverUrl = item.cover_url;
  }

  // Status: Database enum only allows 'ongoing' | 'completed' | 'hiatus'
  let status: "ongoing" | "completed" | "hiatus" = "ongoing";
  if (item.status === 2 || String(item.status).toLowerCase().includes("completed")) {
    status = "completed";
  } else if (
    item.status === 3 ||
    item.status === 4 ||
    String(item.status).toLowerCase().includes("hiatus") ||
    String(item.status).toLowerCase().includes("cancelled") ||
    String(item.status).toLowerCase().includes("canceled")
  ) {
    status = "hiatus";
  }

  // Authors & Artists
  const authors: string[] = [];
  const artists: string[] = [];
  if (Array.isArray(item.authors)) {
    item.authors.forEach((a: any) => {
      const name = typeof a === "string" ? a : a?.name;
      if (name) authors.push(name);
    });
  }
  if (Array.isArray(item.artists)) {
    item.artists.forEach((a: any) => {
      const name = typeof a === "string" ? a : a?.name;
      if (name) artists.push(name);
    });
  }

  const slug = item.slug || slugify(title);
  const hid = item.hid || "";

  return {
    title,
    slug,
    hid,
    description,
    alternativeTitles: altTitles.slice(0, 10).join(", "),
    genres: Array.from(new Set(genres)),
    tags: Array.from(new Set(tags)),
    status,
    releaseYear: item.year ? parseInt(String(item.year), 10) : undefined,
    coverUrl: coverUrl || undefined,
    rating: item.rating ? String(item.rating) : undefined,
    author: authors.join(", ") || undefined,
    artist: artists.join(", ") || undefined,
    country: item.country || undefined,
    comickUrl: slug ? `https://comick.dev/comic/${slug}` : undefined,
  };
}

// In-memory cache for fast repeated Comick searches
const comickSearchCache = new Map<string, { timestamp: number; data: ComickExtractedMetadata[] }>();
const COMICK_CACHE_TTL = 15 * 60 * 1000;

export async function searchComickComics(query: string): Promise<ComickExtractedMetadata[]> {
  const cleanInput = query.trim();
  if (!cleanInput) return [];

  // Extract clean search term if user pasted a URL
  let searchTerm = cleanInput;
  const urlMatch = cleanInput.match(/(?:comick\.(?:dev|io|app|fun|cc|ink))\/(?:comic|title)\/([^/?#]+)/i);
  if (urlMatch && urlMatch[1]) {
    // If slug like "00-solo-leveling" or "04-eleceed", clean up digits
    searchTerm = urlMatch[1].replace(/^\d+-/, "").replace(/-/g, " ").trim();
  }

  const cacheKey = searchTerm.toLowerCase();
  const cached = comickSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COMICK_CACHE_TTL) {
    return cached.data;
  }

  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  const searchEndpoints = [
    `https://api.comick.dev/v1.0/search?q=${encodeURIComponent(searchTerm)}&limit=8`,
    `https://api.comick.cc/v1.0/search?q=${encodeURIComponent(searchTerm)}&limit=8`,
  ];

  for (const endpoint of searchEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map(parseComickItem);
          comickSearchCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
          return parsed;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  // MangaDex fallback if Comick mirrors are temporarily rate-limiting
  try {
    const mdRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(searchTerm)}&limit=5&includes[]=cover_art&includes[]=author&includes[]=artist`,
      {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (mdRes.ok) {
      const mdJson = (await mdRes.json()) as any;
      if (Array.isArray(mdJson?.data) && mdJson.data.length > 0) {
        return mdJson.data.map((m: any) => {
          const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || searchTerm;
          const desc = m.attributes?.description?.en || Object.values(m.attributes?.description || {})[0] || "";
          const genres = (m.attributes?.tags || [])
            .filter((t: any) => t.attributes?.group === "genre")
            .map((t: any) => t.attributes?.name?.en)
            .filter(Boolean);
          const tags = (m.attributes?.tags || [])
            .filter((t: any) => t.attributes?.group !== "genre")
            .map((t: any) => t.attributes?.name?.en)
            .filter(Boolean);

          const coverRel = (m.relationships || []).find((r: any) => r.type === "cover_art");
          const coverFile = coverRel?.attributes?.fileName;
          const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}` : undefined;

          return {
            title,
            slug: slugify(title),
            description: desc,
            alternativeTitles: "",
            genres,
            tags,
            status: m.attributes?.status,
            releaseYear: m.attributes?.year,
            coverUrl,
          };
        });
      }
    }
  } catch {
    // Continue
  }

  return [];
}

/**
 * Helper to extract person names from a text line like 'Authors:[Name](url), [Name2](url)' or 'Author: Name, Name2'
 */
function extractNamesFromSection(text: string, prefix: "Authors?" | "Artists?"): string[] {
  const lineMatch = text.match(new RegExp(`${prefix}:\\s*([^\\r\\n]+)`, "i"));
  if (!lineMatch || !lineMatch[1]) return [];
  const line = lineMatch[1].trim();

  // 1. Extract markdown links [Name](url)
  const linkMatches: string[] = [];
  const linkRegex = /\[([^\]]+)\](?:\([^)]+\))?/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(line)) !== null) {
    const name = match[1].trim();
    if (name && !name.startsWith("http")) {
      linkMatches.push(name);
    }
  }
  if (linkMatches.length > 0) {
    return linkMatches;
  }

  // 2. Fallback to comma/bullet/slash separated text
  return line
    .split(/[,/|•]/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("http") && s !== "N/A" && s !== "-");
}

/**
 * Fast supplementary author/artist resolver from MangaDex API
 */
export async function fetchMangaDexAuthorsAndArtists(
  query: string
): Promise<{ author?: string; artist?: string } | null> {
  const clean = query.trim();
  if (!clean) return null;
  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(clean)}&limit=1&includes[]=author&includes[]=artist`,
      {
        headers: { "User-Agent": "VNRScans/1.0" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const manga = json?.data?.[0];
    if (!manga) return null;

    const authors = (manga.relationships || [])
      .filter((r: any) => r.type === "author")
      .map((r: any) => r.attributes?.name?.trim())
      .filter(Boolean);
    const artists = (manga.relationships || [])
      .filter((r: any) => r.type === "artist")
      .map((r: any) => r.attributes?.name?.trim())
      .filter(Boolean);

    return {
      author: authors.join(", ") || undefined,
      artist: artists.join(", ") || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Scrape full rich tags, genres, author and artist directly from Comick comic page via Jina reader
 * with MangaDex fallback for 100% reliable author/artist detection.
 */
export async function fetchComickFullTagsAndGenres(
  slug: string,
  title?: string,
): Promise<{ tags: string[]; genres: string[]; author?: string; artist?: string } | null> {
  if (!slug) return null;
  let authors: string[] = [];
  let artists: string[] = [];
  let tags: string[] = [];
  let genres: string[] = [];

  try {
    const url = `https://r.jina.ai/https://comick.dev/comic/${slug}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const text = await res.text();

      // 1. Extract all tags matching * [TagName](https://comick.../search?tags=...)
      const tagMatches = [...text.matchAll(/\*\s+\[(.*?)\]\(https:\/\/comick\.(?:dev|cc|ink)\/search\?tags=[^)]+\)/g)];
      tags = tagMatches.map((m) => m[1].trim()).filter(Boolean);

      // 2. Extract Genres
      const genreLine = text.match(/Genres:\s*([^\r\n]+)/i);
      if (genreLine) {
        genres = [...genreLine[1].matchAll(/\[(.*?)\]/g)].map((x) => x[1].trim()).filter(Boolean);
      }

      // 3. Extract Theme & Format lines (supplement tags)
      const themeLine = text.match(/Theme:\s*([^\r\n]+)/i);
      if (themeLine) {
        const themes = [...themeLine[1].matchAll(/\[(.*?)\]/g)].map((x) => x[1].trim()).filter(Boolean);
        tags.push(...themes);
      }

      const formatLine = text.match(/Format:\s*([^\r\n]+)/i);
      if (formatLine) {
        const formats = [...formatLine[1].matchAll(/\[(.*?)\]/g)].map((x) => x[1].trim()).filter(Boolean);
        tags.push(...formats);
      }

      // 4. Extract Authors and Artists from Comick page markdown
      authors = extractNamesFromSection(text, "Authors?");
      artists = extractNamesFromSection(text, "Artists?");
    }
  } catch (err) {
    console.warn(`[fetchComickFullTagsAndGenres] Error scraping Comick page for "${slug}":`, err);
  }

  // 5. Fallback/supplement author and artist with MangaDex if needed
  if (authors.length === 0 || artists.length === 0) {
    const searchTarget = title || slug.replace(/^\d+-/, "").replace(/-/g, " ");
    const md = await fetchMangaDexAuthorsAndArtists(searchTarget);
    if (md) {
      if (authors.length === 0 && md.author) {
        authors = md.author.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (artists.length === 0 && md.artist) {
        artists = md.artist.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  const uniqueTags = Array.from(new Set(tags));
  const uniqueGenres = Array.from(new Set(genres));

  return {
    tags: uniqueTags,
    genres: uniqueGenres,
    author: authors.join(", ") || undefined,
    artist: artists.join(", ") || undefined,
  };
}

/**
 * Fetch and parse comic metadata from Comick by title name or direct URL
 */
export async function fetchComickData(urlOrQuery: string): Promise<ComickExtractedMetadata | null> {
  const results = await searchComickComics(urlOrQuery);
  if (results.length === 0) return null;

  const cleanQuery = urlOrQuery.trim().toLowerCase();

  // Pick exact match or closest title match if available, otherwise 1st result
  const exactMatch = results.find(
    (r) => r.title.toLowerCase() === cleanQuery || r.slug.toLowerCase() === cleanQuery
  );

  const chosen = exactMatch || results[0];
  if (chosen?.slug) {
    const full = await fetchComickFullTagsAndGenres(chosen.slug, chosen.title);
    if (full) {
      if (full.tags.length > 0) {
        chosen.tags = Array.from(new Set([...chosen.tags, ...full.tags]));
      }
      if (full.genres.length > 0) {
        chosen.genres = Array.from(new Set([...chosen.genres, ...full.genres]));
      }
      if (full.author) chosen.author = full.author;
      if (full.artist) chosen.artist = full.artist;
    }
  }

  return chosen;
}

// ── SERVER ACTIONS ────────────────────────────────────────────────

const PreviewComickSchema = z.object({
  query: z.string().min(1, "Enter a series title or URL"),
  accessToken: z.string(),
});

/**
 * Search Comick & return list of matching series cards (with first item pre-enriched)
 */
export async function $searchComickList(args: { data: z.infer<typeof PreviewComickSchema> }) {
  try {
    const validated = PreviewComickSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const results = await searchComickComics(validated.query);
    if (results.length > 0 && results[0]?.slug) {
      try {
        const full = await fetchComickFullTagsAndGenres(results[0].slug, results[0].title);
        if (full) {
          if (full.tags.length > 0) {
            results[0].tags = Array.from(new Set([...results[0].tags, ...full.tags]));
          }
          if (full.genres.length > 0) {
            results[0].genres = Array.from(new Set([...results[0].genres, ...full.genres]));
          }
          if (full.author) results[0].author = full.author;
          if (full.artist) results[0].artist = full.artist;
        }
      } catch {
        // Fallback to basic tags
      }
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

const EnrichComickSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().optional(),
  accessToken: z.string(),
});

/**
 * Enrich a specific Comick item with all rich tags, genres, author & artist
 */
export async function $enrichComickItemDetails(args: {
  data: z.infer<typeof EnrichComickSchema>;
}) {
  try {
    const validated = EnrichComickSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const full = await fetchComickFullTagsAndGenres(validated.slug, validated.title);
    return {
      success: true,
      tags: full?.tags || [],
      genres: full?.genres || [],
      author: full?.author,
      artist: full?.artist,
    };
  } catch (error) {
    return {
      success: false,
      tags: [],
      genres: [],
      error: error instanceof Error ? error.message : "Failed to enrich comic tags",
    };
  }
}

/**
 * Preview Comick Metadata without writing to DB
 */
export async function $previewComickMetadata(args: {
  data: z.infer<typeof PreviewComickSchema>;
}) {
  try {
    const validated = PreviewComickSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const metadata = await fetchComickData(validated.query);

    if (!metadata) {
      return {
        success: false,
        error: `Could not find comic on Comick for: "${validated.query}". Please check the spelling or try searching another title keyword.`,
      };
    }

    return {
      success: true,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch comick metadata",
    };
  }
}

const ImportComickToSeriesSchema = z.object({
  seriesId: z.string().min(1, "Series ID is required"),
  query: z.string().optional(),
  accessToken: z.string(),
  importCover: z.boolean().default(true),
  importSynopsis: z.boolean().default(true),
  importGenresAndTags: z.boolean().default(true),
  importAlternativeTitles: z.boolean().default(true),
  importAuthorAndArtist: z.boolean().default(true).optional(),
  overrideMetadata: z.any().optional(), // Can pass selected metadata directly
});

/**
 * Import Comick Metadata & Automatically Attach ALL Rich Tags, Genres, and Synopsis to a Series
 */
export async function $importComickMetadataToSeries(args: {
  data: z.infer<typeof ImportComickToSeriesSchema>;
}) {
  try {
    const validated = ImportComickToSeriesSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const admin = getAdminSupabase();

    // 1. Get existing series info
    const { data: series, error: seriesError } = await admin
      .from("series")
      .select("id, title, description, cover_url, alternative_titles, slug, type, author, artist")
      .eq("id", validated.seriesId)
      .single();

    if (seriesError || !series) {
      throw new Error(`Series not found in database: ${validated.seriesId}`);
    }

    // 2. Fetch or use provided metadata
    let metadata: ComickExtractedMetadata | null = validated.overrideMetadata || null;

    if (!metadata) {
      const searchQuery = validated.query?.trim() || series.title;
      metadata = await fetchComickData(searchQuery);
    }

    if (!metadata) {
      return {
        success: false,
        error: `Could not find comic on Comick for "${validated.query || series.title}". Please try entering a different search title.`,
      };
    }

    // 2b. Always ensure ALL rich tags, genres, author & artist are fetched directly from Comick page
    const comickSlug = metadata.slug || series.slug;
    if (comickSlug) {
      try {
        const full = await fetchComickFullTagsAndGenres(comickSlug, metadata.title || series.title);
        if (full) {
          if (full.tags.length > 0) {
            metadata.tags = Array.from(new Set([...metadata.tags, ...full.tags]));
          }
          if (full.genres.length > 0) {
            metadata.genres = Array.from(new Set([...metadata.genres, ...full.genres]));
          }
          if (full.author) metadata.author = full.author;
          if (full.artist) metadata.artist = full.artist;
        }
      } catch (err) {
        console.warn("[ComickImport] Failed to scrape rich tags:", err);
      }
    }

    // 3. Update Series Table Columns (Synopsis, Cover, Alt Titles, Status, Author, Artist)
    const updatePayload: Record<string, any> = {};

    if (validated.importSynopsis && metadata.description) {
      updatePayload.description = metadata.description;
    }

    if (validated.importAuthorAndArtist ?? true) {
      if (metadata.author) updatePayload.author = metadata.author;
      if (metadata.artist) updatePayload.artist = metadata.artist;
    }

    if (validated.importCover && metadata.coverUrl) {
      const newCoverUrl = metadata.coverUrl;
      const oldCoverUrl = series.cover_url;

      // 1. If there is an existing old cover, preserve it in series_covers so it is never lost
      if (oldCoverUrl && oldCoverUrl !== newCoverUrl) {
        const { data: oldCoverExists } = await admin
          .from("series_covers")
          .select("id")
          .eq("series_id", validated.seriesId)
          .eq("image_url", oldCoverUrl)
          .maybeSingle();

        if (!oldCoverExists) {
          await admin.from("series_covers").insert({
            series_id: validated.seriesId,
            image_url: oldCoverUrl,
            position: 1,
          });
        }
      }

      // 2. Also register the new recent cover in series_covers
      const { data: newCoverExists } = await admin
        .from("series_covers")
        .select("id")
        .eq("series_id", validated.seriesId)
        .eq("image_url", newCoverUrl)
        .maybeSingle();

      if (!newCoverExists) {
        await admin.from("series_covers").insert({
          series_id: validated.seriesId,
          image_url: newCoverUrl,
          position: 0,
        });
      }

      // 3. Set the new recent cover as the default primary cover
      updatePayload.cover_url = newCoverUrl;
    }

    if (validated.importAlternativeTitles && metadata.alternativeTitles) {
      // Merge with existing alt titles if present
      const existingAlt = series.alternative_titles ? series.alternative_titles.split(",").map((s: string) => s.trim()) : [];
      const newAlt = metadata.alternativeTitles.split(",").map((s: string) => s.trim());
      const combinedAlt = Array.from(new Set([...existingAlt, ...newAlt])).filter(Boolean).join(", ");
      updatePayload.alternative_titles = combinedAlt;
    }

    if (metadata.status && !series.type) {
      updatePayload.status = metadata.status;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await admin
        .from("series")
        .update(updatePayload)
        .eq("id", validated.seriesId);

      if (updateError) {
        console.error("[ComickImport] Series update error:", updateError);
      }
    }

    // 4. Process & Attach Genres from Comick (Batch Optimized)
    const attachedGenres: string[] = [];
    if (validated.importGenresAndTags && metadata.genres && metadata.genres.length > 0) {
      const { data: existingGenres } = await admin.from("genres").select("id, name, slug");
      const genreIdMap = new Map<string, string>();
      const genreSlugMap = new Map<string, string>();
      existingGenres?.forEach((g) => {
        genreIdMap.set(g.name.toLowerCase().trim(), g.id);
        if (g.slug) genreSlugMap.set(g.slug, g.id);
      });

      const genreIdsToLink: string[] = [];

      for (const genreName of metadata.genres) {
        const cleanName = genreName.trim();
        if (!cleanName) continue;
        const key = cleanName.toLowerCase();
        const genreSlug = slugify(cleanName);

        let gId = genreIdMap.get(key) || (genreSlug ? genreSlugMap.get(genreSlug) : undefined);

        if (!gId) {
          const { data: newGenre, error: genreInsertError } = await admin
            .from("genres")
            .insert({ name: cleanName, slug: genreSlug })
            .select("id")
            .single();

          if (!genreInsertError && newGenre?.id) {
            const insertedId = String(newGenre.id);
            gId = insertedId;
            genreIdMap.set(key, insertedId);
            if (genreSlug) genreSlugMap.set(genreSlug, insertedId);
          } else {
            const { data: fallback } = await admin
              .from("genres")
              .select("id")
              .or(`slug.eq.${genreSlug},name.ilike.${cleanName}`)
              .maybeSingle();
            if (fallback?.id) {
              const fallbackId = String(fallback.id);
              gId = fallbackId;
              genreIdMap.set(key, fallbackId);
            }
          }
        }

        if (gId) {
          genreIdsToLink.push(gId);
          attachedGenres.push(cleanName);
        }
      }

      if (genreIdsToLink.length > 0) {
        const uniqueGenreIds = Array.from(new Set(genreIdsToLink));
        await admin.from("series_genres").upsert(
          uniqueGenreIds.map((genre_id) => ({
            series_id: validated.seriesId,
            genre_id,
          })),
          { onConflict: "series_id,genre_id" }
        );
      }
    }

    // 5. Process & Attach ALL Tags from Comick (Batch Optimized)
    const attachedTags: string[] = [];
    if (validated.importGenresAndTags && metadata.tags && metadata.tags.length > 0) {
      const { data: existingTags } = await admin.from("tags").select("id, name, slug");
      const tagIdMap = new Map<string, string>();
      const tagSlugMap = new Map<string, string>();
      existingTags?.forEach((t) => {
        tagIdMap.set(t.name.toLowerCase().trim(), t.id);
        if (t.slug) tagSlugMap.set(t.slug, t.id);
      });

      const tagIdsToLink: string[] = [];

      for (const tagName of metadata.tags) {
        const cleanName = tagName.trim();
        if (!cleanName) continue;
        const key = cleanName.toLowerCase();
        const tagSlug = slugify(cleanName);

        let tId = tagIdMap.get(key) || (tagSlug ? tagSlugMap.get(tagSlug) : undefined);

        if (!tId) {
          const { data: newTag, error: tagInsertError } = await admin
            .from("tags")
            .insert({ name: cleanName, slug: tagSlug })
            .select("id")
            .single();

          if (!tagInsertError && newTag?.id) {
            const insertedId = String(newTag.id);
            tId = insertedId;
            tagIdMap.set(key, insertedId);
            if (tagSlug) tagSlugMap.set(tagSlug, insertedId);
          } else {
            const { data: fallback } = await admin
              .from("tags")
              .select("id")
              .or(`slug.eq.${tagSlug},name.ilike.${cleanName}`)
              .maybeSingle();
            if (fallback?.id) {
              const fallbackId = String(fallback.id);
              tId = fallbackId;
              tagIdMap.set(key, fallbackId);
            }
          }
        }

        if (tId) {
          tagIdsToLink.push(tId);
          attachedTags.push(cleanName);
        }
      }

      if (tagIdsToLink.length > 0) {
        const uniqueTagIds = Array.from(new Set(tagIdsToLink));
        await admin.from("series_tags").upsert(
          uniqueTagIds.map((tag_id) => ({
            series_id: validated.seriesId,
            tag_id,
          })),
          { onConflict: "series_id,tag_id" }
        );
      }
    }

    return {
      success: true,
      metadata,
      message: `Imported from Comick: ${attachedGenres.length} genres, ${attachedTags.length} rich tags${metadata.description ? ", synopsis" : ""}${metadata.coverUrl ? ", cover" : ""}!`,
    };
  } catch (error) {
    console.error("[ComickImport] Critical error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import from Comick",
    };
  }
}

/**
 * Extract multiple cover images from Comick by title name or URL
 */
export async function $extractCoversFromComick(args: {
  data: { query: string; accessToken: string };
}) {
  try {
    const validated = PreviewComickSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const results = await searchComickComics(validated.query);
    if (!results || results.length === 0) {
      return {
        success: false,
        covers: [],
        error: `No comics found on Comick for "${validated.query}"`,
      };
    }

    const covers: string[] = [];
    const seen = new Set<string>();

    for (const item of results) {
      if (item.coverUrl && !seen.has(item.coverUrl)) {
        seen.add(item.coverUrl);
        covers.push(item.coverUrl);
      }
    }

    return {
      success: true,
      covers,
      comicTitle: results[0]?.title,
    };
  } catch (error) {
    return {
      success: false,
      covers: [],
      error: error instanceof Error ? error.message : "Failed to extract Comick covers",
    };
  }
}

