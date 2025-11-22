-- # Secure Admin Actions & Permissions
-- This migration adds a secure function to delete users and ensures Admin has full control.

-- 1. Create a Secure Function to Delete Users (Auth + Profile)
-- This function runs with 'SECURITY DEFINER' privileges (Superuser level)
-- It checks if the caller is an Admin before proceeding.
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the role of the user making the request
  SELECT role INTO requesting_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- strict check: Only 'admin' can delete
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
  END IF;

  -- 1. Delete from public.profiles (Application Data)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 2. Delete from auth.users (Authentication Data - Login)
  -- This prevents the user from ever logging in again
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 2. Ensure RLS (Row Level Security) is Enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Grant Full Access to Admins (Drop existing policies first to avoid conflicts)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can do everything on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can do everything on site_settings" ON public.site_settings;

-- Create Comprehensive Admin Policies
CREATE POLICY "Admins can do everything on profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can do everything on courses" 
ON public.courses FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can do everything on lessons" 
ON public.lessons FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can do everything on enrollments" 
ON public.enrollments FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can do everything on site_settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 4. Ensure Public Read Access where necessary
-- Courses (Public Read)
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses" 
ON public.courses FOR SELECT 
TO anon, authenticated 
USING (true);

-- Lessons (Public Read for List, but content protected by UI logic)
DROP POLICY IF EXISTS "Public can view published lessons" ON public.lessons;
CREATE POLICY "Public can view published lessons" 
ON public.lessons FOR SELECT 
TO anon, authenticated 
USING (is_published = true);

-- Site Settings (Public Read)
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" 
ON public.site_settings FOR SELECT 
TO anon, authenticated 
USING (true);

-- Profiles (Users can read/update own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
TO authenticated 
USING (auth.uid() = id);
