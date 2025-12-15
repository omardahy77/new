/*
  # Fix Admin Email Confirmation
  
  This script manually confirms the admin email address to bypass the verification link requirement.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "High" (Unblocks Admin Login)
  - Requires-Backup: false
*/

-- Force confirm the specific admin email
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now()),
  last_sign_in_at = now(),
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{provider}',
    '"email"'
  ),
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email_verified}',
    'true'
  )
WHERE email = 'admin@sniperfx.com';

-- Ensure the profile exists and is active
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
  id, 
  email, 
  'System Admin', 
  'admin', 
  'active'
FROM auth.users 
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  status = 'active';
