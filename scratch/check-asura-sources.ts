import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAsuraSources() {
  const { data: sources, error } = await supabase
    .from('series_import_sources')
    .select('id, series_id, source_url, scanlation_group, series:series(title, slug)')
    .ilike('source_url', '%asura%');

  if (error || !sources) {
    console.error('Error fetching sources:', error);
    return;
  }

  console.log(`Found ${sources.length} Asura sources`);

  for (const s of sources) {
    const seriesTitle = (s as any).series?.title || 'Unknown';
    const seriesSlug = (s as any).series?.slug || '';

    // Get DB chapters
    const { data: dbChapters } = await supabase
      .from('chapters')
      .select('chapter_number, scanlation_group')
      .eq('series_id', s.series_id)
      .order('chapter_number', { ascending: true });

    const totalDb = dbChapters?.length || 0;
    const maxDb = dbChapters && dbChapters.length > 0 ? Math.max(...dbChapters.map(c => Number(c.chapter_number))) : 0;

    console.log(`\n========================================`);
    console.log(`Series: ${seriesTitle} (${seriesSlug})`);
    console.log(`URL: ${s.source_url}`);
    console.log(`DB Count: ${totalDb} | DB Max: ${maxDb}`);

    try {
      const discovered = await extractChaptersFromSeriesUrl(s.source_url);
      const discNums = discovered.map(c => c.chapterNumber);
      const discMax = discNums.length > 0 ? Math.max(...discNums) : 0;
      const discMin = discNums.length > 0 ? Math.min(...discNums) : 0;

      console.log(`Discovered Count: ${discovered.length} | Min: ${discMin} | Max: ${discMax}`);

      // Check which discovered chapters are missing in DB
      const dbNums = new Set((dbChapters || []).map(c => Number(c.chapter_number)));
      const missingInDb = discNums.filter(n => !dbNums.has(n));
      console.log(`Missing in DB (${missingInDb.length}):`, missingInDb.slice(0, 10));
    } catch (e: any) {
      console.log(`Extraction error: ${e.message}`);
    }
  }
}

checkAsuraSources();
