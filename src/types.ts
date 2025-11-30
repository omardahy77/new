export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'admin' | 'student';
  status: 'pending' | 'active' | 'banned';
  created_at?: string;
}

export interface Subtitle {
  id?: string;
  lesson_id?: string;
  lang: string;
  label: string;
  vtt_url: string;
}

export interface LessonProgress {
  lesson_id: string;
  position: number;
  duration: number;
  is_completed: boolean;
  updated_at?: string;
}

export interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  order: number;
  duration: string;
  is_published?: boolean;
  subtitles?: Subtitle[];
  user_progress?: LessonProgress;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  is_paid: boolean;
  rating: number;
  lessons?: Lesson[];
  created_at?: string;
  level?: 'مبتدئ' | 'متوسط' | 'خبير';
  duration?: string;
  lesson_count?: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  site_name_en?: string;
  hero_title: string;
  hero_title_en?: string;
  hero_title_line1?: string;
  hero_title_line1_en?: string;
  hero_title_line2?: string;
  hero_title_line2_en?: string;
  hero_desc: string;
  hero_desc_en?: string;
  logo_url?: string;
  maintenance_mode?: boolean;
  social_links: {
    telegram?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    whatsapp?: string;
  };
  stats: {
    students: string;
    hours: string;
  };
  home_features?: Feature[];
  
  // Dynamic Configuration
  features_config?: {
    show_coming_soon?: boolean;
    show_stats?: boolean;
    allow_registration?: boolean;
    social_facebook_visible?: boolean;
    social_instagram_visible?: boolean;
    social_telegram_visible?: boolean;
    social_youtube_visible?: boolean;
    social_tiktok_visible?: boolean;
    social_twitter_visible?: boolean;
    social_whatsapp_visible?: boolean;
    [key: string]: any;
  };
  content_config?: {
    [key: string]: any; // Flexible key-value store for CMS
  };
}
