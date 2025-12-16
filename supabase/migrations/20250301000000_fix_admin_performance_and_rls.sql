-- MIGRATION: Fix Admin Performance, RLS Recursion, and Saving Issues
-- DATE: 2025-03-01
-- AUTHOR: Dualite

-- 1. Disable RLS temporarily to clear bad policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to remove recursion/conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;

DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;

-- 3. Create a SAFE, Non-Recursive Admin Check Function
-- This function checks the JWT metadata first (fastest), then falls back to a direct, non-RLS query
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_meta BOOLEAN;
  is_admin_db BOOLEAN;
BEGIN
  -- Check 1: JWT Metadata (Fastest, no DB lookup)
  is_admin_meta := (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
  IF is_admin_meta THEN
    RETURN TRUE;
  END IF;

  -- Check 2: Direct Table Lookup (Bypassing RLS for the check itself)
  -- We use a direct query to avoid recursion
  SELECT (role = 'admin') INTO is_admin_db
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_db, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER is crucial here

-- 4. Re-Apply Simplified, High-Performance Policies

-- === PROFILES ===
-- Allow read access to everyone (essential for "Loading..." fix)
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow Admins to do ANYTHING (Insert/Update/Delete)
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.is_admin_safe());

-- === COURSES ===
-- Read: Everyone
CREATE POLICY "courses_read_all" ON public.courses FOR SELECT USING (true);

-- Write: Admins Only
CREATE POLICY "courses_write_admin" ON public.courses FOR ALL USING (public.is_admin_safe());

-- === LESSONS ===
-- Read: Everyone
CREATE POLICY "lessons_read_all" ON public.lessons FOR SELECT USING (true);

-- Write: Admins Only
CREATE POLICY "lessons_write_admin" ON public.lessons FOR ALL USING (public.is_admin_safe());

-- === ENROLLMENTS ===
-- Read: Own or Admin
CREATE POLICY "enrollments_read" ON public.enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin_safe());

-- Write: Admin Only (or specific logic if needed)
CREATE POLICY "enrollments_write_admin" ON public.enrollments FOR ALL USING (public.is_admin_safe());

-- === SITE SETTINGS ===
-- Read: Everyone
CREATE POLICY "settings_read_all" ON public.site_settings FOR SELECT USING (true);

-- Write: Admins Only
CREATE POLICY "settings_write_admin" ON public.site_settings FOR ALL USING (public.is_admin_safe());

-- 5. Re-Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 6. Add Performance Indexes (Fixes "Slow Loading")
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons("order");
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);

-- 7. Grant Permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
