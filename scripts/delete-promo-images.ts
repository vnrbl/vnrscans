import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const blacklist = [
  'ebbb7aa3-e6a7-4e7a-8841-2de84d8026e9',
  'fecb6dc2-5e7f-4d5d-80e5-99c3e1c2bfd8',
  '26436e08-1b05-4c54-bd83-6dfeb75ea597',
  '1f823395-2e70-4437-8395-cb709812f899'
];

async function run() {
  try {
    console.log('Querying Supabase for pages matching blacklisted promo image hashes...');

    const filterString = blacklist.map(hash => `image_url.ilike.%${hash}%`).join(',');
    
    const { data: toDelete, error: fetchError } = await supabase
      .from('chapter_pages')
      .select('id, chapter_id, page_number, image_url')
      .or(filterString);

    if (fetchError) {
      throw fetchError;
    }

    if (!toDelete || toDelete.length === 0) {
      console.log('No blacklisted promo images found in the database.');
      return;
    }

    console.log(`Found ${toDelete.length} blacklisted page records to delete.`);

    // Get unique chapter IDs that will be affected
    const affectedChapterIds = Array.from(new Set(toDelete.map(p => p.chapter_id)));
    console.log(`Affected chapters: ${affectedChapterIds.length}`);

    // Delete blacklisted pages in batches of 100 to avoid PostgREST URL length limits
    const deleteIds = toDelete.map(p => p.id);
    const batchSize = 100;
    console.log(`Deleting ${deleteIds.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < deleteIds.length; i += batchSize) {
      const chunk = deleteIds.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('chapter_pages')
        .delete()
        .in('id', chunk);

      if (deleteError) {
        throw new Error(`Failed to delete batch starting at index ${i}: ${deleteError.message}`);
      }
      console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(deleteIds.length / batchSize)}`);
    }

    console.log('Successfully deleted blacklisted page records.');

    // Now re-sequence page numbers for each affected chapter
    console.log('Re-sequencing page numbers for affected chapters...');
    let successCount = 0;
    for (let index = 0; index < affectedChapterIds.length; index++) {
      const chapterId = affectedChapterIds[index];
      // Fetch remaining pages for this chapter
      const { data: remainingPages, error: getError } = await supabase
        .from('chapter_pages')
        .select('id, page_number')
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: true });

      if (getError) {
        console.error(`Failed to fetch pages for chapter ${chapterId}:`, getError.message);
        continue;
      }

      if (!remainingPages || remainingPages.length === 0) {
        console.log(`[${index + 1}/${affectedChapterIds.length}] Chapter ${chapterId} has no pages left.`);
        continue;
      }

      // Update sequentially starting from 1
      let updatedCount = 0;
      for (let i = 0; i < remainingPages.length; i++) {
        const newPageNum = i + 1;
        const page = remainingPages[i];
        if (page.page_number !== newPageNum) {
          const { error: updateError } = await supabase
            .from('chapter_pages')
            .update({ page_number: newPageNum })
            .eq('id', page.id);

          if (updateError) {
            console.error(`Failed to update page ID ${page.id} to page_number ${newPageNum}:`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }
      successCount++;
      if (index % 50 === 0 || index === affectedChapterIds.length - 1) {
        console.log(`[Progress] Processed ${index + 1}/${affectedChapterIds.length} chapters.`);
      }
    }

    console.log(`Cleanup and re-sequencing completed successfully! Cleaned ${successCount}/${affectedChapterIds.length} chapters.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

run();
