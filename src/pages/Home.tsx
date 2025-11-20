import React from 'react';
import { useStore } from '../context/Store';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Play, Lock, Crown, 
  LineChart, Shield, Brain, Users, ArrowLeft,
  Facebook, Instagram, Send, CheckCircle2, UserPlus, LogIn, Target, LayoutDashboard
} from 'lucide-react';
import { Logo } from '../components/Logo';

const getIcon = (name: string) => {
  const icons: any = { LineChart, Shield, Brain, Users };
  const Icon = icons[name] || Star;
  return <Icon size={32} className="text-gold-500" />;
};

export const Home: React.FC = () => {
  const { user, courses, siteSettings, checkAccess } = useStore();
  const navigate = useNavigate();
  const links = siteSettings.social_links || {};

  const featuredCourses = courses.slice(0, 2);

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-cairo selection:bg-gold-500 selection:text-navy-950">
      
      {/* Global Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] opacity-20"></div>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative z-10 pt-[160px] pb-24 container-custom text-center">
        {user ? (
          // عرض للمستخدم المسجل
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass-card p-10 md:p-14 border-gold-500/30 shadow-[0_0_60px_rgba(255,215,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
              
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mx-auto mb-6 flex items-center justify-center text-navy-950 text-4xl font-bold shadow-lg ring-4 ring-navy-900/50">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                مرحباً بك، <span className="text-gold-500">{user.email.split('@')[0]}</span>
              </h1>
              <p className="text-gray-400 mb-8">استكمل رحلتك التعليمية نحو الاحتراف</p>
              
              <div className="flex justify-center gap-3 mb-8">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {user.status === 'active' ? <CheckCircle2 size={14} /> : null}
                  {user.status === 'active' ? 'عضو نشط' : 'في الانتظار'}
                </span>
                {user.role === 'admin' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]">مشرف</span>}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/courses" className="btn-gold px-12 py-4 text-lg inline-flex items-center justify-center gap-3 shadow-xl shadow-gold-500/20 hover:shadow-gold-500/40 transition-shadow">
                  <Play size={22} fill="currentColor" /> ابدأ التعلم الآن
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn-glass px-8 py-4 text-lg font-bold inline-flex items-center justify-center gap-3 hover:bg-white/10">
                    <LayoutDashboard size={22} /> لوحة التحكم
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          // عرض للزائر
          <div className="max-w-5xl mx-auto animate-fade-in relative">
            {/* Hero Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gold-500/5 blur-[100px] rounded-full -z-10"></div>
            
            {/* Badge Above Title */}
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-gold-500 text-xs md:text-sm font-bold tracking-wide backdrop-blur-sm shadow-lg">
              <Target size={16} className="text-gold-500" />
              المنصة العربية الأولى لاحتراف الذهب
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-[1.1]">
              <span className="block text-white drop-shadow-2xl z-0 relative">
                {siteSettings.hero_title_line1 || "تداول بذكاء"}
              </span>
              <span className="block text-gold-500 drop-shadow-[0_0_25px_rgba(255,215,0,0.3)] relative z-10 mt-2 md:mt-4">
                {siteSettings.hero_title_line2 || "بدقة القناص"}
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-90 font-light">
              {siteSettings.hero_desc}
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
              <Link to="/register" className="btn-gold px-8 py-4 text-lg font-bold shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] transition-all flex items-center justify-center gap-2">
                <UserPlus size={20} /> إنشاء حساب جديد
              </Link>
              <Link to="/login" className="btn-glass px-8 py-4 text-lg font-bold hover:bg-white/10 border-white/20 flex items-center justify-center gap-2">
                تسجيل الدخول <LogIn size={20} />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-8 md:gap-16 text-sm md:text-base font-bold text-gray-400 animate-fade-in">
               <div className="flex items-center gap-2">
                  <Shield className="text-gold-500" size={20} />
                  <span>محتوى محمي 100%</span>
               </div>
               <div className="flex items-center gap-2">
                  <Users className="text-gold-500" size={20} />
                  <span>+1500 متدرب</span>
               </div>
            </div>
          </div>
        )}
      </section>

      {/* ... باقي الأقسام كما هي ... */}
      {/* ================= FEATURED COURSES ================= */}
      <section className="relative z-10 section-padding border-t border-white/5 bg-navy-950/30">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <span className="w-2 h-8 bg-gold-500 rounded-full"></span>
                أحدث الكورسات
              </h2>
              <p className="text-gray-400 text-lg">المسارات التعليمية الأكثر طلباً من المتداولين</p>
            </div>
            <Link to="/courses" className="group flex items-center gap-2 text-gold-400 hover:text-gold-300 font-bold transition-colors px-6 py-3 rounded-xl bg-gold-500/5 hover:bg-gold-500/10 border border-gold-500/10">
              عرض كل الكورسات <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, idx) => {
              const hasAccess = checkAccess(course);
              return (
                <div key={course.id} onClick={() => navigate(`/course/${course.id}`)} className="group cursor-pointer h-full">
                  <div className="glass-card h-full flex flex-col overflow-hidden hover:border-gold-500/40 hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-500 relative">
                    {/* Image Container */}
                    <div className="relative h-60 bg-navy-900 overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-navy-800"><Play size={40} className="text-gray-600" /></div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/20 to-transparent opacity-90"></div>
                      
                      {/* Badges */}
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        {course.is_paid ? (
                          <span className="bg-navy-950/80 backdrop-blur-md text-gold-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-gold-500/30 flex items-center gap-1 shadow-lg">
                            <Crown size={12} fill="currentColor" /> Premium
                          </span>
                        ) : (
                          <span className="bg-green-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">Free</span>
                        )}
                      </div>

                      {/* Lock Overlay */}
                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-navy-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-navy-900 border border-gold-500/50 flex items-center justify-center text-gold-500 shadow-[0_0_20px_rgba(255,215,0,0.2)] scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Lock size={24} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-7 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-700"} />
                        ))}
                        <span className="text-xs text-gray-500 mr-2 font-mono">({course.rating})</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors line-clamp-1">{course.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-6 leading-relaxed">{course.description}</p>
                      
                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gold-500"></div>
                          {course.lesson_count || 12} درس
                        </span>
                        <span className={`text-sm font-bold transition-colors ${hasAccess ? 'text-gold-400 group-hover:text-gold-300' : 'text-gray-500'}`}>
                          {hasAccess ? 'مشاهدة الآن' : 'اشترك للوصول'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coming Soon Card */}
            {user && (
              <div className="glass-card border-gold-500/10 p-8 flex flex-col items-center justify-center text-center min-h-[350px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-900/80"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-navy-900 border border-gold-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.05)] group-hover:scale-110 transition-transform duration-500 mx-auto">
                    <Lock className="text-gold-500/50 group-hover:text-gold-500 transition-colors" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Master Class Pro</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">كورس احترافي متقدم يكشف أسرار صناع السوق.</p>
                  <span className="px-4 py-1.5 bg-gold-500/5 border border-gold-500/10 rounded-lg text-xs text-gold-500/70 font-bold uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      {!user && (
        <section className="relative z-10 section-padding bg-[#010409]">
          {/* Section Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-900/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="container-custom relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">لماذا تختارنا ؟</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">نقدم لك تجربة تعليمية متكاملة تضعك على الطريق الصحيح</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteSettings.home_features?.map((feature, idx) => (
                <div key={idx} className="bg-navy-900/40 border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:bg-navy-900/60 hover:border-gold-500/20 hover:shadow-lg">
                  <div className="w-16 h-16 bg-navy-950 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-inner">
                    {getIcon(feature.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA SECTION (GOLD BAR) ================= */}
      {!user && (
        <section className="relative z-10 pt-16 pb-0">
          <div className="container-custom">
            {/* Gold Card Container */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(255,215,0,0.15)] transform hover:scale-[1.01] transition-transform duration-500">
              
              {/* Gold Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] via-[#FFC400] to-[#E6B800]"></div>
              
              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
              
              {/* Shine Effect */}
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] animate-shine"></div>

              <div className="relative z-10 p-12 md:p-20 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-navy-950 mb-6 drop-shadow-sm">
                  جاهز لبدء رحلة الثراء؟
                </h2>
                <p className="text-navy-900 font-bold text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto opacity-90">
                  انضم الآن إلى مجتمع Sniper FX Gold واحصل على صلاحية الوصول الكاملة للكورسات مجاناً لفترة محدودة.
                </p>
                
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-3 bg-navy-950 text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-navy-900 hover:scale-105 transition-all duration-300 shadow-2xl ring-4 ring-white/10"
                >
                  سجل عضويتك الآن <ArrowLeft size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= BOTTOM SECTION ================= */}
      <section className="relative z-10 py-20 bg-transparent">
         <div className="container-custom flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 transform scale-125 hover:scale-110 transition-transform duration-500">
              <Logo />
            </div>

            {/* Tagline */}
            <h3 className="text-gold-500 font-bold text-xl mb-3 tracking-wide">
              المنصة العربية الأولى لاحتراف الذهب
            </h3>
            <p className="text-gray-500 text-sm mb-8 font-medium tracking-wider uppercase">
              Real Education. Real Results.
            </p>

            {/* Contact Us Text */}
            <h4 className="text-white font-bold text-lg mb-6">
              تواصل معنا
            </h4>

            {/* Socials */}
            <div className="flex items-center justify-center gap-8">
              {[
                { icon: Send, link: links.telegram, color: '#229ED9' },
                { icon: Instagram, link: links.instagram, color: '#E4405F' },
                { icon: Facebook, link: links.facebook, color: '#1877F2' }
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.link || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-14 h-14 rounded-2xl bg-navy-900 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: social.color }}></div>
                  <social.icon size={24} className="relative z-10 transition-colors duration-300" style={{ color: social.color }} />
                </a>
              ))}
            </div>
         </div>
      </section>
    </div>
  );
};
