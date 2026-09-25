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
import { isTelegramConfigured, sendTelegramMessage } from './telegram-notifier';

config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://edvqhmvqbtujzcfqkrbe.supabase.co';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) for the auto-import bot.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const maxChaptersPerSource = Number.parseInt(process.env.AUTO_IMPORT_MAX_CHAPTERS || '10', 10);
const isWatchMode = process.argv.includes('--watch') || process.argv.includes('--daemon');
const forceAll = process.argv.includes('--force') || process.argv.includes('--all');
const intervalMinutes = (() => {
  const argIdx = process.argv.findIndex((a) => a === '--interval' || a === '-i');
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    const val = Number.parseInt(process.argv[argIdx + 1], 10);
    if (Number.isFinite(val) && val > 0) return val;
  }
  const envVal = Number.parseInt(process.env.AUTO_IMPORT_INTERVAL_MINUTES || '', 10);
  if (Number.isFinite(envVal) && envVal > 0) return envVal;
  return 30; // Default: 30 minutes
})();

async function runCycle() {
  const cycleStart = new Date();
  console.log(`\n======================================================`);
  console.log(`[AutoImport] Starting scan cycle at ${cycleStart.toLocaleTimeString()}...`);

  try {
    const { data: sources, error } = await supabase
      .from('series_import_sources')
      .select('*, series:series(id, title, slug)')
      .eq('enabled', true)
      .order('last_checked_at', { ascending: true, nullsFirst: true });

    if (error) throw error;

    const now = Date.now();
    const dueSources = forceAll
      ? (sources ?? [])
      : (sources ?? []).filter((source: any) => {
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
          const intervalMs = Number(source.check_interval_minutes || intervalMinutes) * 60 * 1000;
          return now - lastChecked >= intervalMs;
        });

    console.log(`[AutoImport] Found ${sources?.length ?? 0} enabled source(s). ${dueSources.length} due for checking.`);

    for (let i = 0; i < dueSources.length; i++) {
      const source = dueSources[i];
      const seriesTitle = (source as any)?.series?.title || 'Unknown';
      console.log(`\n[${i + 1}/${dueSources.length}] Checking "${seriesTitle}": ${source.source_url}`);
      try {
        const result = await syncSource(source);
        if (result.failed > 0) {
          const failedChapters = result.details
            .filter((entry) => entry.status === 'failed')
            .map((entry) => `Ch. ${entry.chapter}: ${entry.message || 'failed'}`)
            .join('; ');
          await notifyTelegram(
            `${result.status === 'partial' ? '⚠️ PARTIAL SCRAPE' : '❌ SCRAPE FAILED'}\n` +
              `Series: ${seriesTitle}\nSource: ${source.source_url}\n` +
              `Imported: ${result.imported} | Failed: ${result.failed}\n` +
              `Error: ${result.error || failedChapters || 'One or more chapters failed.'}`,
          );
        } else if (result.imported > 0) {
          await notifyTelegram(
            `✅ CHAPTERS SCRAPED\nSeries: ${seriesTitle}\n` +
              `Imported: ${result.imported} chapter(s)\nSource: ${source.source_url}`,
          );
        }
      } catch (srcErr: any) {
        console.error(`[AutoImport] Error on source ${source.id}:`, srcErr.message || srcErr);
        await notifyTelegram(`❌ SCRAPE FAILED\nSeries: ${seriesTitle}\nSource: ${source.source_url}\nError: ${srcErr.message || srcErr}`);
      }
    }
  } catch (cycleErr: any) {
    console.error('[AutoImport] Cycle error:', cycleErr.message || cycleErr);
    await notifyTelegram(`❌ AUTO-SCRAPER CYCLE FAILED\nError: ${cycleErr.message || cycleErr}`);
  }

  const cycleEnd = new Date();
  const elapsedSec = Math.round((cycleEnd.getTime() - cycleStart.getTime()) / 1000);
  console.log(`\n[AutoImport] Cycle completed in ${elapsedSec}s.`);

  if (isWatchMode) {
    const nextCheck = new Date(Date.now() + intervalMinutes * 60 * 1000);
    console.log(`⏳ Next automated scan scheduled in ${intervalMinutes} minutes (at ${nextCheck.toLocaleTimeString()})...`);
    console.log(`Press Ctrl+C to stop daemon.`);
    setTimeout(runCycle, intervalMinutes * 60 * 1000);
  }
}

async function main() {
  if (process.argv.includes('--telegram-required') && !isTelegramConfigured()) {
    throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID before starting the Telegram scraper bot.');
  }
  if (isWatchMode) {
    await notifyTelegram(`🤖 VNR Scans auto-scraper is online. Checking enabled source scans every ${intervalMinutes} minutes.`);
    console.log(`🚀 Starting Auto-Import Daemon (continuous mode: every ${intervalMinutes} min)`);
  }
  await runCycle();
}

type SourceSyncResult = {
  status: 'success' | 'partial' | 'failed';
  imported: number;
  failed: number;
  chaptersFound: number;
  error?: string;
  details: Array<{ chapter: number; status: string; message?: string }>;
};

async function syncSource(source: any): Promise<SourceSyncResult> {
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
      .select('id,chapter_number,scanlation_group,chapter_type')
      .eq('series_id', source.series_id);
    if (existingError) throw existingError;

    const activeRows = existingRows ?? [];

    const existingChapterNumbers = new Set(
      activeRows.map((chapter: any) => Number(chapter.chapter_number)),
    );

    const seenNumbers = new Set<number>();
    const missingCandidates = discovered
      .filter((chapter) => {
        if (isPremiumOrLockedChapter(chapter)) {
          return false;
        }
        const num = Number(chapter.chapterNumber);
        // Skip if chapter number already exists in our database for this series
        if (isNaN(num) || existingChapterNumbers.has(num) || seenNumbers.has(num)) {
          return false;
        }
        seenNumbers.add(num);
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    // If more missing chapters than limit, take the LATEST ones (newest releases)
    const missing =
      missingCandidates.length > maxChaptersPerSource
        ? missingCandidates.slice(missingCandidates.length - maxChaptersPerSource)
        : missingCandidates;

    skipped = discovered.length - missing.length;

    if (missing.length === 0) {
      console.log(`[AutoImport] All ${discovered.length} chapters already exist in database.`);
      await writeLog(source.id, 'success', `Checked source: all ${discovered.length} chapters already in database.`, chaptersFound, 0, skipped, 0, details);
      await supabase
        .from('series_import_sources')
        .update({
          last_checked_at: startedAt,
          last_success_at: startedAt,
          last_error: null,
        })
        .eq('id', source.id);
      return { status: 'success', imported: 0, failed: 0, chaptersFound, details };
    }

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

        const chapterPayload: any = {
          series_id: source.series_id,
          chapter_number: chapter.chapterNumber,
          title: chapter.title || null,
          slug,
          chapter_type: 'image',
          status: 'published',
          scheduled_at: scheduledAt,
          source_url: chapter.url,
          uploaded_by: 'vnr610',
          scanlation_group: scanlationGroup,
        };

        let chapterRecord: any;
        const { data: insertedRecord, error: chapterError } = await supabase
          .from('chapters')
          .insert(chapterPayload)
          .select('id')
          .single();

        if (chapterError) {
          if (chapterError.code === '42703' || chapterError.message?.includes('source_url')) {
            delete chapterPayload.source_url;
            const { data: retryData, error: retryError } = await supabase
              .from('chapters')
              .insert(chapterPayload)
              .select('id')
              .single();
            if (retryError) throw retryError;
            chapterRecord = retryData;
          } else {
            throw chapterError;
          }
        } else {
          chapterRecord = insertedRecord;
        }

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
        const seriesUpdate: Record<string, any> = {
          estimated_next_release_at: nextEstimated,
          release_cadence: timing.cadence,
        };
        if (imported > 0) {
          seriesUpdate.updated_at = new Date().toISOString();
        }
        await supabase
          .from('series')
          .update(seriesUpdate)
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
    return { status, imported, failed, chaptersFound, details };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auto import failed';
    await writeLog(source.id, 'failed', message, chaptersFound, imported, skipped, failed || 1, details);
    await supabase
      .from('series_import_sources')
      .update({ last_checked_at: startedAt, last_error: message })
      .eq('id', source.id);
    console.error(`Failed ${source.source_url}: ${message}`);
    return { status: 'failed', imported, failed: failed || 1, chaptersFound, error: message, details };
  }
}

async function notifyTelegram(message: string) {
  try {
    await sendTelegramMessage(message.slice(0, 4000));
  } catch (error) {
    console.error('[Telegram] Could not send notification:', error instanceof Error ? error.message : error);
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
