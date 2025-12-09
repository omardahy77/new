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

async function checkAdminLogin() {
  console.log('\n🔐 TESTING ADMIN LOGIN (DATABASE TRIGGER CHECK)...');
  console.log('==================================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  const start = Date.now();
  
  // Attempt Login
  // This triggers an UPDATE on auth.users (last_sign_in_at), which was previously crashing
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  const duration = Date.now() - start;

  if (error) {
    console.log('❌ LOGIN FAILED');
    console.error('   Error Code:', error.status);
    console.error('   Message:', error.message);
    
    if (error.status === 500) {
        console.error('   CRITICAL: Database still returning 500. The triggers are still conflicting.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
    console.log('   Session Active: Yes');
    console.log('\n🎉 DIAGNOSIS: The "Database Schema Error" is RESOLVED.');
    console.log('   The system can now handle user logins correctly.');
  }
  console.log('==================================================\n');
}

checkAdminLogin();
