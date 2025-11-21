/**
 * Video URL Processing Utility
 * هذا الملف هو المسؤول عن تحويل الروابط المختلفة إلى صيغ قابلة للتشغيل
 */

export const processVideoUrl = (url: string) => {
  if (!url) return { url: '', type: 'unknown' };
  
  let cleanUrl = url.trim();
  let type = 'iframe'; // الافتراضي

  // 1. YouTube (الأكثر شيوعاً)
  // يدعم الروابط المختصرة والكاملة وروابط التضمين
  if (cleanUrl.match(/(youtube\.com|youtu\.be)/)) {
    return { url: cleanUrl, type: 'react-player' };
  }

  // 2. Vimeo
  if (cleanUrl.match(/vimeo\.com/)) {
    return { url: cleanUrl, type: 'react-player' };
  }

  // 3. ملفات الفيديو المباشرة (MP4, MOV, WEBM)
  // هذه تعمل بشكل ممتاز مع ReactPlayer
  if (cleanUrl.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
    return { url: cleanUrl, type: 'react-player' };
  }

  // 4. Google Drive (المشكلة الأكبر عادة)
  // نقوم بتحويل رابط العرض العادي إلى رابط معاينة (Preview) الذي يقبل التضمين
  if (cleanUrl.includes('drive.google.com')) {
    type = 'iframe';
    
    // إزالة أي بارامترات قد تعيق التشغيل
    if (cleanUrl.includes('/view')) {
      cleanUrl = cleanUrl.replace(/\/view.*/, '/preview');
    } else if (cleanUrl.includes('/edit')) {
      cleanUrl = cleanUrl.replace(/\/edit.*/, '/preview');
    } else if (!cleanUrl.includes('/preview')) {
      // إذا كان الرابط ينتهي بالمعرف فقط
      if (cleanUrl.endsWith('/')) cleanUrl += 'preview';
      else cleanUrl += '/preview';
    }
  }

  // 5. Dropbox
  else if (cleanUrl.includes('dropbox.com')) {
    type = 'react-player';
    // تحويل dl=0 إلى raw=1 للحصول على دفق الفيديو المباشر
    cleanUrl = cleanUrl.replace('dl=0', 'raw=1');
  }

  // 6. Zoom Recordings / Microsoft Teams / Other Embeds
  // إذا قام المستخدم بوضع كود iframe كامل بدلاً من الرابط
  else if (cleanUrl.includes('<iframe')) {
     const srcMatch = cleanUrl.match(/src="([^"]+)"/);
     if (srcMatch && srcMatch[1]) {
       cleanUrl = srcMatch[1];
       type = 'iframe';
     }
  }

  return { url: cleanUrl, type };
};
