import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type ChapterPage = {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
};

async function fetchAllChapterPages(chapterIds: string[]) {
  const allPages: ChapterPage[] = [];
  const batchSize = 1000;

  for (let from = 0; ; from += batchSize) {
    const { data, error } = await supabase
      .from('chapter_pages')
      .select('id, chapter_id, page_number, image_url')
      .in('chapter_id', chapterIds)
      .order('chapter_id', { ascending: true })
      .order('page_number', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error || !data) {
      throw new Error(error?.message || 'No data returned');
    }

    allPages.push(...data);

    if (data.length < batchSize) {
      return allPages;
    }
  }
}

async function cleanVillainPages() {
  console.log('🧹 --- Cleaning up I Am the Fated Villain Chapter Pages --- 🧹\n');

  const seriesSlug = 'i-am-the-fated-villain';
  console.log(`Finding series "${seriesSlug}"...`);
  const { data: series, error: seriesError } = await supabase
    .from('series')
    .select('id, title')
    .eq('slug', seriesSlug)
    .single();

  if (seriesError || !series) {
    console.error(`❌ Could not find series with slug "${seriesSlug}".`, seriesError?.message);
    process.exit(1);
  }

  console.log(`✅ Found series: "${series.title}" (ID: ${series.id})`);

  console.log('\nFetching chapters...');
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, chapter_number')
    .eq('series_id', series.id);

  if (chaptersError || !chapters) {
    console.error('❌ Failed to fetch chapters:', chaptersError?.message);
    process.exit(1);
  }

  console.log(`✅ Found ${chapters.length} chapters.`);
  const chapterIds = chapters.map(ch => ch.id);

  // Fetch all pages to inspect
  console.log('\nFetching all chapter pages...');
  const { data: pages, error: pagesError } = await supabase
    .from('chapter_pages')
    .select('id, chapter_id, page_number, image_url')
    .in('chapter_id', chapterIds);

  if (pagesError || !pages) {
    console.error('❌ Failed to fetch pages:', pagesError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${pages.length} total pages.`);

  // Keep only the known-good Asura CDN chapter image pattern for this series.
  const validImageUrlPattern =
    /^https:\/\/cdn\.asurascans\.com\/asura-images\/chapters\/i-am-the-fated-villain\/[^/]+\/[^/]+\.webp(?:[?#].*)?$/i;

  const pagesToDelete = pages.filter(p => {
    return !validImageUrlPattern.test(p.image_url.trim());
  });

  if (pagesToDelete.length === 0) {
    console.log('✅ No invalid pages found for this series.');
    return;
  }

  console.log(`\nFound ${pagesToDelete.length} invalid pages to delete.`);
  
  // Print a few sample deleted pages for validation
  console.log('Sample deleted URLs:');
  pagesToDelete.slice(0, 5).forEach(p => console.log(`  - Page ${p.page_number} (Ch ID: ${p.chapter_id}): ${p.image_url}`));

  // Perform deletion in batches of 100
  const affectedChapterIds = new Set<string>(pagesToDelete.map(p => p.chapter_id));
  const deleteIds = pagesToDelete.map(p => p.id);

  const BATCH_SIZE = 100;
  for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
    const batch = deleteIds.slice(i, i + BATCH_SIZE);
    const { error: deleteError } = await supabase
      .from('chapter_pages')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error('❌ Failed to delete batch of pages:', deleteError.message);
      process.exit(1);
    }
  }

  console.log(`✅ Successfully deleted ${pagesToDelete.length} page entries.`);

  console.log(`\nRe-indexing pages for ${affectedChapterIds.size} affected chapters...`);
  for (const chapterId of affectedChapterIds) {
    const ch = chapters.find(c => c.id === chapterId);
    const chNum = ch ? ch.chapter_number : 'unknown';

    // Fetch remaining pages sorted by page_number
    const { data: remainingPages, error: fetchPagesError } = await supabase
      .from('chapter_pages')
      .select('id, page_number')
      .eq('chapter_id', chapterId)
      .order('page_number', { ascending: true });

    if (fetchPagesError || !remainingPages) {
      console.error(`  ❌ Failed to fetch remaining pages for chapter ${chNum}:`, fetchPagesError?.message);
      continue;
    }

    const updates: { id: string; correctPageNum: number }[] = [];
    for (let idx = 0; idx < remainingPages.length; idx++) {
      const page = remainingPages[idx];
      const correctPageNum = idx + 1;
      
      if (page.page_number !== correctPageNum) {
        updates.push({ id: page.id, correctPageNum });
      }
    }

    if (updates.length > 0) {
      console.log(`  └─ Re-indexing chapter ${chNum}: ${updates.length} pages needing update`);
      let success = true;
      for (const update of updates) {
        const { error } = await supabase
          .from('chapter_pages')
          .update({ page_number: update.correctPageNum })
          .eq('id', update.id);
        if (error) {
          console.error(`     ❌ Failed to update page ID ${update.id} to page ${update.correctPageNum}:`, error.message);
          success = false;
          break;
        }
      }
      if (success) {
        console.log(`  ✅ Chapter ${chNum}: Re-indexed successfully.`);
      }
    }
  }

  console.log('\n🎉 --- Deletion and Re-indexing Finished --- 🎉');
}

cleanVillainPages().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
