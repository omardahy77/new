import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';

interface StoreContextType {
  user: User | null;
  loading: boolean;
  courses: Course[];
  enrollments: Enrollment[];
  siteSettings: SiteSettings;
  refreshCourses: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  signOut: () => Promise<void>;
  checkAccess: (course: Course) => boolean;
  saveLessonProgress: (lessonId: string, position: number, duration: number, isCompleted: boolean) => Promise<void>;
  getLessonProgress: (lessonId: string) => Promise<LessonProgress | null>;
}

// Robust defaults including English fields
const defaultSettings: SiteSettings = {
  site_name: "Sniper FX Gold",
  site_name_en: "Sniper FX Gold",
  hero_title: "تداول بذكاء بدقة القناص",
  hero_title_en: "Trade Smart with Sniper Precision",
  hero_title_line1: "تداول بذكاء",
  hero_title_line1_en: "Trade Smart",
  hero_title_line2: "بدقة القناص",
  hero_title_line2_en: "With Sniper Precision",
  hero_desc: "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي (LMS) متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
  hero_desc_en: "Discover the secrets of market making... A complete, secure LMS taking you from zero to hero.",
  logo_url: "https://i.postimg.cc/Bb0PZ00P/tsmym-bdwn-wnwan-2.png",
  maintenance_mode: false,
  stats: { students: "+1500", hours: "+50" },
  social_links: { 
    telegram: "https://t.me", 
    instagram: "https://instagram.com", 
    youtube: "",
    facebook: "https://facebook.com",
    tiktok: "",
    whatsapp: ""
  },
  home_features: [
    { title: "تحليل فني متقدم", description: "تعلم استراتيجيات التحليل الفني التي تستخدمها البنوك الكبرى.", icon: "LineChart" },
    { title: "إدارة مخاطر صارمة", description: "كيف تحمي رأس مالك وتضاعف أرباحك بأقل مخاطرة ممكنة.", icon: "Shield" },
    { title: "سيكولوجية التداول", description: "التحكم في المشاعر والانضباط هو مفتاح النجاح في الأسواق.", icon: "Brain" },
    { title: "مجتمع حصري", description: "تواصل مع نخبة المتداولين وتبادل الخبرات والفرص يومياً.", icon: "Users" }
  ],
  features_config: { 
    show_coming_soon: true, 
    show_stats: true, 
    allow_registration: true,
    social_facebook_visible: true,
    social_instagram_visible: true,
    social_telegram_visible: true,
    social_youtube_visible: true,
    social_tiktok_visible: true,
    social_whatsapp_visible: true
  },
  content_config: { 
    // Home
    why_choose_us_title: "لماذا تختارنا ؟",
    why_choose_us_title_en: "Why Choose Us?",
    why_choose_us_desc: "نقدم لك تجربة تعليمية متكاملة تضعك على الطريق الصحيح",
    why_choose_us_desc_en: "We provide a complete educational experience to put you on the right track",
    cta_title: "جاهز لبدء رحلة الثراء؟",
    cta_title_en: "Ready to Start Your Wealth Journey?",
    cta_desc: "انضم الآن إلى مجتمع Sniper FX Gold واحصل على صلاحية الوصول الكاملة للكورسات مجاناً لفترة محدودة.",
    cta_desc_en: "Join Sniper FX Gold community now and get full access to courses for free for a limited time.",
    
    // Footer
    footer_tagline: "المنصة العربية الأولى لاحتراف الذهب",
    footer_tagline_en: "The #1 Platform for Gold Trading Mastery",
    footer_sub_tagline: "Real Education. Real Results.",
    footer_sub_tagline_en: "Real Education. Real Results.",

    // About
    about_main_title: "عن المنصة",
    about_main_title_en: "About Us",
    about_main_desc: "ليست مجرد موقع تعليمي، بل هي أكاديمية متخصصة تهدف لتغيير مفهوم التداول في العالم العربي.",
    about_main_desc_en: "Not just an educational site, but a specialized academy aiming to change trading concepts.",
    mission_title: "رسالتنا",
    mission_title_en: "Our Mission",
    mission_desc: "توفير محتوى تعليمي عالي الجودة يجمع بين النظرية والتطبيق العملي...",
    mission_desc_en: "Providing high-quality educational content combining theory and practice...",
    vision_title: "رؤيتنا",
    vision_title_en: "Our Vision",
    vision_desc: "أن نكون المرجع الأول والأكثر موثوقية للمتداول العربي...",
    vision_desc_en: "To be the #1 trusted reference for traders...",
    stats_students_label: "طالب متداول",
    stats_students_label_en: "Active Students",
    stats_hours_label: "ساعة تدريبية",
    stats_hours_label_en: "Training Hours",
    stats_support_label: "دعم فني",
    stats_support_label_en: "Support",
    stats_support_value: "24/7",

    // Contact
    contact_main_title: "تواصل معنا",
    contact_main_title_en: "Contact Us",
    contact_main_desc: "فريق الدعم الفني جاهز للرد على استفساراتكم ومساعدتكم في رحلتكم التعليمية",
    contact_main_desc_en: "Our support team is ready to answer your queries and help you on your journey",
    
    // Social Cards
    fb_card_title: "Facebook", fb_card_title_en: "Facebook",
    fb_card_sub: "آخر الأخبار والتحديثات", fb_card_sub_en: "Latest News & Updates",
    fb_card_btn: "تابعنا على فيسبوك", fb_card_btn_en: "Follow on Facebook",
    
    insta_card_title: "Instagram", insta_card_title_en: "Instagram",
    insta_card_sub: "تحليلات يومية وستوريات", insta_card_sub_en: "Daily Analysis & Stories",
    insta_card_btn: "تابعنا على انستجرام", insta_card_btn_en: "Follow on Instagram",
    
    tg_card_title: "Telegram", tg_card_title_en: "Telegram",
    tg_card_sub: "توصيات ومناقشات حية", tg_card_sub_en: "Signals & Live Discussions",
    tg_card_btn: "انضم للقناة", tg_card_btn_en: "Join Channel",

    yt_card_title: "YouTube", yt_card_title_en: "YouTube",
    yt_card_sub: "شروحات فيديو حصرية", yt_card_sub_en: "Exclusive Video Tutorials",
    yt_card_btn: "اشترك في القناة", yt_card_btn_en: "Subscribe Channel",

    tt_card_title: "TikTok", tt_card_title_en: "TikTok",
    tt_card_sub: "مقاطع قصيرة مفيدة", tt_card_sub_en: "Useful Short Clips",
    tt_card_btn: "تابعنا على تيك توك", tt_card_btn_en: "Follow on TikTok",

    wa_card_title: "WhatsApp", wa_card_title_en: "WhatsApp",
    wa_card_sub: "تواصل مباشر معنا", wa_card_sub_en: "Direct Contact",
    wa_card_btn: "راسلنا الآن", wa_card_btn_en: "Message Us Now",

    // Courses
    courses_main_title: "البرامج التدريبية", courses_main_title_en: "Training Programs",
    courses_main_desc: "اختر المسار التعليمي المناسب لمستواك وابدأ رحلة الاحتراف", courses_main_desc_en: "Choose the right path for your level and start your journey",
    coming_soon_title: "Master Class Pro", coming_soon_title_en: "Master Class Pro",
    coming_soon_desc: "كورس احترافي متقدم يكشف أسرار صناع السوق.", coming_soon_desc_en: "Advanced professional course revealing market maker secrets.",
    coming_soon_badge: "Coming Soon", coming_soon_badge_en: "Coming Soon",
    coming_soon_feature_1: "محتوى حصري", coming_soon_feature_1_en: "Exclusive Content",
    coming_soon_feature_2: "استراتيجيات متقدمة", coming_soon_feature_2_en: "Advanced Strategies"
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUser(data as User);
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) {
      setCourses(data as Course[]);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    if (data) {
      // Deep merge to ensure no keys are missing if the DB has partial data
      setSiteSettings({
        ...defaultSettings,
        ...data,
        social_links: { ...defaultSettings.social_links, ...(data.social_links || {}) },
        stats: { ...defaultSettings.stats, ...(data.stats || {}) },
        home_features: data.home_features || defaultSettings.home_features,
        features_config: { ...defaultSettings.features_config, ...(data.features_config || {}) },
        content_config: { ...defaultSettings.content_config, ...(data.content_config || {}) }
      });
    } else {
      // If no settings exist, insert defaults
      const { data: newData, error } = await supabase.from('site_settings').insert(defaultSettings).select().single();
      if (newData && !error) {
         setSiteSettings({ ...defaultSettings, ...newData });
      }
    }
  };

  const refreshEnrollments = async () => {
    if (user) {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
      if (data) setEnrollments(data as Enrollment[]);
    }
  };

  const saveLessonProgress = async (lessonId: string, position: number, duration: number, isCompleted: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      position,
      duration,
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });
    if (error) console.error("Error saving progress:", error);
  };

  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();
    return data as LessonProgress;
  };

  useEffect(() => {
    fetchCourses();
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setEnrollments([]);
        }
        setLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEnrollments([]);
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    if (siteSettings.id) {
      const { error } = await supabase.from('site_settings').update(newSettings).eq('id', siteSettings.id);
      if (!error) {
        setSiteSettings(prev => ({ ...prev, ...newSettings }));
      } else {
        console.error("Error updating settings:", error);
        throw error;
      }
    }
  };

  const checkAccess = (course: Course) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.status !== 'active') return false;
    if (!course.is_paid) return true;
    return enrollments.some(e => e.course_id === course.id);
  };

  return (
    <StoreContext.Provider value={{ 
      user, 
      loading, 
      courses, 
      enrollments,
      siteSettings, 
      refreshCourses: fetchCourses,
      refreshEnrollments,
      updateSettings,
      signOut,
      checkAccess,
      saveLessonProgress,
      getLessonProgress
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
