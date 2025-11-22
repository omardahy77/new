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
  site_name_en?: string; // Added English Site Name
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
  
  // New Configs
  features_config?: {
    show_coming_soon?: boolean;
    show_stats?: boolean;
    allow_registration?: boolean;
    
    // Social Visibility Flags
    social_facebook_visible?: boolean;
    social_instagram_visible?: boolean;
    social_telegram_visible?: boolean;
    social_youtube_visible?: boolean;
    social_tiktok_visible?: boolean;
    social_whatsapp_visible?: boolean;

    [key: string]: any;
  };
  content_config?: {
    // Home
    why_choose_us_title?: string;
    why_choose_us_title_en?: string;
    why_choose_us_desc?: string;
    why_choose_us_desc_en?: string;
    cta_title?: string;
    cta_title_en?: string;
    cta_desc?: string;
    cta_desc_en?: string;
    
    // Footer / Bottom Section
    footer_tagline?: string;
    footer_tagline_en?: string;
    footer_sub_tagline?: string;
    footer_sub_tagline_en?: string;
    
    // About Page
    about_main_title?: string;
    about_main_title_en?: string;
    about_main_desc?: string;
    about_main_desc_en?: string;
    mission_title?: string;
    mission_title_en?: string;
    mission_desc?: string;
    mission_desc_en?: string;
    vision_title?: string;
    vision_title_en?: string;
    vision_desc?: string;
    vision_desc_en?: string;
    stats_students_label?: string;
    stats_students_label_en?: string;
    stats_hours_label?: string;
    stats_hours_label_en?: string;
    stats_support_label?: string;
    stats_support_label_en?: string;
    stats_support_value?: string;

    // Contact Page
    contact_main_title?: string;
    contact_main_title_en?: string;
    contact_main_desc?: string;
    contact_main_desc_en?: string;
    
    // Social Cards Texts (Bilingual)
    fb_card_title?: string; fb_card_title_en?: string;
    fb_card_sub?: string; fb_card_sub_en?: string;
    fb_card_btn?: string; fb_card_btn_en?: string;
    
    insta_card_title?: string; insta_card_title_en?: string;
    insta_card_sub?: string; insta_card_sub_en?: string;
    insta_card_btn?: string; insta_card_btn_en?: string;
    
    tg_card_title?: string; tg_card_title_en?: string;
    tg_card_sub?: string; tg_card_sub_en?: string;
    tg_card_btn?: string; tg_card_btn_en?: string;

    yt_card_title?: string; yt_card_title_en?: string;
    yt_card_sub?: string; yt_card_sub_en?: string;
    yt_card_btn?: string; yt_card_btn_en?: string;

    tt_card_title?: string; tt_card_title_en?: string;
    tt_card_sub?: string; tt_card_sub_en?: string;
    tt_card_btn?: string; tt_card_btn_en?: string;

    wa_card_title?: string; wa_card_title_en?: string;
    wa_card_sub?: string; wa_card_sub_en?: string;
    wa_card_btn?: string; wa_card_btn_en?: string;

    // Courses Page & Coming Soon
    courses_main_title?: string; courses_main_title_en?: string;
    courses_main_desc?: string; courses_main_desc_en?: string;
    coming_soon_title?: string; coming_soon_title_en?: string;
    coming_soon_desc?: string; coming_soon_desc_en?: string;
    coming_soon_badge?: string; coming_soon_badge_en?: string;
    coming_soon_feature_1?: string; coming_soon_feature_1_en?: string;
    coming_soon_feature_2?: string; coming_soon_feature_2_en?: string;

    [key: string]: any;
  };
}
