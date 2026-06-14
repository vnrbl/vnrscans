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
  console.log('Fetching sample series cover URLs...');
  const { data: seriesList, error: seriesError } = await supabase
    .from('series')
    .select('title, slug, cover_url')
    .limit(5);

  if (seriesError) {
    console.error('Error fetching series:', seriesError);
  } else {
    seriesList?.forEach(s => {
      console.log(`- ${s.title}: ${s.cover_url}`);
    });
  }

  console.log('\nFetching sample chapter pages image URLs...');
  const { data: pagesList, error: pagesError } = await supabase
    .from('chapter_pages')
    .select('page_number, image_url, chapter:chapter_id(slug, series:series_id(title))')
    .limit(5);

  if (pagesError) {
    console.error('Error fetching pages:', pagesError);
  } else {
    pagesList?.forEach((p: any) => {
      console.log(`- ${p.chapter?.series?.title} (${p.chapter?.slug}) Page ${p.page_number}: ${p.image_url}`);
    });
  }
}

main();
