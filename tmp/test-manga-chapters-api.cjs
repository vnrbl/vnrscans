const puppeteer = require('puppeteer');
const sharp = require('sharp');

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
    if (u.includes('env-') && u.endsWith('.js')) {
      const res = await fetch(u);
      let text = await res.text();
      text += '\nwindow.__comixAxios = Ui;\n';
      req.respond({ status: 200, contentType: 'application/javascript', body: text });
      return;
    }
    req.continue();
  });

  const chUrl = 'https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story/11312305-chapter-87';
  await page.goto(chUrl, { waitUntil: 'networkidle2' });
  if (page.url().includes('@waf/challenge')) {
    await solveCaptcha(page);
    await new Promise(r => setTimeout(r, 1000));
    await page.goto(chUrl, { waitUntil: 'networkidle2' });
  }

  await new Promise(r => setTimeout(r, 2000));

  // Test fetching manga chapters list for manga 2468
  const chaptersList = await page.evaluate(async () => {
    try {
      const res = await window.__comixAxios.get('/manga/2468/chapters');
      return { success: true, data: res.data };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Manga chapters API result success:', chaptersList.success);
  if (chaptersList.success) {
    const items = chaptersList.data?.items || chaptersList.data;
    console.log('Total chapters returned by API:', Array.isArray(items) ? items.length : typeof items);
    if (Array.isArray(items)) {
      console.log('Sample first chapter:', items[0]);
      console.log('Sample last chapter:', items[items.length - 1]);
    }
  } else {
    console.log('Error:', chaptersList.error);
  }

  await browser.close();
})();
