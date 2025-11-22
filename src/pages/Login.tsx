import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, HelpCircle, Trash2, MailWarning, ShieldAlert, Wrench } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  const [sessionIssue, setSessionIssue] = useState(false);
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  useEffect(() => {
    setIsAdminEmail(email.trim().toLowerCase() === 'admin@sniperfx.com');
  }, [email]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        
        if (profile?.role === 'admin') {
           navigate('/admin');
        } else if (profile) {
           navigate('/');
        } else {
           setSessionIssue(true);
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
      setError(error.message);
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role === 'admin') {
         navigate('/admin');
      } else if (profile) {
         navigate('/');
      } else {
         setSessionIssue(true);
      }
    }
    setLoading(false);
  };

  const handleFixProfile = async () => {
     setLoading(true);
     const { data: { session } } = await supabase.auth.getSession();
     if (session) {
        const { error } = await supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email,
            role: session.user.email === 'admin@sniperfx.com' ? 'admin' : 'student',
            status: 'active'
        });
        
        if (!error) {
            window.location.reload();
        } else {
            setError('Auto-fix failed: ' + error.message);
        }
     }
     setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-gold-500">{t('loading')}</div>;
  }

  if (sessionIssue) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 px-4" dir={dir}>
            <div className="glass-card p-8 max-w-md w-full border-yellow-500/30 text-center">
                <ShieldAlert size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Account Issue</h2>
                <p className="text-gray-400 mb-6">
                    Profile missing. Please try auto-fix.
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={handleFixProfile} className="btn-gold py-3 font-bold flex items-center justify-center gap-2">
                        <Wrench size={18} /> Auto-Fix Profile
                    </button>
                    <button onClick={handleLogout} className="bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 border border-white/10">
                        Logout & Retry
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden" dir={dir}>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl border-gold-500/10">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">{t('login_title')}</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">{t('login_subtitle')}</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                 <AlertCircle className="shrink-0" size={18} />
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
                className={`w-full bg-[#020617] border rounded-xl p-4 outline-none transition-colors text-white text-left placeholder:text-gray-500 ${isAdminEmail ? 'border-gold-500/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'border-white/10 focus:border-gold-500'}`}
                placeholder={t('email_placeholder')}
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
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left placeholder:text-gray-500"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg"
            >
              {loading ? t('verifying') : t('enter')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400 flex flex-col gap-3">
            <div>
                {t('no_account')} <Link to="/register" className="text-gold-400 hover:text-gold-300 font-bold hover:underline transition-colors">{t('create_account')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
