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

type ChapterToImport = {
  chapterNumber: number;
  title?: string | null;
  url: string;
};

type ExtractedChapterImages =
  | { chapter: ChapterToImport; images: string[] }
  | { chapter: ChapterToImport; error: string };

const parsePositiveIntegerEnv = (name: string, fallback: number): number => {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const SCRAPE_CONCURRENCY = parsePositiveIntegerEnv('SCRAPE_CONCURRENCY', 4);
const PAGE_INSERT_CHUNK_SIZE = parsePositiveIntegerEnv('SCRAPE_PAGE_INSERT_CHUNK_SIZE', 1000);

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
    return hostname.includes('asura');
  } catch {
    return url.toLowerCase().includes('asura');
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
    // Scroll in smaller steps (800px instead of 1200px) and wait longer (120ms instead of 80ms)
    // to prevent skipping lazy-loaded images or jumping past trigger boundaries too fast.
    for (let y = 0; y <= scrollTarget; y += 800) {
      await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Wait longer at the bottom of the page (2000ms instead of 500ms) to allow slow network assets to finish fetching
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function collectLiveReaderImageUrls(page: any): Promise<string[]> {
  try {
    return (await page.evaluate(() => {
      const imageEntries = Array.from(document.images).map((img, index) => {
        const rect = img.getBoundingClientRect();
        const className = String(img.className || '').toLowerCase();
        const alt = String(img.alt || '').toLowerCase();
        const values = [
          img.currentSrc,
          img.src,
          img.getAttribute('data-src'),
          img.getAttribute('data-lazy-src'),
          img.getAttribute('data-original'),
          ...Array.from(img.attributes)
            .map(attr => attr.value)
            .filter(val => typeof val === 'string' && (val.startsWith('http') || val.startsWith('//') || val.includes('/') || val.includes('.')) && /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(val))
        ].filter(Boolean) as string[];
        const src = String(values[0] || '');
        const lowercaseSrc = src.toLowerCase();
        const filename = (() => {
          try {
            return new URL(src).pathname.split('/').pop()?.toLowerCase() || '';
          } catch {
            return lowercaseSrc.split('/').pop() || '';
          }
        })();
        const isVortexReaderImage =
          lowercaseSrc.includes('storage.vortexscans.org/upload/series/') &&
          !lowercaseSrc.includes('/series/featured/') &&
          /^page[-_]\d{1,4}/i.test(filename);

        return {
          index,
          top: rect.top + window.scrollY,
          width: rect.width || img.width || img.naturalWidth || 0,
          values,
          isVortexReaderImage,
          isGenericReaderImage:
            className.includes('r-page-img') ||
            className.includes('reader') ||
            className.includes('chapter') ||
            alt.startsWith('page ') ||
            (alt.includes('chapter') && alt.includes('page')) ||
            (img.naturalWidth >= 500 && img.naturalHeight >= 800),
        };
      });

      const vortexReaderImages = imageEntries
        .filter((entry) => entry.isVortexReaderImage && entry.width >= 250)
        .sort((a, b) => a.top - b.top || a.index - b.index)
        .flatMap((entry) => entry.values);

      const candidates = vortexReaderImages.length > 0
        ? vortexReaderImages
        : imageEntries
            .filter((entry) => entry.isGenericReaderImage)
            .sort((a, b) => a.top - b.top || a.index - b.index)
            .flatMap((entry) => entry.values);

      return candidates.filter((value, index, all): value is string =>
          Boolean(value) &&
          (String(value).startsWith('http://') || String(value).startsWith('https://')) &&
          all.indexOf(value) === index,
        );
    })) as string[];
  } catch (error) {
    console.warn('  - Live reader image collection failed:', error);
    return [];
  }
}

async function prepareChapterPage(page: any): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

async function extractImagesWithVisibleBrowser(
  browser: any,
  chapter: ChapterToImport,
  imageTypeExample: string,
  imageUrlPrefix: string | null,
): Promise<string[]> {
  const page = await browser.newPage();

  try {
    await prepareChapterPage(page);
    await page.goto(chapter.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait and scroll through the reader so client-side lazy images populate currentSrc/src.
    await new Promise(r => setTimeout(r, 1500));
    await scrollChapterPageForLazyImages(page);

    const chHtml = await page.content();
    const htmlImages = extractImageUrls(chHtml, chapter.url);
    const liveImages = await collectLiveReaderImageUrls(page);
    const extractedImages = Array.from(new Set([...htmlImages, ...liveImages]));
    const images = filterImagesByExampleUrl(extractedImages, imageTypeExample, imageUrlPrefix);

    if (images.length === 0) {
      throw new Error(
        imageUrlPrefix
          ? 'No images matching the example URL type were found.'
          : 'No images found on chapter page.',
      );
    }

    return images;
  } finally {
    await page.close().catch(() => {});
  }
}

async function extractMissingChapterImages(
  browser: any,
  chapters: ChapterToImport[],
  imageTypeExample: string,
  imageUrlPrefix: string | null,
): Promise<ExtractedChapterImages[]> {
  const asuraChapters = chapters.filter((chapter) => isAsuraUrl(chapter.url));
  const browserChapters = chapters.filter((chapter) => !isAsuraUrl(chapter.url));
  const resultsByUrl = new Map<string, ExtractedChapterImages>();

  if (asuraChapters.length > 0) {
    console.log(
      `Extracting ${asuraChapters.length} Asura chapter(s) with ${Math.min(SCRAPE_CONCURRENCY, asuraChapters.length)} request(s)...`,
    );

    const asuraResults = await runPool(asuraChapters, SCRAPE_CONCURRENCY, async (chapter, index) => {
      console.log(`[${index + 1}/${asuraChapters.length}] Extracting Chapter ${chapter.chapterNumber}...`);
      try {
        const extractedImages = await extractImagesFromChapterUrl(chapter.url, {
          imageUrlExample: imageTypeExample,
        });
        const images = filterImagesByExampleUrl(extractedImages, imageTypeExample, imageUrlPrefix);
        if (images.length === 0) {
          throw new Error(
            imageUrlPrefix
              ? 'No images matching the example URL type were found.'
            : 'No images found on chapter page.',
          );
        }
        console.log(`  - Chapter ${chapter.chapterNumber}: found ${images.length} image(s).`);
        return { chapter, images } satisfies ExtractedChapterImages;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to extract images';
        console.error(`  - Chapter ${chapter.chapterNumber}: ${message}`);
        return {
          chapter,
          error: message,
        } satisfies ExtractedChapterImages;
      }
    });

    for (const result of asuraResults) {
      resultsByUrl.set(result.chapter.url, result);
    }
  }

  if (browserChapters.length > 0) {
    console.log(
      `Extracting ${browserChapters.length} browser chapter(s) with ${Math.min(SCRAPE_CONCURRENCY, browserChapters.length)} tab(s)...`,
    );

    const browserResults = await runPool(browserChapters, SCRAPE_CONCURRENCY, async (chapter, index) => {
      console.log(`[${index + 1}/${browserChapters.length}] Extracting Chapter ${chapter.chapterNumber}...`);
      try {
        const images = await extractImagesWithVisibleBrowser(
          browser,
          chapter,
          imageTypeExample,
          imageUrlPrefix,
        );
        console.log(`  - Chapter ${chapter.chapterNumber}: found ${images.length} image(s).`);
        return { chapter, images } satisfies ExtractedChapterImages;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to extract images';
        console.error(`  - Chapter ${chapter.chapterNumber}: ${message}`);
        return { chapter, error: message } satisfies ExtractedChapterImages;
      }
    });

    for (const result of browserResults) {
      resultsByUrl.set(result.chapter.url, result);
    }
  }

  return chapters.map((chapter) =>
    resultsByUrl.get(chapter.url) || { chapter, error: 'Extraction did not run' },
  );
}

async function insertInChunks(tableName: string, rows: any[], chunkSize: number): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).insert(chunk);
    if (error) throw error;
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

  console.log(`Using scrape concurrency: ${SCRAPE_CONCURRENCY}`);
  console.log('Phase 1/2: Extracting chapter images...');
  const extractionResults = await extractMissingChapterImages(
    browser,
    missing,
    imageTypeExample,
    imageUrlPrefix,
  );
  const extracted = extractionResults.filter(
    (result): result is { chapter: ChapterToImport; images: string[] } => 'images' in result,
  );
  const extractionFailures = extractionResults.filter(
    (result): result is { chapter: ChapterToImport; error: string } => 'error' in result,
  );

  failCount += extractionFailures.length;

  if (extractionFailures.length > 0) {
    console.log('\nExtraction failures:');
    extractionFailures.forEach((result) => {
      console.log(`  - Chapter ${result.chapter.chapterNumber}: ${result.error}`);
    });
  }

  if (extracted.length > 0) {
    console.log('\nPhase 2/2: Saving extracted chapters to database...');
    const chapterRows = extracted.map(({ chapter }) => ({
      series_id: seriesId,
      chapter_number: chapter.chapterNumber,
      title: chapter.title || null,
      slug: buildChapterSlug(chapter.chapterNumber, {
        title: chapter.title,
        scanlationGroup: scanlationGroup || null,
      }),
      chapter_type: 'image',
      status: 'published',
      uploaded_by: uploadedBy || null,
      scanlation_group: scanlationGroup || null,
    }));

    const { data: insertedChapters, error: chapterInsertError } = await supabase
      .from('chapters')
      .insert(chapterRows)
      .select('id, chapter_number, scanlation_group');

    if (chapterInsertError) {
      console.error('Failed to bulk insert chapters:', chapterInsertError.message);
      failCount += extracted.length;
    } else {
      const insertedByScanKey = new Map(
        (insertedChapters || []).map((chapter: any) => [
          chapterScanKey(Number(chapter.chapter_number), chapter.scanlation_group),
          chapter.id,
        ]),
      );

      const pageRows = extracted.flatMap(({ chapter, images }) => {
        const chapterId = insertedByScanKey.get(
          chapterScanKey(chapter.chapterNumber, scanlationGroup || null),
        );
        if (!chapterId) return [];

        return images.map((url, imgIdx) => ({
          chapter_id: chapterId,
          page_number: imgIdx + 1,
          image_url: url,
        }));
      });

      try {
        console.log(`Saving ${pageRows.length} page row(s) in chunks of ${PAGE_INSERT_CHUNK_SIZE}...`);
        await insertInChunks('chapter_pages', pageRows, PAGE_INSERT_CHUNK_SIZE);
        successCount = insertedChapters?.length || 0;
        console.log(`Saved ${successCount} chapter(s) successfully.`);
      } catch (error) {
        console.error(
          'Failed to bulk insert pages:',
          error instanceof Error ? error.message : error,
        );
        failCount += extracted.length;
      }
    }
  }

  // The legacy loop below is kept unreachable for easy rollback while the CLI uses the faster bulk path.
  missing = [];

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
