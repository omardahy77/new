import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings } from '../types';
import { 
  LayoutDashboard, Users, BookOpen, Settings, Save, 
  Plus, Trash2, CheckCircle, Lock, Unlock, Search,
  TrendingUp, ShieldCheck, Crown, X, Globe, ToggleLeft, ToggleRight,
  Facebook, Instagram, Send, Youtube, Phone, Video, Twitter,
  ExternalLink, Activity, AlertTriangle, Eye, Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

// Skeleton Loader for Tables
const TableSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="bg-navy-900/30 h-16 rounded-xl border border-white/5"></div>
    ))}
  </div>
);

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, refreshData, updateSettings } = useStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'cms' | 'courses' | 'users'>('cms');
  
  // CMS State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [cmsSection, setCmsSection] = useState<'general' | 'hero' | 'social' | 'features' | 'content'>('general');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Data States
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  
  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [stats, setStats] = useState({ users: 0, active: 0, pending: 0, courses: 0 });

  // Search/Filter
  const [userSearch, setUserSearch] = useState('');
  
  // Modals
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // 1. Initial Load: Sync Settings & Fetch Lightweight Stats
  useEffect(() => {
     setSettingsForm(JSON.parse(JSON.stringify(siteSettings)));
  }, [siteSettings]);

  useEffect(() => {
    fetchStats();
  }, []);

  // 2. Lazy Load Data based on Tab
  useEffect(() => {
    if (activeTab === 'users' && usersList.length === 0) fetchUsers();
    if (activeTab === 'courses' && coursesList.length === 0) fetchCourses();
  }, [activeTab]);

  // Track changes for "Unsaved Changes" warning
  useEffect(() => {
    const isDifferent = JSON.stringify(settingsForm) !== JSON.stringify(siteSettings);
    setHasChanges(isDifferent);
  }, [settingsForm, siteSettings]);

  const fetchStats = async () => {
    // Parallel lightweight count queries
    const [ { count: totalUsers }, { count: activeUsers }, { count: pendingUsers }, { count: totalCourses } ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('courses').select('*', { count: 'exact', head: true })
    ]);

    setStats({
        users: totalUsers || 0,
        active: activeUsers || 0,
        pending: pendingUsers || 0,
        courses: totalCourses || 0
    });
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      // Select ONLY necessary columns for speed
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at')
        .order('created_at', { ascending: false });
      
      if (data) setUsersList(data as User[]);
      setLoadingUsers(false);
  };

  const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (data) setCoursesList(data as Course[]);
      setLoadingCourses(false);
  };

  // --- CMS ACTIONS ---
  const handleSettingChange = (field: keyof SiteSettings, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: 'social_links' | 'features_config' | 'content_config', key: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
      try {
        await updateSettings(settingsForm);
        showToast('تم تحديث إعدادات الموقع بنجاح', 'success');
        setHasChanges(false);
        refreshData();
      } catch (error: any) {
        showToast('فشل الحفظ: ' + error.message, 'error');
      }
  };

  // --- COURSE ACTIONS ---
  const saveCourse = async () => {
      const payload = {
          title: editingCourse.title,
          description: editingCourse.description,
          thumbnail: editingCourse.thumbnail,
          is_paid: editingCourse.is_paid || false,
          level: editingCourse.level || 'متوسط'
      };
      
      let error;
      if (editingCourse.id) {
          ({ error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id));
      } else {
          ({ error } = await supabase.from('courses').insert(payload));
      }

      if (error) showToast(error.message, 'error');
      else {
          showToast('تم حفظ الكورس', 'success');
          setIsCourseModalOpen(false);
          fetchCourses(); // Refresh list
          fetchStats(); // Refresh stats
          refreshData(); // Refresh global store
      }
  };

  const deleteCourse = async (id: string) => {
      if(!confirm('هل أنت متأكد من حذف الكورس؟')) return;
      await supabase.from('courses').delete().eq('id', id);
      fetchCourses();
      fetchStats();
      refreshData();
  };

  // --- USER ACTIONS ---
  const approveUser = async (id: string) => {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
      // Optimistic Update
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u));
      setStats(prev => ({ ...prev, active: prev.active + 1, pending: prev.pending - 1 }));
      showToast('تم تفعيل العضو', 'success');
  };

  const deleteUser = async (id: string) => {
    if(!confirm('تحذير: هل أنت متأكد تماماً من حذف هذا العضو؟ سيتم مسح حسابه نهائياً من قاعدة البيانات ولن يتمكن من الدخول مرة أخرى.')) return;
    
    try {
        const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });
        if (error) throw error;
        
        showToast('تم حذف العضو ومسح بياناته نهائياً', 'success');
        setUsersList(prev => prev.filter(u => u.id !== id));
        setStats(prev => ({ ...prev, users: prev.users - 1 }));
    } catch (error: any) {
        showToast('خطأ في الحذف: ' + error.message, 'error');
    }
  };

  const enrollUser = async () => {
      if (!selectedUser || !selectedCourseId) return;
      const { error } = await supabase.from('enrollments').insert({
          user_id: selectedUser.id,
          course_id: selectedCourseId
      });
      
      if (error) {
          if(error.code === '23505') showToast('العضو مشترك بالفعل', 'error');
          else showToast(error.message, 'error');
      } else {
          showToast(`تم تسجيل ${selectedUser.full_name} في الكورس`, 'success');
          setEnrollModalOpen(false);
      }
  };

  if (user?.role !== 'admin') return <div className="p-10 text-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen pt-32 pb-10 bg-navy-950 text-white" dir="rtl">
      <div className="container-custom">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    <LayoutDashboard className="text-gold-500" size={32} /> لوحة التحكم الشاملة
                </h1>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Activity size={14} className="text-green-500" /> النظام يعمل بكفاءة 100%
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <Link to="/" target="_blank" className="bg-navy-800 hover:bg-navy-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/5">
                    <Eye size={18} /> معاينة الموقع
                </Link>
                <div className="flex items-center gap-2 text-sm text-gold-400 bg-gold-500/10 px-4 py-2.5 rounded-xl border border-gold-500/20">
                    <ShieldCheck size={16} />
                    <span>Super Admin</span>
                </div>
            </div>
        </div>

        {/* Quick Stats Grid (Instant Load) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold">إجمالي الأعضاء</p>
                    <p className="text-2xl font-black text-white">{stats.users}</p>
                </div>
            </div>
            <div className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold">أعضاء نشطين</p>
                    <p className="text-2xl font-black text-white">{stats.active}</p>
                </div>
            </div>
            <div className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 relative">
                    <AlertTriangle size={24} />
                    {stats.pending > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold">طلبات معلقة</p>
                    <p className="text-2xl font-black text-white">{stats.pending}</p>
                </div>
            </div>
            <div className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500">
                    <BookOpen size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold">الكورسات</p>
                    <p className="text-2xl font-black text-white">{stats.courses}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-2">
                <button onClick={() => setActiveTab('cms')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'cms' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <Settings size={20} /> إعدادات الموقع (CMS)
                </button>
                <button onClick={() => setActiveTab('courses')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'courses' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <BookOpen size={20} /> إدارة الكورسات
                </button>
                <button onClick={() => setActiveTab('users')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'users' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <Users size={20} /> إدارة الأعضاء
                    {stats.pending > 0 && <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pending}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 bg-navy-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px]">
                
                {/* ================= CMS TAB ================= */}
                {activeTab === 'cms' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold">تعديل محتوى الموقع</h2>
                            <div className="flex items-center gap-3">
                                {hasChanges && <span className="text-yellow-500 text-sm font-bold animate-pulse">يوجد تغييرات غير محفوظة!</span>}
                                <button onClick={saveSettings} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all">
                                    <Save size={18} /> حفظ التغييرات
                                </button>
                            </div>
                        </div>

                        {/* CMS Navigation Pills */}
                        <div className="flex flex-wrap gap-2">
                            {['general', 'hero', 'social', 'features', 'content'].map(section => (
                                <button 
                                    key={section}
                                    onClick={() => setCmsSection(section as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${cmsSection === section ? 'bg-white/10 text-gold-500 border border-gold-500/30' : 'bg-navy-950 text-gray-400 border border-white/5 hover:bg-white/5'}`}
                                >
                                    {section === 'general' && 'عام'}
                                    {section === 'hero' && 'الواجهة (Hero)'}
                                    {section === 'social' && 'التواصل الاجتماعي'}
                                    {section === 'features' && 'المميزات والتحكم'}
                                    {section === 'content' && 'النصوص (AR/EN)'}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-navy-950 p-6 rounded-xl border border-white/5">
                            
                            {/* 1. GENERAL SETTINGS */}
                            {cmsSection === 'general' && (
                                <div className="space-y-4">
                                    <h3 className="text-gold-500 font-bold mb-2 flex items-center gap-2"><Globe size={18} /> إعدادات عامة</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">اسم الموقع (عربي)</label>
                                            <input value={settingsForm.site_name || ''} onChange={e => handleSettingChange('site_name', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Site Name (English)</label>
                                            <input value={settingsForm.site_name_en || ''} onChange={e => handleSettingChange('site_name_en', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" dir="ltr" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">رابط الشعار (Logo URL)</label>
                                        <input value={settingsForm.logo_url || ''} onChange={e => handleSettingChange('logo_url', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" dir="ltr" />
                                    </div>
                                </div>
                            )}

                            {/* 2. HERO SECTION */}
                            {cmsSection === 'hero' && (
                                <div className="space-y-4">
                                    <h3 className="text-gold-500 font-bold mb-2">الواجهة الرئيسية (Hero Section)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">العنوان السطر 1 (عربي)</label>
                                            <input value={settingsForm.hero_title_line1 || ''} onChange={e => handleSettingChange('hero_title_line1', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Title Line 1 (English)</label>
                                            <input value={settingsForm.hero_title_line1_en || ''} onChange={e => handleSettingChange('hero_title_line1_en', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gold-500 text-sm mb-1">العنوان السطر 2 (ذهبي - عربي)</label>
                                            <input value={settingsForm.hero_title_line2 || ''} onChange={e => handleSettingChange('hero_title_line2', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-gold-500 text-sm mb-1">Title Line 2 (Gold - English)</label>
                                            <input value={settingsForm.hero_title_line2_en || ''} onChange={e => handleSettingChange('hero_title_line2_en', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">الوصف (عربي)</label>
                                            <textarea value={settingsForm.hero_desc || ''} onChange={e => handleSettingChange('hero_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Description (English)</label>
                                            <textarea value={settingsForm.hero_desc_en || ''} onChange={e => handleSettingChange('hero_desc_en', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24" dir="ltr" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. SOCIAL LINKS */}
                            {cmsSection === 'social' && (
                                <div className="space-y-4">
                                    <h3 className="text-gold-500 font-bold mb-4">روابط التواصل الاجتماعي</h3>
                                    
                                    {[
                                        { key: 'whatsapp', icon: Phone, label: 'WhatsApp' },
                                        { key: 'facebook', icon: Facebook, label: 'Facebook' },
                                        { key: 'telegram', icon: Send, label: 'Telegram' },
                                        { key: 'instagram', icon: Instagram, label: 'Instagram' },
                                        { key: 'youtube', icon: Youtube, label: 'YouTube' },
                                        { key: 'tiktok', icon: Video, label: 'TikTok' },
                                        { key: 'twitter', icon: Twitter, label: 'Twitter/X' },
                                    ].map(social => (
                                        <div key={social.key} className="flex items-center gap-4 bg-navy-900 p-3 rounded-lg border border-white/5">
                                            <social.icon size={20} className="text-gray-400" />
                                            <div className="flex-1">
                                                <input 
                                                    placeholder={`${social.label} URL`}
                                                    value={settingsForm.social_links?.[social.key as keyof typeof settingsForm.social_links] || ''}
                                                    onChange={e => handleNestedChange('social_links', social.key, e.target.value)}
                                                    className="w-full bg-transparent border-none outline-none text-white text-sm"
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                                                <span className="text-xs text-gray-500">إظهار؟</span>
                                                <button 
                                                    onClick={() => handleNestedChange('features_config', `social_${social.key}_visible`, !settingsForm.features_config?.[`social_${social.key}_visible` as keyof typeof settingsForm.features_config])}
                                                    className={`w-10 h-5 rounded-full relative transition-colors ${settingsForm.features_config?.[`social_${social.key}_visible` as keyof typeof settingsForm.features_config] !== false ? 'bg-green-500' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settingsForm.features_config?.[`social_${social.key}_visible` as keyof typeof settingsForm.features_config] !== false ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 4. FEATURES & TOGGLES */}
                            {cmsSection === 'features' && (
                                <div className="space-y-4">
                                    <h3 className="text-gold-500 font-bold mb-4">التحكم في المميزات (Toggles)</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-navy-900 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white">بطاقة "قريباً" (Coming Soon)</h4>
                                                <p className="text-xs text-gray-400">إظهار كورس Master Class Pro في الصفحة الرئيسية</p>
                                            </div>
                                            <button 
                                                onClick={() => handleNestedChange('features_config', 'show_coming_soon', !settingsForm.features_config?.show_coming_soon)}
                                                className={`text-2xl transition-colors ${settingsForm.features_config?.show_coming_soon ? 'text-green-500' : 'text-gray-600'}`}
                                            >
                                                {settingsForm.features_config?.show_coming_soon ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                            </button>
                                        </div>

                                        <div className="bg-navy-900 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white">إحصائيات الموقع</h4>
                                                <p className="text-xs text-gray-400">إظهار عدد الطلاب والساعات التدريبية</p>
                                            </div>
                                            <button 
                                                onClick={() => handleNestedChange('features_config', 'show_stats', !settingsForm.features_config?.show_stats)}
                                                className={`text-2xl transition-colors ${settingsForm.features_config?.show_stats ? 'text-green-500' : 'text-gray-600'}`}
                                            >
                                                {settingsForm.features_config?.show_stats ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                            </button>
                                        </div>

                                        <div className="bg-navy-900 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white">السماح بالتسجيل</h4>
                                                <p className="text-xs text-gray-400">فتح/غلق باب تسجيل أعضاء جدد</p>
                                            </div>
                                            <button 
                                                onClick={() => handleNestedChange('features_config', 'allow_registration', !settingsForm.features_config?.allow_registration)}
                                                className={`text-2xl transition-colors ${settingsForm.features_config?.allow_registration ? 'text-green-500' : 'text-gray-600'}`}
                                            >
                                                {settingsForm.features_config?.allow_registration ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 5. CONTENT TEXT (AR/EN) */}
                            {cmsSection === 'content' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold mb-4">نصوص الموقع (عربي / English)</h3>
                                    
                                    {[
                                        { id: 'about_main_title', label: 'عنوان "من نحن" (About Title)' },
                                        { id: 'about_main_desc', label: 'وصف "من نحن" (About Desc)', type: 'textarea' },
                                        { id: 'contact_main_title', label: 'عنوان "تواصل معنا" (Contact Title)' },
                                        { id: 'contact_main_desc', label: 'وصف "تواصل معنا" (Contact Desc)' },
                                        { id: 'footer_tagline', label: 'شعار الفوتر (Footer Tagline)' },
                                        { id: 'cta_title', label: 'عنوان الدعوة (CTA Title)' },
                                        { id: 'cta_desc', label: 'وصف الدعوة (CTA Desc)' },
                                    ].map(field => (
                                        <div key={field.id} className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 last:border-0">
                                            <div>
                                                <label className="block text-gray-400 text-xs mb-1">{field.label} - عربي</label>
                                                {field.type === 'textarea' ? (
                                                    <textarea 
                                                        value={settingsForm.content_config?.[field.id] || ''} 
                                                        onChange={e => handleNestedChange('content_config', field.id, e.target.value)} 
                                                        className="w-full bg-navy-900 border border-white/10 p-2 rounded text-white text-sm h-20"
                                                    />
                                                ) : (
                                                    <input 
                                                        value={settingsForm.content_config?.[field.id] || ''} 
                                                        onChange={e => handleNestedChange('content_config', field.id, e.target.value)} 
                                                        className="w-full bg-navy-900 border border-white/10 p-2 rounded text-white text-sm"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs mb-1">{field.label} - English</label>
                                                {field.type === 'textarea' ? (
                                                    <textarea 
                                                        value={settingsForm.content_config?.[`${field.id}_en`] || ''} 
                                                        onChange={e => handleNestedChange('content_config', `${field.id}_en`, e.target.value)} 
                                                        className="w-full bg-navy-900 border border-white/10 p-2 rounded text-white text-sm h-20"
                                                        dir="ltr"
                                                    />
                                                ) : (
                                                    <input 
                                                        value={settingsForm.content_config?.[`${field.id}_en`] || ''} 
                                                        onChange={e => handleNestedChange('content_config', `${field.id}_en`, e.target.value)} 
                                                        className="w-full bg-navy-900 border border-white/10 p-2 rounded text-white text-sm"
                                                        dir="ltr"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* ================= COURSES TAB ================= */}
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">الكورسات الحالية</h2>
                            <div className="flex gap-2">
                                <button onClick={fetchCourses} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
                                    <RefreshCw size={18} className={loadingCourses ? 'animate-spin' : ''} />
                                </button>
                                <button onClick={() => { setEditingCourse({}); setIsCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors">
                                    <Plus size={18} /> إضافة كورس
                                </button>
                            </div>
                        </div>

                        {loadingCourses ? <TableSkeleton /> : (
                            <div className="space-y-4">
                                {coursesList.map(course => (
                                    <div key={course.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-gold-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <img src={course.thumbnail} className="w-16 h-10 object-cover rounded border border-white/10" />
                                            <div>
                                                <h3 className="font-bold text-white">{course.title}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${course.is_paid ? 'bg-gold-500/20 text-gold-500' : 'bg-green-500/20 text-green-500'}`}>
                                                    {course.is_paid ? 'مدفوع (VIP)' : 'مجاني'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingCourse(course); setIsCourseModalOpen(true); }} className="text-blue-400 p-2 hover:bg-blue-500/10 rounded transition-colors">تعديل</button>
                                            <button onClick={() => deleteCourse(course.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                                {coursesList.length === 0 && <div className="text-center text-gray-500 py-10">لا توجد كورسات</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= USERS TAB ================= */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">قائمة الأعضاء</h2>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">{usersList.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={fetchUsers} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
                                    <RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''} />
                                </button>
                                <div className="relative">
                                    <input 
                                        placeholder="بحث عن عضو..." 
                                        value={userSearch} 
                                        onChange={e => setUserSearch(e.target.value)} 
                                        className="bg-navy-950 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-white w-64 focus:border-gold-500 outline-none"
                                    />
                                    <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                                </div>
                            </div>
                        </div>

                        {loadingUsers ? <TableSkeleton /> : (
                            <div className="space-y-3">
                                {usersList.filter(u => u.email.includes(userSearch) || u.full_name?.includes(userSearch)).map(u => (
                                    <div key={u.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-white">{u.full_name || 'بدون اسم'}</p>
                                                {u.role === 'admin' && <span className="text-[10px] bg-gold-500 text-navy-950 px-1.5 rounded font-bold">ADMIN</span>}
                                            </div>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded inline-block mt-1 ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {u.status === 'active' ? 'نشط' : 'في الانتظار'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {u.status === 'pending' && (
                                                <button onClick={() => approveUser(u.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-lg shadow-green-500/20">تفعيل</button>
                                            )}
                                            <button onClick={() => { setSelectedUser(u); setEnrollModalOpen(true); }} className="bg-navy-800 border border-white/10 text-white px-3 py-1 rounded text-xs hover:bg-white/5 flex items-center gap-1 transition-colors">
                                                <Unlock size={12} /> فتح كورس
                                            </button>
                                            {u.role !== 'admin' && (
                                                <button onClick={() => deleteUser(u.id)} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1">
                                                    <Trash2 size={12} /> حذف
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* MODALS */}
        
        {/* Course Modal */}
        {isCourseModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-navy-900 border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
                    <h3 className="text-xl font-bold mb-4">{editingCourse.id ? 'تعديل كورس' : 'إضافة كورس جديد'}</h3>
                    <div className="space-y-3">
                        <input placeholder="العنوان" value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                        <textarea placeholder="الوصف" value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white h-20 focus:border-gold-500 outline-none" />
                        <input placeholder="رابط الصورة" value={editingCourse.thumbnail || ''} onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                        
                        <div className="flex items-center gap-3 bg-navy-950 p-3 rounded-lg border border-white/5">
                            <input type="checkbox" checked={editingCourse.is_paid || false} onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})} className="w-5 h-5 accent-gold-500" />
                            <label className="text-white font-bold">هل الكورس مدفوع؟ (سيتم إخفاؤه عن الطلاب غير المشتركين)</label>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={saveCourse} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold hover:bg-gold-400 transition-colors">حفظ</button>
                            <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg hover:bg-white/10 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Enroll Modal */}
        {enrollModalOpen && selectedUser && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-navy-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                    <h3 className="text-xl font-bold mb-4">فتح كورس للعضو: <span className="text-gold-500">{selectedUser.full_name}</span></h3>
                    <p className="text-gray-400 text-sm mb-4">اختر الكورس المدفوع الذي تريد منح العضو صلاحية الوصول إليه.</p>
                    
                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white mb-6 focus:border-gold-500 outline-none">
                        <option value="">اختر الكورس...</option>
                        {coursesList.filter(c => c.is_paid).map(c => (
                            <option key={c.id} value={c.id}>{c.title} (مدفوع)</option>
                        ))}
                    </select>

                    <div className="flex gap-3">
                        <button onClick={enrollUser} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">تأكيد التسجيل</button>
                        <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg hover:bg-white/10 transition-colors">إلغاء</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
