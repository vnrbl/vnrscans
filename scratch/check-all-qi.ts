import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAllQiSeries() {
  const { data: sources, error } = await supabase
    .from('series_import_sources')
    .select('id, series_id, source_url, scanlation_group, series:series(id, title, slug)')
    .or('source_url.ilike.%qiscans%,source_url.ilike.%qimanga%,source_url.ilike.%qimanhwa%,scanlation_group.ilike.%Qi Scans%');

  if (error) {
    console.error('Error fetching sources:', error);
    return;
  }

  console.log(`Found ${sources.length} Qi series sources:`);

  for (const s of sources) {
    const seriesTitle = (s.series as any)?.title;
    const seriesSlug = (s.series as any)?.slug;
    const seriesId = s.series_id;

    // Get DB chapters
    const { data: dbChapters } = await supabase
      .from('chapters')
      .select('chapter_number, scanlation_group')
      .eq('series_id', seriesId);

    const qiDbChapters = (dbChapters || []).filter(
      c => (c.scanlation_group || '').toLowerCase().includes('qi')
    );
    const allDbNums = (dbChapters || []).map(c => Number(c.chapter_number));
    const qiDbNums = qiDbChapters.map(c => Number(c.chapter_number));

    const dbMaxAll = allDbNums.length > 0 ? Math.max(...allDbNums) : 0;
    const dbMaxQi = qiDbNums.length > 0 ? Math.max(...qiDbNums) : 0;

    let discCount = 0;
    let discMax = 0;
    let discMin = 0;
    let discNums: number[] = [];

    try {
      const discovered = await extractChaptersFromSeriesUrl(s.source_url);
      discNums = discovered.map(c => c.chapterNumber);
      discCount = discovered.length;
      discMax = discNums.length > 0 ? Math.max(...discNums) : 0;
      discMin = discNums.length > 0 ? Math.min(...discNums) : 0;
    } catch (e: any) {
      console.log(`[ERR] ${seriesTitle}: ${e.message}`);
      continue;
    }

    const missingInQi = discNums.filter(n => !qiDbNums.includes(n));
    const missingInAll = discNums.filter(n => !allDbNums.includes(n));

    console.log(`\n========================================`);
    console.log(`Series: ${seriesTitle} (${seriesSlug})`);
    console.log(`Source URL: ${s.source_url}`);
    console.log(`DB Count (Total / Qi): ${dbChapters?.length} / ${qiDbChapters.length} | DB Max (Total / Qi): ${dbMaxAll} / ${dbMaxQi}`);
    console.log(`Discovered Count: ${discCount} | Min: ${discMin} | Max: ${discMax}`);
    console.log(`Missing for Qi group (${missingInQi.length}):`, missingInQi.slice(0, 10));
    console.log(`Missing across all groups (${missingInAll.length}):`, missingInAll.slice(0, 10));
  }
}

checkAllQiSeries();
