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
  console.log("Checking function definition of has_role...");
  
  // We can query information_schema or pg_proc to find the function source and language
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: '8a440e3d-b3d0-4103-a131-77c6d8572fa5',
    _role: 'admin'
  });
  console.log("Calling has_role(admin_uid, 'admin') directly returned:", data, "error:", error);

  // Let's run a query on pg_proc to see what language and definition has_role has
  // Since we cannot run raw SQL directly easily, let's check if we can query pg_proc via postgrest?
  // Usually, pg_* tables are not exposed via PostgREST unless there is a view or we query them.
  // Let's try to query pg_proc if it's exposed, otherwise let's see.
  // Actually, we can check if they have executed the migration yet. Let's inspect the migrations table in Supabase.
  const { data: migrations, error: migError } = await supabase
    .from('_schema_migrations') // wait, is it schema_migrations or _schema_migrations or supabase_migrations?
    .select('*')
    .limit(10);
  console.log("Migrations check:", migrations, "error:", migError);
}

run();
