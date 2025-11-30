-- File: supabase/migrations/20250204000002_optimize_lessons_and_enrollments.sql

-- 1. Optimize LESSONS Table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Remove any old, potentially slow policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'lessons' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON lessons';
    END LOOP;
END $$;

-- Add fast, non-recursive policies using is_admin()
CREATE POLICY "Public can view published lessons" 
ON lessons FOR SELECT 
USING ( is_published = true );

CREATE POLICY "Admins can view all lessons" 
ON lessons FOR SELECT 
USING ( is_admin() );

CREATE POLICY "Admins can insert lessons" 
ON lessons FOR INSERT 
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update lessons" 
ON lessons FOR UPDATE 
USING ( is_admin() );

CREATE POLICY "Admins can delete lessons" 
ON lessons FOR DELETE 
USING ( is_admin() );


-- 2. Optimize ENROLLMENTS Table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON enrollments';
    END LOOP;
END $$;

-- Add fast policies
CREATE POLICY "Users can view own enrollments" 
ON enrollments FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Admins can view all enrollments" 
ON enrollments FOR SELECT 
USING ( is_admin() );

CREATE POLICY "Admins can insert enrollments" 
ON enrollments FOR INSERT 
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can delete enrollments" 
ON enrollments FOR DELETE 
USING ( is_admin() );

-- 3. Optimize LESSON_PROGRESS Table (Student Progress)
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'lesson_progress' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON lesson_progress';
    END LOOP;
END $$;

CREATE POLICY "Users can view own progress" 
ON lesson_progress FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can update own progress" 
ON lesson_progress FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can modify own progress" 
ON lesson_progress FOR UPDATE 
USING ( auth.uid() = user_id );

-- Admins can view student progress
CREATE POLICY "Admins can view all progress" 
ON lesson_progress FOR SELECT 
USING ( is_admin() );
