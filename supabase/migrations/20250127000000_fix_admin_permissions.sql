-- 1. Fix RLS Policies for Courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON courses;
CREATE POLICY "Public courses are viewable by everyone" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 2. Fix RLS Policies for Lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public lessons are viewable by everyone" ON lessons;
CREATE POLICY "Public lessons are viewable by everyone" ON lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 3. Fix RLS Policies for Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON site_settings;
CREATE POLICY "Settings are viewable by everyone" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site_settings" ON site_settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 4. Fix RLS Policies for Enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own enrollments" ON enrollments;
CREATE POLICY "Users view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
CREATE POLICY "Admins manage enrollments" ON enrollments FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 5. Auto-update lesson count trigger
CREATE OR REPLACE FUNCTION update_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses SET lesson_count = COALESCE(lesson_count, 0) + 1 WHERE id = NEW.course_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses SET lesson_count = GREATEST(COALESCE(lesson_count, 0) - 1, 0) WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lesson_count_trigger ON lessons;
CREATE TRIGGER update_lesson_count_trigger
AFTER INSERT OR DELETE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_lesson_count();
