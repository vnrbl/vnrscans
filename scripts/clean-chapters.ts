import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { buildChapterSlug } from '../src/lib/chapter-utils';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanup() {
  console.log('🧹 --- Database Scrape Cleanup Script --- 🧹\n');

  // Get series slug from command line arguments or default to i-am-the-fated-villain
  const seriesSlug = process.argv[2] || 'i-am-the-fated-villain';
  
  // Step 1: Find the series record for the given slug
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

  // Step 2: Fetch all chapters for this series
  console.log('\nFetching chapters...');
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, chapter_number, title, slug, scanlation_group')
    .eq('series_id', series.id);

  if (chaptersError || !chapters) {
    console.error('❌ Failed to fetch chapters:', chaptersError?.message);
    process.exit(1);
  }

  console.log(`✅ Found ${chapters.length} chapters.`);

  // Step 3: Clean up chapter titles
  console.log('\nChecking for relative time titles...');
  let updatedTitlesCount = 0;
  
  for (const ch of chapters) {
    if (ch.title) {
      const isRelativeTime = true; // Always reset titles to NULL to ensure clean chapter numbers and slugs

      if (isRelativeTime) {
        console.log(`  └─ Chapter ${ch.chapter_number}: Resetting title "${ch.title}" -> NULL`);
        const { error: updateError } = await supabase
          .from('chapters')
          .update({ title: null })
          .eq('id', ch.id);

        if (updateError) {
          console.error(`     ❌ Failed to update title for chapter ${ch.chapter_number}:`, updateError.message);
        } else {
          ch.title = null; // Update memory object for slug regeneration
          updatedTitlesCount++;
        }
      }
    }
  }
  console.log(`✅ Reset ${updatedTitlesCount} chapter titles.`);

  // Step 3b: Regenerate and update chapter slugs to remove date suffixes
  console.log('\nRegenerating and updating chapter slugs...');
  let updatedSlugsCount = 0;
  
  // Sort chapters to process deterministically
  chapters.sort((a, b) => a.chapter_number - b.chapter_number);
  const takenSlugs = new Set<string>();
  
  for (const ch of chapters) {
    let correctSlug = buildChapterSlug(ch.chapter_number, {
      title: ch.title,
      scanlationGroup: null,
    });

    // If this slug is already taken in this series, append the scanlation group to make it unique
    if (takenSlugs.has(correctSlug)) {
      correctSlug = buildChapterSlug(ch.chapter_number, {
        title: ch.title,
        scanlationGroup: ch.scanlation_group || null,
      });
    }

    takenSlugs.add(correctSlug);

    if (ch.slug !== correctSlug) {
      console.log(`  └─ Chapter ${ch.chapter_number}: Updating slug "${ch.slug}" -> "${correctSlug}"`);
      const { error: slugError } = await supabase
        .from('chapters')
        .update({ slug: correctSlug })
        .eq('id', ch.id);

      if (slugError) {
        console.error(`     ❌ Failed to update slug for chapter ${ch.chapter_number}:`, slugError.message);
      } else {
        ch.slug = correctSlug;
        updatedSlugsCount++;
      }
    } else {
      // Even if we didn't update it, record it as taken so other duplicates don't conflict
      takenSlugs.add(ch.slug);
    }
  }
  console.log(`✅ Updated ${updatedSlugsCount} chapter slugs.`);

  // Step 4: Delete the target cover image from all chapters of this series if applicable
  if (seriesSlug === 'i-am-the-fated-villain') {
    const targetCoverUrl = 'https://cdn.asurascans.com/asura-images/covers/i-am-the-fated-villain.e8d6b3-400.webp';
    console.log(`\nDeleting cover image entries (${targetCoverUrl}) from pages...`);

    const chapterIds = chapters.map(ch => ch.id);

    // Find matching pages
    const { data: pagesToDelete, error: selectPagesError } = await supabase
      .from('chapter_pages')
      .select('id, chapter_id')
      .in('chapter_id', chapterIds)
      .eq('image_url', targetCoverUrl);

    if (selectPagesError) {
      console.error('❌ Failed to select pages to delete:', selectPagesError.message);
      process.exit(1);
    }

    if (!pagesToDelete || pagesToDelete.length === 0) {
      console.log('✅ No cover image entries found to delete.');
    } else {
      console.log(`Found ${pagesToDelete.length} page entries to delete. Deleting...`);
      const { error: deleteError } = await supabase
        .from('chapter_pages')
        .delete()
        .in('id', pagesToDelete.map(p => p.id));

      if (deleteError) {
        console.error('❌ Failed to delete cover image entries:', deleteError.message);
        process.exit(1);
      }

      console.log(`✅ Deleted ${pagesToDelete.length} entries.`);
    }
  } else {
    console.log('\nSkipping cover image deletion step.');
  }

  // Step 5: Re-index remaining page numbers
  console.log('\nRe-indexing remaining page numbers for all chapters of the series...');
  const affectedChapterIds = chapters.map(ch => ch.id);

  const BATCH_SIZE = 20;
  for (let i = 0; i < affectedChapterIds.length; i += BATCH_SIZE) {
    const batch = affectedChapterIds.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(affectedChapterIds.length / BATCH_SIZE)}...`);

    await Promise.all(batch.map(async (chapterId) => {
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
        return;
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
            console.log(`  ✅ Chapter ${chNum}: Re-indexed ${updates.length} pages.`);
          }
        }
    }));
  }
  console.log('✅ Re-indexing complete.');

  console.log('\n🎉 --- Database Cleanup Finished --- 🎉');
}

runCleanup().catch((err) => {
  console.error('❌ Fatal error during cleanup:', err);
  process.exit(1);
});
