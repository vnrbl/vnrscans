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
    // Fetch the series page HTML
    const response = await fetch(seriesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch series page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
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

function extractChapterLinks(html: string, baseUrl: string): ChapterInfo[] {
  const chapters: ChapterInfo[] = [];
  const seenUrls = new Set<string>();
  
  // Common patterns for chapter links
  const chapterPatterns = [
    // Links with "chapter" in href or text
    /<a[^>]+href=["']([^"']*chapter[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
    /<a[^>]+href=["']([^"']*ch-[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
    /<a[^>]+href=["']([^"']*\/\d+[^"']*)["'][^>]*>.*?chapter\s*(\d+\.?\d*)/gi,
    // Data attributes
    /<a[^>]+data-chapter=["']([^"']*)["'][^>]+href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi,
  ];

  for (const pattern of chapterPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      let text = match[2] || '';
      
      // Make URL absolute if relative
      if (url && !url.startsWith('http')) {
        try {
          const base = new URL(baseUrl);
          url = new URL(url, base.origin).href;
        } catch {
          continue;
        }
      }
      
      // Skip if already seen
      if (seenUrls.has(url)) continue;
      
      // Extract chapter number from URL or text
      const chapterNum = extractChapterNumber(url, text);
      if (chapterNum !== null && !seenUrls.has(url)) {
        seenUrls.add(url);
        
        // Extract chapter title
        const title = extractChapterTitle(text);
        
        chapters.push({
          chapterNumber: chapterNum,
          title: title || undefined,
          url: url,
        });
      }
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
  
  return title.length > 0 && title.length < 100 ? title : null;
}

export async function extractImagesFromChapterUrl(chapterUrl: string): Promise<string[]> {
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
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract all image URLs from the HTML
    const images = extractImageUrls(html);
    
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

function extractImageUrls(html: string): string[] {
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
    // Generic patterns for manga reader images (look for sequential images)
    /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi,
  ];

  // Try each regex pattern
  for (const pattern of imageRegexPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1];
      // Filter out small images, icons, and non-content images
      if (url && 
          !url.includes('logo') && 
          !url.includes('icon') && 
          !url.includes('avatar') && 
          !url.includes('banner') &&
          !url.includes('placeholder') &&
          !url.includes('thumb') &&
          !images.includes(url)) {
        images.push(url);
      }
    }
  }

  // Also try to find images in script tags (some sites load images via JS)
  const scriptRegex = /["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const url = match[1];
    if (url && 
        url.startsWith('http') &&
        !url.includes('logo') && 
        !url.includes('icon') && 
        !url.includes('avatar') &&
        !images.includes(url)) {
      images.push(url);
    }
  }

  // Remove duplicates and filter valid URLs
  return [...new Set(images)].filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}
