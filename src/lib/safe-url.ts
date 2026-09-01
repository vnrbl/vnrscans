/**
 * URL safety helpers.
 *
 * User-controllable strings from the database (social links, comment attachments,
 * notification link_url, banner link_url, ...) are sometimes rendered directly
 * into `<a href>` / `window.location` sinks. If a user stores a `javascript:`
 * URL, clicking the link executes script in the site origin — a stored XSS.
 *
 * These helpers validate the scheme and reject anything that is not an
 * absolute http(s) (or, optionally, mailto) URL. Always use them before placing a
 * user/db value into an `href` or similar navigation sink.
 */

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Returns true if `value` parses as a URL with a safe scheme.
 *
 * We deliberately use the URL constructor (which rejects scheme-relative URLs and
 * canonicalizes the scheme) rather than a substring check, so that obfuscations
 * such as `java\tscript:` or `JavaScript:` are normalized and then rejected.
 */
export function isSafeUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return SAFE_URL_SCHEMES.has(url.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Returns the URL if it is safe, otherwise `null`.
 *
 * Renderers should treat a `null` return as "do not linkify".
 */
export function safeUrlOrNull(value: string | null | undefined): string | null {
  return isSafeUrl(value) ? value!.trim() : null;
}
