-- SECURITY FIX: Set search_path to public to prevent hijacking
-- This updates the function we created to be fully secure

CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions -- Explicitly set search path
AS $$
BEGIN
  -- 1. Check if the executor is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can delete users.';
  END IF;

  -- 2. Prevent deleting yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operation Failed: You cannot delete your own account.';
  END IF;

  -- 3. Delete from public tables (Cascade should handle this, but being explicit is safer)
  DELETE FROM public.enrollments WHERE user_id = target_user_id;
  DELETE FROM public.lesson_progress WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 4. Delete from auth.users (The core account)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (The function itself checks for Admin role)
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;
