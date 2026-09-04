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
  // Allow root-relative safe paths (e.g. /memes/..., /images/...)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return true;
  }
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

/**
 * Maximum number of image attachments allowed per comment.
 */
export const MAX_COMMENT_ATTACHMENTS = 5;

/**
 * Parses and returns an array of safe image attachment URLs from the DB `attachment_url` column.
 * Seamlessly handles:
 *  - Legacy single URL strings: "https://.../photo.png" -> ["https://.../photo.png"]
 *  - JSON arrays of up to 5 URLs: '["https://.../1.png", "https://.../2.png"]'
 *  - Invalid or unsafe URLs are stripped out
 *  - Guaranteed not to exceed maxLimit (default: 5)
 */
export function parseSafeAttachmentUrls(
  value: string | null | undefined,
  maxLimit = MAX_COMMENT_ATTACHMENTS
): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string" && isSafeUrl(item))
          .map((url) => url.trim())
          .slice(0, maxLimit);
      }
    } catch {
      // Fallback to single url check
    }
  }

  if (isSafeUrl(trimmed)) {
    return [trimmed];
  }

  return [];
}

/**
 * Serializes an array of attachment URLs for storing into `attachment_url`.
 * If 1 URL: returns the raw URL string (maintains 100% backward compatibility).
 * If multiple URLs: returns JSON-stringified array capped at 5.
 * If 0: returns null.
 */
export function serializeAttachmentUrls(
  urls: string[] | null | undefined,
  maxLimit = MAX_COMMENT_ATTACHMENTS
): string | null {
  if (!urls || urls.length === 0) return null;
  const clean = urls
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => Boolean(u) && isSafeUrl(u))
    .slice(0, maxLimit);

  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

