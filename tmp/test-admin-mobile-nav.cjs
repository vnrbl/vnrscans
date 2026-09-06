const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env' });

async function testAdminMobileNav() {
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Generate magic link session for grindwithmt@gmail.com
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'grindwithmt@gmail.com'
  });

  if (linkErr || !linkData) {
    console.error('Failed to generate magiclink:', linkErr);
    return;
  }

  const tokenHash = linkData.properties?.hashed_token;
  const actionLink = linkData.properties?.action_link;
  console.log('Action link generated:', actionLink);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=393,851']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  // Navigate to action link to establish real authenticated session in browser
  console.log('Navigating to auth magiclink to sign in as admin...');
  await page.goto(actionLink, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // Navigate to /home
  console.log('Navigating to http://localhost:3000/home...');
  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Check top header: verify the + button is HIDDEN on mobile
  const topHeaderPlusVisible = await page.evaluate(() => {
    const btn = document.querySelector('header button[aria-label="Add New Series"]');
    if (!btn) return false;
    const parent = btn.closest('div');
    const style = window.getComputedStyle(parent || btn);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  console.log('Top header Add Series visible on mobile:', topHeaderPlusVisible);

  // Check bottom nav items
  const bottomNavInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return { error: 'No bottom nav found' };
    const items = Array.from(nav.children).map(el => {
      const btn = el.tagName === 'BUTTON' ? el : el.querySelector('button');
      const link = el.tagName === 'A' ? el : el.querySelector('a');
      return {
        tag: el.tagName,
        hasButton: !!btn,
        buttonTitle: btn ? btn.getAttribute('title') || btn.getAttribute('aria-label') : null,
        linkHref: link ? link.getAttribute('href') : null,
        text: el.innerText.trim().replace(/\s+/g, ' ')
      };
    });
    return items;
  });

  console.log('Admin Mobile Bottom Nav Items:', JSON.stringify(bottomNavInfo, null, 2));

  // Capture screenshot of mobile view with the center + button
  await page.screenshot({ path: 'tmp/admin-mobile-nav-screenshot.png' });
  console.log('Captured screenshot at tmp/admin-mobile-nav-screenshot.png');

  await browser.close();
}

testAdminMobileNav().catch(console.error);
