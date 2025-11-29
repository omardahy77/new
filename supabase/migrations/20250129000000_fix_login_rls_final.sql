-- 1. Create a secure function to check if user is admin (Bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Create a robust function to ensure profile exists (Self-Healing)
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_meta jsonb;
BEGIN
  -- Get email from auth.users
  SELECT email, raw_user_meta_data INTO v_email, v_meta
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RETURN; -- No auth user found
  END IF;

  -- Upsert into profiles
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    v_user_id,
    v_email,
    COALESCE(v_meta->>'full_name', 'User'),
    CASE WHEN v_email = 'admin@sniperfx.com' THEN 'admin' ELSE 'student' END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE profiles.role END,
    status = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'active' ELSE profiles.status END;
END;
$$;

-- 3. Reset RLS Policies (The Nuclear Option)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read access" ON public.profiles;
DROP POLICY IF EXISTS "Update access" ON public.profiles;
DROP POLICY IF EXISTS "Delete access" ON public.profiles;
DROP POLICY IF EXISTS "Insert access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Policy 1: READ (Everyone can read their own, Admins can read all)
CREATE POLICY "Read access"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- Policy 2: UPDATE (Everyone can update their own, Admins can update all)
CREATE POLICY "Update access"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- Policy 3: DELETE (Only Admins)
CREATE POLICY "Delete access"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- Policy 4: INSERT (Everyone can insert their own - needed for signup)
CREATE POLICY "Insert access"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
