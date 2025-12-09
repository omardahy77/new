-- 1. NUCLEAR CLEANUP: Drop ALL triggers on auth.users
-- This removes the broken trigger causing 500s on Login (UPDATE events)
DO $$
DECLARE
    trg text;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trg || ' ON auth.users';
    END LOOP;
END $$;

-- 2. Drop and Recreate the Handler Function with SECURITY FIXES
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public -- CRITICAL: Fixes "Database error querying schema"
LANGUAGE plpgsql
AS $$
BEGIN
  -- Safe profile creation that won't crash on duplicates
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but DO NOT FAIL the transaction
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN new;
END;
$$;

-- 3. Re-attach Trigger ONLY for INSERT (New Users)
-- This prevents the trigger from firing on Login (UPDATE), solving the 500 error
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant Essential Permissions to Auth System
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
