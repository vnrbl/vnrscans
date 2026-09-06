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

  // Wait for the section h2 elements to mount
  try {
    await page.waitForSelector('section h2', { timeout: 8000 });
  } catch (e) {
    console.log('waitForSelector timed out:', e.message);
  }

  // Check section h2 headers and their heights / bounding boxes
  const headers = await page.evaluate(() => {
    const h2Elements = Array.from(document.querySelectorAll('section h2'));
    return h2Elements.map(el => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      // Also check if any standalone View All button exists in the same parent header row
      const parentRow = el.closest('.flex.items-center.justify-between');
      const buttons = parentRow ? Array.from(parentRow.querySelectorAll('button')).map(b => b.textContent.trim()) : [];
      return {
        text: el.textContent.trim(),
        width: rect.width,
        height: rect.height,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        isSingleLine: rect.height <= 32,
        parentRowButtons: buttons
      };
    });
  });

  console.log('Section headers check:', JSON.stringify(headers, null, 2));

  await page.screenshot({ path: 'tmp/verified-mobile-headers3.png', fullPage: false });
  console.log('Saved screenshot to tmp/verified-mobile-headers3.png');

  await browser.close();
})();
