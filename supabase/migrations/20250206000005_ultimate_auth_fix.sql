-- ULTIMATE AUTH FIX
-- 1. Grant Permissions to Internal Roles (Fixes "querying schema" error)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 2. Drop POTENTIALLY BROKEN Triggers (Clean Slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; -- Common culprit for login crashes
DROP TRIGGER IF EXISTS on_user_update ON auth.users;

-- 3. Redefine Function with CRASH PROTECTION (Exception Handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Try to insert the profile
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- Only update name if it's currently empty/default
    full_name = CASE 
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = split_part(public.profiles.email, '@', 1) 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    -- NEVER overwrite admin role
    role = CASE 
      WHEN public.profiles.role = 'admin' THEN 'admin' 
      ELSE EXCLUDED.role 
    END;
    
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Catch ALL errors and return 'new' so Auth doesn't crash
    -- The frontend 'Self-Healing' will fix the profile later if this fails
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- 4. Re-attach ONLY the Insert Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure RLS is enabled but policies exist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-verify policies (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do everything') THEN
        CREATE POLICY "Admins can do everything" ON public.profiles FOR ALL USING (public.is_admin());
    END IF;
END
$$;
