import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Maxed out level constants
const MAXED_LEVEL = 99;
const MAXED_XP = 100000;

async function setAdminMaxedLevel() {
  const userId = '8a440e3d-b3d0-4103-a131-77c6d8572fa5';
  
  console.log('🔐 Setting maxed out level for admin profile...\n');
  console.log(`User ID: ${userId}`);
  console.log(`Target Level: ${MAXED_LEVEL}`);
  console.log(`Target XP: ${MAXED_XP}\n`);

  try {
    // Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Error fetching user:', authError.message);
      console.log('\n💡 User might not exist yet. They need to sign up first.');
      return;
    }

    console.log(`✅ User found: ${authUser.user.email}\n`);

    // Ensure admin role exists
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

    if (!existingRole) {
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
      console.log('✅ Admin role granted!');
    }

    // Update profile with maxed level and XP
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_level: MAXED_LEVEL,
        experience_points: MAXED_XP,
      } as any)
      .eq('user_id', userId);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      return;
    }

    console.log(`✅ Profile updated with Level ${MAXED_LEVEL} and ${MAXED_XP} XP!`);
    console.log('\n🎉 Admin profile now has maxed out level!');

  } catch (error) {
    console.error('❌ Error during operation:', error);
  }
}

setAdminMaxedLevel();