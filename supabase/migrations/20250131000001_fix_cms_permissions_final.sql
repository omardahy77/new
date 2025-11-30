/*
  # Fix CMS Permissions & Site Settings
  
  ## Query Description:
  1. Creates a secure `is_admin()` function that checks the user's email directly.
  2. Resets RLS policies for `site_settings`, `courses`, and `lessons` to ensure the admin can ALWAYS edit them.
  3. Ensures the `site_settings` table allows the admin to INSERT if the row is missing.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create a secure Admin Check Function (Hardcoded for safety)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Checks if the user's email is the master admin email
  RETURN (auth.jwt() ->> 'email') = 'admin@sniperfx.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix Site Settings Permissions
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Read" ON site_settings;
DROP POLICY IF EXISTS "Allow Admin Update" ON site_settings;
DROP POLICY IF EXISTS "Allow Admin Insert" ON site_settings;
DROP POLICY IF EXISTS "Allow Admin All" ON site_settings;

CREATE POLICY "Allow Public Read" ON site_settings 
  FOR SELECT USING (true);

CREATE POLICY "Allow Admin All" ON site_settings 
  FOR ALL USING (is_admin());

-- 3. Fix Courses Permissions
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Read" ON courses;
DROP POLICY IF EXISTS "Allow Admin All" ON courses;

CREATE POLICY "Allow Public Read" ON courses 
  FOR SELECT USING (true);

CREATE POLICY "Allow Admin All" ON courses 
  FOR ALL USING (is_admin());

-- 4. Fix Lessons Permissions
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Read" ON lessons;
DROP POLICY IF EXISTS "Allow Admin All" ON lessons;

CREATE POLICY "Allow Public Read" ON lessons 
  FOR SELECT USING (true);

CREATE POLICY "Allow Admin All" ON lessons 
  FOR ALL USING (is_admin());

-- 5. Ensure Profiles are updateable by Admin (for approving users)
CREATE POLICY "Allow Admin Update Profiles" ON profiles
  FOR UPDATE USING (is_admin());
