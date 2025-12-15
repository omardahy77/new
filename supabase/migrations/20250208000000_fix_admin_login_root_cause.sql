-- 1. CLEANUP: Drop ALL existing policies to prevent conflicts (Error 42710)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
END $$;

-- 2. RESET RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE STABLE POLICIES (Recursion-Free)

-- READ: Open read access to break the infinite recursion loop during login
-- This allows the frontend to query "Is this user an admin?" without crashing
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- INSERT: Allow new users to register
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can edit own profile, Admins can edit all
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- DELETE: Admins only
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- 4. FIX TRIGGER (Ensure Admin Role is enforced on conflict)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'student')
    END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin'
      ELSE public.profiles.role -- Keep existing role for others
    END,
    status = 'active';
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
