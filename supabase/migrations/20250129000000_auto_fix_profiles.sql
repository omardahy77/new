-- Universal Auto-Repair Function
-- This function ensures that ANY logged-in user has a valid profile in the database.
-- It is the ultimate fallback to prevent "Account not found" errors.

CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges to bypass RLS during creation
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_raw_meta jsonb;
BEGIN
  -- 1. Get the current authenticated user ID
  v_user_id := auth.uid();
  
  -- If no user is logged in (shouldn't happen if called correctly), exit
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Check if profile already exists. If yes, we are good.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RETURN;
  END IF;

  -- 3. Profile missing! Fetch email and metadata from the Auth system
  SELECT email, raw_user_meta_data INTO v_email, v_raw_meta
  FROM auth.users
  WHERE id = v_user_id;

  -- 4. Insert the missing profile safely
  INSERT INTO public.profiles (id, email, full_name, phone_number, role, status)
  VALUES (
    v_user_id,
    v_email,
    COALESCE(v_raw_meta->>'full_name', 'User'),
    COALESCE(v_raw_meta->>'phone_number', ''),
    -- Smart Role Assignment:
    CASE 
        WHEN v_email = 'admin@sniperfx.com' THEN 'admin' 
        ELSE 'student' 
    END,
    -- Smart Status Assignment:
    CASE 
        WHEN v_email = 'admin@sniperfx.com' THEN 'active' 
        ELSE 'pending' 
    END
  );
END;
$$;

-- Grant permission to all authenticated users to trigger this self-repair
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists TO authenticated;
