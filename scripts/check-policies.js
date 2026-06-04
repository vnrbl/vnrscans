import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Fetching policies...");
  const { data, error } = await supabase
    .rpc('get_policies_for_table', { table_name_param: 'user_roles' });

  if (error) {
    // If the rpc doesn't exist, execute a custom SQL query via anon/authenticated (fails)
    // or let's use the service_role key to select from pg_policies.
    const { data: policies, error: pgError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_roles');
    
    if (pgError) {
      // Let's run a direct query by querying a standard table or write a quick SQL test
      console.log("RPC get_policies_for_table failed, trying custom query...");
      console.error(pgError);
    } else {
      console.log("Policies:", policies);
      return;
    }
  } else {
    console.log("Policies via RPC:", data);
    return;
  }

  // Let's query using direct select if possible, or we can use pg_catalog.pg_policies
  const { data: directData, error: directError } = await supabase
    .from('profiles') // just any query to verify connection
    .select('count', { head: true });
    
  // Since we have service_role, we can run raw SQL if we define a function,
  // but let's query pg_policies using supabase.rpc or a direct select if views are exposed.
  // Actually, we can query public views. Let's see if we can get policies from pg_policies.
  const { data: pData, error: pError } = await supabase
    .from('pg_policies')
    .select('*');
  if (pError) {
    console.error("pg_policies query failed:", pError);
  } else {
    console.log("All policies:", pData);
  }
}

run();
