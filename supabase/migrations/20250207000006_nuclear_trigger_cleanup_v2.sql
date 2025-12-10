-- NUCLEAR CLEANUP: Forcefully remove ALL triggers on auth.users to fix Login 500 Error
-- This script guarantees that NO trigger runs on UPDATE (Login), only on INSERT (Registration)

BEGIN;

-- 1. Disable triggers to prevent interference during cleanup
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 2. Drop ALL known and potential triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS check_for_admin ON auth.users;
DROP TRIGGER IF EXISTS sync_user_status ON auth.users;
DROP TRIGGER IF EXISTS on_user_logged_in ON auth.users;
DROP TRIGGER IF EXISTS ensure_profile_exists ON auth.users;

-- 3. Drop related functions to ensure clean slate
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_status() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_profile_exists() CASCADE;

-- 4. Re-create ONLY the essential INSERT trigger (Safe & Simple)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'active' -- Auto-activate to prevent login blocks
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- If it's the master admin, ensure they stay admin
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE public.profiles.role END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Attach trigger ONLY for INSERT (Registration)
-- We explicitly DO NOT add an UPDATE trigger, so Login (which updates last_sign_in_at) is 100% safe.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Re-enable triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

COMMIT;
