import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../utils/errorHandling';
import { AlertCircle, Loader2, Clock, ShieldCheck, UserX, WifiOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();
  const { language, t, dir } = useLanguage();
  const { showToast } = useToast();
  const { user, refreshData } = useStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.status === 'active') navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setShake(false);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // 1. Attempt Supabase Login
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: normalizedEmail, 
        password 
      });
      
      if (authError) throw authError;
      if (!data.user) throw new Error('No user data returned');

      // 2. Optimized Profile Fetch (Only fetch what's needed for the check)
      // We use maybeSingle() to avoid errors if 0 or >1 rows returned (though ID is unique)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .maybeSingle();

      // Handle Missing Profile (Deleted Account)
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('ACCOUNT_DELETED');
      }

      // Handle Pending Account
      if (profile.status === 'pending' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('ACCOUNT_PENDING');
      }

      // Handle Banned Account
      if (profile.status === 'banned') {
        await supabase.auth.signOut();
        throw new Error('ACCOUNT_BANNED');
      }

      // 3. Success - Trigger Global Refresh in Background
      // We don't await this to keep UI snappy. The StoreProvider will pick up the auth change event anyway.
      refreshData(); 
      
      showToast(t('welcome_back'), 'success');
      navigate(profile.role === 'admin' ? '/admin' : '/', { replace: true });
      
    } catch (err: any) {
      // Only log unexpected system errors
      if (!err?.message?.includes('Email not confirmed') && !err?.message?.includes('Invalid login')) {
        console.error("Login Error:", err);
      }
      
      setShake(true);
      setTimeout(() => setShake(false), 500);

      const professionalMessage = getErrorMessage(err, language);
      setError(professionalMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorIcon = () => {
    if (error.includes('المراجعة') || error.includes('review')) return <Clock size={20} />;
    if (error.includes('اتصال') || error.includes('Connection')) return <WifiOff size={20} />;
    if (error.includes('غير موجود') || error.includes('not found')) return <UserX size={20} />;
    return <AlertCircle size={20} />;
  };

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden" dir={dir}>
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className={`glass-card p-8 md:p-10 shadow-2xl border-gold-500/10 transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <h2 className="text-3xl font-bold text-center mb-2 text-white">{t('login_title')}</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">{t('login_subtitle')}</p>

          {error && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-start gap-3 animate-fade-in ${
              error.includes('المراجعة') || error.includes('review') 
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
               <div className="shrink-0 mt-0.5">{getErrorIcon()}</div>
               <div className="flex flex-col gap-1 leading-relaxed">
                 <span>{error}</span>
               </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('email')}</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`w-full bg-[#020617] border rounded-xl p-4 outline-none transition-all text-white text-left ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-gold-500'}`}
                dir="ltr" 
                placeholder="name@example.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('password')}</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`w-full bg-[#020617] border rounded-xl p-4 outline-none transition-all text-white text-left ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-gold-500'}`}
                dir="ltr" 
                placeholder="••••••••" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
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
