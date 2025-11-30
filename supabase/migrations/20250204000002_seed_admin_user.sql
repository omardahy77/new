-- File: supabase/migrations/20250204000002_seed_admin_user.sql

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create or Update Admin User
DO $$
DECLARE
  target_email text := 'admin@sniperfx.com';
  target_password text := 'admin123';
  user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;
  
  -- If not, create the user in auth.users
  IF user_id IS NULL THEN
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      target_email,
      crypt(target_password, gen_salt('bf')), -- Hash the password
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );
  ELSE
    -- Optional: If user exists, reset password to ensure access (Uncomment if needed)
    -- UPDATE auth.users 
    -- SET encrypted_password = crypt(target_password, gen_salt('bf')) 
    -- WHERE id = user_id;
  END IF;

  -- 3. Ensure the user has a profile and is set to ADMIN
  INSERT INTO public.profiles (id, email, role, full_name, status)
  VALUES (user_id, target_email, 'admin', 'System Admin', 'active')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', status = 'active';
  
END $$;
