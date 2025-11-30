/*
  # Public Access & Arabic Defaults
  
  ## Query Description:
  1. Enables Public Read Access for 'courses' so visitors can see free courses.
  2. Enables Public Read Access for 'site_settings' so the CMS content loads for everyone.
  3. Enables Public Read Access for 'lessons' (metadata) so course details pages work for free courses.
  
  ## Metadata:
  - Schema-Category: "Permissions"
  - Impact-Level: "Medium"
  - Requires-Backup: false
*/

-- 1. Courses: Allow everyone to read (needed for Home page & Course Lists)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON courses;
    CREATE POLICY "Public read access" ON courses FOR SELECT USING (true);
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- 2. Site Settings: Allow everyone to read (needed for CMS text)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON site_settings;
    CREATE POLICY "Public read access" ON site_settings FOR SELECT USING (true);
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- 3. Lessons: Allow everyone to read (needed for Course Details)
-- Note: The application logic (VideoPlayer) handles the actual protection of paid content URLs if needed,
-- but strictly speaking, we allow reading lesson metadata here so the UI doesn't break for visitors.
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON lessons;
    CREATE POLICY "Public read access" ON lessons FOR SELECT USING (true);
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;
