-- # Fix Infinite Recursion on Profiles Table
-- Description: Replaces recursive RLS policies with secure, non-recursive ones using SECURITY DEFINER functions.

-- 1. Create a secure function to check admin status without triggering RLS recursion
-- SECURITY DEFINER means this function runs with the privileges of the creator (superuser), bypassing RLS
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Super Admin Access" ON profiles;
DROP POLICY IF EXISTS "Super Admin Bootstrap" ON profiles;

-- 3. Ensure RLS is Enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Define New Non-Recursive Policies

-- A. Super Admin / Bootstrap Policy (Based on Email - Hardcoded for absolute safety & recursion breaking)
-- This ensures admin@sniperfx.com can ALWAYS access/edit/delete everything in profiles, no matter what.
CREATE POLICY "Super Admin Full Access" ON profiles
FOR ALL
USING (auth.jwt() ->> 'email' = 'admin@sniperfx.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@sniperfx.com');

-- B. View Policy
-- Users can see their own profile OR Admins can see everyone's
CREATE POLICY "View Profiles" ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  check_is_admin()
);

-- C. Insert Policy
-- Users can create their own profile (Registration) OR Admins can create for others
CREATE POLICY "Insert Profiles" ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  OR
  check_is_admin()
);

-- D. Update Policy
-- Users can update their own profile OR Admins can update anyone
CREATE POLICY "Update Profiles" ON profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR
  check_is_admin()
)
WITH CHECK (
  auth.uid() = id
  OR
  check_is_admin()
);

-- E. Delete Policy
-- Only Admins can delete profiles (Regular users cannot delete themselves directly via API for safety)
CREATE POLICY "Delete Profiles" ON profiles
FOR DELETE
USING (
  check_is_admin()
);
