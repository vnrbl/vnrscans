"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  extractChaptersFromSeriesUrl,
  extractImagesFromChapterUrl,
  extractImagesFromChapterUrls,
} from "../chapter-scraper";
import { buildChapterSlug } from "../chapter-utils";
import {
  detectImportSource,
  canonicalSourceSite,
  canonicalScanlationGroup,
  normalizeScanlationGroup,
  normalizeChapterNumber,
  chapterScanKey,
  isChapterAlreadyPresent,
} from "../import-source-utils";
import { discoverAsuraCatalog, isSupportedAsuraCatalogUrl } from "../site-import/asura";
import { discoverQiScansCatalog, isSupportedQiScansCatalogUrl } from "../site-import/qiscans";
import { discoverHivetoonCatalog, isSupportedHivetoonCatalogUrl } from "../site-import/hivetoons";
import { discoverElftoonCatalog, isSupportedElftoonCatalogUrl } from "../site-import/elftoon";
import { discoverVortexCatalog, isSupportedVortexCatalogUrl } from "../site-import/vortex";
import type { SiteSeriesMetadata } from "../site-import/types";

const IMPORT_BATCH_SIZE = 8;

export type SiteImportJobStatus =
  | "scanning"
  | "ready"
  | "importing"
  | "completed"
  | "partial"
  | "failed";

export type SiteImportItemStatus =
  | "ready"
  | "duplicate"
  | "queued"
  | "importing"
  | "completed"
  | "failed";

export type SiteImportMode = "metadata" | "latest" | "all";

export type SiteImportJob = {
  id: string;
  source_url: string;
  source_site: string;
  status: SiteImportJobStatus;
  total_items: number;
  selected_items: number;
  imported_items: number;
  failed_items: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteImportItem = {
  id: string;
  job_id: string;
  source_series_id: string | null;
  source_url: string;
  title: string;
  slug: string;
  cover_url: string | null;
  chapter_count: number;
  last_chapter_at: string | null;
  metadata: SiteSeriesMetadata;
  existing_series_id: string | null;
  selected: boolean;
  status: SiteImportItemStatus;
  import_mode: SiteImportMode;
  chapter_limit: number;
  auto_publish: boolean;
  imported_chapters: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteImportJobSnapshot = {
  job: SiteImportJob;
  items: SiteImportItem[];
};

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
  if (!url || !publishableKey) throw new Error("Missing Supabase public server credentials");

  const userClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(accessToken);
  if (error || !user) throw new Error("Unauthorized: please sign in again");

  const admin = getAdminSupabase();
  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (rolesError) throw rolesError;
  if (!(roles ?? []).some((entry: { role: string }) => entry.role === "admin")) {
    throw new Error("Forbidden: admin role required");
  }
  return user;
}

export async function $discoverSiteCatalog(args: {
  data: { siteUrl: string; accessToken: string };
}): Promise<{ success: boolean; snapshot?: SiteImportJobSnapshot; error?: string }> {
  try {
    const validated = z
      .object({ siteUrl: z.string().url(), accessToken: z.string().min(1) })
      .parse(args.data);
    const user = await verifyAdmin(validated.accessToken);
    const isAsura = isSupportedAsuraCatalogUrl(validated.siteUrl);
    const isQiScans = isSupportedQiScansCatalogUrl(validated.siteUrl);
    const isHivetoon = isSupportedHivetoonCatalogUrl(validated.siteUrl);
    const isElftoon = isSupportedElftoonCatalogUrl(validated.siteUrl);
    const isVortex = isSupportedVortexCatalogUrl(validated.siteUrl);

    if (!isAsura && !isQiScans && !isHivetoon && !isElftoon && !isVortex) {
      throw new Error("Currently supported sites: Asura Scans, Qi Scans, Hive Toons, Elf Toons, Thunder Scans, Scythe Scans, and Vortex Scans.");
    }

    const discovery = isAsura
      ? await discoverAsuraCatalog(validated.siteUrl)
      : isQiScans
      ? await discoverQiScansCatalog(validated.siteUrl)
      : isHivetoon
      ? await discoverHivetoonCatalog(validated.siteUrl)
      : isElftoon
      ? await discoverElftoonCatalog(validated.siteUrl)
      : await discoverVortexCatalog(validated.siteUrl);
    const admin = getAdminSupabase();
    const { data: job, error: jobError } = await admin
      .from("site_import_jobs")
      .insert({
        source_url: discovery.canonicalUrl,
        source_site: canonicalSourceSite(discovery.sourceSite),
        status: "scanning",
        created_by: user.id,
      })
      .select("*")
      .single();
    if (jobError || !job) throw jobError ?? new Error("Could not create catalog scan");

    try {
      const [
        { data: existingSources, error: sourcesError },
        { data: existingSeries, error: seriesError },
      ] = await Promise.all([
        admin.from("series_import_sources").select("series_id,source_url"),
        admin.from("series").select("id,title,slug,alternative_titles"),
      ]);
      if (sourcesError) throw sourcesError;
      if (seriesError) throw seriesError;

      const sourceMatches = new Map(
        (existingSources ?? []).map((entry: { series_id: string; source_url: string }) => [
          canonicalizeUrl(entry.source_url),
          entry.series_id,
        ]),
      );
      const seriesMatches = new Map<string, string>();
      for (const entry of existingSeries ?? []) {
        seriesMatches.set(normalizeMatchKey(entry.slug), entry.id);
        seriesMatches.set(normalizeMatchKey(entry.title), entry.id);
        for (const alternative of splitAlternativeTitles(entry.alternative_titles)) {
          seriesMatches.set(normalizeMatchKey(alternative), entry.id);
        }
      }

      const itemRows = discovery.series.map((series) => {
        const existingSeriesId =
          sourceMatches.get(canonicalizeUrl(series.sourceUrl)) ??
          seriesMatches.get(normalizeMatchKey(series.slug)) ??
          seriesMatches.get(normalizeMatchKey(series.title)) ??
          null;

        const sanitizedCoverUrl = series.coverUrl
          ? series.coverUrl.replace("meo.comick.pictures", "meo.comick.cc")
          : null;

        series.coverUrl = sanitizedCoverUrl;

        return {
          job_id: job.id,
          source_series_id: series.sourceId,
          source_url: series.sourceUrl,
          title: series.title,
          slug: series.slug,
          cover_url: sanitizedCoverUrl,
          chapter_count: series.chapterCount,
          last_chapter_at: series.lastChapterAt,
          metadata: series,
          existing_series_id: existingSeriesId,
          status: existingSeriesId ? "duplicate" : "ready",
        };
      });

      for (let index = 0; index < itemRows.length; index += 100) {
        const { error: itemsError } = await admin
          .from("site_import_items")
          .insert(itemRows.slice(index, index + 100));
        if (itemsError) throw itemsError;
      }

      const { error: readyError } = await admin
        .from("site_import_jobs")
        .update({ status: "ready", total_items: itemRows.length, error: null })
        .eq("id", job.id);
      if (readyError) throw readyError;

      return { success: true, snapshot: await getJobSnapshot(job.id) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Catalog scan failed";
      await admin
        .from("site_import_jobs")
        .update({ status: "failed", error: message })
        .eq("id", job.id);
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Catalog scan failed",
    };
  }
}

export async function $getSiteImportJob(args: {
  data: { jobId: string; accessToken: string };
}): Promise<{ success: boolean; snapshot?: SiteImportJobSnapshot; error?: string }> {
  try {
    const validated = z
      .object({ jobId: z.string().uuid(), accessToken: z.string().min(1) })
      .parse(args.data);
    await verifyAdmin(validated.accessToken);
    return { success: true, snapshot: await getJobSnapshot(validated.jobId) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Import job failed" };
  }
}

export async function $listSiteImportJobs(args: {
  data: { accessToken: string };
}): Promise<{ success: boolean; jobs?: SiteImportJob[]; error?: string }> {
  try {
    const validated = z.object({ accessToken: z.string().min(1) }).parse(args.data);
    await verifyAdmin(validated.accessToken);
    const { data, error } = await getAdminSupabase()
      .from("site_import_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { success: true, jobs: (data ?? []) as SiteImportJob[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Jobs could not load",
    };
  }
}

export async function $updateSiteImportItemMetadata(args: {
  data: {
    itemId: string;
    title: string;
    alternativeTitles: string[];
    description: string;
    coverUrl?: string | null;
    type: SiteSeriesMetadata["type"];
    status: SiteSeriesMetadata["status"];
    author?: string | null;
    artist?: string | null;
    genres: string[];
    accessToken: string;
  };
}): Promise<{ success: boolean; item?: SiteImportItem; error?: string }> {
  try {
    const validated = z
      .object({
        itemId: z.string().uuid(),
        title: z.string().trim().min(1).max(250),
        alternativeTitles: z.array(z.string().trim().min(1).max(250)).max(100),
        description: z.string().max(20_000),
        coverUrl: z.string().url().nullable().optional(),
        type: z.enum(["manga", "manhwa", "manhua", "novel"]),
        status: z.enum(["ongoing", "completed", "hiatus"]),
        author: z.string().trim().max(500).nullable().optional(),
        artist: z.string().trim().max(500).nullable().optional(),
        genres: z.array(z.string().trim().min(1).max(100)).max(100),
        accessToken: z.string().min(1),
      })
      .parse(args.data);
    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();
    const { data: current, error: currentError } = await admin
      .from("site_import_items")
      .select("metadata")
      .eq("id", validated.itemId)
      .single();
    if (currentError || !current) throw currentError ?? new Error("Catalog item not found");

    const metadata = current.metadata as SiteSeriesMetadata;
    const updatedMetadata: SiteSeriesMetadata = {
      ...metadata,
      title: validated.title,
      alternativeTitles: validated.alternativeTitles,
      description: validated.description,
      coverUrl: validated.coverUrl || null,
      type: validated.type,
      status: validated.status,
      author: validated.author?.trim() || null,
      artist: validated.artist?.trim() || null,
      genres: Array.from(new Set(validated.genres.map((genre) => genre.trim()).filter(Boolean))),
    };
    const item = await updateItem(admin, validated.itemId, {
      title: updatedMetadata.title,
      cover_url: updatedMetadata.coverUrl,
      metadata: updatedMetadata,
    });
    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Metadata update failed",
    };
  }
}

export async function $queueSiteCatalogItems(args: {
  data: {
    jobId: string;
    itemIds: string[];
    importMode: SiteImportMode;
    chapterLimit?: number;
    autoPublish: boolean;
    accessToken: string;
  };
}): Promise<{ success: boolean; snapshot?: SiteImportJobSnapshot; error?: string }> {
  try {
    const validated = z
      .object({
        jobId: z.string().uuid(),
        itemIds: z.array(z.string().uuid()).min(1).max(500),
        importMode: z.enum(["metadata", "latest", "all"]),
        chapterLimit: z.number().int().min(1).max(100).optional(),
        autoPublish: z.boolean(),
        accessToken: z.string().min(1),
      })
      .parse(args.data);
    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    const { error: resetQueueError } = await admin
      .from("site_import_items")
      .update({ status: "ready" })
      .eq("job_id", validated.jobId)
      .eq("selected", true)
      .in("status", ["queued", "importing"]);
    if (resetQueueError) throw resetQueueError;

    const { error: clearError } = await admin
      .from("site_import_items")
      .update({ selected: false })
      .eq("job_id", validated.jobId);
    if (clearError) throw clearError;

    const { data: queued, error: queueError } = await admin
      .from("site_import_items")
      .update({
        selected: true,
        status: "queued",
        import_mode: validated.importMode,
        chapter_limit: validated.chapterLimit ?? 5,
        auto_publish: validated.autoPublish,
        error: null,
      })
      .eq("job_id", validated.jobId)
      .in("id", validated.itemIds)
      .select("id");
    if (queueError) throw queueError;
    if ((queued ?? []).length !== validated.itemIds.length) {
      throw new Error("Some selected catalog items no longer belong to this scan.");
    }

    const { error: jobError } = await admin
      .from("site_import_jobs")
      .update({
        status: "importing",
        selected_items: validated.itemIds.length,
        imported_items: 0,
        failed_items: 0,
        error: null,
      })
      .eq("id", validated.jobId);
    if (jobError) throw jobError;

    return { success: true, snapshot: await getJobSnapshot(validated.jobId) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Queue failed" };
  }
}

export async function $retryFailedSiteImportItems(args: {
  data: { jobId: string; accessToken: string };
}): Promise<{ success: boolean; snapshot?: SiteImportJobSnapshot; error?: string }> {
  try {
    const validated = z
      .object({ jobId: z.string().uuid(), accessToken: z.string().min(1) })
      .parse(args.data);
    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();
    const { error } = await admin
      .from("site_import_items")
      .update({ status: "queued", error: null })
      .eq("job_id", validated.jobId)
      .eq("selected", true)
      .eq("status", "failed");
    if (error) throw error;
    await admin
      .from("site_import_jobs")
      .update({ status: "importing", error: null })
      .eq("id", validated.jobId);
    return { success: true, snapshot: await getJobSnapshot(validated.jobId) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Retry failed" };
  }
}

export async function $processNextSiteImportItem(args: {
  data: { jobId: string; accessToken: string };
}): Promise<{
  success: boolean;
  item?: SiteImportItem;
  job?: SiteImportJob;
  hasMore?: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validated = z
      .object({ jobId: z.string().uuid(), accessToken: z.string().min(1) })
      .parse(args.data);
    await verifyAdmin(validated.accessToken);
    const admin = getAdminSupabase();

    const { data: item, error: itemError } = await admin
      .from("site_import_items")
      .select("*")
      .eq("job_id", validated.jobId)
      .eq("selected", true)
      .in("status", ["queued", "importing"])
      .order("updated_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (itemError) throw itemError;
    if (!item) {
      const summary = await refreshJobSummary(validated.jobId);
      return {
        success: true,
        job: summary.job,
        hasMore: false,
        message: "No queued imports remain.",
      };
    }

    await admin
      .from("site_import_items")
      .update({ status: "importing", error: null })
      .eq("id", item.id);

    try {
      const metadata = item.metadata as SiteSeriesMetadata;
      const seriesId = await ensureSeriesAndSource(admin, item, metadata);

      if (item.import_mode === "metadata") {
        const completed = await updateItem(admin, item.id, {
          existing_series_id: seriesId,
          status: "completed",
          error: null,
        });
        const summary = await refreshJobSummary(validated.jobId);
        return {
          success: true,
          item: completed,
          job: summary.job,
          hasMore: summary.hasMore,
          message: `${item.title}: metadata imported.`,
        };
      }

      const chapters = (await extractChaptersFromSeriesUrl(item.source_url)).sort(
        (first, second) => second.chapterNumber - first.chapterNumber,
      );
      const eligible =
        item.import_mode === "latest" ? chapters.slice(0, item.chapter_limit) : chapters;
      const { data: existingChapters, error: existingError } = await admin
        .from("chapters")
        .select("chapter_number,scanlation_group")
        .eq("series_id", seriesId);
      if (existingError) throw existingError;

      const sourcePreset = detectImportSource(item.source_url);
      const scanlationGroup = canonicalScanlationGroup(sourcePreset.scanlationGroup || "Asura Scans");

      const existingChapterNumbers = new Set(
        (existingChapters ?? []).map((chapter: any) => normalizeChapterNumber(chapter.chapter_number)).filter((n) => !isNaN(n)),
      );
      const existingKeys = new Set(
        (existingChapters ?? []).map(
          (chapter: { chapter_number: number; scanlation_group: string | null }) =>
            chapterScanKey(chapter.chapter_number, chapter.scanlation_group),
        ),
      );
      const seenKeys = new Set<string>();
      const missing = eligible.filter((chapter) => {
        const num = normalizeChapterNumber(chapter.chapterNumber);
        if (isNaN(num)) return false;
        const key = chapterScanKey(num, scanlationGroup);
        if (
          isChapterAlreadyPresent(num, scanlationGroup, existingKeys, existingChapterNumbers) ||
          seenKeys.has(key)
        ) {
          return false;
        }
        seenKeys.add(key);
        return true;
      });

      if (missing.length === 0) {
        const completed = await updateItem(admin, item.id, {
          existing_series_id: seriesId,
          status: "completed",
          error: null,
        });
        const summary = await refreshJobSummary(validated.jobId);
        return {
          success: true,
          item: completed,
          job: summary.job,
          hasMore: summary.hasMore,
          message: `${item.title}: already up to date.`,
        };
      }

      const batch = missing.slice(0, IMPORT_BATCH_SIZE);
      const batchImages = await extractImagesFromChapterUrls(
        batch.map((chapter) => chapter.url),
        { concurrency: 6, imageUrlExample: sourcePreset.imageUrlExample },
      );
      let imported = 0;
      const failures: string[] = [];

      for (const chapter of batch) {
        try {
          const images =
            batchImages.get(chapter.url) ??
            (await extractImagesFromChapterUrl(chapter.url, {
              imageUrlExample: sourcePreset.imageUrlExample,
            }));
          if (images.length === 0) throw new Error("No reader images found");

          let finalSlug = buildChapterSlug(chapter.chapterNumber, {
            title: chapter.title || null,
            scanlationGroup,
          });

          const { data: existingSlugRow } = await admin
            .from("chapters")
            .select("id")
            .eq("series_id", seriesId)
            .eq("slug", finalSlug)
            .maybeSingle();

          if (existingSlugRow) {
            finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
          }

          const { data: chapterRow, error: chapterError } = await admin
            .from("chapters")
            .insert({
              series_id: seriesId,
              chapter_number: chapter.chapterNumber,
              title: chapter.title || null,
              slug: finalSlug,
              chapter_type: "image",
              status: item.auto_publish ? "published" : "draft",
              uploaded_by: "vnr610",
              scanlation_group: scanlationGroup,
            })
            .select("id")
            .single();
          if (chapterError || !chapterRow) throw chapterError ?? new Error("Chapter insert failed");

          const { error: pagesError } = await admin.from("chapter_pages").insert(
            images.map((imageUrl, index) => ({
              chapter_id: chapterRow.id,
              page_number: index + 1,
              image_url: imageUrl,
            })),
          );
          if (pagesError) {
            await admin.from("chapters").delete().eq("id", chapterRow.id);
            throw pagesError;
          }
          imported++;
        } catch (error) {
          failures.push(
            `Chapter ${chapter.chapterNumber}: ${error instanceof Error ? error.message : "unknown error"}`,
          );
        }
      }

      if (failures.length > 0) {
        const failed = await updateItem(admin, item.id, {
          existing_series_id: seriesId,
          status: "failed",
          imported_chapters: Number(item.imported_chapters || 0) + imported,
          error: failures.join(" | "),
        });
        const summary = await refreshJobSummary(validated.jobId);
        return {
          success: false,
          item: failed,
          job: summary.job,
          hasMore: summary.hasMore,
          error: failures.join(" | "),
        };
      }

      const remaining = Math.max(0, missing.length - imported);
      const updated = await updateItem(admin, item.id, {
        existing_series_id: seriesId,
        status: remaining > 0 ? "queued" : "completed",
        imported_chapters: Number(item.imported_chapters || 0) + imported,
        error: null,
      });
      const summary = await refreshJobSummary(validated.jobId);
      return {
        success: true,
        item: updated,
        job: summary.job,
        hasMore: summary.hasMore,
        message: `${item.title}: imported ${imported} chapter${imported === 1 ? "" : "s"}.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Series import failed";
      const failed = await updateItem(admin, item.id, { status: "failed", error: message });
      const summary = await refreshJobSummary(validated.jobId);
      return {
        success: false,
        item: failed,
        job: summary.job,
        hasMore: summary.hasMore,
        error: `${item.title}: ${message}`,
      };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Import failed" };
  }
}

async function ensureSeriesAndSource(
  admin: ReturnType<typeof getAdminSupabase>,
  item: SiteImportItem,
  metadata: SiteSeriesMetadata,
): Promise<string> {
  let seriesId = item.existing_series_id;

  if (!seriesId) {
    const { data: slugMatch, error: slugError } = await admin
      .from("series")
      .select("id")
      .eq("slug", metadata.slug)
      .maybeSingle();
    if (slugError) throw slugError;
    seriesId = slugMatch?.id ?? null;
  }

  const newCoverUrl = metadata.coverUrl
    ? metadata.coverUrl.replace("meo.comick.pictures", "meo.comick.cc")
    : null;

  let finalCoverUrl = newCoverUrl;

  if (seriesId) {
    // 1. Fetch the existing series cover_url
    const { data: existingSeries, error: fetchError } = await admin
      .from("series")
      .select("cover_url")
      .eq("id", seriesId)
      .maybeSingle();

    if (!fetchError && existingSeries && existingSeries.cover_url) {
      const oldCoverUrl = existingSeries.cover_url;

      // 1. If the incoming cover is different and not null, preserve the old cover in series_covers
      if (newCoverUrl && newCoverUrl !== oldCoverUrl) {
        try {
          // Check if old cover exists in series_covers
          const { data: oldCoverExists } = await admin
            .from("series_covers")
            .select("id")
            .eq("series_id", seriesId)
            .eq("image_url", oldCoverUrl)
            .maybeSingle();

          if (!oldCoverExists) {
            await admin.from("series_covers").insert({
              series_id: seriesId,
              image_url: oldCoverUrl,
              position: 1,
            });
          }

          // Check if new cover exists in series_covers
          const { data: newCoverExists } = await admin
            .from("series_covers")
            .select("id")
            .eq("series_id", seriesId)
            .eq("image_url", newCoverUrl)
            .maybeSingle();

          if (!newCoverExists) {
            await admin.from("series_covers").insert({
              series_id: seriesId,
              image_url: newCoverUrl,
              position: 0,
            });
          }

          // By default, use recent new cover as main cover
          finalCoverUrl = newCoverUrl;
        } catch (coverSaveError: any) {
          console.error(`Failed to save covers to series_covers: ${coverSaveError.message}`);
        }
      }
    }
  }

  const payload = {
    title: metadata.title,
    alternative_titles: metadata.alternativeTitles.join("\n") || null,
    description: metadata.description || null,
    cover_url: finalCoverUrl,
    type: metadata.type,
    status: metadata.status,
    author: metadata.author,
    artist: metadata.artist,
    updated_at: new Date().toISOString(),
  };

  if (seriesId) {
    const { error } = await admin.from("series").update(payload).eq("id", seriesId);
    if (error) throw error;
  } else {
    const { data: inserted, error } = await admin
      .from("series")
      .insert({ ...payload, slug: metadata.slug })
      .select("id")
      .single();
    if (error || !inserted) throw error ?? new Error("Series insert failed");
    seriesId = inserted.id;
  }

  for (const genreName of metadata.genres) {
    const genreSlug = slugify(genreName);
    if (!genreSlug) continue;
    const { data: genre, error: genreError } = await admin
      .from("genres")
      .upsert({ name: genreName, slug: genreSlug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (genreError || !genre) throw genreError ?? new Error("Genre insert failed");
    const { error: relationError } = await admin
      .from("series_genres")
      .upsert({ series_id: seriesId, genre_id: genre.id }, { onConflict: "series_id,genre_id" });
    if (relationError) throw relationError;
  }

  const { data: existingSource, error: sourceQueryError } = await admin
    .from("series_import_sources")
    .select("id")
    .eq("series_id", seriesId)
    .eq("source_url", item.source_url)
    .maybeSingle();
  if (sourceQueryError) throw sourceQueryError;

  const preset = detectImportSource(item.source_url);
  if (existingSource) {
    const { error } = await admin
      .from("series_import_sources")
      .update({ enabled: true, auto_publish: item.auto_publish })
      .eq("id", existingSource.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("series_import_sources").insert({
      series_id: seriesId,
      source_url: item.source_url,
      source_site: canonicalSourceSite(preset.sourceSite),
      scanlation_group: canonicalScanlationGroup(preset.scanlationGroup),
      image_url_example: preset.imageUrlExample,
      enabled: true,
      auto_publish: item.auto_publish,
      check_interval_minutes: 60,
    });
    if (error) throw error;
  }

  if (!seriesId) throw new Error("Series import did not produce a series ID");
  return seriesId;
}

async function getJobSnapshot(jobId: string): Promise<SiteImportJobSnapshot> {
  const admin = getAdminSupabase();
  const [{ data: job, error: jobError }, { data: items, error: itemsError }] = await Promise.all([
    admin.from("site_import_jobs").select("*").eq("id", jobId).single(),
    admin.from("site_import_items").select("*").eq("job_id", jobId).order("title"),
  ]);
  if (jobError || !job) throw jobError ?? new Error("Import job not found");
  if (itemsError) throw itemsError;
  return { job: job as SiteImportJob, items: (items ?? []) as SiteImportItem[] };
}

async function updateItem(
  admin: ReturnType<typeof getAdminSupabase>,
  itemId: string,
  values: Record<string, unknown>,
): Promise<SiteImportItem> {
  const { data, error } = await admin
    .from("site_import_items")
    .update(values)
    .eq("id", itemId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Import item update failed");
  return data as SiteImportItem;
}

async function refreshJobSummary(jobId: string): Promise<{ job: SiteImportJob; hasMore: boolean }> {
  const admin = getAdminSupabase();
  const { data: items, error } = await admin
    .from("site_import_items")
    .select("status")
    .eq("job_id", jobId)
    .eq("selected", true);
  if (error) throw error;

  const importedItems = (items ?? []).filter((item) => item.status === "completed").length;
  const failedItems = (items ?? []).filter((item) => item.status === "failed").length;
  const hasMore = (items ?? []).some(
    (item) => item.status === "queued" || item.status === "importing",
  );
  const status: SiteImportJobStatus = hasMore
    ? "importing"
    : failedItems > 0
      ? "partial"
      : "completed";
  const { data: job, error: jobError } = await admin
    .from("site_import_jobs")
    .update({
      status,
      imported_items: importedItems,
      failed_items: failedItems,
      error: failedItems > 0 ? `${failedItems} selected series need attention.` : null,
    })
    .eq("id", jobId)
    .select("*")
    .single();
  if (jobError || !job) throw jobError ?? new Error("Import job update failed");
  return { job: job as SiteImportJob, hasMore };
}

function canonicalizeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("hivetoon")) {
      parsed.hostname = "hivetoons.org";
    }
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

function splitAlternativeTitles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return String(value ?? "")
    .split(/[\n,|]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeMatchKey(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}



function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
