import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AlertCircle, Loader2, Clock, ShieldCheck, Database, Terminal } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { showToast } = useToast();
  const { login, user } = useStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.status === 'active') {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Attempt Login
      const userProfile = await login(normalizedEmail, password);
      
      showToast(t('welcome_back'), 'success');
      
      // Force navigation based on role immediately after successful login
      if (userProfile?.role === 'admin' || normalizedEmail.includes('admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      
      // User-Friendly Error Handling
      let displayMessage = err.message;

      // Handle specific error codes
      if (err.message === 'Invalid login credentials') {
        displayMessage = dir === 'rtl' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
          : 'Invalid email or password';
      } else if (err.status === 500 || err.message.includes('Database error') || err.message.includes('querying schema')) {
        // Specific handling for the 500 Schema Error
        displayMessage = dir === 'rtl'
          ? 'خطأ في قاعدة البيانات (500). يرجى تشغيل ملف SQL للإصلاح في لوحة التحكم.'
          : 'Database Error (500). Please run the "fix_permissions" SQL in Supabase Dashboard.';
      } else if (err.message.includes('Email not confirmed')) {
        displayMessage = dir === 'rtl'
          ? 'البريد الإلكتروني غير مؤكد. يرجى التحقق من بريدك.'
          : 'Email not confirmed. Please check your inbox.';
      }

      setError(displayMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden" dir={dir}>
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl border-gold-500/10">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">{t('login_title')}</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">{t('login_subtitle')}</p>

          {error && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-start gap-3 ${
              error.includes('pending') || error.includes('مراجعة') 
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
               {error.includes('pending') ? <Clock size={20} className="shrink-0" /> : 
                error.includes('Database') || error.includes('قاعدة البيانات') ? <Database size={20} className="shrink-0" /> :
                <AlertCircle size={20} className="shrink-0" />}
               <div className="flex flex-col gap-1">
                 <span>{error}</span>
                 {(error.includes('Database') || error.includes('500')) && (
                   <span className="text-xs font-normal opacity-80 flex items-center gap-1">
                     <Terminal size={12} /> Run `fix_permissions_and_recursion.sql`
                   </span>
                 )}
               </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 outline-none focus:border-gold-500 transition-colors text-white text-left" dir="ltr" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left" dir="ltr" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    {t('enter')} <ShieldCheck size={20} className="opacity-50" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            {t('no_account')} <Link to="/register" className="text-gold-400 hover:text-gold-300 font-bold hover:underline">{t('create_account')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
