import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useStore } from '../context/Store';
import { processVideoUrl } from '../utils/videoHelpers';
import { Loader2, Play, AlertTriangle, ExternalLink } from 'lucide-react';
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

  const { url: processedUrl, type } = processVideoUrl(url);

  // Load saved progress when lesson changes
  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setError(false);
    setResumed(false);
    
    const loadProgress = async () => {
      const progress = await getLessonProgress(lessonId);
      if (progress && progress.position > 0 && playerRef.current) {
        // We defer seeking until onReady
      }
    };
    loadProgress();
  }, [lessonId]);

  const handleReady = async () => {
    setReady(true);
    setPlaying(true); // Auto-play on ready
    
    // Resume logic
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
    
    // Save every 10 seconds
    if (currentTime - lastSavedTime > 10) {
      saveLessonProgress(lessonId, currentTime, playerRef.current?.getDuration() || 0, false);
      setLastSavedTime(currentTime);
    }
  }, [lessonId, lastSavedTime, saveLessonProgress]);

  const handleEnded = () => {
    saveLessonProgress(lessonId, playerRef.current?.getDuration() || 0, playerRef.current?.getDuration() || 0, true);
    if (onEnded) onEnded();
  };

  // Configure subtitles for MP4/HLS
  const fileConfig = {
    attributes: {
      crossOrigin: 'true', // Required for VTT
      controlsList: 'nodownload'
    },
    tracks: subtitles?.map(sub => ({
      kind: 'subtitles',
      src: sub.vtt_url,
      srcLang: sub.lang,
      label: sub.label,
      default: sub.lang === 'en' // Default to English if present
    }))
  };

  if (error || type === 'iframe') {
    // Fallback for generic iframes or errors
    if (type === 'iframe') {
        return (
            <iframe
                src={processedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    }
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-white p-8 text-center z-10">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">تعذر تشغيل الفيديو</h3>
        <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            className="btn-gold px-6 py-3 flex items-center gap-2"
        >
            <ExternalLink size={18} /> مشاهدة عبر المصدر
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black group">
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
            file: fileConfig,
            youtube: { playerVars: { showinfo: 0, rel: 0, modestbranding: 1 } }
        }}
        style={{ backgroundColor: '#000' }}
      />
    </div>
  );
};
