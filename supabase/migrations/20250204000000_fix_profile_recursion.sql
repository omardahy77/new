-- 1. Create a secure function to check admin status (bypasses RLS)
-- This function runs with the privileges of the creator (SECURITY DEFINER), 
-- allowing it to read the profiles table without triggering the RLS policy loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop potentially conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- 3. Re-create policies using the secure function

-- Allow Admins to VIEW all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING ( is_admin() );

-- Allow Admins to UPDATE profiles (Required for approving users)
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING ( is_admin() );

-- Allow Users to VIEW their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- Allow Users to UPDATE their own profile (Required for Profile page)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );
