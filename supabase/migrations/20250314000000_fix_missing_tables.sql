/*
  # Fix Missing Tables
  
  1. Creates 'lesson_subtitles' table (Fixes ERROR: 42P01)
  2. Creates 'lesson_progress' table (Ensures video progress saving works)
  3. Sets up RLS policies for both
*/

-- 1. Create Subtitles Table
CREATE TABLE IF NOT EXISTS public.lesson_subtitles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    lang TEXT NOT NULL, -- e.g. 'en', 'ar'
    label TEXT NOT NULL, -- e.g. 'English', 'العربية'
    vtt_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Security
ALTER TABLE public.lesson_subtitles ENABLE ROW LEVEL SECURITY;

-- Policies for Subtitles
DROP POLICY IF EXISTS "Subtitles viewable by everyone" ON public.lesson_subtitles;
CREATE POLICY "Subtitles viewable by everyone" 
ON public.lesson_subtitles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins manage subtitles" ON public.lesson_subtitles;
CREATE POLICY "Admins manage subtitles" 
ON public.lesson_subtitles FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());


-- 2. Create Progress Table (If missing)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    position NUMERIC DEFAULT 0,
    duration NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

-- Enable Security
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policies for Progress
DROP POLICY IF EXISTS "Users manage own progress" ON public.lesson_progress;
CREATE POLICY "Users manage own progress" 
ON public.lesson_progress FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view progress" ON public.lesson_progress;
CREATE POLICY "Admins view progress" 
ON public.lesson_progress FOR SELECT 
USING (public.is_admin());
