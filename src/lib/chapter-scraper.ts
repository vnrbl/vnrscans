/* eslint-disable no-useless-escape */
/**
 * Chapter URL scraper - extracts image URLs from manga/manhwa chapter pages
 */
import chromium from '@sparticuz/chromium';

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
}

export interface ExtractChapterImagesOptions {
  imageUrlExample?: string | null;
}

const LIVE_READER_IMAGES_PREFIX = '__LIVE_READER_IMAGES__';

export async function extractChaptersFromSeriesUrl(seriesUrl: string): Promise<ChapterInfo[]> {
  try {
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
        if (isProtectedPage(html)) {
          usePuppeteerFallback = true;
        }
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
    
    if (chapters.length === 0) {
      throw new Error('No chapters found on the series page. Please check the URL or upload chapters manually.');
    }

    return chapters;
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
  console.log(`[Scraper] Launching Puppeteer browser to bypass Cloudflare protection for: ${url}`);
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
      const shouldSkipScroll =
        (isAsura && immediateImages.length > 0) ||
        (!isAsura && ((isQimanhwa && immediateImages.length > 0) || immediateImages.length >= 10));

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
            lowercaseSrc.includes('storage.vortexscans.org/upload/series/') &&
            !lowercaseSrc.includes('/series/featured/') &&
            /^page[-_]\\d{1,4}/i.test(filename);

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
              isHivetoonReaderImage
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
    const isQimanhwa = parsed.hostname.includes('qimanhwa.com');
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

      while (next && pageNumber <= 20) {
        const response = await fetch(
          `https://api.qimanhwa.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=${pageNumber}`,
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

export function extractChapterLinks(html: string, baseUrl: string): ChapterInfo[] {
  const chapters: ChapterInfo[] = [];
  const seenUrls = new Set<string>();

  const addChapter = (inputUrl: string, rawText: string) => {
    let url = inputUrl.trim();
    if (!url) return;

    const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

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

  // Sort by chapter number
  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
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
  try {
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
  const uniqueUrls = Array.from(new Set(chapterUrls));
  const results = new Map<string, string[]>();
  const failedUrls: string[] = [];

  const directSettled = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
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
    if (isHivetoonReaderPageImage(url)) {
      return true;
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
    lowercaseUrl.includes('/profile/')
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
    isHivetoonReaderPageImage(url),
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
    const isSeriesPath = lowercaseUrl.includes('/public/upload/series/');
    const isReaderImage = 
      /^(?:image|page|\d+)/i.test(filename) && 
      /\.(?:jpe?g|png|webp)$/i.test(filename);
    return isHivetoonStorage && isSeriesPath && isReaderImage;
  } catch {
    return false;
  }
}
