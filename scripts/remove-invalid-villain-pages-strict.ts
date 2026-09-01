import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type Chapter = {
  id: string;
  chapter_number: number;
};

type ChapterPage = {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
};

const SERIES_SLUG = 'i-am-the-fated-villain';
const VALID_IMAGE_URL_PATTERN =
  /^https:\/\/cdn\.asurascans\.com\/asura-images\/chapters\/i-am-the-fated-villain\/[^/]+\/[^/]+\.webp(?:[?#].*)?$/i;

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
      throw new Error(error?.message || 'No chapter page data returned');
    }

    allPages.push(...data);

    if (data.length < batchSize) {
      return allPages;
    }
  }
}

async function reindexChapter(chapter: Chapter) {
  const { data: remainingPages, error } = await supabase
    .from('chapter_pages')
    .select('id, page_number')
    .eq('chapter_id', chapter.id)
    .order('page_number', { ascending: true });

  if (error || !remainingPages) {
    console.error(`Failed to fetch remaining pages for chapter ${chapter.chapter_number}:`, error?.message);
    return;
  }

  const updates = remainingPages
    .map((page, index) => ({ id: page.id, pageNumber: page.page_number, correctPageNumber: index + 1 }))
    .filter(page => page.pageNumber !== page.correctPageNumber);

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('chapter_pages')
      .update({ page_number: update.correctPageNumber })
      .eq('id', update.id);

    if (updateError) {
      console.error(
        `Failed to update chapter ${chapter.chapter_number} page ${update.id}:`,
        updateError.message,
      );
      return;
    }
  }

  if (updates.length > 0) {
    console.log(`Re-indexed chapter ${chapter.chapter_number}: ${updates.length} page numbers updated.`);
  }
}

async function removeInvalidVillainPages() {
  console.log(`Cleaning invalid page URLs for "${SERIES_SLUG}"...`);

  const { data: series, error: seriesError } = await supabase
    .from('series')
    .select('id, title')
    .eq('slug', SERIES_SLUG)
    .single();

  if (seriesError || !series) {
    throw new Error(`Could not find series "${SERIES_SLUG}": ${seriesError?.message || 'missing row'}`);
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, chapter_number')
    .eq('series_id', series.id);

  if (chaptersError || !chapters) {
    throw new Error(`Failed to fetch chapters: ${chaptersError?.message || 'missing rows'}`);
  }

  const chapterIds = chapters.map(chapter => chapter.id);
  const pages = await fetchAllChapterPages(chapterIds);
  const invalidPages = pages.filter(page => !VALID_IMAGE_URL_PATTERN.test(page.image_url.trim()));

  console.log(`Found ${chapters.length} chapters and ${pages.length} chapter pages.`);

  if (invalidPages.length === 0) {
    console.log('No invalid page URLs remain.');
    return;
  }

  console.log(`Deleting ${invalidPages.length} invalid page URLs.`);
  invalidPages.slice(0, 10).forEach(page => {
    console.log(`- Chapter ID ${page.chapter_id}, page ${page.page_number}: ${page.image_url}`);
  });

  const deleteBatchSize = 100;
  for (let index = 0; index < invalidPages.length; index += deleteBatchSize) {
    const batch = invalidPages.slice(index, index + deleteBatchSize).map(page => page.id);
    const { error } = await supabase.from('chapter_pages').delete().in('id', batch);

    if (error) {
      throw new Error(`Failed to delete invalid page batch: ${error.message}`);
    }
  }

  const affectedChapterIds = new Set(invalidPages.map(page => page.chapter_id));
  const affectedChapters = chapters.filter(chapter => affectedChapterIds.has(chapter.id));

  for (const chapter of affectedChapters) {
    await reindexChapter(chapter);
  }

  const remainingPages = await fetchAllChapterPages(chapterIds);
  const remainingInvalidCount = remainingPages.filter(
    page => !VALID_IMAGE_URL_PATTERN.test(page.image_url.trim()),
  ).length;

  console.log(`Deleted ${invalidPages.length} invalid page URLs.`);
  console.log(`Remaining invalid page URLs: ${remainingInvalidCount}.`);
}

removeInvalidVillainPages().catch(error => {
  console.error('Fatal cleanup error:', error);
  process.exit(1);
});
