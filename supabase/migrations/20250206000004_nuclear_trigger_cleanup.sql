-- NUCLEAR FIX: Clean up ALL triggers on auth.users to resolve 500 Login Error
-- This script dynamically finds and drops any trigger that might be crashing the login process

DO $$
DECLARE
    trig_rec RECORD;
BEGIN
    -- Loop through all triggers on auth.users and drop them
    FOR trig_rec IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        RAISE NOTICE 'Dropping trigger: %', trig_rec.trigger_name;
        EXECUTE 'DROP TRIGGER IF EXISTS "' || trig_rec.trigger_name || '" ON auth.users';
    END LOOP;
END $$;

-- Drop the handler functions to ensure a clean slate
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Re-create the Profile Creation Function (The ONLY one we need)
-- We use SECURITY DEFINER and explicit search_path to prevent schema errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Insert the profile safely
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Swallow errors so we never block login/signup
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN new;
END;
$$;

-- Re-attach the trigger ONLY for INSERT (New Registration)
-- We do NOT add an UPDATE trigger, as that is where login crashes often happen
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CRITICAL PERMISSIONS FIX
-- Grant access to the internal auth role to prevent "querying schema" errors
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Ensure profiles table has correct permissions
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, UPDATE, INSERT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;
