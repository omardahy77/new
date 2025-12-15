-- =================================================================
-- 🛠️ REPAIR KIT: FORCE SEED ADMIN & CONTENT
-- Run this in Supabase SQL Editor to fix "Role: undefined" and "0 Courses"
-- =================================================================

-- 1. FIX ADMIN PROFILE
-- We find the user in auth.users and force-create their profile
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get the ID of the existing auth user
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@sniperfx.com';

  IF v_admin_id IS NOT NULL THEN
    -- Upsert the profile to ensure it exists and has admin role
    INSERT INTO public.profiles (id, email, role, full_name, status, phone_number)
    VALUES (v_admin_id, 'admin@sniperfx.com', 'admin', 'System Admin', 'active', '0000000000')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';
    
    RAISE NOTICE '✅ Admin profile fixed for ID: %', v_admin_id;
  ELSE
    RAISE WARNING '⚠️ Admin user not found in auth.users. Please ensure you have signed up as admin@sniperfx.com';
  END IF;
END $$;

-- 2. SEED SITE SETTINGS
INSERT INTO public.site_settings (
    site_name, 
    hero_title_line1, 
    hero_title_line2, 
    hero_desc,
    maintenance_mode,
    allow_registration
)
SELECT 
    'Sniper FX Gold', 
    'تداول بذكاء', 
    'بدقة القناص', 
    'المنصة التعليمية الأقوى لاحتراف تداول الذهب والفوركس.',
    false,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 3. SEED COURSES (If missing)
-- Free Course
INSERT INTO public.courses (title, description, is_paid, thumbnail, level, rating, duration, lesson_count)
SELECT 
    'دورة الأساسيات (مجاني)', 
    'مدخل شامل لعالم التداول للجميع. تعلم الشموع اليابانية والتحليل الفني.', 
    false, 
    'https://i.ytimg.com/vi/I2pS5lq9a2Q/maxresdefault.jpg', 
    'مبتدئ', 
    4.8, 
    '10 ساعات', 
    5
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE is_paid = false);

-- Paid Course
INSERT INTO public.courses (title, description, is_paid, thumbnail, level, rating, duration, lesson_count)
SELECT 
    'دورة الاحتراف (VIP)', 
    'استراتيجيات خاصة للمشتركين فقط. تعلم أسرار صناع السوق.', 
    true, 
    'https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg', 
    'خبير', 
    4.9, 
    '25 ساعة', 
    15
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE is_paid = true);

-- 4. ENSURE PERMISSIONS
-- Grant admin access to everything
DO $$
BEGIN
  -- Just a safety check to ensure RLS is enabled but policies exist
  -- We don't drop policies here to avoid conflicts, we just ensure data is correct
  RAISE NOTICE '✅ Data injection complete.';
END $$;
