const puppeteer = require('puppeteer');

async function testChapter() {
  // Let's test a sample chapter from comix.to
  // e.g. from Northern Blade on comix.to
  const url = 'https://comix.to/title/00-legend-of-the-northern-blade/494634-chapter-1';
  console.log('Testing Comix chapter reader on:', url);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  
  const apiRequests = [];
  const imageRequests = [];

  page.on('request', req => {
    const u = req.url();
    if (u.includes('/api/') || u.includes('/manga/') || u.includes('/chapter/')) {
      apiRequests.push({ url: u, method: req.method(), headers: req.headers() });
    }
  });

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('wowpic') || u.includes('comix.to/i5') || u.includes('static.comix.to') || u.includes('.store/i5')) {
      imageRequests.push(u);
    }
    if (u.includes('/api/') || u.includes('chapters') || u.includes('pages')) {
      try {
        const text = await res.text();
        console.log(`[API RESPONSE] ${u.slice(0, 100)} => ${text.slice(0, 200)}`);
      } catch (e) {}
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log('Page loaded, URL:', page.url());

    // Check if WAF captcha
    if (page.url().includes('@waf/challenge')) {
      console.log('Hit WAF challenge!');
    }

    // Inspect window / global variables in the browser
    const windowGlobals = await page.evaluate(() => {
      return {
        hasStore: typeof window.__pinia !== 'undefined' || typeof window.__INITIAL_STATE__ !== 'undefined',
        keys: Object.keys(window).filter(k => k.startsWith('__') || k.includes('comic') || k.includes('chapter') || k.includes('page')),
      };
    });
    console.log('Window globals:', windowGlobals);

    // Auto-scroll slowly down to bottom
    console.log('Auto-scrolling...');
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let pos = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 800);
          pos += 800;
          if (pos > Math.max(document.body.scrollHeight, 15000)) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('Total image network requests captured:', imageRequests.length);
    console.log('Sample image requests:', imageRequests.slice(0, 5));

    // Also check DOM images
    const domImages = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'));
      return allImgs.map(img => ({
        src: img.src,
        currentSrc: img.currentSrc,
        dataset: Object.assign({}, img.dataset),
        class: img.className
      })).filter(i => i.src && (i.src.includes('wowpic') || i.src.includes('.store') || i.src.includes('/i5/')));
    });
    console.log('DOM images matching pattern:', domImages.length);
    if (domImages.length > 0) {
      console.log('Sample DOM image:', domImages[0]);
    }
  } catch (err) {
    console.error('Error during test:', err.message);
  } finally {
    await browser.close();
  }
}

testChapter();
