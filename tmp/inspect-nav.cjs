const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });

  // In page context, let's inject a check on the Add Series button styling
  const result = await page.evaluate(() => {
    // Check if bottom nav exists
    const nav = document.querySelector('nav.fixed.bottom-0');
    return {
      navExists: !!nav,
      navClass: nav ? nav.className : null
    };
  });

  console.log('Result:', result);
  await browser.close();
})();
