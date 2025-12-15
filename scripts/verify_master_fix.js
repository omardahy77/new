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

async function verifyMasterFix() {
  console.log('\n🏆 VERIFYING MASTER FIX (RLS & TRIGGERS)');
  console.log('========================================');

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
    console.log('❌ LOGIN FAILED');
    console.error('   Error:', error.message);
    console.error('   Status:', error.status);
    
    if (error.status === 500) {
        console.error('   CRITICAL: Database 500 Error still persists.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
    
    // 2. PROFILE CHECK (RLS Test)
    console.log('👉 Testing Profile Access (RLS)...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
    
    if (profileError) {
        console.error('❌ Profile Access Failed:', profileError.message);
    } else {
        console.log('✅ Profile Access Granted');
        console.log(`   Role: ${profile.role.toUpperCase()}`);
        
        if (profile.role === 'admin') {
            console.log('\n🎉 SYSTEM IS 100% OPERATIONAL!');
            console.log('   You can now log in via the browser.');
        } else {
            console.warn('   ⚠️ User is logged in but role is not admin.');
        }
    }
  }
  console.log('========================================\n');
}

verifyMasterFix();
