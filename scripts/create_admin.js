import { createClient } from '@supabase/supabase-js';

// استخدام المفاتيح الموجودة في سياق المشروع
const supabaseUrl = 'https://napscysbreibhxsbucfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcHNjeXNicmVpYmh4c2J1Y2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTIwODYsImV4cCI6MjA3OTIyODA4Nn0.Agju79hJ6_kXXbGQ-IWHEIGxwdb7V3hJ68QdbCVGsPw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('⏳ جاري إنشاء حساب المشرف...');

  const email = 'admin@sniperfx.com';
  const password = 'Hamza0100@';

  // 1. محاولة إنشاء المستخدم
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
        status: 'active'
      }
    }
  });

  if (error) {
    console.error('❌ حدث خطأ أثناء الإنشاء:', error.message);
    // إذا كان المستخدم موجوداً، نحاول تحديث بياناته في جدول profiles
    if (error.message.includes('already registered')) {
        console.log('ℹ️ المستخدم مسجل بالفعل، جاري التأكد من الصلاحيات...');
        // نحتاج لـ ID المستخدم، لكن لا يمكننا جلبه بسهولة من هنا بدون تسجيل دخول.
        // سنعتمد على أن المستخدم سيحاول تسجيل الدخول.
    }
  } else if (data.user) {
    console.log('✅ تم إنشاء حساب المشرف بنجاح!');
    
    // 2. ضمان تحديث الصلاحيات في جدول profiles (احتياطياً)
    // ننتظر قليلاً لضمان عمل الـ Trigger
    setTimeout(async () => {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', status: 'active' })
            .eq('id', data.user.id);

        if (!updateError) {
            console.log('✅ تم تفعيل صلاحيات المشرف.');
        } else {
            console.log('⚠️ ملاحظة: ' + updateError.message);
        }
    }, 2000);
  }
}

createAdmin();
