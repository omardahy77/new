/*
# Fix Infinite Recursion on Courses & Profiles

## Query Description:
This migration resolves the "infinite recursion" error (42P17) preventing admins from saving courses.
It works by:
1. Aggressively dropping ALL existing policies on 'courses' and 'profiles' tables to remove any conflicting loops.
2. Creating a 'SECURITY DEFINER' function 'is_admin()' that checks permissions without triggering RLS.
3. Re-applying clean, non-recursive policies for both tables.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High" (Resets permissions for courses/profiles)
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (Complete Reset)
- Auth Requirements: Admin role required for modifications
*/

-- 1. Aggressively drop ALL existing policies on affected tables
-- This ensures we remove any policies with different names that might still be active
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies for courses
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON courses';
    END LOOP;
    
    -- Drop all policies for profiles
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- 2. Create/Update the secure admin check function
-- SECURITY DEFINER is critical here: it bypasses RLS to break the recursion loop
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

-- 3. Recreate Optimized Policies for COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can view courses
CREATE POLICY "Public view courses" 
ON courses FOR SELECT 
USING ( true );

-- Only admins can modify courses (using the secure function)
CREATE POLICY "Admins can insert courses" 
ON courses FOR INSERT 
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update courses" 
ON courses FOR UPDATE 
USING ( is_admin() );

CREATE POLICY "Admins can delete courses" 
ON courses FOR DELETE 
USING ( is_admin() );

-- 4. Recreate Optimized Policies for PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admins have full access to all profiles
CREATE POLICY "Admins can manage all profiles" 
ON profiles FOR ALL 
USING ( is_admin() );

-- Users can only view/edit their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Allow users to insert their own profile (Registration)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );
