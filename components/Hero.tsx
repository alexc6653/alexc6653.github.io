
import React, { useState, useEffect } from 'react';
import { Movie } from '../types';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movies, onPlay }) => {
  const [index, setIndex] = useState(0);
  const featured = movies.slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;
  const current = featured[index];

  return (
    <div className="relative pt-24 pb-4 px-10">
      <div 
        onClick={() => onPlay(current)}
        className="relative aspect-[21/9] w-full rounded-[32px] overflow-hidden cursor-pointer shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-4 border-white/5 hover:border-white/20 transition-all duration-700 group"
      >
        <div className="absolute inset-0 z-0">
           <img 
             src={current.backdropUrl} 
             alt={current.title} 
             className="w-full h-full object-cover transition duration-[2000ms] group-hover:scale-105"
           />
        </div>
        
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/30 to-transparent flex items-center px-16 md:px-24">
          <div className="max-w-2xl space-y-8 animate-in slide-in-from-left-8 duration-1000">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-[#0063e5] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[2px]">MUST WATCH</span>
                <span className="text-white/60 text-xs font-bold tracking-widest uppercase">{current.genre} • {current.year}</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-[-2px] premium-text-shadow uppercase italic">
                {current.title}
              </h2>
            </div>
            
            <p className="text-white/70 text-base md:text-lg max-w-lg leading-relaxed font-medium line-clamp-2 transition-all group-hover:text-white">
              {current.description}
            </p>

            <div className="flex gap-5 pt-4">
               <button className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 hover:scale-110 active:scale-95 transition-all shadow-2xl">
                 <i className="fa-solid fa-play text-lg"></i> JETZT ANSEHEN
               </button>
               <button className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black text-xs uppercase border border-white/10 hover:bg-white/20 transition-all">
                 <i className="fa-solid fa-circle-info text-lg"></i> DETAILS
               </button>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -bottom-1/2 left-0 w-full h-full bg-blue-600/20 blur-[150px] pointer-events-none"></div>
      </div>

      {/* Modern Pagination */}
      <div className="flex justify-center gap-4 mt-8">
        {featured.map((_, i) => (
          <button 
            key={i} 
            onClick={(e) => { e.stopPropagation(); setIndex(i); }}
            className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? 'bg-[#0063e5] w-12' : 'bg-white/10 w-6 hover:bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
