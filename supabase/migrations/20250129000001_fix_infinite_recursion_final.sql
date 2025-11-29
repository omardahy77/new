/*
# Fix Infinite Recursion in Profiles Policies

## Query Description:
This migration resolves the "infinite recursion" error (Code 42P17) preventing the admin profile from being created/read.
It replaces the recursive RLS policies with a safe `SECURITY DEFINER` function pattern.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "High" (Fixes login blocker)
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Remains Enabled
- Policy Changes: Yes (Replaces all profile policies)
- Auth Requirements: None
*/

-- 1. Create a secure function to check admin status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This runs with security definer privileges, bypassing RLS for this specific check
  -- This breaks the infinite loop
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies (Cleaning up all potential conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
DROP POLICY IF EXISTS "Delete profiles" ON profiles;

-- 3. Re-create clean, non-recursive policies

-- VIEW: Users can see their own profile. Admins can see everyone.
CREATE POLICY "View profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id OR check_is_admin()
);

-- INSERT: Users can insert their OWN profile (Critical for registration/self-healing)
CREATE POLICY "Insert own profile" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- UPDATE: Users can update own. Admins can update all.
CREATE POLICY "Update profiles" ON profiles
FOR UPDATE USING (
  auth.uid() = id OR check_is_admin()
);

-- DELETE: Admins only
CREATE POLICY "Delete profiles" ON profiles
FOR DELETE USING (
  check_is_admin()
);
