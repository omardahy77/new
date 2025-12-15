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
    // Arabic Content
    about_main_title: "من نحن",
    about_main_desc: "نحن أكاديمية متخصصة في تعليم تداول الذهب والفوركس، نهدف إلى تخريج جيل من المتداولين المحترفين القادرين على تحقيق أرباح مستدامة.",
    mission_title: "مهمتنا",
    mission_desc: "توفير أحدث الأدوات والاستراتيجيات التعليمية.",
    vision_title: "رؤيتنا",
    vision_desc: "أن نكون المصدر الأول لتعلم التداول في الوطن العربي.",
    contact_main_title: "تواصل معنا",
    contact_main_desc: "فريق الدعم الفني جاهز للرد على استفساراتكم على مدار الساعة.",
    footer_tagline: "المنصة العربية الأولى لاحتراف الذهب",
    footer_sub_tagline: "تعليم حقيقي. نتائج حقيقية.",
    
    // English Content
    about_main_title_en: "About Us",
    about_main_desc_en: "We are a specialized academy for Gold & Forex trading education.",
    mission_title_en: "Our Mission",
    mission_desc_en: "Providing the latest trading tools and strategies.",
    vision_title_en: "Our Vision",
    vision_desc_en: "To be the #1 source for trading education in the Arab world.",
    contact_main_title_en: "Contact Us",
    contact_main_desc_en: "Our support team is ready to answer your questions 24/7.",
    footer_tagline_en: "The #1 Platform for Gold Trading Mastery",
    footer_sub_tagline_en: "Real Education. Real Results."
  }
};

const COURSES = [
  {
    title: "دورة احتراف تداول الذهب (Forex Gold Mastery)",
    description: "كورس شامل يأخذك من الصفر وحتى احتراف تداول الذهب XAUUSD. تعلم استراتيجيات المضاربة السريعة (Scalping) وإدارة المخاطر الصارمة.",
    thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
    is_paid: true,
    rating: 4.9,
    level: "خبير",
    duration: "25 ساعة",
    lesson_count: 15
  },
  {
    title: "أساسيات الفوركس للمبتدئين",
    description: "المدخل الصحيح لعالم التداول. شرح مبسط للمفاهيم الأساسية: الشموع اليابانية، الدعوم والمقاومات، وكيفية قراءة الشارت.",
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

async function seed() {
  console.log('\n🌱 STARTING MASTER SEED (BUILDING CONTENT)...');
  console.log('=============================================');

  // 0. Authenticate as Admin to bypass RLS
  console.log('🔑 Authenticating as Admin...');
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sniperfx.com',
    password: 'Hamza0100@'
  });

  if (authError) {
    console.error('❌ Admin Login Failed:', authError.message);
    console.error('   Please run "node scripts/ensure_admin_ready.js" first.');
    process.exit(1);
  }
  console.log('✅ Admin Authenticated');

  // 1. Seed Site Settings
  console.log('1. Configuring Site Settings (CMS)...');
  const { data: existingSettings } = await supabase.from('site_settings').select('id').limit(1).maybeSingle();
  
  if (existingSettings) {
      await supabase.from('site_settings').update(SITE_SETTINGS).eq('id', existingSettings.id);
      console.log('   ✅ Settings Updated');
  } else {
      await supabase.from('site_settings').insert(SITE_SETTINGS);
      console.log('   ✅ Settings Created');
  }

  // 2. Seed Courses
  console.log('2. Building Courses...');
  for (const course of COURSES) {
      const { data: existing } = await supabase.from('courses').select('id').eq('title', course.title).maybeSingle();
      
      let courseId;
      if (existing) {
          await supabase.from('courses').update(course).eq('id', existing.id);
          courseId = existing.id;
          console.log(`   🔹 Updated Course: ${course.title}`);
      } else {
          // Robust Insert with Error Handling
          const { data: newCourse, error: createError } = await supabase.from('courses').insert(course).select().single();
          
          if (createError || !newCourse) {
              console.error(`   ❌ Failed to create course: ${course.title}`, createError?.message);
              continue;
          }
          
          courseId = newCourse.id;
          console.log(`   ✅ Created Course: ${course.title}`);
      }

      // 3. Seed Lessons
      if (courseId) {
          console.log(`      Adding Lessons to: ${course.title}...`);
          for (const lesson of LESSONS) {
              const { data: existingLesson } = await supabase
                  .from('lessons')
                  .select('id')
                  .eq('course_id', courseId)
                  .eq('title', lesson.title)
                  .maybeSingle();

              if (!existingLesson) {
                  await supabase.from('lessons').insert({
                      ...lesson,
                      course_id: courseId,
                      is_published: true,
                      thumbnail_url: course.thumbnail
                  });
              }
          }
          console.log('      ✅ Lessons Added');
      }
  }

  console.log('=============================================');
  console.log('🎉 BUILD COMPLETE: The site is now fully populated.');
  console.log('   Go to /admin to manage this content.');
}

seed();
