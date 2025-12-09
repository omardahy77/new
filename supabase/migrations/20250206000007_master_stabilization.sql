-- MASTER STABILIZATION MIGRATION
-- This script fixes the "Infinite Recursion" bug once and for all by adding a direct bypass for the Master Admin.

-- 1. Temporarily Disable RLS to ensure we can fix the data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ensure Master Admin Profile Exists (Self-Healing)
-- We select the user from auth.users and insert/update into profiles
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'System Admin'), 
    'admin', 
    'active'
FROM auth.users
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'admin',
    status = 'active';

-- 3. Re-Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (Clean Slate)
-- We remove old complex policies that might be causing loops
DROP POLICY IF EXISTS "Master Admin Bypass" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 5. CREATE "GOD MODE" POLICY FOR MASTER ADMIN
-- This policy uses the JWT email claim directly, avoiding ANY table lookups.
-- This guarantees ZERO recursion for the master admin.
CREATE POLICY "Master Admin Bypass"
ON public.profiles
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'admin@sniperfx.com'
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@sniperfx.com'
);

-- 6. CREATE STANDARD POLICIES
-- Public Read Access
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- User Self-Management
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 7. GENERAL ADMIN POLICY (For other admins, if any)
-- We use the SECURITY DEFINER function we fixed earlier
CREATE POLICY "Admins can do everything"
ON public.profiles FOR ALL
USING (public.is_admin());
