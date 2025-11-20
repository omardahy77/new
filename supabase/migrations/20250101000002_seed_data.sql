/*
  # Seed Initial Data
  Adds sample courses and default site settings to the database.

  ## Data Created:
  1. Course: "أساسيات تداول الذهب" (Free)
  2. Course: "استراتيجية القناص المحترفة" (Premium)
  3. Site Settings: Default configuration matching the design requirements.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Insert Site Settings (if not exists)
INSERT INTO public.site_settings (site_name, hero_title, hero_desc, stats, social_links)
VALUES (
  'Sniper FX Gold',
  'تداول بذكاء بدقة القناص',
  'اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي (LMS) متكامل ومحمي يأخذك من الصفر إلى الاحتراف.',
  '{"hours": "+50", "students": "+1500"}',
  '{"youtube": "https://youtube.com", "telegram": "https://t.me", "facebook": "https://facebook.com", "instagram": "https://instagram.com"}'
)
ON CONFLICT DO NOTHING;

-- 2. Insert Free Course
INSERT INTO public.courses (title, description, thumbnail, is_paid, rating)
VALUES (
  'أساسيات تداول الذهب للمبتدئين',
  'دليلك الشامل لفهم سوق الذهب (XAUUSD). تعلم كيفية قراءة الشارت، تحديد الاتجاه، وفهم العوامل الاقتصادية المؤثرة على الأسعار.',
  'https://images.unsplash.com/photo-1610375460969-d9f86c8f5f64?q=80&w=1000&auto=format&fit=crop',
  false,
  4.8
);

-- 3. Insert Premium Course
INSERT INTO public.courses (title, description, thumbnail, is_paid, rating)
VALUES (
  'استراتيجية القناص المحترفة (SMC)',
  'كورس متقدم يشرح مفاهيم السيولة (Liquidity)، مناطق العرض والطلب، وكيفية الدخول مع صناع السوق بدقة عالية ونسبة مخاطرة منخفضة.',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1000&auto=format&fit=crop',
  true,
  5.0
);

-- 4. Add some dummy lessons for the Free Course (Optional, assumes we can get the ID)
DO $$
DECLARE
  free_course_id uuid;
BEGIN
  SELECT id INTO free_course_id FROM public.courses WHERE title = 'أساسيات تداول الذهب للمبتدئين' LIMIT 1;
  
  IF free_course_id IS NOT NULL THEN
    INSERT INTO public.lessons (course_id, title, video_url, "order", duration)
    VALUES 
    (free_course_id, 'مقدمة في تداول الذهب', 'https://www.youtube.com/watch?v=ysz5S6PMrkE', 1, '10:00'),
    (free_course_id, 'كيف تقرأ الشموع اليابانية', 'https://www.youtube.com/watch?v=ysz5S6PMrkE', 2, '15:30');
  END IF;
END $$;
