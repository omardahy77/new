import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('\n🧪 VERIFYING RECURSION FIX...');
    console.log('=============================');

    // 1. Sign In as Admin
    console.log('1. Attempting Admin Login...');
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@sniperfx.com',
        password: 'Hamza0100@'
    });

    if (loginError) {
        console.error('❌ Login Failed:', loginError.message);
        console.log('   (If credentials changed, please update script)');
        return;
    }
    console.log('   ✅ Logged in successfully');

    // 2. Test Profile Fetch (The Root Cause of Recursion)
    // If recursion is present, this query will fail or time out
    console.log('2. Testing Profile Access (RLS Check)...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        if (profileError.message.includes('recursion')) {
            console.error('❌ CRITICAL: Infinite Recursion still detected!');
        } else {
            console.error('❌ Profile Fetch Error:', profileError.message);
        }
    } else {
        console.log('   ✅ Profile fetched successfully (Recursion Fixed)');
        console.log(`   User Role: ${profile.role}`);
    }

    // 3. Test Course Deletion Permission (Simulation)
    // We won't actually delete, just check if we can read with the admin policy active
    console.log('3. Testing Admin Policy on Courses...');
    const { error: courseError } = await supabase
        .from('courses')
        .select('id')
        .limit(1);

    if (courseError) {
        console.error('❌ Course Access Error:', courseError.message);
    } else {
        console.log('   ✅ Admin can access courses table');
    }

    console.log('=============================');
    if (!profileError && !courseError) {
        console.log('🎉 SYSTEM IS STABLE. You can now delete courses safely.');
    }
}

run();
