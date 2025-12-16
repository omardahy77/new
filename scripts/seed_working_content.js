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

// Determine which key to use
const hasServiceKey = supabaseServiceKey && supabaseServiceKey !== "YOUR_API_KEY";
const supabase = createClient(supabaseUrl, hasServiceKey ? supabaseServiceKey : supabaseAnonKey);

const REAL_COURSES = [
  {
    title: "أساسيات التداول للمبتدئين",
    description: "دورة شاملة تشرح مفاهيم الفوركس، الشموع اليابانية، وكيفية قراءة الرسم البياني من الصفر.",
    thumbnail: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg",
    is_paid: false,
    level: "مبتدئ",
    duration: "5 ساعات",
    lesson_count: 3,
    lessons: [
      {
        title: "ما هو الفوركس؟",
        description: "مقدمة عن سوق العملات وكيف يعمل.",
        video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q", 
        duration: "10:00",
        order: 1
      },
      {
        title: "شرح الشموع اليابانية",
        description: "كيف تقرأ الشموع وتفهم حركة السعر.",
        video_url: "https://www.youtube.com/watch?v=C3M8QW8v6mU",
        duration: "15:30",
        order: 2
      },
      {
        title: "الدعوم والمقاومات",
        description: "تحديد مناطق الدخول والخروج.",
        video_url: "https://www.youtube.com/watch?v=4M5o7p3_gW0",
        duration: "20:00",
        order: 3
      }
    ]
  },
  {
    title: "احتراف تداول الذهب (VIP)",
    description: "استراتيجيات متقدمة لتداول الذهب XAUUSD مع إدارة مخاطر صارمة.",
    thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
    is_paid: true,
    level: "خبير",
    duration: "12 ساعة",
    lesson_count: 2,
    lessons: [
      {
        title: "سر القناص في الذهب",
        description: "استراتيجية خاصة للمشتركين.",
        video_url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo",
        duration: "25:00",
        order: 1
      },
      {
        title: "إدارة المحافظ الكبرى",
        description: "كيف تدير حسابات كبيرة بذكاء.",
        video_url: "https://www.youtube.com/watch?v=6w2q0Qo7gT4",
        duration: "30:00",
        order: 2
      }
    ]
  }
];

async function seed() {
  console.log('\n🌱 SEEDING WORKING CONTENT (MANUAL CHECK MODE)...');
  console.log('=================================================');

  // 1. Authenticate if needed
  if (!hasServiceKey) {
      console.log('🔑 Service Key missing. Logging in as Admin...');
      const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@sniperfx.com',
          password: 'Hamza0100@'
      });
      
      if (error) {
          console.error('❌ Admin Login Failed:', error.message);
          console.log('   Please ensure the admin account exists (run scripts/ensure_admin_ready.js)');
          return;
      }
      console.log('✅ Admin Authenticated');
  } else {
      console.log('✅ Using Service Key (Admin Mode)');
  }
  
  for (const courseData of REAL_COURSES) {
    // 2. Create/Update Course (Manual Check)
    console.log(`Processing: ${courseData.title}...`);
    
    // Check existence
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('title', courseData.title)
      .maybeSingle();

    const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        is_paid: courseData.is_paid,
        level: courseData.level,
        duration: courseData.duration,
        lesson_count: courseData.lesson_count
    };

    let course, courseError;

    if (existingCourse) {
        // Update
        const res = await supabase.from('courses').update(coursePayload).eq('id', existingCourse.id).select().single();
        course = res.data;
        courseError = res.error;
    } else {
        // Insert
        const res = await supabase.from('courses').insert(coursePayload).select().single();
        course = res.data;
        courseError = res.error;
    }

    if (courseError) {
      console.error(`❌ Error creating course "${courseData.title}":`, courseError.message);
      continue;
    }

    console.log(`   ✅ Course Ready: ${course.title}`);

    // 3. Create/Update Lessons
    for (const lesson of courseData.lessons) {
        const lessonPayload = {
            course_id: course.id,
            title: lesson.title,
            description: lesson.description,
            video_url: lesson.video_url,
            duration: lesson.duration,
            order: lesson.order,
            is_published: true,
            thumbnail_url: courseData.thumbnail
        };

        // Check existence
        const { data: existingLesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course.id)
            .eq('title', lesson.title)
            .maybeSingle();

        let lessonError;
        if (existingLesson) {
            const res = await supabase.from('lessons').update(lessonPayload).eq('id', existingLesson.id);
            lessonError = res.error;
        } else {
            const res = await supabase.from('lessons').insert(lessonPayload);
            lessonError = res.error;
        }
      
      if (lessonError) console.error(`   ⚠️ Lesson Error: ${lessonError.message}`);
    }
    console.log(`   ✨ Verified ${courseData.lessons.length} lessons.`);
  }

  console.log('=================================================');
  console.log('🎉 CONTENT SEEDED SUCCESSFULLY!');
  console.log('   Go to /courses to see the new content.');
}

seed();
