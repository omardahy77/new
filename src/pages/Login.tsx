import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AlertCircle, Loader2, Wrench, WifiOff, RefreshCw, Trash2 } from 'lucide-react';

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

  // Network Status Listener
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

  // Check active session & Handle Force Logout
  useEffect(() => {
    const checkSession = async () => {
      if (searchParams.get('action') === 'logout') {
        console.log("🧹 Force clearing session...");
        await handleResetApp(false); // Clear without reload
        setCheckingSession(false);
        showToast(t('logout'), 'success');
        window.history.replaceState({}, '', '/login');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If we have a session, try to get profile.
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          if (profile) {
             navigate(profile.role === 'admin' ? '/admin' : '/', { replace: true });
          } else {
             // Session exists but profile doesn't? Try to fix it silently first
             await supabase.rpc('ensure_user_profile_exists');
             const { data: retryProfile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
             if (retryProfile) {
                navigate(retryProfile.role === 'admin' ? '/admin' : '/', { replace: true });
             } else {
                // If still failing, sign out to allow clean login
                await supabase.auth.signOut();
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

  // UTILITY: Complete App Reset
  const handleResetApp = async (reload = true) => {
    console.log("🧹 Resetting Application State...");
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    if (reload) window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOffline) {
        setError("No internet connection. Please check your network.");
        return;
    }

    setLoading(true);
    setError('');
    
    // 1. Sanitize Input
    const cleanEmail = email.trim();
    
    try {
      // 2. Attempt Login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
      });
      
      if (signInError) {
        throw new Error(signInError.message === 'Invalid login credentials' 
            ? (dir === 'rtl' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password') 
            : signInError.message);
      }

      if (data.user) {
        showToast(dir === 'rtl' ? "تم تسجيل الدخول بنجاح" : "Login successful", "success");

        // 3. FORCE REPAIR (Just in case the Trigger missed it)
        await supabase.rpc('ensure_user_profile_exists');

        // 4. Fetch Profile with Retry Logic
        let profile = null;
        let attempts = 0;
        
        while (!profile && attempts < 3) {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            profile = p;
            if (!profile) {
                attempts++;
                await new Promise(r => setTimeout(r, 500)); // Wait 500ms
            }
        }

        // 5. FINAL FALLBACK: Wait for Server Propagation
        if (!profile) {
            console.warn("⚠️ RPC slow, polling for profile...");
            // Do NOT insert manually (causes 42P17 recursion). Just poll longer.
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 800));
                const { data: finalProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                if (finalProfile) {
                    profile = finalProfile;
                    break;
                }
            }
        }

        if (!profile) {
            throw new Error("Profile creation failed. Please click 'Reset App' below.");
        }

        // 6. Hard Reload Navigation (Clears any lingering memory state)
        const timestamp = Date.now();
        if (profile.role === 'admin' || cleanEmail.toLowerCase() === 'admin@sniperfx.com') {
           window.location.href = `/admin?t=${timestamp}`;
        } else {
           window.location.href = `/?t=${timestamp}`;
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

          {/* Network Warning */}
          {isOffline && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 justify-center">
                <WifiOff size={18} /> {dir === 'rtl' ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}
             </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex flex-col gap-2 animate-fade-in">
               <div className="flex items-center gap-2">
                   <AlertCircle size={18} className="shrink-0" /> 
                   <span>{error}</span>
               </div>
               
               {/* Smart Suggestion: Show Reset Button if repeated failures */}
               {loginAttempts >= 2 && (
                   <button 
                     onClick={() => handleResetApp(true)}
                     className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-white py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                   >
                       <Trash2 size={14} />
                       {dir === 'rtl' ? 'إصلاح المشكلة (إعادة ضبط)' : 'Fix Issue (Reset App)'}
                   </button>
               )}
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
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left"
                dir="ltr"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || isOffline}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? t('verifying') : t('enter')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            {t('no_account')} <Link to="/register" className="text-gold-400 hover:text-gold-300 font-bold hover:underline">{t('create_account')}</Link>
          </div>

          {/* TROUBLESHOOT SECTION - Always visible but subtle */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <button 
               onClick={() => handleResetApp(true)} 
               className="text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-2 mx-auto transition-colors opacity-60 hover:opacity-100"
               title="Clear Cache & Cookies"
             >
                <Wrench size={12} />
                {dir === 'rtl' ? 'تواجه مشاكل؟ إعادة ضبط التطبيق' : 'Having trouble? Reset App'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
