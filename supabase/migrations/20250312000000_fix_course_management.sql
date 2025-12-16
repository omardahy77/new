-- Description: Fixes Course Deletion (Cascade) and Permissions
-- This ensures that when a course is deleted, all related data (lessons, enrollments) are also deleted.

-- 1. Fix Foreign Keys for LESSONS (Cascade Delete)
ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS lessons_course_id_fkey;

ALTER TABLE public.lessons
ADD CONSTRAINT lessons_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;

-- 2. Fix Foreign Keys for ENROLLMENTS (Cascade Delete)
ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;

ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;

-- 3. Fix Foreign Keys for LESSON PROGRESS (Cascade Delete)
ALTER TABLE public.lesson_progress
DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;

ALTER TABLE public.lesson_progress
ADD CONSTRAINT lesson_progress_lesson_id_fkey
FOREIGN KEY (lesson_id)
REFERENCES public.lessons(id)
ON DELETE CASCADE;

-- 4. Fix Foreign Keys for SUBTITLES (Cascade Delete)
-- (Checking if table exists first to avoid errors)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lesson_subtitles') THEN
        ALTER TABLE public.lesson_subtitles
        DROP CONSTRAINT IF EXISTS lesson_subtitles_lesson_id_fkey;

        ALTER TABLE public.lesson_subtitles
        ADD CONSTRAINT lesson_subtitles_lesson_id_fkey
        FOREIGN KEY (lesson_id)
        REFERENCES public.lessons(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. ENSURE ADMIN PERMISSIONS (RLS)
-- Drop existing policies to ensure clean slate for Admins
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON public.lessons;

-- Re-create robust policies
CREATE POLICY "Admins can do everything on courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can do everything on lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. Fix "lesson_count" trigger (Optional but good for stability)
-- Ensure we don't have broken triggers updating counts
DROP TRIGGER IF EXISTS update_course_lesson_count ON public.lessons;

-- Create a robust function to update lesson counts
CREATE OR REPLACE FUNCTION update_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.courses
        SET lesson_count = (SELECT count(*) FROM public.lessons WHERE course_id = NEW.course_id)
        WHERE id = NEW.course_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.courses
        SET lesson_count = (SELECT count(*) FROM public.lessons WHERE course_id = OLD.course_id)
        WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_course_lesson_count
AFTER INSERT OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION update_lesson_count();
