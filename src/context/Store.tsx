import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment } from '../types';

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
}

const defaultSettings: SiteSettings = {
  site_name: "Sniper FX Gold",
  hero_title: "تداول بذكاء بدقة القناص",
  hero_title_line1: "تداول بذكاء",
  hero_title_line2: "بدقة القناص",
  hero_desc: "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي (LMS) متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
  logo_url: "",
  stats: { students: "+1500", hours: "+50" },
  social_links: { 
    telegram: "https://t.me", 
    instagram: "https://instagram.com", 
    youtube: "https://youtube.com",
    facebook: "https://facebook.com"
  },
  home_features: [
    { title: "تحليل فني متقدم", description: "تعلم استراتيجيات التحليل الفني التي تستخدمها البنوك الكبرى.", icon: "LineChart" },
    { title: "إدارة مخاطر صارمة", description: "كيف تحمي رأس مالك وتضاعف أرباحك بأقل مخاطرة ممكنة.", icon: "Shield" },
    { title: "سيكولوجية التداول", description: "التحكم في المشاعر والانضباط هو مفتاح النجاح في الأسواق.", icon: "Brain" },
    { title: "مجتمع حصري", description: "تواصل مع نخبة المتداولين وتبادل الخبرات والفرص يومياً.", icon: "Users" }
  ],
  about_title: "من نحن",
  about_desc: "نحن أكاديمية رائدة في مجال تعليم تداول الذهب والفوركس، نسعى لبناء جيل من المتداولين المحترفين.",
  about_sections: [],
  statistics: []
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
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
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) {
      const enhancedCourses = data.map((c: any) => ({
        ...c,
        level: c.level || 'متوسط',
        duration: c.duration || '15 ساعة',
        lesson_count: c.lesson_count || 12
      }));
      setCourses(enhancedCourses as Course[]);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    if (data) {
      setSiteSettings({
        ...defaultSettings,
        ...data,
        social_links: { ...defaultSettings.social_links, ...(data.social_links || {}) },
        stats: { ...defaultSettings.stats, ...(data.stats || {}) }
      });
    } else {
      // If no settings exist, create default row
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

  useEffect(() => {
    fetchCourses();
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setEnrollments([]);
      }
      setLoading(false);
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
      checkAccess
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
