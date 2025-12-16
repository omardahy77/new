/*
  # FINAL SECURITY & STABILITY FIX
  
  1. SECURITY: Fix 'Function Search Path Mutable' warning.
  2. PERMISSIONS: Fix 'Infinite Recursion' in RLS policies.
  3. DATA INTEGRITY: Enforce 'ON DELETE CASCADE' for Courses -> Lessons/Enrollments.
*/

-- 1. Secure Admin Check Function (Fixes Security Warning & Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix RLS Policies (Use the safe function)

-- Profiles
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Courses
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;

CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can do everything on courses" ON public.courses FOR ALL USING (public.is_admin());

-- Lessons
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Published lessons are viewable by everyone" ON public.lessons;

CREATE POLICY "Published lessons are viewable by everyone" ON public.lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can do everything on lessons" ON public.lessons FOR ALL USING (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Admins can do everything on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;

CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can do everything on site_settings" ON public.site_settings FOR ALL USING (public.is_admin());


-- 3. Enforce Cascade Delete (Fixes "Cannot delete course" error)

-- Lessons: If Course is deleted, delete Lessons
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_course_id_fkey;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Enrollments: If Course is deleted, delete Enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Lesson Progress: If Lesson is deleted, delete Progress
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Lesson Subtitles: If Lesson is deleted, delete Subtitles
ALTER TABLE public.lesson_subtitles DROP CONSTRAINT IF EXISTS lesson_subtitles_lesson_id_fkey;
ALTER TABLE public.lesson_subtitles ADD CONSTRAINT lesson_subtitles_lesson_id_fkey 
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
