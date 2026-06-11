import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables for sitemap generation.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Generating sitemap...");

  const domain = "https://www.vnrscans.com";
  const staticPages = [
    "",
    "/browse",
    "/rankings",
    "/recommendations",
    "/about",
    "/contact",
    "/dmca",
    "/auth",
    "/request-series",
    "/tags"
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const nowString = new Date().toISOString().split('T')[0];

  // 1. Add static pages
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${domain}${page}</loc>\n`;
    xml += `    <lastmod>${nowString}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>${page === "" ? "1.0" : "0.8"}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 2. Fetch all series
  console.log("Fetching series for sitemap...");
  const { data: series, error: seriesError } = await supabase
    .from('series')
    .select('slug, updated_at')
    .eq('is_hidden', false);

  if (seriesError) {
    console.error("Error fetching series:", seriesError);
  } else {
    for (const s of (series || [])) {
      const lastMod = s.updated_at ? s.updated_at.split('T')[0] : nowString;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/title/${s.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  // 3. Fetch all chapters
  console.log("Fetching chapters for sitemap...");
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('slug, created_at, series:series_id(slug)')
    .eq('status', 'published');

  if (chaptersError) {
    console.error("Error fetching chapters:", chaptersError);
  } else {
    for (const c of (chapters || [])) {
      const seriesSlug = c.series?.slug;
      if (!seriesSlug || !c.slug) continue;
      const lastMod = c.created_at ? c.created_at.split('T')[0] : nowString;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/title/${seriesSlug}/${c.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>\n`;

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');

  console.log(`✅ Sitemap successfully generated at: ${sitemapPath}`);
}

run();
