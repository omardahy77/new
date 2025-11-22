/*
  # Fix Infinite Recursion in Policies
  
  ## Query Description:
  This migration fixes the "infinite recursion" error by introducing a SECURITY DEFINER function
  for admin checks. This breaks the RLS loop. It also resets policies on the profiles table
  to ensure they use this new safe check.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Security Implications:
  - RLS Status: Remains Enabled
  - Policy Changes: Yes (Rewritten to be non-recursive)
*/

-- 1. Create a secure function to check admin status without triggering RLS loops
-- SECURITY DEFINER ensures it runs with the privileges of the creator (superuser), bypassing RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Drop ALL existing policies on profiles to ensure a clean slate
-- We use DO block to avoid errors if policies don't exist
DO $$ 
BEGIN
    -- Drop common policy names
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
    DROP POLICY IF EXISTS "View profiles" ON profiles;
    DROP POLICY IF EXISTS "Update profiles" ON profiles;
    DROP POLICY IF EXISTS "Insert profiles" ON profiles;
    DROP POLICY IF EXISTS "Delete profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
END $$;

-- 3. Re-create clean, non-recursive policies

-- SELECT: Users see themselves, Admins see everyone
CREATE POLICY "View profiles" ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  is_admin()
);

-- INSERT: Users can create their own profile (during signup), Admins can create for others
CREATE POLICY "Insert profiles" ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id 
  OR 
  is_admin()
);

-- UPDATE: Users can update own, Admins can update all
CREATE POLICY "Update profiles" ON profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  is_admin()
);

-- DELETE: Only Admins can delete
CREATE POLICY "Delete profiles" ON profiles
FOR DELETE
USING (
  is_admin()
);

-- 4. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
