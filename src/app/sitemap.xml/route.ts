import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Root sitemap INDEX.
 * Served dynamically at /sitemap.xml.
 *
 * Directs search engines to:
 *   /sitemap-static.xml
 *   /sitemap-series-0.xml, /sitemap-series-1.xml, ...
 *   /sitemap-chapters-0.xml, /sitemap-chapters-1.xml, ...
 */

const BASE_URL = "https://www.vnrscans.com";
const SERIES_PAGE_SIZE = 1000;
const CHAPTER_PAGE_SIZE = 5000;

function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const revalidate = 3600; // refresh hourly
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const sitemaps: string[] = [`${BASE_URL}/sitemap-static.xml`];

  const supabase = createAdminClient();
  if (supabase) {
    // 1. Calculate how many series pages we need
    let seriesCount = 0;
    try {
      const { count } = await supabase
        .from("series")
        .select("*", { count: "exact", head: true })
        .eq("is_hidden", false)
        .not("slug", "is", null);
      seriesCount = count ?? 0;
    } catch {
      seriesCount = 0;
    }
    const seriesPages = Math.max(1, Math.ceil(seriesCount / SERIES_PAGE_SIZE));
    for (let i = 0; i < seriesPages; i++) {
      sitemaps.push(`${BASE_URL}/sitemap-series-${i}.xml`);
    }

    // 2. Calculate how many chapters pages we need
    let chapterCount = 0;
    try {
      const { count } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .not("slug", "is", null);
      chapterCount = count ?? 0;
    } catch {
      chapterCount = 0;
    }
    const chapterPages = Math.max(
      1,
      Math.ceil(chapterCount / CHAPTER_PAGE_SIZE)
    );
    for (let i = 0; i < chapterPages; i++) {
      sitemaps.push(`${BASE_URL}/sitemap-chapters-${i}.xml`);
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.flatMap((url) => [
      "  <sitemap>",
      `    <loc>${url}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      "  </sitemap>",
    ]),
    "</sitemapindex>",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
