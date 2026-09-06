const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env' });

async function testAdminSession() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdnFobXZxYnR1anpjZnFrcmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTY4NTQsImV4cCI6MjA2NDUzMjg1NH0.6R0Q5kO8WnF6f4U8n3t5mUqY2w0F3v9V4a8B1k7L6m0'
  );
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'grindwithmt@gmail.com'
  });

  const { data: authData, error: authErr } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink'
  });

  if (authErr || !authData.session) {
    console.error('Verify OTP failed:', authErr);
    return;
  }

  const session = authData.session;
  console.log('Obtained session for:', session.user.email, 'id:', session.user.id);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=393,851']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });

  // Inject session into localStorage under Supabase client key
  const storageKey = 'sb-edvqhmvqbtujzcfqkrbe-auth-token';
  await page.evaluate((key, sess) => {
    localStorage.setItem(key, JSON.stringify(sess));
  }, storageKey, session);

  // Reload page so Supabase client loads the injected admin session
  console.log('Reloading with injected admin session...');
  await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const navInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav.fixed.bottom-0');
    if (!nav) return { error: 'No bottom nav' };
    const items = Array.from(nav.children).map(el => {
      const btn = el.tagName === 'BUTTON' ? el : el.querySelector('button');
      const link = el.tagName === 'A' ? el : el.querySelector('a');
      return {
        tag: el.tagName,
        hasButton: !!btn,
        buttonTitle: btn ? btn.getAttribute('title') : null,
        linkHref: link ? link.getAttribute('href') : null,
        text: el.innerText.trim().replace(/\s+/g, ' ')
      };
    });
    return items;
  });

  console.log('Authenticated Admin Bottom Nav Items:');
  console.log(JSON.stringify(navInfo, null, 2));

  // Also check top header Add Series button is hidden on mobile
  const topHeaderPlusVisible = await page.evaluate(() => {
    const btn = document.querySelector('header button[aria-label="Add New Series"]');
    if (!btn) return false;
    const parent = btn.closest('div');
    const style = window.getComputedStyle(parent || btn);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  console.log('Top header Add Series visible on mobile:', topHeaderPlusVisible);

  await page.screenshot({ path: 'tmp/authenticated-admin-mobile-nav.png' });
  console.log('Saved screenshot to tmp/authenticated-admin-mobile-nav.png');

  await browser.close();
}

testAdminSession().catch(console.error);
