/**
 * SSRF (Server-Side Request Forgery) Defense Utilities (Isomorphic)
 *
 * Validates URLs before server-side fetching or headless browser navigation
 * to ensure requests cannot target internal networks, cloud metadata services,
 * localhost, or non-HTTP protocols. Works in both Node and Browser environments.
 */

export class SsrfSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfSecurityError";
  }
}

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^::$/;

/**
 * Checks whether an IPv4 address belongs to a private, loopback, link-local,
 * or reserved range.
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed -> reject
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local / AWS / GCP / Azure Instance Metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (Carrier Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved) & 255.255.255.255
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address belongs to loopback, link-local, or private range.
 */
function isPrivateIpv6(ip: string): boolean {
  const clean = ip.toLowerCase();
  if (clean === "::1" || clean === "::" || clean === "0:0:0:0:0:0:0:1") return true;
  if (clean.startsWith("fe80:") || clean.startsWith("fc00:") || clean.startsWith("fd00:")) return true;
  if (clean.startsWith("::ffff:")) {
    const v4 = clean.replace("::ffff:", "");
    if (IPV4_REGEX.test(v4)) return isPrivateIpv4(v4);
  }
  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 * Throws `SsrfSecurityError` if the URL targets private/internal networks or invalid protocols.
 */
export function assertSafePublicUrl(urlString: string): URL {
  if (!urlString || typeof urlString !== "string") {
    throw new SsrfSecurityError("Invalid or missing URL");
  }

  const trimmed = urlString.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new SsrfSecurityError("Malformed URL format");
  }

  // 1. Strict protocol check (only http and https allowed)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfSecurityError(`Disallowed protocol "${parsed.protocol}". Only HTTP/HTTPS are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // 2. Reject obvious localhost / internal hostnames
  const forbiddenHostnames = [
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "metadata.azure.com",
  ];

  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".corp")
  ) {
    throw new SsrfSecurityError(`Access to internal host "${hostname}" is blocked.`);
  }

  // 3. Reject integer / hex / octal IP representations (e.g. 2130706433, 0x7f000001)
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(hostname)) {
    throw new SsrfSecurityError("Numeric or hex IP notation is not permitted.");
  }

  // 4. IP address validation
  if (IPV4_REGEX.test(hostname)) {
    if (isPrivateIpv4(hostname)) {
      throw new SsrfSecurityError(`Access to private/internal IP address "${hostname}" is blocked.`);
    }
  } else if (IPV6_REGEX.test(hostname) || hostname.includes(":")) {
    if (isPrivateIpv6(hostname)) {
      throw new SsrfSecurityError(`Access to private/internal IPv6 address "${hostname}" is blocked.`);
    }
  }

  return parsed;
}

/**
 * Returns true if the URL is safe for server-side requests.
 */
export function isSafePublicUrl(urlString: string): boolean {
  try {
    assertSafePublicUrl(urlString);
    return true;
  } catch {
    return false;
  }
}
