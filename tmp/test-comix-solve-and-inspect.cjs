const puppeteer = require('puppeteer');
const sharp = require('sharp');

async function solveCaptcha(page) {
  console.log('Solving WAF captcha...');
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

    console.log(`Captcha verification result (angle ${bestAngle}):`, verifyResult);
    return verifyResult && verifyResult.success;
  } catch (e) {
    console.warn('Captcha solve error:', e.message);
    return false;
  }
}

async function run() {
  const url = 'https://comix.to/title/00-legend-of-the-northern-blade/494634-chapter-1';
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  const capturedImages = [];
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('wowpic') || u.includes('.store/i5') || u.includes('static.comix.to') || u.includes('comix.to/i5')) {
      if (!capturedImages.includes(u)) {
        capturedImages.push(u);
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    if (page.url().includes('@waf/challenge')) {
      const ok = await solveCaptcha(page);
      if (ok) {
        console.log('Navigating back to chapter after solve...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
      }
    }

    console.log('Chapter page URL:', page.url());

    // Let's inspect the page DOM and window objects
    const pageDetails = await page.evaluate(() => {
      // Find all state or config
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || s.src);
      const hasImagesInScripts = scripts.some(s => s && (s.includes('wowpic') || s.includes('images') || s.includes('pages')));
      
      // Look for Vue / Nuxt / Pinia / React state
      const winProps = Object.keys(window).filter(k => k.startsWith('__'));
      
      return {
        scriptsCount: scripts.length,
        hasImagesInScripts,
        winProps,
        readerElExists: !!document.querySelector('.rpage-page, .reader, [class*="reader"], [class*="rpage"]')
      };
    });
    console.log('Page details:', pageDetails);

    // Auto-scroll
    console.log('Scrolling reader to capture all pages...');
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let pos = 0;
        const step = 1200;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          pos += step;
          const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          if (pos >= maxScroll + 4000) {
            clearInterval(timer);
            resolve();
          }
        }, 80);
      });
    });

    await new Promise(r => setTimeout(r, 1500));

    console.log(`Total captured network images: ${capturedImages.length}`);
    if (capturedImages.length > 0) {
      console.log('First 3 images:', capturedImages.slice(0, 3));
      console.log('Last image:', capturedImages[capturedImages.length - 1]);
    }

    // Also check DOM elements for reader images
    const domUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img, [style*="background-image"]'));
      const urls = [];
      for (const el of imgs) {
        if (el.tagName === 'IMG') {
          const src = el.src || el.currentSrc || el.getAttribute('data-src') || el.getAttribute('data-original');
          if (src && (src.includes('wowpic') || src.includes('.store') || src.includes('static.comix.to'))) {
            urls.push(src);
          }
        }
      }
      return urls;
    });

    console.log(`DOM extracted images: ${domUrls.length}`);
    if (domUrls.length > 0) {
      console.log('First 3 DOM images:', domUrls.slice(0, 3));
    }
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}

run();
