import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, username');

  if (error) {
    console.error("Error fetching profiles:", error);
    process.exit(1);
  }

  console.log("Profiles:");
  console.log(JSON.stringify(data, null, 2));
}

run();
