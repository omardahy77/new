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

async function verifyLoginStability() {
  console.log('\n🔐 VERIFYING LOGIN STABILITY (FINAL CHECK)...');
  console.log('=============================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`👉 Attempting login for: ${email}`);
  
  const start = Date.now();
  
  // This action triggers the "UPDATE auth.users" event in the database.
  // If the bad trigger is still there, this will fail with 500.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  const duration = Date.now() - start;

  if (error) {
    console.log('❌ LOGIN FAILED');
    console.error('   Error Status:', error.status);
    console.error('   Error Message:', error.message);
    
    if (error.status === 500 || error.message.includes('Database error')) {
        console.error('\n⚠️ CRITICAL: The database trigger is STILL crashing the login.');
        console.error('   Please ensure the migration "fix_login_trigger_crash.sql" was applied correctly.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
    console.log('\n🎉 CONCLUSION: The 500 Error is GONE.');
    console.log('   The system can now handle logins without crashing.');
  }
  console.log('=============================================\n');
}

verifyLoginStability();
