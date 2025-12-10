-- =================================================================
-- ULTIMATE STABILITY & SELF-HEALING MECHANISM
-- =================================================================
-- Description: This migration ensures that even if triggers fail,
-- the application can "self-heal" by allowing authenticated users
-- to insert/update their own profiles directly.
-- =================================================================

-- 1. Ensure RLS is enabled but policies are permissive for self-management
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies that might block self-healing
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- 3. Create "Self-Healing" Insert Policy
-- This allows the Frontend to create a profile if it's missing (Emergency Fix)
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Create "Self-Management" Update Policy
CREATE POLICY "Enable update for users based on ID"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create "Universal Read" Policy
-- Allows users to read their own data, and Admins to read everything
CREATE POLICY "Enable read access for users and admins"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR
    auth.jwt() ->> 'email' = 'admin@sniperfx.com' -- Hardcoded safety for Master Admin
);

-- 6. Ensure Master Admin always has access (Database Level Override)
-- This function runs on every login to guarantee Admin Access
CREATE OR REPLACE FUNCTION public.ensure_admin_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@sniperfx.com' THEN
    -- Force update profile to admin if it exists
    UPDATE public.profiles 
    SET role = 'admin', status = 'active'
    WHERE id = NEW.id;
    
    -- If profile doesn't exist, the trigger 'handle_new_user' or frontend will create it
    -- This block is just a safety net for existing users
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach this safety trigger to auth.users (runs on login)
DROP TRIGGER IF EXISTS on_auth_user_login_check ON auth.users;
CREATE TRIGGER on_auth_user_login_check
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_admin_access();
