-- PERFORMANCE OPTIMIZATION MIGRATION
-- This script adds indexes to speed up lookups for Login, Profiles, and Enrollments.

-- 1. Profile Lookups (Critical for Login)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Enrollment Checks (Critical for Course Access)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);

-- 3. Lesson Progress (Critical for Video Player)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);

-- 4. Course Ordering
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);

-- 5. Force specific RLS policies to be faster (if applicable)
-- (Supabase handles this mostly, but indexes help RLS significantly)

-- 6. Update Query Planner Statistics
ANALYZE public.profiles;
ANALYZE public.enrollments;
ANALYZE public.courses;
ANALYZE public.lesson_progress;
