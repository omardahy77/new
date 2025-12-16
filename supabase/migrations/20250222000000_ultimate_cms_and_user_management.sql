-- 1. Create a Secure Function to Delete Users (Hard Delete)
-- This function allows admins to delete users from the auth.users table,
-- which effectively removes them from the database entirely.
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges
AS $$
BEGIN
  -- 1. Security Check: Ensure the person calling this is an ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
  END IF;

  -- 2. Delete from auth.users (This cascades to public.profiles and other tables if set up correctly)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 2. Ensure CMS Columns Exist in site_settings
-- We use JSONB columns for flexibility to store all text without creating 100 columns
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS content_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 3. Update RLS policies to ensure Admins can update settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Ensure Public Read Access for Settings
DROP POLICY IF EXISTS "Public read access for site settings" ON public.site_settings;
CREATE POLICY "Public read access for site settings"
ON public.site_settings
FOR SELECT
USING (true);
