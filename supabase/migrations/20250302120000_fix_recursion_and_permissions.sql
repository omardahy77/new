/*
  # MASTER FIX: Admin Permissions & Performance
  
  ## Problem
  - Infinite recursion in RLS policies (Database hangs checking if user is admin)
  - Admin cannot save courses or view users due to policy blocks
  
  ## Solution
  1. Create `is_admin_safe()`: A secure function that bypasses RLS to check roles.
  2. Reset Policies: Drop all existing complex policies.
  3. Apply Simple Rules: 
     - Public can READ courses/lessons.
     - Admins can WRITE everything.
     - Users can READ their own profile.
*/

-- 1. Create the Safe Admin Check Function (Security Definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges
SET search_path = public
STABLE
AS $$
BEGIN
  -- Direct check on profiles table without triggering RLS
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated, anon, service_role;

-- 2. FIX PROFILES TABLE (The main cause of recursion)
DO $$
DECLARE pol record;
BEGIN
    -- Drop all existing policies on profiles to ensure a clean slate
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- New Clean Policies for Profiles
CREATE POLICY "profiles_read_policy" ON profiles
FOR SELECT USING ( 
    auth.uid() = id OR is_admin_safe() 
);

CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK ( 
    auth.uid() = id OR is_admin_safe() 
);

CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING ( 
    auth.uid() = id OR is_admin_safe() 
);

CREATE POLICY "profiles_delete_policy" ON profiles
FOR DELETE USING ( 
    is_admin_safe() 
);


-- 3. FIX COURSES TABLE (Fixes "Saving..." hang)
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON courses', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- New Clean Policies for Courses
CREATE POLICY "courses_read_public" ON courses 
FOR SELECT USING (true); -- Everyone can see courses

CREATE POLICY "courses_write_admin" ON courses 
FOR ALL USING ( is_admin_safe() ); -- Only admin can insert/update/delete


-- 4. FIX LESSONS TABLE (Fixes "Lessons not loading")
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lessons' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lessons', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- New Clean Policies for Lessons
CREATE POLICY "lessons_read_public" ON lessons 
FOR SELECT USING (true); -- Everyone can see lessons (content visibility handled by frontend logic)

CREATE POLICY "lessons_write_admin" ON lessons 
FOR ALL USING ( is_admin_safe() ); -- Only admin can insert/update/delete

-- 5. Performance Indexes (Speed up dashboard)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
