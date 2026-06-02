import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantAdminAccess() {
  const userId = '8a440e3d-b3d0-4103-a131-77c6d8572fa5';
  const email = 'grindwithmt@gmail.com';
  
  console.log('🔐 Granting admin access...\n');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${email}\n`);

  try {
    // Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Error fetching user:', authError.message);
      console.log('\n💡 User might not exist yet. They need to sign up first.');
      return;
    }

    console.log(`✅ User found: ${authUser.user.email}\n`);

    // Check if user already has a role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing role:', checkError);
      return;
    }

    if (existingRole) {
      console.log('ℹ️  User already has admin role!');
      return;
    }

    // Grant admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (insertError) {
      console.error('❌ Error granting admin role:', insertError);
      return;
    }

    console.log('✅ Admin role granted successfully!');
    console.log('\n🎉 User can now access the Admin Panel');

  } catch (error) {
    console.error('❌ Error during admin grant:', error);
  }
}

grantAdminAccess();
