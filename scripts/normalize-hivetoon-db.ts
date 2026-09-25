import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log('🔄 Normalizing "Hivetoons" / "Hive Toons" across Supabase database...');

  // 1. Update series_import_sources
  const { data: sources, error: srcErr } = await supabase
    .from('series_import_sources')
    .select('id, source_site, scanlation_group, source_url')
    .or('source_site.ilike.%hivetoon%,scanlation_group.ilike.%hivetoon%,source_url.ilike.%hivetoon%');

  if (srcErr) {
    console.error('Error fetching sources:', srcErr);
    return;
  }

  console.log(`Found ${sources?.length || 0} Hivetoon series_import_sources rows.`);
  let updatedSources = 0;
  for (const s of (sources || [])) {
    if (s.source_site !== 'Hive Toons' || s.scanlation_group !== 'Hive Toons') {
      console.log(`  Updating source ${s.id} (${s.source_url}): "${s.source_site}" / "${s.scanlation_group}" -> "Hive Toons"`);
      const { error: updErr } = await supabase
        .from('series_import_sources')
        .update({
          source_site: 'Hive Toons',
          scanlation_group: 'Hive Toons',
        })
        .eq('id', s.id);
      if (updErr) console.error(`  Error updating source ${s.id}:`, updErr.message);
      else updatedSources++;
    }
  }
  console.log(`✅ Normalized ${updatedSources} row(s) in series_import_sources.`);

  // 2. Update chapters scanlation_group
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, scanlation_group')
    .ilike('scanlation_group', '%hivetoon%');

  if (chErr) {
    console.error('Error fetching chapters:', chErr);
    return;
  }

  const toUpdate = (chapters || []).filter(c => c.scanlation_group !== 'Hive Toons');
  console.log(`Found ${toUpdate.length} chapters where scanlation_group is not "Hive Toons".`);
  if (toUpdate.length > 0) {
    const ids = toUpdate.map(c => c.id);
    const { error: chUpdErr } = await supabase
      .from('chapters')
      .update({ scanlation_group: 'Hive Toons' })
      .in('id', ids);
    if (chUpdErr) console.error('Error updating chapters:', chUpdErr.message);
    else console.log(`✅ Updated ${toUpdate.length} chapters to scanlation_group: "Hive Toons".`);
  }

  // 3. Update series_import_logs where source_site was logged
  console.log('Done normalizing database records.');
}

run();
