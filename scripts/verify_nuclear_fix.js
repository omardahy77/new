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

async function verifyNuclearFix() {
  console.log('\n☢️  VERIFYING NUCLEAR FIX (TRIGGER CLEANUP)');
  console.log('==========================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`👉 Testing Login for: ${email}`);
  
  const start = Date.now();
  
  // 1. LOGIN ATTEMPT
  // This triggers an UPDATE on auth.users (last_sign_in_at).
  // The nuclear fix ensures NO triggers fire on UPDATE, so this MUST succeed.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  const duration = Date.now() - start;

  if (error) {
    console.log('❌ LOGIN FAILED');
    console.error('   Error:', error.message);
    if (error.status === 500) {
        console.error('   CRITICAL: The database is still crashing. The triggers were not removed correctly.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
    
    // 2. PROFILE CHECK
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    
    if (profile) {
        console.log(`   Profile Role: ${profile.role.toUpperCase()}`);
        if (profile.role === 'admin') {
            console.log('\n🎉 SYSTEM IS FULLY OPERATIONAL!');
            console.log('   The "Nuclear Fix" was successful. No more 500 errors.');
        } else {
            console.warn('   ⚠️ User is logged in but role is not admin (Frontend will auto-fix this).');
        }
    } else {
        console.log('   ⚠️ Profile missing (Frontend will auto-create it).');
    }
  }
  console.log('==========================================\n');
}

verifyNuclearFix();
