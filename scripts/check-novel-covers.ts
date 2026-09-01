import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const seriesId = '8083a55e-69b3-4987-bd78-312c9a2eac9c';
  console.log(`Checking chapters and pages for series: ${seriesId}`);
  
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('series_id', seriesId);
    
  if (chErr) {
    console.error('Error fetching chapters:', chErr);
    return;
  }
  
  console.log(`Found ${chapters?.length || 0} chapters.`);
  for (const ch of chapters || []) {
    const { data: pages, error: pgErr } = await supabase
      .from('chapter_pages')
      .select('id, page_number, image_url')
      .eq('chapter_id', ch.id)
      .order('page_number');
      
    if (pgErr) {
      console.error(`Error fetching pages for chapter ${ch.chapter_number}:`, pgErr);
      continue;
    }
    
    console.log(`Chapter ${ch.chapter_number} (${ch.title}): ${pages?.length || 0} pages`);
    pages?.forEach(p => {
      console.log(`  - Page ${p.page_number}: ${p.image_url}`);
    });
  }
}

run();
