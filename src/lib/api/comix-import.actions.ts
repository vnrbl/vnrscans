"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  extractChaptersFromSeriesUrl,
  extractImagesFromChapterUrl,
  extractComixChaptersWithGroups,
  type ChapterInfo,
  type ComixGroupInfo,
} from "@/lib/chapter-scraper";
import { resolveChapterImageUrl } from "@/lib/chapter-utils";

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

  const isAdmin = roles?.some(
    (r) =>
      r.role === "admin" ||
      r.role === "creator" ||
      r.role === "moderator" ||
      r.role === "uploader",
  );
  if (!isAdmin) throw new Error("Unauthorized: Admin or Uploader access required");

  // Fetch actual user profile username (e.g. vnr610)
  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();

  (user as any).username =
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.name ||
    "vnr610";

  return user as typeof user & { username: string };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface ComixExtractedMetadata {
  title: string;
  slug: string;
  alternativeTitles: string;
  description: string;
  genres: string[];
  tags: string[];
  status: "ongoing" | "completed" | "hiatus";
  releaseYear?: number;
  coverUrl?: string;
  author?: string;
  artist?: string;
  type: "manhwa" | "manga" | "manhua" | "novel";
  comixUrl: string;
  latestChapter?: number;
  rating?: string;
}

export interface ComixChapterItem {
  chapterNumber: number;
  title?: string;
  url: string;
  scanGroup?: string;
  time?: string;
}

export interface ComixGroupItem {
  id: number;
  name: string;
  slug?: string | null;
}

/**
 * Normalizes status string from Comix into database enum
 */
function normalizeStatus(statusRaw?: string): "ongoing" | "completed" | "hiatus" {
  const s = String(statusRaw || "").toLowerCase();
  if (s.includes("releasing") || s.includes("ongoing") || s.includes("publishing")) {
    return "ongoing";
  }
  if (s.includes("completed") || s.includes("finished") || s.includes("end")) {
    return "completed";
  }
  if (s.includes("hiatus") || s.includes("cancel") || s.includes("drop")) {
    return "hiatus";
  }
  return "ongoing";
}

/**
 * Normalizes series type into database enum
 */
function normalizeType(typeRaw?: string): "manhwa" | "manga" | "manhua" | "novel" {
  const t = String(typeRaw || "").toLowerCase();
  if (t.includes("manhua")) return "manhua";
  if (t.includes("manhwa") || t.includes("webtoon")) return "manhwa";
  if (t.includes("novel")) return "novel";
  return "manga";
}

/**
 * Parse comix series page HTML to extract initial-data JSON
 */
export async function parseComixPageHtml(html: string, pageUrl: string): Promise<ComixExtractedMetadata | null> {
  const match = html.match(/<script\s+type="application\/json"\s+id="initial-data">([\s\S]*?)<\/script>/);
  if (!match) return null;

  try {
    const json = JSON.parse(match[1]);
    const queries = json.queries || {};

    let detail: any = null;
    for (const key of Object.keys(queries)) {
      if (key.includes("detail")) {
        detail = queries[key];
        break;
      }
    }

    if (!detail) return null;

    const title = detail.title || "";
    const altTitles: string[] = Array.isArray(detail.altTitles) ? detail.altTitles : [];
    const description = (detail.synopsis || detail.synopsisHtml || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();

    const genres: string[] = Array.isArray(detail.genres)
      ? detail.genres.map((g: any) => g.title || g.name).filter(Boolean)
      : [];

    const tags: string[] = [];
    if (Array.isArray(detail.tags)) {
      tags.push(...detail.tags.map((t: any) => t.title || t.name).filter(Boolean));
    }
    if (Array.isArray(detail.demographics)) {
      tags.push(...detail.demographics.map((d: any) => d.title || d.name).filter(Boolean));
    }
    if (Array.isArray(detail.formats)) {
      tags.push(...detail.formats.map((f: any) => f.title || f.name).filter(Boolean));
    }

    const authors: string[] = Array.isArray(detail.authors)
      ? detail.authors.map((a: any) => a.title || a.name).filter(Boolean)
      : [];

    const artists: string[] = Array.isArray(detail.artists)
      ? detail.artists.map((a: any) => a.title || a.name).filter(Boolean)
      : [];

    const coverUrl = detail.poster?.large || detail.poster?.medium || undefined;
    const year = detail.year ? parseInt(String(detail.year), 10) : undefined;
    const rating = detail.ratedScore ? String(detail.ratedScore) : undefined;
    const latestChapter = detail.latestChapter ? Number(detail.latestChapter) : undefined;

    const slug = detail.url ? detail.url.replace(/^\/title\//, "") : slugify(title);
    const comixUrl = pageUrl.startsWith("http") ? pageUrl : `https://comix.to${detail.url || `/title/${slug}`}`;

    return {
      title,
      slug: slugify(title),
      alternativeTitles: altTitles.slice(0, 10).join(", "),
      description,
      genres: Array.from(new Set(genres)),
      tags: Array.from(new Set(tags)),
      status: normalizeStatus(detail.status),
      releaseYear: year,
      coverUrl,
      author: authors.join(", ") || undefined,
      artist: artists.join(", ") || undefined,
      type: normalizeType(detail.type),
      comixUrl,
      latestChapter,
      rating,
    };
  } catch (err) {
    console.error("[ComixImport] Failed to parse initial-data:", err);
    return null;
  }
}

/**
 * Fetch and extract metadata from a comix.to series page or search term
 */
export async function fetchComixMetadata(queryOrUrl: string): Promise<ComixExtractedMetadata | null> {
  const clean = queryOrUrl.trim();
  if (!clean) return null;

  let targetUrl = clean;
  if (!targetUrl.startsWith("http")) {
    if (targetUrl.startsWith("title/")) {
      targetUrl = `https://comix.to/${targetUrl}`;
    } else if (targetUrl.includes("/")) {
      targetUrl = `https://comix.to/title/${targetUrl}`;
    } else {
      // If it looks like a slug
      targetUrl = `https://comix.to/title/${slugify(targetUrl)}`;
    }
  }

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const html = await res.text();
      const meta = await parseComixPageHtml(html, targetUrl);
      if (meta) return meta;
    }
  } catch (err) {
    console.warn(`[ComixImport] Direct fetch failed for ${targetUrl}:`, err);
  }

  return null;
}

// ── SERVER ACTIONS ────────────────────────────────────────────────

const PreviewComixSchema = z.object({
  query: z.string().min(1, "Enter a Comix.to URL or series title"),
  accessToken: z.string().min(1),
});

/**
 * Search or preview metadata from Comix.to
 */
export async function $previewComixMetadata(args: {
  data: z.infer<typeof PreviewComixSchema>;
}) {
  try {
    const validated = PreviewComixSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const metadata = await fetchComixMetadata(validated.query);
    if (!metadata) {
      return {
        success: false,
        error: `Could not load series data from Comix.to for "${validated.query}". Please provide the direct comix.to/title/... URL.`,
      };
    }

    return {
      success: true,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load Comix.to metadata",
    };
  }
}

const ImportComixToSeriesSchema = z.object({
  seriesId: z.string().uuid("Invalid series ID"),
  query: z.string().optional(),
  accessToken: z.string().min(1),
  importCover: z.boolean().optional(),
  importSynopsis: z.boolean().optional(),
  importGenresAndTags: z.boolean().optional(),
  importAlternativeTitles: z.boolean().optional(),
  importStatusAndType: z.boolean().optional(),
  importAuthorAndArtist: z.boolean().optional(),
  overrideMetadata: z.any().optional(),
});

/**
 * Apply Comix.to metadata directly to a database series
 */
export async function $importComixMetadataToSeries(args: {
  data: z.infer<typeof ImportComixToSeriesSchema>;
}) {
  try {
    const validated = ImportComixToSeriesSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    const admin = getAdminSupabase();

    const { data: series, error: seriesError } = await admin
      .from("series")
      .select("id, title, description, cover_url, alternative_titles, slug, type, status, author, artist")
      .eq("id", validated.seriesId)
      .single();

    if (seriesError || !series) {
      throw new Error(`Series not found: ${validated.seriesId}`);
    }

    let metadata: ComixExtractedMetadata | null = validated.overrideMetadata || null;
    if (!metadata) {
      const q = validated.query?.trim() || series.title;
      metadata = await fetchComixMetadata(q);
    }

    if (!metadata) {
      return {
        success: false,
        error: `Could not retrieve Comix.to metadata for "${validated.query || series.title}".`,
      };
    }

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

      updatePayload.cover_url = newCoverUrl;
    }

    if (validated.importAlternativeTitles && metadata.alternativeTitles) {
      const existingAlt = series.alternative_titles
        ? series.alternative_titles.split(",").map((s: string) => s.trim())
        : [];
      const newAlt = metadata.alternativeTitles.split(",").map((s: string) => s.trim());
      const combinedAlt = Array.from(new Set([...existingAlt, ...newAlt])).filter(Boolean).join(", ");
      updatePayload.alternative_titles = combinedAlt;
    }

    if (validated.importStatusAndType) {
      if (metadata.status) updatePayload.status = metadata.status;
      if (metadata.type) updatePayload.type = metadata.type;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await admin
        .from("series")
        .update(updatePayload)
        .eq("id", validated.seriesId);

      if (updateError) {
        console.error("[ComixImport] Series update error:", updateError);
      }
    }

    // Process & Attach Genres
    const attachedGenres: string[] = [];
    if (validated.importGenresAndTags && metadata.genres && metadata.genres.length > 0) {
      const { data: existingGenres } = await admin.from("genres").select("id, name, slug");
      const genreIdMap = new Map<string, string>();
      existingGenres?.forEach((g) => {
        genreIdMap.set(g.name.toLowerCase().trim(), g.id);
        if (g.slug) genreIdMap.set(g.slug, g.id);
      });

      const genreIdsToLink: string[] = [];
      for (const genreName of metadata.genres) {
        const cleanName = genreName.trim();
        if (!cleanName) continue;
        const key = cleanName.toLowerCase();
        const gSlug = slugify(cleanName);

        let gId = genreIdMap.get(key) || genreIdMap.get(gSlug);
        if (!gId) {
          const { data: newGenre } = await admin
            .from("genres")
            .insert({ name: cleanName, slug: gSlug })
            .select("id")
            .single();
          if (newGenre?.id) {
            gId = String(newGenre.id);
            genreIdMap.set(key, gId);
          }
        }

        if (gId) {
          genreIdsToLink.push(gId);
          attachedGenres.push(cleanName);
        }
      }

      if (genreIdsToLink.length > 0) {
        await admin.from("series_genres").upsert(
          Array.from(new Set(genreIdsToLink)).map((genre_id) => ({
            series_id: validated.seriesId,
            genre_id,
          })),
          { onConflict: "series_id,genre_id" },
        );
      }
    }

    // Process & Attach Tags
    const attachedTags: string[] = [];
    if (validated.importGenresAndTags && metadata.tags && metadata.tags.length > 0) {
      const { data: existingTags } = await admin.from("tags").select("id, name, slug");
      const tagIdMap = new Map<string, string>();
      existingTags?.forEach((t) => {
        tagIdMap.set(t.name.toLowerCase().trim(), t.id);
        if (t.slug) tagIdMap.set(t.slug, t.id);
      });

      const tagIdsToLink: string[] = [];
      for (const tagName of metadata.tags) {
        const cleanName = tagName.trim();
        if (!cleanName) continue;
        const key = cleanName.toLowerCase();
        const tSlug = slugify(cleanName);

        let tId = tagIdMap.get(key) || tagIdMap.get(tSlug);
        if (!tId) {
          const { data: newTag } = await admin
            .from("tags")
            .insert({ name: cleanName, slug: tSlug })
            .select("id")
            .single();
          if (newTag?.id) {
            tId = String(newTag.id);
            tagIdMap.set(key, tId);
          }
        }

        if (tId) {
          tagIdsToLink.push(tId);
          attachedTags.push(cleanName);
        }
      }

      if (tagIdsToLink.length > 0) {
        await admin.from("series_tags").upsert(
          Array.from(new Set(tagIdsToLink)).map((tag_id) => ({
            series_id: validated.seriesId,
            tag_id,
          })),
          { onConflict: "series_id,tag_id" },
        );
      }
    }

    return {
      success: true,
      metadata,
      message: `Successfully imported from Comix.to: ${attachedGenres.length} genres, ${attachedTags.length} tags${metadata.description ? ", synopsis" : ""}${metadata.coverUrl ? ", cover" : ""}!`,
    };
  } catch (error) {
    console.error("[ComixImport] Critical error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import from Comix.to",
    };
  }
}

const FetchComixChaptersSchema = z.object({
  seriesUrl: z.string().min(1, "Series URL required"),
  groupId: z.union([z.number(), z.string()]).optional(),
  maxPages: z.number().optional(),
  accessToken: z.string().min(1),
});

/**
 * Discovers and lists chapters from a Comix.to series page with scan group breakdown
 */
export async function $fetchComixChaptersList(args: {
  data: z.infer<typeof FetchComixChaptersSchema>;
}) {
  try {
    const validated = FetchComixChaptersSchema.parse(args.data);
    await verifyAdmin(validated.accessToken);

    let url = validated.seriesUrl.trim();
    if (!url.startsWith("http")) {
      url = `https://comix.to/title/${url.replace(/^\/title\//, "")}`;
    }

    const { chapters, groups } = await extractComixChaptersWithGroups(url, {
      groupId: validated.groupId,
      maxPages: validated.maxPages,
    });

    return {
      success: true,
      chapters,
      groups,
      count: chapters.length,
    };
  } catch (error) {
    return {
      success: false,
      chapters: [],
      groups: [],
      count: 0,
      error: error instanceof Error ? error.message : "Failed to discover Comix.to chapters",
    };
  }
}

const ImportComixChaptersSchema = z.object({
  seriesId: z.string().uuid("Invalid series ID"),
  chapters: z.array(
    z.object({
      chapterNumber: z.number(),
      title: z.string().optional(),
      url: z.string(),
      scanGroup: z.string().optional(),
      time: z.string().optional(),
    }),
  ),
  scanlationGroup: z.string().default("Comix"),
  enableAutoSync: z.boolean().default(true),
  seriesUrl: z.string().optional(),
  accessToken: z.string().min(1),
});

/**
 * Imports chosen Comix.to chapters into the database with reader images
 */
export async function $importComixChaptersToSeries(args: {
  data: z.infer<typeof ImportComixChaptersSchema>;
}) {
  try {
    const validated = ImportComixChaptersSchema.parse(args.data);
    const adminUser = await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    const { data: series, error: seriesError } = await admin
      .from("series")
      .select("id, title, slug")
      .eq("id", validated.seriesId)
      .single();

    if (seriesError || !series) {
      throw new Error(`Series not found: ${validated.seriesId}`);
    }

    // If auto sync requested, upsert into series_import_sources
    if (validated.enableAutoSync && validated.seriesUrl) {
      await admin.from("series_import_sources").upsert(
        {
          series_id: validated.seriesId,
          source_site: "Comix.to",
          scanlation_group: validated.scanlationGroup || "Comix",
          source_url: validated.seriesUrl,
          is_active: true,
        },
        { onConflict: "series_id,source_url" },
      );
    }

    // Check existing chapters for this series
    const { data: existingChapters } = await admin
      .from("chapters")
      .select("id, chapter_number, scanlation_group")
      .eq("series_id", validated.seriesId);

    const existingSet = new Set(
      (existingChapters || []).map(
        (c) => `${Number(c.chapter_number)}_${(c.scanlation_group || "").toLowerCase()}`,
      ),
    );

    const toImport = validated.chapters.filter((c) => {
      const effGroup = (c.scanGroup || validated.scanlationGroup || "Comix").toLowerCase();
      const key = `${Number(c.chapterNumber)}_${effGroup}`;
      return !existingSet.has(key);
    });

    let importedCount = 0;
    const errors: string[] = [];

    for (const ch of toImport) {
      try {
        const images = await extractImagesFromChapterUrl(ch.url);
        if (images.length === 0) {
          errors.push(`Chapter ${ch.chapterNumber}: No images extracted`);
          continue;
        }

        const effectiveGroup = ch.scanGroup || validated.scanlationGroup || "Comix";
        let chapterSlug = `${series.slug}-chapter-${ch.chapterNumber}`;
        if (effectiveGroup && effectiveGroup.toLowerCase() !== "official" && effectiveGroup.toLowerCase() !== "comix") {
          chapterSlug = `${series.slug}-chapter-${ch.chapterNumber}-${slugify(effectiveGroup)}`;
        }

        let { data: chapterRow, error: chInsertError } = await admin
          .from("chapters")
          .insert({
            series_id: validated.seriesId,
            chapter_number: ch.chapterNumber,
            title: ch.title || `Chapter ${ch.chapterNumber}`,
            slug: chapterSlug,
            chapter_type: "image",
            status: "published",
            scanlation_group: effectiveGroup,
            source_url: ch.url,
            uploaded_by: adminUser.username || "vnr610",
          })
          .select("id")
          .single();

        if (chInsertError && (chInsertError.message?.includes("slug") || chInsertError.message?.includes("unique"))) {
          // Retry with unique hash appended
          chapterSlug = `${chapterSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await admin
            .from("chapters")
            .insert({
              series_id: validated.seriesId,
              chapter_number: ch.chapterNumber,
              title: ch.title || `Chapter ${ch.chapterNumber}`,
              slug: chapterSlug,
              chapter_type: "image",
              status: "published",
              scanlation_group: effectiveGroup,
              source_url: ch.url,
              uploaded_by: adminUser.username || "vnr610",
            })
            .select("id")
            .single();
          chapterRow = retry.data;
          chInsertError = retry.error;
        }

        if (chInsertError || !chapterRow) {
          errors.push(`Chapter ${ch.chapterNumber} DB insert failed: ${chInsertError?.message}`);
          continue;
        }

        // Parallel mirror images to Supabase storage to bypass hotlink 403 blocks
        const mirroredPages = await Promise.all(
          images.map(async (rawImgUrl, idx) => {
            const pageNum = idx + 1;
            let finalUrl = rawImgUrl;

            if (rawImgUrl.includes("wowpic") || rawImgUrl.includes("comix.to")) {
              try {
                const res = await fetch(rawImgUrl, {
                  headers: {
                    Referer: "https://comix.to/",
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                  },
                  signal: AbortSignal.timeout(12_000),
                });

                if (res.ok) {
                  const contentType = res.headers.get("content-type") || "image/webp";
                  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "webp";
                  const arrayBuffer = await res.arrayBuffer();
                  const storagePath = `${series.slug}/${chapterSlug}/page-${String(pageNum).padStart(3, "0")}.${ext}`;

                  const { error: upErr } = await admin.storage
                    .from("chapter-pages")
                    .upload(storagePath, Buffer.from(arrayBuffer), {
                      contentType,
                      upsert: true,
                    });

                  if (!upErr) {
                    const { data: { publicUrl } } = admin.storage
                      .from("chapter-pages")
                      .getPublicUrl(storagePath);
                    finalUrl = publicUrl;
                  }
                }
              } catch (mirrorErr) {
                console.warn(`[ComixImport] Storage mirror failed for page ${pageNum}:`, mirrorErr);
              }
            }

            return {
              chapter_id: chapterRow.id,
              page_number: pageNum,
              image_url: finalUrl,
            };
          }),
        );

        const { error: pagesError } = await admin
          .from("chapter_pages")
          .insert(mirroredPages);

        if (pagesError) {
          console.error(`[ComixImport] Error inserting pages for ch ${ch.chapterNumber}:`, pagesError);
        }

        importedCount++;
      } catch (chErr: any) {
        errors.push(`Chapter ${ch.chapterNumber} error: ${chErr.message}`);
      }
    }

    return {
      success: true,
      importedCount,
      totalRequested: validated.chapters.length,
      skippedCount: validated.chapters.length - toImport.length,
      errors: errors.slice(0, 10),
      message: `Successfully imported ${importedCount} chapter(s) from Comix.to!`,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      error: error instanceof Error ? error.message : "Failed to import chapters from Comix.to",
    };
  }
}
