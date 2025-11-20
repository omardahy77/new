-- شرح: هذا الملف يضمن أن المستخدم admin@sniperfx.com يحصل دائماً على صلاحية المشرف
-- Metadata:
-- Schema-Category: "Safe"
-- Impact-Level: "Low"

-- 1. إنشاء دالة تقوم بفحص البريد الإلكتروني وفرض صلاحية الأدمن
CREATE OR REPLACE FUNCTION public.force_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كان البريد الإلكتروني هو بريد المشرف
  IF NEW.email = 'admin@sniperfx.com' THEN
    NEW.role := 'admin';      -- تعيين الدور: مشرف
    NEW.status := 'active';   -- تعيين الحالة: نشط
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إنشاء التريجر (المشغل) الذي يعمل قبل أي عملية إضافة أو تعديل في جدول profiles
DROP TRIGGER IF EXISTS ensure_admin_role ON public.profiles;

CREATE TRIGGER ensure_admin_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.force_admin_role();

-- 3. تحديث فوري لأي حساب موجود بهذا البريد حالياً
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@sniperfx.com';
