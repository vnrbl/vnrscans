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

async function extractVortexChapters(seriesUrl) {
  const urlObj = new URL(seriesUrl);
  const res = await fetch(seriesUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Vortex series fetch error: ${res.status}`);
  const html = await res.text();
  const chapters = [];
  const seenSlugs = new Set();

  const regex = /&quot;id&quot;:\[0,(\d+)\],&quot;number&quot;:\[0,([0-9.]+)\],&quot;slug&quot;:\[0,&quot;([^&]+)&quot;\],(?:&quot;title&quot;:\[0,(?:&quot;([^&]+)&quot;|null)\],)?/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const num = parseFloat(m[2]);
    const slug = m[3];
    const rawTitle = m[4];
    const title = rawTitle && rawTitle !== 'null' ? rawTitle : undefined;
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chapters.push({
        chapterNumber: num,
        title,
        url: `${urlObj.origin}${urlObj.pathname.replace(/\/+$/, '')}/${slug}`,
      });
    }
  }

  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
}

async function extractVortexChapterImages(chapterUrl) {
  const res = await fetch(chapterUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

async function run() {
  console.log('=== Starting Vortex Scans Complete Mirror & Repair ===');
  
  // 1. Fetch current chapters in DB
  const { data: dbChapters, error: dbErr } = await supabase
    .from('chapters')
    .select('id, chapter_number, slug, scanlation_group, uploaded_by, chapter_pages(id, page_number, image_url)')
    .eq('series_id', SERIES_ID)
    .eq('scanlation_group', SCAN_GROUP);

  if (dbErr) throw dbErr;
  console.log(`Found ${dbChapters.length} existing "${SCAN_GROUP}" chapters in database.`);

  // 2. Discover all chapters from Vortex Scans
  console.log('Discovering chapters from vortexscans.org...');
  const vortexChapters = await extractVortexChapters('https://vortexscans.org/series/the-legend-of-the-northern-blade');
  console.log(`Discovered ${vortexChapters.length} chapters on Vortex Scans.`);

  // Map existing by chapter number
  const dbChapterMap = new Map();
  for (const ch of dbChapters) {
    dbChapterMap.set(Number(ch.chapter_number), ch);
  }

  let processedCount = 0;
  let fixedCount = 0;
  let newlyImportedCount = 0;

  for (const vCh of vortexChapters) {
    processedCount++;
    const num = vCh.chapterNumber;
    const existing = dbChapterMap.get(num);

    const needsFix = !existing || 
      !existing.chapter_pages || 
      existing.chapter_pages.length <= 1 || 
      existing.chapter_pages.some(p => p.image_url.includes('/featured/'));

    if (!needsFix) {
      // Chapter is already complete (> 1 real pages)
      continue;
    }

    console.log(`\n[${processedCount}/${vortexChapters.length}] Processing Ch ${num} (Needs fix/import)...`);
    
    // Extract pages from Vortex
    let rawImages = [];
    try {
      rawImages = await extractVortexChapterImages(vCh.url);
    } catch (err) {
      console.warn(`Failed to extract images for Ch ${num}:`, err.message);
      continue;
    }

    if (rawImages.length === 0) {
      console.warn(`No images found for Ch ${num}. Skipping.`);
      continue;
    }

    console.log(`Ch ${num}: Found ${rawImages.length} images. Mirroring to Supabase Storage...`);
    const targetSlug = `${SERIES_SLUG}-chapter-${num}-vortex-scans`;

    // Mirror images concurrently (8 at a time)
    const mirroredUrls = await mapConcurrent(rawImages, 8, async (imgUrl, idx) => {
      return await mirrorPage(imgUrl, SERIES_SLUG, targetSlug, idx + 1);
    });

    let chapterId = existing?.id;
    if (!chapterId) {
      // Insert chapter
      const { data: newCh, error: insErr } = await supabase
        .from('chapters')
        .insert({
          series_id: SERIES_ID,
          chapter_number: num,
          title: vCh.title || null,
          slug: targetSlug,
          chapter_type: 'image',
          status: 'published',
          source_url: vCh.url,
          uploaded_by: UPLOADER,
          scanlation_group: SCAN_GROUP,
        })
        .select('id')
        .single();

      if (insErr) {
        console.error(`Failed to insert chapter ${num}:`, insErr.message);
        continue;
      }
      chapterId = newCh.id;
      newlyImportedCount++;
    } else {
      // Update uploader if needed
      await supabase
        .from('chapters')
        .update({ uploaded_by: UPLOADER })
        .eq('id', chapterId);
      
      // Delete old/bad pages
      await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);
      fixedCount++;
    }

    // Insert mirrored pages
    const pageRows = mirroredUrls.map((url, idx) => ({
      chapter_id: chapterId,
      page_number: idx + 1,
      image_url: url,
    }));

    const { error: pageInsErr } = await supabase.from('chapter_pages').insert(pageRows);
    if (pageInsErr) {
      console.error(`Error inserting pages for Ch ${num}:`, pageInsErr.message);
    } else {
      console.log(`>>> Ch ${num} SUCCESS: ${pageRows.length} pages saved! (uploaded_by: ${UPLOADER})`);
    }
  }

  console.log('\n========================================');
  console.log(`Mirror & Repair Complete!`);
  console.log(`Chapters Fixed: ${fixedCount}`);
  console.log(`Newly Imported: ${newlyImportedCount}`);
  console.log('========================================');
}

run().catch(console.error);
