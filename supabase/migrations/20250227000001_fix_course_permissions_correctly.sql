/*
  # FIX: Course & Content Permissions (UUID Safe)
  
  ## Problem Solved
  - Fixed "function max(uuid) does not exist" error.
  - Grants FULL CRUD (Create, Read, Update, Delete) access to Admins.
  - Ensures public users can VIEW courses but NOT edit them.
  - Uses SECURITY DEFINER to prevent infinite recursion in policies.
*/

-- 1. Create a Secure Admin Check Function (Prevents Recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COURSES TABLE
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Clear old policies to avoid conflicts
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Everyone can view courses" ON courses;

-- Policy: Everyone can see courses
CREATE POLICY "Everyone can view courses" 
ON courses FOR SELECT 
USING (true);

-- Policy: Admins can do EVERYTHING (Insert, Update, Delete)
CREATE POLICY "Admins can insert courses" 
ON courses FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update courses" 
ON courses FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete courses" 
ON courses FOR DELETE 
USING (is_admin());

-- 3. LESSONS TABLE
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Everyone can view lessons" ON lessons;

-- Policy: Everyone can see lessons
CREATE POLICY "Everyone can view lessons" 
ON lessons FOR SELECT 
USING (true);

-- Policy: Admins can manage lessons
CREATE POLICY "Admins can manage lessons" 
ON lessons FOR ALL 
USING (is_admin());

-- 4. ENROLLMENTS TABLE
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;

CREATE POLICY "Admins can manage enrollments" 
ON enrollments FOR ALL 
USING (is_admin());

-- 5. SITE SETTINGS (CMS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON site_settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON site_settings;

-- Policy: Everyone can read settings
CREATE POLICY "Everyone can read settings" 
ON site_settings FOR SELECT 
USING (true);

-- Policy: Admins can update settings
CREATE POLICY "Admins can update settings" 
ON site_settings FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can insert settings" 
ON site_settings FOR INSERT
WITH CHECK (is_admin());
