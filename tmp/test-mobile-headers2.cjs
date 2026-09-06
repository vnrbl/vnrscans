const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000/home...');
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });

  // Now set the localStorage on the actual localhost:3000 origin!
  await page.evaluate(() => {
    localStorage.setItem('vnr_is_admin', 'true');
    localStorage.setItem('vnr_cached_user', JSON.stringify({
      id: '8a440e3d-b3d0-4103-a131-77c6d8572fa5',
      email: 'grindwithmt@gmail.com'
    }));
  });

  console.log('Reloading to test instant admin bottom nav with cached credentials...');
  await page.reload({ waitUntil: 'networkidle2' });

  // Check section h2 headers and their heights / bounding boxes
  const headers = await page.evaluate(() => {
    const h2Elements = Array.from(document.querySelectorAll('section h2'));
    return h2Elements.map(el => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        width: rect.width,
        height: rect.height,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        isSingleLine: rect.height <= 32
      };
    });
  });

  console.log('Section headers check:', JSON.stringify(headers, null, 2));

  // Check the bottom navbar items and + button
  const bottomNav = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return 'No bottom nav found';
    const btn = nav.querySelector('button[aria-label="Add New Series"]');
    return {
      hasPlusButton: !!btn,
      plusButtonClass: btn ? btn.className : null,
      links: Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim())
    };
  });

  console.log('Bottom nav check:', JSON.stringify(bottomNav, null, 2));

  await page.screenshot({ path: 'tmp/verified-mobile-headers2.png', fullPage: false });
  console.log('Saved screenshot to tmp/verified-mobile-headers2.png');

  await browser.close();
})();
