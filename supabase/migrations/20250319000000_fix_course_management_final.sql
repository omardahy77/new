-- Final Fix for Course Management (Add/Delete/Update)
-- This script guarantees that Admins can manage courses without restriction
-- and enforces data integrity (Cascade Delete).

-- 1. Ensure the is_admin function is used for ALL course operations
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Public can view courses" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;

-- 2. Create Explicit, Safe Policies for Courses
-- READ: Everyone can see courses (filtering happens in frontend/backend logic for paid content, but table access is open for listing)
CREATE POLICY "Public can view courses"
ON courses FOR SELECT
USING (true);

-- INSERT: Only Admins (Uses the secure is_admin function)
CREATE POLICY "Admins can insert courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- UPDATE: Only Admins
CREATE POLICY "Admins can update courses"
ON courses FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- DELETE: Only Admins
CREATE POLICY "Admins can delete courses"
ON courses FOR DELETE
TO authenticated
USING (is_admin());

-- 3. Do the same for Lessons to ensure no blockers there
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON lessons;
DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;

CREATE POLICY "Public can view lessons"
ON lessons FOR SELECT
USING (true);

CREATE POLICY "Admins can insert lessons"
ON lessons FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update lessons"
ON lessons FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete lessons"
ON lessons FOR DELETE
TO authenticated
USING (is_admin());

-- 4. Ensure Cascade Delete is enforced at Database Level
-- This ensures deleting a course deletes all its lessons automatically
ALTER TABLE lessons
DROP CONSTRAINT IF EXISTS lessons_course_id_fkey,
ADD CONSTRAINT lessons_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;

-- 5. Ensure Enrollments are deleted when course is deleted
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey,
ADD CONSTRAINT enrollments_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;

-- 6. Ensure Lesson Progress is deleted when Lesson is deleted
ALTER TABLE lesson_progress
DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey,
ADD CONSTRAINT lesson_progress_lesson_id_fkey
FOREIGN KEY (lesson_id)
REFERENCES lessons(id)
ON DELETE CASCADE;
