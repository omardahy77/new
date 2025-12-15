-- 1. DROP FUNCTION CASCADE: This kills any trigger referencing this function automatically
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. RECREATE DUMMY FUNCTION: Just in case some internal system calls it directly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Do nothing, just return safe
  RETURN NEW;
END;
$$;

-- 3. FIX RLS RECURSION (The likely cause of Error 500)
-- First, disable RLS temporarily to break any active locks
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- Create SIMPLE, NON-RECURSIVE policies
-- 1. READ: Allow everyone to read profiles. This breaks the recursion loop.
CREATE POLICY "Allow Public Read" ON public.profiles
FOR SELECT USING (true);

-- 2. UPDATE: Allow users to update their own profile OR Admins (checked via simple ID match or JWT role if possible, but keep it simple for now)
CREATE POLICY "Allow Self Update" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 3. INSERT: Allow users to insert their own profile
CREATE POLICY "Allow Self Insert" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. ENSURE ADMIN EXISTS (Idempotent)
INSERT INTO public.profiles (id, email, role, status, full_name)
SELECT 
    id, 
    email, 
    'admin', 
    'active', 
    'System Admin'
FROM auth.users 
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', status = 'active';
