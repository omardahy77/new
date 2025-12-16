-- =================================================================
-- 🛠️ ABSOLUTE FIX FOR INFINITE RECURSION (ERROR 42P17)
-- =================================================================

-- 1. Create a "Safe" Admin Check Function
-- SECURITY DEFINER ensures this runs with owner privileges, bypassing RLS loops
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the 'admin' role in the profiles table
  -- This simple query, running as SECURITY DEFINER, avoids the RLS recursion
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Drop ALL existing policies that might be causing recursion
-- We clean the slate to ensure no old, broken policies remain
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles View Policy" ON profiles;
DROP POLICY IF EXISTS "Profiles Update Policy" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_select" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_update" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_delete" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_insert" ON profiles;

-- 3. Re-apply simplified, non-recursive policies for PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- VIEW: Admins see all, Users see themselves
CREATE POLICY "absolute_profiles_select" ON profiles
FOR SELECT USING (
  auth.uid() = id OR is_admin_safe()
);

-- UPDATE: Admins update all, Users update themselves
CREATE POLICY "absolute_profiles_update" ON profiles
FOR UPDATE USING (
  auth.uid() = id OR is_admin_safe()
);

-- DELETE: Admins only
CREATE POLICY "absolute_profiles_delete" ON profiles
FOR DELETE USING (
  is_admin_safe()
);

-- INSERT: Users can register themselves (Auth Trigger usually handles this, but this is safe)
CREATE POLICY "absolute_profiles_insert" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Fix COURSES policies (Ensure they use the safe check)
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "fix_courses_insert" ON courses;
DROP POLICY IF EXISTS "fix_courses_update" ON courses;
DROP POLICY IF EXISTS "fix_courses_delete" ON courses;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- VIEW: Everyone can see courses (Visibility logic is handled in frontend/app)
CREATE POLICY "absolute_courses_select" ON courses
FOR SELECT USING (true);

-- WRITE: Admins only (Using Safe Check)
CREATE POLICY "absolute_courses_insert" ON courses FOR INSERT WITH CHECK (is_admin_safe());
CREATE POLICY "absolute_courses_update" ON courses FOR UPDATE USING (is_admin_safe());
CREATE POLICY "absolute_courses_delete" ON courses FOR DELETE USING (is_admin_safe());

-- 5. Fix LESSONS policies
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- VIEW: Everyone can see lessons
CREATE POLICY "absolute_lessons_select" ON lessons
FOR SELECT USING (true);

-- WRITE: Admins only
CREATE POLICY "absolute_lessons_insert" ON lessons FOR INSERT WITH CHECK (is_admin_safe());
CREATE POLICY "absolute_lessons_update" ON lessons FOR UPDATE USING (is_admin_safe());
CREATE POLICY "absolute_lessons_delete" ON lessons FOR DELETE USING (is_admin_safe());
