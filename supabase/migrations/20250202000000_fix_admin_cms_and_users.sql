/*
# Fix Admin CMS and User Management
Fixes RLS policies for site_settings, adds missing columns, and creates a secure function for user deletion.
*/

-- 1. Ensure site_settings table structure is complete
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist (Idempotent)
DO $$
BEGIN
    -- Text columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'site_name') THEN ALTER TABLE public.site_settings ADD COLUMN site_name text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'site_name_en') THEN ALTER TABLE public.site_settings ADD COLUMN site_name_en text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title_en') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title_en text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title_line1') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title_line1 text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title_line1_en') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title_line1_en text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title_line2') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title_line2 text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_title_line2_en') THEN ALTER TABLE public.site_settings ADD COLUMN hero_title_line2_en text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_desc') THEN ALTER TABLE public.site_settings ADD COLUMN hero_desc text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'hero_desc_en') THEN ALTER TABLE public.site_settings ADD COLUMN hero_desc_en text; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'logo_url') THEN ALTER TABLE public.site_settings ADD COLUMN logo_url text; END IF;
    
    -- Boolean columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'maintenance_mode') THEN ALTER TABLE public.site_settings ADD COLUMN maintenance_mode boolean DEFAULT false; END IF;
    
    -- JSONB columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'social_links') THEN ALTER TABLE public.site_settings ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'stats') THEN ALTER TABLE public.site_settings ADD COLUMN stats jsonb DEFAULT '{"students": "+1500", "hours": "+50"}'::jsonb; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'features_config') THEN ALTER TABLE public.site_settings ADD COLUMN features_config jsonb DEFAULT '{}'::jsonb; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'content_config') THEN ALTER TABLE public.site_settings ADD COLUMN content_config jsonb DEFAULT '{}'::jsonb; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'home_features') THEN ALTER TABLE public.site_settings ADD COLUMN home_features jsonb DEFAULT '[]'::jsonb; END IF;
END $$;

-- 2. Fix RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.site_settings;
CREATE POLICY "Public Read Access" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Full Access" ON public.site_settings;
CREATE POLICY "Admin Full Access" ON public.site_settings FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 3. Secure User Deletion Function (Hard Delete)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify Admin Status
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;

  -- Delete from public.profiles (App Data)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (Identity Data)
  -- This allows the user to register again with the same email
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant permissions for the function owner (usually postgres) to modify auth.users
GRANT DELETE ON auth.users TO postgres;
GRANT DELETE ON auth.users TO service_role;
GRANT EXECUTE ON FUNCTION delete_user_by_admin TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_by_admin TO service_role;

-- 4. Ensure Profiles RLS allows Admin Updates (for Approval)
DROP POLICY IF EXISTS "Admin Update Profiles" ON public.profiles;
CREATE POLICY "Admin Update Profiles" ON public.profiles FOR UPDATE USING (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 5. Ensure Profiles RLS allows Admin Select
DROP POLICY IF EXISTS "Admin Select Profiles" ON public.profiles;
CREATE POLICY "Admin Select Profiles" ON public.profiles FOR SELECT USING (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    OR auth.uid() = id -- Users can see themselves
);
