-- EMERGENCY FIX FOR 500 ERROR (Database error querying schema)
-- This script drops ALL triggers that might run on Login (UPDATE auth.users)
-- and recreates only the essential INSERT trigger for new users.

BEGIN;

-- 1. Disable triggers on auth.users to stop the bleeding immediately
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 2. Drop known problematic triggers (covering various naming conventions used in previous migrations)
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON auth.users;
DROP TRIGGER IF EXISTS sync_user_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Drop the functions associated with these triggers
DROP FUNCTION IF EXISTS public.handle_user_login CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_to_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 4. Re-create a SAFE, SIMPLE trigger for NEW USERS only (INSERT)
-- We intentionally DO NOT add a trigger for UPDATE to prevent the login crash.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active' 
      ELSE 'pending' 
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = CASE 
      WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' 
      ELSE public.profiles.role 
    END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the safe trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Re-enable triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- 7. Ensure RLS Policies are not blocking access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Re-create standard policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

COMMIT;
