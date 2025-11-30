-- Fix Infinite Recursion in RLS Policies

-- 1. Drop existing function to ensure clean slate
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Create a Security Definer function to check admin status safely
-- This function runs with the privileges of the creator (superuser), bypassing RLS on the inner query
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Security best practice
AS $$
BEGIN
  -- Check if the user has the 'admin' role in the profiles table
  -- Because this is SECURITY DEFINER, it bypasses the RLS on 'profiles' table
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 3. Fix PROFILES Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure no recursive ones remain
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- Create clean, non-recursive policies using the new secure function

-- View: Allow users to see their own profile, and admins to see all
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id OR is_admin());

-- Insert: Allow users to create their own profile (for registration)
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update: Users update own, Admins update all
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE 
USING (is_admin());

-- Delete: Admins only
CREATE POLICY "Admins can delete any profile" 
ON profiles FOR DELETE 
USING (is_admin());


-- 4. Fix SITE_SETTINGS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON site_settings;

-- Create clean policies

-- View: Everyone (Public)
CREATE POLICY "Everyone can view settings" 
ON site_settings FOR SELECT 
USING (true);

-- Insert: Admins only
CREATE POLICY "Admins can insert settings" 
ON site_settings FOR INSERT 
WITH CHECK (is_admin());

-- Update: Admins only
CREATE POLICY "Admins can update settings" 
ON site_settings FOR UPDATE 
USING (is_admin());

-- Delete: Admins only
CREATE POLICY "Admins can delete settings" 
ON site_settings FOR DELETE 
USING (is_admin());
