import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerAdmin() {
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`\n🔄 Checking Admin Account: ${email}...`);

  // 1. Try to Login first
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginData?.user) {
    console.log('✅ Admin account already exists. Login successful.');
    console.log('   User ID:', loginData.user.id);
    return;
  }

  // 2. If login fails, try to Register
  console.log('⚠️ Account not found or password incorrect. Attempting to create...');
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'System Admin',
        role: 'admin' // The trigger will enforce this anyway
      }
    }
  });

  if (signUpError) {
    console.error('❌ Failed to create admin:', signUpError.message);
    if (signUpError.message.includes('already registered')) {
       console.log('ℹ️ Note: The user exists but maybe the password was wrong in the login attempt.');
    }
  } else if (signUpData?.user) {
    console.log('✅ Admin account created successfully!');
    console.log('   User ID:', signUpData.user.id);
    console.log('   Status:', signUpData.session ? 'Active Session' : 'Waiting for Email Confirmation (Check DB Trigger)');
  }
}

registerAdmin();
