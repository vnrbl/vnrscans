import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Chapter sitemap (paginated).
 * Served dynamically via rewrites at /sitemap-chapters-0.xml, /sitemap-chapters-1.xml, ...
 * Only includes chapters belonging to PUBLIC (non-hidden) series and
 * excludes future-scheduled chapters.
 */
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.vnrscans.com";
const PAGE_SIZE = 5000;

function escapeXml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatDate(value: string | null | undefined) {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split("T")[0];
  return parsed.toISOString().split("T")[0];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page?: string }> }
) {
  const { page: pageStr } = await params;
  const page = Math.max(0, parseInt(pageStr || "0", 10));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (url && key) {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    try {
      const { data } = await supabase
        .from("chapters")
        .select(
          "slug, created_at, updated_at, scheduled_at, series_id, series:series_id(slug, is_hidden)"
        )
        .eq("status", "published")
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const now = Date.now();
      for (const item of (data ?? []) as any[]) {
        const series = item.series as { slug?: string; is_hidden?: boolean } | null;
        // Skip if the parent series is hidden or has no slug.
        if (!series?.slug || series.is_hidden) continue;
        // Skip future-scheduled chapters.
        if (item.scheduled_at && new Date(item.scheduled_at).getTime() > now) continue;

        lines.push("  <url>");
        lines.push(
          `    <loc>${escapeXml(`${BASE_URL}/title/${series.slug}/${item.slug}`)}</loc>`
        );
        lines.push(`    <lastmod>${formatDate(item.updated_at || item.created_at)}</lastmod>`);
        lines.push("    <changefreq>monthly</changefreq>");
        lines.push("    <priority>0.5</priority>");
        lines.push("  </url>");
      }
    } catch {
      // empty sitemap on error
    }
  }

  lines.push("</urlset>", "");

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
