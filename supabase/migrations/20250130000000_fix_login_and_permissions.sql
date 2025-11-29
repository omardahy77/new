/*
# Fix Login & Permissions
This migration ensures the profiles table exists, has the correct permissions, and includes a fail-safe function for login.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "High"
- Requires-Backup: false
*/

-- 1. Ensure Profiles Table Exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'student',
    status TEXT DEFAULT 'pending',
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Fix Policies (Drop existing to avoid conflicts, then recreate)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow users to insert their own profile (Critical for Sign Up)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Create/Update the Auto-Repair RPC Function
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges to bypass RLS during creation
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Get current user ID and Email from auth context
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
        -- Fetch email from auth.users (trick: we can't query auth.users directly easily, 
        -- but we can assume the client might update it later or we leave it null for now)
        
        INSERT INTO public.profiles (id, role, status, email)
        VALUES (
            current_user_id, 
            'student', 
            'pending',
            (SELECT email FROM auth.users WHERE id = current_user_id)
        );
    END IF;
END;
$$;

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists TO authenticated;
