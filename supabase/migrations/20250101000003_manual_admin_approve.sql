/*
  # Approve Admin Account Manually
  
  ## Query Description:
  This query manually updates the profile of 'manychat826@gmail.com' to give them Admin privileges and Active status.
  This is useful if the account was created before the auto-trigger was set up.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: profiles
  - Columns: role, status
*/

UPDATE profiles
SET role = 'admin', status = 'active'
WHERE email = 'manychat826@gmail.com';
