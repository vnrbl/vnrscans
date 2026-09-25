/**
 * Hivetoon Client
 *
 * Dedicated HTTP client for Hivetoons (hivetoons.org / hivetoon.com).
 * Automatically handles vShield anti-bot 307 redirects and preserves
 * the required `_1__vShield_v` cookie across redirects and subsequent requests.
 */

let cachedHivetoonCookie: string | null = null;
let lastCookieTimestamp = 0;
const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function normalizeHivetoonUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname === "hivetoon.com" || parsed.hostname === "www.hivetoon.com") {
      parsed.hostname = "hivetoons.org";
    }
    return parsed.toString();
  } catch {
    return url.replace(/https?:\/\/(?:www\.)?hivetoon\.com/i, "https://hivetoons.org");
  }
}

export function isHivetoonUrl(url: string): boolean {
  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase();
    return hostname.includes("hivetoon");
  } catch {
    return url.toLowerCase().includes("hivetoon");
  }
}

export async function fetchHivetoonHtml(url: string): Promise<string> {
  let targetUrl = normalizeHivetoonUrl(url);

  // If cookie is too old, refresh it
  if (Date.now() - lastCookieTimestamp > COOKIE_TTL_MS) {
    cachedHivetoonCookie = null;
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Chromium";v="126", "Not?A_Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "upgrade-insecure-requests": "1",
  };

  if (cachedHivetoonCookie) {
    headers["Cookie"] = cachedHivetoonCookie;
  }

  let res = await fetch(targetUrl, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });

  // Follow 301, 302, 307, 308 redirects while preserving Set-Cookie
  let redirectCount = 0;
  while ([301, 302, 307, 308].includes(res.status) && redirectCount < 8) {
    redirectCount++;
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const cookieVal = setCookie.split(";")[0].trim();
      cachedHivetoonCookie = cookieVal;
      lastCookieTimestamp = Date.now();
      headers["Cookie"] = cookieVal;
    }

    const loc = res.headers.get("location");
    if (!loc) break;

    targetUrl = new URL(loc, targetUrl).toString();
    res = await fetch(targetUrl, {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  }

  // If still rate-limited with 429, wait 1.2s and retry once
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1200));
    res = await fetch(targetUrl, {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
  }

  if (!res.ok && res.status !== 304) {
    throw new Error(`Hivetoon request failed: ${res.status} ${res.statusText} at ${targetUrl}`);
  }

  const text = await res.text();
  // Check if response is the vShield 429 blocked page
  if (text.includes("<title>Error 429 | vShield</title>")) {
    throw new Error(`Hivetoon blocked request with vShield rate limiting at ${targetUrl}`);
  }

  return text;
}
