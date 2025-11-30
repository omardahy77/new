/*
  # Ensure Admin User Exists & Fix Permissions
  
  ## Query Description:
  1. Enables pgcrypto extension for password hashing.
  2. Checks if 'admin@sniperfx.com' exists in auth.users.
  3. If not, INSERTS the user with the password 'Hamza0100@'.
  4. Ensures the user has a profile in public.profiles with role='admin'.
  5. Grants necessary permissions to the admin role.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "High" (Creates Master Admin)
  - Requires-Backup: false
*/

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert or Update Admin User
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  admin_email text := 'admin@sniperfx.com';
  admin_password text := 'Hamza0100@';
  encrypted_pw text;
BEGIN
  -- Generate encrypted password
  encrypted_pw := crypt(admin_password, gen_salt('bf'));

  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    -- INSERT NEW ADMIN USER
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'System Admin', 'role', 'admin'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- INSERT PROFILE
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (new_user_id, admin_email, 'System Admin', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';

  ELSE
    -- UPDATE EXISTING USER (Ensure Profile is Admin)
    UPDATE public.profiles 
    SET role = 'admin', status = 'active' 
    WHERE email = admin_email;
    
    -- Optional: We don't reset password here to avoid locking out if user changed it, 
    -- but we ensure they are admin.
  END IF;
END $$;

-- 3. Ensure RLS Policies allow Admin to do EVERYTHING
-- Site Settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Profiles (Manage Users)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
