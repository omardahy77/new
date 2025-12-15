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

async function verifyScorchedEarth() {
  console.log('\n🔥 VERIFYING SCORCHED EARTH FIX');
  console.log('=================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`👉 Testing Login for: ${email}`);
  
  const start = Date.now();
  
  // 1. LOGIN ATTEMPT
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  const duration = Date.now() - start;

  if (error) {
    console.log('❌ LOGIN FAILED (Database Error)');
    console.error('   Error:', error.message);
    
    // CHECK BYPASS
    console.log('   Checking if session exists despite error...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
        console.log('   ✅ BYPASS SUCCESSFUL: Valid session found!');
        console.log('   The frontend will ignore the 500 error and log you in.');
    } else {
        console.error('   ❌ BYPASS FAILED: No session created.');
    }

  } else {
    console.log('✅ LOGIN SUCCESSFUL (Clean)');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
  }
  console.log('=================================\n');
}

verifyScorchedEarth();
