import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import readline from 'readline';
import puppeteer from 'puppeteer';
import {
  buildClientChapterLinksHtml,
  extractChapterLinks,
  extractImageUrls,
  extractImagesFromChapterUrl,
} from '../src/lib/chapter-scraper';
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

const isQimanhwaUrl = (url: string): boolean => {
  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase();
    return hostname.includes('qimanhwa.com') || hostname.includes('qiscans.org');
  } catch {
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.includes('qimanhwa.com') || lowercaseUrl.includes('qiscans');
  }
};

const isAsuraUrl = (url: string): boolean => {
  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase();
    return hostname.includes('asurascans.com');
  } catch {
    return url.toLowerCase().includes('asurascans.com');
  }
};

const isNumberedImageUrl = (url: string): boolean => {
  try {
    const filename = new URL(url).pathname.split('/').pop() ?? '';
    return /^(?:page[_-]?)?\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
  } catch {
    return false;
  }
};

const isQimanhwaReaderPageImage = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const filename = parsed.pathname.split('/').pop() ?? '';
    const isNumberedPage = /^(?:page[_-]?)?\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
    const isReaderPath =
      lowercaseUrl.includes('/file/qiscans/upload/rezo/series/') ||
      lowercaseUrl.includes('/rezo/series/') ||
      lowercaseUrl.includes('/file/qiscans/upload/upload/series/') ||
      lowercaseUrl.includes('/upload/upload/series/');

    return isNumberedPage && isReaderPath;
  } catch {
    return false;
  }
};

const filterImagesByExampleUrl = (
  images: string[],
  exampleUrl: string,
  imageUrlPrefix: string | null,
): string[] => {
  if (!exampleUrl || !imageUrlPrefix) return images;

  if (isQimanhwaUrl(exampleUrl)) {
    const numberedReaderImages = images.filter(
      (url) => isQimanhwaUrl(url) && isQimanhwaReaderPageImage(url),
    );
    if (numberedReaderImages.length > 0) return numberedReaderImages;

    const numberedImages = images.filter((url) => isQimanhwaUrl(url) && isNumberedImageUrl(url));
    if (numberedImages.length > 0) return numberedImages;
  }

  const prefixMatches = images.filter((url) => url.startsWith(imageUrlPrefix));
  if (prefixMatches.length > 0) return prefixMatches;

  try {
    const exampleOrigin = new URL(exampleUrl.trim()).origin;
    const originMatches = images.filter((url) => {
      try {
        return new URL(url).origin === exampleOrigin;
      } catch {
        return url.startsWith(exampleOrigin);
      }
    });
    if (originMatches.length > 0) return originMatches;
  } catch {
    // Validation happens before import starts.
  }

  return [];
};

const chapterScanKey = (chapterNumber: number, scanlationGroup: string | null): string => {
  return `${chapterNumber}::${scanlationGroup?.trim() || ''}`;
};

async function scrollChapterPageForLazyImages(page: any): Promise<void> {
  let lastHeight = 0;
  let lastReaderImageCount = 0;
  let stablePasses = 0;

  for (let pass = 0; pass < 3 && stablePasses < 2; pass++) {
    const { height, readerImageCount } = await page.evaluate(() => {
      const readerImageCount = Array.from(document.images).filter((img) => {
        const className = String(img.className || '').toLowerCase();
        const alt = String(img.alt || '').toLowerCase();
        return (
          className.includes('r-page-img') ||
          className.includes('reader') ||
          className.includes('chapter') ||
          alt.startsWith('page ') ||
          (img.naturalWidth >= 500 && img.naturalHeight >= 800)
        );
      }).length;

      return { height: document.body.scrollHeight, readerImageCount };
    });

    if (height === lastHeight && readerImageCount === lastReaderImageCount && readerImageCount > 0) {
      stablePasses++;
    } else {
      stablePasses = 0;
      lastHeight = height;
      lastReaderImageCount = readerImageCount;
    }

    const scrollTarget = Math.max(height, 30000);
    for (let y = 0; y <= scrollTarget; y += 1200) {
      await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function collectLiveReaderImageUrls(page: any): Promise<string[]> {
  try {
    return (await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => {
          const className = String(img.className || '').toLowerCase();
          const alt = String(img.alt || '').toLowerCase();
          return (
            className.includes('r-page-img') ||
            className.includes('reader') ||
            className.includes('chapter') ||
            alt.startsWith('page ') ||
            (img.naturalWidth >= 500 && img.naturalHeight >= 800)
          );
        })
        .flatMap((img) => [
          img.currentSrc,
          img.src,
          img.getAttribute('data-src'),
          img.getAttribute('data-lazy-src'),
          img.getAttribute('data-original'),
        ])
        .filter((value, index, all): value is string =>
          Boolean(value) &&
          (String(value).startsWith('http://') || String(value).startsWith('https://')) &&
          all.indexOf(value) === index,
        ),
    )) as string[];
  } catch (error) {
    console.warn('  - Live reader image collection failed:', error);
    return [];
  }
}

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
    if (isQimanhwaUrl(imageTypeExample)) {
      console.log('Filtering chapter images by Qi Scans numbered reader pages.');
    } else {
      console.log(`Filtering chapter images by URL pattern: ${imageUrlPrefix}`);
    }
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
      console.log('  - Extracting image URLs...');
      let htmlImages: string[] = [];
      let liveImages: string[] = [];

      if (isAsuraUrl(ch.url)) {
        htmlImages = await extractImagesFromChapterUrl(ch.url, {
          imageUrlExample: imageTypeExample,
        });
      } else {
        await page.goto(ch.url, { waitUntil: 'domcontentloaded' });
      
      // Wait and scroll through the reader so client-side lazy images populate currentSrc/src.
      await new Promise(r => setTimeout(r, 2000));
      await scrollChapterPageForLazyImages(page);

      const chHtml = await page.content();

      // Step 2: Scrape Images
      console.log('  └─ Extracting image URLs...');
      htmlImages = extractImageUrls(chHtml, ch.url);
      liveImages = await collectLiveReaderImageUrls(page);
      }
      const extractedImages = Array.from(new Set([...htmlImages, ...liveImages]));
      const images = filterImagesByExampleUrl(extractedImages, imageTypeExample, imageUrlPrefix);

      console.log(`  └─ Found ${extractedImages.length} images.`);

      if (imageUrlPrefix) {
        const filterLabel = isQimanhwaUrl(imageTypeExample)
          ? 'Qi Scans numbered reader pages'
          : 'the example URL pattern';
        console.log(`  └─ Kept ${images.length} images matching ${filterLabel}.`);
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
