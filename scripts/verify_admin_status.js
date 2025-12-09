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

async function verifyAdmin() {
  console.log('\n🔍 Verifying Admin Status...');
  
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Login Failed:', authError.message);
    return;
  }

  console.log('✅ Login Successful');
  const userId = authData.user.id;
  console.log('   User ID:', userId);

  // 2. Check Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('❌ Profile Fetch Failed:', profileError.message);
    console.log('   👉 This likely means RLS is blocking access or the profile does not exist.');
  } else {
    console.log('✅ Profile Found:', profile);
    if (profile.role === 'admin') {
        console.log('🎉 SUCCESS: User is correctly set as ADMIN in the database.');
    } else {
        console.warn(`⚠️ WARNING: User role is '${profile.role}', expected 'admin'.`);
    }
  }

  // 3. Test RLS Bypass (Admin only can see all profiles)
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Admin Permissions Check Failed:', countError.message);
  } else {
    console.log(`✅ Admin Permissions Active. Can see ${count} total profiles.`);
  }
}

verifyAdmin();
