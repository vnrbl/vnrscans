const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: chs } = await supabase
    .from('chapters')
    .select('id, chapter_number, slug, scanlation_group, uploaded_by, chapter_pages(page_number, image_url)')
    .eq('scanlation_group', 'Vortex Scans')
    .ilike('slug', '%northern-blade%')
    .order('chapter_number', { ascending: true })
    .limit(10);

  for (const ch of chs) {
    const pages = ch.chapter_pages || [];
    console.log(`Ch ${ch.chapter_number} (${ch.slug}): ${pages.length} pages. First URL: ${pages[0]?.image_url}`);
  }
}
check();
