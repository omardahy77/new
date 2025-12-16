-- Fix for 42P17: Infinite recursion in RLS policies

-- 1. Create a SECURITY DEFINER function to check admin role
-- This bypasses RLS on the 'profiles' table, breaking the infinite loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Ensures security compliance
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Apply the safe check to the 'profiles' table
-- We drop potential recursive policies (names may vary, covering common ones)
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can update" ON profiles;
DROP POLICY IF EXISTS "Admins can delete" ON profiles;
DROP POLICY IF EXISTS "Enable all for admins" ON profiles;
DROP POLICY IF EXISTS "Admins can perform all actions on profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;

-- Create the new safe policy for Admins
CREATE POLICY "Enable all for admins"
ON profiles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 3. Ensure 'courses' table uses the safe function for deletion
-- This fixes the specific error encountered during 'deleteCourse'
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can do everything on courses" ON courses;

CREATE POLICY "Admins can do everything on courses"
ON courses
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 4. Ensure 'lessons' table is also safe (Prevent future recursion)
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON lessons;

CREATE POLICY "Admins can do everything on lessons"
ON lessons
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
