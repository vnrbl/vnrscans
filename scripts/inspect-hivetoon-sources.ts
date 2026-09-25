import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('series_import_sources')
    .select('id, source_site, scanlation_group, source_url, series_id, series:series(title)')
    .or('source_url.ilike.%hivetoon%,source_site.ilike.%hive%');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${data?.length || 0} Hivetoon sources in series_import_sources:`);
  for (const s of (data || [])) {
    console.log(`- ID: ${s.id} | Site: "${s.source_site}" | Group: "${s.scanlation_group}" | URL: ${s.source_url} | Series: ${(s as any)?.series?.title}`);
  }

  // Also check chapters scanlation_group
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('scanlation_group')
    .or('scanlation_group.ilike.%hive%')
    .limit(500);

  const distinctGroups = new Set(chapters?.map(c => c.scanlation_group));
  console.log('\nDistinct chapter scanlation_groups matching "hive":', Array.from(distinctGroups));
}

run();
