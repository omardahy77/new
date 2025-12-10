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

async function verifyLoginFix() {
  console.log('\n🔐 FINAL LOGIN VERIFICATION');
  console.log('===========================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`👉 Attempting login for: ${email}`);
  console.log('   This tests if the "UPDATE auth.users" trigger crash is resolved.');
  
  const start = Date.now();
  
  // 1. LOGIN ATTEMPT
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  const duration = Date.now() - start;

  if (authError) {
    console.log('❌ LOGIN FAILED');
    console.error('   Error Status:', authError.status);
    console.error('   Error Message:', authError.message);
    
    if (authError.status === 500) {
        console.error('\n⚠️ CRITICAL: The database is still crashing (500 Error).');
        console.error('   The migration to remove triggers might not have applied correctly.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    
    // 2. PROFILE FETCH ATTEMPT (Post-Login)
    console.log('👉 Fetching profile to ensure read access...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
    if (profileError) {
        console.error('❌ Profile Fetch Error:', profileError.message);
    } else {
        console.log('✅ Profile Fetched Successfully');
        console.log(`   Role: ${profile.role}`);
        
        if (profile.role === 'admin') {
            console.log('\n🎉 SYSTEM STATUS: STABLE & FIXED');
            console.log('   You can now log in via the browser.');
        } else {
            console.warn('⚠️ User logged in but is not Admin.');
        }
    }
  }
  console.log('===========================\n');
}

verifyLoginFix();
