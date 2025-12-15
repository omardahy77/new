-- 1. Redefine is_admin with SECURITY DEFINER to break the loop
-- We use CREATE OR REPLACE to preserve dependencies (avoiding the "cannot drop" error)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- <--- CRITICAL: Bypasses RLS within this function
SET search_path = public -- <--- Fixes "Function Search Path Mutable" warning
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Ensure the profiles table allows public reads (prevents read-recursion)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT
USING (true);

-- 3. Ensure Admin policy uses the safe function
DROP POLICY IF EXISTS "Admins can do everything." ON profiles;
CREATE POLICY "Admins can do everything."
ON profiles FOR ALL
USING (is_admin());
