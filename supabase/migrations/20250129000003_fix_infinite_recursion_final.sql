/*
  # Fix Infinite Recursion in RLS Policies & Add Secure Admin Functions

  ## Query Description:
  1. Fixes the "infinite recursion" error (42P17) by introducing a SECURITY DEFINER function `is_admin()`.
  2. Creates `delete_user_by_admin` to allow admins to ban/remove users.
  3. Resets RLS policies for `site_settings` and `profiles` to use the safe `is_admin()` check.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER: Bypasses RLS to prevent the infinite loop
-- SET search_path: Fixes the security advisory warning
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Directly check the profiles table. 
  -- Since this is SECURITY DEFINER, it bypasses the RLS on profiles, breaking the loop.
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Create Secure User Deletion Function
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verify Admin Permissions
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;

  -- 2. Delete User Data (Cascading cleanup)
  -- Deleting from profiles effectively "bans" them from the app logic
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM public.enrollments WHERE user_id = target_user_id;
  DELETE FROM public.lesson_progress WHERE user_id = target_user_id;
  
  -- Note: We cannot delete from auth.users easily via SQL without superuser, 
  -- but removing the profile prevents login in this app's logic.
END;
$$;

-- 3. Fix 'site_settings' policies
-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow Admin Full Control Settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON site_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON site_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON site_settings;

-- Policy A: Everyone can read settings (Landing page needs this)
CREATE POLICY "Everyone can view settings" 
ON site_settings FOR SELECT 
USING (true);

-- Policy B: Only Admins can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage settings" 
ON site_settings FOR ALL 
USING ( public.is_admin() );

-- 4. Fix 'profiles' policies (The source of the recursion)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Policy A: Admins can do ANYTHING on profiles
CREATE POLICY "Admins can do everything on profiles" 
ON profiles FOR ALL 
USING ( public.is_admin() );

-- Policy B: Users can View their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING ( auth.uid() = id );

-- Policy C: Users can Update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Policy D: Users can Insert their own profile (Registration)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- 5. Fix 'courses' and 'lessons' policies just in case
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING ( public.is_admin() );
