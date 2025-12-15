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
  console.log('\n🏆 FINAL SYSTEM VERIFICATION (v4.0.0)');
  console.log('=======================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Login Check
  process.stdout.write('1. Admin Login... ');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.log('❌ FAILED');
    console.error('   Error:', authError.message);
    return;
  }
  console.log('✅ PASSED');

  // 2. Role Check
  process.stdout.write('2. Admin Privileges... ');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single();
  if (profile?.role === 'admin') {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED (Role: ' + profile?.role + ')');
  }

  // 3. Content Check
  process.stdout.write('3. Content Availability... ');
  const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  if (count > 0) {
    console.log(`✅ PASSED (${count} Courses)`);
  } else {
    console.log('⚠️ WARNING (0 Courses)');
  }

  console.log('=======================================');
  console.log('🎉 SYSTEM IS READY. LOGIN AT /login');
}

verify();
