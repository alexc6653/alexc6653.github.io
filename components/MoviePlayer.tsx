import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie, Episode } from '../types';

interface MoviePlayerProps {
  movie: Movie | null;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, onClose }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay default
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialisiere erste Episode bei Serien
  useEffect(() => {
    if (movie?.type === 'series' && movie.seasons && movie.seasons.length > 0) {
      if (!currentEpisode) {
        setCurrentEpisode(movie.seasons[0].episodes[0]);
      }
    }
  }, [movie]);

  // Video Source Management
  useEffect(() => {
    if (!movie) return;

    let activeData: Blob | string | undefined;
    if (movie.type === 'series') {
      activeData = currentEpisode?.videoData || currentEpisode?.videoUrl;
    } else {
      activeData = movie.videoData || movie.videoUrl;
    }

    setIsPlaying(true);
    setProgress(0);
    setIsBuffering(true);

    if (activeData instanceof Blob) {
      const url = URL.createObjectURL(activeData);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof activeData === 'string') {
      setVideoUrl(activeData);
    } else {
      setVideoUrl('');
    }
  }, [movie, currentEpisode]);

  // Controls Visibility Handler
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      handleMouseMove();
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying]);

  // Tastatur Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!movie) return;
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          skip(10);
          break;
        case 'arrowleft':
          skip(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'escape':
          if (isFullscreen) toggleFullscreen();
          else onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, isPlaying, isFullscreen, volume, isMuted]);

  // Player Actions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
      setIsBuffering(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
      if (newMuteState) setVolume(0);
      else setVolume(1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleNextEpisode = () => {
    if (!movie?.seasons || !currentEpisode) return;
    const currentSeason = movie.seasons.find(s => s.episodes.some(e => e.id === currentEpisode.id));
    if (!currentSeason) return;
    
    const currentIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIndex < currentSeason.episodes.length - 1) {
      setCurrentEpisode(currentSeason.episodes[currentIndex + 1]);
    } else {
       // Check next season logic if needed
    }
  };

  if (!movie) return null;
  const isSeries = movie.type === 'series';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[3000] bg-black flex overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={(e) => {
         // Klick auf Video toggelt Play, aber nicht wenn auf Controls geklickt wird
         if ((e.target as HTMLElement).tagName === 'VIDEO' || (e.target as HTMLElement).id === 'video-click-area') {
           togglePlay();
         }
      }}
    >
      {/* Video Element */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            autoPlay
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onEnded={() => setShowControls(true)}
          />
        ) : (
          <div className="text-center opacity-40">
             <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 text-yellow-500"></i>
             <p className="uppercase font-black tracking-widest text-xs">Video nicht verfügbar</p>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-10">
            <div className="w-16 h-16 border-4 border-[#0063e5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Click Area for Play/Pause (invisible) */}
        <div id="video-click-area" className="absolute inset-0 z-0 cursor-pointer"></div>

        {/* Top Gradient & Title */}
        <div className={`absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/90 to-transparent transition-opacity duration-500 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-start">
            <button 
              onClick={onClose} 
              className="group flex items-center gap-3 text-white/70 hover:text-white transition-all bg-black/20 hover:bg-[#0063e5] px-4 py-2 rounded-full backdrop-blur-md"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-xl">{movie.title}</h2>
              {isSeries && currentEpisode && (
                <p className="text-[#0063e5] text-xs font-black uppercase tracking-[3px] mt-1 drop-shadow-md">
                  S{movie.seasons?.find(s => s.episodes.includes(currentEpisode))?.number || 1} | E{currentEpisode.number} - {currentEpisode.title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 px-8 pb-8 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-500 z-30 flex flex-col gap-4 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
          
          {/* Progress Bar */}
          <div className="relative group/progress h-2 w-full cursor-pointer flex items-center">
             <div className="absolute w-full h-1 bg-white/20 rounded-full group-hover/progress:h-1.5 transition-all"></div>
             <div 
               className="absolute h-1 bg-[#0063e5] rounded-full group-hover/progress:h-1.5 transition-all shadow-[0_0_15px_#0063e5]" 
               style={{ width: `${(progress / duration) * 100}%` }}
             ></div>
             <input 
               type="range" 
               min="0" 
               max={duration || 0} 
               value={progress} 
               onChange={handleSeek}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
             />
             {/* Scrubbing Handle */}
             <div 
               className="absolute w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform z-30 pointer-events-none"
               style={{ left: `${(progress / duration) * 100}%`, transform: `translateX(-50%) scale(${showControls ? 1 : 0})` }}
             ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-[#0063e5] transition-colors">
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl drop-shadow-lg`}></i>
              </button>

              <div className="flex items-center gap-4 text-white/50 group/volume">
                <button onClick={toggleMute} className="hover:text-white transition-colors w-6">
                  <i className={`fa-solid ${isMuted || volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'} text-lg`}></i>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange} 
                  className="w-0 overflow-hidden group-hover/volume:w-24 transition-all h-1 bg-white/20 accent-[#0063e5] rounded-lg cursor-pointer"
                />
              </div>

              <div className="text-xs font-black text-white/60 tracking-widest font-mono">
                {formatTime(progress)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-6">
               {isSeries && (
                 <>
                   <button 
                     onClick={handleNextEpisode}
                     className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
                     title="Nächste Folge"
                   >
                     <i className="fa-solid fa-forward-step text-xl"></i>
                   </button>
                   <button 
                     onClick={() => setShowEpisodeList(!showEpisodeList)}
                     className={`px-4 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${showEpisodeList ? 'bg-[#0063e5] border-[#0063e5] text-white' : 'border-white/20 text-white/60 hover:text-white hover:border-white'}`}
                   >
                     Episoden
                   </button>
                 </>
               )}
               
               <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                  <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xl`}></i>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Episode Sidebar (Overlay) */}
      {isSeries && (
        <div className={`absolute top-0 right-0 bottom-0 w-[350px] bg-[#0b1016]/95 backdrop-blur-xl border-l border-white/5 z-40 transition-transform duration-500 ease-out flex flex-col ${showEpisodeList ? 'translate-x-0 shadow-[-50px_0_100px_rgba(0,0,0,0.8)]' : 'translate-x-full'}`}>
           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Wähle Folge</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[2px] mt-1">Staffel {movie.seasons?.[0].number}</p>
              </div>
              <button onClick={() => setShowEpisodeList(false)} className="text-white/40 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {movie.seasons?.[0].episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => { setCurrentEpisode(ep); }}
                  className={`w-full group relative p-4 rounded-xl border transition-all flex items-center gap-4 text-left ${currentEpisode?.id === ep.id ? 'bg-[#0063e5] border-[#0063e5] text-white shadow-lg' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Folge {ep.number}</p>
                    <p className="text-xs font-bold leading-tight">{ep.title}</p>
                  </div>
                  {currentEpisode?.id === ep.id ? (
                     <i className="fa-solid fa-chart-simple animate-pulse text-[#fff]"></i>
                  ) : (
                     <i className="fa-solid fa-play text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  )}
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;