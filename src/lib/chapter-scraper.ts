/* eslint-disable no-useless-escape */
/**
 * Chapter URL scraper - extracts image URLs from manga/manhwa chapter pages
 */
import chromium from '@sparticuz/chromium';
import { assertSafePublicUrl } from './ssrf-guard';

/**
 * Retry an async operation with exponential backoff and jitter.
 * Retries on any thrown error, up to `maxRetries` attempts.
 */
async function retryAsync<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = 2,
  baseDelayMs: number = 3000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const jitter = Math.random() * 1000;
        const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
        console.warn(
          `[Scraper] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
          err instanceof Error ? err.message : err,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export interface ChapterInfo {
  chapterNumber: number;
  title?: string;
  url: string;
  scanGroup?: string;
  time?: string;
}

export interface ExtractChapterImagesOptions {
  imageUrlExample?: string | null;
}

const LIVE_READER_IMAGES_PREFIX = '__LIVE_READER_IMAGES__';

export async function extractChaptersFromSeriesUrl(seriesUrl: string): Promise<ChapterInfo[]> {
  assertSafePublicUrl(seriesUrl);
  try {
    // Custom endpoint/API extraction for Qi Scans / Qi Manga
    if (isQimanhwaLikeUrl(seriesUrl)) {
      try {
        const urlObj = new URL(seriesUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        const slug = parts[parts.length - 1];
        if (slug) {
          console.log(`[Scraper] Using custom API chapters discovery for Qi Scans: ${slug}`);
          // Fetch first page
          const firstPageUrl = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=1&perPage=100`;
          const firstPageRes = await fetch(firstPageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
          });
          if (firstPageRes.ok) {
            const firstPageData = (await firstPageRes.json()) as any;
            const totalPages = Math.max(1, Number(firstPageData.totalPages) || 1);
            let allChaptersRaw = [...(firstPageData.data || [])];
            
            if (totalPages > 1) {
              const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
              const remainingResults = await Promise.all(
                remainingPages.map(async (page) => {
                  try {
                    const pageUrl = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=${page}&perPage=100`;
                    const res = await fetch(pageUrl, {
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                      },
                    });
                    if (res.ok) {
                      const data = (await res.json()) as any;
                      return data.data || [];
                    }
                  } catch (err) {
                    console.warn(`[Scraper] Failed to fetch Qi Scans chapters page ${page}:`, err);
                  }
                  return [];
                })
              );
              allChaptersRaw = allChaptersRaw.concat(remainingResults.flat());
            }

            if (allChaptersRaw.length > 0) {
              const chapters: ChapterInfo[] = allChaptersRaw
                .filter((c: any) => !c.is_locked && !c.locked && !c.is_premium && !c.price && !c.coins)
                .map((c: any) => ({
                  chapterNumber: Number(c.number),
                  title: c.title || undefined,
                  url: `${urlObj.origin}/series/${slug}/${c.slug}`,
                }))
                .filter((c: ChapterInfo) => !isPremiumOrLockedChapter(c));
              return chapters;
            }
          }
        }
      } catch (apiError) {
        console.warn('[Scraper] Qi Scans API chapter extraction failed, falling back to html scraping:', apiError);
      }
    }

    // Custom extraction for Kayn Scans (Next.js RSC streaming & API)
    if (isKaynScansUrl(seriesUrl)) {
      try {
        console.log(`[Scraper] Using custom Kayn Scans chapter extraction for: ${seriesUrl}`);
        const kaynChapters = await extractKaynScansChapters(seriesUrl);
        if (kaynChapters.length > 0) {
          console.log(`[Scraper] Successfully extracted ${kaynChapters.length} free chapters for Kayn Scans (${seriesUrl})`);
          return kaynChapters;
        }
      } catch (kaynErr) {
        console.warn('[Scraper] Custom Kayn Scans chapter extraction failed, falling back to standard extraction:', kaynErr);
      }
    }

    // Custom extraction for Comix.to (stealth Puppeteer bypass & DOM chapter link extraction)
    if (isComixToUrl(seriesUrl)) {
      try {
        console.log(`[Scraper] Using custom Comix.to chapter extraction for: ${seriesUrl}`);
        const comixChapters = await extractComixChapters(seriesUrl);
        if (comixChapters.length > 0) {
          console.log(`[Scraper] Successfully extracted ${comixChapters.length} chapters from Comix.to (${seriesUrl})`);
          return comixChapters;
        }
      } catch (comixErr) {
        console.warn('[Scraper] Custom Comix.to chapter extraction failed:', comixErr);
      }
    }

    // Custom extraction for Vortex Scans (fast server-side hydration & Astro props extraction)
    if (isVortexLikeUrl(seriesUrl)) {
      try {
        console.log(`[Scraper] Using custom Vortex Scans chapter extraction for: ${seriesUrl}`);
        const vortexChapters = await extractVortexChapters(seriesUrl);
        if (vortexChapters.length > 0) {
          console.log(`[Scraper] Successfully extracted ${vortexChapters.length} chapters from Vortex Scans (${seriesUrl})`);
          return vortexChapters;
        }
      } catch (vortexErr) {
        console.warn('[Scraper] Custom Vortex Scans chapter extraction failed, falling back to standard extraction:', vortexErr);
      }
    }

    let html = '';
    let usePuppeteerFallback = false;

    try {
      // Fetch the series page HTML
      const response = await fetch(seriesUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 503) {
          usePuppeteerFallback = true;
        } else {
          throw new Error(`Failed to fetch series page: ${response.status} ${response.statusText}`);
        }
      } else {
        html = await response.text();
        const directChapters = extractChapterLinks(html, seriesUrl);
        if (directChapters.length > 0) {
          return directChapters;
        }
        // Direct fetch didn't find chapters (likely dynamic React/Next.js page like Asura), use Puppeteer
        usePuppeteerFallback = true;
      }
    } catch (fetchError) {
      console.warn('[Scraper] Direct fetch failed, trying Puppeteer fallback:', fetchError);
      usePuppeteerFallback = true;
    }

    if (usePuppeteerFallback) {
      console.log(`[Scraper] URL ${seriesUrl} seems protected or fetch failed. Bypassing with Puppeteer...`);
      html = await scrapeWithPuppeteer(seriesUrl, false);
    }

    // Extract all chapter links from the HTML
    let chapters = extractChapterLinks(html, seriesUrl);

    if (chapters.length === 0) {
      const readableHtml = await fetchReadablePage(seriesUrl);
      if (readableHtml) {
        chapters = extractChapterLinks(readableHtml, seriesUrl);
      }
    }
    
    const freeChapters = chapters.filter((c) => !isPremiumOrLockedChapter(c));
    if (freeChapters.length === 0) {
      throw new Error('No free/unlocked chapters found on the series page. Locked/premium chapters are skipped.');
    }

    return freeChapters;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract chapters: ${error.message}`);
    }
    throw new Error('Failed to extract chapters from series URL');
  }
}

async function fetchReadablePage(url: string): Promise<string | null> {
  try {
    const readerUrl = `https://r.jina.ai/http://${url}`;
    const response = await fetch(readerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain,text/markdown,*/*',
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    return text.length > 0 ? text : null;
  } catch (error) {
    console.warn('[Scraper] Readable-page fallback failed:', error);
    return null;
  }
}

function isProtectedPage(html: string): boolean {
  const lowercaseHtml = html.toLowerCase();
  // Cloudflare block pages usually contain 'ray id', 'challenge-platform', 'just a moment', etc.
  // We check for these specific indicators to avoid false positives on sites that simply use Cloudflare.
  return (
    lowercaseHtml.includes('challenge-platform') ||
    lowercaseHtml.includes('ray id') ||
    lowercaseHtml.includes('ddos protection') ||
    lowercaseHtml.includes('just a moment...') ||
    lowercaseHtml.includes('checking your browser') ||
    (lowercaseHtml.includes('cloudflare') && lowercaseHtml.includes('turnstile')) ||
    (lowercaseHtml.includes('cloudflare') && lowercaseHtml.includes('captcha'))
  );
}

async function scrapeWithPuppeteer(url: string, isChapterPage: boolean = false): Promise<string> {
  assertSafePublicUrl(url);
  console.log(`[Scraper] Launching Puppeteer browser to bypass Cloudflare protection for: ${url}`);
  const puppeteer = await import('puppeteer');
  const chrome = await resolveChromeExecutable(puppeteer.default);
  const isHeadless = process.env.PUPPETEER_HEADLESS !== 'false';
  const launchOptions: any = {
    headless: isHeadless ? (chrome.headless === 'shell' ? 'shell' : true) : false,
    pipe: true,
    args: [
      ...chrome.args.filter((a: string) => a !== '--headless' && !a.startsWith('--window-size')),
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1024,768',
    ],
    defaultViewport: isHeadless ? null : { width: 1024, height: 768 },
  };

  if (chrome.executablePath) {
    console.log('[Scraper] Using Chrome executable at', chrome.executablePath);
    launchOptions.executablePath = chrome.executablePath;
  }

  let browser: Awaited<ReturnType<typeof puppeteer.default.launch>>;
  try {
    browser = await puppeteer.default.launch(launchOptions);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Could not find Chrome')) {
      throw new Error(
        [
          'Chrome is not available for the admin scraper runtime.',
          'Set PUPPETEER_EXECUTABLE_PATH/CHROME_PATH to an installed Chrome binary,',
          'or run `npx puppeteer browsers install chrome` in the same environment that runs the app.',
          `Original error: ${error.message}`,
        ].join(' '),
      );
    }
    throw error;
  }

  try {
    const page = await browser.newPage();
    
    // Enable request interception to block ads, stylesheets, and post-load hijack redirects
    await setupRequestInterception(page, url);

    // Apply anti-detection measures to prevent Cloudflare Turnstile blocks
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`[Scraper] Navigating page to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Adaptively poll for content / images instead of fixed 4000ms delay
    const startWait = Date.now();
    while (Date.now() - startWait < (isChapterPage ? 2000 : 1500)) {
      if (isChapterPage) {
        const imgs = await collectLiveReaderImageUrls(page);
        if (imgs.length >= 5) break;
      } else {
        const text = await page.evaluate(() => document.body.innerText || '');
        if (/chapter\s*\d+/i.test(text)) break;
      }
      await new Promise(r => setTimeout(r, 150));
    }

    if (isChapterPage) {
      // Try to collect images immediately before scrolling
      const immediateUrls = await collectLiveReaderImageUrls(page);
      const immediateImages = filterReaderImagesForSource(immediateUrls, url);
      const isQimanhwa = isQimanhwaLikeUrl(url);
      const isAsura = isAsuraScansUrl(url);
      const isKayn = isKaynScansUrl(url);
      const shouldSkipScroll =
        (isAsura && immediateImages.length > 0) ||
        (isKayn && immediateImages.length > 0) ||
        (!isAsura && !isKayn && ((isQimanhwa && immediateImages.length > 0) || immediateImages.length >= 10));

      if (shouldSkipScroll) {
        console.log(`[Scraper] Collected ${immediateImages.length} images immediately. Skipping scroll.`);
      } else {
        console.log('[Scraper] Triggering lazy-load image scrolling...');
        await scrollChapterPageForLazyImages(page);
      }
    } else {
      // Some series pages render chapter rows client-side and only after scrolling.
      await page.waitForFunction(
        () => /chapter\s*\d+/i.test(document.body.innerText) || document.querySelectorAll('a[href*="chapter"]').length > 0,
        { timeout: 15000 },
      ).catch(() => {});

      const chapterCountInitial = await page.evaluate(() => {
        return (document.body.innerText.match(/chapter\s*\d+/gi) || []).length;
      });

      // Only run scroll stability checks for Vortex pages or pages that have no chapters loaded yet
      if (isVortexLikeUrl(url) || chapterCountInitial === 0) {
        console.log('[Scraper] Triggering series page scrolling for dynamic chapters...');
        let previousChapterCount = chapterCountInitial;
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

          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    const html = await page.content();
    const liveReaderImages = isChapterPage ? await collectLiveReaderImageUrls(page) : [];
    const readerImages = filterReaderImagesForSource(liveReaderImages, url);
    if (isChapterPage && readerImages.length > 0) {
      console.log(`[Scraper] Collected ${readerImages.length} live reader image(s).`);
      return `${LIVE_READER_IMAGES_PREFIX}${JSON.stringify(readerImages)}`;
    }
    const liveImageHtml = liveReaderImages.length > 0
      ? `<script type="application/json">${JSON.stringify(liveReaderImages)}</script>`
      : '';
    const clientChapterHtml = isChapterPage ? '' : await buildClientChapterLinksHtml(page, url);
    return `${html}\n${liveImageHtml}\n${clientChapterHtml}`;
  } catch (error) {
    console.error(`[Scraper] Puppeteer scraping failed for ${url}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrollChapterPageForLazyImages(page: any): Promise<void> {
  console.log('[Scraper] Fast scrolling chapter page for lazy images...');
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 1600;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, scrollHeight);
          resolve();
        }
      }, 30);
    });
  });
  // Brief pause for lazy connections to settle
  await new Promise((resolve) => setTimeout(resolve, 300));
}

async function collectLiveReaderImageUrls(page: any): Promise<string[]> {
  try {
    const urls = await page.evaluate(`
      (() => {
        try {
          const isAsuraPage = location.hostname.toLowerCase().includes('asura');
          if (!isAsuraPage) {
            const scriptEl = document.getElementById('ng-state');
            if (scriptEl && scriptEl.textContent) {
              const state = JSON.parse(scriptEl.textContent);
              const urls = [];
              const search = (obj) => {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj.images)) {
                  for (const img of obj.images) {
                    if (img && typeof img === 'object' && typeof img.url === 'string') {
                      urls.push(img.url);
                    }
                  }
                }
                for (const key of Object.keys(obj)) {
                  search(obj[key]);
                }
              };
              search(state);
              if (urls.length > 0) return urls;
            }
          }
        } catch (e) {
          console.warn('Failed to parse ng-state in browser:', e);
        }

        const isAsuraPage = location.hostname.toLowerCase().includes('asura');

        const imageEntries = Array.from(document.images).map((img, index) => {
          const rect = img.getBoundingClientRect();
          const className = String(img.className || '').toLowerCase();
          const alt = String(img.alt || '').toLowerCase();
          const nw = img.naturalWidth || 0;
          const nh = img.naturalHeight || 0;
          const values = [
            img.currentSrc,
            img.src,
            img.getAttribute('data-src'),
            img.getAttribute('data-lazy-src'),
            img.getAttribute('data-original'),
            ...Array.from(img.attributes)
              .map(attr => attr.value)
              // eslint-disable-next-line no-useless-escape
              .filter(val => typeof val === 'string' && (val.startsWith('http') || val.startsWith('//') || val.includes('/') || val.includes('.')) && /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(val))
          ].filter(Boolean);
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
            (lowercaseSrc.includes('storage.vortexscans.org/upload/series/') ||
             lowercaseSrc.includes('storage.vortexscans.org//upload/series/')) &&
            !lowercaseSrc.includes('/featured/') &&
            !lowercaseSrc.includes('logo') &&
            !lowercaseSrc.includes('avatar') &&
            !lowercaseSrc.includes('banner');

          const isAsuraReaderImage = values.some((val) => {
            const lVal = String(val).toLowerCase();
            return (
              lVal.includes('asura-images/chapters/') ||
              lVal.includes('asura-images/chapters-restored/') ||
              (lVal.includes('asura') && lVal.includes('/chapters/'))
            );
          });

          const isHivetoonReaderImage = img.hasAttribute('data-reader-page-image') ||
            values.some((val) => {
              const lVal = String(val).toLowerCase();
              return (
                lVal.includes('storage.hivetoon.com') &&
                lVal.includes('/public/upload/series/')
              );
            });

          const isKaynReaderImage = values.some((val) => {
            const lVal = String(val).toLowerCase();
            return (
              (lVal.includes('kaynscan') || lVal.includes('/uploads/series/')) &&
              lVal.includes('/uploads/series/')
            );
          });

          return {
            index,
            top: rect.top + window.scrollY,
            width: rect.width || img.width || nw || 0,
            nw,
            nh,
            values,
            isVortexReaderImage,
            isGenericReaderImage:
              className.includes('r-page-img') ||
              className.includes('reader') ||
              className.includes('chapter') ||
              alt.startsWith('page ') ||
              (alt.includes('chapter') && alt.includes('page')) ||
              (nw >= 500 && nh >= 800) ||
              isAsuraReaderImage ||
              isHivetoonReaderImage ||
              isKaynReaderImage
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

        return candidates.filter((value, index, all) =>
          value &&
          (String(value).startsWith('http://') || String(value).startsWith('https://')) &&
          all.indexOf(value) === index
        );
      })()
    `);

    return urls as string[];
  } catch (error) {
    console.warn('[Scraper] Live reader image collection failed:', error);
    return [];
  }
}

async function resolveChromeExecutable(
  puppeteer: typeof import('puppeteer').default,
): Promise<{ executablePath?: string; args: string[]; headless: boolean | 'shell' }> {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { cwd } = await import('node:process');

  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_BIN ||
    process.env.GOOGLE_CHROME_BIN ||
    process.env.CHROME_PATH;

  const candidatePaths = [
    envPath,
    await safePuppeteerExecutablePath(puppeteer),
    await findPuppeteerCacheChrome(),
    await findExecutableOnPath([
      'google-chrome-stable',
      'google-chrome',
      'chromium-browser',
      'chromium',
      'chrome',
    ]),
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean) as string[];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return { executablePath: candidatePath, args: [], headless: true };
    }
  }

  const packagedChromiumErrors: string[] = [];

  try {
    const packagedBinPaths = [
      undefined,
      join(cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin'),
      join(cwd(), 'bin'),
      join(cwd(), '.next', 'server', 'bin'),
      join(cwd(), '.next', 'server', 'node_modules', '@sparticuz', 'chromium', 'bin'),
      '/var/task/bin',
      '/var/task/node_modules/@sparticuz/chromium/bin',
      '/var/task/.next/server/bin',
      '/var/task/.next/server/node_modules/@sparticuz/chromium/bin',
    ];

    for (const packagedBinPath of packagedBinPaths) {
      try {
        const executablePath = await chromium.executablePath(packagedBinPath);

        if (executablePath && existsSync(executablePath)) {
          return {
            executablePath,
            args: chromium.args,
            headless: 'shell',
          };
        }
      } catch (error) {
        packagedChromiumErrors.push(
          `${packagedBinPath ?? 'default package bin'}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        console.warn(
          '[Scraper] Packaged Chromium path unavailable:',
          packagedBinPath ?? 'default package bin',
          error,
        );
      }
    }
  } catch (error) {
    packagedChromiumErrors.push(
      `@sparticuz/chromium import: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.warn('[Scraper] Packaged Chromium fallback unavailable:', error);
  }

  throw new Error(
    [
      'Packaged Chromium is not available in this server runtime.',
      'The scraper cannot fall back to Puppeteer cache on Vercel because Chrome download is skipped during install.',
      'Checked packaged Chromium locations:',
      packagedChromiumErrors.length > 0 ? packagedChromiumErrors.join(' | ') : 'none',
    ].join(' '),
  );
}

async function safePuppeteerExecutablePath(
  puppeteer: typeof import('puppeteer').default,
): Promise<string | undefined> {
  try {
    return await puppeteer.executablePath();
  } catch {
    return undefined;
  }
}

async function findPuppeteerCacheChrome(): Promise<string | undefined> {
  const { existsSync } = await import('node:fs');
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { homedir, tmpdir } = await import('node:os');

  const roots = [
    process.env.PUPPETEER_CACHE_DIR,
    process.env.HOME ? join(process.env.HOME, '.cache', 'puppeteer') : undefined,
    homedir() ? join(homedir(), '.cache', 'puppeteer') : undefined,
    join(tmpdir(), '.cache', 'puppeteer'),
  ].filter(Boolean) as string[];

  const executableNames =
    process.platform === 'win32'
      ? ['chrome.exe']
      : ['chrome', 'chromium', 'headless_shell'];

  for (const root of roots) {
    if (!existsSync(root)) continue;
    const found = await findFirstExecutable(root, executableNames, 5);
    if (found) return found;
  }

  return undefined;
}

async function findFirstExecutable(
  dir: string,
  executableNames: string[],
  maxDepth: number,
): Promise<string | undefined> {
  const { existsSync } = await import('node:fs');
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  if (maxDepth < 0 || !existsSync(dir)) return undefined;

  let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return undefined;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (executableNames.includes(entry.name)) {
      return join(dir, entry.name);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findFirstExecutable(join(dir, entry.name), executableNames, maxDepth - 1);
    if (found) return found;
  }

  return undefined;
}

async function findExecutableOnPath(names: string[]): Promise<string | undefined> {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  const pathValue = process.env.PATH || process.env.Path || '';
  const pathDirs = pathValue.split(process.platform === 'win32' ? ';' : ':').filter(Boolean);
  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
      : [''];

  for (const dir of pathDirs) {
    for (const name of names) {
      for (const ext of extensions) {
        const candidate = join(dir, process.platform === 'win32' && !name.toLowerCase().endsWith(ext.toLowerCase()) ? `${name}${ext}` : name);
        if (existsSync(candidate)) return candidate;
      }
    }
  }

  return undefined;
}

export async function buildClientChapterLinksHtml(page: any, seriesUrl: string): Promise<string> {
  try {
    const parsed = new URL(seriesUrl);
    const isQimanhwa = isQimanhwaLikeUrl(seriesUrl);
    const isVortex = isVortexLikeUrl(seriesUrl);
    const [, section, ...rest] = parsed.pathname.split('/');

    if (isVortex) {
      return await buildVortexChapterLinksHtml(page);
    }

    if (!isQimanhwa || section !== 'series' || rest.length === 0) {
      return '';
    }

    const seriesSlug = decodeURIComponent(rest.join('/'));
    const chapters = (await page.evaluate(async (slug: string) => {
      const all: Array<{ slug: string; number: number; title?: string | null }> = [];
      let pageNumber = 1;
      let next: number | null = 1;

      while (next && pageNumber <= 100) {
        const response = await fetch(
          `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=${pageNumber}&perPage=100`,
        );

        if (!response.ok) {
          break;
        }

        const payload = await response.json() as { data?: any[]; next?: number | null };
        if (Array.isArray(payload.data)) {
          all.push(
            ...payload.data
              .filter((chapter: any) => chapter?.slug && Number.isFinite(Number(chapter?.number)))
              .map((chapter: any) => ({
                slug: String(chapter.slug),
                number: Number(chapter.number),
                title: chapter.title ? String(chapter.title) : null,
              })),
          );
        }

        next = typeof payload.next === 'number' ? payload.next : null;
        pageNumber = next ?? pageNumber + 1;
      }

      return all;
    }, seriesSlug)) as Array<{ slug: string; number: number; title?: string | null }>;

    return chapters
      .map((chapter) => {
        const title = chapter.title ? ` ${chapter.title}` : '';
        const href = `${parsed.origin}/series/${seriesSlug}/${chapter.slug}`;
        return `<a href="${href}">Chapter ${chapter.number}${title}</a>`;
      })
      .join('\n');
  } catch (error) {
    console.warn('[Scraper] Client chapter pagination failed:', error);
    return '';
  }
}

async function buildVortexChapterLinksHtml(page: any): Promise<string> {
  try {
    const chapters = (await page.evaluate(`
      (async () => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const getChapterLinks = () =>
          Array.from(document.querySelectorAll('a[href*="/chapter-"]')).map((anchor) => ({
            href: anchor.href,
            text: anchor.textContent?.replace(/\\s+/g, ' ').trim() || '',
          }));

        let previousCount = 0;
        let stablePasses = 0;

        for (let pass = 0; pass < 30 && stablePasses < 3; pass++) {
          window.scrollTo(0, document.body.scrollHeight);
          await wait(250);

          const clickable = Array.from(document.querySelectorAll('button, [role="button"]')).find(
            (element) => /show\\s*more/i.test(element.textContent || ''),
          );

          if (clickable) {
            clickable.click();
            await wait(900);
          } else {
            await wait(300);
          }

          const count = getChapterLinks().length;
          if (count === previousCount) {
            stablePasses++;
          } else {
            previousCount = count;
            stablePasses = 0;
          }
        }

        return getChapterLinks();
      })()
    `)) as Array<{ href: string; text: string }>;

    return chapters
      .map((chapter) => `<a href="${chapter.href}">${chapter.text || chapter.href}</a>`)
      .join('\n');
  } catch (error) {
    console.warn('[Scraper] Vortex chapter expansion failed:', error);
    return '';
  }
}

function isChapterLink(url: string, text: string): boolean {
  const lowercaseUrl = url.toLowerCase();
  const lowercaseText = text.toLowerCase();

  // Exclude common navigation, utility, or meta pages
  const excludePatterns = [
    /\/user\//, /\/profile\//, /\/genre\//, /\/category\//, /\/tag\//,
    /\/author\//, /\/artist\//, /\/search\//, /\/faq\b/, /\/about\b/,
    /\/contact\b/, /\/terms\b/, /\/privacy\b/, /\/login\b/, /\/register\b/,
    /\/signup\b/, /\/comments?\b/, /\/reviews?\b/, /\/forum\b/, /\/news\b/,
    /\/blog\b/, /\/wp-content\//, /\/assets\//, /\/uploads\//,
  ];

  if (excludePatterns.some(pattern => pattern.test(lowercaseUrl))) {
    return false;
  }

  // A link is likely a chapter if:
  // 1. The URL has chapter/episode/ch/ep keywords or patterns
  const hasChapterKeywordInUrl = 
    lowercaseUrl.includes('chapter') || 
    lowercaseUrl.includes('ch-') || 
    lowercaseUrl.includes('chap-') || 
    lowercaseUrl.includes('episode') || 
    lowercaseUrl.includes('ep-') ||
    /\/ch\/\d+/.test(lowercaseUrl) ||
    /\/ep\/\d+/.test(lowercaseUrl) ||
    /\/chapters\//.test(lowercaseUrl) ||
    /\/chapter[-/]\d+(?:\.\d+)?(?:\/|$)/.test(lowercaseUrl);

  // 2. The text has chapter/episode keywords or matches a chapter number pattern
  const hasChapterKeywordInText = 
    lowercaseText.includes('chapter') || 
    lowercaseText.includes('ch.') || 
    lowercaseText.includes('ch ') || 
    lowercaseText.includes('ch-') || 
    lowercaseText.includes('episode') || 
    lowercaseText.includes('ep ') || 
    lowercaseText.includes('ep-') || 
    /^[c|e]p\.?\s*\d+/i.test(lowercaseText) || 
    lowercaseText.includes('vol.') || 
    lowercaseText.includes('volume') ||
    /^#\s*\d+/.test(lowercaseText) ||
    /^\s*\d+(?:\.\d+)?\s*$/.test(lowercaseText); // Pure number

  // 3. The URL ends with a number (e.g. /123, /120.5, or /123/)
  let cleanPath = lowercaseUrl.split('?')[0].split('#')[0];
  cleanPath = cleanPath.replace(/\.(html|htm|php|asp|aspx)$/i, '');
  const endsWithNumberInUrl = /\/\d+(?:\.\d+)?\s*(?:\/)?$/.test(cleanPath);

  if (hasChapterKeywordInUrl) {
    return true;
  }

  if (hasChapterKeywordInText && (endsWithNumberInUrl || lowercaseUrl.includes('/read/'))) {
    return true;
  }

  // If the text is a pure number or chapter number, and the URL ends with a number
  if (/^\s*\d+(?:\.\d+)?\s*$/.test(lowercaseText) && endsWithNumberInUrl) {
    return true;
  }

  return false;
}

export const PREMIUM_KEYWORDS = [
  "premium", "locked", "paid", "coin", "coins", "point", "points",
  "vip", "paywall", "buy", "purchase", "unlock", "ticket", "tickets",
  "early-access", "early access", "subscribers-only", "subscriber only",
  "fastpass", "fast-pass", "kofi", "patreon", "subscribers", "gems", "gem",
  "rental", "rent",
  "🔒", "🔐", "💰", "💎", "🪙", "🏷️",
];

export function isPremiumOrLockedChapter(chapter: {
  chapterNumber?: number;
  title?: string;
  url: string;
  rawHtml?: string;
}): boolean {
  const titleLower = (chapter.title || "").toLowerCase();
  const urlLower = (chapter.url || "").toLowerCase();
  const rawLower = (chapter.rawHtml || "").toLowerCase();

  // If explicitly marked free / unlocked and has no lock emoji
  if (
    (titleLower.includes("free") || titleLower.includes("unlocked")) &&
    !/[🔒🔐]/.test(titleLower) &&
    !/[🔒🔐]/.test(rawLower)
  ) {
    return false;
  }

  // 1. Keyword checks
  if (PREMIUM_KEYWORDS.some((kw) => titleLower.includes(kw) || urlLower.includes(kw) || rawLower.includes(kw))) {
    return true;
  }

  // 2. Price / currency / lock patterns
  if (
    /\b(?:\d+\s*(?:coins?|points?|gems?|diamonds?|tickets?)|(?:price|cost)\s*[:=]?\s*\d+)\b/i.test(titleLower) ||
    /\b(?:cost|price|buy|\d+\s*(?:coins?|points?|gems?|diamonds?|tickets?))\b/i.test(rawLower)
  ) {
    return true;
  }
  if (/\b(?:locked|unlock\s*with|subscriber\s*only|paid\s*chapter|early\s*access)\b/i.test(titleLower) || /\b(?:locked|unlock\s*with|subscriber\s*only|paid\s*chapter|early\s*access)\b/i.test(rawLower)) {
    return true;
  }

  // 3. HTML attribute patterns
  if (
    /class=["'][^"']*\b(locked|is-locked|lock-icon|chapter-locked|has-lock|paid-chapter|premium-chapter)\b[^"']*["']/i.test(rawLower) ||
    /data-(?:locked|paid|premium)=["']true["']/i.test(rawLower) ||
    /fa-lock|icon-lock|lucide-lock|svg[^>]*lock/i.test(rawLower)
  ) {
    return true;
  }

  return false;
}

export function extractChapterLinks(html: string, baseUrl: string): ChapterInfo[] {
  const chapters: ChapterInfo[] = [];
  const seenUrls = new Set<string>();

  const addChapter = (inputUrl: string, rawText: string) => {
    let url = inputUrl.trim();
    if (!url) return;

    const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Skip chapters that are explicitly locked / coin / buy / unlock / paywalled / premium
    if (isPremiumOrLockedChapter({ url, title: cleanText, rawHtml: rawText })) {
      return;
    }

    if (!isChapterLink(url, cleanText)) {
      return;
    }

    if (!url.startsWith('http')) {
      try {
        const base = new URL(baseUrl);
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else {
          url = new URL(url, base.href).href;
        }
      } catch {
        return;
      }
    }

    // Filter out sidebar / footer recommendations for other series
    try {
      const parsedBase = new URL(baseUrl);
      const baseSlugMatch = parsedBase.pathname.match(/\/(?:series\/comic|series|manga|comic|comics|manhwa|novel)\/([^\/]+)/i);
      if (baseSlugMatch && baseSlugMatch[1]) {
        const baseSlug = baseSlugMatch[1].toLowerCase().replace(/-[a-f0-9]{6,}$/i, '');
        const parsedUrl = new URL(url);
        const urlSlugMatch = parsedUrl.pathname.match(/\/(?:series\/comic|series|manga|comic|comics|manhwa|novel)\/([^\/]+)/i);
        if (urlSlugMatch && urlSlugMatch[1]) {
          const urlSlug = urlSlugMatch[1].toLowerCase().replace(/-[a-f0-9]{6,}$/i, '');
          if (baseSlug && urlSlug && !urlSlug.includes(baseSlug) && !baseSlug.includes(urlSlug)) {
            // Unrelated series chapter from sidebar/recommendations
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    if (seenUrls.has(url)) return;

    const chapterNum = extractChapterNumber(url, cleanText);
    if (chapterNum !== null) {
      seenUrls.add(url);
      const title = extractChapterTitle(cleanText);
      chapters.push({
        chapterNumber: chapterNum,
        title: title || undefined,
        url,
      });
    }
  };

  // Extract all <a> tags with href attributes
  // Matches <a href="..." otherAttrs>content</a> or <a otherAttrs href="...">content</a>
  // Account for spaces around equals sign and single/double/no quotes around URL
  const aTagPattern = /<a\b[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*?>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = aTagPattern.exec(html)) !== null) {
    const url = (match[1] || match[2] || match[3] || '')?.trim();
    const rawContent = match[4] || '';
    addChapter(url, rawContent);
  }

  // Extract Markdown links from readable fallbacks.
  // Example: [Chapter 55](https://site.com/series/title/chapter-55)
  const markdownLinkPattern = /\[([^\]]*chapter[^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi;
  while ((match = markdownLinkPattern.exec(html)) !== null) {
    addChapter(match[2] || '', match[1] || '');
  }

  for (const line of html.split(/\r?\n/)) {
    if (!/chapter\s*\d+/i.test(line)) continue;

    const lineWithoutImages = line.replace(/!\[[^\]]*]\([^)]+\)/g, ' ');
    const lineLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
    let lineMatch;
    while ((lineMatch = lineLinkPattern.exec(lineWithoutImages)) !== null) {
      addChapter(lineMatch[2] || '', lineMatch[1] || '');
    }
  }

  // Also support data-chapter attribute on elements if any
  // E.g., <a data-chapter="1" href="...">Chapter 1</a>
  const dataChapterPattern = /<a\s+[^>]*?data-chapter=["']([^"']*)["'][^>]*?href=["']([^"']*)["'][^>]*?>([\s\S]*?)<\/a>/gi;
  dataChapterPattern.lastIndex = 0;
  while ((match = dataChapterPattern.exec(html)) !== null) {
    let url = match[2]?.trim();
    const dataChap = match[1];
    const rawContent = match[3] || '';

    if (!url || !dataChap) continue;

    // Make URL absolute if relative
    if (!url.startsWith('http')) {
      try {
        const base = new URL(baseUrl);
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else {
          url = new URL(url, base.href).href;
        }
      } catch {
        continue;
      }
    }

    if (seenUrls.has(url)) continue;
    if (isPremiumOrLockedChapter({ url, title: rawContent, rawHtml: rawContent })) continue;

    const chapterNum = parseFloat(dataChap);
    if (!isNaN(chapterNum)) {
      seenUrls.add(url);
      const cleanText = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const title = extractChapterTitle(cleanText);
      chapters.push({
        chapterNumber: chapterNum,
        title: title || undefined,
        url: url,
      });
    }
  }

  // Support Hivetoons embedded JSON data (Hivetoons stores the entire chapter catalog in page script data, SSR only pre-renders top 20 links)
  if (isHivetoonUrl(baseUrl) || (html.includes('storage.hivetoon.com') && html.includes('&quot;slug&quot;:'))) {
    try {
      let hivetoonOrigin = 'https://hivetoons.org';
      let hivetoonSeriesSlug = '';
      try {
        const u = new URL(baseUrl);
        hivetoonOrigin = u.origin;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'series') {
          hivetoonSeriesSlug = parts[1];
        } else {
          hivetoonSeriesSlug = parts[parts.length - 1] || '';
        }
      } catch {}

      const blockRegex = /\[0,\{&quot;id&quot;:\[0,\d+\],&quot;number&quot;:\[0,([0-9.]+)\],&quot;slug&quot;:\[0,&quot;([^&]+)&quot;\](?:,&quot;title&quot;:\[0,&quot;([^&]*)&quot;\])?[\s\S]*?&quot;isAccessible&quot;:\[0,(true|false)\]/g;
      let match: RegExpExecArray | null;
      while ((match = blockRegex.exec(html)) !== null) {
        const chapterNumber = parseFloat(match[1]);
        const chapterSlug = match[2];
        const rawTitle = match[3] || '';
        const isAccessible = match[4] === 'true';

        if (!isAccessible) continue;
        if (isNaN(chapterNumber)) continue;

        const title = rawTitle
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        const chapterUrl = `${hivetoonOrigin}/series/${hivetoonSeriesSlug}/${chapterSlug}`;
        if (!seenUrls.has(chapterUrl)) {
          seenUrls.add(chapterUrl);
          chapters.push({
            chapterNumber,
            title: title || undefined,
            url: chapterUrl,
          });
        }
      }
    } catch (hivetoonErr) {
      console.warn('[Scraper] Failed parsing Hivetoons embedded chapter JSON:', hivetoonErr);
    }
  }

  // Support Kayn Scans embedded RSC / script data if standard HTML link tags were not present
  if ((isKaynScansUrl(baseUrl) || html.includes('kaynscan')) && chapters.length === 0) {
    try {
      const parsedKayn = parseKaynChaptersFromText(html, baseUrl);
      for (const c of parsedKayn) {
        if (!seenUrls.has(c.url)) {
          seenUrls.add(c.url);
          chapters.push(c);
        }
      }
    } catch (kaynErr) {
      console.warn('[Scraper] Failed parsing Kayn Scans embedded text:', kaynErr);
    }
  }

  // Filter out any premium/locked/coin/early-access chapters
  return chapters
    .filter((c) => !isPremiumOrLockedChapter(c))
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}

function extractChapterNumber(url: string, text: string): number | null {
  // Prefer URL slugs first because some chapter cards include metadata in their text
  // (e.g. "Chapter 2 3 months"), which can otherwise be read as chapter 23.
  const urlPatterns = [
    /chapter-(\d+\.?\d*)/i,
    /chapter\/(\d+\.?\d*)/i,
    /ch-(\d+\.?\d*)/i,
    /ch\/(\d+\.?\d*)/i,
    /\/(\d+\.?\d*)(?:\/|$)/,
  ];
  
  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num;
    }
  }

  // Try to extract from text if the URL does not expose a chapter number.
  const textPatterns = [
    /chapter\s*(\d+\.?\d*)/i,
    /ch\.?\s*(\d+\.?\d*)/i,
    /ep\.?\s*(\d+\.?\d*)/i,
    /episode\s*(\d+\.?\d*)/i,
    /#(\d+\.?\d*)/,
    /^\s*(\d+\.?\d*)\s*$/, // Standalone number
  ];
  
  for (const pattern of textPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num;
    }
  }

  return null;
}

function extractChapterTitle(text: string): string | null {
  // Remove "Chapter X" or similar prefixes
  let title = text
    .replace(/chapter\s*\d+\.?\d*\s*[:–-]?\s*/i, '')
    .replace(/ch\.?\s*\d+\.?\d*\s*[:–-]?\s*/i, '')
    .replace(/ep\.?\s*\d+\.?\d*\s*[:–-]?\s*/i, '')
    .replace(/episode\s*\d+\.?\d*\s*[:–-]?\s*/i, '')
    .trim();
  
  // Strip relative timestamps (e.g., "1 day ago", "12 hours ago", "2 mins ago", "1h ago", "36m ago", "11d ago 1")
  title = title
    .replace(/\b\d+\s*(?:seconds?|sec|s|minutes?|min|m|hours?|hr|h|days?|d|weeks?|wk|w|months?|mo|years?|y)\s+ago(?:\s+\d+)?\b/gi, '')
    .trim();

  // Reject purely relative timestamp placeholders if they were the only text
  if (title.length === 0) {
    return null;
  }
  
  // Reject common numeric date formats (e.g. "04/05/2026", "2026-06-05")
  if (/^\s*\d{1,4}[-/\s.]\d{1,2}[-/\s.]\d{1,4}\s*$/.test(title)) {
    return null;
  }
  
  // Reject wordy dates (e.g. "January 15, 2026", "Jan 15, 2026")
  if (/^\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\s*$/.test(title)) {
    return null;
  }

  return title.length > 0 && title.length < 100 ? title : null;
}

export async function extractImagesFromChapterUrl(
  chapterUrl: string,
  options: ExtractChapterImagesOptions = {},
): Promise<string[]> {
  assertSafePublicUrl(chapterUrl);
  if (isPremiumOrLockedChapter({ url: chapterUrl })) {
    console.warn(`[Scraper] Chapter URL ${chapterUrl} is flagged as premium/locked. Skipping image extraction.`);
    return [];
  }
  try {
    // 1. Direct Qi Scans / Qi Manga JSON API Extraction (instant & 100% reliable)
    if (isQimanhwaLikeUrl(chapterUrl)) {
      try {
        const urlObj = new URL(chapterUrl);
        const segments = urlObj.pathname.split('/').filter(Boolean);
        // Usually /series/:seriesSlug/:chapterSlug
        if (segments.length >= 2) {
          const chapterSlug = segments[segments.length - 1];
          const seriesSlug = segments[segments.length - 2];
          const apiUrl = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(seriesSlug)}/chapters/${encodeURIComponent(chapterSlug)}`;
          const apiRes = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(15_000),
          });

          if (apiRes.ok) {
            const apiData = (await apiRes.json()) as any;
            const rawImages = apiData?.data?.images || apiData?.images;
            if (Array.isArray(rawImages) && rawImages.length > 0) {
              const sorted = [...rawImages].sort((a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0));
              const imageUrls = sorted
                .map((img: any) => (typeof img === 'string' ? img : img?.url))
                .filter((url: any): url is string => typeof url === 'string' && url.length > 0);

              if (imageUrls.length > 0) {
                console.log(`[Scraper] Successfully extracted ${imageUrls.length} chapter images for Qi Scans via official API (${seriesSlug}/${chapterSlug})`);
                return imageUrls;
              }
            }
          }
        }
      } catch (qiErr) {
        console.warn('[Scraper] Qi Scans direct API chapter extraction error, falling back to HTML/Puppeteer:', qiErr);
      }
    }

    // Direct Kayn Scans RSC extraction (fast, ordered, and skips client-side bloat)
    if (isKaynScansUrl(chapterUrl)) {
      try {
        console.log(`[Scraper] Using custom Kayn Scans image extraction for: ${chapterUrl}`);
        const kaynImages = await extractKaynScansChapterImages(chapterUrl);
        if (kaynImages.length > 0) {
          console.log(`[Scraper] Successfully extracted ${kaynImages.length} images for Kayn Scans (${chapterUrl})`);
          return kaynImages;
        }
      } catch (kaynErr) {
        console.warn('[Scraper] Kayn Scans custom image extraction error, falling back to HTML/Puppeteer:', kaynErr);
      }
    }

    // Custom extraction for Comix.to chapter reader pages
    if (isComixToUrl(chapterUrl)) {
      try {
        console.log(`[Scraper] Using custom Comix.to reader image extraction for: ${chapterUrl}`);
        const comixImages = await extractComixChapterImages(chapterUrl);
        if (comixImages.length > 0) {
          console.log(`[Scraper] Successfully extracted ${comixImages.length} images for Comix.to (${chapterUrl})`);
          return comixImages;
        }
      } catch (comixErr) {
        console.warn('[Scraper] Comix.to reader image extraction error:', comixErr);
      }
    }

    // Custom extraction for Vortex Scans reader pages (fast direct image extraction from server HTML)
    if (isVortexLikeUrl(chapterUrl)) {
      try {
        console.log(`[Scraper] Using custom Vortex Scans image extraction for: ${chapterUrl}`);
        const vortexImages = await extractVortexChapterImages(chapterUrl);
        if (vortexImages.length > 0) {
          console.log(`[Scraper] Successfully extracted ${vortexImages.length} images for Vortex Scans (${chapterUrl})`);
          return vortexImages;
        }
      } catch (vortexErr) {
        console.warn('[Scraper] Custom Vortex Scans image extraction failed, falling back to standard extraction:', vortexErr);
      }
    }

    let html = '';
    let usePuppeteerFallback = false;
    const imageUrlExample = options.imageUrlExample?.trim() || '';

    try {
      // Fetch the chapter page HTML
      const response = await fetch(chapterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 503) {
          usePuppeteerFallback = true;
        } else {
          throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
        }
      } else {
        html = await response.text();
        const exampleModeImages = extractImageUrls(html, chapterUrl);
        const exampleMatches = findImagesMatchingExampleUrl(exampleModeImages, imageUrlExample);
        const sourceImages = filterReaderImagesForSource(exampleModeImages, chapterUrl, imageUrlExample);
        if (exampleMatches.length > 0) {
          return exampleMatches;
        }

        if (sourceImages.length > 0) {
          return sourceImages;
        }

        if (isProtectedPage(html)) {
          usePuppeteerFallback = true;
        } else {
          const usesClientRenderedReader =
            isQimanhwaLikeUrl(chapterUrl) ||
            isAsuraScansUrl(chapterUrl) ||
            isVortexLikeUrl(chapterUrl) ||
            isVortexLikeUrl(imageUrlExample) ||
            isHivetoonUrl(chapterUrl) ||
            isHivetoonUrl(imageUrlExample);

          if (usesClientRenderedReader) {
            usePuppeteerFallback = true;
          }
        }
      }
    } catch (fetchError) {
      console.warn('[Scraper] Direct fetch failed, trying Puppeteer fallback:', fetchError);
      usePuppeteerFallback = true;
    }

    if (usePuppeteerFallback) {
      console.log(`[Scraper] URL ${chapterUrl} seems protected or fetch failed. Bypassing with Puppeteer...`);
      html = await scrapeWithPuppeteer(chapterUrl, true);
    }

    if (html.startsWith(LIVE_READER_IMAGES_PREFIX)) {
      const images = JSON.parse(html.slice(LIVE_READER_IMAGES_PREFIX.length));
      if (Array.isArray(images) && images.every((url) => typeof url === 'string')) {
        return filterReaderImagesForSource(images, chapterUrl, imageUrlExample);
      }
    }
    
    // Extract all image URLs from the HTML
    const images = filterReaderImagesForSource(extractImageUrls(html, chapterUrl), chapterUrl, imageUrlExample);
    
    if (images.length === 0) {
      throw new Error('No images found on the chapter page. Please check the URL or use manual URL input.');
    }

    return images;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract images: ${error.message}`);
    }
    throw new Error('Failed to extract images from chapter URL');
  }
}

export async function extractImagesFromChapterUrls(
  chapterUrls: string[],
  options: { concurrency?: number; imageUrlExample?: string | null } = {},
): Promise<Map<string, string[]>> {
  const uniqueUrls = Array.from(new Set(chapterUrls)).filter(
    (url) => !isPremiumOrLockedChapter({ url })
  );
  const results = new Map<string, string[]>();
  const failedUrls: string[] = [];

  const concurrency = Math.max(1, options.concurrency ?? 4);
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const chunk = uniqueUrls.slice(i, i + concurrency);
    await Promise.allSettled(
      chunk.map(async (url) => {
        try {
          const images = await retryAsync(
            () => extractImagesFromChapterUrl(url, options),
            `Direct extraction for ${url}`,
          );
          if (images && images.length > 0) {
            results.set(url, images);
          } else {
            failedUrls.push(url);
          }
        } catch {
          failedUrls.push(url);
        }
      }),
    );
  }

  const browserUrls = failedUrls.filter((url) => shouldUseSharedReaderBrowser(url, options.imageUrlExample));
  if (browserUrls.length === 0) return results;

  const browserResults = await extractReaderImagesWithSharedBrowser(browserUrls, {
    concurrency: options.concurrency ?? 4,
    imageUrlExample: options.imageUrlExample,
  });
  browserResults.forEach((images, url) => results.set(url, images));

  return results;
}

async function extractReaderImagesWithSharedBrowser(
  urls: string[],
  options: { concurrency: number; imageUrlExample?: string | null },
): Promise<Map<string, string[]>> {
  console.log(`[Scraper] Launching one shared browser for ${urls.length} reader chapter(s)...`);
  const puppeteer = await import('puppeteer');
  const chrome = await resolveChromeExecutable(puppeteer.default);
  const isHeadless = process.env.PUPPETEER_HEADLESS === 'true';
  const launchOptions: any = {
    headless: isHeadless ? (chrome.headless === 'shell' ? 'shell' : true) : false,
    pipe: true,
    args: [
      ...chrome.args.filter((a: string) => a !== '--headless' && !a.startsWith('--window-size')),
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1024,768',
    ],
    defaultViewport: isHeadless ? null : { width: 1024, height: 768 },
  };

  if (chrome.executablePath) {
    launchOptions.executablePath = chrome.executablePath;
  }

  const browser = await puppeteer.default.launch(launchOptions);
  const results = new Map<string, string[]>();
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < urls.length) {
      const url = urls[nextIndex++];
      await retryAsync(
        async () => {
          const page = await browser.newPage();
          try {
            await prepareScraperPage(page);
            await setupRequestInterception(page, url);
            console.log(`[Scraper] Shared reader browser extracting: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            // Adaptively poll for reader images instead of a long fixed delay
            const maxWaitMs = isAsuraScansUrl(url) ? 2000 : 1000;
            const pollStart = Date.now();
            let immediateImages: string[] = [];
            while (Date.now() - pollStart < maxWaitMs) {
              immediateImages = filterReaderImagesForSource(
                preferImagesMatchingExampleUrl(await collectLiveReaderImageUrls(page), options.imageUrlExample),
                url,
                options.imageUrlExample,
              );
              if (immediateImages.length >= 5) break;
              await new Promise((r) => setTimeout(r, 150));
            }

            const isQimanhwa = isQimanhwaLikeUrl(url);
            const isAsura = isAsuraScansUrl(url);
            const shouldSkipScroll =
              (isAsura && immediateImages.length > 0) ||
              (!isAsura && ((isQimanhwa && immediateImages.length > 0) || immediateImages.length >= 10));

            if (shouldSkipScroll) {
              console.log(`[Scraper] Found ${immediateImages.length} images immediately. Skipping scroll.`);
              results.set(url, immediateImages);
            } else {
              await scrollChapterPageForLazyImages(page);

              const images = filterReaderImagesForSource(
                preferImagesMatchingExampleUrl(await collectLiveReaderImageUrls(page), options.imageUrlExample),
                url,
                options.imageUrlExample,
              );
              if (images.length === 0) {
                const html = await page.content();
                const htmlImages = filterReaderImagesForSource(
                  preferImagesMatchingExampleUrl(extractImageUrls(html, url), options.imageUrlExample),
                  url,
                  options.imageUrlExample,
                );
                if (htmlImages.length === 0) {
                  // Check if the page is paywalled / locked
                  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase() || '');
                  const isPaywalled = /unlock|locked|coins?|buy\s+chapter|early\s+access|premium\s+chapter|subscription\s+required/i.test(bodyText);
                  if (isPaywalled) {
                    console.warn(`[Scraper] Chapter at ${url} is locked or requires unlocking. Skipping.`);
                    results.set(url, []);
                    return;
                  }
                  throw new Error('No images found on the chapter page.');
                }
                results.set(url, htmlImages);
              } else {
                results.set(url, images);
              }
            }
          } finally {
            await page.close().catch(() => {});
          }
        },
        `Shared browser extraction for ${url}`,
      );
    }
  };

  try {
    const workerCount = Math.max(1, Math.min(options.concurrency, urls.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  } finally {
    await browser.close();
  }
}

async function setupRequestInterception(page: any, url: string): Promise<void> {
  await page.setRequestInterception(true);
  let targetHost = '';
  try {
    targetHost = new URL(url).hostname.replace('www.', '');
  } catch {
    // Ignore invalid URL
  }

  page.on('request', (request: any) => {
    const resourceType = request.resourceType();
    const requestUrl = request.url();

    const isAdOrAnalytics =
      requestUrl.includes('google-analytics') ||
      requestUrl.includes('doubleclick') ||
      requestUrl.includes('adsystem') ||
      requestUrl.includes('adnxs') ||
      requestUrl.includes('popads') ||
      requestUrl.includes('popunder') ||
      requestUrl.includes('adskeeper') ||
      requestUrl.includes('mgid') ||
      requestUrl.includes('exoclick') ||
      requestUrl.includes('a-ads') ||
      requestUrl.includes('juicyads');

    const isAsura = isAsuraScansUrl(url);
    if (
      (resourceType === 'stylesheet' && !isAsura) ||
      resourceType === 'font' ||
      resourceType === 'media' ||
      isAdOrAnalytics
    ) {
      request.abort();
      return;
    }

    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      if (requestUrl === url) {
        request.continue();
        return;
      }

      try {
        const reqHost = new URL(requestUrl).hostname.replace('www.', '');
        const isRelated =
          !targetHost ||
          reqHost.includes(targetHost) ||
          targetHost.includes(reqHost) ||
          request.redirectChain().length > 0;

        if (!isRelated) {
          console.log(`[Scraper] Aborting hijack navigation to: ${requestUrl}`);
          request.abort();
          return;
        }
      } catch {
        request.abort();
        return;
      }
    }

    request.continue();
  });
}

async function prepareScraperPage(page: any): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });
}

function extractImagesFromNgState(html: string): string[] {
  try {
    const match = html.match(/<script\b[^>]*?id=["']ng-state["'][^>]*?>([\s\S]*?)<\/script>/i);
    if (!match) return [];
    
    let rawJson = match[1].trim();
    if (!rawJson) return [];
    
    rawJson = rawJson
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");

    const state = JSON.parse(rawJson);
    const urls: string[] = [];
    
    const search = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (Array.isArray(obj.images)) {
        for (const img of obj.images) {
          if (img && typeof img === 'object' && typeof img.url === 'string') {
            urls.push(img.url);
          }
        }
      }
      
      for (const key of Object.keys(obj)) {
        search(obj[key]);
      }
    };
    
    search(state);
    return urls;
  } catch (error) {
    console.warn('[Scraper] Failed to parse ng-state JSON:', error);
    return [];
  }
}

function extractImagesFromMetaTags(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  // Match <meta itemprop="image" content="..."> tags
  const metaPattern = /<meta\b[^>]*?itemprop\s*=\s*["']image["'][^>]*?content\s*=\s*["']([^"']+)["'][^>]*?\/?>/gi;
  // Also match reversed attribute order: content before itemprop
  const metaPatternReversed = /<meta\b[^>]*?content\s*=\s*["']([^"']+)["'][^>]*?itemprop\s*=\s*["']image["'][^>]*?\/?>/gi;

  for (const pattern of [metaPattern, metaPatternReversed]) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1]?.trim();
      if (!url) continue;

      if (!url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          if (url.startsWith('//')) {
            url = `https:${url}`;
          } else {
            url = new URL(url, base.href).href;
          }
        } catch {
          continue;
        }
      }

      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }

  return images;
}

export function extractImageUrls(html: string, baseUrl: string): string[] {
  // Hivetoons: extract from <meta itemprop="image" content="..."> tags (SEO structured data)
  // Hivetoons stores ALL chapter images in hidden <figure> elements with <meta> tags,
  // not in <img> tags. The reader <img> tags are rendered client-side by Astro islands.
  const metaTagImages = extractImagesFromMetaTags(html, baseUrl);
  if (metaTagImages.length > 0) {
    const hivetoonImages = metaTagImages.filter(isHivetoonReaderPageImage);
    if (hivetoonImages.length > 0) {
      return hivetoonImages;
    }
  }

  // First try to extract from Angular's transferState JSON if present (common for Qi Manga / Qi Scans)
  const ngStateUrls = extractImagesFromNgState(html);
  if (ngStateUrls.length > 0) {
    const images = ngStateUrls.map(url => {
      if (!url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          if (url.startsWith('//')) {
            return `https:${url}`;
          } else {
            return new URL(url, base.href).href;
          }
        } catch {
          return null;
        }
      }
      return url;
    }).filter((url): url is string => !!url);

    const uniqueNgImages = [...new Set(images)];
    const validNgImages = uniqueNgImages.filter(url => {
      const lowercaseBaseUrl = baseUrl.toLowerCase();
      const lowercaseUrl = url.toLowerCase();
      
      const isQimanhwa =
        isQimanhwaLikeUrl(baseUrl) ||
        isQimanhwaLikeUrl(url);
      if (isQimanhwa) {
        return isQimanhwaReaderPageImage(url);
      }
      return true;
    });

    if (validNgImages.length > 0) {
      return validNgImages;
    }
  }

  const images: string[] = [];
  const imageRegexPatterns = [
    // Common manga reader image patterns
    /<img[^>]+src=["']([^"']+)["'][^>]*class=["'][^"']*page[^"']*["']/gi,
    /<img[^>]+class=["'][^"']*page[^"']*["'][^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+data-src=["']([^"']+)["'][^>]*class=["'][^"']*page[^"']*["']/gi,
    /<img[^>]+class=["'][^"']*chapter-img[^"']*["'][^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["'][^>]*class=["'][^"']*chapter-img[^"']*["']/gi,
    // Lazy loading patterns
    /<img[^>]+data-lazy-src=["']([^"']+)["']/gi,
    /<img[^>]+data-original=["']([^"']+)["']/gi,
    /<img[^>]+data-src=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi,
    /<img[^>]+data-cdn=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi,
    // Generic patterns for manga reader images (look for sequential images)
    /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi,
  ];

  // Try each regex pattern
  for (const pattern of imageRegexPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      if (!url) continue;

      // Filter out small images, icons, and non-content images
      const lowercaseUrl = url.toLowerCase();
      if (
        !lowercaseUrl.includes('logo') && 
        !lowercaseUrl.includes('icon') && 
        !lowercaseUrl.includes('avatar') && 
        !lowercaseUrl.includes('banner') &&
        !lowercaseUrl.includes('placeholder') &&
        !lowercaseUrl.includes('thumb') &&
        !lowercaseUrl.includes('cover')
      ) {
        // Resolve relative URL
        if (!url.startsWith('http')) {
          try {
            const base = new URL(baseUrl);
            if (url.startsWith('//')) {
              url = `https:${url}`;
            } else {
              url = new URL(url, base.href).href;
            }
          } catch {
            continue;
          }
        }
        
        if (!images.includes(url)) {
          images.push(url);
        }
      }
    }
  }

  // Also try to find images in script tags (some sites load images via JS)
  const scriptRegex = /["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    let url = match[1];
    if (url) {
      // Resolve relative URL
      if (!url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          if (url.startsWith('//')) {
            url = `https:${url}`;
          } else {
            url = new URL(url, base.href).href;
          }
        } catch {
          continue;
        }
      }

      const lowercaseUrl = url.toLowerCase();
      if (
        !lowercaseUrl.includes('logo') && 
        !lowercaseUrl.includes('icon') && 
        !lowercaseUrl.includes('avatar') &&
        !lowercaseUrl.includes('banner') &&
        !lowercaseUrl.includes('placeholder') &&
        !lowercaseUrl.includes('thumb') &&
        !lowercaseUrl.includes('cover') &&
        !images.includes(url)
      ) {
        images.push(url);
      }
    }
  }

  // Remove duplicates and filter valid URLs
  const validImages = [...new Set(images)].filter(url => {
    try {
      new URL(url);
      const lowercaseBaseUrl = baseUrl.toLowerCase();
      const lowercaseUrl = url.toLowerCase();
      
      // If scraping from Asura, only allow reader page image URL families.
      const isAsura = lowercaseBaseUrl.includes('asura') || lowercaseUrl.includes('asura');
      if (isAsura) {
        const isKnownAsuraImage = 
          lowercaseUrl.includes('asura-images/chapters/') ||
          lowercaseUrl.includes('asura-images/chapters-restored/') ||
          lowercaseUrl.includes('storage/media/') ||
          lowercaseUrl.includes('wp-content/uploads/') ||
          isNumberedImageFilename(new URL(url).pathname.split('/').pop() ?? '');
          
        if (!isKnownAsuraImage) {
          return false;
        }
      }

      // If scraping from elftoon.com / elftoon.xyz, only allow URLs of the pattern: /wp-content/uploads/
      const isElftoon = 
        lowercaseBaseUrl.includes('elftoon.com') || 
        lowercaseBaseUrl.includes('elftoon.xyz') || 
        lowercaseUrl.includes('elftoon.xyz') || 
        lowercaseUrl.includes('elftoon.com');
      if (isElftoon && !lowercaseUrl.includes('/wp-content/uploads/')) {
        return false;
      }

      const isQimanhwa =
        isQimanhwaLikeUrl(baseUrl) ||
        isQimanhwaLikeUrl(url);
      if (isQimanhwa) {
        return isQimanhwaReaderPageImage(url);
      }
      
      return true;
    } catch {
      return false;
    }
  });

  return validImages;
}

function preferImagesMatchingExampleUrl(images: string[], exampleUrl?: string | null): string[] {
  const matches = findImagesMatchingExampleUrl(images, exampleUrl);
  return matches.length > 0 ? matches : images;
}

function shouldUseSharedReaderBrowser(url: string, exampleUrl?: string | null): boolean {
  return true;
}

function filterReaderImagesForSource(
  images: string[],
  pageUrl: string,
  exampleUrl?: string | null,
): string[] {
  const uniqueImages = Array.from(new Set(images));
  const exampleMatches = findImagesMatchingExampleUrl(uniqueImages, exampleUrl);
  const sourceImages = exampleMatches.length > 0 ? exampleMatches : uniqueImages;

  if (isQimanhwaLikeUrl(pageUrl) || isQimanhwaLikeUrl(exampleUrl || '')) {
    return selectChapterImageCluster(sourceImages.filter(isQimanhwaReaderPageImage), pageUrl, exampleUrl);
  }

  if (isAsuraScansUrl(pageUrl) || isAsuraScansUrl(exampleUrl || '')) {
    // Asura uses random hexadecimal filenames. Generic cluster scoring treats
    // those filenames as unrelated families and can collapse a full chapter
    // to only one or two images. The DOM/source list is already reader-ordered.
    return sourceImages.filter(isAsuraReaderPageImage);
  }

  if (isHivetoonUrl(pageUrl) || isHivetoonUrl(exampleUrl || '')) {
    // Hivetoons uses image_{n}_{hash}.webp filenames. The images from meta tags
    // or the DOM are already in the correct reading order.
    return sourceImages.filter(isHivetoonReaderPageImage);
  }

  if (isKaynScansUrl(pageUrl) || isKaynScansUrl(exampleUrl || '')) {
    // Kayn Scans uses UUID filenames like p-6247461e-5129-40be-a735-9b5684e60237.webp.
    // Generic cluster scoring treats UUID filenames as unrelated families.
    // The extracted list is already reader-ordered.
    return sourceImages.filter(isKaynReaderPageImage);
  }

  if (isVortexLikeUrl(pageUrl) || isVortexLikeUrl(exampleUrl || '')) {
    return sourceImages.filter(isVortexReaderPageImage);
  }

  return selectChapterImageCluster(
    sourceImages.filter((url) => isLikelyChapterReaderImage(url, pageUrl, exampleUrl)),
    pageUrl,
    exampleUrl,
  );
}

function findImagesMatchingExampleUrl(images: string[], exampleUrl?: string | null): string[] {
  const cleanExampleUrl = exampleUrl?.trim();
  if (!cleanExampleUrl) return [];

  if (isQimanhwaLikeUrl(cleanExampleUrl)) {
    const numberedReaderImages = images.filter(
      (url) => isQimanhwaLikeUrl(url) && isQimanhwaReaderPageImage(url),
    );
    if (numberedReaderImages.length > 0) return numberedReaderImages;
  }

  if (isAsuraScansUrl(cleanExampleUrl)) {
    const asuraImages = images.filter((url) => isAsuraReaderPageImage(url));
    if (asuraImages.length > 0) return asuraImages;
  }

  if (isHivetoonUrl(cleanExampleUrl)) {
    const hivetoonImages = images.filter((url) => isHivetoonReaderPageImage(url));
    if (hivetoonImages.length > 0) return hivetoonImages;
  }

  if (isKaynScansUrl(cleanExampleUrl)) {
    const kaynImages = images.filter((url) => isKaynReaderPageImage(url));
    if (kaynImages.length > 0) return kaynImages;
  }

  if (isVortexLikeUrl(cleanExampleUrl)) {
    const vortexImages = images.filter(isVortexReaderPageImage);
    if (vortexImages.length > 0) return vortexImages;
  }

  const exampleFamily = getImageUrlFamilyPrefix(cleanExampleUrl);
  if (exampleFamily) {
    const prefixMatches = images.filter((url) => url.startsWith(exampleFamily));
    if (prefixMatches.length > 0) return prefixMatches;
  }

  const typePrefix = getImageUrlTypePrefix(cleanExampleUrl);
  if (typePrefix) {
    const typeMatches = images.filter(
      (url) => url.startsWith(typePrefix) && isLikelyChapterReaderImage(url, '', cleanExampleUrl),
    );
    if (typeMatches.length > 0) return typeMatches;
  }

  try {
    const origin = new URL(cleanExampleUrl).origin;
    return images.filter((url) => {
      try {
        return new URL(url).origin === origin && isLikelyChapterReaderImage(url, '', cleanExampleUrl);
      } catch {
        return url.startsWith(origin) && isLikelyChapterReaderImage(url, '', cleanExampleUrl);
      }
    });
  } catch {
    return [];
  }
}

function getImageUrlFamilyPrefix(exampleUrl: string): string | null {
  try {
    const parsed = new URL(exampleUrl.trim());
    const filename = parsed.pathname.split('/').pop() ?? '';
    if (!isNumberedImageFilename(filename)) return null;

    return `${parsed.origin}${parsed.pathname.slice(0, -filename.length)}`;
  } catch {
    return null;
  }
}

function getImageUrlTypePrefix(exampleUrl: string): string | null {
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
}

function isLikelyChapterReaderImage(url: string, pageUrl: string = '', exampleUrl?: string | null): boolean {
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const filename = parsed.pathname.split('/').pop() ?? '';
    const lowercasePageUrl = pageUrl.toLowerCase();
    const lowercaseExampleUrl = (exampleUrl || '').toLowerCase();
    const sameExampleOrigin =
      !!exampleUrl &&
      (() => {
        try {
          return new URL(exampleUrl).origin === parsed.origin;
        } catch {
          return false;
        }
      })();

    // Custom check for Hivetoons
    if (isHivetoonUrl(url)) {
      return isHivetoonReaderPageImage(url);
    }

    // Custom check for Vortex Scans
    if (isVortexLikeUrl(url) || isVortexLikeUrl(pageUrl) || isVortexLikeUrl(exampleUrl || '')) {
      return isVortexReaderPageImage(url);
    }

    // Custom check for Kayn Scans
    if (isKaynScansUrl(url) || isKaynScansUrl(pageUrl) || isKaynScansUrl(exampleUrl || '')) {
      return isKaynReaderPageImage(url);
    }

    // Custom check for Elftoon
    const isElftoon =
      lowercaseUrl.includes('elftoon.com') ||
      lowercaseUrl.includes('elftoon.xyz') ||
      lowercasePageUrl.includes('elftoon.com') ||
      lowercasePageUrl.includes('elftoon.xyz') ||
      lowercaseExampleUrl.includes('elftoon.com') ||
      lowercaseExampleUrl.includes('elftoon.xyz');

    if (isElftoon) {
      const isUploads = lowercaseUrl.includes('/wp-content/uploads/');
      const hasNumberPrefix = /^\d+/.test(filename);
      const isImage = isReaderImageFile(filename);
      if (isUploads && hasNumberPrefix && isImage) {
        return true;
      }
    }

    if (!isReaderImageFile(filename)) return false;
    if (isNonChapterImageUrl(lowercaseUrl)) return false;
    if (isLikelyUiAssetPath(parsed.pathname)) return false;
    if (isNumberedImageFilename(filename)) return true;
    if (hasPageNumberInImageFilename(filename) && hasReaderPathHint(lowercaseUrl)) return true;
    if (sameExampleOrigin && hasReaderPathHint(lowercaseUrl)) return true;
    if (hasReaderPathHint(lowercaseUrl) && hasChapterNumberNearImagePath(parsed.pathname)) return true;
    if (lowercasePageUrl && sameHost(url, pageUrl) && hasReaderPathHint(lowercaseUrl)) return true;
    if (lowercasePageUrl && sameHost(url, pageUrl) && hasUploadPathHint(lowercaseUrl)) return true;
    if (lowercaseExampleUrl && sameHost(url, exampleUrl || '') && hasReaderPathHint(lowercaseUrl)) return true;
    if (lowercaseExampleUrl && sameHost(url, exampleUrl || '') && hasUploadPathHint(lowercaseUrl)) return true;

    return false;
  } catch {
    return false;
  }
}

function isReaderImageFile(filename: string): boolean {
  return /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(filename);
}

function isNumberedImageFilename(filename: string): boolean {
  return /^(?:page[_-]?)?\d{1,4}(?:[_-]\d{1,4})?\.(?:jpe?g|png|webp)$/i.test(filename);
}

function hasPageNumberInImageFilename(filename: string): boolean {
  return /(?:^|[-_])(?:page[-_]?)?\d{1,4}(?:[-_]\d{1,6})?\.(?:jpe?g|png|webp)$/i.test(filename);
}

function hasReaderPathHint(lowercaseUrl: string): boolean {
  return (
    lowercaseUrl.includes('/chapter') ||
    lowercaseUrl.includes('/chapters') ||
    lowercaseUrl.includes('/read') ||
    lowercaseUrl.includes('/reader') ||
    lowercaseUrl.includes('/manga') ||
    lowercaseUrl.includes('/manhwa') ||
    lowercaseUrl.includes('/series') ||
    lowercaseUrl.includes('/upload/')
  );
}

function hasChapterNumberNearImagePath(pathname: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  return parts.some((part) => /^(?:chapter[-_ ]?)?\d+(?:\.\d+)?$/i.test(part));
}

function isNonChapterImageUrl(lowercaseUrl: string): boolean {
  return (
    lowercaseUrl.includes('logo') ||
    lowercaseUrl.includes('icon') ||
    lowercaseUrl.includes('avatar') ||
    lowercaseUrl.includes('banner') ||
    lowercaseUrl.includes('brand') ||
    lowercaseUrl.includes('button') ||
    lowercaseUrl.includes('captcha') ||
    lowercaseUrl.includes('comment') ||
    lowercaseUrl.includes('placeholder') ||
    lowercaseUrl.includes('preview') ||
    lowercaseUrl.includes('promo') ||
    lowercaseUrl.includes('recommend') ||
    lowercaseUrl.includes('related') ||
    lowercaseUrl.includes('sprite') ||
    lowercaseUrl.includes('thumb') ||
    lowercaseUrl.includes('thumbnail') ||
    lowercaseUrl.includes('cover') ||
    lowercaseUrl.includes('/ads/') ||
    lowercaseUrl.includes('/advert') ||
    lowercaseUrl.includes('/banners/') ||
    lowercaseUrl.includes('/covers/') ||
    lowercaseUrl.includes('/icons/') ||
    lowercaseUrl.includes('/logos/') ||
    lowercaseUrl.includes('/profiles/') ||
    lowercaseUrl.includes('/profile/') ||
    // Blacklisted static promo/banner image hashes
    lowercaseUrl.includes('ebbb7aa3-e6a7-4e7a-8841-2de84d8026e9') ||
    lowercaseUrl.includes('fecb6dc2-5e7f-4d5d-80e5-99c3e1c2bfd8') ||
    lowercaseUrl.includes('26436e08-1b05-4c54-bd83-6dfeb75ea597') ||
    lowercaseUrl.includes('1f823395-2e70-4437-8395-cb709812f899') ||
    lowercaseUrl.includes('ffedf8d5-3365-4e34-84d4-8796937dfec2') ||
    lowercaseUrl.includes('45edc923-884e-4163-a52b-d9b5383ec672') ||
    lowercaseUrl.includes('tcfynnpqjt') ||
    (lowercaseUrl.includes('vortexscans') && (lowercaseUrl.includes('/upload/20') || lowercaseUrl.includes('//upload/20')))
  );
}

function hasUploadPathHint(lowercaseUrl: string): boolean {
  return (
    lowercaseUrl.includes('/wp-content/uploads/') ||
    lowercaseUrl.includes('/uploads/') ||
    lowercaseUrl.includes('/upload/')
  );
}

function isLikelyUiAssetPath(pathname: string): boolean {
  const parts = pathname.toLowerCase().split('/').filter(Boolean);
  return parts.some((part) =>
    /^(?:ads?|avatars?|banners?|brand|covers?|icons?|logos?|previews?|profiles?|recommendations?|related|sprites?|thumbs?|thumbnails?)$/.test(part),
  );
}

function selectChapterImageCluster(
  images: string[],
  pageUrl: string = '',
  exampleUrl?: string | null,
): string[] {
  const uniqueImages = Array.from(new Set(images)).filter((url) =>
    isLikelyChapterReaderImage(url, pageUrl, exampleUrl) ||
    isQimanhwaReaderPageImage(url) ||
    isAsuraReaderPageImage(url) ||
    isHivetoonReaderPageImage(url) ||
    isKaynReaderPageImage(url),
  );

  if (uniqueImages.length <= 2) return uniqueImages;

  const groups = new Map<string, string[]>();
  for (const image of uniqueImages) {
    const key = getReaderImageClusterKey(image);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(image);
    groups.set(key, group);
  }

  const rankedGroups = Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      group,
      score: scoreReaderImageCluster(group, key, exampleUrl),
    }))
    .sort((a, b) => b.score - a.score || b.group.length - a.group.length);

  const best = rankedGroups[0];
  if (!best || best.group.length < 2) return uniqueImages;

  return best.group.sort(compareReaderImageOrder);
}

function getReaderImageClusterKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const filename = parts.pop() ?? '';
    const filenameStem = filename.replace(/\.(?:jpe?g|png|webp)(?:[?#].*)?$/i, '');
    const normalizedStem = filenameStem
      .replace(/\d{1,8}/g, '#')
      .replace(/#+/g, '#')
      .replace(/^#$/, 'page-#');
    return `${parsed.origin}/${parts.join('/')}/${normalizedStem}`;
  } catch {
    return null;
  }
}

function scoreReaderImageCluster(group: string[], key: string, exampleUrl?: string | null): number {
  let score = group.length * 10;
  const lowerKey = key.toLowerCase();
  if (hasReaderPathHint(lowerKey)) score += 20;
  if (group.some((url) => isNumberedImageFilename(new URL(url).pathname.split('/').pop() ?? ''))) score += 12;
  if (group.some((url) => hasPageNumberInImageFilename(new URL(url).pathname.split('/').pop() ?? ''))) score += 8;

  if (exampleUrl) {
    const exampleKey = getReaderImageClusterKey(exampleUrl);
    if (exampleKey && exampleKey === key) score += 40;
    if (sameHost(group[0] ?? '', exampleUrl)) score += 12;
  }

  if (group.some((url) => isNonChapterImageUrl(url.toLowerCase()))) score -= 50;
  return score;
}

function compareReaderImageOrder(first: string, second: string): number {
  const firstNumber = extractReaderImageOrderNumber(first);
  const secondNumber = extractReaderImageOrderNumber(second);
  if (firstNumber !== null && secondNumber !== null && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }
  return first.localeCompare(second);
}

function extractReaderImageOrderNumber(url: string): number | null {
  try {
    const filename = new URL(url).pathname.split('/').pop() ?? '';
    const match = filename.match(/(?:page[-_]?)?(\d{1,4})(?:[-_]\d{1,6})?\.(?:jpe?g|png|webp)$/i);
    return match?.[1] ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function sameHost(firstUrl: string, secondUrl: string): boolean {
  try {
    return new URL(firstUrl).hostname === new URL(secondUrl).hostname;
  } catch {
    return false;
  }
}

function isQimanhwaReaderPageImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const filename = parsed.pathname.split('/').pop() ?? '';
    const isNumberedPage = /^(?:page[_-]?)?\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
    const isReaderPath =
      lowercaseUrl.includes('/file/qiscans/upload/rezo/series/') ||
      lowercaseUrl.includes('/rezo/series/') ||
      lowercaseUrl.includes('/file/qiscans/upload/upload/series/') ||
      lowercaseUrl.includes('/upload/upload/series/') ||
      lowercaseUrl.includes('/file/qiscans/upload/series/') ||
      lowercaseUrl.includes('/upload/series/') ||
      lowercaseUrl.includes('/uploads/series/') ||
      lowercaseUrl.includes('quantumscans') ||
      lowercaseUrl.includes('/file/qimanga/upload/series/') ||
      lowercaseUrl.includes('/file/qiscans/upload/') ||
      lowercaseUrl.includes('/file/qimanga/upload/') ||
      lowercaseUrl.includes('/qimanga/rezo/series/');

    return isNumberedPage && isReaderPath;
  } catch {
    return false;
  }
}

function isAsuraReaderPageImage(url: string): boolean {
  try {
    const lowercaseUrl = url.toLowerCase();
    const filename = new URL(url).pathname.split('/').pop() ?? '';
    const isReaderPath =
      lowercaseUrl.includes('asura-images/chapters/') ||
      lowercaseUrl.includes('asura-images/chapters-restored/') ||
      lowercaseUrl.includes('storage/media/') ||
      lowercaseUrl.includes('wp-content/uploads/') ||
      (lowercaseUrl.includes('asura') && lowercaseUrl.includes('/chapters/'));
    const isImageFile = /\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(filename);
    return (isReaderPath || isNumberedImageFilename(filename)) && isImageFile;
  } catch {
    return false;
  }
}

function isQimanhwaLikeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname.includes('qimanhwa.com') ||
      hostname.includes('qiscans.org') ||
      hostname.includes('qimanga.com')
    );
  } catch {
    const lowercaseUrl = url.toLowerCase();
    return (
      lowercaseUrl.includes('qimanhwa.com') ||
      lowercaseUrl.includes('qiscans.org') ||
      lowercaseUrl.includes('qimanga.com')
    );
  }
}

function isAsuraScansUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes('asura');
  } catch {
    return url.toLowerCase().includes('asura');
  }
}

function isVortexLikeUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('vortexscans') || hostname.includes('vortex');
  } catch {
    return url.toLowerCase().includes('vortexscans') || url.toLowerCase().includes('vortex');
  }
}

function isVortexReaderPageImage(url: string): boolean {
  try {
    const lowercaseUrl = url.toLowerCase();
    const isVortexStorage = lowercaseUrl.includes('storage.vortexscans.org') || lowercaseUrl.includes('vortexscans.org');
    const isSeriesUpload = lowercaseUrl.includes('/upload/series/') || lowercaseUrl.includes('/uploads/series/');
    const isExcluded =
      lowercaseUrl.includes('/featured/') ||
      lowercaseUrl.includes('logo') ||
      lowercaseUrl.includes('avatar') ||
      lowercaseUrl.includes('banner') ||
      lowercaseUrl.includes('cover') ||
      lowercaseUrl.includes('favicon');
    return isVortexStorage && isSeriesUpload && !isExcluded;
  } catch {
    return false;
  }
}

function isHivetoonUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes('hivetoon');
  } catch {
    return url.toLowerCase().includes('hivetoon');
  }
}

function isHivetoonReaderPageImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const filename = parsed.pathname.split('/').pop() ?? '';
    const isHivetoonStorage = lowercaseUrl.includes('storage.hivetoon.com');
    const isSeriesPath = lowercaseUrl.includes('/upload/series/');
    const isReaderImage = 
      /^(?:image|page|\d+)/i.test(filename) && 
      /\.(?:jpe?g|png|webp)$/i.test(filename);
    return isHivetoonStorage && isSeriesPath && isReaderImage;
  } catch {
    return false;
  }
}

function isKaynScansUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname.includes('kaynscans') ||
      hostname.includes('kaynscan') ||
      hostname.includes('kayncomics')
    );
  } catch {
    const lower = url.toLowerCase();
    return lower.includes('kaynscans') || lower.includes('kaynscan');
  }
}

function isKaynReaderPageImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    const isKaynDomain = isKaynScansUrl(url);
    const isUploadPath = pathname.includes('/uploads/series/') || pathname.includes('/upload/series/');
    const isImage = /\.(?:jpe?g|png|webp|avif)(?:$|[?#])/i.test(pathname);
    return (isKaynDomain || isUploadPath) && isUploadPath && isImage;
  } catch {
    const lower = url.toLowerCase();
    return lower.includes('/uploads/series/') && /\.(?:jpe?g|png|webp|avif)/i.test(lower);
  }
}

function parseKaynChaptersFromText(rscText: string, baseUrl: string): ChapterInfo[] {
  const cleanBase = baseUrl.split('?')[0].replace(/\/+$/, '');
  const list: ChapterInfo[] = [];
  const seen = new Set<number>();

  // 1. Try parsing full structured chapters JSON array if present
  const arrayMatch = rscText.match(/"chapters":\s*(\[\{.*?"id":\s*"kayn-c-.*?\}[^\]]*\])/);
  if (arrayMatch) {
    try {
      const arr = JSON.parse(arrayMatch[1]);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const num = typeof item.number === 'number' ? item.number : parseFloat(item.number);
          const isLocked = Boolean(item.isLocked);
          const coinPrice = typeof item.coinPrice === 'number' ? item.coinPrice : parseFloat(item.coinPrice || '0');
          if (isNaN(num) || isLocked || coinPrice > 0 || seen.has(num)) continue;
          seen.add(num);
          list.push({
            chapterNumber: num,
            title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : undefined,
            url: `${cleanBase}/chapter/${num}`,
          });
        }
      }
    } catch {}
  }

  // 2. Regex to catch all chapter objects in streaming RSC payload
  if (list.length === 0) {
    const chRegex = /\{"id":"([^"]+)","number":([0-9.]+)(?:,"title":(null|"[^"]*"))?[^{}]*?"isLocked":(true|false)(?:,"coinPrice":([0-9.]+))?[^{}]*?\}/g;
    let match: RegExpExecArray | null;

    while ((match = chRegex.exec(rscText)) !== null) {
      const num = parseFloat(match[2]);
      const titleRaw = match[3];
      const isLocked = match[4] === 'true';
      const coinPrice = match[5] ? parseFloat(match[5]) : 0;

      if (isLocked || coinPrice > 0) continue;
      if (isNaN(num) || seen.has(num)) continue;
      seen.add(num);

      let title: string | undefined;
      if (titleRaw && titleRaw !== 'null') {
        try {
          title = JSON.parse(titleRaw);
        } catch {
          title = titleRaw.replace(/^"|"$/g, '');
        }
      }

      list.push({
        chapterNumber: num,
        title: title || undefined,
        url: `${cleanBase}/chapter/${num}`,
      });
    }
  }

  // 3. Fallback: match any "number":<num>,"title":...,"isLocked":false objects
  if (list.length === 0) {
    const genericRegex = /"number":\s*([0-9.]+)[^{}]*?"isLocked":\s*(false|true)/g;
    let m: RegExpExecArray | null;
    while ((m = genericRegex.exec(rscText)) !== null) {
      const num = parseFloat(m[1]);
      const isLocked = m[2] === 'true';
      if (!isLocked && !isNaN(num) && !seen.has(num)) {
        seen.add(num);
        list.push({
          chapterNumber: num,
          url: `${cleanBase}/chapter/${num}`,
        });
      }
    }
  }

  return list;
}

async function extractKaynScansChapters(seriesUrl: string): Promise<ChapterInfo[]> {
  const res = await fetch(seriesUrl, {
    headers: {
      'RSC': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Kayn Scans series page: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const canonicalBaseUrl = (res.url || seriesUrl).split('?')[0].replace(/\/+$/, '');

  const allChapters = parseKaynChaptersFromText(text, canonicalBaseUrl);
  const seen = new Set<number>(allChapters.map((c) => c.chapterNumber));

  // Check pagination if totalPages > 1
  const totalPagesMatch = text.match(/"totalPages":\s*([0-9]+)/);
  const totalPages = Math.min(30, Math.max(1, totalPagesMatch ? parseInt(totalPagesMatch[1], 10) : 1));

  if (totalPages > 1) {
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const additionalPayloads = await Promise.all(
      pageNumbers.map(async (page) => {
        try {
          const pageRes = await fetch(`${canonicalBaseUrl}?page=${page}`, {
            headers: {
              'RSC': '1',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*',
            },
            signal: AbortSignal.timeout(15_000),
          });
          if (pageRes.ok) {
            return await pageRes.text();
          }
        } catch (err) {
          console.warn(`[Scraper] Failed to fetch Kayn Scans chapters page ${page}:`, err);
        }
        return '';
      }),
    );

    for (const payload of additionalPayloads) {
      if (payload) {
        const moreChapters = parseKaynChaptersFromText(payload, canonicalBaseUrl);
        for (const ch of moreChapters) {
          if (!seen.has(ch.chapterNumber)) {
            seen.add(ch.chapterNumber);
            allChapters.push(ch);
          }
        }
      }
    }
  }

  // Fallback: If RSC stream gave 0 chapters, try HTML self.__next_f or API
  if (allChapters.length === 0) {
    try {
      const segments = new URL(canonicalBaseUrl).pathname.split('/').filter(Boolean);
      const slug = segments[segments.length - 1];
      if (slug) {
        const apiRes = await fetch(`https://kaynscans.com/api/series?q=${encodeURIComponent(slug)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (apiRes.ok) {
          const apiJson = (await apiRes.json()) as any;
          const seriesItem = (apiJson?.data || []).find((s: any) => s.slug === slug || s.urlSlug === slug) || apiJson?.data?.[0];
          if (seriesItem?.chapters && Array.isArray(seriesItem.chapters)) {
            for (const ch of seriesItem.chapters) {
              const num = Number(ch.number);
              if (!ch.isLocked && !ch.coinPrice && !isNaN(num) && !seen.has(num)) {
                seen.add(num);
                allChapters.push({
                  chapterNumber: num,
                  title: ch.title || undefined,
                  url: `${canonicalBaseUrl}/chapter/${num}`,
                });
              }
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn('[Scraper] Kayn Scans API fallback failed:', apiErr);
    }
  }

  const freeChapters = allChapters.filter((c) => !isPremiumOrLockedChapter(c));
  // Sort descending by chapterNumber (latest chapter first, standard for scraper imports)
  freeChapters.sort((a, b) => b.chapterNumber - a.chapterNumber);
  return freeChapters;
}

async function extractKaynScansChapterImages(chapterUrl: string): Promise<string[]> {
  const origin = new URL(chapterUrl).origin;
  const res = await fetch(chapterUrl, {
    headers: {
      'RSC': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Kayn Scans chapter: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const canonicalOrigin = res.url ? new URL(res.url).origin : origin;

  // 1. Extract from the structured pages JSON array
  const pagesMatch = text.match(/"pages":\s*(\[\{.*?"imageUrl".*?\}\])/);
  if (pagesMatch) {
    try {
      const pages = JSON.parse(pagesMatch[1]);
      if (Array.isArray(pages) && pages.length > 0) {
        pages.sort((a: any, b: any) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0));
        const urls = pages
          .map((p: any) => (typeof p.imageUrl === 'string' ? p.imageUrl.trim() : ''))
          .filter((u: string) => u.length > 0)
          .map((u: string) => (u.startsWith('http') ? u : `${canonicalOrigin}${u.startsWith('/') ? '' : '/'}${u}`));
        if (urls.length > 0) return urls;
      }
    } catch {}
  }

  // 2. Regex for pageNumber and imageUrl objects
  const pageRegex = /\{"id":"[^"]+","pageNumber":(\d+)[^{}]*?"imageUrl":"([^"]+)"/g;
  const matches = [...text.matchAll(pageRegex)];
  if (matches.length > 0) {
    const sorted = matches
      .map((m) => ({ pageNumber: parseInt(m[1], 10), imageUrl: m[2].trim() }))
      .filter((p) => p.imageUrl.length > 0)
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => (p.imageUrl.startsWith('http') ? p.imageUrl : `${canonicalOrigin}${p.imageUrl.startsWith('/') ? '' : '/'}${p.imageUrl}`));
    if (sorted.length > 0) return sorted;
  }

  // 3. Fallback regex for /uploads/series/... paths in the RSC text
  const rawMatches = text.match(/\/uploads\/series\/[^"'\\\s]+\.(?:webp|jpe?g|png|avif)/gi);
  if (rawMatches && rawMatches.length > 0) {
    const unique = Array.from(new Set(rawMatches));
    return unique.map((u) => `${canonicalOrigin}${u.startsWith('/') ? '' : '/'}${u}`);
  }

  // 4. Fallback: fetch standard HTML if RSC had no images
  try {
    const htmlRes = await fetch(chapterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (htmlRes.ok) {
      const htmlText = await htmlRes.text();
      const htmlMatches = htmlText.match(/\/uploads\/series\/[^"'\\\s]+\.(?:webp|jpe?g|png|avif)/gi);
      if (htmlMatches && htmlMatches.length > 0) {
        const unique = Array.from(new Set(htmlMatches));
        return unique.map((u) => `${canonicalOrigin}${u.startsWith('/') ? '' : '/'}${u}`);
      }
    }
  } catch {}

  return [];
}

export function isComixToUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().includes('comix.to');
  } catch {
    return url.toLowerCase().includes('comix.to');
  }
}

export interface ComixGroupInfo {
  id: number;
  name: string;
  slug?: string | null;
}

export interface ComixChapterExtractionResult {
  chapters: ChapterInfo[];
  groups: ComixGroupInfo[];
}

export async function extractComixChaptersWithGroups(
  seriesUrl: string,
  options?: { groupId?: number | string; maxPages?: number },
): Promise<ComixChapterExtractionResult> {
  const puppeteer = await import('puppeteer');
  const chrome = await resolveChromeExecutable(puppeteer.default);
  const isHeadless = process.env.PUPPETEER_HEADLESS !== 'false';
  const launchOptions: any = {
    headless: isHeadless ? (chrome.headless === 'shell' ? 'shell' : true) : false,
    pipe: true,
    args: [
      ...chrome.args.filter((a: string) => a !== '--headless' && !a.startsWith('--window-size')),
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
    ],
    defaultViewport: isHeadless ? null : { width: 1280, height: 800 },
  };

  if (chrome.executablePath) {
    launchOptions.executablePath = chrome.executablePath;
  }

  const browser = await puppeteer.default.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );

    let targetUrl = seriesUrl;
    if (options?.groupId !== undefined && options.groupId !== 'all' && Number(options.groupId) >= 0) {
      try {
        const urlObj = new URL(seriesUrl);
        urlObj.searchParams.set('group_id', String(options.groupId));
        targetUrl = urlObj.toString();
      } catch {
        targetUrl = seriesUrl.includes('?')
          ? `${seriesUrl}&group_id=${options.groupId}`
          : `${seriesUrl}?group_id=${options.groupId}`;
      }
    }

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    if (page.url().includes('@waf/challenge')) {
      const solved = await solveComixWafCaptchaIfNeeded(page);
      if (solved) {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      }
    }
    await page.waitForSelector('.mchap-list, a[href*="-chapter-"]', { timeout: 15000 }).catch(() => {});

    // 1. Extract scan groups from <script id="initial-data">
    const groups: ComixGroupInfo[] = await page.evaluate(() => {
      const el = document.getElementById('initial-data');
      if (!el) return [];
      try {
        const json = JSON.parse(el.textContent || '{}');
        for (const [k, v] of Object.entries(json.queries || {})) {
          if (k.includes('"manga","groups"') && Array.isArray(v)) {
            return (v as any[]).map((g) => ({
              id: Number(g.id),
              name: String(g.name || 'Unknown group'),
              slug: g.slug || null,
            }));
          }
        }
      } catch {}
      return [];
    });

    // 2. Paginate and collect all chapters
    const allChapters: ChapterInfo[] = [];
    const maxPages = options?.maxPages || 40;
    const seenUrls = new Set<string>();

    for (let p = 1; p <= maxPages; p++) {
      const chaptersOnPage: ChapterInfo[] = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.mchap-item'));
        return items.map((el) => {
          const link = (el.querySelector('a.mchap-row__primary') || el.querySelector('a[href*="-chapter-"]')) as HTMLAnchorElement | null;
          const chEl = el.querySelector('.mchap-row__ch') as HTMLElement | null;
          const titleEl = el.querySelector('.mchap-row__title') as HTMLElement | null;
          const groupEl = el.querySelector('.mchap-row__group') as HTMLElement | null;
          const timeEl = el.querySelector('.mchap-row__time') as HTMLElement | null;
          const href = link ? link.href : '';
          const m = href.match(/-chapter-([0-9.]+)/i);
          const num = m ? parseFloat(m[1]) : 0;
          const groupName = groupEl ? groupEl.innerText.trim() : (el.querySelector('.is-official') ? 'Official' : 'Comix');
          const titleText = titleEl ? titleEl.innerText.trim() : (chEl ? chEl.innerText.trim() : `Chapter ${num}`);
          return {
            chapterNumber: num,
            title: titleText,
            url: href,
            scanGroup: groupName,
            time: timeEl ? timeEl.innerText.trim() : undefined,
          };
        });
      });

      if (chaptersOnPage.length === 0) {
        // Fallback: collect any generic chapter links if custom .mchap-item was not found
        const fallback = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="-chapter-"]')) as HTMLAnchorElement[];
          return links.map((a) => {
            const m = a.href.match(/-chapter-([0-9.]+)/i);
            const num = m ? parseFloat(m[1]) : 0;
            return {
              chapterNumber: num,
              title: a.innerText.trim() || `Chapter ${num}`,
              url: a.href,
              scanGroup: 'Comix',
            };
          });
        });
        for (const ch of fallback) {
          if (ch.url && !seenUrls.has(ch.url)) {
            seenUrls.add(ch.url);
            allChapters.push(ch);
          }
        }
        break;
      }

      for (const ch of chaptersOnPage) {
        if (ch.url && !seenUrls.has(ch.url)) {
          seenUrls.add(ch.url);
          allChapters.push(ch);
        }
      }

      // Click Next page button if available
      const firstHref = chaptersOnPage[0]?.url || '';
      const hasNext = await page.evaluate(() => {
        const nextBtn = document.querySelector('.npager button[aria-label="Next page"]') as HTMLButtonElement | null;
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
            const first = (document.querySelector('.mchap-item a.mchap-row__primary') ||
              document.querySelector('.mchap-item a[href*="-chapter-"]')) as HTMLAnchorElement | null;
            return first && first.href !== oldHref;
          },
          { timeout: 3500 },
          firstHref,
        )
        .catch(() => new Promise((r) => setTimeout(r, 600)));
    }

    allChapters.sort((a, b) => b.chapterNumber - a.chapterNumber);
    return { chapters: allChapters, groups };
  } finally {
    await browser.close();
  }
}

async function extractComixChapters(seriesUrl: string): Promise<ChapterInfo[]> {
  const res = await extractComixChaptersWithGroups(seriesUrl);
  return res.chapters;
}

async function solveComixWafCaptchaIfNeeded(page: any): Promise<boolean> {
  const currentUrl = page.url();
  if (!currentUrl.includes('@waf/challenge')) return false;

  console.log('[ComixScraper] Encountered WAF rotation captcha. Solving automatically in-browser...');
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
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
    const thumbRing: number[][] = [];
    const mainRing: number[][] = [];

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

    console.log(`[ComixScraper] Computed best angle ${bestAngle}° for captcha ${data.captcha_id}. Submitting...`);

    const verifyResult = await page.evaluate(async (payload: any) => {
      const res = await fetch('/@waf/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    }, { captcha_id: data.captcha_id, angle: bestAngle });

    if (verifyResult && verifyResult.success) {
      console.log('[ComixScraper] Captcha verified successfully!');
      return true;
    }
  } catch (err) {
    console.warn('[ComixScraper] Auto captcha solver warning:', err);
  }
  return false;
}

async function extractComixChapterImages(chapterUrl: string): Promise<string[]> {
  const puppeteer = await import('puppeteer');
  const chrome = await resolveChromeExecutable(puppeteer.default);
  const isHeadless = process.env.PUPPETEER_HEADLESS !== 'false';
  const launchOptions: any = {
    headless: isHeadless ? (chrome.headless === 'shell' ? 'shell' : true) : false,
    pipe: true,
    args: [
      ...chrome.args.filter((a: string) => a !== '--headless' && !a.startsWith('--window-size')),
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1024,768',
    ],
    defaultViewport: isHeadless ? null : { width: 1024, height: 768 },
  };

  if (chrome.executablePath) {
    launchOptions.executablePath = chrome.executablePath;
  }

  const browser = await puppeteer.default.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );

    // Capture image network requests in real-time as the reader lazy-loads them
    const networkImages: string[] = [];
    page.on('response', (res) => {
      try {
        const u = res.url();
        if (
          (u.includes('wowpic') || u.includes('/i5/') || u.includes('static.comix.to')) &&
          !u.includes('avatar') &&
          !u.includes('logo') &&
          !u.includes('icon')
        ) {
          if (!networkImages.includes(u)) {
            networkImages.push(u);
          }
        }
      } catch {}
    });

    await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    if (page.url().includes('@waf/challenge')) {
      const solved = await solveComixWafCaptchaIfNeeded(page);
      if (solved) {
        await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 35000 });
      }
    }
    await page.waitForSelector('.rpage-page__img, .rpage-page', { timeout: 15000 }).catch(() => {});

    // Progressive auto-scroll to trigger virtualized reader lazy loading for all chapter pages
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let currentPos = 0;
        const step = 900;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          currentPos += step;
          const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          if (currentPos >= maxScroll + 3000) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
    });

    // Brief pause to allow the final images to mount
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const domImages = await page.evaluate(() => {
      const imgs = Array.from(
        document.querySelectorAll('.rpage-page__img, img[src*="wowpic"], img[src*="static.comix.to"]'),
      );
      return imgs
        .map((i: any) => i.src || i.currentSrc)
        .filter(
          (src: string) =>
            src &&
            src.startsWith('http') &&
            !src.includes('avatar') &&
            !src.includes('logo') &&
            !src.includes('icon'),
        );
    });

    // Merge network-captured and DOM-extracted images in sequence
    const merged: string[] = [];
    for (const img of networkImages) {
      if (!merged.includes(img)) merged.push(img);
    }
    for (const img of domImages) {
      if (!merged.includes(img)) merged.push(img);
    }

    return merged;
  } finally {
    await browser.close();
  }
}

async function extractVortexChapters(seriesUrl: string): Promise<ChapterInfo[]> {
  const urlObj = new URL(seriesUrl);
  const response = await fetch(seriesUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Vortex series page: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  const chapters: ChapterInfo[] = [];
  const seenSlugs = new Set<string>();

  // 1. Primary: Parse embedded hydration data from Astro island props
  const regex = /&quot;id&quot;:\[0,(\d+)\],&quot;number&quot;:\[0,([0-9.]+)\],&quot;slug&quot;:\[0,&quot;([^&]+)&quot;\],(?:&quot;title&quot;:\[0,(?:&quot;([^&]+)&quot;|null)\],)?/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const num = parseFloat(m[2]);
    const slug = m[3];
    const rawTitle = m[4];
    const title = rawTitle && rawTitle !== 'null' ? rawTitle : undefined;
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chapters.push({
        chapterNumber: num,
        title,
        url: `${urlObj.origin}${urlObj.pathname.replace(/\/+$/, '')}/${slug}`,
      });
    }
  }

  // 2. Fallback: Parse HTML anchor links if any additional exist
  const anchorRegex = /href="([^"]*\/chapter-([0-9.]+)[^"]*)"/gi;
  let am: RegExpExecArray | null;
  while ((am = anchorRegex.exec(html)) !== null) {
    const rawHref = am[1];
    const num = parseFloat(am[2]);
    const cleanUrl = rawHref.startsWith('http') ? rawHref : `${urlObj.origin}${rawHref.startsWith('/') ? '' : '/'}${rawHref}`;
    const slug = cleanUrl.split('/').pop() || '';
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      chapters.push({
        chapterNumber: num,
        url: cleanUrl,
      });
    }
  }

  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
}

async function extractVortexChapterImages(chapterUrl: string): Promise<string[]> {
  const response = await fetch(chapterUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Vortex chapter page: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();

  // Extract from <img ... data-reader-page-image ...>
  const readerImgMatches = [...html.matchAll(/<img[^>]+data-reader-page-image[^>]+>/gi)].map((m) => m[0]);
  const pageUrls: string[] = [];

  for (const tag of readerImgMatches) {
    const srcMatch = tag.match(/src="([^"]+)"/i);
    if (srcMatch && srcMatch[1]) {
      const normalized = srcMatch[1].replace(/storage\.vortexscans\.org\/+/i, 'storage.vortexscans.org/');
      if (!pageUrls.includes(normalized)) {
        pageUrls.push(normalized);
      }
    }
  }

  if (pageUrls.length > 0) {
    return pageUrls;
  }

  // Fallback: extract all storage.vortexscans.org/upload/series/ links
  const storageMatches = [...html.matchAll(/https?:\/\/storage\.vortexscans\.org\/{1,2}upload\/series\/[^"'\s\\]+/gi)].map((m) => m[0]);
  const filtered = storageMatches
    .map((u) => u.replace(/storage\.vortexscans\.org\/+/i, 'storage.vortexscans.org/'))
    .filter((u) => !u.includes('/featured/') && !u.includes('/logo') && !u.includes('/avatar') && !u.includes('banner') && !u.includes('cover'));

  return Array.from(new Set(filtered));
}

