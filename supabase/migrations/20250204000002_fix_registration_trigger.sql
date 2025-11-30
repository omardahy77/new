-- 1. Ensure the phone_number column exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- 2. Create a robust function to handle new user registration automatically
-- This runs with "Security Definer" privileges (Superuser) to bypass any RLS restrictions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, role, status, created_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student
    'pending', -- ALWAYS set to pending initially
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
  RETURN new;
END;
$$;

-- 3. Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Ensure Admins have permission to VIEW and UPDATE these profiles
-- We use the is_admin() function we created earlier for maximum security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING ( is_admin() OR auth.uid() = id );

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING ( is_admin() OR auth.uid() = id );
