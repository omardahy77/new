import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col pt-[160px] pb-10 bg-navy-950 relative overflow-hidden items-center justify-center">
        <div className="glass-card p-10 max-w-md w-full text-center border-green-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 animate-pulse-slow">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">تم إرسال الطلب بنجاح!</h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            شكراً لتسجيلك. حسابك قيد المراجعة وسيتم تفعيله قريباً.
          </p>
          <Link to="/" className="btn-gold w-full block py-4 text-center text-lg shadow-lg shadow-gold-500/10">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 bg-navy-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">انضم إلى النخبة</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">أنشئ حسابك وابدأ رحلة التداول الاحترافي</p>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-bold">{error}</div>}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 text-right">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left placeholder:text-right"
                placeholder="name@example.com"
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
              <p className="text-xs text-gray-500 mt-2 text-right">يجب أن تكون 6 أحرف على الأقل</p>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg"
            >
              {loading ? 'جاري المعالجة...' : 'إرسال طلب العضوية'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            لديك حساب بالفعل؟ <Link to="/login" className="text-gold-400 hover:text-gold-300 font-bold hover:underline transition-colors">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
