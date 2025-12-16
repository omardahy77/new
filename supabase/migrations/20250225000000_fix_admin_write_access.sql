-- FORCE FIX: Grant Full Control to Admin for Courses and Lessons
-- This ensures that RLS policies do not block the admin from saving.

-- 1. Reset Policies for Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;

CREATE POLICY "Admins can do everything on courses" 
ON public.courses 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Public can view courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- 2. Reset Policies for Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;

CREATE POLICY "Admins can do everything on lessons" 
ON public.lessons 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Public can view lessons" 
ON public.lessons 
FOR SELECT 
USING (true);

-- 3. Reset Policies for Site Settings (CMS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can view settings" ON public.site_settings;

CREATE POLICY "Admins can manage settings" 
ON public.site_settings 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Public can view settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- 4. Ensure Admin User has the correct role in auth.users metadata (Backup check)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'
) 
WHERE email = 'admin@sniperfx.com';
