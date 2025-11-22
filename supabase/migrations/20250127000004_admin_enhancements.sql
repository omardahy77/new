/*
  # Admin Enhancements Schema
  
  ## Query Description:
  Adds support for lesson thumbnails and extended site configuration (toggles, texts) to allow full admin control.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - lessons: Add thumbnail_url
  - site_settings: Add features_config (JSONB), content_config (JSONB)
*/

-- Add thumbnail to lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add configuration columns to site_settings if they don't exist
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{"show_coming_soon": true, "show_stats": true, "allow_registration": true}';

ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS content_config JSONB DEFAULT '{}';

-- Update existing settings to have default values if null
UPDATE public.site_settings 
SET features_config = '{"show_coming_soon": true, "show_stats": true, "allow_registration": true}' 
WHERE features_config IS NULL;
