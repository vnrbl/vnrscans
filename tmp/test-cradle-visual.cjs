const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });

  // In the real app, user is admin. Let's force showPanel to verify layout visually:
  await page.evaluate(() => {
    // Add the admin center button into nav to visually verify the notch and cradle elevation
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return;

    // Remove novels link and put the elevated button between browse and library
    const links = Array.from(nav.querySelectorAll('a'));
    const browseLink = links[1];
    
    // Create button matching Navbar.tsx
    const container = document.createElement('div');
    container.className = 'relative flex items-center justify-center shrink-0 -mt-8 z-20 px-1';
    container.innerHTML = `
      <button
        type="button"
        title="Add New Series (Admin Only)"
        aria-label="Add New Series"
        class="group relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-black ring-[5px] ring-background hover:bg-neutral-200 active:scale-95 transition-all duration-150 cursor-pointer select-none shadow-md shadow-black/60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-black transition-transform duration-200 group-hover:rotate-90"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    `;

    browseLink.after(container);
  });

  // Take a focused screenshot of the bottom navbar
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
    await page.screenshot({ path: 'tmp/verified-cradle-notch.png', clip });
    console.log('Saved screenshot to tmp/verified-cradle-notch.png');
  }

  await browser.close();
})();
