/*
# Add Delete User RPC
Adds a secure function to allow admins to delete users from both auth.users and public.profiles.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by dropping function)
*/

-- Function to allow admins to delete users completely (auth + profile)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the role of the user making the request
  SELECT role INTO requesting_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if the user is an admin
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;

  -- Delete from public tables first to avoid constraint issues
  DELETE FROM public.enrollments WHERE user_id = target_user_id;
  DELETE FROM public.lesson_progress WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Finally delete from auth.users (The core account)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
