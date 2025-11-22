-- # Reset Admin Account (Zombie State Fix)
-- Description: This migration deletes the admin user completely to allow a fresh recreation.

-- 1. Delete from public.profiles (if exists)
DELETE FROM public.profiles WHERE email = 'admin@sniperfx.com';

-- 2. Delete from auth.users (The crucial step to fix "Account not found" error)
DELETE FROM auth.users WHERE email = 'admin@sniperfx.com';

-- 3. Ensure RLS allows the admin to be recreated
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a permissive insert policy
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Ensure Admin trigger exists and is robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'admin' ELSE 'student' END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE EXCLUDED.role END,
      status = 'active';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
