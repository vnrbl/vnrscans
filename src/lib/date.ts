const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Parses any date representation (ISO UTC, timestamp with space, millisecond number)
 * strictly as UTC so that timezone offsets never skew time calculations.
 */
export function parseUtcDate(dateStr: string | number | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === "number") return new Date(dateStr);
  let s = String(dateStr).trim();
  if (!s) return new Date();
  // If space separated (e.g. "YYYY-MM-DD HH:mm:ss"), convert to ISO "T"
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) {
    s = s.replace(" ", "T");
  }
  // If no timezone indicator specified, append Z to ensure UTC interpretation
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
    s += "Z";
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2})$/.test(s)) {
    s += ":00";
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(dateStr) : d;
}

/**
 * Returns the user's localized timezone identifier (e.g. "Asia/Kathmandu", "America/New_York").
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Formats a UTC date into the user's local timezone: e.g. "Sep 5, 2026, 7:11 PM"
 */
export function formatUserDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = parseUtcDate(date);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return formatAppDateTime(d);
  }
}

/**
 * Formats elapsed time relative to current user clock with full UTC precision.
 */
export function formatTimeAgo(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = parseUtcDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 0 || seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Formats a date into the standard app format: "1 Jan, 2026"
 */
export function formatAppDate(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = parseUtcDate(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/**
 * Formats a date and time into standard format: "1 Jan, 2026, 14:30"
 */
export function formatAppDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = parseUtcDate(date);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${formatAppDate(d)}, ${hours}:${mins}`;
}
