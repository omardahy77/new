-- Migration: Protect Admin Account from Deletion
-- Description: Updates the delete_user_by_admin function to explicitly forbid deleting the main admin email.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_email TEXT;
  requester_role TEXT;
BEGIN
  -- Get target email to check if it's the protected admin
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  -- 🛑 CRITICAL SECURITY CHECK 🛑
  IF target_email = 'admin@sniperfx.com' THEN
    RAISE EXCEPTION 'Security Violation: The main system administrator account cannot be deleted.';
  END IF;

  -- Proceed with deletion for other users
  -- 1. Delete from public.profiles (Application Data)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 2. Delete from auth.users (Authentication Data)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Ensure the Admin has full permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
