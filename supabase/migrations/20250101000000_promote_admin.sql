/*
  # Promote User to Admin
  
  ## Description
  Promotes the user 'manychat826@gmail.com' to admin role and sets status to active.
  This allows the user to access the dashboard immediately after registration.

  ## Metadata
  - Schema-Category: Data
  - Impact-Level: Low
  - Requires-Backup: false
*/

-- Update the profile if it exists (Triggered after registration)
UPDATE public.profiles
SET 
  role = 'admin',
  status = 'active'
WHERE email = 'manychat826@gmail.com';
