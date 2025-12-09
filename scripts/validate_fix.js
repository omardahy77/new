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

async function validateSystem() {
  console.log('\n🧪 STARTING SYSTEM VALIDATION TEST...');
  console.log('=======================================');

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let userId = null;

  try {
    // STEP 1: Registration
    process.stdout.write('1. Testing User Registration... ');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { data: { full_name: 'Test User' } }
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('No user returned');
    
    userId = signUpData.user.id;
    console.log('✅ PASSED');

    // STEP 2: Profile Trigger Check (Critical)
    process.stdout.write('2. Verifying Profile Creation (Trigger)... ');
    
    // Wait a moment for trigger to fire
    await new Promise(r => setTimeout(r, 1000));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
        console.log('❌ FAILED');
        console.error('   The database trigger did not create a profile.');
        console.error('   Error:', profileError?.message);
        throw new Error('Profile trigger failed');
    }
    console.log('✅ PASSED');

    // STEP 3: Login Check
    process.stdout.write('3. Testing Login Flow... ');
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
        console.log('❌ FAILED');
        throw loginError;
    }
    console.log('✅ PASSED');

    console.log('=======================================');
    console.log('🎉 SYSTEM IS FULLY OPERATIONAL');
    console.log('   The "Infinite Recursion" and "Schema Error" bugs are resolved.');

  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error.message);
  } finally {
    // CLEANUP
    if (userId) {
        process.stdout.write('\n🧹 Cleaning up test user... ');
        // We use the admin RPC if available, or just leave it (it's a test user)
        // Since we are using Anon key here, we can't delete from auth.users directly easily
        // but we can try to delete the profile which cascades if set up, or just ignore.
        console.log('(Skipped - Requires Service Role)');
    }
  }
}

validateSystem();
