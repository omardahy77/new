/*
  # Fix RLS Recursion and Policy Conflicts
  
  ## Query Description:
  This migration fixes the "Infinite Recursion" bug and "Policy Already Exists" errors.
  1. It creates a secure `is_admin()` function that bypasses RLS to prevent loops.
  2. It drops existing conflicting policies before re-creating them.
  3. It ensures the admin profile exists and has the correct role.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Helper function to check admin status without recursion
-- We use SECURITY DEFINER to bypass RLS on the profiles table itself during the check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the 'admin' role in the profiles table
  -- We can safely query profiles here because of SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Clean up existing policies to avoid "already exists" errors
-- We drop ALL relevant policies to ensure a clean slate
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;

-- 3. Re-create Policies for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read profiles (needed for login checks and public info)
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins to do everything (using the safe is_admin function)
CREATE POLICY "Admins can do everything on profiles" 
ON profiles FOR ALL 
USING (is_admin());

-- 4. Fix Courses Policies
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by everyone" 
ON courses FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage courses" 
ON courses FOR ALL 
USING (is_admin());

-- 5. Fix Lessons Policies
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons are viewable by everyone" 
ON lessons FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage lessons" 
ON lessons FOR ALL 
USING (is_admin());

-- 6. Fix Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" 
ON enrollments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments" 
ON enrollments FOR ALL 
USING (is_admin());

-- 7. Ensure Admin User Exists (Idempotent)
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if admin exists in auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';
  
  IF admin_uid IS NOT NULL THEN
    -- Ensure profile exists and is admin
    INSERT INTO public.profiles (id, email, role, status, full_name)
    VALUES (admin_uid, 'admin@sniperfx.com', 'admin', 'active', 'System Admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';
  END IF;
END $$;
