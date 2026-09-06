const puppeteer = require('puppeteer');
const sharp = require('sharp');

async function solveCaptchaInBrowser(page) {
  console.log('Solving captcha directly inside the browser session...');

  // 1. Fetch /@waf/generate from inside the page context
  const data = await page.evaluate(async () => {
    const res = await fetch('/@waf/generate', { headers: { Accept: 'application/json' } });
    return await res.json();
  });

  console.log('Captcha ID:', data.captcha_id);

  // 2. Decode base64 images in Node and compute best angle
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

  console.log('Calculated Angle:', bestAngle);

  // 3. Submit verification from inside the browser context
  const verifyResult = await page.evaluate(async (payload) => {
    const res = await fetch('/@waf/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }, { captcha_id: data.captcha_id, angle: bestAngle });

  console.log('Browser verify result:', verifyResult);
  return verifyResult.success;
}

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  const capturedImages = [];
  page.on('response', (res) => {
    const u = res.url();
    if ((u.includes('wowpic') || u.includes('/i5/')) && !u.includes('avatar')) {
      if (!capturedImages.includes(u)) capturedImages.push(u);
    }
  });

  console.log('Navigating to chapter 30...');
  await page.goto('https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30', {
    waitUntil: 'networkidle2',
    timeout: 35000
  });

  console.log('Initial URL:', page.url());

  if (page.url().includes('@waf/challenge')) {
    const solved = await solveCaptchaInBrowser(page);
    console.log('Captcha solved:', solved);

    console.log('Navigating to return URL...');
    await page.goto('https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });
  }

  console.log('Final URL:', page.url());
  console.log('Page Title:', await page.title());

  // Progressive scroll
  console.log('Scrolling reader to capture all pages...');
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

  await new Promise((r) => setTimeout(r, 2000));

  const domImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.rpage-page__img, img[src*="wowpic"]'))
      .map((i) => i.src || i.currentSrc)
      .filter((s) => s && s.startsWith('http') && !s.includes('avatar'));
  });

  await browser.close();

  const all = Array.from(new Set([...capturedImages, ...domImages]));
  console.log('SUCCESS! Total pages extracted:', all.length);
  console.log('First 3 pages:', all.slice(0, 3));
  console.log('Last 3 pages:', all.slice(-3));
}

test().catch(console.error);
