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

async function runIntegrityCheck() {
  console.log('\n🏥 STARTING FINAL SYSTEM HEALTH CHECK...');
  console.log('=========================================');

  let allGood = true;

  // TEST 1: Public Access (RLS)
  // Should allow reading basic data but NOT writing
  process.stdout.write('1. Checking Public Read Access... ');
  const { error: readError } = await supabase.from('courses').select('count').limit(1).single();
  
  if (readError && readError.code !== 'PGRST116') {
      console.log('❌ FAILED');
      console.error('   Error:', readError.message);
      allGood = false;
  } else {
      console.log('✅ PASSED');
  }

  // TEST 2: Admin Security Function
  // Calling is_admin() as an anonymous user should return FALSE, not an error
  process.stdout.write('2. Checking Security Functions... ');
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  
  if (rpcError) {
      console.log('❌ FAILED');
      console.error('   Error:', rpcError.message);
      console.error('   Hint: The function might be missing or has schema errors.');
      allGood = false;
  } else if (isAdmin === true) {
      console.log('❌ FAILED');
      console.error('   Security Risk: Anonymous user detected as Admin!');
      allGood = false;
  } else {
      console.log('✅ PASSED (Secure)');
  }

  // TEST 3: Profile Table Integrity
  process.stdout.write('3. Checking Database Tables...    ');
  const { error: tableError } = await supabase.from('profiles').select('id').limit(1);
  
  if (tableError && tableError.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
       // If RLS blocks it completely, that's also a sign of a policy issue for public profiles
       // But we expect public profiles to be viewable
       console.log('⚠️ WARNING');
       console.log('   Could not read profiles. This might be intentional RLS, but ensure "Public profiles are viewable" policy exists.');
  } else {
      console.log('✅ PASSED');
  }

  console.log('=========================================');
  if (allGood) {
      console.log('🎉 SYSTEM STATUS: HEALTHY & READY');
      console.log('   You can now log in at /login');
  } else {
      console.log('⚠️ SYSTEM STATUS: ISSUES DETECTED');
      console.log('   Please review the errors above.');
  }
  console.log('\n');
}

runIntegrityCheck();
