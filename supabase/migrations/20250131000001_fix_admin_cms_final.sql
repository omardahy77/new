/*
  # Fix Admin Permissions & Add Secure Delete
  
  1. Creates a secure function to delete users from auth.users
  2. Fixes RLS policies for site_settings to ensure Admins can ALWAYS update
  3. Ensures a default settings row exists
*/

-- 1. Secure Delete Function (Allows Admin to delete from Auth)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete users.';
  END IF;

  -- Delete from auth.users (Cascades to profiles/enrollments)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 2. Fix Site Settings Permissions
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin insert access" ON public.site_settings;

-- Public Read
CREATE POLICY "Allow public read access"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Admin Update (Using a simpler check to avoid recursion)
CREATE POLICY "Allow admin all access"
ON public.site_settings FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Fix Courses/Lessons Permissions (Just in case)
DROP POLICY IF EXISTS "Admin Full Access Courses" ON public.courses;
CREATE POLICY "Admin Full Access Courses"
ON public.courses FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Admin Full Access Lessons" ON public.lessons;
CREATE POLICY "Admin Full Access Lessons"
ON public.lessons FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 4. Ensure Default Settings Row Exists
INSERT INTO public.site_settings (id, site_name, hero_title, hero_desc)
SELECT gen_random_uuid(), 'Sniper FX Gold', 'تداول بذكاء', 'منصة تعليمية متكاملة'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
