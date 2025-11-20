import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings } from '../types';
import { Users, BookOpen, Settings, CheckCircle, Plus, Trash2, Save, UserPlus, Search, Facebook, Instagram, Send, FileText, BarChart3, Type } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings } = useStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'courses' | 'settings'>('requests');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  
  // Enrollment Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollEmail, setEnrollEmail] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsersList(data as User[]);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCoursesList(data as Course[]);
  };

  const handleApproveUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    showToast('تم تفعيل حساب العضو بنجاح', 'success');
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    showToast('تم حذف العضو بنجاح', 'error');
    fetchUsers();
  };

  const handleAddEnrollment = async () => {
    if (!selectedCourseId || !enrollEmail) return;
    
    const targetUser = usersList.find(u => u.email === enrollEmail);
    if (!targetUser) {
      showToast('المستخدم غير موجود', 'error');
      return;
    }

    const { error } = await supabase.from('enrollments').insert({
      user_id: targetUser.id,
      course_id: selectedCourseId
    });

    if (error) {
        showToast('خطأ: ربما المستخدم مسجل بالفعل', 'error');
    } else {
      showToast('تم إضافة المستخدم للكورس بنجاح', 'success');
      setEnrollEmail('');
      setEnrollModalOpen(false);
    }
  };
  
  const handleSaveSettings = async () => {
      try {
        await updateSettings(localSettings);
        showToast('تم حفظ إعدادات الموقع وتحديث قاعدة البيانات فوراً', 'success');
      } catch (error) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
      }
  };

  const pendingUsers = usersList.filter(u => u.status === 'pending');

  if (user?.role !== 'admin') return <div className="min-h-screen flex items-center justify-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen page-padding-top pb-10 bg-navy-950">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">لوحة التحكم</h1>
            <p className="text-gray-400 text-sm">إدارة المنصة والمحتوى التعليمي</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-navy-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> النظام يعمل
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 sticky top-44">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">القائمة الرئيسية</p>
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'requests' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <div className="flex items-center gap-3"><Users size={18} /> طلبات الانضمام</div>
                  {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">{pendingUsers.length}</span>}
                </button>
                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <Users size={18} /> إدارة الأعضاء
                </button>
                <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <BookOpen size={18} /> إدارة الكورسات
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <Settings size={18} /> إعدادات الموقع (CMS)
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="glass-card p-6 min-h-[600px] relative overflow-hidden">
              
              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 text-white flex items-center gap-2">
                    <Users className="text-gold-500" size={24} /> طلبات الانضمام المعلقة
                  </h2>
                  {pendingUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <CheckCircle size={48} className="mb-4 opacity-20" />
                      <p>لا توجد طلبات جديدة، الكل تحت السيطرة</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {pendingUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-navy-900/50 p-5 rounded-xl border border-white/5 hover:border-gold-500/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gray-400 font-bold border border-white/5">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-lg">{u.email}</p>
                              <p className="text-xs text-gray-500">تاريخ الطلب: {new Date(u.created_at!).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => handleApproveUser(u.id)} className="bg-green-500/10 text-green-400 px-6 py-2 rounded-lg hover:bg-green-500/20 font-bold text-sm border border-green-500/20 transition-colors">قبول</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="bg-red-500/10 text-red-400 px-6 py-2 rounded-lg hover:bg-red-500/20 font-bold text-sm border border-red-500/20 transition-colors">رفض</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">جميع الأعضاء ({usersList.length})</h2>
                      <div className="relative">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="text" placeholder="بحث..." className="bg-navy-950 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm focus:border-gold-500 outline-none w-64" />
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead className="text-gray-500 text-xs uppercase bg-navy-950/50">
                          <tr>
                            <th className="px-4 py-3 rounded-r-lg">المستخدم</th>
                            <th className="px-4 py-3">الحالة</th>
                            <th className="px-4 py-3">الدور</th>
                            <th className="px-4 py-3">تاريخ الانضمام</th>
                            <th className="px-4 py-3 rounded-l-lg">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {usersList.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-xs font-bold text-gold-500 border border-white/5">
                                    {u.email.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-gray-200 font-medium">{u.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${u.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                  {u.status === 'active' ? 'نشط' : 'معلق'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-400">{u.role}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(u.created_at!).toLocaleDateString()}</td>
                              <td className="px-4 py-4">
                                <button onClick={() => handleDeleteUser(u.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">إدارة الكورسات</h2>
                      <button className="bg-gold-500 text-navy-950 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20">
                        <Plus size={18} /> إضافة كورس جديد
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {coursesList.map(course => (
                        <div key={course.id} className="bg-navy-900/50 p-5 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gold-500/20 transition-colors group">
                          <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-navy-800 rounded-lg overflow-hidden shrink-0 border border-white/5">
                              {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-lg group-hover:text-gold-400 transition-colors">{course.title}</h3>
                              <div className="flex gap-2 mt-2">
                                {course.is_paid ? (
                                  <span className="text-[10px] bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded border border-gold-500/20 font-bold">Premium</span>
                                ) : (
                                  <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold">Free</span>
                                )}
                                <span className="text-[10px] bg-navy-950 text-gray-400 px-2 py-0.5 rounded border border-white/10">Rating: {course.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            {course.is_paid && (
                              <button 
                                onClick={() => { setSelectedCourseId(course.id); setEnrollModalOpen(true); }}
                                className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/20 flex items-center gap-2 border border-blue-500/20 transition-colors"
                              >
                                <UserPlus size={14} /> المشتركين
                              </button>
                            )}
                            <button className="bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/10 border border-white/5 transition-colors">تعديل</button>
                            <button className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 border border-red-500/20 transition-colors">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enrollment Modal */}
                    {enrollModalOpen && (
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
                        <div className="glass-card p-8 max-w-md w-full border-gold-500/30 shadow-2xl">
                          <h3 className="text-xl font-bold text-white mb-2">إضافة طالب للكورس المدفوع</h3>
                          <p className="text-gray-400 text-sm mb-6">سيتم منح الطالب صلاحية الوصول الكاملة لهذا الكورس.</p>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني للطالب</label>
                              <input 
                                type="email" 
                                placeholder="student@example.com"
                                value={enrollEmail}
                                onChange={e => setEnrollEmail(e.target.value)}
                                className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button onClick={handleAddEnrollment} className="flex-1 bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors">إضافة الصلاحية</button>
                              <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">إلغاء</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
              )}

              {/* Settings Tab - ENHANCED */}
              {activeTab === 'settings' && (
                <div className="animate-fade-in max-w-2xl">
                  <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 text-white flex items-center gap-2">
                    <Settings className="text-gold-500" size={24} /> إعدادات الموقع (CMS)
                  </h2>
                  
                  <div className="space-y-6 h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {/* General Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} /> المعلومات الأساسية
                      </h3>
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">اسم الموقع</label>
                        <input 
                          type="text" 
                          value={localSettings.site_name}
                          onChange={e => setLocalSettings({...localSettings, site_name: e.target.value})}
                          className="w-full bg-navy-950 border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none text-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* Hero Texts Section (New) */}
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Type size={14} /> نصوص الصفحة الرئيسية (Hero)
                      </h3>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الرئيسي - السطر الأول</label>
                          <input 
                            type="text" 
                            placeholder="مثال: تداول بذكاء"
                            value={localSettings.hero_title_line1 || ''}
                            onChange={e => setLocalSettings({...localSettings, hero_title_line1: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الرئيسي - السطر الثاني (باللون الذهبي)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: بدقة القناص"
                            value={localSettings.hero_title_line2 || ''}
                            onChange={e => setLocalSettings({...localSettings, hero_title_line2: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">الوصف التفصيلي</label>
                        <textarea 
                          value={localSettings.hero_desc}
                          onChange={e => setLocalSettings({...localSettings, hero_desc: e.target.value})}
                          className="w-full bg-navy-950 border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none h-24 text-white transition-colors leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart3 size={14} /> الإحصائيات (تظهر في صفحة من نحن)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">عدد الطلاب</label>
                          <input 
                            type="text" 
                            value={localSettings.stats?.students || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              stats: { ...localSettings.stats, students: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">عدد الساعات التدريبية</label>
                          <input 
                            type="text" 
                            value={localSettings.stats?.hours || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              stats: { ...localSettings.stats, hours: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Links Section */}
                    <div className="border-t border-white/10 pt-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Send size={14} /> روابط التواصل الاجتماعي
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Facebook size={16} className="text-blue-500" /> فيسبوك (يظهر في الفوتر وصفحة تواصل معنا)
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            placeholder="https://facebook.com/..."
                            value={localSettings.social_links?.facebook || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, facebook: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Instagram size={16} className="text-pink-500" /> انستجرام
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            placeholder="https://instagram.com/..."
                            value={localSettings.social_links?.instagram || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, instagram: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Send size={16} className="text-blue-400" /> تليجرام
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            placeholder="https://t.me/..."
                            value={localSettings.social_links?.telegram || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, telegram: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 pb-8">
                      <button onClick={handleSaveSettings} className="bg-gold-500 text-navy-950 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 w-full justify-center text-lg">
                        <Save size={20} /> حفظ التغييرات وتحديث الموقع
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
