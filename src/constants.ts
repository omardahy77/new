import { Course, Lesson } from './types';

// 1. DEFAULT COURSES (Instant Load)
export const DEFAULT_COURSES: Course[] = [
  {
    id: "default-1",
    title: "أساسيات التداول للمبتدئين",
    description: "دورة شاملة تشرح مفاهيم الفوركس، الشموع اليابانية، وكيفية قراءة الرسم البياني من الصفر.",
    thumbnail: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg",
    is_paid: false,
    rating: 4.8,
    level: "مبتدئ",
    duration: "5 ساعات",
    lesson_count: 3,
    created_at: new Date().toISOString()
  },
  {
    id: "default-2",
    title: "احتراف تداول الذهب (VIP)",
    description: "استراتيجيات متقدمة لتداول الذهب XAUUSD مع إدارة مخاطر صارمة.",
    thumbnail: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg",
    is_paid: true,
    rating: 4.9,
    level: "خبير",
    duration: "12 ساعة",
    lesson_count: 2,
    created_at: new Date().toISOString()
  }
];

// 2. DEFAULT LESSONS MAP (Mapped by Course ID for Instant Access)
export const DEFAULT_LESSONS_MAP: Record<string, Lesson[]> = {
  "default-1": [
    {
      id: "def-l-1",
      course_id: "default-1",
      title: "ما هو الفوركس؟ وكيف تبدأ؟",
      description: "مقدمة شاملة عن سوق العملات الأجنبية (Forex) وكيفية تحقيق الأرباح منه.",
      video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q", 
      duration: "10:00",
      order: 1,
      is_published: true,
      thumbnail_url: "https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg"
    },
    {
      id: "def-l-2",
      course_id: "default-1",
      title: "شرح الشموع اليابانية بالتفصيل",
      description: "تعلم قراءة الشموع اليابانية وأهم النماذج الانعكاسية والاستمرارية.",
      video_url: "https://www.youtube.com/watch?v=C3M8QW8v6mU",
      duration: "15:30",
      order: 2,
      is_published: true,
      thumbnail_url: "https://i.ytimg.com/vi/C3M8QW8v6mU/maxresdefault.jpg"
    },
    {
      id: "def-l-3",
      course_id: "default-1",
      title: "الدعوم والمقاومات (Support & Resistance)",
      description: "كيف تحدد مناطق الدخول والخروج القوية على الشارت.",
      video_url: "https://www.youtube.com/watch?v=4M5o7p3_gW0",
      duration: "20:00",
      order: 3,
      is_published: true,
      thumbnail_url: "https://i.ytimg.com/vi/4M5o7p3_gW0/maxresdefault.jpg"
    }
  ],
  "default-2": [
    {
      id: "def-l-4",
      course_id: "default-2",
      title: "سر القناص في الذهب",
      description: "استراتيجية خاصة للمشتركين لاقتناص الفرص في الذهب.",
      video_url: "https://www.youtube.com/watch?v=p7HKvqRI_Bo",
      duration: "25:00",
      order: 1,
      is_published: true,
      thumbnail_url: "https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg"
    },
    {
      id: "def-l-5",
      course_id: "default-2",
      title: "إدارة المحافظ الكبرى",
      description: "كيف تدير حسابات كبيرة بذكاء وتتجنب الخسائر الفادحة.",
      video_url: "https://www.youtube.com/watch?v=6w2q0Qo7gT4",
      duration: "30:00",
      order: 2,
      is_published: true,
      thumbnail_url: "https://i.ytimg.com/vi/6w2q0Qo7gT4/maxresdefault.jpg"
    }
  ]
};

// Keep this for legacy support if needed
export const REAL_LESSONS = DEFAULT_LESSONS_MAP["default-1"];
