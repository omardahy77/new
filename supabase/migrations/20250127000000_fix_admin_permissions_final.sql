/*
  # Fix Admin Permissions & Add Automation
  
  ## Query Description:
  This migration resets RLS policies to ensure Admins have FULL access (Insert, Update, Delete) 
  to courses, lessons, enrollments, and site settings. It also adds a trigger to auto-count lessons.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - RLS Status: Enabled on all tables
  - Policy Changes: Replaces restrictive policies with "Admin Full Access" policies.
*/

-- 1. COURSES: Allow Admins to do EVERYTHING
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

CREATE POLICY "Courses are viewable by everyone" ON courses FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 2. LESSONS: Allow Admins to do EVERYTHING
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

CREATE POLICY "Lessons are viewable by everyone" ON lessons FOR SELECT USING (true);

CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 3. SITE SETTINGS: Allow Admins to do EVERYTHING
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

CREATE POLICY "Everyone can read site settings" ON site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON site_settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 4. ENROLLMENTS: Allow Admins to do EVERYTHING
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;

CREATE POLICY "Users can view their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 5. AUTOMATION: Trigger to update lesson_count automatically
CREATE OR REPLACE FUNCTION update_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses SET lesson_count = lesson_count + 1 WHERE id = NEW.course_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses SET lesson_count = GREATEST(0, lesson_count - 1) WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lesson_count_trigger ON lessons;
CREATE TRIGGER update_lesson_count_trigger
AFTER INSERT OR DELETE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_lesson_count();
