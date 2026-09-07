import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  try {
    const { data: series, error } = await supabase
      .from('series')
      .select('id, title, slug, type, created_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Series query error:', error);
      return;
    }
    console.log('Series fetched:', series?.length);

    for (const s of series || []) {
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', s.id);
      const { data: maxCh } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('series_id', s.id)
        .order('chapter_number', { ascending: false })
        .limit(1);
      const { data: sources } = await supabase
        .from('series_import_sources')
        .select('source_url, scanlation_group')
        .eq('series_id', s.id);

      console.log(`${s.title} (${s.slug}): count=${count}, max=${maxCh?.[0]?.chapter_number}, sources=${sources?.map(x => x.source_url).join(' | ')}`);
    }
  } catch (err) {
    console.error('Fatal:', err);
  }
}
check();
