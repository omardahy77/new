/*
  # Admin Account Force Fix
  
  ## Query Description:
  1. Ensures the admin user exists in public.profiles
  2. Updates auth.users to manually confirm the email (bypassing email verification)
  3. Grants full permissions
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "High"
  */

-- 1. Ensure Profile Exists (if auth user exists)
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';
  
  IF admin_uid IS NOT NULL THEN
    -- Force Confirm Email
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"admin"'
        )
    WHERE id = admin_uid;

    -- Ensure Profile
    INSERT INTO public.profiles (id, email, role, status, full_name)
    VALUES (admin_uid, 'admin@sniperfx.com', 'admin', 'active', 'System Admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active', full_name = 'System Admin';
  END IF;
END $$;

-- 2. Security Policy: Allow Admin to do EVERYTHING
CREATE POLICY "Admins can do everything" ON public.site_settings
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update courses" ON public.courses
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update lessons" ON public.lessons
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
