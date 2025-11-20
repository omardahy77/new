/*
  # Reset Admin User & Force Admin Rights
  
  ## Query Description:
  1. Deletes the user 'admin@sniperfx.com' from auth.users to allow re-registration.
  2. Updates the handle_new_user trigger to GUARANTEE that this specific email gets 'admin' role and 'active' status immediately upon sign up.
  
  ## Metadata:
  - Schema-Category: "Dangerous"
  - Impact-Level: "High" (Deletes a specific user)
  - Requires-Backup: false
*/

-- 1. Delete the stuck user if exists (This allows you to register again)
DELETE FROM auth.users WHERE email = 'admin@sniperfx.com';

-- 2. Update the trigger function to force Admin rights for this email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    -- If email is admin@sniperfx.com, FORCE admin role, otherwise student
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'admin' 
      ELSE 'student' 
    END,
    -- If email is admin@sniperfx.com, FORCE active status, otherwise pending
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active' 
      ELSE 'pending' 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
