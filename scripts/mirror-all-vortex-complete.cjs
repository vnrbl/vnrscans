const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SERIES_ID = 'd2e29b86-05ee-4c52-89a6-8e11a2ad2ff6';
const SERIES_SLUG = '00-legend-of-the-northern-blade';
const SCAN_GROUP = 'Vortex Scans';
const UPLOADER = 'vnr610';

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function extractVortexChapterImages(chapterUrl) {
  const res = await fetch(chapterUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Vortex chapter fetch error: ${res.status}`);
  const html = await res.text();

  const readerImgMatches = [...html.matchAll(/<img[^>]+data-reader-page-image[^>]+>/gi)].map(m => m[0]);
  const pageUrls = [];
  for (const tag of readerImgMatches) {
    const srcMatch = tag.match(/src="([^"]+)"/i);
    if (srcMatch && srcMatch[1]) {
      const norm = srcMatch[1].replace(/storage\.vortexscans\.org\/+/i, 'storage.vortexscans.org/');
      if (!pageUrls.includes(norm)) pageUrls.push(norm);
    }
  }
  if (pageUrls.length > 0) return pageUrls;

  const storageMatches = [...html.matchAll(/https?:\/\/storage\.vortexscans\.org\/{1,2}upload\/series\/[^"'\s\\]+/gi)].map(m => m[0]);
  const filtered = storageMatches
    .map(u => u.replace(/storage\.vortexscans\.org\/+/i, 'storage.vortexscans.org/'))
    .filter(u => !u.includes('/featured/') && !u.includes('logo') && !u.includes('avatar') && !u.includes('banner'));
  return Array.from(new Set(filtered));
}

async function mirrorPage(rawUrl, seriesSlug, chapterSlug, pageNum) {
  if (rawUrl.includes('supabase.co/storage')) return rawUrl;
  try {
    const res = await fetch(rawUrl, {
      headers: {
        Referer: 'https://vortexscans.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return rawUrl;
    const contentType = res.headers.get('content-type') || 'image/webp';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp';
    const arrayBuffer = await res.arrayBuffer();
    const storagePath = `${seriesSlug}/${chapterSlug}/page-${String(pageNum).padStart(3, '0')}.${ext}`;

    const { error: upErr } = await supabase.storage.from('chapter-pages').upload(storagePath, Buffer.from(arrayBuffer), {
      contentType,
      upsert: true,
    });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('chapter-pages').getPublicUrl(storagePath);
      return publicUrl;
    }
  } catch (e) {
    console.warn(`Mirror failed for ${chapterSlug} p${pageNum}:`, e.message);
  }
  return rawUrl;
}

async function fixSingleChapter(ch, index, total) {
  const num = Number(ch.chapter_number);
  const targetSlug = `${SERIES_SLUG}-chapter-${num}-vortex-scans`;
  const chUrl = `https://vortexscans.org/series/the-legend-of-the-northern-blade/chapter-${num}`;

  try {
    const rawImages = await extractVortexChapterImages(chUrl);
    if (rawImages.length === 0) {
      console.warn(`[${index + 1}/${total}] Ch ${num}: No images found from Vortex Scans. Skipping.`);
      return false;
    }

    // Mirror images with concurrency 10
    const mirroredUrls = await mapConcurrent(rawImages, 10, async (imgUrl, idx) => {
      return await mirrorPage(imgUrl, SERIES_SLUG, targetSlug, idx + 1);
    });

    // Delete old pages and insert newly mirrored pages
    await supabase.from('chapter_pages').delete().eq('chapter_id', ch.id);

    const pageRows = mirroredUrls.map((url, idx) => ({
      chapter_id: ch.id,
      page_number: idx + 1,
      image_url: url,
    }));

    const { error: insErr } = await supabase.from('chapter_pages').insert(pageRows);
    if (insErr) {
      console.error(`[${index + 1}/${total}] Ch ${num} Page Insert Error:`, insErr.message);
      return false;
    }

    // Update uploaded_by
    await supabase
      .from('chapters')
      .update({ uploaded_by: UPLOADER, source_url: chUrl })
      .eq('id', ch.id);

    console.log(`[${index + 1}/${total}] Ch ${num} SUCCESS: ${pageRows.length} pages mirrored to Supabase storage!`);
    return true;
  } catch (err) {
    console.error(`[${index + 1}/${total}] Ch ${num} Error:`, err.message);
    return false;
  }
}

async function run() {
  console.log('=== Mirroring All Remaining Vortex Scans Chapters to Supabase Storage ===');
  
  const { data: dbChapters, error: dbErr } = await supabase
    .from('chapters')
    .select('id, chapter_number, slug, scanlation_group, uploaded_by, chapter_pages(id, image_url)')
    .eq('series_id', SERIES_ID)
    .eq('scanlation_group', SCAN_GROUP)
    .order('chapter_number', { ascending: true });

  if (dbErr) throw dbErr;

  // Find chapters needing mirror or having < 10 pages
  const toFix = dbChapters.filter(ch => {
    const pages = ch.chapter_pages || [];
    return pages.length < 10 || pages.some(p => !p.image_url.includes('supabase.co/storage'));
  });

  console.log(`Found ${toFix.length} chapters out of ${dbChapters.length} needing mirroring/completion.`);

  // Process 4 chapters concurrently
  let successCount = 0;
  await mapConcurrent(toFix, 4, async (ch, idx) => {
    const ok = await fixSingleChapter(ch, idx, toFix.length);
    if (ok) successCount++;
  });

  console.log('\n========================================');
  console.log(`Finished mirroring! Successfully updated ${successCount}/${toFix.length} chapters.`);
  console.log('========================================');
}

run().catch(console.error);
