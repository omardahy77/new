-- Force update the admin user role to 'admin'
-- This ensures that if the user exists, they definitely have the correct permissions
DO $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin', status = 'active'
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'admin@sniperfx.com'
    );
END $$;
