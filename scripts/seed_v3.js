import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === "YOUR_API_KEY") {
  console.error('❌ Service Role Key required for Admin Seeding.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('\n🌱 STARTING FRESH SEED (V3)...');
  
  // 1. Create/Reset Admin User
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';
  
  console.log('1. Configuring Admin Account...');
  // Try to find existing user first to avoid conflict error spam
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existingAdmin = users.find(u => u.email === email);
  
  if (existingAdmin) {
      // Update password and confirm email
      await supabase.auth.admin.updateUserById(existingAdmin.id, { 
          password: password,
          email_confirm: true,
          user_metadata: { full_name: 'System Admin' }
      });
      // Ensure profile exists and is admin
      await supabase.from('profiles').upsert({
          id: existingAdmin.id,
          email: email,
          full_name: 'System Admin',
          role: 'admin',
          status: 'active'
      });
      console.log('   ✅ Admin Updated.');
  } else {
      // Create new
      const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: 'System Admin' }
      });
      if (error) console.error('   ❌ Admin Creation Failed:', error.message);
      else console.log('   ✅ Admin Created.');
  }

  // 2. Seed Site Settings
  console.log('2. Seeding CMS Settings...');
  const { error: settingsError } = await supabase.from('site_settings').insert({
      site_name: "Sniper FX Gold",
      hero_title_line1: "تداول بذكاء",
      hero_title_line2: "بدقة القناص",
      hero_desc: "المنصة التعليمية الأقوى لاحتراف تداول الذهب والفوركس. سجل الآن وابدأ رحلتك.",
      social_links: {
          telegram: "https://t.me/sniperfx",
          facebook: "https://facebook.com",
          instagram: "https://instagram.com"
      }
  });
  if (!settingsError) console.log('   ✅ Settings Seeded.');

  // 3. Seed Courses (1 Free, 1 Paid)
  console.log('3. Seeding Courses...');
  
  // Free Course
  const { data: freeCourse } = await supabase.from('courses').insert({
      title: "أساسيات الفوركس (مجاني)",
      description: "كورس تمهيدي لتعلم أساسيات التداول والشموع اليابانية.",
      is_paid: false,
      thumbnail: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg",
      level: "مبتدئ"
  }).select().single();
  
  if (freeCourse) {
      await supabase.from('lessons').insert([
          { course_id: freeCourse.id, title: "مقدمة في الفوركس", video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q", order: 1 },
          { course_id: freeCourse.id, title: "شرح الشموع", video_url: "https://www.youtube.com/watch?v=C3M8QW8v6mU", order: 2 }
      ]);
      console.log('   ✅ Free Course Created.');
  }

  // Paid Course
  const { data: paidCourse } = await supabase.from('courses').insert({
      title: "احتراف الذهب (VIP)",
      description: "كورس مدفوع خاص للمشتركين فقط. يحتوي على استراتيجيات القناص.",
      is_paid: true,
      thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
      level: "خبير"
  }).select().single();

  if (paidCourse) {
      await supabase.from('lessons').insert([
          { course_id: paidCourse.id, title: "سر القناص 1", video_url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo", order: 1 },
          { course_id: paidCourse.id, title: "إدارة المحافظ الكبرى", video_url: "https://www.youtube.com/watch?v=6w2q0Qo7gT4", order: 2 }
      ]);
      console.log('   ✅ Paid Course Created (Locked).');
  }

  console.log('\n🎉 SYSTEM REBUILT SUCCESSFULLY!');
  console.log('   Login: admin@sniperfx.com / Hamza0100@');
}

seed();
