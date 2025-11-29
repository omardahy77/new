/*
  # Fix Infinite Recursion in RLS Policies
  
  ## Query Description:
  This migration fixes a critical "infinite recursion" error (Code 42P17) preventing admin login/profile creation.
  It replaces the recursive RLS policies with a secure, non-recursive approach using a SECURITY DEFINER function.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High" (Fixes login blocker)
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Function: public.check_is_admin() (New, Security Definer)
  - Table: public.profiles (Policies updated)
  
  ## Security Implications:
  - RLS Status: Remains Enabled
  - Policy Changes: Yes (Replaced with non-recursive versions)
  - Auth Requirements: None
*/

-- 1. Create a secure function to check admin status without triggering RLS recursion
-- SECURITY DEFINER: Runs with privileges of the creator, bypassing RLS on the table
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes security advisory warnings
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Clean up existing policies to ensure a fresh start
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Define Recursion-Free Policies

-- SELECT: Allow public read access (needed for login checks)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- INSERT: Allow users to insert ONLY their own profile
-- CRITICAL: This must NOT query the profiles table to avoid recursion
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own; Admins can update all (using secure function)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
  OR
  public.check_is_admin()
);

-- DELETE: Only admins (using secure function)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.check_is_admin());
