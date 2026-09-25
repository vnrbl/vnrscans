import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function findDuplicateChapters() {
  const shouldDelete = process.argv.includes('--delete');
  console.log(`Checking for duplicate chapters across all series... ${shouldDelete ? '(DELETE MODE ENABLED)' : '(DRY RUN)'}`);
  
  let allChapters: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, series_id, chapter_number, scanlation_group, created_at, series:series(title)')
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching chapters:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allChapters = allChapters.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Loaded ${allChapters.length} total chapters from database.`);

  const seriesMap = new Map<string, Map<number, any[]>>();

  for (const ch of allChapters) {
    const sId = ch.series_id;
    const num = Number(ch.chapter_number);
    if (!seriesMap.has(sId)) {
      seriesMap.set(sId, new Map());
    }
    const chMap = seriesMap.get(sId)!;
    if (!chMap.has(num)) {
      chMap.set(num, []);
    }
    chMap.get(num)!.push(ch);
  }

  let totalDupes = 0;
  const duplicateIdsToDelete: string[] = [];
  const seriesWithDupes: Array<{ seriesId: string; title: string; dupeCount: number; sampleChapters: number[] }> = [];

  for (const [sId, chMap] of seriesMap.entries()) {
    let dupesForSeries = 0;
    const sampleNumbers: number[] = [];
    let title = 'Unknown';

    for (const [num, list] of chMap.entries()) {
      if (list.length > 1) {
        title = (list[0] as any)?.series?.title || sId;
        // Sort: keep the oldest created one (or first one)
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const toKeep = list[0];
        const toRemove = list.slice(1);

        dupesForSeries += toRemove.length;
        totalDupes += toRemove.length;
        for (const item of toRemove) {
          duplicateIdsToDelete.push(item.id);
        }
        if (sampleNumbers.length < 10) sampleNumbers.push(num);
      }
    }

    if (dupesForSeries > 0) {
      seriesWithDupes.push({ seriesId: sId, title, dupeCount: dupesForSeries, sampleChapters: sampleNumbers });
    }
  }

  console.log(`\nFound ${totalDupes} duplicate chapter rows across ${seriesWithDupes.length} series:`);
  for (const s of seriesWithDupes) {
    console.log(`  - "${s.title}": ${s.dupeCount} duplicate(s) (e.g. Ch. ${s.sampleChapters.join(', ')})`);
  }

  if (shouldDelete && duplicateIdsToDelete.length > 0) {
    console.log(`\n🧹 Deleting ${duplicateIdsToDelete.length} duplicate chapter rows in batches...`);
    const batchSize = 100;
    let deleted = 0;
    for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
      const batch = duplicateIdsToDelete.slice(i, i + batchSize);
      // Delete chapter_pages first to keep DB clean
      await supabase.from('chapter_pages').delete().in('chapter_id', batch);
      const { error: delErr } = await supabase.from('chapters').delete().in('id', batch);
      if (delErr) {
        console.error(`Error deleting batch starting at ${i}:`, delErr.message);
      } else {
        deleted += batch.length;
      }
    }
    console.log(`✅ Successfully deleted ${deleted} duplicate chapter(s).`);
  } else if (!shouldDelete && totalDupes > 0) {
    console.log('\nTip: Run with --delete to remove duplicate chapter rows.');
  }
}

findDuplicateChapters();
