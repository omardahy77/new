import { Course, Lesson } from './types';

export const DEFAULT_COURSES: Partial<Course>[] = [
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

export const REAL_LESSONS: Partial<Lesson>[] = [
  // دروس كورس الأساسيات
  {
    title: "ما هو الفوركس؟ وكيف تبدأ؟",
    description: "مقدمة شاملة عن سوق العملات الأجنبية (Forex)، من هم المشاركون في السوق، وكيف يتم تحقيق الربح.",
    video_url: "https://www.youtube.com/watch?v=I2pS5lq9a2Q",
    duration: "15:30",
    order: 1
  },
  {
    title: "شرح الشموع اليابانية بالتفصيل",
    description: "تعلم قراءة الشموع اليابانية وأهم النماذج الانعكاسية والاستمرارية التي تتكرر على الشارت.",
    video_url: "https://www.youtube.com/watch?v=C3M8QW8v6mU",
    duration: "22:15",
    order: 2
  },
  {
    title: "الدعوم والمقاومات (Support & Resistance)",
    description: "كيف تحدد مناطق الدخول والخروج القوية باستخدام خطوط الدعم والمقاومة الكلاسيكية.",
    video_url: "https://www.youtube.com/watch?v=4M5o7p3_gW0",
    duration: "18:45",
    order: 3
  },
  {
    title: "إدارة المخاطر ورأس المال",
    description: "الدرس الأهم في التداول. كيف تحمي حسابك من المرجنة وتستمر في السوق لفترة طويلة.",
    video_url: "https://www.youtube.com/watch?v=6w2q0Qo7gT4",
    duration: "20:00",
    order: 4
  },
  {
    title: "استراتيجية التقاطعات (Moving Averages)",
    description: "شرح استراتيجية بسيطة وفعالة للمبتدئين باستخدام المتوسطات المتحركة.",
    video_url: "https://www.youtube.com/watch?v=EyHw0cs-iA0",
    duration: "12:30",
    order: 5
  }
];
