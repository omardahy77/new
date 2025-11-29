/*
  # Ensure Admin Profile Exists
  This migration safely checks if the admin user exists in auth.users and ensures
  a corresponding profile exists in public.profiles with the correct role.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Get Admin ID from auth.users (if exists)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@sniperfx.com';

  -- 2. If admin user exists in Auth but maybe not in Profiles, fix it.
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (v_user_id, 'admin@sniperfx.com', 'Admin', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      status = 'active';
  END IF;
END $$;
