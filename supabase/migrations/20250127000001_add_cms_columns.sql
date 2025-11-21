/*
  # Add Missing CMS Columns
  Adds columns required for the enhanced Admin Dashboard and CMS features.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - courses: level, duration, lesson_count
  - site_settings: hero_title_line1, hero_title_line2, about_title, about_desc, home_features
*/

-- 1. تحديث جدول الكورسات (Courses)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level text DEFAULT 'متوسط';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration text DEFAULT '0 ساعة';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS lesson_count integer DEFAULT 0;

-- 2. تحديث جدول إعدادات الموقع (Site Settings)
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_title_line1 text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_title_line2 text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS about_title text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS about_desc text;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS home_features jsonb DEFAULT '[]'::jsonb;

-- 3. تحديث جدول الدروس (Lessons) - للتأكد
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration text DEFAULT '10:00';

-- 4. ضمان صلاحيات المشرف (تأكيد إضافي)
DO $$
BEGIN
    -- سياسات الكورسات
    DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
    CREATE POLICY "Admins can do everything on courses" ON public.courses
        FOR ALL TO authenticated
        USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

    -- سياسات الإعدادات
    DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
    CREATE POLICY "Admins can update site settings" ON public.site_settings
        FOR UPDATE TO authenticated
        USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
        
    -- سياسات القراءة للجميع (تأكيد)
    DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;
    CREATE POLICY "Everyone can view courses" ON public.courses FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Everyone view settings" ON public.site_settings;
    CREATE POLICY "Everyone view settings" ON public.site_settings FOR SELECT USING (true);
END
$$;
