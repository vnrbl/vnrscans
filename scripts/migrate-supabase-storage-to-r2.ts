/**
 * Migration Script: Supabase Storage -> Cloudflare R2
 *
 * Scans tables (`chapter_pages`, `series`, `series_covers`) for images
 * hosted on Supabase Storage (`supabase.co/storage`), downloads them,
 * uploads them to Cloudflare R2 via the Cloudflare Worker, and updates
 * the database URLs to free up Supabase storage quota!
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase-storage-to-r2.ts [--delete-from-supabase]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workerUrl = (process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL || '').replace(/\/$/, '');
const workerSecret = process.env.WORKER_UPLOAD_SECRET;
const shouldDeleteOriginal = process.argv.includes('--delete-from-supabase');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

if (!workerUrl) {
  console.error('❌ WORKER_URL is not set in environment or .env file.');
  console.error('   Please set WORKER_URL=https://<your-worker>.workers.dev');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadToR2(key: string, buffer: ArrayBuffer, contentType: string): Promise<string | null> {
  try {
    const base64Data = Buffer.from(buffer).toString('base64');
    const res = await fetch(`${workerUrl}/assets/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(workerSecret ? { 'x-worker-secret': workerSecret } : {}),
      },
      body: JSON.stringify({
        key,
        data: base64Data,
        contentType,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[R2] Upload failed for ${key} (${res.status}): ${err}`);
      return null;
    }

    return `${workerUrl}/assets/${key}`;
  } catch (err: any) {
    console.warn(`[R2] Upload error for ${key}:`, err?.message);
    return null;
  }
}

async function migrateUrl(imageUrl: string, prefix: string): Promise<string | null> {
  if (!imageUrl || !imageUrl.includes('supabase.co/storage')) {
    return null; // Not on Supabase storage
  }

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      console.warn(`[Download] Failed to download ${imageUrl} (${res.status})`);
      return null;
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Generate safe key
    const urlParts = imageUrl.split('/');
    const originalFileName = urlParts[urlParts.length - 1].split('?')[0] || `image-${Date.now()}`;
    const key = `${prefix}/${Date.now()}-${originalFileName}`;

    const newUrl = await uploadToR2(key, buffer, contentType);
    return newUrl;
  } catch (err: any) {
    console.warn(`[Migrate] Error processing ${imageUrl}:`, err?.message);
    return null;
  }
}

async function run() {
  console.log('==================================================');
  console.log('🚀 Supabase Storage -> Cloudflare R2 Image Migrator');
  console.log(`Worker URL: ${workerUrl}`);
  console.log(`Delete from Supabase after copy: ${shouldDeleteOriginal ? 'YES' : 'NO'}`);
  console.log('==================================================\n');

  // 1. Chapter Pages
  console.log('📖 Checking chapter_pages...');
  const { data: pages, error: pagesErr } = await supabase
    .from('chapter_pages')
    .select('id, chapter_id, image_url')
    .like('image_url', '%supabase.co/storage%')
    .limit(500);

  if (pagesErr) {
    console.warn('Error querying chapter_pages:', pagesErr.message);
  } else if (pages && pages.length > 0) {
    console.log(`Found ${pages.length} chapter pages hosted on Supabase Storage.`);
    let successCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const newUrl = await migrateUrl(page.image_url, 'chapter-pages');
      if (newUrl) {
        await supabase
          .from('chapter_pages')
          .update({ image_url: newUrl })
          .eq('id', page.id);
        successCount++;
        process.stdout.write(`\rProgress: [${successCount}/${pages.length}] migrated`);
      }
    }
    console.log(`\n✅ Chapter pages migrated: ${successCount}/${pages.length}\n`);
  } else {
    console.log('✅ No chapter_pages found using Supabase Storage.\n');
  }

  // 2. Series Covers
  console.log('🖼️ Checking series covers...');
  const { data: seriesList, error: seriesErr } = await supabase
    .from('series')
    .select('id, cover_url')
    .like('cover_url', '%supabase.co/storage%');

  if (seriesErr) {
    console.warn('Error querying series:', seriesErr.message);
  } else if (seriesList && seriesList.length > 0) {
    console.log(`Found ${seriesList.length} series covers on Supabase Storage.`);
    for (const s of seriesList) {
      if (s.cover_url) {
        const newUrl = await migrateUrl(s.cover_url, 'covers');
        if (newUrl) {
          await supabase
            .from('series')
            .update({ cover_url: newUrl })
            .eq('id', s.id);
          console.log(`  Updated series cover: ${s.id} -> ${newUrl}`);
        }
      }
    }
  } else {
    console.log('✅ No series covers found using Supabase Storage.\n');
  }

  console.log('🎉 Migration run completed!');
}

run().catch(console.error);
