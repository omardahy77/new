/**
 * Video URL Processing & Time Formatting Utility
 */

import ReactPlayer from 'react-player';
import { translations } from './translations';

export const processVideoUrl = (input: string) => {
  if (!input) return { url: '', type: 'unknown', isEmbed: false };
  
  const cleanInput = input.trim();

  // 1. DETECT RAW EMBED CODE
  if (/<(iframe|div|script|embed|object|video)/i.test(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'embed', 
      isEmbed: true 
    };
  }

  // 2. DETECT GOOGLE DRIVE
  if (cleanInput.includes('drive.google.com')) {
    // Convert view links to preview links for better embedding
    const previewUrl = cleanInput.replace('/view', '/preview');
    return {
      url: previewUrl,
      type: 'iframe', // Google Drive works best as iframe
      isEmbed: false
    };
  }

  // 3. DETECT REACT PLAYER SUPPORTED URLS (YouTube, Vimeo, Files)
  if (ReactPlayer.canPlay(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'react-player', 
      isEmbed: false 
    };
  }

  // 4. FALLBACK: GENERIC URL (Force Iframe)
  return { 
    url: cleanInput, 
    type: 'iframe', 
    isEmbed: false 
  };
};

// New Helper: Returns just the total minutes (number)
export const calculateTotalMinutes = (lessons: { duration: string }[]): number => {
  let totalSeconds = 0;

  lessons.forEach(lesson => {
    if (!lesson.duration) return;
    
    // Remove non-numeric chars except colon
    const cleanDuration = lesson.duration.replace(/[^\d:]/g, '');
    const parts = cleanDuration.split(':').map(part => parseInt(part, 10));
    
    if (parts.some(isNaN)) return;

    if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds += (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      totalSeconds += (parts[0] * 60) + parts[1];
    } else if (parts.length === 1) {
      // Minutes only
      totalSeconds += parts[0] * 60;
    }
  });

  return Math.floor(totalSeconds / 60);
};

// STRICT Duration Formatter to avoid "Minute Minute"
export const formatDuration = (durationRaw: string | number | undefined, lang: 'ar' | 'en' = 'ar'): string => {
  if (!durationRaw) return '0';
  
  let minutes = 0;

  if (typeof durationRaw === 'number') {
    minutes = durationRaw;
  } else {
    // If string contains colon (e.g. "02:30:00"), return as is (Time format)
    if (durationRaw.includes(':')) {
       return durationRaw;
    }
    
    // Extract ONLY digits. "30 min" -> 30. "30 دقيقة" -> 30.
    const digits = durationRaw.replace(/\D/g, '');
    minutes = parseInt(digits, 10) || 0;
  }

  const t = translations[lang];
  
  // Logic: If > 60 mins, show Hours + Mins. Else show Mins.
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${t.duration_hour}`;
    return `${hours} ${t.duration_hour} ${lang === 'ar' ? 'و' : '&'} ${mins} ${t.duration_min}`;
  }
  
  // Returns "30 Min" or "30 دقيقة"
  return `${minutes} ${t.duration_min}`;
};
