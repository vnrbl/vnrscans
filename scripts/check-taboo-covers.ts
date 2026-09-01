import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const seriesId = '8083a55e-69b3-4987-bd78-312c9a2eac9c';
  console.log(`Checking series ${seriesId}...`);

  const { data: series, error: seriesErr } = await supabase
    .from('series')
    .select('*')
    .eq('id', seriesId)
    .single();

  if (seriesErr) {
    console.error('Error fetching series:', seriesErr);
    return;
  }

  console.log('Series details:');
  console.log(`- Title: ${series.title}`);
  console.log(`- Slug: ${series.slug}`);
  console.log(`- Cover URL: ${series.cover_url}`);

  const { data: chapters, error: chaptersErr } = await supabase
    .from('chapters')
    .select('id, title, slug, chapter_number, novel_content')
    .eq('series_id', seriesId)
    .order('chapter_number', { ascending: true });

  if (chaptersErr) {
    console.error('Error fetching chapters:', chaptersErr);
    return;
  }

  console.log(`\nFound ${chapters?.length || 0} chapters:`);
  for (const ch of chapters || []) {
    const { data: pages, error: pagesErr } = await supabase
      .from('chapter_pages')
      .select('id, page_number, image_url')
      .eq('chapter_id', ch.id)
      .order('page_number', { ascending: true });

    if (pagesErr) {
      console.error(`  Error fetching pages for chapter ${ch.title}:`, pagesErr);
      continue;
    }

    console.log(`  Chapter ${ch.chapter_number}: "${ch.title}" (id: ${ch.id}) - ${pages?.length || 0} pages`);
    pages?.forEach(p => {
      console.log(`    - Page ${p.page_number}: ${p.image_url}`);
    });
  }

  // Diagnostic 1: Find any chapter pages containing taboo or lonely-frost
  console.log('\n--- Searching all chapter_pages in DB for "taboo" or "lonely" ---');
  const { data: matchedPages, error: matchedPagesErr } = await supabase
    .from('chapter_pages')
    .select('id, chapter_id, image_url, page_number');

  if (matchedPagesErr) {
    console.error('Error fetching all pages:', matchedPagesErr);
  } else {
    const filtered = (matchedPages || []).filter(p => 
      p.image_url.toLowerCase().includes('taboo') || 
      p.image_url.toLowerCase().includes('lonely') || 
      p.image_url.toLowerCase().includes('frost')
    );
    console.log(`Found ${filtered.length} matching pages in DB:`);
    filtered.forEach(p => {
      console.log(`- Page ID: ${p.id}, Chapter ID: ${p.chapter_id}, Num: ${p.page_number}, URL: ${p.image_url}`);
    });
  }

  // Diagnostic 2: Find any chapters named "Covers" or similar
  console.log('\n--- Searching all chapters in DB containing "cover" or "illustration" ---');
  const { data: coverChapters, error: coverChaptersErr } = await supabase
    .from('chapters')
    .select('id, title, slug, series_id, chapter_number')
    .or('title.ilike.%cover%,title.ilike.%illustration%');

  if (coverChaptersErr) {
    console.error('Error fetching cover chapters:', coverChaptersErr);
  } else {
    console.log(`Found ${coverChapters?.length || 0} cover/illustration chapters:`);
    coverChapters?.forEach(c => {
      console.log(`- Chapter ID: ${c.id}, Series ID: ${c.series_id}, Title: "${c.title}", Num: ${c.chapter_number}`);
    });
  }
}

main();
