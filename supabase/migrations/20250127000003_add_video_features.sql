/*
  # Add Video Player Features
  
  1. New Tables:
    - `lesson_progress`: Tracks user progress per lesson.
    - `lesson_subtitles`: Stores subtitle tracks for lessons.
  
  2. Updates to `lessons`:
    - Add `is_published` (boolean)
    - Add `thumbnail_url` (text)
    
  3. Security:
    - Enable RLS on new tables.
    - Add policies for reading/writing progress.
*/

-- Add new columns to lessons if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'is_published') THEN
        ALTER TABLE lessons ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE lessons ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Create Subtitles Table
CREATE TABLE IF NOT EXISTS lesson_subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  lang TEXT NOT NULL, -- e.g., 'en', 'ar'
  label TEXT NOT NULL, -- e.g., 'English', 'العربية'
  vtt_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Progress Table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  position NUMERIC DEFAULT 0, -- Current timestamp in seconds
  duration NUMERIC DEFAULT 0, -- Total duration in seconds
  is_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE lesson_subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policies for Subtitles
CREATE POLICY "Everyone can view subtitles" ON lesson_subtitles FOR SELECT USING (true);
CREATE POLICY "Admins can manage subtitles" ON lesson_subtitles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for Progress
CREATE POLICY "Users can view own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress update" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at on progress
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_progress_modtime
    BEFORE UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
