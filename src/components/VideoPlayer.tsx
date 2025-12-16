import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useStore } from '../context/StoreContext';
import { processVideoUrl } from '../utils/videoHelpers';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Subtitle } from '../types';

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  subtitles?: Subtitle[];
  onEnded?: () => void;
  onError?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, lessonId, subtitles, onEnded, onError }) => {
  const playerRef = useRef<ReactPlayer>(null);
  const { saveLessonProgress, getLessonProgress } = useStore();
  
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);

  // Process the input to decide strategy
  const { url: processedUrl, type, isEmbed } = processVideoUrl(url);

  // Reset state when lesson changes
  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setError(false);
    setResumed(false);
    
    // For embeds/iframes, we assume they are "ready" immediately because we can't track their loading state easily
    if (type === 'embed' || type === 'iframe') {
        setReady(true);
    }
  }, [lessonId, type]);

  // --- REACT PLAYER LOGIC (YouTube, MP4, etc.) ---
  const handleReady = async () => {
    setReady(true);
    setPlaying(true); // Auto-play
    
    if (!resumed) {
      const progress = await getLessonProgress(lessonId);
      if (progress && progress.position > 5 && !progress.is_completed) {
        playerRef.current?.seekTo(progress.position, 'seconds');
      }
      setResumed(true);
    }
  };

  const handleProgress = useCallback((state: { playedSeconds: number; loadedSeconds: number; played: number }) => {
    const currentTime = state.playedSeconds;
    if (currentTime - lastSavedTime > 10) {
      saveLessonProgress(lessonId, currentTime, playerRef.current?.getDuration() || 0, false);
      setLastSavedTime(currentTime);
    }
  }, [lessonId, lastSavedTime, saveLessonProgress]);

  const handleEnded = () => {
    saveLessonProgress(lessonId, playerRef.current?.getDuration() || 0, playerRef.current?.getDuration() || 0, true);
    if (onEnded) onEnded();
  };

  // --- RENDERERS ---

  // 1. Error State
  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-white p-8 text-center z-10">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">تعذر تشغيل الفيديو</h3>
        <p className="text-gray-400 mb-4 text-sm">الرابط قد يكون معطلاً أو محظوراً.</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-gold px-6 py-3 flex items-center gap-2">
            <ExternalLink size={18} /> فتح الرابط الأصلي
        </a>
      </div>
    );
  }

  // 2. RAW EMBED CODE (The "Radical" Solution)
  if (type === 'embed') {
      return (
          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden aspect-video">
             {/* We inject the HTML directly. We wrap it in a div that forces responsive behavior */}
             <div 
                className="w-full h-full flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 [&>div]:w-full [&>div]:h-full"
                dangerouslySetInnerHTML={{ __html: processedUrl }}
             />
          </div>
      );
  }

  // 3. FALLBACK IFRAME (For unknown URLs)
  if (type === 'iframe') {
      return (
          <div className="relative w-full h-full bg-black aspect-video">
             <iframe
                src={processedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Player"
            />
          </div>
      );
  }

  // 4. REACT PLAYER (Standard)
  return (
    <div className="relative w-full h-full bg-black group aspect-video">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <Loader2 className="animate-spin text-gold-500 w-10 h-10" />
        </div>
      )}
      
      <ReactPlayer
        ref={playerRef}
        url={processedUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        onReady={handleReady}
        onProgress={handleProgress}
        onEnded={handleEnded}
        onError={() => setError(true)}
        config={{
            file: {
                attributes: {
                    crossOrigin: 'true',
                    controlsList: 'nodownload'
                },
                tracks: subtitles?.map(sub => ({
                    kind: 'subtitles',
                    src: sub.vtt_url,
                    srcLang: sub.lang,
                    label: sub.label,
                    default: sub.lang === 'en'
                }))
            },
            youtube: { playerVars: { showinfo: 0, rel: 0, modestbranding: 1 } }
        }}
        style={{ backgroundColor: '#000' }}
      />
    </div>
  );
};
