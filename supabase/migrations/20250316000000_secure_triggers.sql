/*
  # Final Security Lockdown
  # Fixes "Function Search Path Mutable" for trigger functions and RPCs
*/

-- 1. Secure the Profile Creation Trigger (handle_new_user)
-- This is the most common cause of the security warning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.email = 'admin@sniperfx.com' THEN 'active'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Secure the Admin Delete Function
-- Ensuring this powerful function is sandboxed
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if the executor is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only admins can delete users.';
  END IF;

  -- Delete from public.profiles (Cascade will handle related data)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Attempt to delete from auth.users (Requires Service Role or Supabase Admin API usually, 
  -- but this RPC is useful for the public schema cleanup part)
  -- Note: Deleting from auth.users via SQL is restricted in some Supabase environments.
  -- The frontend usually handles the auth.users deletion via the client library if allowed,
  -- or this function cleans up the app data.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Secure the Admin Check Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
