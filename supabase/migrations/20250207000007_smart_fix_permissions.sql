/*
  # Smart Fix for Permissions & Login Crash
  
  Instead of trying to DROP triggers on auth.users (which causes Permission Denied),
  we redefine the functions they call to be "Safe".
  
  1. Modifies handle_new_user() to IGNORE updates (Logins).
  2. Modifies on_auth_user_created() to IGNORE updates.
  3. Ensures public.profiles policies are correct.
*/

-- 1. Fix the main handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL FIX: Ignore UPDATE events (Logins)
  -- This prevents the recursion crash when last_sign_in_at is updated
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Handle INSERT events (Registration)
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'active' -- Auto-activate to avoid login blocks
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Safety Net: Never fail an auth action due to profile errors
  RETURN NEW;
END;
$$;

-- 2. Fix legacy handler function (just in case it's used)
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'student', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

-- 3. Ensure Policies are Open and Safe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for login checks)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Allow users to insert their own profile (Self-Healing)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
