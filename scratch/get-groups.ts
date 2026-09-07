import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getGroups() {
  const groups = new Set<string | null>();
  let from = 0;
  while (from < 25000) {
    const { data: batch, error } = await supabase
      .from('chapters')
      .select('scanlation_group')
      .range(from, from + 999);
    if (error || !batch || batch.length === 0) break;
    for (const c of batch) groups.add(c.scanlation_group);
    from += 1000;
  }
  console.log('Distinct groups in chapters:', Array.from(groups));
}

getGroups();
