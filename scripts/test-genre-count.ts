import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase
    .from('genres')
    .select('*, series_genres(count)');
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Sample data:");
    console.log(JSON.stringify(data?.slice(0, 3), null, 2));
  }
}

run();
