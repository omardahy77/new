/*
  # Enhance CMS Schema
  This migration adds columns to site_settings to support full site customization.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - site_settings: Add columns for about_us, features, and extra customization.
*/

-- Ensure site_settings table exists and has the correct structure
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    site_name TEXT DEFAULT 'Sniper FX Gold',
    hero_title TEXT DEFAULT 'تداول بذكاء بدقة القناص',
    hero_title_line1 TEXT DEFAULT 'تداول بذكاء',
    hero_title_line2 TEXT DEFAULT 'بدقة القناص',
    hero_desc TEXT DEFAULT 'اكتشف أسرار صناعة السوق والمؤسسات المالية...',
    logo_url TEXT,
    stats JSONB DEFAULT '{"students": "+1500", "hours": "+50"}',
    social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "telegram": ""}',
    home_features JSONB DEFAULT '[]', -- Array of {title, description, icon}
    about_title TEXT DEFAULT 'من نحن',
    about_desc TEXT DEFAULT 'نحن أكاديمية رائدة...'
);

-- Enable RLS on site_settings if not already enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings
DROP POLICY IF EXISTS "Everyone can read site settings" ON public.site_settings;
CREATE POLICY "Everyone can read site settings" ON public.site_settings FOR SELECT USING (true);

-- Policy: Only admins can update settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Insert default row if not exists
INSERT INTO public.site_settings (site_name)
SELECT 'Sniper FX Gold'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
