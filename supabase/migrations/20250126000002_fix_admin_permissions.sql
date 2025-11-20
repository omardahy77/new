-- إصلاح شامل لصلاحيات المشرف وسياسات الأمان

-- 1. التأكد من تفعيل RLS على جدول profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة لتجنب التضارب
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. إنشاء سياسات جديدة وصحيحة
-- السماح للمستخدم برؤية ملفه الشخصي
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- السماح للمستخدم بتحديث بياناته
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- السماح للمشرفين برؤية وتعديل كل الملفات (مهم جداً للوحة التحكم)
-- نستخدم دالة أمنية لتجنب التكرار اللانهائي (Infinite Recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (is_admin());

-- 4. فرض صلاحية المشرف على الإيميل المحدد (إصلاح البيانات)
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- البحث عن معرف المستخدم في جدول auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';
  
  IF admin_uid IS NOT NULL THEN
    -- التأكد من وجود صف في جدول profiles
    INSERT INTO public.profiles (id, email, role, status, full_name)
    VALUES (admin_uid, 'admin@sniperfx.com', 'admin', 'active', 'المشرف العام')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';
  END IF;
END $$;
