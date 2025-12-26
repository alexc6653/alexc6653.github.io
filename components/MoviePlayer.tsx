
import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';

interface MoviePlayerProps {
  movie: Movie | null;
  onClose: () => void;
}

type Quality = '480p' | '720p' | '1080p';
type AspectRatio = 'contain' | 'cover';

const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<Quality>('1080p');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('contain');
  const [skipIndicator, setSkipIndicator] = useState<{ type: 'back' | 'forward', visible: boolean }>({ type: 'forward', visible: false });
  
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<number | null>(null);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) {
        if (e.key === 'Escape') setShowSettings(false);
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'j':
        case 'arrowleft':
          skipAction(-10);
          break;
        case 'l':
        case 'arrowright':
          skipAction(10);
          break;
        case 'escape':
          if (!document.fullscreenElement) onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, showSettings]);

  useEffect(() => {
    if (movie && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
    resetControlsTimer();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [movie]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newState = !isMuted;
      setIsMuted(newState);
      videoRef.current.muted = newState;
    }
    resetControlsTimer();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
    resetControlsTimer();
  };

  const skipAction = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setSkipIndicator({ type: seconds > 0 ? 'forward' : 'back', visible: true });
      setTimeout(() => setSkipIndicator(prev => ({ ...prev, visible: false })), 600);
    }
    resetControlsTimer();
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      skipAction(-10);
    } else {
      skipAction(10);
    }
  };

  if (!movie) return null;

  const isYouTube = movie.videoUrl.includes('youtube.com') || movie.videoUrl.includes('youtu.be');

  return (
    <div 
      ref={playerRef}
      className={`fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none transition-all duration-500 ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* VIDEO STAGE */}
      <div className="relative w-full h-full flex items-center justify-center group/stage">
        {isYouTube ? (
          <iframe
            src={`${movie.videoUrl}${movie.videoUrl.includes('?') ? '&' : '?'}autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        ) : (
          <>
            <video
              ref={videoRef}
              src={movie.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onLoadedMetadata={() => {
                setDuration(videoRef.current?.duration || 0);
                setIsLoading(false);
              }}
              onDoubleClick={handleDoubleClick}
              className={`w-full h-full transition-all duration-700 ${aspectRatio === 'cover' ? 'object-cover' : 'object-contain'}`}
              onClick={togglePlay}
            />
            
            {/* SKIP INDICATOR ANIMATION */}
            {skipIndicator.visible && (
              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[2300]`}>
                <div className={`flex flex-col items-center animate-ping duration-300 opacity-60`}>
                  <i className={`fa-solid fa-rotate-${skipIndicator.type === 'forward' ? 'right' : 'left'} text-8xl text-white`}></i>
                  <span className="text-2xl font-black text-white mt-4">10s</span>
                </div>
              </div>
            )}

            {/* LOADING SPINNER */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[4px] z-[2250]">
                <div className="w-20 h-20 border-[6px] border-white/10 border-t-[#0063e5] rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}

        {/* INTERFACE OVERLAYS */}
        {!isYouTube && (
          <>
            {/* DYNAMIC SHADOWS */}
            <div className={`absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-1000 pointer-events-none z-[2050] ${showControls ? 'opacity-100' : 'opacity-0'}`} />

            {/* TOP BAR */}
            <div className={`absolute top-0 left-0 right-0 p-8 md:p-12 flex items-center justify-between transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-[2100] ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
              <div className="flex items-center gap-8">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-14 h-14 flex items-center justify-center text-white hover:text-[#0063e5] transition-all active:scale-75"
                >
                  <i className="fa-solid fa-arrow-left text-4xl"></i>
                </button>
                <div className="h-12 w-[1.5px] bg-white/10 hidden sm:block"></div>
                <div className="flex flex-col">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-none drop-shadow-2xl">{movie.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[12px] text-[#0063e5] font-black uppercase tracking-[0.3em]">{movie.genre}</span>
                    <span className="text-white/30 text-xs">•</span>
                    <span className="text-white/50 text-[12px] font-bold uppercase tracking-widest">{movie.year}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setAspectRatio(prev => prev === 'contain' ? 'cover' : 'contain'); }}
                   className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border border-white/10 ${aspectRatio === 'cover' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                   title="Bildformat anpassen"
                 >
                   <i className={`fa-solid ${aspectRatio === 'cover' ? 'fa-compress-arrows-alt' : 'fa-expand-arrows-alt'} text-xl`}></i>
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                   className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${showSettings ? 'bg-[#0063e5] text-white' : 'text-white hover:bg-white/10'}`}
                 >
                   <i className="fa-solid fa-gear text-2xl"></i>
                 </button>
              </div>
            </div>

            {/* QUALITY MENU POPUP */}
            {showSettings && (
              <div className="absolute top-32 right-12 w-64 bg-[#1a1d29]/98 backdrop-blur-2xl border border-white/10 rounded-[24px] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-[2200] animate-in fade-in slide-in-from-top-6 duration-300">
                <div className="p-5 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 mb-2">Streaming Engine v2.5</div>
                {(['1080p', '720p', '480p'] as Quality[]).map((q) => (
                  <button
                    key={q}
                    onClick={(e) => { e.stopPropagation(); setQuality(q); setShowSettings(false); }}
                    className={`w-full text-left p-5 text-sm font-bold rounded-xl transition-all flex items-center justify-between ${quality === q ? 'bg-[#0063e5] text-white shadow-xl shadow-[#0063e5]/20' : 'text-white/80 hover:bg-white/10'}`}
                  >
                    {q} {q === '1080p' && <span className="text-[9px] opacity-60 ml-2">ULTRA HD</span>}
                    {quality === q && <i className="fa-solid fa-check text-xs"></i>}
                  </button>
                ))}
              </div>
            )}

            {/* BOTTOM BAR CONTROLS */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-16 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-[2100] ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
              <div className="max-w-7xl mx-auto flex flex-col gap-10">
                
                {/* PROGRESS BAR */}
                <div className="group/timeline relative">
                  <div className="relative w-full h-1.5 bg-white/10 rounded-full cursor-pointer transition-all group-hover/timeline:h-2">
                    <input 
                      type="range" min="0" max="100" step="0.1" value={progress} 
                      onChange={handleSeek}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[2150]"
                    />
                    {/* Buffer Bar Simulation */}
                    <div className="absolute top-0 left-0 h-full bg-white/10 rounded-full" style={{ width: '85%' }}></div>
                    {/* Active Bar */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#0063e5] transition-all duration-75 ease-out rounded-full shadow-[0_0_15px_#0063e5]" 
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full scale-0 group-hover/timeline:scale-100 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] border-4 border-[#0063e5]" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-sm font-black text-white/40 tracking-widest tabular-nums">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-white/80">-{formatTime(duration - currentTime)}</span>
                  </div>
                </div>

                {/* CONTROL ROW */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-12">
                    <div className="flex items-center gap-8">
                      <button onClick={(e) => skipAction(-10)} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-90">
                        <i className="fa-solid fa-rotate-left text-3xl"></i>
                      </button>
                      <button 
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-90"
                      >
                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl ${!isPlaying ? 'ml-2' : ''}`}></i>
                      </button>
                      <button onClick={(e) => skipAction(10)} className="text-white/50 hover:text-white transition-all hover:scale-110 active:scale-90">
                        <i className="fa-solid fa-rotate-right text-3xl"></i>
                      </button>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 hover:bg-white/10 transition-all rounded-3xl px-8 py-4 border border-white/5 group/volume">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                        className="text-white hover:text-[#0063e5] transition-all active:scale-90"
                      >
                        <i className={`fa-solid ${isMuted || volume === 0 ? 'fa-volume-xmark' : 'fa-volume-high'} text-2xl`}></i>
                      </button>
                      <div className="w-0 group-hover/volume:w-36 overflow-hidden transition-all duration-500 flex items-center h-8">
                        <input 
                          type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (videoRef.current) videoRef.current.volume = v;
                            setIsMuted(v === 0);
                          }}
                          className="w-full h-1.5 bg-white/20 appearance-none rounded-full cursor-pointer accent-[#0063e5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <button className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90 group relative">
                      <i className="fa-solid fa-closed-captioning text-3xl"></i>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#1a1d29] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Untertitel</div>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                      className="text-white/40 hover:text-[#0063e5] transition-all hover:scale-110 active:scale-90"
                      title="Vollbild umschalten (F)"
                    >
                      <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-3xl`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        input[type='range'] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 4px solid #0063e5;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        
        .cursor-none {
          cursor: none !important;
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default MoviePlayer;
