const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Formats a date into the standard app format: "1 Jan, 2026"
 */
export function formatAppDate(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/**
 * Formats a date and time into standard format: "1 Jan, 2026, 14:30"
 */
export function formatAppDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${formatAppDate(d)}, ${hours}:${mins}`;
}
