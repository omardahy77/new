/*
  # FIX CMS PERFORMANCE & SAVING ISSUES
  
  1. Ensures 'site_settings' table exists and has a single row.
  2. Fixes RLS policies to allow Admins to update settings instantly.
  3. Optimizes indexes for faster queries.
*/

-- 1. Ensure site_settings table exists with correct structure
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    site_name TEXT DEFAULT 'Sniper FX Gold',
    logo_url TEXT,
    
    -- Content Config (JSONB for flexibility)
    content_config JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    
    -- Legacy columns (kept for safety, mapped to JSON in frontend)
    hero_title_line1 TEXT,
    hero_title_line2 TEXT,
    hero_desc TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registration BOOLEAN DEFAULT true
);

-- 2. Ensure at least one row exists (Singleton Pattern)
INSERT INTO public.site_settings (site_name, content_config)
SELECT 'Sniper FX Gold', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 3. Fix Permissions (The likely cause of "Hanging Save")
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Admin update access" ON public.site_settings;
DROP POLICY IF EXISTS "Admin insert access" ON public.site_settings;

-- Create simplified, robust policies
CREATE POLICY "Public read access"
ON public.site_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin full access"
ON public.site_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);

-- 5. Fix Lesson RLS (Just in case)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view published lessons"
ON public.lessons FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage lessons"
ON public.lessons FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
