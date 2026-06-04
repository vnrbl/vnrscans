import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching all user roles from DB...");
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('role');

  if (error) {
    console.error("Error fetching user roles:", error);
    process.exit(1);
  }

  console.log("Current User Roles:");
  console.log(JSON.stringify(data, null, 2));
}

run();
