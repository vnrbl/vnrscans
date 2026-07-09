import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables for sitemap generation.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const DOMAIN = "https://www.vnrscans.com";
const PAGE_SIZE = 1000;
const seenUrls = new Set();

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatDate(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().split("T")[0];
}

function addUrl(xmlParts, routePath, lastmod, changefreq, priority) {
  const loc = `${DOMAIN}${routePath}`;
  if (seenUrls.has(loc)) return;

  seenUrls.add(loc);
  xmlParts.push("  <url>");
  xmlParts.push(`    <loc>${escapeXml(loc)}</loc>`);
  xmlParts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  xmlParts.push(`    <changefreq>${changefreq}</changefreq>`);
  xmlParts.push(`    <priority>${priority}</priority>`);
  xmlParts.push("  </url>");
}

async function fetchAll(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    rows.push(...(data || []));

    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function run() {
  console.log("Generating sitemap...");

  const now = new Date();
  const nowString = now.toISOString().split("T")[0];
  // Keep in sync with src/app/sitemap-static.xml/route.ts
  // Prefer the dynamic /sitemap.xml in production; this script is a static fallback.
  const staticPages = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "/home", changefreq: "daily", priority: "0.9" },
    { path: "/browse", changefreq: "daily", priority: "0.9" },
    { path: "/novels", changefreq: "daily", priority: "0.9" },
    { path: "/rankings", changefreq: "daily", priority: "0.7" },
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

  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const page of staticPages) {
    addUrl(xmlParts, page.path, nowString, page.changefreq, page.priority);
  }

  console.log("Fetching tags for sitemap...");
  try {
    const tags = await fetchAll(() =>
      supabase
        .from("tags")
        .select("slug, updated_at")
        .not("slug", "is", null)
        .order("usage_count", { ascending: false })
    );
    for (const tag of tags) {
      if (!tag.slug) continue;
      addUrl(
        xmlParts,
        `/tags/${tag.slug}`,
        formatDate(tag.updated_at, nowString),
        "weekly",
        "0.6"
      );
    }
  } catch (error) {
    console.error("Error fetching tags:", error);
  }

  console.log("Fetching series for sitemap...");
  let series = [];
  try {
    series = await fetchAll(() =>
      supabase
        .from("series")
        .select("id, slug, updated_at")
        .eq("is_hidden", false)
        .not("slug", "is", null)
        .order("updated_at", { ascending: false })
    );
  } catch (error) {
    console.error("Error fetching series:", error);
  }

  const publicSeriesIds = new Set();
  for (const item of series) {
    if (!item.id || !item.slug) continue;
    publicSeriesIds.add(item.id);
    addUrl(xmlParts, `/title/${item.slug}`, formatDate(item.updated_at, nowString), "weekly", "0.7");
  }

  console.log("Fetching chapters for sitemap...");
  let chapters = [];
  try {
    chapters = await fetchAll(() =>
      supabase
        .from("chapters")
        .select("slug, created_at, updated_at, scheduled_at, series_id, series:series_id(slug)")
        .eq("status", "published")
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
    );
  } catch (error) {
    console.error("Error fetching chapters:", error);
  }

  for (const item of chapters) {
    const seriesSlug = item.series?.slug;
    if (!seriesSlug || !item.slug || !publicSeriesIds.has(item.series_id)) continue;
    if (item.scheduled_at && new Date(item.scheduled_at) > now) continue;

    addUrl(
      xmlParts,
      `/title/${seriesSlug}/${item.slug}`,
      formatDate(item.updated_at || item.created_at, nowString),
      "monthly",
      "0.5"
    );
  }

  xmlParts.push("</urlset>");

  const publicDir = path.join(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, `${xmlParts.join("\n")}\n`, "utf8");

  console.log(`Sitemap successfully generated at: ${sitemapPath}`);
}

run();
