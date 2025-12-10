import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson, Enrollment } from '../types';
import { calculateTotalMinutes, processVideoUrl } from '../utils/videoHelpers';
import { 
  Users, BookOpen, Settings, Plus, Trash2, 
  UserPlus, Video, X, Edit2,
  FileText, Globe, RefreshCw, CheckCircle, Unlock, ShieldCheck, Save,
  Layout, MessageSquare, Phone, Info, Image as ImageIcon, Zap, Clock, Lock,
  Youtube, Twitter, Facebook, Instagram, Send, Activity, Database, AlertTriangle,
  Server, Wifi
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings, refreshCourses } = useStore();
  const { showToast } = useToast();
  const { t } = useLanguage(); 
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'courses' | 'settings' | 'content' | 'health'>('overview');
  
  // Data Lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<Enrollment[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Settings & Content
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [editingLang, setEditingLang] = useState<'ar' | 'en'>('ar');
  const [contentSubTab, setContentSubTab] = useState<'home' | 'about' | 'contact' | 'footer'>('home');
  
  // Saving State
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);
  
  // Selection & Forms
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedUserForEnroll, setSelectedUserForEnroll] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [currentCourseLessons, setCurrentCourseLessons] = useState<Lesson[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ 
    title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: 1, is_published: true 
  });

  // Security State
  const [newPassword, setNewPassword] = useState('');

  // Diagnostics State
  const [healthStatus, setHealthStatus] = useState<{
      dbConnection: 'checking' | 'connected' | 'error';
      adminRole: 'checking' | 'verified' | 'error';
      latency: number | null;
      lastChecked: Date | null;
  }>({
      dbConnection: 'checking',
      adminRole: 'checking',
      latency: null,
      lastChecked: null
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchAllEnrollments();
    
    const profilesChannel = supabase.channel('admin_profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            fetchUsers();
            showToast('تم تحديث قائمة الأعضاء', 'info');
        })
        .subscribe();
        
    return () => { supabase.removeChannel(profilesChannel); };
  }, []);

  useEffect(() => {
    if (!savingSection) {
        setLocalSettings(siteSettings);
    }
  }, [siteSettings]);

  useEffect(() => {
      if (activeTab === 'health') {
          runDiagnostics();
      }
  }, [activeTab]);

  // --- DIAGNOSTICS ---
  const runDiagnostics = async () => {
      setHealthStatus(prev => ({ ...prev, dbConnection: 'checking', adminRole: 'checking', latency: null }));
      
      const start = performance.now();
      try {
          // 1. Check DB Connection & Latency
          const { count, error: dbError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const end = performance.now();
          
          if (dbError) throw dbError;
          
          // 2. Check Admin Role (Double Check)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .single();

          if (profileError) throw profileError;

          setHealthStatus({
              dbConnection: 'connected',
              adminRole: profile.role === 'admin' ? 'verified' : 'error',
              latency: Math.round(end - start),
              lastChecked: new Date()
          });

      } catch (e: any) {
          console.error("Diagnostics failed:", e);
          setHealthStatus(prev => ({
              ...prev,
              dbConnection: 'error',
              adminRole: 'error',
              lastChecked: new Date()
          }));
      }
  };

  // --- DATA FETCHING ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setDataError(null);
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setUsersList(data as User[]);
    } catch (e: any) {
        console.error("Error fetching users:", e);
        setDataError(e.message);
        showToast(`فشل تحميل الأعضاء: ${e.message}`, 'error');
    } finally {
        setLoadingUsers(false);
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) { setCoursesList(data as Course[]); refreshCourses(); }
  };
  
  const fetchAllEnrollments = async () => {
      const { data } = await supabase.from('enrollments').select('*');
      if (data) setEnrollmentsList(data as Enrollment[]);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
    if (data) {
        setCurrentCourseLessons(data as Lesson[]);
        if (!editingLessonId) {
            const maxOrder = data.length > 0 ? Math.max(...data.map((l: Lesson) => l.order)) : 0;
            setNewLesson(prev => ({ ...prev, order: maxOrder + 1 }));
        }
    }
  };

  // --- ACTIONS ---
  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (error) showToast(`فشل العملية: ${error.message}`, 'error');
    else {
        showToast('تم قبول العضو بنجاح', 'success');
        fetchUsers();
    }
  };

  const handleRejectUser = async (userId: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العضو نهائياً؟')) return;
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    if (error) showToast(`فشل الحذف: ${error.message}`, 'error');
    else {
        showToast('تم حذف العضو نهائياً', 'success');
        setUsersList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleEnrollUser = async () => {
      if (!selectedUserForEnroll || !selectedCourseId) return;
      const { error } = await supabase.from('enrollments').insert({
          user_id: selectedUserForEnroll.id,
          course_id: selectedCourseId
      });
      if (error) {
          if (error.code === '23505') showToast('العضو مشترك بالفعل في هذا الكورس', 'error');
          else showToast(error.message, 'error');
      } else {
          showToast('تم تسجيل العضو في الكورس بنجاح', 'success');
          setEnrollModalOpen(false);
          fetchAllEnrollments();
      }
  };

  const handleUnenroll = async (userId: string, courseId: string) => {
      if(!confirm('هل تريد إلغاء اشتراك العضو في هذا الكورس؟')) return;
      await supabase.from('enrollments').delete().match({ user_id: userId, course_id: courseId });
      showToast('تم إلغاء الاشتراك', 'success');
      fetchAllEnrollments();
  };

  const handleSaveCourse = async () => {
    if (!editingCourse.title) { showToast('يرجى كتابة عنوان الكورس', 'error'); return; }
    const courseData = {
      title: editingCourse.title, 
      description: editingCourse.description, 
      thumbnail: editingCourse.thumbnail,
      is_paid: editingCourse.is_paid || false, 
      level: editingCourse.level || 'متوسط',
      rating: editingCourse.rating || 5,
    };
    try {
        if (editingCourse.id) {
            const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('courses').insert(courseData);
            if (error) throw error;
        }
        showToast('تم حفظ الكورس بنجاح', 'success'); 
        setCourseModalOpen(false); 
        fetchCourses();
    } catch (error: any) { showToast(`خطأ في الحفظ: ${error.message}`, 'error'); }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (!confirm('هل أنت متأكد من حذف الكورس؟')) return;
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) showToast(error.message, 'error');
      else { showToast('تم حذف الكورس', 'success'); fetchCourses(); }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !newLesson.title || !newLesson.video_url) { showToast('يرجى ملء البيانات', 'error'); return; }
    const processed = processVideoUrl(newLesson.video_url);
    const lessonData = {
      course_id: selectedCourseId, 
      title: newLesson.title, 
      description: newLesson.description,
      video_url: processed.url, 
      thumbnail_url: newLesson.thumbnail_url,
      duration: newLesson.duration, 
      order: newLesson.order, 
      is_published: newLesson.is_published
    };
    try {
        if (editingLessonId) await supabase.from('lessons').update(lessonData).eq('id', editingLessonId);
        else await supabase.from('lessons').insert(lessonData);

        showToast('تم حفظ الدرس بنجاح', 'success');
        const { data: fresh } = await supabase.from('lessons').select('*').eq('course_id', selectedCourseId);
        if (fresh) {
            setCurrentCourseLessons(fresh as Lesson[]);
            const totalMins = calculateTotalMinutes(fresh as any);
            await supabase.from('courses').update({ duration: totalMins.toString() }).eq('id', selectedCourseId);
            fetchCourses();
        }
        setEditingLessonId(null);
        setNewLesson({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: (fresh?.length || 0) + 1, is_published: true });
    } catch (e: any) { showToast(`خطأ: ${e.message}`, 'error'); }
  };

  const handleSaveSection = async (sectionName: string) => {
      setSavingSection(sectionName);
      try {
          let payload: Partial<SiteSettings> = {};
          if (sectionName === 'settings') {
              payload = { site_name: localSettings.site_name, logo_url: localSettings.logo_url, maintenance_mode: localSettings.maintenance_mode, features_config: localSettings.features_config };
          } else if (sectionName === 'contact') {
              payload = { content_config: localSettings.content_config, social_links: localSettings.social_links };
          } else if (sectionName === 'home') {
              payload = { hero_title: localSettings.hero_title, hero_desc: localSettings.hero_desc, content_config: localSettings.content_config };
          } else {
              payload = { content_config: localSettings.content_config };
          }
          await updateSettings(payload);
          showToast(`تم حفظ ${getSectionName(sectionName)} بنجاح!`, 'success');
      } catch (e: any) { showToast(`خطأ في الحفظ: ${e.message}`, 'error'); } 
      finally { setSavingSection(null); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        showToast('تم تحديث كلمة المرور بنجاح', 'success');
        setNewPassword('');
    } catch (error: any) {
        showToast(`خطأ: ${error.message}`, 'error');
    }
  };

  const handleClearCache = () => {
      if(confirm('هل أنت متأكد؟ سيتم تسجيل خروجك وتحديث الصفحة.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // --- HELPERS ---
  const getSectionName = (key: string) => {
      switch(key) {
          case 'home': return 'محتوى الرئيسية';
          case 'about': return 'محتوى من نحن';
          case 'contact': return 'محتوى التواصل';
          case 'footer': return 'محتوى الفوتر';
          case 'settings': return 'الإعدادات العامة';
          default: return 'التغييرات';
      }
  };

  const updateContent = (key: string, value: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      setLocalSettings(prev => ({ ...prev, content_config: { ...(prev.content_config || {}), [langKey]: value } }));
  };

  const getContent = (key: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      return (localSettings.content_config as any)?.[langKey] || '';
  };

  const updateRoot = (key: string, value: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      setLocalSettings(prev => ({ ...prev, [langKey]: value, content_config: { ...(prev.content_config || {}), [langKey]: value } }));
  };
  
  const getRoot = (key: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      return (localSettings as any)?.[langKey] || '';
  };

  // --- COMPONENTS ---
  const SaveButton = ({ section }: { section: string }) => (
      <button onClick={() => handleSaveSection(section)} disabled={savingSection === section} className="mt-4 w-full bg-gold-500 text-navy-950 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-400 shadow-lg disabled:opacity-50 transition-all">
          {savingSection === section ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {savingSection === section ? 'جاري الحفظ...' : `حفظ التغييرات`}
      </button>
  );

  const ContentCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
      <div className="bg-navy-900/30 border border-white/5 rounded-xl p-6 hover:border-gold-500/20 transition-colors">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><div className="p-2 bg-navy-800 rounded-lg text-gold-500"><Icon size={18} /></div>{title}</h3>
          <div className="space-y-4">{children}</div>
      </div>
  );

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
      <div className={`bg-navy-900/40 border border-white/5 p-6 rounded-2xl hover:border-${color}-500/30 transition-all hover:-translate-y-1`}>
          <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}><Icon size={24} /></div>
              <span className={`text-xs font-bold px-2 py-1 rounded bg-${color}-500/10 text-${color}-500`}>محدث</span>
          </div>
          <h4 className="text-gray-400 text-sm font-bold mb-1">{title}</h4>
          <p className="text-3xl font-black text-white">{value}</p>
      </div>
  );

  if (user?.role !== 'admin') return <div className="p-10 text-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen page-padding-top pb-10 bg-navy-950" dir="rtl">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                لوحة التحكم
                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} /> اتصال آمن
                </span>
            </h1>
            <p className="text-gray-400 text-sm">إدارة الأعضاء، الكورسات، ومحتوى الموقع بالكامل</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 sticky top-44">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'نظرة عامة', icon: Layout },
                  { id: 'requests', label: 'طلبات الانضمام', icon: UserPlus, count: usersList.filter(u => u.status === 'pending').length },
                  { id: 'users', label: 'الأعضاء', icon: Users },
                  { id: 'courses', label: 'الكورسات', icon: BookOpen },
                  { id: 'content', label: 'المحتوى', icon: FileText },
                  { id: 'settings', label: 'الإعدادات', icon: Settings },
                  { id: 'health', label: 'حالة النظام', icon: Activity },
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-gold-500 text-navy-950 font-bold shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>
                    <div className="flex items-center gap-3"><item.icon size={18} /> {item.label}</div>
                    {item.count !== undefined && item.count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{item.count}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="glass-card p-6 min-h-[600px]">
               
               {/* DATA ERROR ALERT */}
               {dataError && (
                 <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <AlertTriangle size={24} />
                    <div>
                        <p className="font-bold">حدث خطأ أثناء جلب البيانات</p>
                        <p className="text-sm">{dataError}</p>
                    </div>
                    <button onClick={fetchUsers} className="mr-auto bg-red-500/20 px-3 py-1 rounded-lg text-sm hover:bg-red-500/30">إعادة المحاولة</button>
                 </div>
               )}

               {/* OVERVIEW TAB */}
               {activeTab === 'overview' && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <StatCard title="إجمالي الأعضاء" value={usersList.length} icon={Users} color="blue" />
                       <StatCard title="الأعضاء النشطين" value={usersList.filter(u => u.status === 'active').length} icon={CheckCircle} color="green" />
                       <StatCard title="طلبات الانتظار" value={usersList.filter(u => u.status === 'pending').length} icon={Clock} color="yellow" />
                       <StatCard title="إجمالي الكورسات" value={coursesList.length} icon={BookOpen} color="orange" />
                    </div>
                 </div>
               )}

               {/* REQUESTS TAB */}
               {activeTab === 'requests' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="text-gold-500" /> طلبات الانتظار</h2>
                        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm font-bold text-gold-500 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
                            <RefreshCw size={16} className={loadingUsers ? "animate-spin" : ""} /> تحديث القائمة
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                      {usersList.filter(u => u.status === 'pending').length === 0 && <p className="text-gray-500 text-center py-10">لا توجد طلبات جديدة.</p>}
                      {usersList.filter(u => u.status === 'pending').map(u => (
                        <div key={u.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{u.full_name || 'بدون اسم'}</p>
                            <p className="text-xs text-gray-400">{u.email} | {u.phone_number || 'لا يوجد هاتف'}</p>
                            <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1"><Clock size={12} /> تم التسجيل: {new Date(u.created_at || Date.now()).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1"><CheckCircle size={14} /> قبول</button>
                            <button onClick={() => handleRejectUser(u.id)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center gap-1"><Trash2 size={14} /> حذف نهائي</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* USERS TAB */}
               {activeTab === 'users' && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-gold-500" /> الأعضاء النشطين</h2>
                    <div className="space-y-3">
                      {usersList.filter(u => u.status === 'active').map(u => (
                        <div key={u.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                             <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gold-500 font-bold border border-white/10">
                                {u.email.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-bold text-white text-sm">{u.full_name || u.email}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 justify-center">
                              {enrollmentsList.filter(e => e.user_id === u.id).map(e => {
                                  const course = coursesList.find(c => c.id === e.course_id);
                                  return (
                                      <span key={e.id} className="text-[10px] bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors" onClick={() => handleUnenroll(u.id, e.course_id)} title="إلغاء الاشتراك">
                                          <Unlock size={10} /> {course?.title.substring(0, 15)}...
                                      </span>
                                  );
                              })}
                          </div>

                          <div className="flex items-center gap-2">
                             <button onClick={() => { setSelectedUserForEnroll(u); setEnrollModalOpen(true); }} className="bg-navy-800 text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/10 hover:bg-white/5 flex items-center gap-1">
                                <Plus size={14} /> تسجيل في كورس
                             </button>
                             {u.role !== 'admin' && (
                                <button onClick={() => handleRejectUser(u.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg" title="حذف العضو نهائياً"><Trash2 size={16} /></button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               
               {/* COURSES TAB */}
               {activeTab === 'courses' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">إدارة الكورسات</h2>
                      <button onClick={() => { setEditingCourse({}); setCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                        <Plus size={16} /> إضافة كورس جديد
                      </button>
                    </div>
                    <div className="space-y-4">
                      {coursesList.map(course => (
                        <div key={course.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-10 bg-black rounded overflow-hidden">
                               {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                             </div>
                             <div>
                               <h3 className="font-bold text-white text-sm">{course.title}</h3>
                               <div className="flex gap-2 text-[10px]">
                                   <span className={`px-1.5 rounded ${course.is_paid ? 'bg-gold-500/10 text-gold-400' : 'bg-green-500/10 text-green-400'}`}>{course.is_paid ? 'مدفوع' : 'مجاني'}</span>
                                   <span className="text-gray-500">{course.lesson_count || 0} درس</span>
                               </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => { setSelectedCourseId(course.id); fetchLessons(course.id); setLessonsModalOpen(true); }} className="bg-navy-800 text-white px-3 py-1.5 rounded text-xs border border-white/10">الدروس</button>
                             <button onClick={() => { setEditingCourse(course); setCourseModalOpen(true); }} className="bg-navy-800 text-gold-400 px-3 py-1.5 rounded text-xs border border-white/10">تعديل</button>
                             <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs border border-red-500/20 hover:bg-red-500/20">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               
               {/* CONTENT TAB */}
               {activeTab === 'content' && (
                 <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 bg-navy-900 p-3 rounded-xl border border-white/10">
                        <span className="text-sm font-bold text-gray-300 flex items-center gap-2"><Globe size={16} /> لغة التعديل:</span>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLang('ar')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'ar' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>العربية</button>
                            <button onClick={() => setEditingLang('en')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'en' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>English</button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/5">
                        {[
                            {id: 'home', label: 'الرئيسية'},
                            {id: 'about', label: 'من نحن'},
                            {id: 'contact', label: 'تواصل معنا'},
                            {id: 'footer', label: 'الفوتر'},
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setContentSubTab(tab.id as any)} className={`px-4 py-2 rounded-t-lg text-sm font-bold ${contentSubTab === tab.id ? 'bg-white/10 text-gold-400 border-b-2 border-gold-500' : 'text-gray-400 hover:text-white'}`}>{tab.label}</button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {contentSubTab === 'home' && (
                            <div className="space-y-6">
                                <ContentCard title="قسم الهيرو (الواجهة)" icon={Layout}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block">العنوان (السطر 1)</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors" value={getContent('hero_title_line1')} onChange={e => updateContent('hero_title_line1', e.target.value)} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block">العنوان (السطر 2 - ذهبي)</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors" value={getContent('hero_title_line2')} onChange={e => updateContent('hero_title_line2', e.target.value)} /></div>
                                    </div>
                                    <div><label className="text-xs text-gray-400 mb-1 block">الوصف</label><textarea className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white h-24 focus:border-gold-500 outline-none transition-colors" value={getRoot('hero_desc')} onChange={e => updateRoot('hero_desc', e.target.value)} /></div>
                                </ContentCard>

                                <ContentCard title="قسم الدعوة (CTA)" icon={MessageSquare}>
                                    <div><label className="text-xs text-gray-400 mb-1 block">العنوان</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors" value={getContent('cta_title')} onChange={e => updateContent('cta_title', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400 mb-1 block">الوصف</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors" value={getContent('cta_desc')} onChange={e => updateContent('cta_desc', e.target.value)} /></div>
                                </ContentCard>

                                <ContentCard title="كارت قريباً (Master Class Pro)" icon={Lock}>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block">العنوان</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('coming_soon_title')} onChange={e => updateContent('coming_soon_title', e.target.value)} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block">الشارة (Badge)</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('coming_soon_badge')} onChange={e => updateContent('coming_soon_badge', e.target.value)} /></div>
                                    </div>
                                    <div className="mb-4"><label className="text-xs text-gray-400 mb-1 block">الوصف</label><textarea className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white h-20" value={getContent('coming_soon_desc')} onChange={e => updateContent('coming_soon_desc', e.target.value)} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block">ميزة 1</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('coming_soon_feature_1')} onChange={e => updateContent('coming_soon_feature_1', e.target.value)} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block">ميزة 2</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('coming_soon_feature_2')} onChange={e => updateContent('coming_soon_feature_2', e.target.value)} /></div>
                                    </div>
                                </ContentCard>
                                
                                <SaveButton section="home" />
                            </div>
                        )}

                        {contentSubTab === 'about' && (
                            <div className="space-y-6">
                                <ContentCard title="المعلومات الرئيسية" icon={Info}>
                                    <div><label className="text-xs text-gray-400 mb-1 block">العنوان الرئيسي</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('about_main_title')} onChange={e => updateContent('about_main_title', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400 mb-1 block">الوصف الرئيسي</label><textarea className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white h-24" value={getContent('about_main_desc')} onChange={e => updateContent('about_main_desc', e.target.value)} /></div>
                                </ContentCard>

                                <ContentCard title="الرؤية والمهمة" icon={CheckCircle}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block">عنوان المهمة</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('mission_title')} onChange={e => updateContent('mission_title', e.target.value)} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block">عنوان الرؤية</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('vision_title')} onChange={e => updateContent('vision_title', e.target.value)} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block">وصف المهمة</label><textarea className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white h-20" value={getContent('mission_desc')} onChange={e => updateContent('mission_desc', e.target.value)} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block">وصف الرؤية</label><textarea className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white h-20" value={getContent('vision_desc')} onChange={e => updateContent('vision_desc', e.target.value)} /></div>
                                    </div>
                                </ContentCard>
                                
                                <SaveButton section="about" />
                            </div>
                        )}
                        
                        {contentSubTab === 'contact' && (
                             <div className="space-y-6">
                                <ContentCard title="معلومات التواصل" icon={Phone}>
                                    <div><label className="text-xs text-gray-400 mb-1 block">العنوان الرئيسي</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('contact_main_title')} onChange={e => updateContent('contact_main_title', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400 mb-1 block">الوصف</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('contact_main_desc')} onChange={e => updateContent('contact_main_desc', e.target.value)} /></div>
                                </ContentCard>
                                
                                <ContentCard title="روابط التواصل الاجتماعي" icon={Globe}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Facebook size={12} /> فيسبوك</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.facebook || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, facebook: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Instagram size={12} /> انستجرام</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.instagram || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, instagram: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Send size={12} /> تيليجرام</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.telegram || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, telegram: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Phone size={12} /> واتساب</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.whatsapp || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, whatsapp: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Video size={12} /> تيك توك</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.tiktok || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, tiktok: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Youtube size={12} /> يوتيوب</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.youtube || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, youtube: e.target.value}})} /></div>
                                        <div><label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Twitter size={12} /> تويتر (X)</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.social_links?.twitter || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, twitter: e.target.value}})} /></div>
                                    </div>
                                </ContentCard>
                                
                                <SaveButton section="contact" />
                             </div>
                        )}
                        
                        {contentSubTab === 'footer' && (
                             <div className="space-y-6">
                                <ContentCard title="تذييل الموقع" icon={Layout}>
                                    <div><label className="text-xs text-gray-400 mb-1 block">شعار الفوتر (Tagline)</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('footer_tagline')} onChange={e => updateContent('footer_tagline', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400 mb-1 block">النص الفرعي</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={getContent('footer_sub_tagline')} onChange={e => updateContent('footer_sub_tagline', e.target.value)} /></div>
                                </ContentCard>
                                
                                <SaveButton section="footer" />
                             </div>
                        )}
                    </div>
                 </div>
               )}

               {/* SETTINGS TAB */}
               {activeTab === 'settings' && (
                   <div className="animate-fade-in space-y-6">
                       <h2 className="text-xl font-bold mb-6">الإعدادات العامة</h2>
                       
                       <ContentCard title="أمان الحساب" icon={Lock}>
                           <div>
                               <label className="text-xs text-gray-400 mb-1 block">تغيير كلمة المرور</label>
                               <div className="flex gap-3">
                                   <input 
                                       type="password" 
                                       placeholder="كلمة المرور الجديدة" 
                                       value={newPassword} 
                                       onChange={e => setNewPassword(e.target.value)} 
                                       className="flex-1 bg-navy-950 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors" 
                                   />
                                   <button 
                                       onClick={handleUpdatePassword}
                                       disabled={!newPassword}
                                       className="bg-navy-800 text-white px-6 rounded-lg font-bold border border-white/10 hover:bg-gold-500 hover:text-navy-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                       تحديث
                                   </button>
                               </div>
                               <p className="text-xs text-gray-500 mt-2">يجب أن تكون كلمة المرور 6 أحرف على الأقل.</p>
                           </div>
                       </ContentCard>

                       <ContentCard title="الهوية البصرية" icon={ImageIcon}>
                           <div><label className="text-xs text-gray-400 mb-1 block">اسم الموقع</label><input className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.site_name} onChange={e => setLocalSettings({...localSettings, site_name: e.target.value})} /></div>
                           <div className="mt-4"><label className="text-xs text-gray-400 mb-1 block">رابط الشعار (Logo URL)</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded-lg p-3 text-white" value={localSettings.logo_url} onChange={e => setLocalSettings({...localSettings, logo_url: e.target.value})} /></div>
                       </ContentCard>
                       
                       <ContentCard title="التحكم في الميزات" icon={Settings}>
                           <div className="grid grid-cols-2 gap-4">
                               <div className="flex items-center gap-3 bg-navy-950 p-4 rounded-lg border border-white/5 hover:border-gold-500/20 transition-colors">
                                   <input type="checkbox" checked={localSettings.features_config?.show_coming_soon} onChange={e => setLocalSettings({...localSettings, features_config: {...localSettings.features_config, show_coming_soon: e.target.checked}})} className="accent-gold-500 w-5 h-5" />
                                   <label className="text-sm text-white font-bold">إظهار قسم "قريباً"</label>
                               </div>
                               <div className="flex items-center gap-3 bg-navy-950 p-4 rounded-lg border border-white/5 hover:border-gold-500/20 transition-colors">
                                   <input type="checkbox" checked={localSettings.features_config?.show_stats} onChange={e => setLocalSettings({...localSettings, features_config: {...localSettings.features_config, show_stats: e.target.checked}})} className="accent-gold-500 w-5 h-5" />
                                   <label className="text-sm text-white font-bold">إظهار الإحصائيات</label>
                               </div>
                           </div>
                       </ContentCard>
                       
                       <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl mt-8">
                           <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2"><ShieldCheck size={20} /> وضع الصيانة</h3>
                           <p className="text-gray-400 text-sm mb-4">عند التفعيل، لن يتمكن أحد من دخول الموقع سوى المشرفين. استخدم هذا الوضع عند إجراء تحديثات كبيرة.</p>
                           <div className="flex items-center gap-3 bg-navy-950/50 p-4 rounded-lg border border-red-500/10">
                               <input type="checkbox" checked={localSettings.maintenance_mode || false} onChange={e => setLocalSettings({...localSettings, maintenance_mode: e.target.checked})} className="accent-red-500 w-5 h-5" />
                               <label className="text-white font-bold">تفعيل وضع الصيانة</label>
                           </div>
                       </div>
                       
                       <SaveButton section="settings" />
                   </div>
               )}

               {/* HEALTH TAB (LIVE DIAGNOSTICS) */}
               {activeTab === 'health' && (
                   <div className="animate-fade-in space-y-6">
                       <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-gold-500" /> حالة النظام (Live)</h2>
                           <button onClick={runDiagnostics} className="text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                               <RefreshCw size={14} className={healthStatus.dbConnection === 'checking' ? 'animate-spin' : ''} /> إعادة الفحص
                           </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* DB Connection */}
                           <div className={`p-6 rounded-xl border ${healthStatus.dbConnection === 'connected' ? 'bg-green-500/10 border-green-500/20' : healthStatus.dbConnection === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-navy-900/50 border-white/5'}`}>
                               <h3 className={`font-bold mb-2 flex items-center gap-2 ${healthStatus.dbConnection === 'connected' ? 'text-green-400' : healthStatus.dbConnection === 'error' ? 'text-red-400' : 'text-white'}`}>
                                   <Database size={18} /> اتصال قاعدة البيانات
                               </h3>
                               <div className="flex items-center gap-2 mt-4">
                                   {healthStatus.dbConnection === 'checking' && <span className="text-gray-400 text-sm flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> جاري الاتصال...</span>}
                                   {healthStatus.dbConnection === 'connected' && <span className="text-green-400 font-bold text-sm flex items-center gap-2"><CheckCircle size={14} /> متصل بنجاح</span>}
                                   {healthStatus.dbConnection === 'error' && <span className="text-red-400 font-bold text-sm flex items-center gap-2"><X size={14} /> فشل الاتصال</span>}
                               </div>
                               {healthStatus.latency !== null && <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Wifi size={10} /> زمن الاستجابة: {healthStatus.latency}ms</p>}
                           </div>

                           {/* Admin Role */}
                           <div className={`p-6 rounded-xl border ${healthStatus.adminRole === 'verified' ? 'bg-blue-500/10 border-blue-500/20' : healthStatus.adminRole === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-navy-900/50 border-white/5'}`}>
                               <h3 className={`font-bold mb-2 flex items-center gap-2 ${healthStatus.adminRole === 'verified' ? 'text-blue-400' : healthStatus.adminRole === 'error' ? 'text-red-400' : 'text-white'}`}>
                                   <ShieldCheck size={18} /> صلاحيات المشرف
                               </h3>
                               <div className="flex items-center gap-2 mt-4">
                                   {healthStatus.adminRole === 'checking' && <span className="text-gray-400 text-sm flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> جاري التحقق...</span>}
                                   {healthStatus.adminRole === 'verified' && <span className="text-blue-400 font-bold text-sm flex items-center gap-2"><CheckCircle size={14} /> تم التحقق (Admin)</span>}
                                   {healthStatus.adminRole === 'error' && <span className="text-red-400 font-bold text-sm flex items-center gap-2"><X size={14} /> صلاحيات غير صحيحة</span>}
                               </div>
                               <p className="text-xs text-gray-500 mt-2">Security Definer: Active</p>
                           </div>
                       </div>

                       <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl">
                           <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={20} /> أدوات الطوارئ</h3>
                           <div className="flex flex-wrap gap-3">
                               <button onClick={handleClearCache} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/30 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm">
                                   <RefreshCw size={16} /> مسح الذاكرة المؤقتة (Clear Cache)
                               </button>
                               <button onClick={() => window.location.reload()} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm">
                                   <Server size={16} /> إعادة تحميل التطبيق
                               </button>
                           </div>
                       </div>
                   </div>
               )}
            </div>
          </div>
        </div>

        {/* Modals (Enroll, Course, Lessons) remain the same */}
        {enrollModalOpen && selectedUserForEnroll && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">تسجيل العضو: <span className="text-gold-500">{selectedUserForEnroll.full_name || selectedUserForEnroll.email}</span></h3>
                <div className="space-y-4">
                    <select value={selectedCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white">
                        <option value="">اختر الكورس</option>
                        {coursesList.filter(c => c.is_paid).map(c => <option key={c.id} value={c.id}>{c.title} (مدفوع)</option>)}
                        {coursesList.filter(c => !c.is_paid).map(c => <option key={c.id} value={c.id}>{c.title} (مجاني)</option>)}
                    </select>
                    <div className="flex gap-3">
                        <button onClick={handleEnrollUser} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">تأكيد التسجيل</button>
                        <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg">إلغاء</button>
                    </div>
                </div>
             </div>
           </div>
        )}
        
        {courseModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">{editingCourse.id ? 'تعديل الكورس' : 'إضافة كورس جديد'}</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="عنوان الكورس" value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white" />
                    <textarea placeholder="وصف الكورس" value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white h-24" />
                    <input type="text" dir="ltr" placeholder="رابط الصورة المصغرة (Thumbnail URL)" value={editingCourse.thumbnail || ''} onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white text-left" />
                    <div className="flex gap-2">
                        <select value={editingCourse.level || 'متوسط'} onChange={e => setEditingCourse({...editingCourse, level: e.target.value as any})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white flex-1">
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="متوسط">متوسط</option>
                            <option value="خبير">خبير</option>
                        </select>
                        <input type="number" placeholder="التقييم" value={editingCourse.rating || 5} onChange={e => setEditingCourse({...editingCourse, rating: parseFloat(e.target.value)})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white w-24 text-center" />
                    </div>
                    <div className="flex items-center gap-2 bg-navy-900 p-3 rounded border border-white/5">
                        <input type="checkbox" checked={editingCourse.is_paid || false} onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})} className="accent-gold-500 w-5 h-5" />
                        <label className="text-white text-sm font-bold">هل الكورس مدفوع؟ (يتطلب اشتراك)</label>
                    </div>
                    <button onClick={handleSaveCourse} className="w-full bg-gold-500 text-navy-950 py-3 rounded-xl font-bold mt-2">حفظ</button>
                    <button onClick={() => setCourseModalOpen(false)} className="w-full bg-white/5 text-white py-3 rounded-xl font-bold">إلغاء</button>
                </div>
             </div>
           </div>
        )}
        
        {lessonsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="glass-card p-6 max-w-5xl w-full border-gold-500/30 shadow-2xl h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Video className="text-gold-500" /> إدارة الدروس</h3>
                 <button onClick={() => setLessonsModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                 <div className="lg:w-1/3 bg-navy-900/50 p-5 rounded-xl border border-white/5 shrink-0 overflow-y-auto custom-scrollbar">
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                        {editingLessonId ? 'تعديل الدرس' : 'إضافة درس جديد'}
                        {editingLessonId && <button onClick={() => { setEditingLessonId(null); setNewLesson({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: (currentCourseLessons.length || 0) + 1, is_published: true }); }} className="text-[10px] text-gold-500">إلغاء التعديل</button>}
                    </h4>
                    <div className="space-y-3">
                        <input type="text" placeholder="عنوان الدرس" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white" />
                        <textarea placeholder="وصف الدرس" value={newLesson.description || ''} onChange={e => setNewLesson({...newLesson, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white h-20" />
                        <textarea dir="ltr" placeholder="رابط الفيديو (يوتيوب / Embed)" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white h-24 text-left" />
                        <input type="text" dir="ltr" placeholder="رابط الصورة المصغرة" value={newLesson.thumbnail_url || ''} onChange={e => setNewLesson({...newLesson, thumbnail_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-left" />
                        <div className="flex gap-2">
                            <input type="text" dir="ltr" placeholder="المدة (00:00)" value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" />
                            <input type="number" placeholder="الترتيب" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" />
                        </div>
                        <button onClick={handleSaveLesson} className="w-full bg-gold-500 text-navy-950 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-gold-400">حفظ الدرس</button>
                    </div>
                 </div>
                 <div className="lg:w-2/3 bg-navy-950 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 bg-navy-900 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">قائمة الدروس ({currentCourseLessons.length})</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {currentCourseLessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-navy-900/50 border-white/5 hover:border-gold-500/20">
                                <div className="text-gray-500 font-mono text-xs w-6 text-center">{lesson.order}</div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-white font-bold text-sm truncate">{lesson.title}</h5>
                                    <span className="text-gray-500 text-[10px]">{lesson.duration}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingLessonId(lesson.id!); setNewLesson(lesson); }} className="text-gold-400 p-2 hover:bg-gold-500/10 rounded"><Edit2 size={14} /></button>
                                    <button onClick={async () => { if(confirm('حذف الدرس؟')) { await supabase.from('lessons').delete().eq('id', lesson.id); fetchLessons(selectedCourseId!); }}} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
