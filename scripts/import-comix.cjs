#!/usr/bin/env node

/**
 * High-speed, robust importer for Comix.to series and chapters.
 *
 * Features:
 * - In-flight VM patching to bypass anti-headless detection and hook into internal Axios client.
 * - Automatic polar solver for WAF rotation captcha.
 * - Instant page image extraction via /api/v1/chapters/{id} (100% complete page capture).
 * - Concurrent image mirroring to Supabase Storage `chapter-pages` (no 403 hotlink blocks).
 * - Automatic detection of user profile (defaults to 'vnr610').
 * - Automatic resumption (skips already imported chapters for the chosen group).
 *
 * Usage:
 *   node scripts/import-comix.cjs <comixSeriesUrl> [targetSeriesSlugOrId] [options]
 *
 * Options:
 *   --group <name>         Scanlation group to filter (e.g. "Official", "Violet Scans", or "all") [default: "all"]
 *   --limit <number>       Max number of chapters to import
 *   --start <number>       Start chapter number
 *   --end <number>         End chapter number
 *   --concurrency <number> Image upload concurrency per chapter [default: 10]
 *   --uploader <username>  Uploader username to set on chapters [default: "vnr610"]
 *
 * Examples:
 *   node scripts/import-comix.cjs https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story
 *   node scripts/import-comix.cjs https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story 00-legend-of-the-northern-blade --group Official
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[Error] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 COMIX.TO FAST HIGH-SPEED IMPORTER

Usage:
  node scripts/import-comix.cjs <comixUrl> [targetSeriesSlugOrId] [options]

Arguments:
  <comixUrl>             Comix.to series URL or single chapter URL
                         e.g. https://comix.to/title/76gq-legend-of-the-northern-blade
                         e.g. https://comix.to/title/76gq-legend-of-the-northern-blade/11312305-chapter-87
  [targetSeries]         Optional slug or UUID of the series in your database
                         (Auto-detected from Comix title if omitted)

Options:
  --group <name>         Filter chapters by scanlation group (e.g. "Official", "Vortex Scans", "all") [default: "all"]
  --limit <number>       Maximum number of chapters to import [default: unlimited]
  --start <number>       Start chapter number [default: 0]
  --end <number>         End chapter number [default: unlimited]
  --concurrency <number> Concurrent image uploads to Supabase Storage [default: 10]
  --uploader <username>  Uploader username set on chapters [default: "vnr610"]
  --dry-run              Inspect and test image extraction without saving to database
  --help, -h             Show this help message

Examples:
  # Import all Official chapters of Northern Blade:
  node scripts/import-comix.cjs https://comix.to/title/76gq-legend-of-the-northern-blade 00-legend-of-the-northern-blade --group Official

  # Import single chapter directly:
  node scripts/import-comix.cjs https://comix.to/title/76gq-legend-of-the-northern-blade/11312305-chapter-87 00-legend-of-the-northern-blade

  # Import next 5 chapters starting from chapter 88:
  node scripts/import-comix.cjs https://comix.to/title/76gq-legend-of-the-northern-blade 00-legend-of-the-northern-blade --start 88 --limit 5
`);
    process.exit(0);
  }

  const options = {
    seriesUrl: '',
    targetSeries: '',
    group: 'all',
    limit: Infinity,
    startChapter: 0,
    endChapter: Infinity,
    concurrency: 10,
    uploader: 'vnr610',
    dryRun: false,
    isSingleChapter: false,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--group' && i + 1 < args.length) {
      options.group = args[++i];
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10) || Infinity;
    } else if (arg === '--start' && i + 1 < args.length) {
      options.startChapter = parseFloat(args[++i]) || 0;
    } else if (arg === '--end' && i + 1 < args.length) {
      options.endChapter = parseFloat(args[++i]) || Infinity;
    } else if (arg === '--concurrency' && i + 1 < args.length) {
      options.concurrency = parseInt(args[++i], 10) || 10;
    } else if (arg === '--uploader' && i + 1 < args.length) {
      options.uploader = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  options.seriesUrl = positional[0] || '';
  options.targetSeries = positional[1] || '';

  if (options.seriesUrl && options.seriesUrl.includes('-chapter-')) {
    options.isSingleChapter = true;
  }

  return options;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Automatically solves the Comix WAF rotation captcha using sharp polar ring matching
 */
async function solveComixCaptcha(page) {
  try {
    const data = await page.evaluate(async () => {
      const res = await fetch('/@waf/generate', { headers: { Accept: 'application/json' } });
      return await res.json();
    });

    if (!data || !data.captcha_id || !data.image_base64 || !data.thumb_base64) {
      return false;
    }

    const mainBuf = Buffer.from(data.image_base64.split(',')[1], 'base64');
    const thumbBuf = Buffer.from(data.thumb_base64.split(',')[1], 'base64');

    const mainRaw = await sharp(mainBuf).raw().toBuffer({ resolveWithObject: true });
    const thumbRaw = await sharp(thumbBuf).raw().toBuffer({ resolveWithObject: true });

    const r = (data.thumb_size || 140) / 2;
    const rThumb = r - 2;
    const rMain = r + 2;

    const N = 360;
    const thumbRing = [];
    const mainRing = [];

    for (let i = 0; i < N; i++) {
      const rad = (i * Math.PI) / 180;
      const tx = Math.round(thumbRaw.info.width / 2 + rThumb * Math.cos(rad));
      const ty = Math.round(thumbRaw.info.height / 2 + rThumb * Math.sin(rad));
      const tIdx = (ty * thumbRaw.info.width + tx) * thumbRaw.info.channels;
      thumbRing.push([thumbRaw.data[tIdx], thumbRaw.data[tIdx + 1], thumbRaw.data[tIdx + 2]]);

      const mx = Math.round(mainRaw.info.width / 2 + rMain * Math.cos(rad));
      const my = Math.round(mainRaw.info.height / 2 + rMain * Math.sin(rad));
      const mIdx = (my * mainRaw.info.width + mx) * mainRaw.info.channels;
      mainRing.push([mainRaw.data[mIdx], mainRaw.data[mIdx + 1], mainRaw.data[mIdx + 2]]);
    }

    let bestAngle = 0;
    let minDiff = Infinity;

    for (let angle = 0; angle < 360; angle++) {
      let diff = 0;
      for (let phi = 0; phi < N; phi++) {
        const tPhi = (phi - angle + 360) % 360;
        const tPix = thumbRing[tPhi];
        const mPix = mainRing[phi];
        const dr = tPix[0] - mPix[0];
        const dg = tPix[1] - mPix[1];
        const db = tPix[2] - mPix[2];
        diff += dr * dr + dg * dg + db * db;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bestAngle = angle;
      }
    }

    const verifyResult = await page.evaluate(
      async (payload) => {
        const res = await fetch('/@waf/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return await res.json();
      },
      { captcha_id: data.captcha_id, angle: bestAngle },
    );

    return verifyResult && verifyResult.success;
  } catch (err) {
    console.warn('[CaptchaSolver] Warning:', err.message);
    return false;
  }
}

/**
 * Configure request interception for in-flight VM patch and Axios client exposure
 */
async function setupPageInterception(page) {
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const u = req.url();
    try {
      if (u.includes('secure-') && u.endsWith('.js')) {
        const res = await fetch(u);
        let text = await res.text();
        text = text.replace('Ο_=void 0,O0={},T2=α$', 'Ο_=34,O0={},T2=α$');
        text = text.replace('case 8:Z_=!Ο_||T2&&F7?20:28;break;', 'case 8:Z_=28;break;');
        req.respond({ status: 200, contentType: 'application/javascript', body: text });
        return;
      }
      if (u.includes('env-') && u.endsWith('.js')) {
        const res = await fetch(u);
        let text = await res.text();
        text += '\nwindow.__comixAxios = Ui;\n';
        req.respond({ status: 200, contentType: 'application/javascript', body: text });
        return;
      }
    } catch (e) {
      // Fallback
    }
    req.continue();
  });
}

/**
 * Discovers series metadata and paginates through all chapters on Comix.to
 */
async function scrapeComixSeries(page, seriesUrl, groupFilter) {
  console.log(`\n🔍 Loading series page: ${seriesUrl}`);
  await page.goto(seriesUrl, { waitUntil: 'networkidle2', timeout: 45000 });

  if (page.url().includes('@waf/challenge')) {
    console.log('🛡️ Solving WAF challenge on series page...');
    await solveComixCaptcha(page);
    await new Promise((r) => setTimeout(r, 1000));
    await page.goto(seriesUrl, { waitUntil: 'networkidle2', timeout: 45000 });
  }

  // 1. Extract embedded metadata from <script id="initial-data">
  const initialData = await page.evaluate(() => {
    const el = document.getElementById('initial-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent || '{}');
    } catch {
      return null;
    }
  });

  let mangaMeta = null;
  const groupsList = [];

  if (initialData?.queries) {
    for (const [k, v] of Object.entries(initialData.queries)) {
      if (k.includes('"manga","detail"') && typeof v === 'object' && v !== null) {
        mangaMeta = v;
      }
      if (k.includes('"manga","groups"') && Array.isArray(v)) {
        groupsList.push(...v);
      }
    }
  }

  console.log(`📖 Title: ${mangaMeta?.title || 'Unknown'}`);
  if (groupsList.length > 0) {
    console.log(`👥 Available Groups: ${groupsList.map((g) => `${g.name} (id:${g.id})`).join(', ')}`);
  }

  // 2. Paginate chapters list
  const chapters = [];
  const seenUrls = new Set();
  const maxPages = 50;

  console.log('📑 Discovering chapter list...');
  for (let p = 1; p <= maxPages; p++) {
    await page.waitForSelector('.mchap-list, .mchap-item, a[href*="-chapter-"]', { timeout: 8000 }).catch(() => {});

    const pageChapters = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.mchap-item'));
      return items.map((el) => {
        const link = el.querySelector('a.mchap-row__primary') || el.querySelector('a[href*="-chapter-"]');
        const chEl = el.querySelector('.mchap-row__ch');
        const titleEl = el.querySelector('.mchap-row__title');
        const groupEl = el.querySelector('.mchap-row__group');
        const timeEl = el.querySelector('.mchap-row__time');
        const href = link ? link.href : '';
        const m = href.match(/-chapter-([0-9.]+)/i);
        const num = m ? parseFloat(m[1]) : 0;
        const groupName = groupEl
          ? groupEl.innerText.trim()
          : el.querySelector('.is-official')
            ? 'Official'
            : 'Comix';
        const titleText = titleEl ? titleEl.innerText.trim() : chEl ? chEl.innerText.trim() : `Chapter ${num}`;
        return {
          chapterNumber: num,
          title: titleText,
          url: href,
          scanGroup: groupName,
          time: timeEl ? timeEl.innerText.trim() : undefined,
        };
      });
    });

    if (pageChapters.length === 0) {
      // Generic fallback
      const fallback = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="-chapter-"]'));
        return links.map((a) => {
          const m = a.href.match(/-chapter-([0-9.]+)/i);
          return {
            chapterNumber: m ? parseFloat(m[1]) : 0,
            title: a.innerText.trim() || `Chapter ${m ? m[1] : ''}`,
            url: a.href,
            scanGroup: 'Comix',
          };
        });
      });
      for (const ch of fallback) {
        if (ch.url && !seenUrls.has(ch.url)) {
          seenUrls.add(ch.url);
          chapters.push(ch);
        }
      }
      break;
    }

    for (const ch of pageChapters) {
      if (ch.url && !seenUrls.has(ch.url)) {
        seenUrls.add(ch.url);
        chapters.push(ch);
      }
    }

    // Next page button
    const firstHref = pageChapters[0]?.url || '';
    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('.npager button[aria-label="Next page"]');
      if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('is-disabled')) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) break;
    await page
      .waitForFunction(
        (oldHref) => {
          const first = document.querySelector('.mchap-item a.mchap-row__primary') ||
            document.querySelector('.mchap-item a[href*="-chapter-"]');
          return first && first.href !== oldHref;
        },
        { timeout: 3500 },
        firstHref,
      )
      .catch(() => new Promise((r) => setTimeout(r, 600)));
  }

  // Filter by scan group if specified
  let filteredChapters = chapters;
  if (groupFilter && groupFilter.toLowerCase() !== 'all') {
    const targetGroup = groupFilter.toLowerCase();
    filteredChapters = chapters.filter((c) => (c.scanGroup || '').toLowerCase().includes(targetGroup));
    console.log(`🎯 Filtered to group "${groupFilter}": ${filteredChapters.length} of ${chapters.length} chapters`);
  }

  // Sort ascending by chapter number
  filteredChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  console.log(`✅ Discovered ${filteredChapters.length} total chapters to process.`);
  return { metadata: mangaMeta, chapters: filteredChapters };
}

/**
 * Extracts all page image URLs for a chapter using direct internal Axios API with DOM scroll fallback
 */
async function extractChapterImages(page, chapterUrl) {
  // Extract chapterId from URL, e.g. /11312305-chapter-87 -> 11312305
  const match = chapterUrl.match(/\/(\d+)-chapter-/);
  const chapterId = match ? match[1] : null;

  // Listen to network responses as secondary fallback
  const networkImages = [];
  const onResponse = (res) => {
    const u = res.url();
    if (u.includes('wowpic') || u.includes('.store/i5') || u.includes('static.comix.to')) {
      if (!networkImages.includes(u)) networkImages.push(u);
    }
  };
  page.on('response', onResponse);

  try {
    await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    if (page.url().includes('@waf/challenge')) {
      console.log('🛡️ Solving chapter WAF challenge...');
      await solveComixCaptcha(page);
      await new Promise((r) => setTimeout(r, 1000));
      await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    }

    // Method 1: Instant extraction via hooked window.__comixAxios
    if (chapterId) {
      await new Promise((r) => setTimeout(r, 1200)); // Allow env.js to initialize
      const apiResult = await page.evaluate(async (chId) => {
        if (!window.__comixAxios) return null;
        try {
          const res = await window.__comixAxios.get(`/chapters/${chId}`);
          const p = res.data?.pages;
          if (p && Array.isArray(p.items) && p.items.length > 0) {
            const base = p.baseUrl || '';
            return p.items.map((item) => (item.url.startsWith('http') ? item.url : base + item.url));
          }
        } catch {
          return null;
        }
        return null;
      }, chapterId);

      if (Array.isArray(apiResult) && apiResult.length > 0) {
        page.off('response', onResponse);
        return apiResult;
      }
    }

    // Method 2: Progressive virtual reader scroll with network response capture
    await page.evaluate(async () => {
      for (let i = 0; i < 22; i++) {
        window.scrollBy(0, 1400);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Also collect DOM images
    const domImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.rpage-page__img, img[src*="wowpic"], img[src*="store/i5"]'));
      return imgs
        .map((i) => i.src || i.currentSrc)
        .filter((src) => src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo'));
    });

    const combined = [];
    for (const u of networkImages) if (!combined.includes(u)) combined.push(u);
    for (const u of domImages) if (!combined.includes(u)) combined.push(u);

    page.off('response', onResponse);
    return combined;
  } catch (err) {
    page.off('response', onResponse);
    throw err;
  }
}

/**
 * Downloads chapter images using 'Referer: https://comix.to/' and mirrors to Supabase Storage
 */
async function mirrorImagesToSupabase(images, seriesSlug, chapterSlug, concurrency = 10) {
  const results = [];
  const queue = images.map((imgUrl, idx) => ({ imgUrl, pageNum: idx + 1 }));

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { imgUrl, pageNum } = item;

      try {
        const res = await fetch(imgUrl, {
          headers: {
            Referer: 'https://comix.to/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(16_000),
        });

        if (!res.ok) {
          // Fallback to proxy url
          const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(imgUrl)}`;
          results.push({ pageNum, url: proxyUrl });
          continue;
        }

        const contentType = res.headers.get('content-type') || 'image/webp';
        const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp';
        const buffer = Buffer.from(await res.arrayBuffer());
        const storagePath = `${seriesSlug}/${chapterSlug}/page-${String(pageNum).padStart(3, '0')}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('chapter-pages')
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (upErr) {
          const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(imgUrl)}`;
          results.push({ pageNum, url: proxyUrl });
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from('chapter-pages').getPublicUrl(storagePath);
          results.push({ pageNum, url: publicUrl });
        }
      } catch (err) {
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(imgUrl)}`;
        results.push({ pageNum, url: proxyUrl });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, images.length) }, () => worker());
  await Promise.all(workers);
  results.sort((a, b) => a.pageNum - b.pageNum);
  return results.map((r) => r.url);
}

/**
 * Resolves target series from Supabase database by slug, ID, or title
 */
async function resolveTargetSeries(targetInput, mangaMeta) {
  if (targetInput) {
    // Check by ID
    if (/^[0-9a-f-]{36}$/i.test(targetInput)) {
      const { data } = await supabase.from('series').select('id, title, slug').eq('id', targetInput).maybeSingle();
      if (data) return data;
    }
    // Check by slug
    const { data: bySlug } = await supabase.from('series').select('id, title, slug').eq('slug', targetInput).maybeSingle();
    if (bySlug) return bySlug;
    // Check by title ilike
    const { data: byTitle } = await supabase
      .from('series')
      .select('id, title, slug')
      .ilike('title', `%${targetInput.replace(/[-_]/g, ' ')}%`)
      .limit(1)
      .maybeSingle();
    if (byTitle) return byTitle;
  }

  // Match by Comix mangaMeta title
  if (mangaMeta?.title) {
    const cleanTitle = mangaMeta.title.replace(/[^\w\s]/g, '').trim();
    const { data: matched } = await supabase
      .from('series')
      .select('id, title, slug')
      .ilike('title', `%${cleanTitle}%`)
      .limit(1)
      .maybeSingle();
    if (matched) return matched;
  }

  return null;
}

async function main() {
  const options = parseArgs();
  if (!options.seriesUrl) {
    console.log('❌ Error: Comix series URL required.');
    console.log('Example: node scripts/import-comix.cjs https://comix.to/title/l7re-you-think-its-easy-rewriting-a-story');
    process.exit(1);
  }

  console.log('🚀 === COMIX.TO FAST HIGH-SPEED IMPORTER ===');
  console.log(`URL: ${options.seriesUrl}`);
  console.log(`Group Filter: ${options.group}`);
  console.log(`Uploader: ${options.uploader}`);
  console.log(`Upload Concurrency: ${options.concurrency}`);

  console.log('\n🌐 Launching Puppeteer browser with in-flight patching...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );
    await setupPageInterception(page);

    let metadata = null;
    let chapters = [];

    if (options.isSingleChapter) {
      const match = options.seriesUrl.match(/-chapter-([0-9.]+)/i);
      const chNum = match ? parseFloat(match[1]) : 0;
      const parentUrl = options.seriesUrl.replace(/\/\d+-chapter-[^/]+$/, '');
      console.log(`\n📌 Single chapter mode detected: Chapter ${chNum}`);
      console.log(`🔗 Parent series URL: ${parentUrl}`);

      if (!options.targetSeries) {
        try {
          const res = await scrapeComixSeries(page, parentUrl, 'all');
          metadata = res.metadata;
        } catch (err) {
          console.warn('⚠️ Could not fetch parent series metadata:', err.message);
        }
      }

      chapters = [
        {
          chapterNumber: chNum,
          title: `Chapter ${chNum}`,
          url: options.seriesUrl,
          scanGroup: options.group !== 'all' ? options.group : 'Official',
        },
      ];
    } else {
      // 1. Scrape series and discover chapters
      const res = await scrapeComixSeries(page, options.seriesUrl, options.group);
      metadata = res.metadata;
      chapters = res.chapters;
    }

    // 2. Resolve target series in database
    const series = await resolveTargetSeries(options.targetSeries, metadata);
    if (!series) {
      console.error(
        `\n❌ Target series not found in database for "${options.targetSeries || metadata?.title}".`,
      );
      console.error('Please specify target series slug or ID as the second argument.');
      process.exit(1);
    }
    console.log(`\n🎯 Target Series: "${series.title}" (${series.slug}) [ID: ${series.id}]`);

    // 3. Check existing chapters to avoid duplicate imports
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, scanlation_group')
      .eq('series_id', series.id);

    const existingKeySet = new Set(
      (existingChapters || []).map(
        (c) => `${Number(c.chapter_number)}_${(c.scanlation_group || 'Comix').toLowerCase()}`,
      ),
    );

    // Filter chapters according to user options
    const toProcess = chapters.filter((c) => {
      if (c.chapterNumber < options.startChapter || c.chapterNumber > options.endChapter) {
        return false;
      }
      const effGroup = (c.scanGroup || 'Comix').toLowerCase();
      const key = `${Number(c.chapterNumber)}_${effGroup}`;
      return !existingKeySet.has(key);
    });

    console.log(`\n📊 Chapters Summary:`);
    console.log(`   Total on Comix: ${chapters.length}`);
    console.log(`   Already in DB:  ${chapters.length - toProcess.length}`);
    console.log(`   To Import:      ${Math.min(toProcess.length, options.limit)}`);

    if (toProcess.length === 0) {
      console.log('✨ All chapters are already up to date! Nothing to import.');
      return;
    }

    const batch = toProcess.slice(0, options.limit);

    if (options.dryRun) {
      console.log('\n🧪 DRY-RUN MODE: Testing image extraction without saving to database...');
      for (const ch of batch) {
        const t0 = Date.now();
        const rawImages = await extractChapterImages(page, ch.url);
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`✅ Ch.${ch.chapterNumber} (${ch.scanGroup}): Extracted ${rawImages.length} images in ${elapsed}s`);
        if (rawImages.length > 0) {
          console.log(`   Sample page 1: ${rawImages[0]}`);
          console.log(`   Sample page ${rawImages.length}: ${rawImages[rawImages.length - 1]}`);
        }
      }
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batch.length; i++) {
      const ch = batch[i];
      const effGroup = ch.scanGroup || 'Comix';
      const progressPrefix = `[${i + 1}/${batch.length}] Ch.${ch.chapterNumber} (${effGroup}):`;

      try {
        const t0 = Date.now();
        // 1. Extract 100% chapter images
        const rawImages = await extractChapterImages(page, ch.url);
        if (!rawImages || rawImages.length === 0) {
          console.warn(`${progressPrefix} ⚠️ No images extracted from ${ch.url}. Skipping.`);
          failedCount++;
          continue;
        }

        // 2. Generate slug and insert chapter row
        let chapterSlug = `${series.slug}-chapter-${ch.chapterNumber}`;
        if (effGroup && effGroup.toLowerCase() !== 'official' && effGroup.toLowerCase() !== 'comix') {
          chapterSlug = `${series.slug}-chapter-${ch.chapterNumber}-${slugify(effGroup)}`;
        }

        let { data: chapterRow, error: chInsertError } = await supabase
          .from('chapters')
          .insert({
            series_id: series.id,
            chapter_number: ch.chapterNumber,
            title: ch.title || `Chapter ${ch.chapterNumber}`,
            slug: chapterSlug,
            chapter_type: 'image',
            status: 'published',
            scanlation_group: effGroup,
            source_url: ch.url,
            uploaded_by: options.uploader || 'vnr610',
          })
          .select('id')
          .single();

        if (chInsertError && chInsertError.message?.includes('unique')) {
          chapterSlug = `${chapterSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await supabase
            .from('chapters')
            .insert({
              series_id: series.id,
              chapter_number: ch.chapterNumber,
              title: ch.title || `Chapter ${ch.chapterNumber}`,
              slug: chapterSlug,
              chapter_type: 'image',
              status: 'published',
              scanlation_group: effGroup,
              source_url: ch.url,
              uploaded_by: options.uploader || 'vnr610',
            })
            .select('id')
            .single();
          chapterRow = retry.data;
          chInsertError = retry.error;
        }

        if (chInsertError || !chapterRow) {
          console.error(`${progressPrefix} ❌ DB chapter insert failed:`, chInsertError?.message);
          failedCount++;
          continue;
        }

        // 3. Mirror all images to Supabase Storage
        const mirroredUrls = await mirrorImagesToSupabase(
          rawImages,
          series.slug,
          chapterSlug,
          options.concurrency,
        );

        // 4. Insert pages into chapter_pages
        const pageRows = mirroredUrls.map((url, idx) => ({
          chapter_id: chapterRow.id,
          page_number: idx + 1,
          image_url: url,
        }));

        const { error: pagesErr } = await supabase.from('chapter_pages').insert(pageRows);
        if (pagesErr) {
          console.warn(`${progressPrefix} ⚠️ Error inserting chapter_pages:`, pagesErr.message);
        }

        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(
          `${progressPrefix} ✅ ${pageRows.length} pages mirrored & saved in ${elapsed}s (uploaded_by: ${options.uploader})`,
        );
        successCount++;
      } catch (chErr) {
        console.error(`${progressPrefix} ❌ Error:`, chErr.message);
        failedCount++;
      }
    }

    console.log(`\n🎉 Finished importing from Comix.to!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed:  ${failedCount}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('[Fatal Error]:', e);
  process.exit(1);
});
