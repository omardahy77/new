/*
  # FIX: Absolute Fix for Login Recursion & Admin Permissions
  
  ## Diagnosis
  Previous migrations created conflicting triggers on `auth.users` and recursive RLS policies on `public.profiles`.
  This caused infinite loops during login (Error 500) or permission denied errors.

  ## Solution
  1. Drop ALL existing triggers on `auth.users` related to profile creation to clear the conflict.
  2. Create a `SECURITY DEFINER` function for checking admin status (bypasses RLS to prevent recursion).
  3. Re-implement the `handle_new_user` trigger robustly.
  4. Reset RLS policies for Profiles, Courses, and Enrollments to be simple and non-recursive.
  5. Force-update the admin account to ensure it has 'admin' role and 'active' status.
*/

-- 1. DISABLE RLS TEMPORARILY (To allow cleanup without permission errors)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. CLEANUP: Drop potentially dangerous triggers/functions from previous migrations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users; -- Common source of crashes
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();

-- 3. FUNCTION: Secure Admin Check (Prevents Recursion)
-- This function runs with "postgres" permissions (SECURITY DEFINER) so it doesn't trigger RLS loops
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. FUNCTION: Robust User Handler (For Sign Up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active' 
      ELSE 'pending' 
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- Force admin role for the specific email
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE public.profiles.role END,
    status = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'active' ELSE public.profiles.status END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. TRIGGER: Re-attach to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS: Profiles (Re-enable with clean policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles View Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Update Policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Insert Policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- Allow users to view their own profile OR Admins to view all
CREATE POLICY "Profiles View Policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    public.is_admin_secure()
  );

-- Allow users to update their own profile OR Admins to update all
CREATE POLICY "Profiles Update Policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR 
    public.is_admin_secure()
  );

-- Allow Admins to Delete/Insert (for dashboard management)
CREATE POLICY "Profiles Admin All" ON public.profiles
  FOR ALL USING (public.is_admin_secure());

-- 7. DATA FIX: Ensure Admin is Admin (Critical Step)
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';

-- 8. FIX: Courses & Enrollments RLS (Safety Net)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
DROP POLICY IF EXISTS "Admin Manage Courses" ON public.courses;

CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admin Manage Courses" ON public.courses FOR ALL USING (public.is_admin_secure());

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Read Enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admin Manage Enrollments" ON public.enrollments;

CREATE POLICY "User Read Enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin Manage Enrollments" ON public.enrollments FOR ALL USING (public.is_admin_secure());
