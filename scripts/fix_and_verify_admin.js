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

async function fixAndVerify() {
  console.log('\n🔧 MASTER REPAIR & VERIFICATION');
  console.log('===============================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Attempt Login (This will fire the fixed triggers)
  console.log(`1. Testing Login for ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Login Failed:', authError.message);
    return;
  }
  console.log('✅ Login Successful');
  const userId = authData.user.id;

  // 2. Check Profile Existence & Role
  console.log('2. Verifying Profile in Database...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
    console.log('   Note: If you just ran the migration, try running this script again.');
  } else {
    console.log('✅ Profile Found');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Status: ${profile.status}`);
    
    if (profile.role === 'admin') {
        console.log('🎉 SYSTEM STATUS: PERFECT. Admin access is guaranteed.');
    } else {
        console.warn('⚠️ WARNING: User is logged in but role is NOT admin.');
    }
  }
}

fixAndVerify();
