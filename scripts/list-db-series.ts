import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: seriesList, error } = await supabase
    .from('series')
    .select('id, title, slug')
    .order('title');

  if (error) {
    console.error('Error fetching series:', error);
    return;
  }

  console.log('Series list:');
  seriesList?.forEach(s => {
    console.log(`- ${s.title} (${s.id}) [slug: ${s.slug}]`);
  });
}

main();
