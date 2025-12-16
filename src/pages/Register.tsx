import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { getErrorMessage } from '../utils/errorHandling';
import { User, Phone, Mail, Lock, Clock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t, language, dir } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Create User
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email: email.trim().toLowerCase(), 
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            role: 'student'
          }
        }
      });
      
      if (signUpError) throw signUpError;

      if (authData.user) {
        await supabase.auth.signOut(); // Ensure logged out
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err, language));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden items-center justify-center" dir={dir}>
        <div className="glass-card p-10 max-w-md w-full text-center border-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold-500/20 animate-pulse-slow">
            <CheckCircle size={48} className="text-gold-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('request_sent')}</h2>
          <p className="text-gray-400 mb-10 leading-relaxed text-lg">
            {language === 'ar' 
             ? 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب، ثم سيتم مراجعته من قبل الإدارة.'
             : 'Registration successful! Please check your email to confirm your account before admin review.'}
          </p>
          <Link to="/" className="btn-gold w-full block py-4 text-center text-lg shadow-lg shadow-gold-500/10 font-bold hover:-translate-y-1 transition-transform">{t('back_home')}</Link>
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 font-bold animate-fade-in">
                <AlertCircle size={20} className="shrink-0" /> {error}
            </div>
          )}

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
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={`w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left ${dir === 'rtl' ? 'pr-12' : 'pl-12'}`} placeholder="••••••••" dir="ltr" minLength={6} />
                <Lock className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 mt-4 text-lg flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={24} /> : t('send_request')}
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
