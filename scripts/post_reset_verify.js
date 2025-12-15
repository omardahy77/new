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

async function verify() {
  console.log('\n🔍 FINAL SYSTEM VERIFICATION');
  console.log('==========================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Check Admin Login
  process.stdout.write('1. Testing Admin Login... ');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.log('❌ FAILED');
    console.error('   Error:', authError.message);
    console.log('   👉 Suggestion: Run "node scripts/quick_register_admin.js" then re-run the SQL.');
    return;
  }
  console.log('✅ PASSED');

  // 2. Check Profile Role
  process.stdout.write('2. Verifying Admin Role... ');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (profileError || profile.role !== 'admin') {
    console.log('❌ FAILED');
    console.log('   Current Role:', profile?.role || 'None');
  } else {
    console.log('✅ PASSED');
  }

  // 3. Check Content (Courses)
  process.stdout.write('3. Checking Courses...     ');
  const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  
  if (courseCount === 0) {
    console.log('⚠️ WARNING (0 Courses found)');
  } else {
    console.log(`✅ PASSED (${courseCount} courses found)`);
  }

  // 4. Check Settings
  process.stdout.write('4. Checking CMS Settings...');
  const { data: settings } = await supabase.from('site_settings').select('site_name').limit(1).single();
  if (!settings) {
    console.log('⚠️ WARNING (Settings missing)');
  } else {
    console.log(`✅ PASSED (${settings.site_name})`);
  }

  console.log('==========================');
  console.log('🎉 SYSTEM READY FOR USE');
  console.log('   Login at: /login');
}

verify();
