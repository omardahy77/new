import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase URL or Key in .env');
  process.exit(1);
}

// Use Service Key if available (and not placeholder) to bypass rate limits
const useServiceKey = supabaseServiceKey && supabaseServiceKey !== "YOUR_API_KEY";
const supabase = createClient(supabaseUrl, useServiceKey ? supabaseServiceKey : supabaseAnonKey);

const SITE_SETTINGS = {
  site_name: "Sniper FX Gold",
  site_name_en: "Sniper FX Gold",
  hero_title: "تداول بذكاء بدقة القناص",
  hero_title_en: "Trade Smart with Sniper Precision",
  hero_title_line1: "تداول بذكاء",
  hero_title_line1_en: "Trade Smart",
  hero_title_line2: "بدقة القناص",
  hero_title_line2_en: "With Sniper Precision",
  hero_desc: "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
  hero_desc_en: "Discover the secrets of market making... A complete, secure LMS taking you from zero to hero.",
  logo_url: "https://i.postimg.cc/Bb0PZ00P/tsmym-bdwn-wnwan-2.png",
  maintenance_mode: false,
  stats: { students: "+1500", hours: "+50" },
  social_links: { 
    telegram: "https://t.me/sniperfx", 
    instagram: "https://instagram.com/sniperfx", 
    youtube: "https://youtube.com/@sniperfx",
    facebook: "https://facebook.com/sniperfx",
    tiktok: "https://tiktok.com/@sniperfx",
    whatsapp: "https://wa.me/1234567890"
  },
  home_features: [
    { title: "تحليل فني متقدم", description: "تعلم استراتيجيات التحليل الفني التي تستخدمها البنوك الكبرى.", icon: "LineChart" },
    { title: "إدارة مخاطر صارمة", description: "كيف تحمي رأس مالك وتضاعف أرباحك بأقل مخاطرة ممكنة.", icon: "Shield" },
    { title: "سيكولوجية التداول", description: "التحكم في المشاعر والانضباط هو مفتاح النجاح في الأسواق.", icon: "Brain" },
    { title: "مجتمع حصري", description: "تواصل مع نخبة المتداولين وتبادل الخبرات والفرص يومياً.", icon: "Users" }
  ],
  features_config: { 
    show_coming_soon: true, 
    show_stats: true, 
    allow_registration: true,
    social_facebook_visible: true,
    social_instagram_visible: true,
    social_telegram_visible: true,
    social_youtube_visible: true,
    social_tiktok_visible: true,
    social_whatsapp_visible: true
  },
  content_config: {
    about_main_title: "من نحن",
    about_main_desc: "نحن أكاديمية متخصصة في تعليم تداول الذهب والفوركس.",
    mission_title: "مهمتنا",
    mission_desc: "توفير أحدث الأدوات والاستراتيجيات التعليمية.",
    vision_title: "رؤيتنا",
    vision_desc: "أن نكون المصدر الأول لتعلم التداول في الوطن العربي.",
    contact_main_title: "تواصل معنا",
    contact_main_desc: "فريق الدعم الفني جاهز للرد على استفساراتكم.",
    footer_tagline: "المنصة العربية الأولى لاحتراف الذهب",
    footer_sub_tagline: "تعليم حقيقي. نتائج حقيقية."
  }
};

const COURSES = [
  {
    title: "دورة احتراف تداول الذهب (Forex Gold Mastery)",
    description: "كورس شامل يأخذك من الصفر وحتى احتراف تداول الذهب XAUUSD.",
    thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
    is_paid: true,
    rating: 4.9,
    level: "خبير",
    duration: "25 ساعة",
    lesson_count: 15
  },
  {
    title: "أساسيات الفوركس للمبتدئين",
    description: "المدخل الصحيح لعالم التداول. شرح مبسط للمفاهيم الأساسية.",
    thumbnail: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg",
    is_paid: false,
    rating: 4.8,
    level: "مبتدئ",
    duration: "10 ساعات",
    lesson_count: 5
  }
];

const LESSONS = [
  {
    title: "ما هو الفوركس؟ وكيف تبدأ؟",
    description: "مقدمة شاملة عن سوق العملات الأجنبية (Forex).",
    video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q",
    duration: "15:30",
    order: 1
  },
  {
    title: "شرح الشموع اليابانية بالتفصيل",
    description: "تعلم قراءة الشموع اليابانية وأهم النماذج.",
    video_url: "https://www.youtube.com/watch?v=C3M8QW8v6mU",
    duration: "22:15",
    order: 2
  },
  {
    title: "الدعوم والمقاومات (Support & Resistance)",
    description: "كيف تحدد مناطق الدخول والخروج القوية.",
    video_url: "https://www.youtube.com/watch?v=4M5o7p3_gW0",
    duration: "18:45",
    order: 3
  }
];

async function run() {
  console.log('\n🚀 STARTING SYSTEM VERIFICATION & SEEDING...');
  console.log('============================================');
  console.log(`   Using ${useServiceKey ? 'Service Role Key (Admin Mode)' : 'Anon Key (Public Mode)'}`);

  // 1. Check Database Connection & Schema
  console.log('1. Checking Database Connection...');
  const { error: dbError } = await supabase.from('profiles').select('count').limit(1).single();
  
  if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Database Error:', dbError.message);
      if (dbError.message.includes('relation "public.profiles" does not exist')) {
          console.error('   CRITICAL: Schema is missing. Please run "restore_schema.sql" in Supabase Dashboard.');
      }
      return;
  }
  console.log('✅ Database Connected & Schema Exists.');

  // 2. Ensure Admin User
  console.log('\n2. Ensuring Admin Account...');
  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (authError) {
      console.log('   ⚠️ Admin not found or password wrong. Attempting creation/fix...');
      
      if (useServiceKey) {
         // STRATEGY 1: Service Key (Auto-confirm email)
         // This is the robust fix that bypasses email verification
         const { error: createError } = await supabase.auth.admin.createUser({
             email, 
             password, 
             email_confirm: true, 
             user_metadata: { full_name: 'System Admin', role: 'admin' }
         });
 
         if (createError?.message.includes('already been registered')) {
             // User exists (likely unconfirmed), force update
             console.log('   ℹ️ User exists. Forcing confirmation...');
             const { data: { users } } = await supabase.auth.admin.listUsers();
             const uid = users.find(u => u.email === email)?.id;
             if (uid) {
                 await supabase.auth.admin.updateUserById(uid, { email_confirm: true, password });
                 console.log('   ✅ Admin Account Verified & Updated.');
             }
         } else if (createError) {
             console.error('   ❌ Failed to create admin:', createError.message);
         } else {
             console.log('   ✅ Admin Account Created (Verified).');
         }
      } else {
         // STRATEGY 2: Anon Key (Requires manual confirmation)
         // Fallback for when user hasn't set up the service key
         let { error: signUpError } = await supabase.auth.signUp({
             email, password, options: { data: { full_name: 'System Admin', role: 'admin' } }
         });
 
         if (signUpError && signUpError.message.includes('security purposes')) {
             const waitTime = parseInt(signUpError.message.match(/after (\d+) seconds/)?.[1] || '60', 10);
             console.log(`   ⏳ Rate limit detected. Waiting ${waitTime + 2} seconds before retry...`);
             await new Promise(resolve => setTimeout(resolve, (waitTime + 2) * 1000));
             const retry = await supabase.auth.signUp({
                 email, password, options: { data: { full_name: 'System Admin', role: 'admin' } }
             });
             signUpError = retry.error;
         }
 
         if (signUpError) {
             console.error('   ❌ Failed to create admin:', signUpError.message);
         } else {
             console.log('   ✅ Admin Created. ⚠️ IMPORTANT: You must run the SQL migration to confirm this email manually.');
         }
      }
  } else {
      console.log('   ✅ Admin Account Exists.');
      // Ensure Profile exists for admin
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      if (!profile) {
          console.log('   ⚠️ Admin Profile missing. Creating...');
          await supabase.from('profiles').insert({
              id: authData.user.id, email, full_name: 'System Admin', role: 'admin', status: 'active'
          });
      }
  }

  // 3. Seed Content if Empty
  console.log('\n3. Checking Content...');
  const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  
  if (courseCount === 0) {
      console.log('   ⚠️ No courses found. Seeding default content...');
      
      // Seed Settings
      await supabase.from('site_settings').insert(SITE_SETTINGS);
      
      // Seed Courses
      for (const course of COURSES) {
          const { data: newCourse } = await supabase.from('courses').insert(course).select().single();
          if (newCourse) {
              console.log(`      + Created Course: ${course.title}`);
              // Seed Lessons for this course
              const courseLessons = LESSONS.map(l => ({ ...l, course_id: newCourse.id, is_published: true, thumbnail_url: course.thumbnail }));
              await supabase.from('lessons').insert(courseLessons);
          }
      }
      console.log('   ✅ Content Seeding Complete.');
  } else {
      console.log(`   ✅ Content exists (${courseCount} courses). Skipping seed.`);
  }

  console.log('\n============================================');
  console.log('🎉 SYSTEM READY CHECK COMPLETE');
  console.log('   If login fails with "Email not confirmed", run the SQL migration.');
  console.log('============================================\n');
}

run();
