/*
  # Ultimate Login Fix: Server-Side Auto-Profile Trigger
  
  ## Description
  This migration moves the "Auto-Repair" logic from the fragile frontend to the robust database backend.
  It creates a Trigger that fires automatically whenever a user is created in `auth.users`.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High" (Fixes critical login flow)
  - Requires-Backup: false
  - Reversible: true
  
  ## Changes:
  1. Creates `handle_new_user` function (Security Definer).
  2. Attaches it to `auth.users` via Trigger.
  3. Ensures Admin privileges are enforced strictly on the server side.
*/

-- 1. Clean up any old/conflicting triggers to ensure a fresh start
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the robust handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert the profile immediately upon user creation
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    -- Use metadata name if available, otherwise fallback to email username
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- Enforce Admin Role for specific email, otherwise Student
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'admin' 
      ELSE 'student' 
    END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- Ensure Admin always keeps their role
    role = CASE 
      WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' 
      ELSE public.profiles.role 
    END,
    status = 'active',
    updated_at = now();

  RETURN new;
END;
$$;

-- 3. Attach the trigger to the Auth system
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Safety: Ensure the Admin profile exists RIGHT NOW for existing users
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 
  'admin', 
  'active'
FROM auth.users 
WHERE email = 'admin@sniperfx.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', status = 'active';
