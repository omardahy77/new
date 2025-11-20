-- هذا الملف يقوم بإصلاح صلاحيات المشرف وإعادة تعيين سياسات الأمان بشكل نظيف
-- لتجنب أخطاء "Policy already exists"

-- 1. التأكد من أن حساب المشرف (إذا وجد) يملك صلاحية admin في جدول profiles
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- البحث عن معرف المستخدم للإيميل المحدد
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';

  -- إذا وجد المستخدم، نقوم بتحديث أو إنشاء ملفه الشخصي
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, status, full_name)
    VALUES (admin_uid, 'admin@sniperfx.com', 'admin', 'active', 'المشرف العام')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'active';
  END IF;
END $$;

-- 2. حذف السياسات القديمة (لتجنب التعارض)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. إعادة إنشاء السياسات بشكل صحيح

-- السماح للجميع بقراءة البروفايلات (مهم لكي يستطيع التطبيق قراءة صلاحية المستخدم عند الدخول)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- السماح للمستخدمين بإنشاء بروفايلهم الخاص عند التسجيل
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- السماح للمستخدم بتحديث بياناته
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- السماح للمشرفين بالتعديل والحذف للجميع
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
