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

export interface ComickExtractedMetadata {
  title: string;
  slug: string;
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
}

/**
 * Fetch and parse comic metadata from comick.dev / comick APIs
 */
export async function fetchComickData(urlOrQuery: string): Promise<ComickExtractedMetadata | null> {
  const cleanInput = urlOrQuery.trim();
  if (!cleanInput) return null;

  let comickSlug = "";

  // 1. Check if input is a direct comick URL
  const urlMatch = cleanInput.match(/(?:comick\.(?:dev|io|app|fun|cc|ink))\/(?:comic|title)\/([^/?#]+)/i);
  if (urlMatch && urlMatch[1]) {
    comickSlug = urlMatch[1];
  } else if (!cleanInput.startsWith("http://") && !cleanInput.startsWith("https://") && /^[a-z0-9_-]+$/i.test(cleanInput)) {
    comickSlug = cleanInput;
  }

  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  // 2. If no slug extracted yet, search Comick API
  if (!comickSlug) {
    const searchEndpoints = [
      `https://api.comick.fun/v1.0/search?q=${encodeURIComponent(cleanInput)}&limit=5`,
      `https://api.comick.dev/v1.0/search?q=${encodeURIComponent(cleanInput)}&limit=5`,
      `https://api.comick.io/v1.0/search?q=${encodeURIComponent(cleanInput)}&limit=5`,
    ];

    for (const endpoint of searchEndpoints) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            "User-Agent": userAgent,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data) && data.length > 0) {
            comickSlug = data[0].hid || data[0].slug;
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }
  }

  // If still no slug, try using slugified input directly
  if (!comickSlug) {
    comickSlug = slugify(cleanInput);
  }

  // 3. Fetch comic detail JSON from API endpoints
  const detailEndpoints = [
    `https://api.comick.fun/comic/${comickSlug}`,
    `https://api.comick.dev/comic/${comickSlug}`,
    `https://api.comick.io/comic/${comickSlug}`,
  ];

  for (const endpoint of detailEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(7000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        const comic = json.comic || json;
        if (comic && (comic.title || comic.desc)) {
          return parseComickJsonObject(comic);
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  // 4. Fallback: Scrape comick.dev/comic/{slug} directly with Next.js __NEXT_DATA__
  try {
    const webUrls = [
      `https://comick.dev/comic/${comickSlug}`,
      `https://comick.io/comic/${comickSlug}`,
    ];

    for (const webUrl of webUrls) {
      const res = await fetch(webUrl, {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const html = await res.text();
        const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/i);

        if (nextDataMatch && nextDataMatch[1]) {
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            const comic = nextData?.props?.pageProps?.comic;
            if (comic) {
              return parseComickJsonObject(comic);
            }
          } catch {
            // Next data parse error
          }
        }

        // HTML RegExp extraction fallback
        const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").split("|")[0].trim() : "";

        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
        const description = descMatch ? descMatch[1].trim() : "";

        if (rawTitle || description) {
          return {
            title: rawTitle || cleanInput,
            slug: slugify(rawTitle || cleanInput),
            description: description || "",
            alternativeTitles: "",
            genres: [],
            tags: [],
          };
        }
      }
    }
  } catch (err) {
    console.warn("[ComickScrape] Fallback error:", err);
  }

  return null;
}

function parseComickJsonObject(comic: any): ComickExtractedMetadata {
  const title = comic.title || "";
  const description = (comic.desc || comic.parsed || comic.description || "")
    .replace(/\[\/?(b|i|u|s|color|spoiler)[^\]]*\]/gi, "")
    .trim();

  // Alternative titles
  const altTitles: string[] = [];
  if (Array.isArray(comic.md_titles)) {
    comic.md_titles.forEach((t: any) => {
      if (t?.title) altTitles.push(t.title);
    });
  } else if (Array.isArray(comic.alt_titles)) {
    comic.alt_titles.forEach((t: string) => altTitles.push(t));
  } else if (typeof comic.alt_titles === "string") {
    altTitles.push(comic.alt_titles);
  }

  // Genres & Tags
  const genres: string[] = [];
  const tags: string[] = [];

  if (Array.isArray(comic.md_comic_md_genres)) {
    comic.md_comic_md_genres.forEach((item: any) => {
      const g = item.md_genres || item;
      const name = g?.name?.trim();
      if (name) {
        if (g.type === "genre" || !g.type) {
          genres.push(name);
        } else {
          tags.push(name);
        }
      }
    });
  } else if (Array.isArray(comic.genres)) {
    comic.genres.forEach((g: any) => {
      const name = typeof g === "string" ? g : g?.name;
      if (name) genres.push(name.trim());
    });
  }

  // Demographic / Demographic tags
  if (comic.demographic) {
    tags.push(comic.demographic);
  }

  // Cover URL
  let coverUrl = "";
  if (comic.md_covers && Array.isArray(comic.md_covers) && comic.md_covers.length > 0) {
    const b2key = comic.md_covers[0].b2key;
    if (b2key) {
      coverUrl = `https://meo.comick.pictures/${b2key}`;
    }
  } else if (comic.cover_url) {
    coverUrl = comic.cover_url;
  }

  // Status mapping
  let status = "ongoing";
  if (comic.status === 2 || String(comic.status).toLowerCase().includes("completed")) {
    status = "completed";
  } else if (comic.status === 3 || String(comic.status).toLowerCase().includes("hiatus")) {
    status = "hiatus";
  }

  // Authors & Artists
  const authors: string[] = [];
  const artists: string[] = [];
  if (Array.isArray(comic.authors)) {
    comic.authors.forEach((a: any) => {
      const name = typeof a === "string" ? a : a?.name;
      if (name) authors.push(name);
    });
  }
  if (Array.isArray(comic.artists)) {
    comic.artists.forEach((a: any) => {
      const name = typeof a === "string" ? a : a?.name;
      if (name) artists.push(name);
    });
  }

  return {
    title,
    slug: comic.slug || slugify(title),
    description,
    alternativeTitles: altTitles.join(", "),
    genres: Array.from(new Set(genres)),
    tags: Array.from(new Set(tags)),
    status,
    releaseYear: comic.year ? parseInt(String(comic.year), 10) : undefined,
    coverUrl: coverUrl || undefined,
    author: authors.join(", ") || undefined,
    artist: artists.join(", ") || undefined,
  };
}

/**
 * Preview Comick Metadata without writing to DB
 */
export async function $previewComickMetadata(args: {
  data: {
    query: string;
    accessToken: string;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        query: z.string().min(1),
        accessToken: z.string().min(1),
      })
      .parse(data);

    await verifyAdmin(validated.accessToken);

    const metadata = await fetchComickData(validated.query);
    if (!metadata) {
      return {
        success: false,
        error: `Could not find comic on comick.dev for query: "${validated.query}". Try providing the exact Comick URL.`,
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

/**
 * Import Comick Metadata & Automatically Attach Genres, Tags, and Synopsis to a Series
 */
export async function $importComickMetadataToSeries(args: {
  data: {
    seriesId: string;
    query?: string;
    accessToken: string;
    importCover?: boolean;
    importSynopsis?: boolean;
    importGenresAndTags?: boolean;
    importAlternativeTitles?: boolean;
  };
}) {
  try {
    const { data } = args;
    const validated = z
      .object({
        seriesId: z.string().uuid(),
        query: z.string().optional(),
        accessToken: z.string().min(1),
        importCover: z.boolean().default(true),
        importSynopsis: z.boolean().default(true),
        importGenresAndTags: z.boolean().default(true),
        importAlternativeTitles: z.boolean().default(true),
      })
      .parse(data);

    const user = await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    // 1. Get the current series info
    const { data: series, error: seriesError } = await admin
      .from("series")
      .select("id, title, slug, description, cover_url, alternative_titles, status, release_year")
      .eq("id", validated.seriesId)
      .single();

    if (seriesError || !series) {
      throw new Error("Series not found in database");
    }

    const searchQuery = validated.query?.trim() || series.title;
    const metadata = await fetchComickData(searchQuery);

    if (!metadata) {
      return {
        success: false,
        error: `Could not find comic on comick.dev for "${searchQuery}". Please enter the direct comick.dev URL.`,
      };
    }

    // 2. Update Series Fields (Description, Alternative Titles, Year, Cover)
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.importSynopsis && metadata.description) {
      updatePayload.description = metadata.description;
    }

    if (validated.importAlternativeTitles && metadata.alternativeTitles) {
      updatePayload.alternative_titles = metadata.alternativeTitles;
    }

    if (metadata.releaseYear && !series.release_year) {
      updatePayload.release_year = metadata.releaseYear;
    }

    if (metadata.status && !series.status) {
      updatePayload.status = metadata.status;
    }

    if (validated.importCover && metadata.coverUrl) {
      updatePayload.cover_url = metadata.coverUrl;

      // Add to series_covers table if not exists
      const { data: existingCover } = await admin
        .from("series_covers")
        .select("id")
        .eq("series_id", series.id)
        .eq("image_url", metadata.coverUrl)
        .maybeSingle();

      if (!existingCover) {
        await admin.from("series_covers").insert({
          series_id: series.id,
          image_url: metadata.coverUrl,
          is_main: true,
        });
      }
    }

    const { error: updateError } = await admin
      .from("series")
      .update(updatePayload)
      .eq("id", series.id);

    if (updateError) throw updateError;

    // 3. Process & Attach Genres from comick.dev
    const attachedGenres: string[] = [];
    if (validated.importGenresAndTags && metadata.genres && metadata.genres.length > 0) {
      for (const genreName of metadata.genres) {
        const cleanName = genreName.trim();
        const genreSlug = slugify(cleanName);
        if (!cleanName || !genreSlug) continue;

        // Find or create genre
        let { data: genreRow } = await admin
          .from("genres")
          .select("id, name")
          .or(`slug.eq.${genreSlug},name.ilike.${cleanName}`)
          .maybeSingle();

        if (!genreRow) {
          const { data: newGenre, error: createGenreErr } = await admin
            .from("genres")
            .insert({ name: cleanName, slug: genreSlug })
            .select("id, name")
            .single();

          if (!createGenreErr && newGenre) {
            genreRow = newGenre;
          }
        }

        if (genreRow?.id) {
          // Link series_genres
          const { error: linkErr } = await admin.from("series_genres").upsert(
            { series_id: series.id, genre_id: genreRow.id },
            { onConflict: "series_id,genre_id", ignoreDuplicates: true }
          );
          if (!linkErr) {
            attachedGenres.push(genreRow.name);
          }
        }
      }
    }

    // 4. Process & Attach Tags from comick.dev
    const attachedTags: string[] = [];
    if (validated.importGenresAndTags && metadata.tags && metadata.tags.length > 0) {
      for (const tagName of metadata.tags) {
        const cleanName = tagName.trim();
        const tagSlug = slugify(cleanName);
        if (!cleanName || !tagSlug) continue;

        let { data: tagRow } = await admin
          .from("tags")
          .select("id, name")
          .or(`slug.eq.${tagSlug},name.ilike.${cleanName}`)
          .maybeSingle();

        if (!tagRow) {
          const { data: newTag, error: createTagErr } = await admin
            .from("tags")
            .insert({ name: cleanName, slug: tagSlug, color: "#8B5CF6" })
            .select("id, name")
            .single();

          if (!createTagErr && newTag) {
            tagRow = newTag;
          }
        }

        if (tagRow?.id) {
          await admin.from("series_tags").upsert(
            { series_id: series.id, tag_id: tagRow.id },
            { onConflict: "series_id,tag_id", ignoreDuplicates: true }
          );
          attachedTags.push(tagRow.name);
        }
      }
    }

    return {
      success: true,
      message: `Imported from Comick.dev: ${attachedGenres.length} genres, ${attachedTags.length} tags${metadata.description ? ", synopsis" : ""}${metadata.coverUrl ? ", cover" : ""}!`,
      metadata,
      attachedGenres,
      attachedTags,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import from comick.dev",
    };
  }
}
