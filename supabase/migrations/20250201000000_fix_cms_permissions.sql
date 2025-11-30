/*
  # Fix CMS & Admin Permissions
  
  ## Query Description:
  1. Creates a secure `is_admin()` function to safely check admin status without recursion.
  2. Fixes RLS (Row Level Security) policies for `site_settings`, `courses`, and `lessons`.
  3. Ensures `site_settings` has all necessary JSONB columns for the CMS.
  4. Grants Admins full control (INSERT, UPDATE, DELETE) over content.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create a Secure Admin Check Function (Security Definer to bypass RLS loops)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Fix Site Settings Table & Permissions
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    site_name TEXT DEFAULT 'Sniper FX Gold',
    site_name_en TEXT,
    hero_title TEXT,
    hero_title_en TEXT,
    hero_title_line1 TEXT,
    hero_title_line1_en TEXT,
    hero_title_line2 TEXT,
    hero_title_line2_en TEXT,
    hero_desc TEXT,
    hero_desc_en TEXT,
    logo_url TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    social_links JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    content_config JSONB DEFAULT '{}'::jsonb
);

-- Ensure columns exist (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'content_config') THEN
        ALTER TABLE public.site_settings ADD COLUMN content_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean slate
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins Update Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Everyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

-- Create New Policies
CREATE POLICY "Public Read Settings" 
ON public.site_settings FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admins Update Settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

-- 3. Fix Courses Permissions
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
DROP POLICY IF EXISTS "Admins Manage Courses" ON public.courses;

CREATE POLICY "Public Read Courses" 
ON public.courses FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admins Manage Courses" 
ON public.courses FOR ALL 
TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

-- 4. Fix Lessons Permissions
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins Manage Lessons" ON public.lessons;

CREATE POLICY "Public Read Lessons" 
ON public.lessons FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admins Manage Lessons" 
ON public.lessons FOR ALL 
TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

-- 5. Grant Permissions to Anon/Authenticated roles (just in case)
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
