import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson } from '../types';
import { calculateTotalMinutes, processVideoUrl } from '../utils/videoHelpers';
import { 
  Users, BookOpen, Settings, Plus, Trash2, 
  UserPlus, Video, X, PlayCircle, Edit2,
  FileText, Image as ImageIcon, Code,
  Globe, RefreshCw, ShieldAlert, Database, Wifi, WifiOff
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings, refreshCourses } = useStore();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'courses' | 'settings' | 'content'>('requests');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // System Health
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Language Toggle for Editing
  const [editingLang, setEditingLang] = useState<'ar' | 'en'>('ar');

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);
  
  // Selection
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollEmail, setEnrollEmail] = useState('');
  
  // Editing
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [currentCourseLessons, setCurrentCourseLessons] = useState<Lesson[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  
  // Lesson Form
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ 
    title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: 1, is_published: true 
  });
  
  // Content Sub-tabs
  const [contentSubTab, setContentSubTab] = useState<'home' | 'about' | 'contact' | 'courses'>('home');

  // Initial Fetch
  useEffect(() => {
    checkDbConnection();
    fetchUsers();
    fetchCourses();
    
    // Real-time users update (Robust Listener)
    const profilesChannel = supabase.channel('admin_profiles_list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setUsersList(prev => [payload.new as User, ...prev]);
            } else if (payload.eventType === 'DELETE') {
                setUsersList(prev => prev.filter(u => u.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
                setUsersList(prev => prev.map(u => u.id === payload.new.id ? (payload.new as User) : u));
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(profilesChannel);
    };
  }, []);

  // Sync Settings
  useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const checkDbConnection = async () => {
    setDbStatus('checking');
    try {
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('connected');
    } catch (err) {
        console.error("DB Check Failed:", err);
        setDbStatus('disconnected');
    }
  };

  const fetchUsers = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsersList(data as User[]);
    setIsRefreshing(false);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) {
        setCoursesList(data as Course[]);
        refreshCourses(); // Sync global store
    }
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

  const handleApproveUser = async (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (error) {
        showToast(`Failed: ${error.message}`, 'error');
        fetchUsers();
    } else { 
        showToast('User approved', 'success'); 
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if(!confirm(t('confirm_delete_user'))) return;
    
    const previousList = [...usersList];
    setUsersList(prev => prev.filter(u => u.id !== userId));
    
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    
    if (error) {
        console.error("Delete error:", error);
        showToast(`${t('delete_failed')}: ${error.message}`, 'error');
        setUsersList(previousList);
    } else { 
        showToast(t('user_deleted'), 'success'); 
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedCourseId || !enrollEmail) return;
    const targetUser = usersList.find(u => u.email === enrollEmail);
    if (!targetUser) { showToast('User not found', 'error'); return; }
    const { error } = await supabase.from('enrollments').insert({ user_id: targetUser.id, course_id: selectedCourseId });
    if (error) showToast('Error: User might already be enrolled', 'error');
    else { showToast('User enrolled successfully', 'success'); setEnrollEmail(''); setEnrollModalOpen(false); }
  };

  const handleSaveCourse = async () => {
    if (!editingCourse.title || !editingCourse.description) { showToast('Please fill required fields', 'error'); return; }
    const courseData = {
      title: editingCourse.title, description: editingCourse.description, thumbnail: editingCourse.thumbnail,
      is_paid: editingCourse.is_paid || false, level: editingCourse.level || 'متوسط',
      duration: editingCourse.duration || '0', rating: editingCourse.rating || 5,
    };
    try {
        if (editingCourse.id) await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
        else await supabase.from('courses').insert(courseData);
        showToast('Course saved', 'success'); setCourseModalOpen(false); fetchCourses();
    } catch (error: any) { showToast(`Error: ${error.message}`, 'error'); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete course and all lessons?')) return;
    await supabase.from('courses').delete().eq('id', id);
    showToast('Course deleted', 'success'); fetchCourses();
  };

  const openCourseModal = (course?: Course) => {
    setEditingCourse(course || { is_paid: true, rating: 5, level: 'متوسط', duration: '0' });
    setCourseModalOpen(true);
  };

  const openLessonsModal = async (courseId: string) => {
    setSelectedCourseId(courseId);
    await fetchLessons(courseId);
    resetLessonForm();
    setLessonsModalOpen(true);
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setNewLesson({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: (currentCourseLessons.length || 0) + 1, is_published: true });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id!);
    setNewLesson({ ...lesson });
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !newLesson.title || !newLesson.video_url) {
        showToast('Title and Video URL required', 'error');
        return;
    }
    
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

    if (editingLessonId) {
        const { error } = await supabase.from('lessons').update(lessonData).eq('id', editingLessonId);
        if (error) { showToast(error.message, 'error'); return; }
    } else {
        const { error } = await supabase.from('lessons').insert(lessonData);
        if (error) { showToast(error.message, 'error'); return; }
    }

    showToast('Lesson saved', 'success');
    
    const { data: freshLessons } = await supabase.from('lessons').select('*').eq('course_id', selectedCourseId).order('order', { ascending: true });
    
    if (freshLessons) {
        setCurrentCourseLessons(freshLessons as Lesson[]);
        const totalMinutes = calculateTotalMinutes(freshLessons as any);
        await supabase.from('courses').update({ duration: totalMinutes.toString() }).eq('id', selectedCourseId);
        fetchCourses();
    }

    resetLessonForm();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete lesson?')) return;
    await supabase.from('lessons').delete().eq('id', lessonId);
    
    const { data: freshLessons } = await supabase.from('lessons').select('*').eq('course_id', selectedCourseId!).order('order', { ascending: true });
    if (freshLessons) {
        setCurrentCourseLessons(freshLessons as Lesson[]);
        const totalMinutes = calculateTotalMinutes(freshLessons as any);
        await supabase.from('courses').update({ duration: totalMinutes.toString() }).eq('id', selectedCourseId!);
        fetchCourses();
    }
    
    showToast('Lesson deleted', 'success');
  };
  
  const handleSaveSettings = async () => {
      await updateSettings(localSettings);
      showToast('Settings saved successfully', 'success');
  };

  const updateRootSetting = (baseKey: 'hero_title' | 'hero_desc' | 'hero_title_line1' | 'hero_title_line2', value: string) => {
      const key = editingLang === 'en' ? `${baseKey}_en` : baseKey;
      setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const getRootSetting = (baseKey: 'hero_title' | 'hero_desc' | 'hero_title_line1' | 'hero_title_line2') => {
      const key = editingLang === 'en' ? `${baseKey}_en` : baseKey;
      return (localSettings as any)[key] || '';
  };

  if (user?.role !== 'admin') return <div className="min-h-screen flex items-center justify-center text-white">Access Denied</div>;

  return (
    <div className="min-h-screen page-padding-top pb-10 bg-navy-950" dir="rtl">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{t('admin_panel')}</h1>
            <p className="text-gray-400 text-sm">{t('admin_desc')}</p>
          </div>
          <div className="flex items-center gap-3">
             {/* DB Status Indicator */}
             <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                 dbStatus === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                 dbStatus === 'checking' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                 'bg-red-500/10 text-red-400 border-red-500/20'
             }`}>
                {dbStatus === 'connected' ? <Wifi size={14} /> : dbStatus === 'checking' ? <RefreshCw size={14} className="animate-spin" /> : <WifiOff size={14} />}
                {dbStatus === 'connected' ? 'System Online' : dbStatus === 'checking' ? 'Checking...' : 'System Offline'}
             </div>
             <button onClick={checkDbConnection} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400" title="Retry Connection">
                <RefreshCw size={16} />
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 sticky top-44">
              <nav className="space-y-2">
                {[
                  { id: 'requests', label: t('requests'), icon: UserPlus },
                  { id: 'users', label: t('users'), icon: Users },
                  { id: 'courses', label: t('courses'), icon: BookOpen },
                  { id: 'content', label: t('content'), icon: FileText },
                  { id: 'settings', label: t('settings'), icon: Settings },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)} 
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-gold-500 text-navy-950 font-bold' : 'hover:bg-white/5 text-gray-300'}`}
                  >
                    <item.icon size={18} /> {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="glass-card p-6 min-h-[600px]">
               
               {/* REQUESTS TAB */}
               {activeTab === 'requests' && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6">{t('requests')}</h2>
                    <div className="space-y-4">
                      {usersList.filter(u => u.status === 'pending').length === 0 && <p className="text-gray-500 text-center py-10">No new requests</p>}
                      {usersList.filter(u => u.status === 'pending').map(u => (
                        <div key={u.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{u.full_name || u.email}</p>
                            <p className="text-xs text-gray-400">{u.email} | {u.phone_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600">Approve</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* USERS TAB */}
               {activeTab === 'users' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-3">
                          {t('users')} 
                          <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">{usersList.length}</span>
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={fetchUsers} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400" title="Refresh List">
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setEnrollModalOpen(true)} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                            <Plus size={16} /> Enroll
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {usersList.map(u => (
                        <div key={u.id} className={`bg-navy-900/50 p-4 rounded-xl border flex justify-between items-center hover:border-gold-500/20 transition-colors group ${u.email === 'admin@sniperfx.com' ? 'border-gold-500/30 bg-gold-500/5' : 'border-white/5'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                             <div>
                                <p className="font-bold text-white text-sm flex items-center gap-2">
                                    {u.full_name || 'No Name'}
                                    {u.email === 'admin@sniperfx.com' && <ShieldAlert size={14} className="text-gold-500" />}
                                </p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{u.role}</span>
                             
                             {/* PROTECT ADMIN FROM DELETION IN UI */}
                             {u.email !== 'admin@sniperfx.com' && (
                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors" title={t('delete')}>
                                    <Trash2 size={16} />
                                </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* COURSES TAB & OTHERS (Unchanged Logic) */}
               {activeTab === 'courses' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">{t('courses')}</h2>
                      <button onClick={() => openCourseModal()} className="bg-gold-500 text-navy-950 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-400 transition-colors">
                        <Plus size={18} /> {t('add_course')}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {coursesList.map(course => (
                        <div key={course.id} className="bg-navy-900/50 p-5 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 bg-navy-800 rounded-lg overflow-hidden shrink-0">
                               {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                             </div>
                             <div>
                               <h3 className="font-bold text-white">{course.title}</h3>
                               <span className="text-xs text-gray-500">{course.lesson_count || 0} {t('lessons_count')} | {course.duration || '0'} min</span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => openLessonsModal(course.id)} className="bg-navy-800 text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/10 hover:bg-white/5">{t('lessons')}</button>
                             <button onClick={() => openCourseModal(course)} className="bg-navy-800 text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/10 hover:bg-white/5">{t('edit')}</button>
                             <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500/20">{t('delete')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* CONTENT & SETTINGS TABS (Same as before) */}
               {activeTab === 'content' && (
                 <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 bg-navy-900 p-3 rounded-xl border border-white/10">
                        <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Globe size={16} /> {t('lang_edit')}:
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLang('ar')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'ar' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>{t('arabic')}</button>
                            <button onClick={() => setEditingLang('en')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'en' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>{t('english')}</button>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        <button onClick={() => setContentSubTab('home')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${contentSubTab === 'home' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('home')}</button>
                        <button onClick={() => setContentSubTab('about')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${contentSubTab === 'about' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('about')}</button>
                        <button onClick={() => setContentSubTab('contact')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${contentSubTab === 'contact' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('contact')}</button>
                        <button onClick={() => setContentSubTab('courses')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${contentSubTab === 'courses' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>{t('courses')}</button>
                    </div>
                    <div className="space-y-6">
                        {contentSubTab === 'home' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="font-bold text-gold-500 mb-2">Hero Section Texts</h3>
                                <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">Title Line 1</label>
                                    <input type="text" value={getRootSetting('hero_title_line1')} onChange={e => updateRootSetting('hero_title_line1', e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-white" />
                                </div>
                                <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">Title Line 2 (Gold)</label>
                                    <input type="text" value={getRootSetting('hero_title_line2')} onChange={e => updateRootSetting('hero_title_line2', e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-white" />
                                </div>
                                <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">Description</label>
                                    <textarea value={getRootSetting('hero_desc')} onChange={e => updateRootSetting('hero_desc', e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-white h-20" />
                                </div>
                            </div>
                        )}
                        <button onClick={handleSaveSettings} className="mt-6 bg-gold-500 text-navy-950 px-8 py-3 rounded-xl font-bold w-full hover:bg-gold-400 shadow-lg">{t('save_changes')}</button>
                    </div>
                 </div>
               )}
               
               {activeTab === 'settings' && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6">{t('settings')}</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Site Name</label>
                            <input type="text" value={localSettings.site_name} onChange={e => setLocalSettings({...localSettings, site_name: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Logo URL</label>
                                <input type="text" dir="ltr" value={localSettings.logo_url} onChange={e => setLocalSettings({...localSettings, logo_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white text-left" />
                            </div>
                        </div>
                        <button onClick={handleSaveSettings} className="bg-gold-500 text-navy-950 px-8 py-3 rounded-xl font-bold mt-6 hover:bg-gold-400 w-full">{t('save_changes')}</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Modals (Lessons, Enroll, Course) - Kept identical to previous */}
        {lessonsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="glass-card p-6 max-w-5xl w-full border-gold-500/30 shadow-2xl h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Video className="text-gold-500" /> {t('lessons')}
                 </h3>
                 <button onClick={() => setLessonsModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                 <div className="lg:w-1/3 bg-navy-900/50 p-5 rounded-xl border border-white/5 shrink-0 overflow-y-auto custom-scrollbar">
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                        {editingLessonId ? 'Edit Lesson' : 'New Lesson'}
                        {editingLessonId && <button onClick={resetLessonForm} className="text-[10px] text-gold-500">Cancel</button>}
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">Title</label>
                            <input type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Description</label>
                            <textarea value={newLesson.description || ''} onChange={e => setNewLesson({...newLesson, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none h-20" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 flex items-center gap-1"><Code size={12} /> Video URL / Embed Code</label>
                            <textarea dir="ltr" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none text-left h-24" placeholder="Direct Link or <iframe...>" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 flex items-center gap-1"><ImageIcon size={12} /> Thumbnail URL</label>
                            <input type="text" dir="ltr" value={newLesson.thumbnail_url || ''} onChange={e => setNewLesson({...newLesson, thumbnail_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none text-left" placeholder="https://..." />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">Duration (MM:SS)</label>
                                <input type="text" dir="ltr" value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" placeholder="10:00" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">Order</label>
                                <input type="number" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" checked={newLesson.is_published} onChange={e => setNewLesson({...newLesson, is_published: e.target.checked})} className="accent-gold-500" />
                            <label className="text-xs text-white">Publish</label>
                        </div>
                        <button onClick={handleSaveLesson} className="w-full bg-gold-500 text-navy-950 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-gold-400">
                            {editingLessonId ? 'Save Changes' : 'Add Lesson'}
                        </button>
                    </div>
                 </div>
                 <div className="lg:w-2/3 bg-navy-950 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 bg-navy-900 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">Lesson List ({currentCourseLessons.length})</h4>
                        <span className="text-xs text-gold-500">Total: {calculateTotalMinutes(currentCourseLessons as any)} mins</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {currentCourseLessons.map((lesson) => (
                            <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${editingLessonId === lesson.id ? 'bg-gold-500/10 border-gold-500/30' : 'bg-navy-900/50 border-white/5 hover:border-gold-500/20'}`}>
                                <div className="text-gray-500 font-mono text-xs w-6 text-center">{lesson.order}</div>
                                <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0 overflow-hidden">
                                    {lesson.thumbnail_url ? <img src={lesson.thumbnail_url} className="w-full h-full object-cover" /> : <PlayCircle size={20} className="text-gray-600 group-hover:text-gold-500 transition-colors" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-white font-bold text-sm truncate">{lesson.title}</h5>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm px-1.5 rounded ${lesson.is_published ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {lesson.is_published ? t('published') : t('draft')}
                                        </span>
                                        <span className="text-gray-500 text-[10px] truncate dir-ltr">{lesson.duration}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditLesson(lesson)} className="text-gold-400 p-2 hover:bg-gold-500/10 rounded"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteLesson(lesson.id!)} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
        {enrollModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">Enroll Student</h3>
                <div className="space-y-4">
                    <select value={selectedCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white">
                        <option value="">Select Course</option>
                        {coursesList.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <input type="email" placeholder="student@example.com" value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white" />
                    <div className="flex gap-3">
                        <button onClick={handleAddEnrollment} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">Enroll</button>
                        <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg">Cancel</button>
                    </div>
                </div>
             </div>
           </div>
        )}
        {courseModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">{editingCourse.id ? 'Edit Course' : 'New Course'}</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="Title" value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white" />
                    <textarea placeholder="Description" value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white h-24" />
                    <input type="text" dir="ltr" placeholder="Thumbnail URL" value={editingCourse.thumbnail || ''} onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white text-left" />
                    <div className="flex gap-2">
                        <select value={editingCourse.level || 'متوسط'} onChange={e => setEditingCourse({...editingCourse, level: e.target.value as any})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white flex-1">
                            <option value="مبتدئ">Beginner</option>
                            <option value="متوسط">Intermediate</option>
                            <option value="خبير">Expert</option>
                        </select>
                        <input type="number" placeholder="Rating (1-5)" value={editingCourse.rating || 5} onChange={e => setEditingCourse({...editingCourse, rating: parseFloat(e.target.value)})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white w-24 text-center" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editingCourse.is_paid || false} onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})} className="accent-gold-500" />
                        <label className="text-white text-sm">Paid Course</label>
                    </div>
                    <button onClick={handleSaveCourse} className="w-full bg-gold-500 text-navy-950 py-3 rounded-xl font-bold mt-2">Save</button>
                    <button onClick={() => setCourseModalOpen(false)} className="w-full bg-white/5 text-white py-3 rounded-xl font-bold">Cancel</button>
                </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
