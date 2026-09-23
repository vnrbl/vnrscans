/**
 * Cookie-based storage for novel reader settings.
 *
 * Why cookies instead of localStorage:
 * - localStorage is per-origin, so settings silently differ between
 *   `vnrscans.com` and `www.vnrscans.com` (and are purged more aggressively
 *   by browsers under storage pressure). A cookie on the parent domain is
 *   shared across both and survives longer.
 *
 * Consent rules:
 * - No preference cookies are written until the visitor accepts.
 * - `vnr_cookie_consent` itself is stored in localStorage (not a cookie) so
 *   remembering the choice does not itself require consent.
 * - If consent is rejected, settings still work in-memory for the session
 *   (via sessionStorage, which is allowed as strictly-necessary-ish session
 *   state) but are not persisted across visits.
 */

import { DEFAULT_NOVEL_SETTINGS, type NovelReaderSettings } from "@/components/NovelSettingsPanel";

const SETTINGS_COOKIE = "vnr_novel_settings";
const CONSENT_KEY = "vnr_cookie_consent"; // localStorage: "accepted" | "rejected" | null
const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  // Parent-domain cookie: shared across vnrscans.com and www.vnrscans.com
  const host = window.location.hostname;
  const parts = host.split(".");
  const baseDomain =
    parts.length > 2 ||
    (parts.length === 2 && !/^(localhost|127\.0\.0\.1)$/.test(host))
      ? `.${parts.slice(-2).join(".")}`
      : "";
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${maxAgeSeconds}`,
    `SameSite=Lax`,
    baseDomain ? `domain=${baseDomain}` : "",
    // Note: not Secure so local http dev works; production is https-only via HSTS anyway.
  ]
    .filter(Boolean)
    .join("; ");
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCookieConsent(): "accepted" | "rejected" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: "accepted" | "rejected") {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage unavailable */
  }
  if (choice === "rejected") {
    // Remove any previously written preference cookies
    writeCookie(SETTINGS_COOKIE, "", 0);
  }
  // Notify listeners (e.g. the banner unmounts, reader may migrate settings)
  window.dispatchEvent(new CustomEvent("vnr-cookie-consent-change"));
}

/** True when preference cookies may be written. */
export function cookiesAllowed(): boolean {
  return getCookieConsent() === "accepted";
}

/** Read novel settings from the cookie, falling back to localStorage then defaults. */
export function loadNovelSettings(): NovelReaderSettings {
  const base = { ...DEFAULT_NOVEL_SETTINGS };
  let raw: string | null = null;

  const cookieVal = readCookie(SETTINGS_COOKIE);
  if (cookieVal) {
    raw = cookieVal;
  } else {
    // Migration: adopt existing localStorage settings on first cookie-enabled load
    try {
      raw = localStorage.getItem("novel-reader-settings-v2");
    } catch {
      raw = null;
    }
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.accentColor === "sky") parsed.accentColor = "purple";
      if (typeof parsed.paragraphSpacing === "number" && parsed.paragraphSpacing < 5) {
        parsed.paragraphSpacing = 28;
      }
      return { ...base, ...parsed };
    } catch {
      /* corrupted value — use defaults */
    }
  }
  return base;
}

/** Persist novel settings: cookie when consented, sessionStorage as in-session fallback. */
export function saveNovelSettings(settings: NovelReaderSettings) {
  const json = JSON.stringify(settings);
  if (cookiesAllowed()) {
    writeCookie(SETTINGS_COOKIE, json, ONE_YEAR);
    // Clean up the legacy localStorage copy once the cookie is authoritative
    try {
      localStorage.removeItem("novel-reader-settings-v2");
    } catch {
      /* ignore */
    }
  } else {
    try {
      sessionStorage.setItem(SETTINGS_COOKIE, json);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Hydrate in-session settings for visitors who rejected cookies.
 * Returns partial settings from sessionStorage if present.
 */
export function loadSessionNovelSettings(): Partial<NovelReaderSettings> | null {
  try {
    const raw = sessionStorage.getItem(SETTINGS_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
