-- Force Public Read Access for Courses and Lessons
-- This ensures content is visible even if user is not logged in

-- 1. Enable RLS on tables (if not already)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can view courses" ON courses;
DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
DROP POLICY IF EXISTS "Anyone can read courses" ON courses;
DROP POLICY IF EXISTS "Anyone can read lessons" ON lessons;

-- 3. Create PERMISSIVE policies (Read Only)
CREATE POLICY "Anyone can read courses" 
ON courses FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read lessons" 
ON lessons FOR SELECT 
USING (true);

-- 4. Grant usage to anon role explicitly
GRANT SELECT ON courses TO anon;
GRANT SELECT ON lessons TO anon;
GRANT SELECT ON site_settings TO anon;
