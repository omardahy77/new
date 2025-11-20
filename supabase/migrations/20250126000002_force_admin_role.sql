-- هذا الملف يضمن أن حساب المشرف يمتلك الصلاحيات دائماً

-- 1. دالة تقوم بترقية المستخدم فوراً إذا كان بريده هو بريد المشرف
CREATE OR REPLACE FUNCTION public.force_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'admin@sniperfx.com' THEN
    NEW.role := 'admin';
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إنشاء Trigger يعمل قبل أي عملية إدخال أو تحديث في جدول profiles
DROP TRIGGER IF EXISTS ensure_admin_role ON public.profiles;
CREATE TRIGGER ensure_admin_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.force_admin_role();

-- 3. تحديث الحساب الحالي فوراً (في حال كان موجوداً مسبقاً بصلاحيات خطأ)
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';
