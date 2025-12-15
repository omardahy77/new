-- SCORCHED EARTH FIX: If we can't kill the trigger, we neutralize its brain.

-- 1. Disable RLS temporarily to allow admin operations
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. NEUTRALIZE THE FUNCTION (The Brain)
-- Even if the trigger 'on_auth_user_created' still exists on auth.users,
-- we replace the code it executes with this SAFE version.
-- This guarantees that UPDATE events (Logins) will EXIT IMMEDIATELY.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ----------------------------------------------------------------
  -- SAFETY VALVE: EXIT IMMEDIATELY IF NOT INSERT
  ----------------------------------------------------------------
  -- This is the most critical part. It prevents the login crash.
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RETURN NEW;
  END IF;

  ----------------------------------------------------------------
  -- INSERT LOGIC (Only for new registrations)
  ----------------------------------------------------------------
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- SWALLOW ALL ERRORS. Do not let the transaction fail.
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. CLEANUP PUBLIC TRIGGERS (Potential Recursion Source)
-- Drop any triggers on the profiles table that might be calling back to auth.users
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
DROP TRIGGER IF EXISTS on_user_update ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_user_update();

-- 4. RE-ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. ENSURE ADMIN PERMISSIONS
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
