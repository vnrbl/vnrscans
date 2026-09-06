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

  // Simulate admin
  await page.evaluate(() => {
    localStorage.setItem('vnr_is_admin', 'true');
    localStorage.setItem('vnr_cached_user', JSON.stringify({
      id: '8a440e3d-b3d0-4103-a131-77c6d8572fa5',
      email: 'grindwithmt@gmail.com'
    }));
  });

  await page.reload({ waitUntil: 'networkidle2' });

  // Check the position and bounding box of the + button
  const buttonMetrics = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    const btn = nav?.querySelector('button[aria-label="Add New Series"]');
    if (!nav || !btn) return null;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const computed = window.getComputedStyle(btn);
    return {
      navTop: navRect.top,
      btnTop: btnRect.top,
      protrusionAboveNav: navRect.top - btnRect.top,
      btnWidth: btnRect.width,
      btnHeight: btnRect.height,
      backgroundColor: computed.backgroundColor,
      boxShadow: computed.boxShadow,
      className: btn.className
    };
  });

  console.log('Button metrics:', JSON.stringify(buttonMetrics, null, 2));

  // Take a focused screenshot of the bottom navbar area
  const clip = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return null;
    const rect = nav.getBoundingClientRect();
    return {
      x: 0,
      y: Math.max(0, rect.top - 40),
      width: window.innerWidth,
      height: window.innerHeight - Math.max(0, rect.top - 40)
    };
  });

  if (clip) {
    await page.screenshot({ path: 'tmp/verified-cradle-nav.png', clip });
    console.log('Saved cropped navbar screenshot to tmp/verified-cradle-nav.png');
  }

  await page.screenshot({ path: 'tmp/verified-full-mobile.png', fullPage: false });
  console.log('Saved full viewport screenshot to tmp/verified-full-mobile.png');

  await browser.close();
})();
