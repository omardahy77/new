/*
# Protect Admin Account & Enable Auto-Recovery
1. Updates delete function to BLOCK deleting admin@sniperfx.com
2. Updates profile trigger to AUTO-PROMOTE admin@sniperfx.com upon registration
*/

-- 1. Protect Admin from Deletion (Secure Function Update)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  target_email TEXT;
BEGIN
  -- Get target email
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  
  -- CRITICAL SAFETY CHECK
  IF target_email = 'admin@sniperfx.com' THEN
    RAISE EXCEPTION 'CRITICAL ERROR: You cannot delete the main Administrator account.';
  END IF;

  -- Proceed with delete
  DELETE FROM auth.users WHERE id = target_user_id;
  -- Profile is deleted via cascade, but we ensure it here too
  DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Admin is always Admin on Insert (Auto-Recovery)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    -- Force Admin Role for specific email
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'admin' 
      ELSE 'student' 
    END,
    -- Force Active Status for Admin
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active' 
      ELSE 'pending' 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
