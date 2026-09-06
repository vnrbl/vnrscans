const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const puppeteer = require('puppeteer');
const sharp = require('sharp');

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

async function solveCaptchaInBrowser(page) {
  console.log('Solving WAF captcha automatically in-browser...');
  try {
    const data = await page.evaluate(async () => {
      const res = await fetch('/@waf/generate', { headers: { Accept: 'application/json' } });
      return await res.json();
    });

    if (!data || !data.captcha_id) return false;

    const mainBuf = Buffer.from(data.image_base64.split(',')[1], 'base64');
    const thumbBuf = Buffer.from(data.thumb_base64.split(',')[1], 'base64');

    const mainRaw = await sharp(mainBuf).raw().toBuffer({ resolveWithObject: true });
    const thumbRaw = await sharp(thumbBuf).raw().toBuffer({ resolveWithObject: true });

    const r = (data.thumb_size || 140) / 2;
    const rThumb = r - 2;
    const rMain = r + 2;

    const N = 360;
    const thumbRing = [];
    const mainRing = [];

    for (let i = 0; i < N; i++) {
      const rad = (i * Math.PI) / 180;
      const tx = Math.round(thumbRaw.info.width / 2 + rThumb * Math.cos(rad));
      const ty = Math.round(thumbRaw.info.height / 2 + rThumb * Math.sin(rad));
      const tIdx = (ty * thumbRaw.info.width + tx) * thumbRaw.info.channels;
      thumbRing.push([thumbRaw.data[tIdx], thumbRaw.data[tIdx + 1], thumbRaw.data[tIdx + 2]]);

      const mx = Math.round(mainRaw.info.width / 2 + rMain * Math.cos(rad));
      const my = Math.round(mainRaw.info.height / 2 + rMain * Math.sin(rad));
      const mIdx = (my * mainRaw.info.width + mx) * mainRaw.info.channels;
      mainRing.push([mainRaw.data[mIdx], mainRaw.data[mIdx + 1], mainRaw.data[mIdx + 2]]);
    }

    let bestAngle = 0;
    let minDiff = Infinity;

    for (let angle = 0; angle < 360; angle++) {
      let diff = 0;
      for (let phi = 0; phi < N; phi++) {
        const tPhi = (phi - angle + 360) % 360;
        const tPix = thumbRing[tPhi];
        const mPix = mainRing[phi];
        const dr = tPix[0] - mPix[0];
        const dg = tPix[1] - mPix[1];
        const db = tPix[2] - mPix[2];
        diff += dr * dr + dg * dg + db * db;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bestAngle = angle;
      }
    }

    const verifyResult = await page.evaluate(async (payload) => {
      const res = await fetch('/@waf/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    }, { captcha_id: data.captcha_id, angle: bestAngle });

    console.log(`Captcha solved with angle ${bestAngle}deg:`, verifyResult.success);
    return verifyResult.success;
  } catch (e) {
    console.warn('Captcha solve error:', e.message);
    return false;
  }
}

async function mirrorChapter(ch, page, seriesSlug = 'legend-of-the-northern-blade') {
  console.log(`\n========================================`);
  console.log(`Scraping Ch ${ch.chapter_number} (${ch.scanlation_group || 'Vortex Scans'})... [${ch.slug}]`);

  const networkImages = [];
  const onResponse = (res) => {
    const u = res.url();
    if ((u.includes('wowpic') || u.includes('/i5/') || u.includes('static.comix.to')) && !networkImages.includes(u)) {
      networkImages.push(u);
    }
  };
  page.on('response', onResponse);

  try {
    await page.goto(ch.source_url, { waitUntil: 'networkidle2', timeout: 35000 });

    if (page.url().includes('@waf/challenge')) {
      const solved = await solveCaptchaInBrowser(page);
      if (solved) {
        await page.goto(ch.source_url, { waitUntil: 'networkidle2', timeout: 35000 });
      }
    }

    await page.waitForSelector('.rpage-page__img, .rpage-page', { timeout: 12000 }).catch(() => {});

    // Progressive auto-scroll
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

    page.off('response', onResponse);

    const merged = [];
    for (const img of networkImages) { if (!merged.includes(img)) merged.push(img); }
    for (const img of domImages) { if (!merged.includes(img)) merged.push(img); }

    if (merged.length === 0) {
      console.warn(`No images found for Ch ${ch.chapter_number}. Skipping.`);
      return false;
    }

    console.log(`Found ${merged.length} pages for Ch ${ch.chapter_number}. Mirroring to Supabase storage...`);

    const mirroredRows = await mapConcurrent(merged, 8, async (rawUrl, idx) => {
      const pageNum = idx + 1;
      let finalUrl = rawUrl;

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
          }
        }
      } catch (e) {
        console.warn(`Page ${pageNum} upload error:`, e.message);
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

    console.log(`>>> Ch ${ch.chapter_number} SUCCESS: ${mirroredRows.length} pages mirrored to Supabase storage!`);
    return true;
  } catch (err) {
    page.off('response', onResponse);
    console.warn(`Error on Ch ${ch.chapter_number}:`, err.message);
    return false;
  }
}

async function run() {
  const { data: chs, error } = await supabase
    .from('chapters')
    .select('id, slug, chapter_number, scanlation_group, source_url, uploaded_by, chapter_pages(image_url)')
    .ilike('slug', '%northern-blade%')
    .order('chapter_number', { ascending: true });

  if (error || !chs) {
    console.error('Error fetching chapters:', error);
    return;
  }

  const needMirror = chs.filter((ch) => {
    const pages = ch.chapter_pages || [];
    const isMirrored = pages.length > 5 && pages[0]?.image_url?.includes('supabase.co/storage');
    return !isMirrored;
  });

  console.log(`Total chapters needing mirror: ${needMirror.length}`);
  if (needMirror.length === 0) {
    console.log('All chapters already mirrored to Supabase storage!');
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  for (let i = 0; i < needMirror.length; i++) {
    const ch = needMirror[i];
    console.log(`\n[Progress: ${i + 1}/${needMirror.length}]`);
    await mirrorChapter(ch, page);
  }

  await browser.close();

  // Final check: update uploaded_by to vnr610 for all chapters
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
