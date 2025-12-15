-- NUCLEAR RESET V4 (FIXED)
-- This script fixes the "Trigger Already Exists" error by explicitly dropping it first.

-- 1. CLEANUP: Remove existing triggers and functions from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CLEANUP: Wipe public schema tables (Cascade removes foreign keys)
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.lesson_subtitles CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. REBUILD: Profiles Table (Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REBUILD: Site Settings (CMS)
CREATE TABLE public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name TEXT DEFAULT 'Sniper FX Gold',
    logo_url TEXT,
    
    -- Hero Section
    hero_title_line1 TEXT,
    hero_title_line2 TEXT,
    hero_desc TEXT,
    
    -- Config
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registration BOOLEAN DEFAULT true,
    
    -- JSON Fields for flexibility
    social_links JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{"students": "+1500", "hours": "+50"}'::jsonb,
    home_features JSONB DEFAULT '[]'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    content_config JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REBUILD: Courses
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    is_paid BOOLEAN DEFAULT false, -- The Key Flag: True = VIP, False = Free
    price DECIMAL(10, 2) DEFAULT 0,
    level TEXT DEFAULT 'متوسط',
    rating DECIMAL(2, 1) DEFAULT 5.0,
    duration TEXT,
    lesson_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REBUILD: Lessons
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    "order" INTEGER NOT NULL,
    duration TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REBUILD: Enrollments (Access Control)
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 8. REBUILD: Lesson Progress
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- Seconds watched
    duration INTEGER DEFAULT 0, -- Total seconds
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 9. SECURITY: Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Helper Function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Has Course Access?
CREATE OR REPLACE FUNCTION public.has_course_access(course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid() AND course_id = course_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Profiles:
-- Everyone can read their own profile. Admins can read all.
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING (is_admin());
-- Allow insert during registration (trigger handles this, but good to have)
CREATE POLICY "System insert profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- Site Settings:
-- Public read. Admin write.
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR ALL USING (is_admin());

-- Courses:
-- Everyone can see course listings (titles, thumbnails).
-- But we might want to hide paid courses from non-logged in users? 
-- Requirement: "If paid, show to all students but access restricted".
CREATE POLICY "Public view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (is_admin());

-- Lessons:
-- Complex Logic: 
-- 1. Admin: See all.
-- 2. Course is Free: See all.
-- 3. Course is Paid: Must be enrolled.
CREATE POLICY "View lessons access control" ON public.lessons FOR SELECT USING (
  is_admin() 
  OR 
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lessons.course_id
    AND (
      c.is_paid = false -- Free course
      OR
      (auth.uid() IS NOT NULL AND has_course_access(c.id)) -- Paid & Enrolled
    )
  )
);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (is_admin());

-- Enrollments:
-- Users see their own. Admins see/manage all.
CREATE POLICY "Users view enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR ALL USING (is_admin());

-- Progress:
-- Users manage their own.
CREATE POLICY "Users manage progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- 10. AUTOMATION: User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student
    COALESCE(new.raw_user_meta_data->>'status', 'pending') -- Default to pending
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. STORAGE BUCKETS (Optional, if needed for uploads)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public view thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Admins upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND is_admin());
