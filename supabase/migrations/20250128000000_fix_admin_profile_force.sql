-- هذا السكريبت يقوم بإصلاح حساب المشرف المكسور (موجود في Auth ومفقود في Profiles)

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- 1. البحث عن معرف المستخدم في جدول المصادقة
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sniperfx.com';

  IF admin_uid IS NOT NULL THEN
    -- 2. إذا وجدنا المستخدم، نقوم بإجبار إنشاء/تحديث البروفايل
    INSERT INTO public.profiles (id, email, full_name, role, status, phone_number)
    VALUES (
      admin_uid, 
      'admin@sniperfx.com', 
      'Admin', 
      'admin', 
      'active',
      '0000000000'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'admin',
      status = 'active',
      email = 'admin@sniperfx.com'; -- تأكيد الإيميل
      
    RAISE NOTICE 'Admin profile fixed for UID: %', admin_uid;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users. Please run the create_admin.js script.';
  END IF;
END $$;
