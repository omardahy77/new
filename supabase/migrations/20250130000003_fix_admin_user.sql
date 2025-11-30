-- 1. تحديث وظيفة إنشاء المستخدم الجديد لضمان منح رتبة المشرف للإيميل المحدد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, full_name)
  VALUES (
    new.id,
    new.email,
    -- إذا كان الإيميل هو إيميل المشرف، نجعله admin و active فوراً
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'admin' ELSE 'student' END,
    CASE WHEN new.email = 'admin@sniperfx.com' THEN 'active' ELSE 'pending' END,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'admin' ELSE EXCLUDED.role END,
    status = CASE WHEN EXCLUDED.email = 'admin@sniperfx.com' THEN 'active' ELSE EXCLUDED.status END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. تحديث أي حساب موجود بالفعل بهذا الإيميل ليكون مشرفاً
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';

-- 3. ضمان صلاحيات الوصول للمشرف (RLS)
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
CREATE POLICY "Admins can do everything" ON public.profiles
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
