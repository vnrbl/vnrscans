import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Static-pages + taxonomy sitemap.
 * Served at /sitemap-static.xml
 *
 * Includes all public, indexable routes that are not series/chapter detail
 * pages (those live in sitemap-series-* and sitemap-chapters-*).
 */
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.vnrscans.com";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type SitemapEntry = {
  path: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

/** Public indexable pages (no auth, no disallowed robots paths). */
const STATIC_PAGES: SitemapEntry[] = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/home", changefreq: "daily", priority: "0.9" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/novels", changefreq: "daily", priority: "0.9" },
  { path: "/rankings", changefreq: "daily", priority: "0.7" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.7" },
  { path: "/recommendations", changefreq: "weekly", priority: "0.6" },
  { path: "/tags", changefreq: "weekly", priority: "0.7" },
  { path: "/data-map", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/dmca", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.5" },
  { path: "/request-series", changefreq: "monthly", priority: "0.4" },
];

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: SitemapEntry[] = [...STATIC_PAGES];

  // Tag detail pages: /tags/{slug} — strong discovery signals for Google
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: tags } = await supabase
        .from("tags")
        .select("slug, updated_at")
        .not("slug", "is", null)
        .order("usage_count", { ascending: false })
        .limit(5000);

      for (const tag of tags ?? []) {
        if (!tag.slug) continue;
        entries.push({
          path: `/browse?tag=${tag.slug}`,
          changefreq: "weekly",
          priority: "0.6",
          lastmod: tag.updated_at
            ? new Date(tag.updated_at).toISOString().split("T")[0]
            : now,
        });
      }
    } catch {
      // Prefer serving core static URLs over failing the whole sitemap
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.flatMap((p) => [
      "  <url>",
      `    <loc>${escapeXml(`${BASE_URL}${p.path}`)}</loc>`,
      `    <lastmod>${p.lastmod ?? now}</lastmod>`,
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority}</priority>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
