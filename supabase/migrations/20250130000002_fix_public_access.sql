-- Enable Read Access for All Users (Public) on Courses
-- This ensures free courses are visible without login
DROP POLICY IF EXISTS "Public read access for courses" ON "public"."courses";
CREATE POLICY "Public read access for courses"
ON "public"."courses"
FOR SELECT
TO public
USING (true);

-- Enable Read Access for All Users on Site Settings
-- This ensures the site title, logo, and texts load for visitors
DROP POLICY IF EXISTS "Public read access for site_settings" ON "public"."site_settings";
CREATE POLICY "Public read access for site_settings"
ON "public"."site_settings"
FOR SELECT
TO public
USING (true);

-- Enable Read Access for All Users on Lessons (Only basic info, video_url is protected via frontend logic if needed, but typically we filter by course access)
-- Ideally, we might want to restrict this, but for the course listing/details page to load basic info (title, duration), we allow read.
-- The actual video protection is handled by the application logic (checking enrollments).
DROP POLICY IF EXISTS "Public read access for lessons" ON "public"."lessons";
CREATE POLICY "Public read access for lessons"
ON "public"."lessons"
FOR SELECT
TO public
USING (true);

-- Ensure Profiles are readable by the user who owns them (and admins)
DROP POLICY IF EXISTS "Users can read own profile" ON "public"."profiles";
CREATE POLICY "Users can read own profile"
ON "public"."profiles"
FOR SELECT
TO public
USING (auth.uid() = id);

-- Allow Admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON "public"."profiles";
CREATE POLICY "Admins can read all profiles"
ON "public"."profiles"
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
