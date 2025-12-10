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

async function verifySmartFix() {
  console.log('\n🧠 VERIFYING SMART FIX (TRIGGER NEUTRALIZATION)');
  console.log('================================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  console.log(`👉 Attempting login for: ${email}`);
  
  const start = Date.now();
  
  // Login triggers UPDATE on auth.users
  // The smart fix should make the trigger return NEW immediately, preventing recursion
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  const duration = Date.now() - start;

  if (error) {
    console.log('❌ LOGIN FAILED');
    console.error('   Error:', error.message);
    
    if (error.status === 500) {
        console.error('   CRITICAL: The smart fix did not apply correctly. The trigger is still active and failing.');
    }
  } else {
    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Response Time: ${duration}ms`);
    console.log('   User ID:', data.user.id);
    console.log('\n🎉 SUCCESS: The triggers are now harmless.');
    console.log('   You can log in without issues.');
  }
  console.log('================================================\n');
}

verifySmartFix();
