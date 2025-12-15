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

async function ensureAdminReady() {
  console.log('\n🔧 ENSURING ADMIN ACCOUNT IS READY...');
  console.log('=====================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Try Login
  console.log(`👉 Checking account: ${email}`);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
      console.log('❌ Login Failed:', authError.message);
      if (authError.message.includes('Invalid login')) {
          console.log('   ⚠️ Account exists but password might be wrong, or account was deleted from Auth.');
          console.log('   👉 Please try registering a new account with this email via the UI if needed.');
      } else {
          console.log('   ⚠️ Account likely does not exist in Auth service.');
          console.log('   👉 Auto-creating account via SignUp...');
          
          const { data: signUp, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                  data: { full_name: 'System Admin', role: 'admin' }
              }
          });
          
          if (signUpError) {
              console.error('   ❌ SignUp Failed:', signUpError.message);
          } else {
              console.log('   ✅ Account Created Successfully!');
              console.log('   User ID:', signUp.user?.id);
          }
      }
  } else {
      console.log('✅ Auth Account Exists. User ID:', auth.user.id);
      
      // 2. Check Profile (Public Schema)
      // Since we wiped the DB, this is likely missing
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single();
        
      if (profileError || !profile) {
          console.log('⚠️ Profile missing in public schema (Expected after wipe).');
          console.log('   👉 Creating Admin Profile...');
          
          const { error: insertError } = await supabase.from('profiles').insert({
              id: auth.user.id,
              email: email,
              full_name: 'System Admin',
              role: 'admin',
              status: 'active'
          });
          
          if (insertError) {
              console.error('   ❌ Failed to create profile:', insertError.message);
          } else {
              console.log('   ✅ Admin Profile Created Successfully!');
          }
      } else {
          console.log('✅ Profile Exists.');
          if (profile.role !== 'admin') {
              console.log('   ⚠️ Role is not admin. Fixing...');
              await supabase.from('profiles').update({ role: 'admin', status: 'active' }).eq('id', auth.user.id);
              console.log('   ✅ Role updated to ADMIN.');
          } else {
              console.log('   🎉 Role is ADMIN.');
          }
      }
  }
  console.log('=====================================\n');
}

ensureAdminReady();
