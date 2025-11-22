-- Create a secure function to allow Admins to delete users from auth.users
-- This ensures the user cannot log in again.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Security Check: Ensure the person calling this is an Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete users.';
  END IF;

  -- 2. Delete from public.profiles (Application Data)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 3. Delete from auth.users (Authentication Data - Prevents Login)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (The function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;
