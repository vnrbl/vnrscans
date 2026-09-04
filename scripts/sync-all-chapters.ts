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

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://edvqhmvqbtujzcfqkrbe.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_jVdWorDtLlkVYzRh6EbEOA_lwnu59an';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${scanlationGroup?.trim() || ''}`;
}

async function syncAllSeriesChapters() {
  console.log('🚀 Starting global series chapter sync...');
  console.log(`Connecting to: ${SUPABASE_URL}`);

  // 1. Fetch all series
  const { data: seriesList, error: seriesError } = await supabase
    .from('series')
    .select('id, title, slug')
    .order('title');

  if (seriesError) {
    console.error('❌ Failed to fetch series list:', seriesError.message);
    return;
  }

  console.log(`📚 Found ${seriesList?.length || 0} series in database.`);

  // 2. Fetch all enabled import sources
  const { data: importSources, error: sourcesError } = await supabase
    .from('series_import_sources')
    .select('*')
    .eq('enabled', true);

  if (sourcesError) {
    console.error('❌ Failed to fetch series import sources:', sourcesError.message);
    return;
  }

  const sourcesBySeries = new Map<string, any[]>();
  (importSources || []).forEach((source) => {
    const list = sourcesBySeries.get(source.series_id) || [];
    list.push(source);
    sourcesBySeries.set(source.series_id, list);
  });

  let totalNewChaptersImported = 0;
  let totalSeriesUpdated = 0;

  for (const series of seriesList || []) {
    const sources = sourcesBySeries.get(series.id);
    if (!sources || sources.length === 0) {
      console.log(`ℹ️ [${series.title}] No configured import sources found. Skipping.`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`🔄 Checking [${series.title}] (${sources.length} source(s))...`);

    // Fetch existing chapters
    const { data: existingChapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, chapter_number, scanlation_group, chapter_type, chapter_pages(id)')
      .eq('series_id', series.id);

    if (chaptersError) {
      console.error(`❌ Error fetching existing chapters for ${series.title}:`, chaptersError.message);
      continue;
    }

    const activeRows = (existingChapters || []).filter(
      (ch: any) => ch.chapter_type !== 'image' || (ch.chapter_pages && ch.chapter_pages.length > 0)
    );

    const maxChapterNumber = activeRows.reduce(
      (max, ch) => Math.max(max, Number(ch.chapter_number) || 0),
      0
    );

    console.log(`📊 Current max chapter in DB: ${maxChapterNumber} (Total existing: ${activeRows.length})`);

    let seriesImportedCount = 0;

    for (const source of sources) {
      try {
        console.log(`🌐 Scraping source: ${source.source_url}`);
        const discovered = await extractChaptersFromSeriesUrl(source.source_url);
        console.log(`🔍 Found ${discovered.length} total chapters at source.`);

        const preset = detectImportSource(source.source_url);
        const scanlationGroup = source.scanlation_group || preset.scanlationGroup || null;

        const existingKeys = new Set(
          activeRows.map((ch: any) =>
            chapterScanKey(Number(ch.chapter_number), ch.scanlation_group)
          )
        );

        // Find chapters after the highest existing chapter or missing from DB
        const seenKeys = new Set<string>();
        const newChapters = discovered
          .filter((ch) => {
            if (isPremiumOrLockedChapter(ch)) {
              return false;
            }
            const key = chapterScanKey(ch.chapterNumber, scanlationGroup);
            if (existingKeys.has(key) || seenKeys.has(key)) {
              return false;
            }
            seenKeys.add(key);
            return true;
          })
          .sort((a, b) => a.chapterNumber - b.chapterNumber);

        if (newChapters.length === 0) {
          console.log(`✅ [${series.title}] All chapters are up-to-date. No new chapters found.`);
          continue;
        }

        console.log(`⚡ Found ${newChapters.length} NEW chapter(s) to import: ${newChapters.map(c => `Ch.${c.chapterNumber}`).join(', ')}`);

        const isAsura = source.source_url.toLowerCase().includes('asura');
        const batchImages = await extractImagesFromChapterUrls(
          newChapters.map((c) => c.url),
          {
            concurrency: isAsura ? 4 : 8,
            imageUrlExample: source.image_url_example,
          }
        );

        for (const chapter of newChapters) {
          try {
            const images =
              batchImages.get(chapter.url) ??
              (await extractImagesFromChapterUrl(chapter.url, {
                imageUrlExample: source.image_url_example,
              }));

            if (!images || images.length === 0) {
              console.warn(`⚠️ No images extracted for Chapter ${chapter.chapterNumber}. Skipping.`);
              continue;
            }

            const slug = buildChapterSlug(chapter.chapterNumber, {
              title: chapter.title || null,
              scanlationGroup,
            });

            // Set 30-minute unlock delay and direct source link
            const scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

            const chapterPayload: any = {
              series_id: series.id,
              chapter_number: chapter.chapterNumber,
              title: chapter.title || null,
              slug,
              chapter_type: 'image',
              status: 'published',
              scheduled_at: scheduledAt,
              source_url: chapter.url,
              uploaded_by: source.source_site || preset.sourceSite,
              scanlation_group: scanlationGroup,
            };

            let { data: chapterRecord, error: insertError } = await supabase
              .from('chapters')
              .insert(chapterPayload)
              .select('id')
              .single();

            if (insertError && (insertError.code === '42703' || insertError.message?.includes('source_url'))) {
              delete chapterPayload.source_url;
              const retryRes = await supabase
                .from('chapters')
                .insert(chapterPayload)
                .select('id')
                .single();
              chapterRecord = retryRes.data;
              insertError = retryRes.error;
            }

            if (insertError || !chapterRecord) {
              console.error(`❌ Failed to insert chapter ${chapter.chapterNumber}:`, insertError?.message || 'Unknown insert error');
              continue;
            }

            const { error: pagesError } = await supabase.from('chapter_pages').insert(
              images.map((imgUrl, idx) => ({
                chapter_id: chapterRecord.id,
                page_number: idx + 1,
                image_url: imgUrl,
              }))
            );

            if (pagesError) {
              console.error(`❌ Failed to insert pages for chapter ${chapter.chapterNumber}:`, pagesError.message);
            } else {
              seriesImportedCount++;
              totalNewChaptersImported++;
              console.log(`✨ Imported Chapter ${chapter.chapterNumber} (held in 30-min unlock delay) with ${images.length} pages.`);
              existingKeys.add(chapterScanKey(chapter.chapterNumber, scanlationGroup));
            }
          } catch (chErr: any) {
            console.error(`❌ Error processing chapter ${chapter.chapterNumber}:`, chErr?.message || chErr);
          }
        }

        // Detect scan timing and update Estimated Next Release Time
        try {
          const timing = await detectSourceScanTiming({
            seriesTitle: series.title,
            sourceUrl: source.source_url,
            currentMaxChapter: maxChapterNumber,
            localChapters: activeRows,
          });

          let nextEstimated = timing.estimatedNextRelease;
          if (seriesImportedCount > 0) {
            nextEstimated = advanceNextReleaseAfterDrop(timing.estimatedNextRelease, timing.cadence);
          }

          await supabase
            .from('series_import_sources')
            .update({
              last_checked_at: new Date().toISOString(),
              last_success_at: seriesImportedCount > 0 ? new Date().toISOString() : source.last_success_at,
              estimated_next_release_at: nextEstimated,
              release_cadence: timing.cadence,
              last_scanned_timing_at: new Date().toISOString(),
            })
            .eq('id', source.id);

          await supabase
            .from('series')
            .update({
              estimated_next_release_at: nextEstimated,
              release_cadence: timing.cadence,
              updated_at: new Date().toISOString(),
            })
            .eq('id', series.id);

          console.log(`⏱️ [${series.title}] Next estimated release: ${nextEstimated} (${timing.cadence})`);
        } catch (timeErr) {
          console.warn(`⚠️ Failed to update release timing for ${series.title}:`, timeErr);
          await supabase
            .from('series_import_sources')
            .update({
              last_checked_at: new Date().toISOString(),
              last_success_at: seriesImportedCount > 0 ? new Date().toISOString() : source.last_success_at,
            })
            .eq('id', source.id);
        }

      } catch (srcErr: any) {
        console.error(`❌ Error scraping source ${source.source_url}:`, srcErr?.message || srcErr);
      }
    }

    if (seriesImportedCount > 0) {
      totalSeriesUpdated++;
      // Touch series updated_at
      await supabase
        .from('series')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', series.id);
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 Global Sync Finished!`);
  console.log(`📈 Summary: ${totalNewChaptersImported} new chapters imported across ${totalSeriesUpdated} series.`);
}

syncAllSeriesChapters().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
