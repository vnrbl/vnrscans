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

async function cleanBadUrls() {
  console.log('🧹 --- Cleaning up Specific Bad URLs in Fated Villain --- 🧹\n');

  const seriesSlug = 'i-am-the-fated-villain';
  const { data: series } = await supabase
    .from('series')
    .select('id, title')
    .eq('slug', seriesSlug)
    .single();

  if (!series) {
    console.error(`❌ Could not find series "${seriesSlug}"`);
    process.exit(1);
  }

  console.log(`Found series: "${series.title}"`);

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number')
    .eq('series_id', series.id);

  if (!chapters || chapters.length === 0) {
    console.log('No chapters found.');
    return;
  }

  const chapterIds = chapters.map(ch => ch.id);

  console.log('Querying for chapter pages with bad URLs...');
  const { data: badPages, error } = await supabase
    .from('chapter_pages')
    .select('id, chapter_id, page_number, image_url')
    .in('chapter_id', chapterIds)
    .like('image_url', '%asurascans.com/comics/%');

  if (error) {
    console.error('Error fetching pages:', error.message);
    process.exit(1);
  }

  if (!badPages || badPages.length === 0) {
    console.log('✅ No bad pages matching that URL pattern were found.');
    return;
  }

  console.log(`Found ${badPages.length} bad page entries to delete.`);
  
  const affectedChapterIds = new Set<string>(badPages.map(p => p.chapter_id));

  // Perform deletion
  const { error: deleteError } = await supabase
    .from('chapter_pages')
    .delete()
    .in('id', badPages.map(p => p.id));

  if (deleteError) {
    console.error('❌ Failed to delete bad pages:', deleteError.message);
    process.exit(1);
  }

  console.log(`✅ Deleted ${badPages.length} bad page entries.`);

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

cleanBadUrls().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
