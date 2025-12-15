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

async function register() {
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`\n👤 Registering Admin: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'System Admin', role: 'admin' }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('   ✅ User already exists (Good).');
    } else {
        console.error('   ❌ Registration Error:', error.message);
    }
  } else {
    console.log('   ✅ User created successfully.');
  }
  
  console.log('   👉 NEXT STEP: Run the SQL migration to confirm email and seed content.');
}

register();
