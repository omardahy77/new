-- إضافة حقول نصوص صفحة تواصل معنا إلى جدول الإعدادات
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS contact_title text DEFAULT 'تواصل معنا',
ADD COLUMN IF NOT EXISTS contact_desc text DEFAULT 'فريق الدعم الفني جاهز للرد على استفساراتكم ومساعدتكم في رحلتكم التعليمية';

-- تحديث القيم الافتراضية للصفوف الموجودة
UPDATE site_settings SET contact_title = 'تواصل معنا' WHERE contact_title IS NULL;
UPDATE site_settings SET contact_desc = 'فريق الدعم الفني جاهز للرد على استفساراتكم ومساعدتكم في رحلتكم التعليمية' WHERE contact_desc IS NULL;
