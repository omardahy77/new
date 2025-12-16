/*
  # Fix RLS Infinite Recursion
  
  ## Problem
  The previous policies on `profiles` table were causing infinite recursion (Error 42P17).
  This happens when a policy queries the same table it protects without a way to bypass RLS.
  
  ## Solution
  1. Create a `SECURITY DEFINER` function `is_admin()` that runs with owner privileges.
  2. Replace all recursive policies with new ones using `is_admin()`.
*/

-- 1. Create a secure function to check admin status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as owner to avoid recursion
SET search_path = public
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

-- 2. Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_select" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_update" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_delete" ON profiles;
DROP POLICY IF EXISTS "fix_profiles_insert" ON profiles;

-- 3. Re-create Safe Policies using the new function

-- READ: Admins see all, Users see their own
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: Users can create their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own, Admins can update all
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin());

-- DELETE: Only Admins can delete
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (is_admin());
