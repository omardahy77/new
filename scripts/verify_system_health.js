import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySystemHealth() {
  console.log('\n🏥 FINAL SYSTEM HEALTH CHECK (POST-FIX)');
  console.log('=======================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. AUTHENTICATION
  console.log(`1. Testing Login for ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Login Failed:', authError.message);
    if (authError.status === 500) {
        console.error('   CRITICAL: Database Trigger still failing.');
    }
    return;
  }
  console.log('✅ Login Successful');
  const userId = authData.user.id;

  // 2. PROFILE & ROLE
  console.log('2. Verifying Profile & Role...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
  } else {
    console.log('✅ Profile Found');
    if (profile.role === 'admin') {
        console.log('   Role: ADMIN (Correct)');
    } else {
        console.error(`   Role: ${profile.role} (INCORRECT - Should be admin)`);
    }
  }

  // 3. RLS PERMISSIONS (Admin Dashboard Access)
  console.log('3. Testing Admin Permissions (RLS)...');
  // Try to read ALL profiles (only allowed for admins)
  const { count, error: listError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (listError) {
    console.error('❌ RLS Check Failed:', listError.message);
    console.log('   This means the user is logged in, but the database does not recognize them as admin.');
  } else {
    console.log(`✅ RLS Check Passed. Can access ${count} profiles.`);
  }

  console.log('=======================================');
  if (!authError && !profileError && profile?.role === 'admin' && !listError) {
      console.log('🎉 SYSTEM IS 100% HEALTHY');
      console.log('   You can now log in via the website without issues.');
  } else {
      console.log('⚠️ SYSTEM HAS ISSUES. PLEASE REVIEW LOGS.');
  }
  console.log('\n');
}

verifySystemHealth();
