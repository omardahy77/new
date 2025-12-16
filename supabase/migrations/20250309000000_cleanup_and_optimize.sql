-- =================================================================
-- FINAL CLEANUP & OPTIMIZATION MIGRATION
-- Description: Removes all problematic triggers and installs a single, safe one.
-- =================================================================

-- 1. DROP ALL EXISTING TRIGGERS ON auth.users (Clean Slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
DROP TRIGGER IF EXISTS check_admin_exists ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- 2. DROP RELATED FUNCTIONS
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();
DROP FUNCTION IF EXISTS public.update_last_seen();

-- 3. CREATE A ROBUST "SAFE" PROFILE HANDLER
-- This function uses a BEGIN/EXCEPTION block to never fail the transaction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Attempt to insert profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status, created_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'role', 'student'),
      'pending',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If insert fails (e.g. duplicate), just log it. DO NOT CRASH.
    RAISE WARNING 'Profile creation warning for %: %', new.id, SQLERRM;
  END;
  
  -- Safety Net: Always ensure the main admin email has admin rights
  IF new.email = 'admin@sniperfx.com' THEN
      UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$;

-- 4. RE-ATTACH THE SINGLE SAFE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. OPTIMIZE ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direct, fast check
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 6. RESET PERMISSIONS (Fix "Permission Denied" errors)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- Only allow authenticated users to update their own data (handled by RLS, but good practice)
GRANT UPDATE ON public.profiles TO authenticated;

-- 7. ENSURE INDEXES EXIST (Performance)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
