/*
  # FIX ALL PERMISSIONS & RLS (Master Fix)
  
  ## Query Description:
  This migration fixes the "Infinite Recursion" bug by creating a secure function to check admin status.
  It also resets policies for all major tables to ensure the app works smoothly.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create a Secure Function to check Admin Status (Prevents Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  -- Check if the user exists in profiles and get their role
  SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
  RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER means this runs with superuser privileges

-- 2. Fix Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old potentially broken policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create Clean Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete any profile" ON public.profiles
FOR DELETE USING (is_admin());

-- 3. Fix Courses Table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can insert courses" ON public.courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE USING (is_admin());

-- 4. Fix Lessons Table
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lessons viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;

CREATE POLICY "Lessons viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE USING (is_admin());

-- 5. Fix Enrollments Table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Users can view own enrollments" ON public.enrollments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON public.enrollments 
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert enrollments" ON public.enrollments 
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can delete enrollments" ON public.enrollments 
FOR DELETE USING (is_admin());

-- 6. Fix Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;

CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.site_settings FOR ALL USING (is_admin());

-- 7. Fix Lesson Progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.lesson_progress;

CREATE POLICY "Users can manage own progress" ON public.lesson_progress
FOR ALL USING (auth.uid() = user_id);
