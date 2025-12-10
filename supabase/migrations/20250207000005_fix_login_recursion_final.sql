/*
  # FIX LOGIN CRASH (NUCLEAR OPTION)
  
  ## Problem:
  Login triggers an UPDATE on auth.users (last_sign_in_at).
  Existing triggers on UPDATE are causing infinite recursion or permission errors (500).
  
  ## Solution:
  1. DROP ALL triggers on auth.users (Insert, Update, Delete).
  2. Re-create ONLY the INSERT trigger (for new registrations).
  3. REMOVE any UPDATE triggers completely. Login should not fire complex logic.
  4. Simplify the profile creation function to be 100% safe.
*/

-- 1. Drop ALL existing triggers on auth.users to clear the conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS sync_user_profile ON auth.users;

-- 2. Drop potential conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile() CASCADE;

-- 3. Create a CLEAN, SAFE function for NEW USERS only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes security warning
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- If profile exists, do nothing. Don't update.
  
  RETURN new;
END;
$$;

-- 4. Create the trigger ONLY for INSERT (Registration)
-- We explicitly DO NOT create a trigger for UPDATE. This prevents the login crash.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure Admin Permissions are solid (Non-recursive)
-- We use a simple check that doesn't rely on complex queries
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
