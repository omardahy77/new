-- Fix Security Advisories: Set search_path for ALL functions
-- This prevents "Function Search Path Mutable" warnings

-- 1. Secure the Auth Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'status', 'active') -- Auto-activate for now to reduce friction
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$;

-- 2. Secure the Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 3. Secure the User Deletion Function
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only Admin can run this
  IF NOT public.is_admin_safe() THEN
    RAISE EXCEPTION 'Access Denied: Admins only';
  END IF;

  -- Delete from public tables first (Cascading usually handles this, but being explicit is safer)
  DELETE FROM public.enrollments WHERE user_id = target_user_id;
  DELETE FROM public.lesson_progress WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from Auth (Requires Service Role permission, which SECURITY DEFINER provides)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 4. Secure any other potential functions
-- (If you have 'get_admin_stats' or similar, add them here)
