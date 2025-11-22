-- 1. تحديث وظيفة الحذف لمنع حذف المشرف الرئيسي نهائياً
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_email TEXT;
  requesting_user_role TEXT;
BEGIN
  -- التحقق من أن الطالب هو مشرف
  SELECT role INTO requesting_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF requesting_user_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'غير مصرح: المشرفون فقط يمكنهم حذف الأعضاء.';
  END IF;

  -- جلب إيميل العضو المستهدف
  SELECT email INTO target_email
  FROM auth.users
  WHERE id = target_user_id;

  -- حماية حساب المشرف الرئيسي
  IF target_email = 'admin@sniperfx.com' THEN
    RAISE EXCEPTION 'لا يمكن حذف حساب المشرف الرئيسي للنظام.';
  END IF;

  -- الحذف الآمن
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 2. ضمان أن المشرف يحصل دائماً على صلاحياته عند التسجيل (في حال تم حذفه وإعادة إنشائه)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Admin User'),
    CASE 
        WHEN new.email = 'admin@sniperfx.com' THEN 'admin' 
        ELSE 'student' 
    END,
    CASE 
        WHEN new.email = 'admin@sniperfx.com' THEN 'active' 
        ELSE 'pending' 
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
