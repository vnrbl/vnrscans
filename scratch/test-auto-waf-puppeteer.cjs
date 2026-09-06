const puppeteer = require('puppeteer');
const sharp = require('sharp');

async function getWafPass() {
  const genRes = await fetch('https://comix.to/@waf/generate', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge'
    }
  });

  const data = await genRes.json();
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

  const verifyRes = await fetch('https://comix.to/@waf/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge'
    },
    body: JSON.stringify({ captcha_id: data.captcha_id, angle: bestAngle })
  });

  const vData = await verifyRes.json();
  if (!vData.success) {
    throw new Error('Verification failed with angle ' + bestAngle);
  }

  const cookies = verifyRes.headers.getSetCookie ? verifyRes.headers.getSetCookie() : [];
  const wafPassCookie = cookies.find((c) => c.startsWith('waf_pass='));
  return wafPassCookie ? wafPassCookie.split(';')[0].replace('waf_pass=', '') : '';
}

async function test() {
  console.log('Automatically generating and solving Comix WAF captcha...');
  const wafVal = await getWafPass();
  console.log('Obtained waf_pass:', wafVal);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'waf_pass',
    value: wafVal,
    domain: 'comix.to',
    path: '/',
    httpOnly: true,
    secure: true
  });

  const capturedImages = [];
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('wowpic') || u.includes('/i5/')) {
      if (!capturedImages.includes(u)) capturedImages.push(u);
    }
  });

  console.log('Navigating to Ch 30 with auto-injected cookie...');
  await page.goto('https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log('Final page title:', await page.title());
  console.log('Final page URL:', page.url());

  // Progressive scroll
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let currentPos = 0;
      const step = 900;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        currentPos += step;
        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (currentPos >= maxScroll + 3000) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  });

  await new Promise((r) => setTimeout(r, 2000));

  const domImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.rpage-page__img, img[src*="wowpic"]'))
      .map((i) => i.src || i.currentSrc)
      .filter((s) => s && s.startsWith('http') && !s.includes('avatar'));
  });

  await browser.close();

  const allImages = Array.from(new Set([...capturedImages, ...domImages]));
  console.log('Total pages extracted for Ch 30:', allImages.length);
  console.log('First 3 pages:', allImages.slice(0, 3));
  console.log('Last 3 pages:', allImages.slice(-3));
}

test().catch(console.error);
