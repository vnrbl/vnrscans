/**
 * Chapter URL scraper - extracts image URLs from manga/manhwa chapter pages
 */

export interface ChapterInfo {
  chapterNumber: number;
  title?: string;
  url: string;
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
    const readerUrl = `https://r.jina.ai/http://r.jina.ai/http://${url}`;
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
  const launchOptions: any = {
    headless: chrome.headless,
    args: [
      ...chrome.args,
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
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

    // Wait for automatic challenge resolution/redirects
    await new Promise(r => setTimeout(r, 4000));

    if (isChapterPage) {
      // Scroll down if it's a chapter page to trigger lazy loading of images
      console.log('[Scraper] Triggering lazy-load image scrolling...');
      await scrollChapterPageForLazyImages(page);
    } else {
      // Some series pages render chapter rows client-side and only after scrolling.
      await page.waitForFunction(
        () => /chapter\s*\d+/i.test(document.body.innerText) || document.querySelectorAll('a[href*="chapter"]').length > 0,
        { timeout: 15000 },
      ).catch(() => {});

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
    }

    const html = await page.content();
    const liveReaderImages = isChapterPage ? await collectLiveReaderImageUrls(page) : [];
    const readerImages = isQimanhwaLikeUrl(url)
      ? liveReaderImages.filter(isQimanhwaReaderPageImage)
      : liveReaderImages;
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
  let lastHeight = 0;
  let stablePasses = 0;

  for (let pass = 0; pass < 3 && stablePasses < 2; pass++) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === lastHeight) {
      stablePasses++;
    } else {
      stablePasses = 0;
      lastHeight = height;
    }

    const scrollTarget = Math.max(height, 30000);
    for (let y = 0; y <= scrollTarget; y += 700) {
      await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function collectLiveReaderImageUrls(page: any): Promise<string[]> {
  try {
    const urls = await page.evaluate(`
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
          img.getAttribute('data-original')
        ])
        .filter((value, index, all) =>
          value &&
          (String(value).startsWith('http://') || String(value).startsWith('https://')) &&
          all.indexOf(value) === index
        )
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

  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_BIN ||
    process.env.GOOGLE_CHROME_BIN ||
    process.env.CHROME_PATH;

  const candidatePaths = [
    envPath,
    await safePuppeteerExecutablePath(puppeteer),
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

  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    const executablePath = await chromium.executablePath();

    if (executablePath) {
      return {
        executablePath,
        args: chromium.args,
        headless: true,
      };
    }
  } catch (error) {
    console.warn('[Scraper] Packaged Chromium fallback unavailable:', error);
  }

  return { args: [], headless: true };
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

export async function buildClientChapterLinksHtml(page: any, seriesUrl: string): Promise<string> {
  try {
    const parsed = new URL(seriesUrl);
    const isQimanhwa = parsed.hostname.includes('qimanhwa.com');
    const [, section, ...rest] = parsed.pathname.split('/');

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

        const payload = await response.json();
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
  // Try to extract from text first
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
  
  // Try to extract from URL
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

export async function extractImagesFromChapterUrl(chapterUrl: string): Promise<string[]> {
  try {
    let html = '';
    let usePuppeteerFallback = false;

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
        if (isProtectedPage(html)) {
          usePuppeteerFallback = true;
        } else if (isQimanhwaLikeUrl(chapterUrl)) {
          // Qimanhwa renders reader pages client-side; direct HTML often only contains cover/thumbnail URLs.
          usePuppeteerFallback = true;
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
        return images;
      }
    }
    
    // Extract all image URLs from the HTML
    const images = extractImageUrls(html, chapterUrl);
    
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

export function extractImageUrls(html: string, baseUrl: string): string[] {
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
      
      // If scraping from asurascans.com, only allow URLs of the pattern: asura-images/chapters/
      const isAsura = lowercaseBaseUrl.includes('asurascans.com') || lowercaseUrl.includes('asurascans.com');
      if (isAsura && !lowercaseUrl.includes('asura-images/chapters/')) {
        return false;
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
        lowercaseBaseUrl.includes('qimanhwa.com') ||
        lowercaseUrl.includes('qimanhwa.com') ||
        lowercaseUrl.includes('qiscans.org');
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

function isQimanhwaReaderPageImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const lowercaseUrl = url.toLowerCase();
    const filename = parsed.pathname.split('/').pop() ?? '';
    const isNumberedPage = /^\d{1,4}\.(?:jpe?g|png|webp)$/i.test(filename);
    const isReaderPath =
      lowercaseUrl.includes('/file/qiscans/upload/rezo/series/') ||
      lowercaseUrl.includes('/rezo/series/');

    return isNumberedPage && isReaderPath;
  } catch {
    return false;
  }
}

function isQimanhwaLikeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.includes('qimanhwa.com') || hostname.includes('qiscans.org');
  } catch {
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.includes('qimanhwa.com') || lowercaseUrl.includes('qiscans.org');
  }
}
