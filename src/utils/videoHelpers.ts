/**
 * Video URL Processing & Time Formatting Utility
 */

import ReactPlayer from 'react-player';
import { translations } from './translations';

export const processVideoUrl = (input: string) => {
  if (!input) return { url: '', type: 'unknown', isEmbed: false };
  
  let cleanInput = input.trim();

  // 1. DETECT RAW EMBED CODE (HTML)
  if (/<(iframe|div|script|embed|object|video)/i.test(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'embed', 
      isEmbed: true 
    };
  }

  // 2. YOUTUBE SHORTS SUPPORT
  if (cleanInput.includes('youtube.com/shorts/')) {
    cleanInput = cleanInput.replace('youtube.com/shorts/', 'youtube.com/watch?v=');
  }

  // 3. GOOGLE DRIVE
  if (cleanInput.includes('drive.google.com')) {
    const previewUrl = cleanInput.replace('/view', '/preview');
    return {
      url: previewUrl,
      type: 'iframe', 
      isEmbed: false
    };
  }

  // 4. DETECT REACT PLAYER SUPPORTED URLS (YouTube, Vimeo, Files)
  if (ReactPlayer.canPlay(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'react-player', 
      isEmbed: false 
    };
  }

  // 5. FALLBACK: GENERIC URL (Force Iframe)
  if (cleanInput.startsWith('http')) {
      return { 
        url: cleanInput, 
        type: 'iframe', 
        isEmbed: false 
      };
  }

  return { url: cleanInput, type: 'unknown', isEmbed: false };
};

export const calculateTotalMinutes = (lessons: { duration: string }[]): number => {
  let totalSeconds = 0;
  lessons.forEach(lesson => {
    if (!lesson.duration) return;
    const cleanDuration = lesson.duration.replace(/[^\d:]/g, '');
    const parts = cleanDuration.split(':').map(part => parseInt(part, 10));
    if (parts.some(isNaN)) return;

    if (parts.length === 3) totalSeconds += (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    else if (parts.length === 2) totalSeconds += (parts[0] * 60) + parts[1];
    else if (parts.length === 1) totalSeconds += parts[0] * 60;
  });
  return Math.floor(totalSeconds / 60);
};

export const formatDuration = (durationRaw: string | number | undefined, lang: 'ar' | 'en' = 'ar'): string => {
  if (!durationRaw) return '0';
  let minutes = 0;

  if (typeof durationRaw === 'number') {
    minutes = durationRaw;
  } else {
    if (durationRaw.includes(':')) return durationRaw;
    const digits = durationRaw.replace(/\D/g, '');
    minutes = parseInt(digits, 10) || 0;
  }

  const t = translations[lang];
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${t.duration_hour}`;
    return `${hours} ${t.duration_hour} ${lang === 'ar' ? 'و' : '&'} ${mins} ${t.duration_min}`;
  }
  return `${minutes} ${t.duration_min}`;
};
