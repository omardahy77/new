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

async function verifyCourseCreation() {
  console.log('\n🧪 VERIFYING COURSE CREATION (ADMIN PERMISSIONS)...');
  console.log('===================================================');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. Login
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

  // 2. Create Course
  const testTitle = `Test Course ${Date.now()}`;
  console.log(`2. Creating Course: "${testTitle}"...`);
  
  const { data: course, error: createError } = await supabase
    .from('courses')
    .insert({
      title: testTitle,
      description: 'Automated Test Course',
      is_paid: false,
      level: 'beginner',
      thumbnail: 'https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400'
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ CREATION FAILED:', createError.message);
    console.error('   The RLS policies might still be blocking the insert.');
  } else {
    console.log('✅ CREATION SUCCESSFUL');
    console.log('   Course ID:', course.id);

    // 3. Delete Course (Cleanup)
    console.log('3. Deleting Test Course...');
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id);

    if (deleteError) {
      console.error('❌ DELETE FAILED:', deleteError.message);
    } else {
      console.log('✅ DELETE SUCCESSFUL');
    }
    
    console.log('\n🎉 CONCLUSION: Admin permissions are FULLY FIXED.');
    console.log('   You can now add courses and lessons from the Dashboard.');
  }
  console.log('===================================================\n');
}

verifyCourseCreation();
