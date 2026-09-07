import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';

dotenv.config();

async function findQiDifferences() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sources } = await supabase
    .from('series_import_sources')
    .select('id, series_id, source_url, scanlation_group, series:series_id(title, slug)')
    .or('source_url.ilike.%qiscans%,source_url.ilike.%qimanga%,source_url.ilike.%qimanhwa%');

  console.log(`Checking ${sources?.length} Qi sources...`);

  for (const s of (sources || [])) {
    const { count } = await supabase.from('chapters').select('*', { count: 'exact', head: true }).eq('series_id', s.series_id);
    const { data: maxRow } = await supabase.from('chapters').select('chapter_number').eq('series_id', s.series_id).order('chapter_number', { ascending: false }).limit(1);
    const dbMax = maxRow?.[0]?.chapter_number ?? 0;

    try {
      const discovered = await extractChaptersFromSeriesUrl(s.source_url);
      const discNums = discovered.map(c => c.chapterNumber);
      const discMax = Math.max(...discNums, 0);
      const discCount = discovered.length;

      // Check if discMax > dbMax or discCount > count
      if (discMax > dbMax || discCount > count) {
        console.log(`[AHEAD] ${s.series?.title} | DB count: ${count}, max: ${dbMax} | Discovered count: ${discCount}, max: ${discMax} | url: ${s.source_url}`);
      } else if (discCount < count || discMax < dbMax) {
        console.log(`[DISCREPANCY] ${s.series?.title} | DB count: ${count}, max: ${dbMax} | Discovered count: ${discCount}, max: ${discMax} | url: ${s.source_url}`);
      }
    } catch (e) {
      console.log(`[ERROR] ${s.series?.title}: ${e.message}`);
    }
  }
}

findQiDifferences();
