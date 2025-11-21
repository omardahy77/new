/*
  # Seed Real Video Content
  
  ## Query Description:
  This migration inserts a new "Forex Basics" course with real, high-quality YouTube lessons.
  It ensures the platform has playable content immediately for testing and demonstration.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low" (Adds data only)
  - Requires-Backup: false
  - Reversible: true (Can delete the course)
*/

-- 1. Insert the Course
INSERT INTO public.courses (id, title, description, thumbnail, is_paid, rating, level, duration, lesson_count, created_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for reference
  'أساسيات الفوركس للمبتدئين',
  'المدخل الصحيح لعالم التداول. شرح مبسط للمفاهيم الأساسية: الشموع اليابانية، الدعوم والمقاومات، وكيفية قراءة الشارت.',
  'https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg',
  false,
  4.8,
  'مبتدئ',
  '10 ساعات',
  5,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail = EXCLUDED.thumbnail;

-- 2. Insert Lessons for this Course
INSERT INTO public.lessons (course_id, title, description, video_url, duration, "order", thumbnail)
VALUES 
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ما هو الفوركس؟ وكيف تبدأ؟',
    'مقدمة شاملة عن سوق العملات الأجنبية (Forex)، من هم المشاركون في السوق، وكيف يتم تحقيق الربح.',
    'https://www.youtube.com/watch?v=I2pS5lq9a2Q',
    '15:30',
    1,
    'https://i.ytimg.com/vi/I2pS5lq9a2Q/mqdefault.jpg'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'شرح الشموع اليابانية بالتفصيل',
    'تعلم قراءة الشموع اليابانية وأهم النماذج الانعكاسية والاستمرارية التي تتكرر على الشارت.',
    'https://www.youtube.com/watch?v=C3M8QW8v6mU',
    '22:15',
    2,
    'https://i.ytimg.com/vi/C3M8QW8v6mU/mqdefault.jpg'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'الدعوم والمقاومات (Support & Resistance)',
    'كيف تحدد مناطق الدخول والخروج القوية باستخدام خطوط الدعم والمقاومة الكلاسيكية.',
    'https://www.youtube.com/watch?v=4M5o7p3_gW0',
    '18:45',
    3,
    'https://i.ytimg.com/vi/4M5o7p3_gW0/mqdefault.jpg'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'إدارة المخاطر ورأس المال',
    'الدرس الأهم في التداول. كيف تحمي حسابك من المرجنة وتستمر في السوق لفترة طويلة.',
    'https://www.youtube.com/watch?v=6w2q0Qo7gT4',
    '20:00',
    4,
    'https://i.ytimg.com/vi/6w2q0Qo7gT4/mqdefault.jpg'
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'استراتيجية التقاطعات (Moving Averages)',
    'شرح استراتيجية بسيطة وفعالة للمبتدئين باستخدام المتوسطات المتحركة.',
    'https://www.youtube.com/watch?v=EyHw0cs-iA0',
    '12:30',
    5,
    'https://i.ytimg.com/vi/EyHw0cs-iA0/mqdefault.jpg'
  );
