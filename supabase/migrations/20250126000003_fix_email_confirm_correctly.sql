/*
  # Fix Email Confirmation Logic
  # Corrects the issue where confirmed_at cannot be updated directly.
  # We update email_confirmed_at instead.
*/

-- 1. تفعيل جميع الحسابات الحالية بتحديث عمود email_confirmed_at
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. دالة لتفعيل الحسابات الجديدة تلقائياً
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS TRIGGER AS $$
BEGIN
    -- نضع تاريخ التفعيل هو نفس تاريخ الإنشاء
    NEW.email_confirmed_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. حذف التريجر القديم إذا وجد لتجنب التكرار
DROP TRIGGER IF EXISTS trigger_auto_confirm_new_users ON auth.users;

-- 4. إنشاء التريجر ليعمل قبل إدخال أي مستخدم جديد
CREATE TRIGGER trigger_auto_confirm_new_users
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_new_users();
