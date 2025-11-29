/*
  # Fix Infinite Recursion in Profiles RLS
  
  ## Problem
  The existing RLS policies create an infinite loop when checking if a user is an admin, 
  because the check queries the 'profiles' table, which triggers the check again.
  
  ## Solution
  1. Create a SECURITY DEFINER function `check_is_admin()`.
     - This function runs with the privileges of the creator (superuser), bypassing RLS.
     - This breaks the recursion loop.
  2. Replace all RLS policies to use this safe function.
  
  ## Security
  - Safe: Yes
  - Impact: High (Fixes login/profile loading)
*/

-- 1. Create the secure function to check admin status
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- <--- This is the key fix
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Drop ALL existing policies on profiles to ensure a clean slate
-- We use DO block to avoid errors if policies don't exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
    DROP POLICY IF EXISTS "View profiles" ON profiles;
    DROP POLICY IF EXISTS "Insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Update profiles" ON profiles;
    DROP POLICY IF EXISTS "Delete profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
    DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 3. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Re-create policies using the secure function

-- SELECT: Users see their own, Admins see all
CREATE POLICY "View profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id 
  OR 
  check_is_admin()
);

-- INSERT: Users can insert their own profile
CREATE POLICY "Insert own profile"
ON profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- UPDATE: Users update own, Admins update all
CREATE POLICY "Update profiles"
ON profiles FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  check_is_admin()
);

-- DELETE: Only Admins
CREATE POLICY "Delete profiles"
ON profiles FOR DELETE
USING (
  check_is_admin()
);

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin TO anon;
