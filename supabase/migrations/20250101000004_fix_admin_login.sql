/*
# Fix Admin Login & Reset Account
This migration deletes the specific admin user to allow re-registration with a known password.
It also reinforces the auto-admin trigger.

## Query Description:
1. Deletes 'manychat826@gmail.com' from auth.users to allow fresh signup.
2. Updates the handle_new_user function to guarantee this specific email gets 'admin' role and 'active' status immediately.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Medium"
*/

-- 1. Delete the user from auth.users (Cascades to profiles)
-- This allows the user to Sign Up again with the correct password
DELETE FROM auth.users WHERE email = 'manychat826@gmail.com';

-- 2. Ensure the Trigger Function handles this specific email correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (
    new.id, 
    new.email, 
    -- Force Admin role for this specific email
    CASE WHEN new.email = 'manychat826@gmail.com' THEN 'admin' ELSE 'student' END,
    -- Force Active status for this specific email
    CASE WHEN new.email = 'manychat826@gmail.com' THEN 'active' ELSE 'pending' END
  );
  RETURN new;
END;
$$;

-- 3. Re-apply trigger (Safety check)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
