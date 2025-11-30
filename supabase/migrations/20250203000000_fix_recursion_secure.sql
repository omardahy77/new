/*
  # Fix Infinite Recursion & Secure Admin Functions
  
  ## Changes
  1. Updates `is_admin()` to use SECURITY DEFINER.
     - This breaks the infinite loop by allowing the function to read `profiles` without triggering RLS policies.
  2. Updates `delete_user_by_admin` to be secure and functional.
  3. Uses CREATE OR REPLACE to avoid "cannot drop function" errors.

  ## Security
  - Sets secure search_path for all functions.
  - Grants execute permissions explicitly.
*/

-- 1. Fix is_admin to bypass RLS loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- CRITICAL: Runs as owner to bypass RLS on profiles
SET search_path = public, auth, pg_temp -- Secure search path
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

-- 2. Ensure the delete function exists and is secure
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Check if executing user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;

  -- Delete from auth.users (this will cascade to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO service_role;
