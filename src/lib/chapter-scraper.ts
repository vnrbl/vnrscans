/**
 * Chapter URL scraper - extracts image URLs from manga/manhwa chapter pages
 */

export interface ChapterInfo {
  chapterNumber: number;
  title?: string;
  url: string;
}

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
    const chapters = extractChapterLinks(html, seriesUrl);
    
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
  const browser = await puppeteer.default.launch({
    headless: true, // Run in background to be less intrusive
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

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

    // Scroll down if it's a chapter page to trigger lazy loading of images
    if (isChapterPage) {
      console.log('[Scraper] Triggering lazy-load image scrolling...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(r => setTimeout(r, 1500));
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    const html = await page.content();
    return html;
  } catch (error) {
    console.error(`[Scraper] Puppeteer scraping failed for ${url}:`, error);
    throw error;
  } finally {
    await browser.close();
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
    /\/chapters\//.test(lowercaseUrl);

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

  // Extract all <a> tags with href attributes
  // Matches <a href="..." otherAttrs>content</a> or <a otherAttrs href="...">content</a>
  // Account for spaces around equals sign and single/double/no quotes around URL
  const aTagPattern = /<a\s+[^>]*?href\s*=\s*["']([^"']*)["'][^>]*?>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = aTagPattern.exec(html)) !== null) {
    let url = match[1]?.trim();
    const rawContent = match[2] || '';

    if (!url) continue;

    // Normalize and clean text content by removing inner HTML tags (e.g. <span>, <strong>)
    const cleanText = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if the link matches chapter criteria to filter out navigation/other links
    if (!isChapterLink(url, cleanText)) {
      continue;
    }

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

    // Skip if we've already seen this URL
    if (seenUrls.has(url)) continue;

    // Extract chapter number
    const chapterNum = extractChapterNumber(url, cleanText);
    if (chapterNum !== null) {
      seenUrls.add(url);
      const title = extractChapterTitle(cleanText);
      chapters.push({
        chapterNumber: chapterNum,
        title: title || undefined,
        url: url,
      });
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
    /ch-(\d+\.?\d*)/i,
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
  return [...new Set(images)].filter(url => {
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
      
      return true;
    } catch {
      return false;
    }
  });
}
