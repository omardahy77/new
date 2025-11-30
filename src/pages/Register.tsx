import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, User, Phone, Mail, Lock, Clock } from 'lucide-react';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t, dir } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Create User (Supabase Auth)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            role: 'student' // Metadata for the trigger
          }
        }
      });
      
      if (signUpError) throw signUpError;

      if (authData.user) {
        // 2. MANUAL FALLBACK: Try to insert profile manually
        // This ensures the user appears in the dashboard even if the DB trigger fails or is slow.
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone_number: phoneNumber,
            role: 'student',
            status: 'pending',
            created_at: new Date().toISOString()
        });

        // We ignore "duplicate key" errors (code 23505) because that means the trigger WORKED (Good!)
        if (profileError && profileError.code !== '23505') {
            console.warn("Manual profile creation warning:", profileError);
        }

        // 3. Sign Out immediately to prevent "partial login" state
        await supabase.auth.signOut();
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden items-center justify-center" dir={dir}>
        <div className="glass-card p-10 max-w-md w-full text-center border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] relative z-10">
          <div className="w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold-500/20 animate-pulse-slow">
            <Clock size={48} className="text-gold-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('request_sent')}</h2>
          <p className="text-gray-400 mb-10 leading-relaxed text-lg">
            {dir === 'rtl' 
             ? 'تم استلام طلبك بنجاح! حسابك الآن قيد المراجعة. سيتم إشعارك عند التفعيل.'
             : 'Your request has been received! Your account is pending approval.'}
          </p>
          <Link to="/" className="btn-gold w-full block py-4 text-center text-lg shadow-lg shadow-gold-500/10 font-bold">{t('back_home')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden" dir={dir}>
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">{t('register_title')}</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">{t('register_subtitle')}</p>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-bold">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('full_name')}</label>
              <div className="relative">
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className={`w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`} placeholder={t('name_placeholder')} />
                <User className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('phone')}</label>
              <div className="relative">
                <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={`w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`} placeholder={t('phone_placeholder')} dir="ltr" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }} />
                <Phone className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('email')}</label>
              <div className="relative">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`} placeholder={t('email_placeholder')} dir="ltr" />
                <Mail className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t('password')}</label>
              <div className="relative">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={`w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`} placeholder="••••••••" dir="ltr" />
                <Lock className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg">
              {loading ? t('processing') : t('send_request')}
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-gray-400">
            {t('have_account')} <Link to="/login" className="text-gold-400 hover:text-gold-300 font-bold hover:underline">{t('login')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
