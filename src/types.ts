export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'admin' | 'student';
  status: 'pending' | 'active' | 'banned';
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  is_paid: boolean;
  rating: number;
  level: string;
  duration?: string;
  lesson_count?: number;
  created_at?: string;
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
}

export interface Subtitle {
  id?: string;
  lesson_id: string;
  lang: string;
  label: string;
  vtt_url: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  position: number;
  duration: number;
  is_completed: boolean;
  updated_at: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  logo_url?: string;
  
  // English Translations (Top-Level Columns)
  site_name_en?: string;
  hero_title_en?: string;
  hero_title_line1_en?: string;
  hero_title_line2_en?: string;
  hero_desc_en?: string;

  // CMS Content (Flexible JSON)
  content_config?: {
    [key: string]: string;
  };

  // Feature Toggles
  features_config?: {
    show_coming_soon?: boolean;
    show_stats?: boolean;
    allow_registration?: boolean;
    social_whatsapp_visible?: boolean;
    social_facebook_visible?: boolean;
    social_telegram_visible?: boolean;
    social_youtube_visible?: boolean;
    social_instagram_visible?: boolean;
    social_tiktok_visible?: boolean;
    social_twitter_visible?: boolean;
  };
  
  // Legacy Fields
  hero_title_line1?: string;
  hero_title_line2?: string;
  hero_desc?: string;
  
  stats?: {
    students?: string;
    hours?: string;
  };
  
  social_links: {
    telegram?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    whatsapp?: string;
  };
  
  home_features?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  
  maintenance_mode: boolean;
  allow_registration: boolean;
}
