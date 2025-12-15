/*
  # SEED CONTENT & FIX ADMIN
  - Populates Site Settings, Courses, Lessons
  - Confirms Admin Email
  - Sets Admin Role
*/

-- 1. SEED SITE SETTINGS
INSERT INTO public.site_settings (
  site_name, 
  hero_title_line1, 
  hero_title_line2, 
  hero_desc, 
  maintenance_mode, 
  allow_registration,
  social_links,
  stats
) VALUES (
  'Sniper FX Gold',
  'تداول بذكاء',
  'بدقة القناص',
  'اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.',
  false,
  true,
  '{"telegram": "https://t.me/sniperfx", "facebook": "https://facebook.com", "instagram": "https://instagram.com"}'::jsonb,
  '{"students": "+1500", "hours": "+50"}'::jsonb
) ON CONFLICT DO NOTHING;

-- 2. SEED COURSES
-- Free Course
INSERT INTO public.courses (id, title, description, thumbnail, is_paid, level, rating, duration, lesson_count)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'أساسيات الفوركس للمبتدئين',
  'المدخل الصحيح لعالم التداول. شرح مبسط للمفاهيم الأساسية: الشموع اليابانية، الدعوم والمقاومات.',
  'https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg',
  false,
  'مبتدئ',
  4.8,
  '10 ساعات',
  2
) ON CONFLICT (id) DO NOTHING;

-- Paid Course
INSERT INTO public.courses (id, title, description, thumbnail, is_paid, level, rating, duration, lesson_count)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'دورة احتراف تداول الذهب (VIP)',
  'كورس شامل يأخذك من الصفر وحتى احتراف تداول الذهب XAUUSD. تعلم استراتيجيات المضاربة السريعة.',
  'https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg',
  true,
  'خبير',
  4.9,
  '25 ساعة',
  2
) ON CONFLICT (id) DO NOTHING;

-- 3. SEED LESSONS
-- Lessons for Free Course
INSERT INTO public.lessons (course_id, title, description, video_url, "order", duration, is_published, thumbnail_url)
VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'ما هو الفوركس؟',
  'مقدمة شاملة عن سوق العملات الأجنبية.',
  'https://www.youtube.com/watch?v=I2pS5lq9a2Q',
  1,
  '15:30',
  true,
  'https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'شرح الشموع اليابانية',
  'تعلم قراءة الشموع اليابانية وأهم النماذج.',
  'https://www.youtube.com/watch?v=C3M8QW8v6mU',
  2,
  '22:15',
  true,
  'https://i.ytimg.com/vi/C3M8QW8v6mU/maxresdefault.jpg'
) ON CONFLICT DO NOTHING;

-- Lessons for Paid Course
INSERT INTO public.lessons (course_id, title, description, video_url, "order", duration, is_published, thumbnail_url)
VALUES 
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'استراتيجية القناص 1',
  'كيفية تحديد مناطق الدخول بدقة عالية.',
  'https://www.youtube.com/watch?v=p7HKvqRI_Bo',
  1,
  '45:00',
  true,
  'https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg'
),
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'إدارة رأس المال الصارمة',
  'حماية حسابك من المرجنة.',
  'https://www.youtube.com/watch?v=6w2q0Qo7gT4',
  2,
  '30:00',
  true,
  'https://i.ytimg.com/vi/6w2q0Qo7gT4/maxresdefault.jpg'
) ON CONFLICT DO NOTHING;

-- 4. FIX ADMIN USER (CRITICAL)
-- Force confirm email
UPDATE auth.users 
SET email_confirmed_at = now(), raw_user_meta_data = jsonb_build_object('role', 'admin', 'full_name', 'System Admin')
WHERE email = 'admin@sniperfx.com';

-- Ensure Admin Profile
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT id, email, 'System Admin', 'admin', 'active'
FROM auth.users 
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', status = 'active';

-- 5. FIX SECURITY WARNINGS (Search Path)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
