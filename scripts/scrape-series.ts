import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import readline from 'readline';
import puppeteer from 'puppeteer';
import { buildClientChapterLinksHtml, extractChapterLinks, extractImageUrls } from '../src/lib/chapter-scraper';
import { buildChapterSlug } from '../src/lib/chapter-utils';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const getImageUrlTypePrefix = (exampleUrl: string): string | null => {
  try {
    const parsed = new URL(exampleUrl.trim());
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (segments.length >= 3) {
      return `${parsed.origin}/${segments.slice(0, 3).join('/')}/`;
    }

    return `${parsed.origin}${parsed.pathname.replace(/\/[^/]*$/, '/')}`;
  } catch {
    return null;
  }
};

const chapterScanKey = (chapterNumber: number, scanlationGroup: string | null): string => {
  return `${chapterNumber}::${scanlationGroup?.trim() || ''}`;
};

async function main() {
  console.log('📚 --- Shadow Shelf CLI Scraper --- 📚\n');

  let seriesId = '';
  let seriesTitle = '';

  // Get series from database
  try {
    const { data: seriesList, error } = await supabase
      .from('series')
      .select('id, title, slug')
      .order('title');

    if (error) throw error;

    if (!seriesList || seriesList.length === 0) {
      console.log('⚠️ No series found in the database. Please create a series first.');
      process.exit(0);
    }

    console.log('Available Series in database:');
    seriesList.forEach((s, idx) => {
      console.log(`  [${idx + 1}] ${s.title}`);
    });
    console.log('  [S] Search by Title');
    console.log('  [M] Enter UUID manually');

    const choice = (await askQuestion('\nChoose a series option: ')).trim().toLowerCase();

    if (choice === 'm') {
      seriesId = (await askQuestion('Enter Series UUID: ')).trim();
      const { data: match } = await supabase.from('series').select('title').eq('id', seriesId).single();
      seriesTitle = match?.title || 'Manual UUID Series';
    } else if (choice === 's') {
      const search = (await askQuestion('Enter title to search: ')).trim().toLowerCase();
      const matches = seriesList.filter(s => s.title.toLowerCase().includes(search));
      
      if (matches.length === 0) {
        console.log('❌ No matching series found.');
        process.exit(1);
      }

      console.log('\nMatching Series:');
      matches.forEach((s, idx) => {
        console.log(`  [${idx + 1}] ${s.title}`);
      });
      const matchIdx = parseInt(await askQuestion('\nSelect a series number: '), 10) - 1;
      if (isNaN(matchIdx) || matchIdx < 0 || matchIdx >= matches.length) {
        console.log('❌ Invalid selection.');
        process.exit(1);
      }
      seriesId = matches[matchIdx].id;
      seriesTitle = matches[matchIdx].title;
    } else {
      const idx = parseInt(choice, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= seriesList.length) {
        console.log('❌ Invalid selection.');
        process.exit(1);
      }
      seriesId = seriesList[idx].id;
      seriesTitle = seriesList[idx].title;
    }
  } catch (error) {
    console.error('❌ Failed to fetch series list:', error);
    process.exit(1);
  }

  console.log(`\nSelected Series: "${seriesTitle}"`);

  // Ask for Series Page URL
  const seriesUrl = (await askQuestion('\nEnter Series URL to scrape (e.g., https://site.com/manga/title): ')).trim();
  if (!seriesUrl) {
    console.log('❌ URL is required.');
    process.exit(1);
  }

  const imageTypeExample = (await askQuestion(
    'Enter Image URL Example (optional, press Enter to skip): '
  )).trim();
  const imageUrlPrefix = imageTypeExample ? getImageUrlTypePrefix(imageTypeExample) : null;

  if (imageTypeExample && !imageUrlPrefix) {
    console.log('❌ Please enter a valid example image URL to filter by.');
    process.exit(1);
  }

  if (imageUrlPrefix) {
    console.log(`Filtering chapter images by URL pattern: ${imageUrlPrefix}`);
  }

  let sourceGroupFallback = '';
  try {
    sourceGroupFallback = new URL(seriesUrl).hostname.replace(/^www\./, '');
  } catch {
    sourceGroupFallback = '';
  }

  // Ask for scanlation group
  const scanlationGroupInput = (await askQuestion(
    `Enter Scanlation Group name (optional, press Enter to use ${sourceGroupFallback || 'source URL'}): `
  )).trim();
  const scanlationGroup = scanlationGroupInput || sourceGroupFallback;

  if (scanlationGroup) {
    console.log(`Using scan/source group: ${scanlationGroup}`);
  }

  // Ask for uploader username
  const uploadedBy = (await askQuestion('Enter Uploader Username (optional, press Enter to skip): ')).trim();

  rl.close();

  console.log('\n🚀 Starting browser to bypass Cloudflare...');
  const browser = await puppeteer.launch({
    headless: false, // Visible window so you can solve Turnstile challenges if prompted
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();
  
  // Apply anti-detection measures to prevent Cloudflare from blocking Puppeteer
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  // Set realistic User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log(`Navigating to: ${seriesUrl}`);
  await page.goto(seriesUrl, { waitUntil: 'domcontentloaded' });

  // Re-create readline to ask confirmation in terminal
  const rlConfirm = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n⚠️  If Cloudflare displays a challenge (e.g. Turnstile checkbox), please solve it in the browser window.');
  await new Promise<void>((resolve) => {
    rlConfirm.question('Press [Enter] in this terminal when the page is fully loaded and you see the chapter list... ', () => {
      resolve();
    });
  });

  console.log('🔍 Extracting chapters from page...');
  let previousChapterCount = 0;
  let stablePasses = 0;

  for (let i = 0; i < 10 && stablePasses < 2; i++) {
    const chapterCount = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return (document.body.innerText.match(/chapter\s*\d+/gi) || []).length;
    });

    if (chapterCount === previousChapterCount) {
      stablePasses++;
    } else {
      stablePasses = 0;
      previousChapterCount = chapterCount;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  const html = await page.content();
  const clientChapterHtml = await buildClientChapterLinksHtml(page, seriesUrl);
  const discovered = extractChapterLinks(`${html}\n${clientChapterHtml}`, seriesUrl);
  console.log(`✅ Discovered ${discovered.length} chapters.`);

  if (discovered.length === 0) {
    console.log('❌ No chapters found on the page. Closing browser.');
    await browser.close();
    rlConfirm.close();
    process.exit(1);
  }

  // Get existing chapters
  console.log('Checking existing chapters in database...');
  let missing: any[] = [];
  let exactDuplicateCount = 0;
  try {
    const { data: existing, error } = await supabase
      .from('chapters')
      .select('chapter_number, scanlation_group')
      .eq('series_id', seriesId);

    if (error) throw error;

    const targetGroup = scanlationGroup || null;
    const existingScanKeys = new Set(
      existing?.map((c) => chapterScanKey(c.chapter_number, c.scanlation_group)) || [],
    );
    missing = discovered.filter((ch) => {
      const isExactDuplicate = existingScanKeys.has(chapterScanKey(ch.chapterNumber, targetGroup));
      if (isExactDuplicate) {
        exactDuplicateCount++;
      }
      return !isExactDuplicate;
    });

    console.log(`📊 Stats:`);
    console.log(`  - Discovered: ${discovered.length}`);
    console.log(`  - Already in DB for this scan/group: ${exactDuplicateCount}`);
    console.log(`  - New (to import): ${missing.length}`);
  } catch (error) {
    console.error('❌ Failed to check existing chapters:', error);
    await browser.close();
    rlConfirm.close();
    process.exit(1);
  }

  if (missing.length === 0) {
    console.log('🎉 All discovered chapters already exist in the database! Nothing to do.');
    await browser.close();
    rlConfirm.close();
    process.exit(0);
  }

  const confirm = (await new Promise<string>((resolve) => {
    rlConfirm.question(`\nDo you want to scrape and import these ${missing.length} chapters? (y/n): `, resolve);
  })).trim().toLowerCase();

  rlConfirm.close();

  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('🚫 Cancelled by user. Closing browser.');
    await browser.close();
    process.exit(0);
  }

  console.log('\n🚀 Starting scrape and import process...\n');

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < missing.length; idx++) {
    const ch = missing[idx];
    console.log(`[${idx + 1}/${missing.length}] Processing Chapter ${ch.chapterNumber}...`);

    try {
      // Step 1: Navigate to chapter page
      console.log(`  └─ Opening: ${ch.url}`);
      await page.goto(ch.url, { waitUntil: 'domcontentloaded' });
      
      // Wait a moment for images to render/lazyload
      await new Promise(r => setTimeout(r, 2000));

      // Scroll page down to trigger lazy loading if needed
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(r => setTimeout(r, 1000));

      const chHtml = await page.content();

      // Step 2: Scrape Images
      console.log('  └─ Extracting image URLs...');
      const extractedImages = extractImageUrls(chHtml, ch.url);
      const images = imageUrlPrefix
        ? extractedImages.filter((url) => url.startsWith(imageUrlPrefix))
        : extractedImages;

      console.log(`  └─ Found ${extractedImages.length} images.`);

      if (imageUrlPrefix) {
        console.log(`  └─ Kept ${images.length} images matching the example URL pattern.`);
      }

      if (images.length === 0) {
        throw new Error(
          imageUrlPrefix
            ? 'No images matching the example URL type were found.'
            : 'No images found on chapter page.'
        );
      }

      // Step 3: Insert or Update Chapter
      const targetSlug = buildChapterSlug(ch.chapterNumber, {
        title: ch.title,
        scanlationGroup: scanlationGroup || null,
      });

      let existingChapterQuery = supabase
        .from('chapters')
        .select('id')
        .eq('series_id', seriesId)
        .eq('chapter_number', ch.chapterNumber);

      existingChapterQuery = scanlationGroup
        ? existingChapterQuery.eq('scanlation_group', scanlationGroup)
        : existingChapterQuery.is('scanlation_group', null);

      const { data: existingChapter } = await existingChapterQuery.maybeSingle();

      if (existingChapter) {
        console.log(`  ✅ Chapter ${ch.chapterNumber} already exists in DB. Skipping.\n`);
        successCount++;
      } else {
        // Insert new chapter
        console.log('  └─ Saving new chapter to database...');
        const { data: chapterRecord, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            series_id: seriesId,
            chapter_number: ch.chapterNumber,
            title: ch.title || null,
            slug: targetSlug,
            chapter_type: 'image',
            status: 'published',
            uploaded_by: uploadedBy || null,
            scanlation_group: scanlationGroup || null,
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        // Step 4: Insert Pages
        console.log('  └─ Saving pages to database...');
        const pagesData = images.map((url, imgIdx) => ({
          chapter_id: chapterRecord.id,
          page_number: imgIdx + 1,
          image_url: url,
        }));

        const { error: pagesError } = await supabase.from('chapter_pages').insert(pagesData);
        if (pagesError) throw pagesError;

        console.log(`  ✅ Chapter ${ch.chapterNumber} imported successfully!\n`);
        successCount++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to import Chapter ${ch.chapterNumber}:`, error instanceof Error ? error.message : error);
      console.log();
      failCount++;
    }
  }

  console.log('Closing browser...');
  await browser.close();

  console.log('📊 --- Import Complete --- 📊');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
