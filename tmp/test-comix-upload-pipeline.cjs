require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function solveCaptcha(page) {
  const data = await page.evaluate(async () => {
    const res = await fetch('/@waf/generate');
    return await res.json();
  });
  if (!data?.captcha_id) return false;
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
  await page.evaluate(async (payload) => {
    const res = await fetch('/@waf/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }, { captcha_id: data.captcha_id, angle: bestAngle });
  return true;
}

async function extractImages(page, chapterUrl) {
  const images = [];
  const onResponse = (res) => {
    const u = res.url();
    if (u.includes('wowpic') || u.includes('.store/i5') || u.includes('static.comix.to')) {
      if (!images.includes(u)) images.push(u);
    }
  };

  page.on('response', onResponse);

  await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
  if (page.url().includes('@waf/challenge')) {
    console.log('Solving captcha...');
    await solveCaptcha(page);
    await new Promise(r => setTimeout(r, 1000));
    await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
  }

  // Smooth progressive scroll
  await page.evaluate(async () => {
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, 1200);
      await new Promise(r => setTimeout(r, 120));
    }
  });

  await new Promise(r => setTimeout(r, 1500));
  page.off('response', onResponse);
  return images;
}

async function mirrorImagesToSupabase(images, seriesSlug, chapterSlug) {
  console.log(`Mirroring ${images.length} images for ${seriesSlug}/${chapterSlug}...`);
  const results = [];
  
  // High concurrency mirror
  const limit = 8;
  const queue = images.map((imgUrl, idx) => ({ imgUrl, pageNum: idx + 1 }));
  
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { imgUrl, pageNum } = item;
      try {
        const res = await fetch(imgUrl, {
          headers: {
            'Referer': 'https://comix.to/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(15_000)
        });

        if (!res.ok) {
          console.warn(`[Page ${pageNum}] Download failed: ${res.status}`);
          results.push({ pageNum, url: imgUrl });
          continue;
        }

        const contentType = res.headers.get('content-type') || 'image/webp';
        const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp';
        const buffer = Buffer.from(await res.arrayBuffer());
        const storagePath = `${seriesSlug}/${chapterSlug}/page-${String(pageNum).padStart(3, '0')}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('chapter-pages')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true
          });

        if (upErr) {
          console.warn(`[Page ${pageNum}] Upload failed:`, upErr.message);
          results.push({ pageNum, url: imgUrl });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('chapter-pages')
            .getPublicUrl(storagePath);
          results.push({ pageNum, url: publicUrl });
          console.log(`[Page ${pageNum}] Uploaded successfully! -> ${publicUrl.slice(0, 80)}...`);
        }
      } catch (err) {
        console.warn(`[Page ${pageNum}] Error:`, err.message);
        results.push({ pageNum, url: imgUrl });
      }
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  results.sort((a, b) => a.pageNum - b.pageNum);
  return results.map(r => r.url);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  // Intercept secure VM to patch anti-tamper
  await page.setRequestInterception(true);
  page.on('request', async req => {
    const u = req.url();
    if (u.includes('secure-') && u.endsWith('.js')) {
      const res = await fetch(u);
      let text = await res.text();
      text = text.replace('Ο_=void 0,O0={},T2=α$', 'Ο_=34,O0={},T2=α$');
      text = text.replace('case 8:Z_=!Ο_||T2&&F7?20:28;break;', 'case 8:Z_=28;break;');
      req.respond({ status: 200, contentType: 'application/javascript', body: text });
      return;
    }
    req.continue();
  });

  const testUrl = 'https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story/11312305-chapter-87';
  const startTime = Date.now();
  console.log('Extracting images from:', testUrl);
  const rawImages = await extractImages(page, testUrl);
  console.log(`Captured ${rawImages.length} raw images in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);

  const mirrorStartTime = Date.now();
  const mirroredUrls = await mirrorImagesToSupabase(rawImages, 'test-comix', 'chapter-87');
  console.log(`Mirrored ${mirroredUrls.length} images to Supabase Storage in ${((Date.now() - mirrorStartTime) / 1000).toFixed(1)}s!`);
  console.log('Sample public URL:', mirroredUrls[0]);

  // Test downloading the public URL directly with NO HEADERS
  const verifyRes = await fetch(mirroredUrls[0]);
  console.log('Verify public CDN access status:', verifyRes.status, verifyRes.headers.get('content-type'));

  await browser.close();
}

run().catch(console.error);
