-- Fix infinite recursion by using a SECURITY DEFINER function
-- This function runs with higher privileges to check admin status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
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

-- Re-apply policies using the new function for PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or recursive policies
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Read access for profiles" ON profiles;
DROP POLICY IF EXISTS "Update access for profiles" ON profiles;
DROP POLICY IF EXISTS "Insert access for profiles" ON profiles;

-- Create clean, non-recursive policies
CREATE POLICY "Admins can update profiles"
ON profiles
FOR UPDATE
USING ( is_admin() );

CREATE POLICY "Admins can view profiles"
ON profiles
FOR SELECT
USING ( is_admin() OR auth.uid() = id );

CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING ( auth.uid() = id );

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING ( true );

-- Fix SITE_SETTINGS policies as well
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Everyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Enable insert for admins" ON site_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON site_settings;

CREATE POLICY "Everyone can read site settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site settings"
ON site_settings FOR INSERT
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
USING ( is_admin() );
