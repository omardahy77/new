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

async function verifyPermissions() {
  console.log('\n🛡️  VERIFYING DATABASE PERMISSIONS...');
  console.log('=====================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Login as Admin
  console.log(`1. Logging in as ${email}...`);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Login Failed:', authError.message);
    return;
  }
  console.log('✅ Login Successful');

  // 2. Test Write Access (Course Creation)
  console.log('2. Testing Write Access (Create Course)...');
  const testTitle = `Test Course ${Date.now()}`;
  
  const { data: course, error: createError } = await supabase
    .from('courses')
    .insert({
      title: testTitle,
      description: 'Permission Test',
      is_paid: false,
      level: 'beginner'
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ FAILED: Could not create course.');
    console.error('   Error:', createError.message);
    console.error('   👉 The RLS policies are still blocking writes.');
  } else {
    console.log('✅ PASSED: Course created successfully.');
    console.log('   ID:', course.id);

    // 3. Clean up (Delete)
    console.log('3. Testing Delete Access...');
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id);
      
    if (deleteError) {
      console.error('❌ FAILED: Could not delete course.', deleteError.message);
    } else {
      console.log('✅ PASSED: Course deleted successfully.');
    }
  }

  console.log('=====================================');
  console.log('🎉 PERMISSION CHECK COMPLETE');
}

verifyPermissions();
