import React from 'react';
import { useStore } from '../context/Store';
import { Logo } from '../components/Logo';
import { Target, Award, Users, Clock, Headphones } from 'lucide-react';

export const About: React.FC = () => {
  const { siteSettings } = useStore();

  const stats = [
    { icon: Users, label: "طالب متداول", value: siteSettings.stats.students || "+1500" },
    { icon: Clock, label: "ساعة تدريبية", value: siteSettings.stats.hours || "+50" },
    { icon: Headphones, label: "دعم فني", value: "24/7" },
  ];

  return (
    <div className="min-h-screen bg-navy-950 page-padding-top pb-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gold-500/5 blur-[150px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-600/5 blur-[150px] rounded-full -z-10"></div>

      <div className="container-custom">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in pt-10">
          <div className="mb-8 flex justify-center transform scale-150">
            <Logo />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            عن المنصة
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            ليست مجرد موقع تعليمي، بل هي أكاديمية متخصصة تهدف لتغيير مفهوم التداول في العالم العربي.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-24 max-w-6xl mx-auto">
          {/* Mission */}
          <div className="bg-[#0f172a] border border-gold-500/30 rounded-3xl p-10 text-center hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
            <div className="flex justify-center mb-6">
               <Award className="text-gold-500 w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">رسالتنا</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              توفير محتوى تعليمي عالي الجودة يجمع بين النظرية والتطبيق العملي، مع التركيز على إدارة المخاطر وبناء عقلية المتداول الناجح.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-[#0f172a] border border-gold-500/30 rounded-3xl p-10 text-center hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
            <div className="flex justify-center mb-6">
               <Target className="text-gold-500 w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">رؤيتنا</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              أن نكون المرجع الأول والأكثر موثوقية للمتداول العربي في أسواق المال العالمية، وبناء مجتمع من المحترفين القادرين على تحقيق الاستقلال المالي.
            </p>
          </div>
        </div>

        {/* Professional Statistics Section */}
        <div className="pt-16 border-t border-white/5">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-white">أرقام تتحدث عن نجاحنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-card p-8 text-center group hover:border-gold-500/50 hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 bg-navy-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:border-gold-500/50 transition-colors shadow-lg relative">
                  <div className="absolute inset-0 bg-gold-500/5 rounded-full animate-pulse-slow"></div>
                  <stat.icon className="text-gold-500 relative z-10" size={36} />
                </div>
                <h3 className="text-4xl font-black text-white mb-2 font-sans tracking-tight">{stat.value}</h3>
                <p className="text-gray-400 font-bold text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
