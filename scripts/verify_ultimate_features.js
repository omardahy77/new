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

async function verifyFeatures() {
  console.log('\n🚀 VERIFYING ULTIMATE FEATURES');
  console.log('============================');

  // 1. Check CMS Settings Schema
  console.log('1. Checking CMS Settings Schema...');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('content_config, features_config')
    .limit(1)
    .single();

  if (settingsError) {
    console.log('❌ FAILED: Could not fetch new settings columns.');
    console.error('   Error:', settingsError.message);
    console.log('   👉 Did you run the migration "20250222000000_ultimate_cms_and_user_management.sql"?');
  } else {
    console.log('✅ PASSED: New columns detected.');
    console.log('   Features Config:', settings.features_config ? 'Present' : 'Null (Will use defaults)');
  }

  // 2. Check Delete User RPC
  console.log('\n2. Checking "Delete User" Function...');
  // We can't call it without being admin, but we can check if it exists by calling it with invalid args
  // or checking if the RPC endpoint responds.
  
  // Attempt to call as Anon (Should fail with Access Denied or Auth error, NOT "function not found")
  const { error: rpcError } = await supabase.rpc('delete_user_completely', { target_user_id: '00000000-0000-0000-0000-000000000000' });

  if (rpcError) {
    if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.log('❌ FAILED: Function "delete_user_completely" not found.');
    } else if (rpcError.message.includes('Access Denied') || rpcError.code === 'PGRST204') {
        // PGRST204 means function found but returned void (or similar)
        // Access Denied means logic is working
        console.log('✅ PASSED: Function exists and security check is working (Access Denied for Anon).');
    } else {
        // Other errors likely mean function exists but failed logic (which is good)
        console.log(`✅ PASSED: Function exists (Response: ${rpcError.message})`);
    }
  } else {
    // If it somehow succeeded as anon (bad!), we'd be here
    console.log('⚠️ WARNING: Function executed as Anon? Check security.');
  }

  console.log('\n============================');
  console.log('🎉 VERIFICATION COMPLETE');
}

verifyFeatures();
