const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  // Pre-seed localStorage with admin auth simulation just like user session
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('vnr_is_admin', 'true');
    localStorage.setItem('vnr_cached_user', JSON.stringify({
      id: '8a440e3d-b3d0-4103-a131-77c6d8572fa5',
      email: 'grindwithmt@gmail.com'
    }));
  });

  console.log('Navigating to http://localhost:3000/home...');
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });

  // Check immediately on DOM ready if bottom navbar shows Add Series (+) button
  const hasPlusImmediately = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Add New Series"]');
    return !!btn;
  });
  console.log('Immediate Add Series button present on first render:', hasPlusImmediately);

  await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => {});

  // Inspect the styles/classes of the + button
  const buttonDetails = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Add New Series"]');
    if (!btn) return null;
    const computed = window.getComputedStyle(btn);
    return {
      className: btn.className,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      hasPurple: btn.className.includes('purple') || computed.backgroundColor.includes('168')
    };
  });

  console.log('Button details:', buttonDetails);

  // Now perform a hard reload to simulate user pressing Refresh
  console.log('Reloading page...');
  const navPromise = page.reload({ waitUntil: 'domcontentloaded' });

  // At domcontentloaded, check if Add Series is present without delay
  await navPromise;
  const afterReloadHasPlus = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Add New Series"]');
    return !!btn;
  });
  console.log('After reload Add Series button present immediately:', afterReloadHasPlus);

  await page.screenshot({ path: 'tmp/verified-mobile-navbar.png' });
  console.log('Screenshot saved to tmp/verified-mobile-navbar.png');

  await browser.close();
})();
