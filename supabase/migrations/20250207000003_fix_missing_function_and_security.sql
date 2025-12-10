/*
  # Fix Missing Function & Security Warnings
  
  ## Description
  This migration recreates the missing `ensure_user_profile_exists` function and secures all critical functions
  by explicitly setting their `search_path`. This resolves the "Function Search Path Mutable" warnings
  and the "function does not exist" error.

  ## Changes
  1. Re-define `ensure_user_profile_exists` with `SECURITY DEFINER` and `SET search_path = public`.
  2. Re-define `is_admin` with `SET search_path = public`.
  3. Re-define `handle_new_user` trigger function with `SET search_path = public`.
  4. Grant necessary permissions.
*/

-- 1. Fix ensure_user_profile_exists (The source of the error)
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Security Warning
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email),
    COALESCE(raw_user_meta_data->>'role', 'student'),
    'active'
  FROM auth.users
  WHERE id = user_id
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 2. Secure is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Security Warning
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 3. Secure the main trigger function (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Fixes Security Warning
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE EXCLUDED.role END,
    status = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'active' ELSE EXCLUDED.status END;
  RETURN new;
END;
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
