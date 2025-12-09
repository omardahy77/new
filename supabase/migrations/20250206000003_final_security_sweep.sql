-- Final Security Sweep
-- This migration fixes the "Function Search Path Mutable" security warnings
-- by explicitly setting the search_path for all critical functions.

-- 1. Secure the Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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

-- 2. Secure the User Creation Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 3. Secure the Delete User Function (RPC)
-- We recreate it to ensure it has the correct search_path
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- 1. Check if the executor is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- 2. Delete from public profiles (Cascade should handle the rest, but we be explicit)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- 3. Delete from auth.users (Requires supabase_admin privileges, simulated here via Security Definer)
  -- Note: In a real Supabase environment, we might not be able to delete from auth.users directly via SQL
  -- without the service_role. However, for the purpose of this app's logic, 
  -- removing the profile is the key step. 
  -- If we really need to delete auth user, we usually use the Supabase Admin API in the backend/Edge Function.
  -- For now, we ensure the profile is gone, which effectively bans the user from the app.
END;
$$;

-- 4. Ensure RLS is active and clean on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
