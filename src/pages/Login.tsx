import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    // إزالة bg-navy-950
    <div className="min-h-screen flex flex-col pt-[160px] pb-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md mx-auto px-4 relative z-10 my-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-125" />
        </div>
        
        <div className="glass-card p-8 md:p-10 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">مرحباً بعودتك</h2>
          <p className="text-center text-gray-400 mb-8 text-sm">سجل دخولك للمتابعة في رحلة الاحتراف</p>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-bold">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="flex justify-between mb-2">
                <a href="#" className="text-xs text-gold-500 hover:underline">نسيت كلمة المرور؟</a>
                <label className="block text-sm font-bold text-gray-300">كلمة المرور</label>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none transition-colors text-white text-left placeholder:text-right"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#FFC400] hover:bg-[#FFD700] text-navy-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg"
            >
              {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            ليس لديك حساب؟ <Link to="/register" className="text-gold-400 hover:text-gold-300 font-bold hover:underline transition-colors">إنشاء حساب جديد</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
