-- Add missing English translation columns to site_settings table to match frontend defaultSettings
-- This prevents the "Could not find column" error during updates

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS site_name_en text DEFAULT 'Sniper FX Gold',
ADD COLUMN IF NOT EXISTS hero_title_en text DEFAULT 'Trade Smart with Sniper Precision',
ADD COLUMN IF NOT EXISTS hero_title_line1_en text DEFAULT 'Trade Smart',
ADD COLUMN IF NOT EXISTS hero_title_line2_en text DEFAULT 'With Sniper Precision',
ADD COLUMN IF NOT EXISTS hero_desc_en text DEFAULT 'Discover the secrets of market making... A complete, secure LMS taking you from zero to hero.';

-- Also ensure the JSONB configuration columns exist (critical for the new CMS)
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS content_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features_config jsonb DEFAULT '{}'::jsonb;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
