-- 1. FIX LOGIN PERFORMANCE (CRITICAL)
-- Drop problematic triggers that cause infinite loops/slow logins
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();

-- Create a safe, lightweight trigger for new user creation only
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- 2. UPGRADE SITE SETTINGS (CMS)
-- Ensure we have a flexible JSONB column for all content
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS content_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{}'::jsonb;

-- 3. ENSURE LESSONS TABLE IS ROBUST
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 4. FIX RLS POLICIES (Allow Admin to Edit Everything)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be safe
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin Update Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin Insert Settings" ON public.site_settings;

-- Create new robust policies
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin All Settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admin All Courses" ON public.courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public Read Lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admin All Lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. SEED DEFAULT CMS DATA IF EMPTY
INSERT INTO public.site_settings (site_name, content_config)
SELECT 'Sniper FX Gold', '{
  "hero_title": "تداول بذكاء بدقة القناص",
  "hero_desc": "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
  "why_choose_us_title": "لماذا تختارنا؟",
  "why_choose_us_desc": "نقدم تجربة تعليمية متكاملة تجمع بين النظرية والتطبيق."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
