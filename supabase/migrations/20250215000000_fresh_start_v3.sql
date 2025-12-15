/*
  # FRESH START V3: PROFESSIONAL LMS SYSTEM
  
  WARNING: THIS SCRIPT WIPES ALL DATA.
  It builds a robust schema for:
  1. Dynamic CMS (Site Settings)
  2. Secure Course Access (Free vs Paid)
  3. Manual Enrollment System
*/

-- 1. NUCLEAR RESET (Drop everything safely)
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE TABLES

-- PROFILES: Users & Admins
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE SETTINGS: The CMS Brain
CREATE TABLE public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Branding
    site_name TEXT DEFAULT 'Sniper FX Gold',
    logo_url TEXT,
    
    -- Home Page Content
    hero_title_line1 TEXT DEFAULT 'تداول بذكاء',
    hero_title_line2 TEXT DEFAULT 'بدقة القناص',
    hero_desc TEXT DEFAULT 'المنصة التعليمية الأقوى لاحتراف تداول الذهب والفوركس.',
    
    -- About Page Content
    about_title TEXT DEFAULT 'من نحن',
    about_desc TEXT DEFAULT 'نحن أكاديمية متخصصة...',
    
    -- Contact & Footer
    contact_email TEXT,
    footer_text TEXT DEFAULT 'جميع الحقوق محفوظة',
    
    -- Social Links (JSON for flexibility)
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Feature Flags
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
    is_paid BOOLEAN DEFAULT false, -- The Gatekeeper
    level TEXT DEFAULT 'متوسط',
    rating NUMERIC DEFAULT 5.0,
    duration TEXT,
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
    duration TEXT DEFAULT '10:00',
    "order" INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENROLLMENTS: Who can see Paid courses?
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id) -- Prevent duplicate enrollment
);

-- PROGRESS tracking
CREATE TABLE public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 3. ENABLE RLS (Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (The Rules)

-- Profiles: Read own, Admin reads all
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings: Public Read, Admin Write
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin updates settings" ON public.site_settings FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Courses: Public Read (Filtering happens in UI/Logic for paid content visibility)
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admin manages courses" ON public.courses FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Lessons: Protected Logic
-- 1. Admin sees all.
-- 2. Student sees if Course is FREE.
-- 3. Student sees if Course is PAID AND they are ENROLLED.
CREATE POLICY "Lesson Access Policy" ON public.lessons FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') OR
  exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
    and (
      c.is_paid = false 
      OR 
      exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.course_id = c.id)
    )
  )
);
CREATE POLICY "Admin manages lessons" ON public.lessons FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Enrollments: Admin manages, User views own
CREATE POLICY "Admin manages enrollments" ON public.enrollments FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Users see own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

-- Progress: User manages own
CREATE POLICY "User manages progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- 5. TRIGGERS (Auto-Admin & Profile Creation)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'admin' ELSE 'student' END,
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'active' ELSE 'pending' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
