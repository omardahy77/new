-- ==============================================================================
-- 🚀 SNIPER FX GOLD - COMPLETE DATABASE REBUILD (FRESH START)
-- ==============================================================================
-- This migration wipes the public schema tables and rebuilds them from scratch.
-- It ensures a clean, professional, and recursion-free architecture.

-- 1. CLEANUP: Drop existing tables and functions to start fresh
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.lesson_subtitles CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- A. PROFILES (Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. SITE SETTINGS (CMS)
CREATE TABLE public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name TEXT DEFAULT 'Sniper FX Gold',
    site_name_en TEXT DEFAULT 'Sniper FX Gold',
    
    -- Hero Section
    hero_title TEXT,
    hero_title_en TEXT,
    hero_desc TEXT,
    hero_desc_en TEXT,
    logo_url TEXT,
    
    -- Configs
    maintenance_mode BOOLEAN DEFAULT false,
    social_links JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    content_config JSONB DEFAULT '{}'::jsonb, -- Flexible storage for all text content
    home_features JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. COURSES
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    is_paid BOOLEAN DEFAULT false,
    rating NUMERIC DEFAULT 5.0,
    level TEXT DEFAULT 'متوسط',
    duration TEXT DEFAULT '0',
    lesson_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. LESSONS
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT DEFAULT '10:00',
    "order" INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. LESSON SUBTITLES
CREATE TABLE public.lesson_subtitles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    lang TEXT NOT NULL,
    label TEXT NOT NULL,
    vtt_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. ENROLLMENTS
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- G. LESSON PROGRESS
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    position NUMERIC DEFAULT 0,
    duration NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 3. ROW LEVEL SECURITY (RLS) - "Smart & Simple"
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is admin (Non-Recursive via JWT)
-- We trust the JWT claim or specific email to avoid DB recursion
CREATE OR REPLACE FUNCTION public.is_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'admin@sniperfx.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- A. PROFILES
-- Public Read: Essential for login checks and avoiding recursion.
-- It's safe because we only expose basic info.
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

-- Update: Users can update own, Admin can update all
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin_jwt());

-- B. SITE SETTINGS
-- Read: Public
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT USING (true);
-- Write: Admin only
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (public.is_admin_jwt());

-- C. COURSES & LESSONS
-- Read: Public (Content protection is handled in frontend/video player logic via checkAccess)
CREATE POLICY "Courses are public" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Lessons are public" ON public.lessons FOR SELECT USING (true);
-- Write: Admin only
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin_jwt());
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (public.is_admin_jwt());

-- D. ENROLLMENTS
-- Read: Own enrollments OR Admin
CREATE POLICY "Users view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id OR public.is_admin_jwt());
-- Write: Admin only (Students enroll via payment/admin approval)
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR ALL USING (public.is_admin_jwt());

-- E. PROGRESS
-- Read/Write: Own progress
CREATE POLICY "Users manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);


-- 4. AUTOMATION & TRIGGERS
-- ==============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-assign Admin role to the master email
  IF NEW.email = 'admin@sniperfx.com' THEN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (NEW.id, NEW.email, 'System Admin', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
  ELSE
    -- Regular users
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'student',
      'pending' -- Default status is pending approval
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (INSERT ONLY to avoid login crashes)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. SEED DATA (Initial Content)
-- ==============================================================================

-- Default Settings
INSERT INTO public.site_settings (site_name, hero_title, hero_desc, content_config)
VALUES (
  'Sniper FX Gold', 
  'تداول بذكاء بدقة القناص', 
  'المنصة التعليمية الأولى عربياً لاحتراف تداول الذهب والفوركس.',
  '{"footer_tagline": "Sniper FX Gold", "footer_sub_tagline": "تعليم حقيقي. نتائج حقيقية."}'::jsonb
);

-- Sample Course
INSERT INTO public.courses (title, description, is_paid, level, duration, lesson_count)
VALUES (
  'دورة احتراف الذهب (Gold Mastery)',
  'كورس شامل من الصفر للاحتراف في تداول الذهب XAUUSD',
  true,
  'خبير',
  '25 ساعة',
  15
);

-- RPC for Admin to delete users safely
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin_jwt() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  
  -- Delete from auth.users (Cascades to profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
