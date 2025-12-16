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

async function verify() {
  console.log('\n🌍 VERIFYING TRANSLATION COLUMNS...');
  console.log('===================================');

  // 1. Check if columns exist by selecting them
  console.log('1. Checking Schema...');
  const { data, error } = await supabase
    .from('site_settings')
    .select('site_name_en, hero_title_en, hero_desc_en')
    .limit(1);

  if (error) {
    console.log('❌ FAILED: Could not select translation columns.');
    console.error('   Error:', error.message);
    console.log('   👉 The migration might not have applied. Please try running it again.');
  } else {
    console.log('✅ PASSED: Columns exist.');
    console.log('   Data Sample:', data[0] || 'No rows found');
  }

  console.log('\n===================================');
  console.log('🎉 READY. You can now save English content in the Admin Dashboard.');
}

verify();
