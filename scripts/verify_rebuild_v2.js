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

async function verifyRebuildV2() {
  console.log('\n🏗️  VERIFYING REBUILD V2 (DEPENDENCY FIX)');
  console.log('=========================================');

  let allGood = true;

  // 1. Check if Tables Exist (Simple Read)
  const tables = ['profiles', 'courses', 'site_settings'];
  for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1).single();
      if (error && error.code !== 'PGRST116') {
          console.log(`❌ Table '${table}' check failed: ${error.message}`);
          allGood = false;
      } else {
          console.log(`✅ Table '${table}' exists.`);
      }
  }

  // 2. Check Admin Profile
  const email = 'admin@sniperfx.com';
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
  
  if (profile) {
      console.log(`✅ Admin Profile Found: ${profile.role}`);
      if (profile.role !== 'admin') {
          console.warn('⚠️ Admin role is incorrect (Should be admin).');
          allGood = false;
      }
  } else {
      console.warn('⚠️ Admin profile not found (Will be created on login).');
  }

  // 3. Check Settings
  const { data: settings } = await supabase.from('site_settings').select('*').limit(1).single();
  if (settings) {
      console.log('✅ Site Settings Initialized.');
  } else {
      console.log('❌ Site Settings Missing.');
      allGood = false;
  }

  console.log('=========================================');
  if (allGood) {
      console.log('🎉 SUCCESS: Rebuild V2 Complete!');
      console.log('   The "cannot drop function" error should be resolved.');
      console.log('   You can now log in at /login');
  } else {
      console.log('⚠️ REBUILD COMPLETED WITH WARNINGS.');
  }
  console.log('\n');
}

verifyRebuildV2();
