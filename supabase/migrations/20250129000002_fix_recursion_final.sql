/*
# Fix Infinite Recursion in RLS Policies

## Query Description:
This migration fixes the "infinite recursion" error (Code 42P17) by implementing a safe, non-recursive way to check admin permissions.
1. Creates a `SECURITY DEFINER` function `is_admin()` that bypasses RLS to safely check roles.
2. Drops ALL existing policies on the `profiles` table to remove any recursive logic.
3. Re-creates clean, secure policies using the new `is_admin()` function.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "High" (Fixes critical login crash)
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Remains ENABLED on profiles.
- Policy Changes: Replaces broken policies with secure ones.
*/

-- 1. Create a helper function to check admin status without triggering RLS recursion
-- We use SECURITY DEFINER to run this as the table owner (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the admin role in the profiles table
  -- Since this is SECURITY DEFINER, it bypasses the RLS on 'profiles'
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- 2. Drop ALL existing policies on profiles to ensure a clean slate
-- We list common names to ensure we catch whatever is causing the loop
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Delete profiles" ON profiles;

-- 3. Create clean, non-recursive policies

-- VIEW: Users can view their own profile. Admins can view all.
CREATE POLICY "View profiles" ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  is_admin() 
);

-- INSERT: Users can insert their own profile (for registration)
CREATE POLICY "Insert own profile" ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- UPDATE: Users can update their own profile. Admins can update all.
CREATE POLICY "Update profiles" ON profiles
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  is_admin()
);

-- DELETE: Only admins can delete profiles
CREATE POLICY "Delete profiles" ON profiles
FOR DELETE
USING (
  is_admin()
);

-- 4. Fix the ensure_user_profile_exists function to be safe
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  user_id := auth.uid();
  user_email := auth.jwt() ->> 'email';

  IF user_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert if not exists, do nothing if exists
  INSERT INTO public.profiles (id, email, role, status, full_name, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    'student',
    'pending', -- Default to pending for safety
    COALESCE(user_email, 'New User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;
