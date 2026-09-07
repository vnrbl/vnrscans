import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';
import { detectImportSource } from '../src/lib/import-source-utils.ts';

dotenv.config();

function chapterScanKey(chapterNumber: number, scanlationGroup: string | null) {
  return `${chapterNumber}::${(scanlationGroup || "").trim().toLowerCase()}`;
}

async function testQiSync() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: source } = await supabase
    .from('series_import_sources')
    .select('*, series:series(id, title, slug)')
    .ilike('source_url', '%noble-dark-clan%')
    .single();

  console.log('Source:', source.source_url, 'series:', source.series?.title, 'scanlation_group:', source.scanlation_group);
  const sourcePreset = detectImportSource(source.source_url);
  console.log('Detected preset:', sourcePreset);
  const scanlationGroup = source.scanlation_group || sourcePreset.scanlationGroup || null;
  console.log('Effective scanlationGroup:', scanlationGroup);

  const allDiscovered = await extractChaptersFromSeriesUrl(source.source_url);
  console.log('Discovered count:', allDiscovered.length);
  console.log('First 3 discovered:', allDiscovered.slice(0, 3));
  console.log('Last 3 discovered:', allDiscovered.slice(-3));

  const { data: existingRows } = await supabase
    .from('chapters')
    .select('id, chapter_number, scanlation_group')
    .eq('series_id', source.series_id);

  console.log('Existing rows count:', existingRows?.length);
  const existingKeys = new Set(
    (existingRows ?? []).map((ch) => chapterScanKey(Number(ch.chapter_number), ch.scanlation_group))
  );

  const seenKeys = new Set<string>();
  const missingCandidates = allDiscovered.filter((chapter) => {
    const num = Number(chapter.chapterNumber);
    const key = chapterScanKey(num, scanlationGroup);
    if (existingKeys.has(key) || seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
    return true;
  });

  console.log('Missing count:', missingCandidates.length);
  console.log('Missing chapters:', missingCandidates.map(c => c.chapterNumber));
  console.log('Skipped count:', allDiscovered.length - missingCandidates.length);
}

testQiSync();
