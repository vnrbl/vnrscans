import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Series sitemap (paginated).
 * Served dynamically via rewrites at /sitemap-series-0.xml, /sitemap-series-1.xml, ...
 */
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.vnrscans.com";
const PAGE_SIZE = 1000;

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
        .from("series")
        .select("slug, updated_at")
        .eq("is_hidden", false)
        .not("slug", "is", null)
        .order("updated_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      for (const item of data ?? []) {
        lines.push("  <url>");
        lines.push(`    <loc>${escapeXml(`${BASE_URL}/title/${item.slug}`)}</loc>`);
        lines.push(`    <lastmod>${formatDate(item.updated_at)}</lastmod>`);
        lines.push("    <changefreq>weekly</changefreq>");
        lines.push("    <priority>0.7</priority>");
        lines.push("  </url>");
      }
    } catch {
      // empty sitemap on error — better than a 500 that confuses crawlers
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
