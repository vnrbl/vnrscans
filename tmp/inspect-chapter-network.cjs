const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');

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

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  page.on('request', req => {
    const u = req.url();
    if (!u.includes('.css') && !u.includes('.woff') && !u.includes('google') && !u.includes('cloudflare')) {
      console.log(`[REQ] ${req.method()} ${u}`);
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('chapter') || u.includes('image') || u.includes('page') || u.includes('api') || u.includes('store') || u.includes('wowpic')) {
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('json') || ct.includes('text')) {
          const body = await res.text();
          console.log(`[RESP JSON/TEXT] ${u} => ${body.slice(0, 300)}`);
        } else {
          console.log(`[RESP MEDIA] ${u} (${ct}, ${res.status()})`);
        }
      } catch (e) {}
    }
  });

  const chapterUrl = 'https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story/9777916-chapter-0';
  await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
  if (page.url().includes('@waf/challenge')) {
    console.log('Solving captcha...');
    await solveCaptcha(page);
    await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
  }

  console.log('Landed on chapter. Waiting 3 seconds...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('Scrolling down to trigger next pages...');
  await page.evaluate(async () => {
    window.scrollBy(0, 2000);
    await new Promise(r => setTimeout(r, 500));
    window.scrollBy(0, 2000);
    await new Promise(r => setTimeout(r, 500));
    window.scrollBy(0, 5000);
  });

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
