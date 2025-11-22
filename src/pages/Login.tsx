import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  // Check active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          if (profile) {
             navigate(profile.role === 'admin' ? '/admin' : '/');
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Attempt Login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        throw new Error(t('login_error') || 'بيانات الدخول غير صحيحة');
      }

      if (data.user) {
        // 2. Check Profile
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        // === SELF HEALING FOR ADMIN ===
        // If Admin profile is missing, create it immediately.
        if (!profile && email.toLowerCase() === 'admin@sniperfx.com') {
           console.log("⚠️ Admin profile missing. Auto-fixing...");
           
           const { error: insertError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              full_name: 'Admin',
              role: 'admin',
              status: 'active'
           });

           if (insertError) {
              console.error("❌ Fix failed:", insertError);
              throw new Error("Failed to restore admin profile. Please check database policies.");
           } else {
              console.log("✅ Admin profile fixed. Redirecting...");
              navigate('/admin');
              return;
           }
        }
        // ==============================

        if (!profile) {
           // If it's a regular user with no profile, sign them out
           await supabase.auth.signOut();
           throw new Error(t('account_not_found') || 'الحساب غير موجود، يرجى التسجيل من جديد.');
        }

        if (profile.role === 'admin') {
           navigate('/admin');
        } else {
           navigate('/');
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "An unexpected error occurred");
      // Ensure we don't leave a half-baked session if profile check failed
      if (err.message === t('account_not_found')) {
          await supabase.auth.signOut().catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-gold-500">{t('loading')}</div>;

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
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 animate-fade-in">
               <AlertCircle size={18} /> {error}
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
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 outline-none focus:border-gold-500 transition-colors text-white text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('password')}</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left"
                dir="ltr"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg"
            >
              {loading ? t('verifying') : t('enter')}
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
