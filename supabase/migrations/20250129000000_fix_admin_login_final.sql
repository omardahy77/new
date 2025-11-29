/*
  # Fix Admin Login & Permissions
  
  ## Query Description:
  1. Creates a trigger to FORCE the 'admin' role for 'admin@sniperfx.com' on any insert/update.
     This ensures that even if the frontend sends 'student', the DB corrects it.
  2. Manually updates the existing admin profile to ensure it's correct right now.
  
  ## Metadata:
  - Schema-Category: "Safety"
  - Impact-Level: "High"
  - Requires-Backup: false
*/

-- 1. Create function to force admin role
CREATE OR REPLACE FUNCTION public.force_admin_role_logic()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@sniperfx.com' THEN
    NEW.role := 'admin';
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS force_admin_role_trigger ON public.profiles;
CREATE TRIGGER force_admin_role_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.force_admin_role_logic();

-- 3. Apply immediately to existing record
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';
