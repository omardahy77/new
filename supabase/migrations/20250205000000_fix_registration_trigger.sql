-- 1. Drop existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the function that handles new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student
    'pending' -- ALWAYS set to pending for approval
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    status = 'pending'; -- Reset to pending if they re-register

  RETURN new;
END;
$$;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Ensure RLS allows the trigger to work (Security Definer handles this, but good to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Ensure Admins can SEE these pending profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING ( 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' 
  OR 
  auth.uid() = id 
);
