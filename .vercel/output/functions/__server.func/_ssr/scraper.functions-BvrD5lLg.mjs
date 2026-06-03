import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-BxlCxjVy.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
async function extractChaptersFromSeriesUrl(seriesUrl) {
  try {
    const response = await fetch(seriesUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch series page: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const chapters = extractChapterLinks(html, seriesUrl);
    if (chapters.length === 0) {
      throw new Error("No chapters found on the series page. Please check the URL or upload chapters manually.");
    }
    return chapters;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract chapters: ${error.message}`);
    }
    throw new Error("Failed to extract chapters from series URL");
  }
}
function extractChapterLinks(html, baseUrl) {
  const chapters = [];
  const seenUrls = /* @__PURE__ */ new Set();
  const chapterPatterns = [
    // Links with "chapter" in href or text
    /<a[^>]+href=["']([^"']*chapter[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
    /<a[^>]+href=["']([^"']*ch-[^"']*)["'][^>]*>([^<]*)<\/a>/gi,
    /<a[^>]+href=["']([^"']*\/\d+[^"']*)["'][^>]*>.*?chapter\s*(\d+\.?\d*)/gi,
    // Data attributes
    /<a[^>]+data-chapter=["']([^"']*)["'][^>]+href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi
  ];
  for (const pattern of chapterPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      let text = match[2] || "";
      if (url && !url.startsWith("http")) {
        try {
          const base = new URL(baseUrl);
          url = new URL(url, base.origin).href;
        } catch {
          continue;
        }
      }
      if (seenUrls.has(url)) continue;
      const chapterNum = extractChapterNumber(url, text);
      if (chapterNum !== null && !seenUrls.has(url)) {
        seenUrls.add(url);
        const title = extractChapterTitle(text);
        chapters.push({
          chapterNumber: chapterNum,
          title: title || void 0,
          url
        });
      }
    }
  }
  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
}
function extractChapterNumber(url, text) {
  const textPatterns = [
    /chapter\s*(\d+\.?\d*)/i,
    /ch\.?\s*(\d+\.?\d*)/i,
    /ep\.?\s*(\d+\.?\d*)/i,
    /episode\s*(\d+\.?\d*)/i,
    /#(\d+\.?\d*)/
  ];
  for (const pattern of textPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num;
    }
  }
  const urlPatterns = [
    /chapter-(\d+\.?\d*)/i,
    /ch-(\d+\.?\d*)/i,
    /\/(\d+\.?\d*)(?:\/|$)/
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
function extractChapterTitle(text) {
  let title = text.replace(/chapter\s*\d+\.?\d*\s*[:–-]?\s*/i, "").replace(/ch\.?\s*\d+\.?\d*\s*[:–-]?\s*/i, "").replace(/ep\.?\s*\d+\.?\d*\s*[:–-]?\s*/i, "").replace(/episode\s*\d+\.?\d*\s*[:–-]?\s*/i, "").trim();
  return title.length > 0 && title.length < 100 ? title : null;
}
async function extractImagesFromChapterUrl(chapterUrl) {
  try {
    const response = await fetch(chapterUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const images = extractImageUrls(html);
    if (images.length === 0) {
      throw new Error("No images found on the chapter page. Please check the URL or use manual URL input.");
    }
    return images;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract images: ${error.message}`);
    }
    throw new Error("Failed to extract images from chapter URL");
  }
}
function extractImageUrls(html) {
  const images = [];
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
    /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi
  ];
  for (const pattern of imageRegexPatterns) {
    let match2;
    while ((match2 = pattern.exec(html)) !== null) {
      const url = match2[1];
      if (url && !url.includes("logo") && !url.includes("icon") && !url.includes("avatar") && !url.includes("banner") && !url.includes("placeholder") && !url.includes("thumb") && !images.includes(url)) {
        images.push(url);
      }
    }
  }
  const scriptRegex = /["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const url = match[1];
    if (url && url.startsWith("http") && !url.includes("logo") && !url.includes("icon") && !url.includes("avatar") && !images.includes(url)) {
      images.push(url);
    }
  }
  return [...new Set(images)].filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}
const $extractChaptersFromUrl_createServerFn_handler = createServerRpc({
  id: "8d447e795f623d885b1641fa727ec02e5d9d52a0c5d865fe4e835a94e7be9d3f",
  name: "$extractChaptersFromUrl",
  filename: "src/lib/api/scraper.functions.ts"
}, (opts) => $extractChaptersFromUrl.__executeServer(opts));
const $extractChaptersFromUrl = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  url: stringType().url()
})).handler($extractChaptersFromUrl_createServerFn_handler, async ({
  data
}) => {
  try {
    const chapters = await extractChaptersFromSeriesUrl(data.url);
    return {
      success: true,
      chapters
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract chapters"
    };
  }
});
const $extractImagesFromUrl_createServerFn_handler = createServerRpc({
  id: "2a2c8d7a9b0346fc1b4a261ed3bf46d16a8edec9b9183bbdab6cbc028283eb72",
  name: "$extractImagesFromUrl",
  filename: "src/lib/api/scraper.functions.ts"
}, (opts) => $extractImagesFromUrl.__executeServer(opts));
const $extractImagesFromUrl = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  url: stringType().url()
})).handler($extractImagesFromUrl_createServerFn_handler, async ({
  data
}) => {
  try {
    const images = await extractImagesFromChapterUrl(data.url);
    return {
      success: true,
      images
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract images"
    };
  }
});
export {
  $extractChaptersFromUrl_createServerFn_handler,
  $extractImagesFromUrl_createServerFn_handler
};
