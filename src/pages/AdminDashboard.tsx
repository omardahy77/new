import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings } from '../types';
import { 
  LayoutDashboard, Users, BookOpen, Settings, Save, 
  Plus, Trash2, CheckCircle, Lock, Unlock, Search,
  TrendingUp, ShieldCheck, Crown, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, refreshData } = useStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'cms' | 'courses' | 'users'>('cms');
  
  // CMS State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  
  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Courses State
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Enrollment Modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
     setSettingsForm(siteSettings);
     fetchUsers();
     fetchCourses();
  }, [siteSettings]);

  const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsersList(data as User[]);
  };

  const fetchCourses = async () => {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (data) setCoursesList(data as Course[]);
  };

  // --- CMS ACTIONS ---
  const saveSettings = async () => {
      const { error } = await supabase.from('site_settings').upsert(settingsForm);
      if (error) showToast('فشل الحفظ', 'error');
      else {
          showToast('تم تحديث إعدادات الموقع', 'success');
          refreshData();
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
          fetchCourses();
          refreshData();
      }
  };

  const deleteCourse = async (id: string) => {
      if(!confirm('هل أنت متأكد من حذف الكورس؟')) return;
      await supabase.from('courses').delete().eq('id', id);
      fetchCourses();
      refreshData();
  };

  // --- USER ACTIONS ---
  const approveUser = async (id: string) => {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
      fetchUsers();
      showToast('تم تفعيل العضو', 'success');
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

  const activeUsers = usersList.filter(u => u.status === 'active').length;
  const pendingUsers = usersList.filter(u => u.status === 'pending').length;

  return (
    <div className="min-h-screen pt-32 pb-10 bg-navy-950 text-white" dir="rtl">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <LayoutDashboard className="text-gold-500" size={32} /> لوحة التحكم الشاملة
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-navy-900 px-4 py-2 rounded-full border border-white/5">
                <ShieldCheck size={16} className="text-green-500" />
                <span>Super Admin Mode</span>
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
                    {pendingUsers > 0 && <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 bg-navy-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px]">
                
                {/* CMS TAB */}
                {activeTab === 'cms' && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-2">تعديل محتوى الموقع</h2>
                        
                        <div className="space-y-4">
                            <h3 className="text-gold-500 font-bold">الواجهة الرئيسية (Hero Section)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="العنوان السطر 1" value={settingsForm.hero_title_line1} onChange={e => setSettingsForm({...settingsForm, hero_title_line1: e.target.value})} className="bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                <input placeholder="العنوان السطر 2 (ذهبي)" value={settingsForm.hero_title_line2} onChange={e => setSettingsForm({...settingsForm, hero_title_line2: e.target.value})} className="bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                            </div>
                            <textarea placeholder="الوصف الرئيسي" value={settingsForm.hero_desc} onChange={e => setSettingsForm({...settingsForm, hero_desc: e.target.value})} className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none" />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-gold-500 font-bold">روابط التواصل الاجتماعي</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Telegram URL" value={settingsForm.social_links?.telegram || ''} onChange={e => setSettingsForm({...settingsForm, social_links: {...settingsForm.social_links, telegram: e.target.value}})} className="bg-navy-950 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                                <input placeholder="Facebook URL" value={settingsForm.social_links?.facebook || ''} onChange={e => setSettingsForm({...settingsForm, social_links: {...settingsForm.social_links, facebook: e.target.value}})} className="bg-navy-950 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                                <input placeholder="Instagram URL" value={settingsForm.social_links?.instagram || ''} onChange={e => setSettingsForm({...settingsForm, social_links: {...settingsForm.social_links, instagram: e.target.value}})} className="bg-navy-950 border border-white/10 p-3 rounded-lg text-white" dir="ltr" />
                            </div>
                        </div>

                        <button onClick={saveSettings} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mt-4 shadow-lg shadow-green-500/20">
                            <Save size={20} /> حفظ التغييرات
                        </button>
                    </div>
                )}

                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">الكورسات الحالية</h2>
                            <button onClick={() => { setEditingCourse({}); setIsCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors">
                                <Plus size={18} /> إضافة كورس
                            </button>
                        </div>

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
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">قائمة الأعضاء</h2>
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* MODALS */}
        
        {/* Course Modal */}
        {isCourseModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-navy-900 border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl">
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
                <div className="bg-navy-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
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
