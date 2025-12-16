-- MASTER FIX FOR LOGIN HANGING (DEADLOCKS)
-- This script removes all complex triggers that run during login to prevent database locks.

-- 1. Disable Triggers temporarily to unblock any stuck processes
ALTER TABLE auth.users DISABLE TRIGGER ALL;
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- 2. DROP THE PROBLEMATIC LOGIN TRIGGER (The Root Cause)
-- This trigger tries to update the user row while it's being read, causing a lock.
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_login();

-- 3. Ensure the Profile Creation Trigger is SAFE
-- We keep this one because it's needed for new users, but we make it "SECURITY DEFINER" to bypass RLS
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE public.profiles.role END,
    status = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'active' ELSE public.profiles.status END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the safe creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FIX RLS POLICIES (Prevent Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially recursive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create simple, non-blocking policies
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update everyone." 
ON public.profiles FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Re-enable Triggers (Only the safe ones)
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
ALTER TABLE public.profiles ENABLE TRIGGER ALL;

-- 6. Ensure Admin Exists & is Active
UPDATE public.profiles 
SET role = 'admin', status = 'active' 
WHERE email = 'admin@sniperfx.com';
