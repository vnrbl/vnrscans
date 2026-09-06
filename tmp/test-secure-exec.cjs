const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', // or false
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--use-gl=angle',
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  // Let's test running secure-curr.js in the browser page directly on an empty page
  await page.goto('about:blank');
  
  // Set up mock DOM elements that secure-curr.js needs
  await page.evaluate(() => {
    const meta = document.createElement('meta');
    meta.name = 'cfg';
    meta.content = 'ZZYdbXagjEpeaRwTE56mTpBkKVnnIBmAB3gdwWXXjEM7ZqAcLgonw0ylNjY621zM0zefn1Qg_jIQEn0oAIFnaXeGk3K4XZgY6S1Ldadwahluywsju2Z_xXiMDsD2';
    document.head.appendChild(meta);
  });

  const fs = require('fs');
  const js = fs.readFileSync('tmp/secure-curr.js', 'utf8');

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message, err.stack));

  const result = await page.evaluate((code) => {
    try {
      // Evaluate the script
      const s = document.createElement('script');
      s.type = 'module';
      s.textContent = code;
      document.body.appendChild(s);
      return 'script appended';
    } catch (e) {
      return 'eval error: ' + e.message;
    }
  }, js);

  console.log('Result:', result);
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
