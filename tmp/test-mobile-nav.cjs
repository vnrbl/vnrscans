const puppeteer = require('puppeteer');

async function testMobileNav() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=393,851']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000/home on mobile viewport...');
  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check top header: verify the + button is not visible on mobile
  const topHeaderPlusVisible = await page.evaluate(() => {
    const btn = document.querySelector('header button[aria-label="Add New Series"]');
    if (!btn) return false;
    const style = window.getComputedStyle(btn.parentElement || btn);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  console.log('Top header Add Series button visible on mobile:', topHeaderPlusVisible);

  // Check bottom nav items
  const bottomNavInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return { error: 'No bottom nav found' };
    const links = Array.from(nav.querySelectorAll('a, button')).map(el => ({
      tag: el.tagName,
      text: el.innerText.trim().replace(/\s+/g, ' '),
      title: el.getAttribute('title') || '',
      classes: el.className
    }));
    return {
      navClasses: nav.className,
      items: links
    };
  });

  console.log('Bottom nav elements:', JSON.stringify(bottomNavInfo, null, 2));

  // Capture a screenshot of the bottom navigation bar
  const navHandle = await page.$('nav.fixed.bottom-0');
  if (navHandle) {
    await page.screenshot({ path: 'tmp/mobile-nav-preview.png' });
    console.log('Saved screenshot to tmp/mobile-nav-preview.png');
  }

  await browser.close();
}

testMobileNav().catch(console.error);
