import { NextResponse } from "next/server";

/**
 * Static-pages sitemap.
 * Served at /sitemap-static.xml
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

export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const staticPages: Array<{
    path: string;
    changefreq: string;
    priority: string;
  }> = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "/home", changefreq: "daily", priority: "0.9" },
    { path: "/browse", changefreq: "daily", priority: "0.9" },
    { path: "/rankings", changefreq: "daily", priority: "0.7" },
    { path: "/recommendations", changefreq: "weekly", priority: "0.6" },
    { path: "/tags", changefreq: "weekly", priority: "0.6" },
    { path: "/data-map", changefreq: "daily", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
    { path: "/contact", changefreq: "monthly", priority: "0.5" },
    { path: "/dmca", changefreq: "monthly", priority: "0.5" },
    { path: "/privacy", changefreq: "monthly", priority: "0.5" },
    { path: "/terms", changefreq: "monthly", priority: "0.5" },
    { path: "/request-series", changefreq: "monthly", priority: "0.4" },
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPages.flatMap((p) => [
      "  <url>",
      `    <loc>${escapeXml(`${BASE_URL}${p.path}`)}</loc>`,
      `    <lastmod>${now}</lastmod>`,
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
