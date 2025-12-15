/*
# MASTER FIX: Permissions & Recursion
# ----------------------------------------------------------------
# INSTRUCTIONS:
# 1. Copy the content of this file.
# 2. Go to Supabase Dashboard -> SQL Editor.
# 3. Paste and Run.
# ----------------------------------------------------------------
# This script fixes the "500 Database Error" and "42501 Permission Denied"
# by removing recursive triggers on auth.users and establishing a safe
# profile creation flow.
*/

-- 1. Drop problematic triggers on auth.users
-- These triggers are likely causing the infinite loop or permission errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
DROP TRIGGER IF EXISTS check_admin_user ON auth.users;
DROP TRIGGER IF EXISTS enforce_admin_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 2. Create a SAFE, IDEMPOTENT handler for new users
-- This function uses SECURITY DEFINER to bypass RLS during profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'status', 'pending')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- Protect the admin role: If user is already admin, keep it. Otherwise use new role.
    role = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach ONLY the safe creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix Permissions on Public Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- Re-create Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can do everything"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Ensure Admin User Exists (Optional Repair)
-- This ensures the admin profile exists if the auth user exists
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';
  
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (admin_uid, 'admin@sniperfx.com', 'System Admin', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';
  END IF;
END $$;
