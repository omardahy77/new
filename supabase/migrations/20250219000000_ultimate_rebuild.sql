-- ULTIMATE REBUILD MIGRATION
-- This script wipes the public schema and rebuilds it for the "Super Admin" system.

-- 1. CLEANUP (Drop existing tables to start fresh)
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE TABLES

-- PROFILES (Users)
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

-- SITE SETTINGS (CMS)
CREATE TABLE public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name TEXT DEFAULT 'Sniper FX Gold',
    hero_title_line1 TEXT DEFAULT 'تداول بذكاء',
    hero_title_line2 TEXT DEFAULT 'بدقة القناص',
    hero_desc TEXT DEFAULT 'المنصة التعليمية الأقوى...',
    social_links JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    content_config JSONB DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{"students": "+1500", "hours": "+50"}'::jsonb,
    home_features JSONB DEFAULT '[]'::jsonb,
    logo_url TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registration BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    is_paid BOOLEAN DEFAULT false, -- The Key Flag
    level TEXT DEFAULT 'مبتدئ',
    rating NUMERIC DEFAULT 5.0,
    duration TEXT,
    lesson_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LESSONS
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    "order" INTEGER DEFAULT 0,
    duration TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENROLLMENTS (Access Control)
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- LESSON PROGRESS
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES

-- Profiles: Public can read basic info (for checks), Users read own, Admin reads all
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Settings: Public Read, Admin Write
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses: Public Read (Filtering happens in UI for Paid ones, but RLS allows fetching list)
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lessons: Viewable if Course is Free OR User is Enrolled OR User is Admin
CREATE POLICY "Lessons access control" ON public.lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND (
      c.is_paid = false 
      OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = c.id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    )
  )
);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enrollments: Users see own, Admins see all
CREATE POLICY "Users see own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Progress: Users manage own
CREATE POLICY "Users manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGERS (Auto-Profile Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ADMIN SETUP FUNCTION (To be called by seed script)
CREATE OR REPLACE FUNCTION public.setup_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET role = 'admin', status = 'active' WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
