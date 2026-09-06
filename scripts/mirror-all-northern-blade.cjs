const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const puppeteer = require('puppeteer');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function mirrorChapterDirect(ch, seriesSlug = 'legend-of-the-northern-blade') {
  console.log(`\n========================================`);
  console.log(`[Direct Mirror] Ch ${ch.chapter_number} (${ch.scanlation_group || 'Official'})... [${ch.slug}]`);

  const { data: pages } = await supabase
    .from('chapter_pages')
    .select('id, page_number, image_url')
    .eq('chapter_id', ch.id)
    .order('page_number');

  if (!pages || pages.length === 0) {
    console.warn(`No pages found for Ch ${ch.chapter_number}. Skipping direct mirror.`);
    return false;
  }

  const imageUrls = pages.map((p) => {
    let raw = p.image_url;
    if (raw.includes('/api/proxy/image?url=')) {
      raw = decodeURIComponent(raw.split('/api/proxy/image?url=')[1]);
    }
    return raw;
  });

  console.log(`Mirroring ${imageUrls.length} existing pages for Ch ${ch.chapter_number} directly to Supabase storage...`);

  const mirroredRows = await mapConcurrent(imageUrls, 8, async (rawUrl, idx) => {
    const pageNum = idx + 1;
    let finalUrl = rawUrl;

    if (rawUrl.includes('supabase.co/storage')) {
      return { chapter_id: ch.id, page_number: pageNum, image_url: rawUrl };
    }

    try {
      const res = await fetch(rawUrl, {
        headers: {
          Referer: 'https://comix.to/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/webp';
        const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const storagePath = `${seriesSlug}/${ch.slug}/page-${String(pageNum).padStart(3, '0')}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('chapter-pages')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('chapter-pages').getPublicUrl(storagePath);
          finalUrl = publicUrl;
        } else {
          console.warn(`Storage upload error p${pageNum}:`, upErr.message);
        }
      } else {
        console.warn(`Fetch returned ${res.status} for p${pageNum}:`, rawUrl.slice(0, 70));
      }
    } catch (e) {
      console.warn(`Page ${pageNum} error:`, e.message);
    }

    return {
      chapter_id: ch.id,
      page_number: pageNum,
      image_url: finalUrl,
    };
  });

  await supabase.from('chapter_pages').delete().eq('chapter_id', ch.id);
  await supabase.from('chapter_pages').insert(mirroredRows);
  await supabase.from('chapters').update({ uploaded_by: 'vnr610' }).eq('id', ch.id);

  console.log(`>>> Ch ${ch.chapter_number} (${ch.scanlation_group || 'Official'}) SUCCESS: ${mirroredRows.length} pages mirrored to Supabase storage!`);
  return true;
}

async function mirrorChapterPuppeteer(ch, browser, seriesSlug = 'legend-of-the-northern-blade') {
  console.log(`\n========================================`);
  console.log(`[Puppeteer Scrape & Mirror] Ch ${ch.chapter_number} (${ch.scanlation_group || 'Official'})... [${ch.slug}]`);

  if (!ch.source_url) {
    console.warn(`Ch ${ch.chapter_number} has no source_url. Skipping.`);
    return false;
  }

  let imageUrls = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    const networkImages = [];
    page.on('response', (res) => {
      const u = res.url();
      if ((u.includes('wowpic') || u.includes('/i5/') || u.includes('static.comix.to')) && !networkImages.includes(u)) {
        networkImages.push(u);
      }
    });

    await page.goto(ch.source_url, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForSelector('.rpage-page__img, .rpage-page', { timeout: 15000 }).catch(() => {});

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let currentPos = 0;
        const step = 900;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          currentPos += step;
          const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          if (currentPos >= maxScroll + 3500) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
    });

    await new Promise((r) => setTimeout(r, 1500));

    const domImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.rpage-page__img, img[src*="wowpic"], img[src*="static.comix.to"]'));
      return imgs.map((i) => i.src || i.currentSrc).filter((s) => s && s.startsWith('http') && !s.includes('avatar') && !s.includes('logo'));
    });

    await page.close();

    const merged = [];
    for (const img of networkImages) { if (!merged.includes(img)) merged.push(img); }
    for (const img of domImages) { if (!merged.includes(img)) merged.push(img); }

    if (merged.length > 0) {
      imageUrls = merged;
    }
  } catch (err) {
    console.warn(`Scrape warning for Ch ${ch.chapter_number}:`, err.message);
  }

  if (imageUrls.length === 0) {
    console.warn(`No images found via scrape for Ch ${ch.chapter_number}. Skipping.`);
    return false;
  }

  console.log(`Scraped ${imageUrls.length} pages. Mirroring Ch ${ch.chapter_number} to Supabase storage...`);

  const mirroredRows = await mapConcurrent(imageUrls, 8, async (rawUrl, idx) => {
    const pageNum = idx + 1;
    let finalUrl = rawUrl;

    if (rawUrl.includes('supabase.co/storage')) {
      return { chapter_id: ch.id, page_number: pageNum, image_url: rawUrl };
    }

    try {
      const res = await fetch(rawUrl, {
        headers: {
          Referer: 'https://comix.to/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/webp';
        const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const storagePath = `${seriesSlug}/${ch.slug}/page-${String(pageNum).padStart(3, '0')}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('chapter-pages')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('chapter-pages').getPublicUrl(storagePath);
          finalUrl = publicUrl;
        } else {
          console.warn(`Storage upload error p${pageNum}:`, upErr.message);
        }
      }
    } catch (e) {
      console.warn(`Page ${pageNum} error:`, e.message);
    }

    return {
      chapter_id: ch.id,
      page_number: pageNum,
      image_url: finalUrl,
    };
  });

  await supabase.from('chapter_pages').delete().eq('chapter_id', ch.id);
  await supabase.from('chapter_pages').insert(mirroredRows);
  await supabase.from('chapters').update({ uploaded_by: 'vnr610' }).eq('id', ch.id);

  console.log(`>>> Ch ${ch.chapter_number} (${ch.scanlation_group || 'Official'}) SUCCESS: ${mirroredRows.length} pages mirrored to Supabase storage!`);
  return true;
}

async function run() {
  console.log('Querying all Northern Blade chapters...');
  const { data: chs, error } = await supabase
    .from('chapters')
    .select('id, slug, chapter_number, scanlation_group, source_url, uploaded_by')
    .ilike('slug', '%northern-blade%')
    .order('chapter_number', { ascending: true });

  if (error || !chs) {
    console.error('Error querying chapters:', error);
    return;
  }

  console.log(`Total chapters found: ${chs.length}`);

  const directMirrorChapters = [];
  const puppeteerChapters = [];
  let alreadyComplete = 0;

  for (let i = 0; i < chs.length; i++) {
    const ch = chs[i];
    const { data: pages } = await supabase
      .from('chapter_pages')
      .select('image_url')
      .eq('chapter_id', ch.id);

    const count = pages ? pages.length : 0;
    const firstUrl = pages?.[0]?.image_url || '';
    const isMirrored = firstUrl.includes('supabase.co/storage');

    if (isMirrored && count > 5 && ch.uploaded_by === 'vnr610') {
      alreadyComplete++;
    } else if (count > 5) {
      directMirrorChapters.push(ch);
    } else {
      puppeteerChapters.push(ch);
    }
  }

  console.log(`Already complete on Supabase storage: ${alreadyComplete}`);
  console.log(`Need direct fast mirror (>5 pages in DB): ${directMirrorChapters.length}`);
  console.log(`Need Puppeteer full scrape (<=5 pages in DB): ${puppeteerChapters.length}`);

  // PHASE 1: Direct Mirror (Fast!)
  if (directMirrorChapters.length > 0) {
    console.log(`\n=== PHASE 1: Direct mirroring ${directMirrorChapters.length} chapters ===`);
    for (let i = 0; i < directMirrorChapters.length; i++) {
      const ch = directMirrorChapters[i];
      console.log(`[Phase 1: ${i + 1}/${directMirrorChapters.length}]`);
      try {
        await mirrorChapterDirect(ch);
      } catch (err) {
        console.error(`Error direct mirroring Ch ${ch.chapter_number}:`, err.message);
      }
    }
  }

  // PHASE 2: Puppeteer Scrape & Mirror
  if (puppeteerChapters.length > 0) {
    console.log(`\n=== PHASE 2: Puppeteer scraping & mirroring ${puppeteerChapters.length} chapters ===`);
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    });

    for (let i = 0; i < puppeteerChapters.length; i++) {
      const ch = puppeteerChapters[i];
      console.log(`[Phase 2: ${i + 1}/${puppeteerChapters.length}]`);
      try {
        await mirrorChapterPuppeteer(ch, browser);
      } catch (err) {
        console.error(`Error puppeteer mirroring Ch ${ch.chapter_number}:`, err.message);
      }
    }

    await browser.close();
  }

  // Final check: ensure all chapters have uploaded_by: 'vnr610'
  await supabase
    .from('chapters')
    .update({ uploaded_by: 'vnr610' })
    .ilike('slug', '%northern-blade%');

  console.log('\n======================================================');
  console.log('ALL Northern Blade chapters (Official and Vortex Scans)');
  console.log('have been successfully mirrored to Supabase Storage');
  console.log('and uploaded_by is set to "vnr610"!');
  console.log('======================================================');
}

run().catch(console.error);
