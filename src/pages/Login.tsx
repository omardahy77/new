import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { AlertCircle, HelpCircle, Trash2, MailWarning, ShieldAlert, Wrench } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [sessionIssue, setSessionIssue] = useState(false); // حالة جديدة لمشاكل الجلسة
  const navigate = useNavigate();

  useEffect(() => {
    setIsAdminEmail(email.trim().toLowerCase() === 'admin@sniperfx.com');
  }, [email]);

  // التحقق من الجلسة الحالية
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // محاولة جلب البروفايل
        const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        
        if (profile?.role === 'admin') {
           navigate('/admin');
        } else if (profile) {
           // مستخدم عادي، يذهب للرئيسية
           navigate('/');
        } else {
           // المستخدم مسجل دخول لكن ليس له بروفايل (هنا المشكلة!)
           console.error("User logged in but no profile found:", error);
           setSessionIssue(true); // تفعيل وضع إصلاح الجلسة
           // لا نقوم بالتوجيه التلقائي هنا لنسمح للمستخدم برؤية المشكلة
        }
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('كلمة المرور غير صحيحة أو البريد الإلكتروني غير مسجل.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('البريد الإلكتروني لم يتم تأكيده بعد.');
      } else {
        setError(error.message);
      }
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role === 'admin') {
         navigate('/admin');
      } else if (profile) {
         navigate('/');
      } else {
         // حالة نادرة: الدخول نجح لكن البروفايل غير موجود
         setSessionIssue(true);
      }
    }
    setLoading(false);
  };

  const handleFixProfile = async () => {
     setLoading(true);
     const { data: { session } } = await supabase.auth.getSession();
     if (session) {
        // محاولة إنشاء بروفايل يدوياً
        const { error } = await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email,
            role: session.user.email === 'admin@sniperfx.com' ? 'admin' : 'student',
            status: 'active'
        });
        
        if (!error) {
            window.location.reload(); // إعادة تحميل لتفعيل التوجيه
        } else {
            setError('فشل الإصلاح التلقائي: ' + error.message);
        }
     }
     setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-gold-500">جاري التحقق...</div>;
  }

  // واجهة إصلاح الجلسة (تظهر فقط عند وجود المشكلة)
  if (sessionIssue) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 px-4">
            <div className="glass-card p-8 max-w-md w-full border-yellow-500/30 text-center">
                <ShieldAlert size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">تنبيه أمني / فني</h2>
                <p className="text-gray-400 mb-6">
                    أنت مسجل الدخول بالفعل، ولكن النظام لا يستطيع العثور على بيانات صلاحياتك (Profile Missing). قد يحدث هذا بسبب خطأ في التسجيل الأولي.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={handleFixProfile} className="btn-gold py-3 font-bold flex items-center justify-center gap-2">
                        <Wrench size={18} /> إصلاح الحساب تلقائياً
                    </button>
                    <button onClick={handleLogout} className="bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 border border-white/10">
                        تسجيل الخروج والمحاولة مرة أخرى
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden">
      {/* ... (Login Form UI remains mostly the same) ... */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl border-gold-500/10">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">تسجيل الدخول</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">لوحة التحكم والمنصة التعليمية</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                 {error.includes('تأكيده') ? <MailWarning className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}
                 <span>{error}</span>
              </div>
              {isAdminEmail && error.includes('كلمة المرور') && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-xs text-red-300 font-normal">
                  <p className="mb-1">تنبيه للمشرف: إذا نسيت كلمة المرور، يفضل حذف المستخدم من Supabase وإنشاؤه من جديد.</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 text-right">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full bg-[#020617] border rounded-xl p-4 outline-none transition-colors text-white text-left placeholder:text-right ${isAdminEmail ? 'border-gold-500/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'border-white/10 focus:border-gold-500'}`}
                placeholder="admin@sniperfx.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 text-right">كلمة المرور</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left placeholder:text-right"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400 flex flex-col gap-3">
            <div>
                ليس لديك حساب؟ <Link to="/register" className="text-gold-400 hover:text-gold-300 font-bold hover:underline transition-colors">إنشاء حساب جديد</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
