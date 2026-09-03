import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import {
  extractChaptersFromSeriesUrl,
  extractImagesFromChapterUrl,
  extractImagesFromChapterUrls,
  isPremiumOrLockedChapter,
} from '../src/lib/chapter-scraper';
import { buildChapterSlug } from '../src/lib/chapter-utils';
import { detectImportSource } from '../src/lib/import-source-utils';
import {
  detectSourceScanTiming,
  advanceNextReleaseAfterDrop,
} from '../src/lib/release-timing';

config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://edvqhmvqbtujzcfqkrbe.supabase.co';

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const maxChaptersPerSource = Number.parseInt(process.env.AUTO_IMPORT_MAX_CHAPTERS || '10', 10);

async function main() {
  const { data: sources, error } = await supabase
    .from('series_import_sources')
    .select('*')
    .eq('enabled', true)
    .order('last_checked_at', { ascending: true, nullsFirst: true });

  if (error) throw error;

  const now = Date.now();
  const dueSources = (sources ?? []).filter((source: any) => {
    // 1. If never checked, it is due
    if (!source.last_checked_at) return true;

    // 2. Scheduled scraping: Check if Estimated Next Release time has arrived (with 5 min grace)
    if (source.estimated_next_release_at) {
      const releaseTime = new Date(source.estimated_next_release_at).getTime();
      if (releaseTime <= now + 5 * 60 * 1000) {
        return true;
      }
    }

    // 3. Fallback interval
    const lastChecked = new Date(source.last_checked_at).getTime();
    const intervalMs = Number(source.check_interval_minutes || 120) * 60 * 1000;
    return now - lastChecked >= intervalMs;
  });

  console.log(`Auto import: ${dueSources.length} due source(s).`);

  for (const source of dueSources) {
    await syncSource(source);
  }
}

async function syncSource(source: any) {
  const startedAt = new Date().toISOString();
  const preset = detectImportSource(source.source_url);
  const scanlationGroup = source.scanlation_group || preset.scanlationGroup || null;
  let chaptersFound = 0;
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const details: Array<{ chapter: number; status: string; message?: string }> = [];

  try {
    console.log(`Checking ${source.source_site || preset.sourceSite}: ${source.source_url}`);
    const discovered = await extractChaptersFromSeriesUrl(source.source_url);
    chaptersFound = discovered.length;

    const { data: existingRows, error: existingError } = await supabase
      .from('chapters')
      .select('id,chapter_number,scanlation_group,chapter_type,chapter_pages(id)')
      .eq('series_id', source.series_id);
    if (existingError) throw existingError;

    // Clean up empty image chapters
    const emptyChapterIds = (existingRows ?? [])
      .filter((ch: any) => ch.chapter_type === 'image' && (!ch.chapter_pages || ch.chapter_pages.length === 0))
      .map((ch: any) => ch.id);

    if (emptyChapterIds.length > 0) {
      console.log(`[AutoImport] Cleaning up ${emptyChapterIds.length} empty chapter(s)...`);
      await supabase.from('chapters').delete().in('id', emptyChapterIds);
    }

    const activeRows = (existingRows ?? []).filter((ch: any) => !emptyChapterIds.includes(ch.id));

    const existingKeys = new Set(
      activeRows.map((chapter: any) =>
        chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
      ),
    );

    // Note: the old "<= maxChapterNumber" guard was removed because it dropped
    // legitimate decimal/re-published chapters. Exact duplicates are already
    // covered by existingKeys.
    const seenKeys = new Set<string>();
    const missing = discovered
      .filter((chapter) => {
        if (isPremiumOrLockedChapter(chapter)) {
          return false;
        }
        const key = chapterScanKey(chapter.chapterNumber, scanlationGroup);
        if (existingKeys.has(key) || seenKeys.has(key)) {
          return false;
        }
        seenKeys.add(key);
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .slice(0, maxChaptersPerSource);

    skipped = discovered.length - missing.length;
    const isAsuraSource = source.source_url.toLowerCase().includes('asura');
    const batchExtractedImages = await extractImagesFromChapterUrls(
      missing.map((chapter) => chapter.url),
      { concurrency: isAsuraSource ? 2 : 4, imageUrlExample: source.image_url_example },
    );

    for (const chapter of missing) {
      try {
        const images =
          batchExtractedImages.get(chapter.url) ??
          await extractImagesFromChapterUrl(chapter.url, {
            imageUrlExample: source.image_url_example,
          });
        if (images.length === 0) throw new Error('No images found');

        const slug = buildChapterSlug(chapter.chapterNumber, {
          title: chapter.title || null,
          scanlationGroup,
        });

        // Hold newly imported chapter with 30-minute unlock delay & direct source link
        const scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const { data: chapterRecord, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            series_id: source.series_id,
            chapter_number: chapter.chapterNumber,
            title: chapter.title || null,
            slug,
            chapter_type: 'image',
            status: 'published',
            scheduled_at: scheduledAt,
            source_url: chapter.url,
            uploaded_by: source.source_site || preset.sourceSite,
            scanlation_group: scanlationGroup,
          })
          .select('id')
          .single();
        if (chapterError) throw chapterError;

        const { error: pagesError } = await supabase.from('chapter_pages').insert(
          images.map((imageUrl, index) => ({
            chapter_id: chapterRecord.id,
            page_number: index + 1,
            image_url: imageUrl,
          })),
        );
        if (pagesError) throw pagesError;

        imported++;
        details.push({ chapter: chapter.chapterNumber, status: 'imported' });
        existingKeys.add(chapterScanKey(chapter.chapterNumber, scanlationGroup));
      } catch (error) {
        failed++;
        details.push({
          chapter: chapter.chapterNumber,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const status = failed > 0 && imported > 0 ? 'partial' : failed > 0 ? 'failed' : 'success';
    const message =
      imported > 0
        ? `Imported ${imported} new chapter${imported !== 1 ? 's' : ''}.`
        : 'No new chapters were imported.';

    await writeLog(source.id, status, message, chaptersFound, imported, skipped, failed, details);

    // Update release schedule & scan timing
    try {
      const { data: seriesRow } = await supabase
        .from('series')
        .select('title')
        .eq('id', source.series_id)
        .single();

      const timing = await detectSourceScanTiming({
        seriesTitle: seriesRow?.title || '',
        sourceUrl: source.source_url,
        currentMaxChapter: Math.max(0, ...activeRows.map((r: any) => Number(r.chapter_number) || 0)),
        localChapters: activeRows,
      });

      let nextEstimated = timing.estimatedNextRelease;
      if (imported > 0) {
        nextEstimated = advanceNextReleaseAfterDrop(timing.estimatedNextRelease, timing.cadence);
      }

      await supabase
        .from('series_import_sources')
        .update({
          last_checked_at: startedAt,
          last_success_at: imported > 0 || failed === 0 ? startedAt : source.last_success_at,
          last_error: failed > 0 && imported === 0 ? details.find((entry) => entry.status === 'failed')?.message : null,
          estimated_next_release_at: nextEstimated,
          release_cadence: timing.cadence,
          last_scanned_timing_at: startedAt,
        })
        .eq('id', source.id);

      if (source.series_id) {
        await supabase
          .from('series')
          .update({
            estimated_next_release_at: nextEstimated,
            release_cadence: timing.cadence,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.series_id);
      }
    } catch (timingErr) {
      console.warn('[AutoImport] Timing update error:', timingErr);
      await supabase
        .from('series_import_sources')
        .update({
          last_checked_at: startedAt,
          last_success_at: imported > 0 || failed === 0 ? startedAt : source.last_success_at,
          last_error: failed > 0 && imported === 0 ? details.find((entry) => entry.status === 'failed')?.message : null,
        })
        .eq('id', source.id);
    }

    console.log(`${message} Found ${chaptersFound}, failed ${failed}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auto import failed';
    await writeLog(source.id, 'failed', message, chaptersFound, imported, skipped, failed || 1, details);
    await supabase
      .from('series_import_sources')
      .update({ last_checked_at: startedAt, last_error: message })
      .eq('id', source.id);
    console.error(`Failed ${source.source_url}: ${message}`);
  }
}

async function writeLog(
  sourceId: string,
  status: string,
  message: string,
  chaptersFound: number,
  imported: number,
  skipped: number,
  failed: number,
  details: unknown,
) {
  await supabase.from('series_import_logs').insert({
    source_id: sourceId,
    status,
    message,
    chapters_found: chaptersFound,
    chapters_imported: imported,
    chapters_skipped: skipped,
    chapters_failed: failed,
    details,
  });
}

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${scanlationGroup?.trim() || ''}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
