-- Enforce Pending Status for New Users
-- This ensures that no one can register as 'active' automatically

-- 1. Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_status text := 'pending';
  default_role text := 'student';
BEGIN
  -- Allow the specific master admin to be active immediately
  IF new.email = 'admin@sniperfx.com' THEN
    default_status := 'active';
    default_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, status, phone_number)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', default_role),
    default_status, -- FORCE PENDING
    new.raw_user_meta_data->>'phone_number'
  );
  
  RETURN new;
END;
$$;

-- 2. Ensure existing profiles table has correct default
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Reset any 'student' users created in the last 24 hours to pending (Optional cleanup)
-- UPDATE public.profiles SET status = 'pending' WHERE role = 'student' AND created_at > (now() - interval '1 day') AND status = 'active';
