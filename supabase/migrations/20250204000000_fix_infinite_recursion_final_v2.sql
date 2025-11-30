/*
  # Fix Infinite Recursion in RLS Policies
  
  ## Problem
  - Previous policies created a loop: site_settings policy -> checks profiles -> profiles policy -> checks profiles (loop).
  - This caused Error 42P17 when admins tried to update settings.

  ## Solution
  1. Create `is_admin()` function with SECURITY DEFINER to bypass RLS for the admin check.
  2. Update `site_settings` policies to use this function.
  3. Update `profiles` policies to use this function.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High" (Fixes broken admin functionality)
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS on the profiles table, breaking the loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 2. Fix 'site_settings' policies to use the new function
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to ensure a fresh start
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Everyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Enable insert for admins" ON site_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON site_settings;

-- Apply new non-recursive policies
CREATE POLICY "Everyone can read site settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site settings"
ON site_settings FOR INSERT
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
USING ( is_admin() );

-- 3. Fix 'profiles' policies to prevent recursion there as well
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Read access for profiles" ON profiles;
DROP POLICY IF EXISTS "Update access for profiles" ON profiles;
DROP POLICY IF EXISTS "Insert access for profiles" ON profiles;

-- Allow users to read their own profile, or admins to read all (using the secure function)
CREATE POLICY "Read access for profiles"
ON profiles FOR SELECT
USING ( auth.uid() = id OR is_admin() );

-- Allow users to update their own profile, or admins to update any
CREATE POLICY "Update access for profiles"
ON profiles FOR UPDATE
USING ( auth.uid() = id OR is_admin() );

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Insert access for profiles"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );
