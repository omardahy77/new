/*
  # Full CMS & Approval System Setup
  
  ## Query Description:
  1. Updates 'profiles' table to ensure status column exists and defaults to 'pending'.
  2. Updates 'site_settings' to include 'content_config' (JSONB) for storing all site texts dynamically.
  3. Ensures 'enrollments' table exists for paid course access.
  4. Adds RLS policies to allow public read of settings but only Admin write.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Ensure Profiles has status and role
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';

-- 2. Ensure Enrollments Table exists
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for Enrollments
CREATE POLICY "Admins can manage all enrollments" 
ON public.enrollments FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own enrollments" 
ON public.enrollments FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 3. Update Site Settings for CMS
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS content_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features_config jsonb DEFAULT '{"show_coming_soon": true, "show_stats": true, "allow_registration": true}'::jsonb,
ADD COLUMN IF NOT EXISTS site_name_en text DEFAULT 'Sniper FX Gold',
ADD COLUMN IF NOT EXISTS hero_title_en text,
ADD COLUMN IF NOT EXISTS hero_title_line1_en text,
ADD COLUMN IF NOT EXISTS hero_title_line2_en text,
ADD COLUMN IF NOT EXISTS hero_desc_en text;

-- 4. Fix RLS for Site Settings (Allow Public Read, Admin Write)
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update access" ON public.site_settings;

CREATE POLICY "Allow public read access" 
ON public.site_settings FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow admin update access" 
ON public.site_settings FOR UPDATE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow admin insert access" 
ON public.site_settings FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Function to safely delete users (Admin Only)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executor is an admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Delete from auth.users (this cascades to profiles usually, but we do it safely)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
