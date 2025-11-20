-- هذا الملف يقوم بتحديث وظيفة تسجيل المستخدمين
-- بحيث يتم منح صلاحية "Admin" تلقائياً للبريد الإلكتروني المحدد

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    -- إذا كان الإيميل هو إيميل المشرف، اجعل الرتبة admin، وإلا student
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'admin' ELSE 'student' END,
    -- إذا كان الإيميل هو إيميل المشرف، اجعل الحالة active فوراً
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'active' ELSE 'pending' END
  );
  RETURN new;
END;
$$;

-- إعادة بناء التريجر لضمان عمله
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تحديث احتياطي: في حال قمت بالتسجيل بالفعل قبل تشغيل هذا الملف
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';
