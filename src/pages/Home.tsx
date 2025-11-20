import React from 'react';
import { useStore } from '../context/Store';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, ShieldCheck, Play, Lock, Crown, 
  LineChart, Shield, Brain, Users, Facebook, Send, Instagram, Youtube, Twitter 
} from 'lucide-react';
import { Logo } from '../components/Logo';

// Helper to get icons dynamically
const getIcon = (name: string) => {
  const icons: any = { LineChart, Shield, Brain, Users };
  const Icon = icons[name] || Star;
  return <Icon size={32} className="text-gold-500" />;
};

const getSocialIcon = (platform: string) => {
  switch(platform.toLowerCase()) {
    case 'facebook': return <Facebook size={20} />;
    case 'telegram': return <Send size={20} />;
    case 'instagram': return <Instagram size={20} />;
    case 'youtube': return <Youtube size={20} />;
    case 'twitter': return <Twitter size={20} />;
    default: return <Link size={20} />; // Default generic link icon
  }
};

export const Home: React.FC = () => {
  const { user, courses, siteSettings, checkAccess } = useStore();
  const navigate = useNavigate();

  const featuredCourses = courses.slice(0, 2);

  return (
    <div className="min-h-screen bg-navy-900 text-white relative overflow-x-hidden font-cairo">
      {/* Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-[160px] pb-20 container-custom text-center">
        {user ? (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass-card p-8 md:p-12 border-gold-500/20 shadow-[0_0_50px_rgba(255,215,0,0.1)]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mx-auto mb-6 flex items-center justify-center text-navy-950 text-3xl font-bold shadow-lg">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">مرحباً بك، <span className="text-gold-500">{user.email.split('@')[0]}</span></h1>
              <div className="flex justify-center gap-3 mb-8">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {user.status === 'active' ? 'عضو نشط' : 'في الانتظار'}
                </span>
                {user.role === 'admin' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20">مشرف</span>}
              </div>
              <Link to="/courses" className="btn-gold px-10 py-4 text-lg inline-flex items-center gap-2 shadow-lg shadow-gold-500/20">
                <Play size={20} fill="currentColor" /> ابدأ التعلم
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="block text-white drop-shadow-xl">{siteSettings.hero_title_line1 || "تداول بذكاء"}</span>
              <span className="text-gold-gradient drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">{siteSettings.hero_title_line2 || "بدقة القناص"}</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
              {siteSettings.hero_desc}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="btn-gold px-10 py-4 text-lg font-bold shadow-[0_10px_30px_rgba(255,215,0,0.2)]">
                إنشاء حساب جديد
              </Link>
              <Link to="/login" className="btn-glass px-10 py-4 text-lg font-bold">
                تسجيل الدخول
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Featured Courses */}
      <section className="relative z-10 section-padding bg-navy-950/50">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">كورسات مميزة</h2>
              <p className="text-gray-400">الأكثر طلباً من قبل المتداولين</p>
            </div>
            <Link to="/courses" className="text-gold-400 hover:text-gold-300 font-bold flex items-center gap-2 transition-colors">
              عرض الكل <ArrowRight size={18} className="rotate-180" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map(course => {
              const hasAccess = checkAccess(course);
              return (
                <div key={course.id} onClick={() => navigate(`/course/${course.id}`)} className="group cursor-pointer">
                  <div className="glass-card h-full overflow-hidden hover:border-gold-500/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-500 bg-navy-900">
                    <div className="relative h-56 bg-black overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-navy-800"><Play size={40} className="text-gray-600" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 to-transparent opacity-80"></div>
                      <div className="absolute top-4 right-4 z-10">
                        {course.is_paid ? (
                          <span className="bg-navy-950/90 text-gold-400 px-3 py-1 rounded-lg text-xs font-bold border border-gold-500/30 flex items-center gap-1 shadow-lg backdrop-blur-sm">
                            <Crown size={12} fill="currentColor" /> Premium
                          </span>
                        ) : (
                          <span className="bg-green-500/90 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm">Free</span>
                        )}
                      </div>
                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-navy-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 rounded-full bg-navy-900 border border-gold-500/50 flex items-center justify-center text-gold-500 shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Lock size={20} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-700"} />
                        ))}
                        <span className="text-xs text-gray-500 mr-2">({course.rating})</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">{course.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Teaser Card - Only for Registered Users */}
            {user && (
              <div className="glass-card relative overflow-hidden border-gold-500/20 group min-h-[350px] flex flex-col items-center justify-center text-center p-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-navy-900 border border-gold-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.15)] animate-float mx-auto">
                    <Lock className="text-gold-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Master Class Pro</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">كورس احترافي متقدم يكشف أسرار صناع السوق، قريباً...</p>
                  <span className="px-4 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-lg text-xs text-gold-400 font-bold uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Marketing Sections (Visitor Only) */}
      {!user && (
        <>
          {/* Why Choose Us */}
          <section className="relative z-10 section-padding">
            <div className="container-custom">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">لماذا تختارنا؟</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">نقدم لك تجربة تعليمية متكاملة تضعك على الطريق الصحيح</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {siteSettings.home_features?.map((feature, idx) => (
                  <div key={idx} className="glass-card p-6 hover:-translate-y-2 transition-transform duration-300 text-center group">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-gold-500/10 transition-colors">
                      {getIcon(feature.icon)}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative z-10 pb-20">
            <div className="container-custom">
              <div className="rounded-[2.5rem] overflow-hidden relative p-12 md:p-20 text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500 to-gold-600"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-black text-navy-950 mb-6">جاهز للانطلاق؟</h2>
                  <p className="text-navy-900/80 text-lg font-bold mb-10 max-w-2xl mx-auto">
                    انضم لأكثر من {siteSettings.stats.students} متداول حققوا نجاحات حقيقية معنا.
                  </p>
                  <Link to="/register" className="inline-flex items-center gap-2 bg-navy-950 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
                    سجل عضويتك الآن <ArrowRight size={20} className="rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Brand Footer */}
      <footer className="relative z-10 bg-navy-950 pt-20 pb-10 border-t border-white/5">
        <div className="container-custom">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 scale-125">
              <Logo />
            </div>
            <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
              {siteSettings.hero_desc.substring(0, 100)}...
            </p>
            <div className="flex gap-4 mb-10">
              {Object.entries(siteSettings.social_links).map(([key, link]) => (
                link && link !== '#' && (
                  <a key={key} href={link} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-navy-950 transition-all duration-300">
                    {getSocialIcon(key)}
                  </a>
                )
              ))}
            </div>
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} {siteSettings.site_name}. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
