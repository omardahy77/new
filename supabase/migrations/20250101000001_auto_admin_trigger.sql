-- Create a trigger to automatically handle new user creation
-- and assign 'admin' role specifically to manychat826@gmail.com

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'manychat826@gmail.com' THEN 'admin' 
      ELSE 'student' 
    END,
    CASE 
      WHEN new.email = 'manychat826@gmail.com' THEN 'active' 
      ELSE 'pending' 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger (drop if exists to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
