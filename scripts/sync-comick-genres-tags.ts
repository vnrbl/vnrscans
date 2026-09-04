import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read Supabase config from .env
const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)![1].trim();
const serviceKey = (
  env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/) ||
  env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/)
)![1].trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Comick genre dictionary
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

// Comick tag dictionary
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

interface ExtractedMetadata {
  genres: string[];
  tags: string[];
}

function parseComickItem(item: any): ExtractedMetadata {
  const genres: string[] = [];
  const tags: string[] = [];

  if (Array.isArray(item.genres)) {
    item.genres.forEach((gId: any) => {
      const numId = Number(gId);
      if (COMICK_GENRE_MAP[numId]) {
        genres.push(COMICK_GENRE_MAP[numId]);
      } else if (COMICK_TAG_MAP[numId]) {
        tags.push(COMICK_TAG_MAP[numId]);
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

  // Demographic to tag
  if (item.demographic === 1) tags.push("Shounen");
  else if (item.demographic === 2) tags.push("Shoujo");
  else if (item.demographic === 3) tags.push("Seinen");
  else if (item.demographic === 4) tags.push("Josei");

  return {
    genres: Array.from(new Set(genres)),
    tags: Array.from(new Set(tags)),
  };
}

async function fetchMetadataForTitle(title: string): Promise<ExtractedMetadata | null> {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  // Clean search query (strip prefix numbers, punctuation)
  const cleanTitle = title
    .replace(/^[\d-]+/, "")
    .replace(/[?!:;]/g, " ")
    .trim();

  const searchEndpoints = [
    `https://api.comick.dev/v1.0/search?q=${encodeURIComponent(cleanTitle)}&limit=5`,
    `https://api.comick.cc/v1.0/search?q=${encodeURIComponent(cleanTitle)}&limit=5`,
  ];

  for (const endpoint of searchEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": userAgent, Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (Array.isArray(data) && data.length > 0) {
          return parseComickItem(data[0]);
        }
      }
    } catch {
      // try next
    }
  }

  // MangaDex fallback
  try {
    const mdRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=3`,
      {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (mdRes.ok) {
      const mdJson = (await mdRes.json()) as any;
      if (Array.isArray(mdJson?.data) && mdJson.data.length > 0) {
        const manga = mdJson.data[0];
        const genres = (manga.attributes?.tags || [])
          .filter((t: any) => t.attributes?.group === "genre")
          .map((t: any) => t.attributes?.name?.en)
          .filter(Boolean);
        const tags = (manga.attributes?.tags || [])
          .filter((t: any) => t.attributes?.group !== "genre")
          .map((t: any) => t.attributes?.name?.en)
          .filter(Boolean);
        return { genres, tags };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== STEP 1: Fetching all series ===");
  const { data: allSeries, error: seriesError } = await supabase
    .from("series")
    .select("id, title, slug, type")
    .order("title");

  if (seriesError || !allSeries) {
    console.error("Failed to fetch series:", seriesError);
    process.exit(1);
  }

  console.log(`Found ${allSeries.length} series in database.`);

  console.log("\n=== STEP 2: Clearing existing series_tags & series_genres ===");
  const { error: delTagsErr } = await supabase
    .from("series_tags")
    .delete()
    .neq("series_id", "00000000-0000-0000-0000-000000000000");
  if (delTagsErr) console.error("Error clearing series_tags:", delTagsErr);
  else console.log("Cleared series_tags.");

  const { error: delGenresErr } = await supabase
    .from("series_genres")
    .delete()
    .neq("series_id", "00000000-0000-0000-0000-000000000000");
  if (delGenresErr) console.error("Error clearing series_genres:", delGenresErr);
  else console.log("Cleared series_genres.");

  console.log("\n=== STEP 3: Importing clean genres & tags from Comick ===");

  // Cache for genre and tag database IDs
  const genreIdMap = new Map<string, string>(); // name.toLowerCase() -> id
  const tagIdMap = new Map<string, string>(); // name.toLowerCase() -> id

  // Prepopulate existing genres & tags map
  const { data: existingGenres } = await supabase.from("genres").select("id, name");
  existingGenres?.forEach((g) => genreIdMap.set(g.name.toLowerCase().trim(), g.id));

  const { data: existingTags } = await supabase.from("tags").select("id, name");
  existingTags?.forEach((t) => tagIdMap.set(t.name.toLowerCase().trim(), t.id));

  async function getOrCreateGenreId(name: string): Promise<string | null> {
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (genreIdMap.has(key)) return genreIdMap.get(key)!;

    const genreSlug = slugify(clean);
    const { data: inserted, error } = await supabase
      .from("genres")
      .insert({ name: clean, slug: genreSlug })
      .select("id")
      .single();

    if (error || !inserted) {
      // Try to find if already inserted
      const { data: found } = await supabase
        .from("genres")
        .select("id")
        .eq("slug", genreSlug)
        .maybeSingle();
      if (found) {
        genreIdMap.set(key, found.id);
        return found.id;
      }
      return null;
    }

    genreIdMap.set(key, inserted.id);
    return inserted.id;
  }

  async function getOrCreateTagId(name: string): Promise<string | null> {
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (tagIdMap.has(key)) return tagIdMap.get(key)!;

    const tagSlug = slugify(clean);
    const { data: inserted, error } = await supabase
      .from("tags")
      .insert({ name: clean, slug: tagSlug })
      .select("id")
      .single();

    if (error || !inserted) {
      const { data: found } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", tagSlug)
        .maybeSingle();
      if (found) {
        tagIdMap.set(key, found.id);
        return found.id;
      }
      return null;
    }

    tagIdMap.set(key, inserted.id);
    return inserted.id;
  }

  let successCount = 0;

  for (let i = 0; i < allSeries.length; i++) {
    const s = allSeries[i];
    console.log(`[${i + 1}/${allSeries.length}] Fetching metadata for: "${s.title}"...`);

    const meta = await fetchMetadataForTitle(s.title);
    if (!meta || (meta.genres.length === 0 && meta.tags.length === 0)) {
      console.log(`  -> No Comick match, assigning default genre based on type.`);
      const defaultGenre = s.type === "novel" ? "Fantasy" : "Action";
      const gId = await getOrCreateGenreId(defaultGenre);
      if (gId) {
        await supabase
          .from("series_genres")
          .insert({ series_id: s.id, genre_id: gId });
      }
      await sleep(200);
      continue;
    }

    // Attach genres
    for (const gName of meta.genres) {
      const gId = await getOrCreateGenreId(gName);
      if (gId) {
        await supabase
          .from("series_genres")
          .upsert({ series_id: s.id, genre_id: gId }, { onConflict: "series_id,genre_id" });
      }
    }

    // Attach tags
    for (const tName of meta.tags) {
      const tId = await getOrCreateTagId(tName);
      if (tId) {
        await supabase
          .from("series_tags")
          .upsert({ series_id: s.id, tag_id: tId }, { onConflict: "series_id,tag_id" });
      }
    }

    console.log(
      `  -> Done: ${meta.genres.length} genres (${meta.genres.join(", ")}), ${meta.tags.length} tags`
    );
    successCount++;

    // Small delay to prevent rate limits
    await sleep(250);
  }

  console.log(`\nImport completed: ${successCount}/${allSeries.length} matched from Comick.`);

  console.log("\n=== STEP 4: Purging unused/junk genres and tags from database ===");

  // 1. Delete genres not in series_genres
  const { data: usedGenreIds } = await supabase
    .from("series_genres")
    .select("genre_id");
  const uniqueUsedGenreIds = Array.from(
    new Set((usedGenreIds || []).map((r) => r.genre_id))
  );

  console.log(`Active used genre IDs count: ${uniqueUsedGenreIds.length}`);

  // Fetch all genres
  const { data: allGenreRows } = await supabase.from("genres").select("id, name");
  const unusedGenres = (allGenreRows || []).filter(
    (g) => !uniqueUsedGenreIds.includes(g.id)
  );
  console.log(`Unused/junk genres to purge: ${unusedGenres.length}`);

  if (unusedGenres.length > 0) {
    const unusedIds = unusedGenres.map((g) => g.id);
    // Delete in chunks of 100
    for (let i = 0; i < unusedIds.length; i += 100) {
      const chunk = unusedIds.slice(i, i + 100);
      await supabase.from("genres").delete().in("id", chunk);
    }
    console.log("Purged unused genres from genres table.");
  }

  // 2. Delete tags not in series_tags
  const { data: usedTagIds } = await supabase
    .from("series_tags")
    .select("tag_id");
  const uniqueUsedTagIds = Array.from(
    new Set((usedTagIds || []).map((r) => r.tag_id))
  );

  console.log(`Active used tag IDs count: ${uniqueUsedTagIds.length}`);

  const { data: allTagRows } = await supabase.from("tags").select("id, name");
  const unusedTags = (allTagRows || []).filter(
    (t) => !uniqueUsedTagIds.includes(t.id)
  );
  console.log(`Unused tags to purge: ${unusedTags.length}`);

  if (unusedTags.length > 0) {
    const unusedIds = unusedTags.map((t) => t.id);
    for (let i = 0; i < unusedIds.length; i += 100) {
      const chunk = unusedIds.slice(i, i + 100);
      await supabase.from("tags").delete().in("id", chunk);
    }
    console.log("Purged unused tags from tags table.");
  }

  // Final check
  const { data: finalGenres } = await supabase
    .from("genres")
    .select("name")
    .order("name");
  console.log(
    `\nFinal clean genres count: ${finalGenres?.length ?? 0}`,
    finalGenres?.map((g) => g.name)
  );

  const { data: finalTags } = await supabase
    .from("tags")
    .select("name")
    .order("name");
  console.log(
    `Final clean tags count: ${finalTags?.length ?? 0}`,
    finalTags?.map((t) => t.name)
  );

  console.log("\n=== SYNC COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error);
