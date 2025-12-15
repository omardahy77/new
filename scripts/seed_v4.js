import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Prefer Service Key for Admin actions
const supabase = createClient(supabaseUrl, supabaseServiceKey && supabaseServiceKey !== "YOUR_API_KEY" ? supabaseServiceKey : supabaseAnonKey);

async function seed() {
  console.log('\n🌱 STARTING ULTIMATE SEED (V4)...');
  console.log('==================================');

  // 1. Ensure Admin Profile
  const email = 'admin@sniperfx.com';
  console.log(`1. Promoting ${email} to Admin...`);
  
  // We use the RPC we just created in the migration
  const { error: rpcError } = await supabase.rpc('setup_admin_user', { admin_email: email });
  
  if (rpcError) {
      console.log('   ⚠️ RPC Failed (Maybe user does not exist yet).');
      console.log('   👉 Please register as "admin@sniperfx.com" first if you haven\'t.');
  } else {
      console.log('   ✅ Admin Permissions Granted.');
  }

  // 2. Seed Settings
  console.log('2. Seeding CMS Settings...');
  const { count } = await supabase.from('site_settings').select('*', { count: 'exact', head: true });
  
  if (count === 0) {
      await supabase.from('site_settings').insert({
          site_name: "Sniper FX Gold",
          hero_title_line1: "تداول بذكاء",
          hero_title_line2: "بدقة القناص",
          hero_desc: "المنصة التعليمية الأقوى لاحتراف تداول الذهب والفوركس.",
          social_links: {
              telegram: "https://t.me/sniperfx",
              facebook: "https://facebook.com",
              instagram: "https://instagram.com"
          }
      });
      console.log('   ✅ Settings Created.');
  }

  // 3. Seed Courses
  console.log('3. Seeding Default Courses...');
  
  // Free Course
  const { data: free } = await supabase.from('courses').insert({
      title: "دورة الأساسيات (مجاني)",
      description: "مدخل شامل لعالم التداول للجميع.",
      is_paid: false,
      thumbnail: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg",
      level: "مبتدئ"
  }).select().single();

  if (free) {
      await supabase.from('lessons').insert([
          { course_id: free.id, title: "المقدمة", video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q", order: 1 }
      ]);
  }

  // Paid Course
  const { data: paid } = await supabase.from('courses').insert({
      title: "دورة الاحتراف (VIP)",
      description: "استراتيجيات خاصة للمشتركين فقط.",
      is_paid: true,
      thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
      level: "خبير"
  }).select().single();

  if (paid) {
      await supabase.from('lessons').insert([
          { course_id: paid.id, title: "سر القناص", video_url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo", order: 1 }
      ]);
  }

  console.log('   ✅ Courses Created.');
  console.log('==================================');
  console.log('🎉 REBUILD COMPLETE.');
}

seed();
