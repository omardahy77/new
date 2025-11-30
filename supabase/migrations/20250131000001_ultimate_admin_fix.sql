-- =================================================================
-- ULTIMATE ADMIN FIX MIGRATION
-- Description: Resets all RLS policies to guarantee Admin access
--              Creates secure user deletion function
--              Ensures site_settings exists
-- =================================================================

-- 1. RESET RLS ON CRITICAL TABLES
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. SITE SETTINGS POLICIES (The CMS Fix)
DROP POLICY IF EXISTS "Allow Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow Admin Update Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow Admin Insert Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.site_settings;

-- Policy: Everyone can read
CREATE POLICY "Allow Public Read Settings" ON public.site_settings FOR SELECT USING (true);

-- Policy: Admins can do EVERYTHING (Update/Insert/Delete)
CREATE POLICY "Allow Admin Full Control Settings" ON public.site_settings FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. COURSES POLICIES
DROP POLICY IF EXISTS "Allow Public Read Courses" ON public.courses;
DROP POLICY IF EXISTS "Allow Admin Manage Courses" ON public.courses;

CREATE POLICY "Allow Public Read Courses" ON public.courses FOR SELECT USING (true);

CREATE POLICY "Allow Admin Manage Courses" ON public.courses FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. LESSONS POLICIES
DROP POLICY IF EXISTS "Allow Public Read Lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow Admin Manage Lessons" ON public.lessons;

CREATE POLICY "Allow Public Read Lessons" ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Allow Admin Manage Lessons" ON public.lessons FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. PROFILES POLICIES (For Approving Users)
DROP POLICY IF EXISTS "Allow Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow Admin Manage Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy: Users see their own, Admins see all
CREATE POLICY "Read Profiles" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy: Admins can update anyone (to approve them), Users update themselves
CREATE POLICY "Update Profiles" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. SECURE DELETE FUNCTION (The "Delete User" Fix)
-- This function runs with high privileges (SECURITY DEFINER) to delete from auth.users
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Security Check: Only Admins can run this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only admins can delete users.';
  END IF;

  -- Delete from auth.users (This automatically cascades to profiles, enrollments, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ENSURE SITE SETTINGS ROW EXISTS
-- Prevents "Update failed" because there was nothing to update
INSERT INTO public.site_settings (id, site_name, hero_title, hero_desc)
SELECT 
  gen_random_uuid(), 
  'Sniper FX Gold', 
  'تداول بذكاء بدقة القناص',
  'اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
