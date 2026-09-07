import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspectSeries(slug: string) {
  const { data: series } = await supabase
    .from('series')
    .select('id, title, slug')
    .eq('slug', slug)
    .single();

  if (!series) {
    console.log('Series not found:', slug);
    return;
  }

  console.log(`\n=== Inspecting ${series.title} (${series.id}) ===`);
  const { data: sources } = await supabase
    .from('series_import_sources')
    .select('*')
    .eq('series_id', series.id);

  console.log('Sources:', sources);

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, scanlation_group, created_at')
    .eq('series_id', series.id)
    .order('chapter_number', { ascending: false });

  console.log(`Total chapters in DB: ${chapters?.length}`);
  console.log('Top 10 chapters in DB:', chapters?.slice(0, 10));

  for (const s of (sources || [])) {
    console.log(`\nTesting source: ${s.source_url} (scanlation_group: ${s.scanlation_group})`);
    try {
      const disc = await extractChaptersFromSeriesUrl(s.source_url);
      console.log(`Discovered: ${disc.length} chapters. Max chapter: ${disc[disc.length - 1]?.chapterNumber}`);
      console.log('Last 5 discovered:', disc.slice(-5));
    } catch (e: any) {
      console.log(`Error discovering: ${e.message}`);
    }
  }
}

async function run() {
  await inspectSeries('the-divine-demon-s-grand-ascension');
  await inspectSeries('chronicles-of-the-lazy-sovereign');
}
run();
