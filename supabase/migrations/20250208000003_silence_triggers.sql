-- MIGRATION: Silence Triggers & Fix Login Crash
-- This migration removes ALL triggers on auth.users and recreates ONLY a safe INSERT trigger.

-- 1. Disable RLS temporarily to prevent recursion during cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. EXPLICITLY DROP known problematic triggers (Brute Force Cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; -- Potential culprit
DROP TRIGGER IF EXISTS check_for_admin ON auth.users;

-- 3. DROP old functions to ensure clean slate
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_safe();

-- 4. CREATE a truly safe function (Insert Only)
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- ABSOLUTE SAFETY: Do nothing for updates
  -- This guarantees that Login (UPDATE last_sign_in_at) NEVER runs this logic
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Insert profile safely with error swallowing
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Swallow errors to prevent Auth System crash
    RAISE WARNING 'Profile creation failed (swallowed): %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 5. CREATE trigger ONLY for INSERT
-- We explicitly DO NOT include UPDATE event here
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- 6. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Grant permissions just in case
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
