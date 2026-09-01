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

const targetUrls = [
  'https://media.qiscans.org/file/qiscans/upload/2025/12/03/df4bcc3c-38c1-46ef-b104-6de55b4e668c.webp',
  'https://media.qimanhwa.com/file/qiscans/upload/2026/05/28/1779981371785-UD9xuT-df4bcc3c-38c1-46ef-b104-6de55b4e668c.webp'
];

async function removeImages() {
  console.log('🧹 --- Removing Crimson Reset Image Pages --- 🧹\n');

  const seriesSlug = 'crimson-reset';
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

  console.log(`\nChecking pages for target URLs...`);
  const { data: pagesToDelete, error: selectPagesError } = await supabase
    .from('chapter_pages')
    .select('id, chapter_id, page_number, image_url')
    .in('chapter_id', chapterIds)
    .in('image_url', targetUrls);

  if (selectPagesError) {
    console.error('❌ Failed to select pages to delete:', selectPagesError.message);
    process.exit(1);
  }

  if (!pagesToDelete || pagesToDelete.length === 0) {
    console.log('✅ No target image URLs found in crimson-reset chapter pages.');
    return;
  }

  console.log(`Found ${pagesToDelete.length} matching page entries to delete.`);
  
  // Track which chapters had pages deleted so we only reindex those
  const affectedChapterIds = new Set<string>(pagesToDelete.map(p => p.chapter_id));

  // Perform deletion
  const { error: deleteError } = await supabase
    .from('chapter_pages')
    .delete()
    .in('id', pagesToDelete.map(p => p.id));

  if (deleteError) {
    console.error('❌ Failed to delete matching pages:', deleteError.message);
    process.exit(1);
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
    } else {
      console.log(`  ✅ Chapter ${chNum}: No page numbering adjustments needed.`);
    }
  }

  console.log('\n🎉 --- Deletion and Re-indexing Finished --- 🎉');
}

removeImages().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
