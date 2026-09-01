import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = '20e45458-3613-4708-b896-31c65f0e27ad';

  console.log(`Updating roles for user ID '${userId}' to uploader...`);

  // Delete moderator role if it exists
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'moderator');

  if (deleteError) {
    console.error("Error deleting moderator role:", deleteError);
  }

  // Insert uploader role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'uploader'
    });

  if (insertError) {
    console.error("Error inserting uploader role:", insertError);
    console.log("\n💡 Make sure you have executed the migration script to add 'uploader' to the app_role enum first!");
    process.exit(1);
  }

  console.log(`✅ Success! User ID '${userId}' has been assigned the 'uploader' role.`);
}

run();
