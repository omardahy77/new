-- =================================================================
-- FINAL FIX FOR CMS PERMISSIONS & ADMIN ACTIONS
-- =================================================================

-- 1. Create a Secure Admin Check Function (Prevents Infinite Recursion)
-- This function runs with "SECURITY DEFINER" privileges (System Level), 
-- allowing it to check the profiles table without triggering RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Fix Site Settings Permissions (The "Not Saving" Issue)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Read Settings" ON public.site_settings;
CREATE POLICY "Allow Public Read Settings" ON public.site_settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Admin Full Control Settings" ON public.site_settings;
CREATE POLICY "Allow Admin Full Control Settings" ON public.site_settings
FOR ALL
USING (is_admin());

-- Ensure there is at least one row in site_settings to update
INSERT INTO public.site_settings (site_name, hero_title, hero_desc)
SELECT 'Sniper FX Gold', 'تداول بذكاء', 'منصة تعليمية متكاملة'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 3. Fix Courses & Lessons Permissions
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Courses Policies
DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Courses" ON public.courses;
CREATE POLICY "Admin Manage Courses" ON public.courses FOR ALL USING (is_admin());

-- Lessons Policies
DROP POLICY IF EXISTS "Public Read Lessons" ON public.lessons;
CREATE POLICY "Public Read Lessons" ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Lessons" ON public.lessons;
CREATE POLICY "Admin Manage Lessons" ON public.lessons FOR ALL USING (is_admin());

-- 4. Fix Profiles Permissions (For Approving Students)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Update Profiles" ON public.profiles;
CREATE POLICY "Admin Update Profiles" ON public.profiles 
FOR UPDATE
USING (is_admin());

-- 5. Secure User Deletion Function (RPC)
-- This allows the Admin to delete a user from auth.users (The Login System)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the requester is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
  END IF;

  -- Delete from auth.users (Cascades to profiles, enrollments, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
