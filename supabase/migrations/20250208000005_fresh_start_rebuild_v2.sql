-- REBUILD V2: Force Clean & Re-Architect
-- This migration fixes the "cannot drop function" error by using CASCADE

-- ==========================================
-- 1. AGGRESSIVE CLEANUP (The Fix)
-- ==========================================

-- Drop functions with CASCADE to remove dependent policies automatically
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_by_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_emails() CASCADE;

-- Drop tables with CASCADE to remove dependent foreign keys
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop triggers from auth.users (Dynamic Cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', r.trigger_name);
    END LOOP;
END $$;

-- ==========================================
-- 2. SCHEMA RECONSTRUCTION
-- ==========================================

-- 2.1 PROFILES (Users)
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

-- 2.2 SITE SETTINGS (CMS)
CREATE TABLE public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_name TEXT DEFAULT 'Sniper FX Gold',
    hero_title TEXT DEFAULT 'تداول بذكاء',
    hero_desc TEXT,
    logo_url TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    social_links JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{"students": "+1500", "hours": "+50"}',
    features_config JSONB DEFAULT '{}',
    content_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 COURSES
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 LESSONS
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT DEFAULT '10:00',
    "order" INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 ENROLLMENTS
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 2.6 LESSON PROGRESS
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ==========================================
-- 3. SECURITY & PERMISSIONS (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 3.1 Helper Function (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direct check on profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3.2 PROFILES POLICIES
-- Everyone can read profiles (needed for login checks)
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
-- Only user can update their own profile
CREATE POLICY "User Update Self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin can do everything
CREATE POLICY "Admin Manage Profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 3.3 SETTINGS POLICIES
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin Manage Settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- 3.4 COURSES & LESSONS POLICIES
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admin Manage Courses" ON public.courses FOR ALL USING (public.is_admin());

CREATE POLICY "Public Read Lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admin Manage Lessons" ON public.lessons FOR ALL USING (public.is_admin());

-- 3.5 ENROLLMENTS POLICIES
CREATE POLICY "User View Own Enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin Manage Enrollments" ON public.enrollments FOR ALL USING (public.is_admin());

-- 3.6 PROGRESS POLICIES
CREATE POLICY "User Manage Own Progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 4. AUTOMATION & TRIGGERS
-- ==========================================

-- 4.1 Safe User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if email is the master admin
  is_admin_email := NEW.email = 'admin@sniperfx.com';

  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN is_admin_email THEN 'admin' ELSE 'student' END,
    CASE WHEN is_admin_email THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN is_admin_email THEN 'admin' ELSE EXCLUDED.role END,
    status = CASE WHEN is_admin_email THEN 'active' ELSE EXCLUDED.status END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW; -- Swallow errors to prevent auth crash
END;
$$;

-- Bind Trigger (INSERT ONLY to prevent login crashes)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Admin Delete Helper
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  
  -- Delete from profiles (Cascades to other tables)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (Requires Service Role permission, usually done via API, but this helps cleanup)
  -- Note: SQL cannot delete from auth.users easily without superuser, 
  -- but deleting profile removes app access.
END;
$$;

-- ==========================================
-- 5. SEED DATA
-- ==========================================

-- 5.1 Default Settings
INSERT INTO public.site_settings (site_name, hero_title, hero_desc)
VALUES (
  'Sniper FX Gold', 
  'تداول بذكاء بدقة القناص', 
  'اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.'
);

-- 5.2 Sample Course
INSERT INTO public.courses (title, description, is_paid, level, lesson_count, thumbnail)
VALUES (
  'دورة احتراف تداول الذهب (Forex Gold Mastery)',
  'كورس شامل يأخذك من الصفر وحتى احتراف تداول الذهب XAUUSD.',
  true,
  'خبير',
  5,
  'https://i.ytimg.com/vi/p7HKvqRI_Bo/maxresdefault.jpg'
);

-- 5.3 Ensure Admin Profile Exists (if user already in auth)
INSERT INTO public.profiles (id, email, role, status)
SELECT id, email, 'admin', 'active'
FROM auth.users
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
