import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { User, Shield, Key, User as UserIcon, Phone, Mail, Save, Clock, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, login } = useStore(); // We use login to refresh profile if needed
  const { t, dir } = useLanguage();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  if (!user) return null;

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingInfo(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phone })
        .eq('id', user.id);

      if (error) throw error;
      showToast(dir === 'rtl' ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully', 'success');
      // Optional: Reload page or trigger store refresh to show new name in Navbar immediately
      // For now, the local state reflects the change, and Navbar uses store which might lag slightly until refresh
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(dir === 'rtl' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast(dir === 'rtl' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'error');
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast(dir === 'rtl' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen page-padding-top pb-20" dir={dir}>
      <div className="container-custom max-w-4xl">
        
        {/* Header */}
        <div className="mb-10 flex items-center gap-6 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 text-4xl font-bold shadow-2xl border-4 border-navy-900">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{user.full_name || user.email.split('@')[0]}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-bold ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                {user.status === 'active' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {user.status === 'active' ? t('active_member') : t('pending_member')}
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <Mail size={14} /> {user.email}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Personal Info Card */}
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <UserIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">{dir === 'rtl' ? 'البيانات الشخصية' : 'Personal Info'}</h2>
            </div>

            <form onSubmit={handleUpdateInfo} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">{t('full_name')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 pl-10 focus:border-gold-500 outline-none text-white transition-colors"
                  />
                  <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">{t('phone')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 pl-10 focus:border-gold-500 outline-none text-white transition-colors"
                    dir="ltr"
                  />
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingInfo}
                className="w-full bg-navy-800 hover:bg-navy-700 text-white font-bold py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                {loadingInfo ? t('processing') : (
                  <>
                    <Save size={18} /> {dir === 'rtl' ? 'حفظ التغييرات' : 'Save Changes'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Card */}
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500">
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">{dir === 'rtl' ? 'الأمان وكلمة المرور' : 'Security'}</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">{dir === 'rtl' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 pl-10 focus:border-gold-500 outline-none text-white transition-colors"
                    placeholder="••••••••"
                  />
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">{dir === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 pl-10 focus:border-gold-500 outline-none text-white transition-colors"
                    placeholder="••••••••"
                  />
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingPassword || !newPassword}
                className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPassword ? t('processing') : (
                  <>
                    <Shield size={18} /> {dir === 'rtl' ? 'تحديث كلمة المرور' : 'Update Password'}
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
