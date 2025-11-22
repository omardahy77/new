import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://napscysbreibhxsbucfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHNjeXNicmVpYmh4c2J1Y2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTIwODYsImV4cCI6MjA3OTIyODA4Nn0.Agju79hJ6_kXXbGQ-IWHEIGxwdb7V3hJ68QdbCVGsPw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateAdmin() {
  console.log('🚀 بدء عملية إعادة إنشاء حساب المشرف...');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. تسجيل حساب جديد (لأننا حذفنا القديم في الـ Migration)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Admin',
        role: 'admin',
        status: 'active'
      }
    }
  });

  if (error) {
    console.log('⚠️ ملاحظة:', error.message);
    // إذا قال الحساب موجود، نحاول تسجيل الدخول
    if (error.message.includes('already registered')) {
        console.log('🔄 الحساب موجود، جاري محاولة تسجيل الدخول وإصلاح البروفايل...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (loginData?.user) {
            // فرض إنشاء البروفايل
            const { error: upsertError } = await supabase.from('profiles').upsert({
                id: loginData.user.id,
                email: email,
                full_name: 'Admin',
                role: 'admin',
                status: 'active'
            });
            
            if (upsertError) console.error('❌ فشل إصلاح البروفايل:', upsertError.message);
            else console.log('✅ تم إصلاح البروفايل بنجاح.');
        }
    }
  } else if (data.user) {
    console.log('✅ تم إنشاء حساب المشرف الجديد بنجاح!');
    console.log('🆔 User ID:', data.user.id);
  }

  console.log('✨ العملية اكتملت.');
}

recreateAdmin();
