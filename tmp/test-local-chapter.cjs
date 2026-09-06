const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  // Navigate to real chapter page HTML served locally or injected
  const html = fs.readFileSync('tmp/chapter-0.html', 'utf8');
  await page.setContent(html);

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
