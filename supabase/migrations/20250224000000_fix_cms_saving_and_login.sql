/*
  # ULTIMATE FIX: CMS Saving, Login Recursion, and Lesson Management
  
  1. CMS FIX:
     - Ensures 'site_settings' has JSONB columns 'content_config' and 'features_config'.
     - Updates RLS policies to GUARANTEE Admins can update settings.
  
  2. LOGIN FIX:
     - Replaces complex triggers with a simplified, non-recursive profile handler.
     - Optimizes RLS to prevent infinite loops during login.
  
  3. LESSON MANAGEMENT:
     - Ensures 'lessons' table has all required columns (video_url, duration, thumbnail_url).
*/

-- 1. FIX SITE SETTINGS (CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    site_name TEXT DEFAULT 'Sniper FX',
    logo_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    content_config JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{"students": "+1500", "hours": "+50"}'::jsonb,
    home_features JSONB DEFAULT '[]'::jsonb
);

-- Ensure columns exist (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'content_config') THEN
        ALTER TABLE public.site_settings ADD COLUMN content_config JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'features_config') THEN
        ALTER TABLE public.site_settings ADD COLUMN features_config JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'home_features') THEN
        ALTER TABLE public.site_settings ADD COLUMN home_features JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES to avoid conflicts
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin Update Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;

-- CREATE ROBUST POLICIES
CREATE POLICY "Everyone can read settings" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Admins can update settings" 
ON public.site_settings FOR UPDATE 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can insert settings" 
ON public.site_settings FOR INSERT 
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);


-- 2. FIX LOGIN RECURSION (The "Slow Login" Fix)
-- We'll simplify the profile trigger to be "Security Definer" and very basic.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END; -- Protect existing admins
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FIX PROFILES RLS (Prevent Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Simple Read Policy (No recursion)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Update Policy (Self or Admin)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admin Full Access (Using a non-recursive check if possible, or relying on the fact that SELECT is open)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- 3. FIX LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    duration TEXT,
    "order" INTEGER,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'video_url') THEN
        ALTER TABLE public.lessons ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.lessons ADD COLUMN thumbnail_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'duration') THEN
        ALTER TABLE public.lessons ADD COLUMN duration TEXT;
    END IF;
END $$;

-- Enable RLS on Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;

CREATE POLICY "Everyone can read lessons" 
ON public.lessons FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage lessons" 
ON public.lessons FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
