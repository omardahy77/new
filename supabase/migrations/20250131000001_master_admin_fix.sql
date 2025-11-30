-- MASTER ADMIN FIX MIGRATION
-- This script fixes ALL permissions for CMS and User Management

-- 1. Enable RLS but clean up old policies to avoid conflicts
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Read" ON public.site_settings;
DROP POLICY IF EXISTS "Allow Admin Write" ON public.site_settings;
DROP POLICY IF EXISTS "Public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access" ON public.site_settings;

-- 2. Create ROBUST Policies for Site Settings
-- Public can READ
CREATE POLICY "Public_Read_Settings" ON public.site_settings
FOR SELECT USING (true);

-- Admin can DO EVERYTHING (Update, Insert, Delete)
-- We check email directly as a failsafe, AND the role
CREATE POLICY "Admin_Write_Settings" ON public.site_settings
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@sniperfx.com' 
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Ensure a Settings Row Exists (Prevents "No ID" errors)
INSERT INTO public.site_settings (site_name, hero_title, hero_desc)
SELECT 'Sniper FX', 'Trade Smart', 'Welcome to the best trading platform.'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 4. Fix Courses Permissions
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
DROP POLICY IF EXISTS "Admin Write Courses" ON public.courses;

CREATE POLICY "Public_Read_Courses" ON public.courses FOR SELECT USING (true);

CREATE POLICY "Admin_Write_Courses" ON public.courses FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@sniperfx.com' 
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Fix Lessons Permissions
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admin Write Lessons" ON public.lessons;

CREATE POLICY "Public_Read_Lessons" ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Admin_Write_Lessons" ON public.lessons FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@sniperfx.com' 
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. SECURE DELETE USER FUNCTION (Hard Delete from Auth)
-- This function allows the admin to completely wipe a user from the system
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges
SET search_path = public, auth -- Access to auth schema
AS $$
BEGIN
  -- Security Check: Only allow if the caller is an Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) AND (SELECT email FROM auth.users WHERE id = auth.uid()) != 'admin@sniperfx.com' THEN
    RAISE EXCEPTION 'Access denied: You are not an admin.';
  END IF;

  -- 1. Delete from public profiles (Cascade should handle enrollments/progress)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- 2. Delete from auth.users (Removes login access permanently)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 7. Ensure Admin Profile Exists & Is Active
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT id, email, 'System Admin', 'admin', 'active'
FROM auth.users 
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', status = 'active';
