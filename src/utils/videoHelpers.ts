/**
 * Video URL Processing Utility
 * "Radical Solution" - Handles everything from simple links to complex script embeds.
 */

import ReactPlayer from 'react-player';

export const processVideoUrl = (input: string) => {
  if (!input) return { url: '', type: 'unknown', isEmbed: false };
  
  const cleanInput = input.trim();

  // 1. DETECT RAW EMBED CODE (The "Radical" Fix)
  // If the input contains HTML tags like <iframe, <div, <script, <embed, <object
  // We treat it as "Raw Embed" and render it directly.
  if (/<(iframe|div|script|embed|object|video)/i.test(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'embed', 
      isEmbed: true 
    };
  }

  // 2. DETECT REACT PLAYER SUPPORTED URLS
  // YouTube, Vimeo, SoundCloud, Facebook, DailyMotion, Twitch, etc.
  // Also direct files (mp4, m3u8, etc.)
  if (ReactPlayer.canPlay(cleanInput)) {
    return { 
      url: cleanInput, 
      type: 'react-player', 
      isEmbed: false 
    };
  }

  // 3. FALLBACK: GENERIC URL (Force Iframe)
  // If it's a URL but ReactPlayer doesn't know it (e.g. a custom private server link),
  // we assume it's a direct link to an embeddable page.
  return { 
    url: cleanInput, 
    type: 'iframe', 
    isEmbed: false 
  };
};

export const calculateTotalDuration = (lessons: { duration: string }[]): string => {
  let totalSeconds = 0;

  lessons.forEach(lesson => {
    if (!lesson.duration) return;
    
    const parts = lesson.duration.split(':').map(part => parseInt(part, 10));
    
    if (parts.some(isNaN)) return;

    if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds += (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      totalSeconds += (parts[0] * 60) + parts[1];
    } else if (parts.length === 1) {
      // Minutes only (legacy support)
      totalSeconds += parts[0] * 60;
    }
  });

  if (totalSeconds === 0) return "0 دقيقة";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ساعة ${minutes > 0 ? `و ${minutes} دقيقة` : ''}`;
  }
  return `${minutes} دقيقة`;
};
