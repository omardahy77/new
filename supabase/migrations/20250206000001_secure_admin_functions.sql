-- Description: Fixes "Function Search Path Mutable" security advisory for remaining admin functions
-- Impact: High (Security)

-- 1. Secure the Delete User Function (Used in Admin Dashboard)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp -- CRITICAL SECURITY FIX
AS $$
BEGIN
  -- Check if the executor is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Delete from auth.users (cascades to profiles due to FK)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 2. Secure the Profile Auto-Repair Function (Used in Scripts)
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp -- CRITICAL SECURITY FIX
AS $$
DECLARE
  curr_user_id uuid;
  curr_user_email text;
  curr_user_meta jsonb;
BEGIN
  curr_user_id := auth.uid();
  
  IF curr_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get email from auth.users
  SELECT email, raw_user_meta_data INTO curr_user_email, curr_user_meta
  FROM auth.users
  WHERE id = curr_user_id;

  -- Insert profile if missing
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    curr_user_id,
    curr_user_email,
    COALESCE(curr_user_meta->>'full_name', split_part(curr_user_email, '@', 1)),
    'student',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;
