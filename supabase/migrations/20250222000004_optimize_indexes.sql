-- Optimize Database Performance with Targeted Indexes
-- This ensures queries for enrollments and lessons are instantaneous

-- 1. Enrollments Indexes (Speed up "My Courses" check)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

-- 2. Lesson Progress Indexes (Speed up "Continue Watching")
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);

-- 3. Lessons Index (Speed up Course Detail Page)
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);

-- 4. Profiles Index (Speed up Admin Dashboard Search)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
