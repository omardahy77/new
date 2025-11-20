/*
  # Confirm Admin Email
  
  ## Query Description:
  This migration manually confirms the admin email address to bypass the email verification requirement.
  This is necessary because the project might not have SMTP configured for sending verification emails.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
*/

-- تفعيل البريد الإلكتروني للمشرف يدوياً
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@sniperfx.com';

-- تفعيل أي مستخدم آخر معلق (اختياري، لتسهيل التجربة)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
