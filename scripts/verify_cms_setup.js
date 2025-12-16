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
  console.log('\n🔍 VERIFYING CMS SETUP...');
  console.log('=========================');

  // 1. Check Settings Table
  const { data: settings, error } = await supabase.from('site_settings').select('*').limit(1);
  
  if (error) {
      console.log('❌ Error accessing site_settings:', error.message);
  } else if (settings && settings.length > 0) {
      const s = settings[0];
      console.log('✅ Site Settings Table: OK');
      console.log('   - Content Config:', s.content_config ? 'Present' : 'Missing (Will use defaults)');
      console.log('   - Features Config:', s.features_config ? 'Present' : 'Missing (Will use defaults)');
  } else {
      console.log('⚠️ Site Settings Table is empty. The app will use default values until you save settings in the Admin Dashboard.');
  }

  // 2. Check Delete Function
  // We can't call it as anon, but we can check if it exists in the schema via RPC error message
  const { error: rpcError } = await supabase.rpc('delete_user_completely', { target_user_id: '0000' });
  
  if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
      console.log('❌ Delete User Function: MISSING');
      console.log('   👉 Please run the migration: 20250222000000_ultimate_cms_and_user_management.sql');
  } else {
      console.log('✅ Delete User Function: INSTALLED');
  }

  console.log('=========================\n');
}

verify();
