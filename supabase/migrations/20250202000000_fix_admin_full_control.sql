-- MIGRATION: Fix Admin Control, CMS Saving, and User Deletion
-- Description: This migration ensures the site_settings table has all columns, fixes RLS policies for saving, and adds a secure function to delete users.

-- 1. Ensure site_settings table exists and has ALL required columns (JSONB for flexibility)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    site_name text DEFAULT 'Sniper FX Gold',
    site_name_en text DEFAULT 'Sniper FX Gold',
    hero_title text DEFAULT 'تداول بذكاء بدقة القناص',
    hero_title_en text DEFAULT 'Trade Smart with Sniper Precision',
    hero_title_line1 text DEFAULT 'تداول بذكاء',
    hero_title_line1_en text DEFAULT 'Trade Smart',
    hero_title_line2 text DEFAULT 'بدقة القناص',
    hero_title_line2_en text DEFAULT 'With Sniper Precision',
    hero_desc text,
    hero_desc_en text,
    logo_url text,
    maintenance_mode boolean DEFAULT false,
    social_links jsonb DEFAULT '{}'::jsonb,
    stats jsonb DEFAULT '{}'::jsonb,
    features_config jsonb DEFAULT '{}'::jsonb,
    content_config jsonb DEFAULT '{}'::jsonb,
    home_features jsonb DEFAULT '[]'::jsonb -- Added this column to store features list
);

-- 2. Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Fix RLS Policies for site_settings (CRITICAL FOR SAVING)
DROP POLICY IF EXISTS "Allow public read settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin insert settings" ON public.site_settings;

-- Everyone can read settings
CREATE POLICY "Allow public read settings" 
ON public.site_settings FOR SELECT 
USING (true);

-- Only admins can update
CREATE POLICY "Allow admin update settings" 
ON public.site_settings FOR UPDATE 
USING (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- Only admins can insert (if table is empty)
CREATE POLICY "Allow admin insert settings" 
ON public.site_settings FOR INSERT 
WITH CHECK (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);

-- 4. Secure Function to Delete Users (Auth + Profile)
-- This function runs with "SECURITY DEFINER" to bypass normal RLS, allowing the admin to delete from auth.users
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if the executor is actually an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete users.';
  END IF;

  -- 2. Delete from public.profiles (RLS might handle this, but explicit is safer here)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- 3. Delete from auth.users (This is the critical part that removes the login)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 5. Ensure Profiles have status column and default to 'pending'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'pending';
    END IF;
END $$;

-- 6. Trigger to handle new user registration (Force Pending Status)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'pending' -- Force pending status for new registrations
  );
  RETURN new;
END;
$$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Ensure Admin has access to Courses and Lessons (Update/Delete)
DROP POLICY IF EXISTS "Admin full access courses" ON public.courses;
CREATE POLICY "Admin full access courses" ON public.courses
FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

DROP POLICY IF EXISTS "Admin full access lessons" ON public.lessons;
CREATE POLICY "Admin full access lessons" ON public.lessons
FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 8. Insert default settings row if not exists
INSERT INTO public.site_settings (site_name)
SELECT 'Sniper FX Gold'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
