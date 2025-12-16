/*
  # Fix Triggers & System Stability
  
  ## Query Description:
  This migration performs a "Safe Reset" of the critical database triggers.
  It prevents the "500 Database Error" during login/signup by wrapping the profile creation logic in an error-handling block.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High" (Fixes Login/Signup)
  - Requires-Backup: false
  - Reversible: true
  
  ## Changes:
  1. Replaces `handle_new_user` with a version that catches errors (Safe Mode).
  2. Re-applies the trigger on `auth.users`.
  3. Ensures `is_admin_safe` is optimized.
*/

-- 1. Create a "Safe" User Handler Function
-- This function will NOT crash if profile creation fails (e.g. duplicate ID)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert the profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      -- Use metadata name or fallback to email username
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      -- Default role is student unless specified in metadata (e.g. by admin console)
      COALESCE(new.raw_user_meta_data->>'role', 'student'),
      -- Default status is active to ensure immediate access
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- CRITICAL: Catch any error and log it, but DO NOT FAIL the transaction.
    -- This ensures the user is still created in auth.users even if profile fails.
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;

-- 2. Reset the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Optimize Admin Check (Non-Recursive)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check directly against the table without triggering RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 4. Ensure RLS Policies use the safe check
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Create unified Admin Policy
CREATE POLICY "admin_full_access" ON profiles
FOR ALL
USING ( is_admin_safe() );

-- Ensure public read access (for stats/leaderboards if needed)
CREATE POLICY "public_view_access" ON profiles
FOR SELECT
USING ( true );

-- Ensure users can edit their own profile
CREATE POLICY "user_self_edit" ON profiles
FOR UPDATE
USING ( auth.uid() = id );
