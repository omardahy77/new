import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AlertCircle, Loader2, Clock } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { showToast } = useToast();

  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
            if (profile.status === 'pending' && profile.role !== 'admin') {
                // Force logout if pending
                await supabase.auth.signOut();
                setError(dir === 'rtl' ? 'حسابك قيد المراجعة. يرجى انتظار موافقة المشرف.' : 'Account pending approval. Please wait for admin.');
            } else {
                navigate(profile.role === 'admin' ? '/admin' : '/');
            }
        }
      }
    };
    checkSession();
  }, [navigate, dir]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), password 
      });
      
      if (signInError) throw signInError;

      if (data.user) {
        // 1. Fetch Profile to check Status
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        // 2. Check Status
        if (profile) {
            if (profile.role === 'admin') {
                showToast(t('welcome_back'), 'success');
                navigate('/admin');
            } else if (profile.status === 'active') {
                showToast(t('welcome_back'), 'success');
                navigate('/');
            } else {
                // BLOCK LOGIN
                await supabase.auth.signOut();
                setError(dir === 'rtl' 
                    ? 'عذراً، حسابك لا يزال قيد المراجعة من قبل الإدارة. يرجى الانتظار.' 
                    : 'Sorry, your account is still pending admin approval. Please wait.');
            }
        } else {
            // Handle edge case where trigger might have failed
             await supabase.auth.signOut();
             setError(dir === 'rtl' ? 'خطأ في الحساب. يرجى التواصل مع الدعم.' : 'Account error. Contact support.');
        }
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? (dir === 'rtl' ? 'البيانات غير صحيحة' : 'Invalid credentials') 
        : err.message);
    } finally {
      setLoading(false);
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
            <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-start gap-3 ${error.includes('pending') || error.includes('مراجعة') || error.includes('الانتظار') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
               {error.includes('pending') || error.includes('مراجعة') || error.includes('الانتظار') ? <Clock size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
               <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 outline-none focus:border-gold-500 transition-colors text-white text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left" dir="ltr" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2">
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
