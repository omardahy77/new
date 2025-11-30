-- MASTER FIX MIGRATION
-- This script fixes: RLS Policies, Admin Permissions, Course Management, and Registration Trigger

-- 1. Fix the is_admin function (Security Definer to prevent recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the admin role in public.profiles
  -- OR if their email is the master admin email (Hardcoded fallback for safety)
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND (email = 'admin@sniperfx.com' OR (raw_user_meta_data->>'role')::text = 'admin')
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Ensure public.profiles exists and has correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'student',
  status TEXT DEFAULT 'pending', -- Default to pending
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fix the Registration Trigger (Ensure it runs for EVERY new user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, phone_number)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active'
      ELSE 'pending' -- Force pending for everyone else
    END,
    new.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix Site Settings (Add JSONB column for CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT DEFAULT 'Sniper FX',
  maintenance_mode BOOLEAN DEFAULT false,
  content_config JSONB DEFAULT '{}'::jsonb, -- Critical for saving text
  features_config JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  home_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure content_config exists if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'content_config') THEN
        ALTER TABLE public.site_settings ADD COLUMN content_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 5. UNLOCK ALL PERMISSIONS FOR ADMIN (RLS)
-- We drop existing policies to ensure a clean slate
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for COURSES
DROP POLICY IF EXISTS "Public view courses" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;

CREATE POLICY "Public view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (is_admin());

-- Policies for LESSONS
DROP POLICY IF EXISTS "Public view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;

CREATE POLICY "Public view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (is_admin());

-- Policies for SETTINGS
DROP POLICY IF EXISTS "Public view settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;

CREATE POLICY "Public view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL USING (is_admin());

-- Policies for PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (is_admin());

-- 6. Ensure Admin User Exists & Is Active
INSERT INTO public.profiles (id, email, role, status, full_name)
SELECT id, email, 'admin', 'active', 'System Admin'
FROM auth.users
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', status = 'active';
