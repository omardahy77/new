import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AlertCircle, Loader2, Wrench, WifiOff, Trash2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, dir } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      if (searchParams.get('action') === 'logout') {
        await handleResetApp(false);
        setCheckingSession(false);
        showToast(t('logout'), 'success');
        window.history.replaceState({}, '', '/login');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Force fetch profile to ensure we have the latest role
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          
          if (profile) {
             navigate(profile.role === 'admin' ? '/admin' : '/', { replace: true });
          } else {
             // Profile missing? Try to repair
             await supabase.rpc('ensure_user_profile_exists');
             const { data: retryProfile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
             if (retryProfile) {
                navigate(retryProfile.role === 'admin' ? '/admin' : '/', { replace: true });
             }
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate, searchParams, showToast, t]);

  const handleResetApp = async (reload = true) => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    if (reload) window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) { setError("No internet connection."); return; }

    setLoading(true);
    setError('');
    
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
      });
      
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
            throw new Error(dir === 'rtl' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
        } else if (signInError.message.includes('Email not confirmed')) {
            throw new Error(dir === 'rtl' ? 'البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك.' : 'Email not confirmed. Please check your inbox.');
        } else {
            throw new Error(signInError.message);
        }
      }

      if (data.user) {
        showToast(dir === 'rtl' ? "تم تسجيل الدخول بنجاح" : "Login successful", "success");
        
        // Ensure profile exists immediately
        await supabase.rpc('ensure_user_profile_exists');

        // Fetch role to direct correctly
        let role = 'student';
        const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (p) role = p.role;

        // Redirect
        if (role === 'admin' || cleanEmail.includes('admin')) {
           navigate('/admin', { replace: true });
        } else {
           navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setLoginAttempts(prev => prev + 1);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-gold-500"><Loader2 className="animate-spin mr-2" /> {t('loading')}</div>;

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden" dir={dir}>
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl border-gold-500/10">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">{t('login_title')}</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">{t('login_subtitle')}</p>

          {isOffline && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 justify-center">
                <WifiOff size={18} /> {dir === 'rtl' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}
             </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex flex-col gap-2 animate-fade-in">
               <div className="flex items-center gap-2">
                   <AlertCircle size={18} className="shrink-0" /> 
                   <span>{error}</span>
               </div>
               {loginAttempts >= 2 && (
                   <button onClick={() => handleResetApp(true)} className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-white py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors">
                       <Trash2 size={14} /> {dir === 'rtl' ? 'إصلاح المشكلة (إعادة ضبط)' : 'Fix Issue (Reset App)'}
                   </button>
               )}
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
            <button type="submit" disabled={loading || isOffline} className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : t('enter')}
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
