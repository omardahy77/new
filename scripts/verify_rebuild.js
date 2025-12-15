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

async function verifyRebuild() {
  console.log('\n🏗️  VERIFYING DATABASE REBUILD');
  console.log('=============================');

  // 1. Check Tables
  const tables = ['profiles', 'courses', 'lessons', 'site_settings', 'enrollments'];
  let tablesOk = true;
  
  for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1).single();
      if (error && error.code !== 'PGRST116') {
          console.log(`❌ Table check failed: ${table} (${error.message})`);
          tablesOk = false;
      } else {
          console.log(`✅ Table exists: ${table}`);
      }
  }

  if (!tablesOk) {
      console.error('🛑 Rebuild verification failed. Some tables are missing.');
      return;
  }

  // 2. Check Admin Login
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`\n👉 Testing Admin Login for: ${email}`);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
      console.log('❌ Login Failed:', error.message);
  } else {
      console.log('✅ Login Successful');
      
      // 3. Check Admin Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      
      if (profile) {
          console.log(`   Role: ${profile.role}`);
          if (profile.role === 'admin') {
              console.log('\n🎉 SUCCESS: System is Clean, Stable, and Ready!');
          } else {
              console.warn('⚠️ User logged in but role is not admin. (Trigger might need check)');
          }
      } else {
          console.log('⚠️ Profile missing (Self-healing should fix this on frontend)');
      }
  }
  console.log('=============================\n');
}

verifyRebuild();
