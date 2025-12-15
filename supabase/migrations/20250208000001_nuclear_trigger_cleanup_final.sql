-- 1. TEMPORARY SAFETY: Disable RLS on profiles to prevent policy recursion during cleanup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. NUCLEAR CLEANUP: Drop ALL triggers on auth.users dynamically
-- This removes any "zombie" triggers from previous failed migrations regardless of their name
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- 3. CLEANUP FUNCTIONS: Drop the handler function to ensure we recreate it fresh
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. RECREATE FUNCTION: Robust, Error-Swallowing, Insert-Only Logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- SAFETY CHECK: Stop immediately if this is not an INSERT
  -- This guarantees that Login (UPDATE) operations NEVER trigger this logic
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Create Profile
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
    -- CRITICAL: Swallow all errors to prevent Auth System crash
    -- Log the error for debugging, but allow the transaction to succeed
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. REBIND TRIGGER: Bind ONLY to INSERT event
-- This ensures login updates (last_sign_in_at) are completely ignored
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RESTORE SECURITY: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. ENSURE ADMIN ACCESS: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
