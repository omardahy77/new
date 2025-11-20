/*
# Auto-confirm Emails Fix
Enables auto-confirmation for user emails to bypass the "Email not confirmed" error.
This ensures that both the Admin and new Students can login immediately.

## Query Description:
1. Updates all existing users to have 'email_confirmed_at' set to NOW().
2. Creates a trigger on auth.users to automatically set 'email_confirmed_at' for new users.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "High" (Fixes Login)
- Requires-Backup: false
- Reversible: true
*/

-- 1. Update ALL existing users to be confirmed immediately
UPDATE auth.users
SET email_confirmed_at = now(),
    confirmed_at = now(),
    updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Create Function to auto-confirm future users
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger to run before any new user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

CREATE TRIGGER on_auth_user_created_confirm
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();
