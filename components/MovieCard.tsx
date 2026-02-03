
import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  isAdmin?: boolean;
  isUserPremium?: boolean;
  onDelete?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, isAdmin, isUserPremium, onDelete }) => {
  const isLocked = movie.isPremium && !isUserPremium && !isAdmin;
  const posterUrl = movie.posterData instanceof Blob ? URL.createObjectURL(movie.posterData) : movie.posterUrl;

  return (
    <div className="relative group animate-in fade-in zoom-in-95 duration-700">
      <div className={`absolute -inset-1 bg-gradient-to-r ${isLocked ? 'from-amber-500 to-yellow-600' : 'from-[#0063e5] to-purple-600'} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>
      
      <div 
        onClick={() => onClick(movie)}
        className={`relative aspect-[2/3] w-full rounded-2xl overflow-hidden cursor-pointer shadow-2xl border-2 transition-all duration-500 group-hover:scale-105 bg-[#1a1d29] ${isLocked ? 'border-yellow-500/20' : 'border-white/5 group-hover:border-white/40'}`}
      >
        <img 
          src={posterUrl} 
          alt={movie.title} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLocked ? 'grayscale opacity-60' : ''}`}
        />
        
        {isAdmin && onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(confirm('Löschen?')) onDelete(); }}
            className="absolute top-4 right-4 z-50 bg-black/60 backdrop-blur-xl text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-all border border-white/10"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        )}

        <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
           {movie.isPremium && (
             <div className="bg-yellow-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
               <i className="fa-solid fa-crown text-[8px]"></i> PRO
             </div>
           )}
           {movie.type === 'series' && (
             <div className="bg-[#0063e5] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl">
               SERIE
             </div>
           )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
           <h4 className="text-white text-base font-black uppercase tracking-tighter italic leading-tight">{movie.title}</h4>
           <div className="flex items-center justify-between mt-3">
             <span className="text-[10px] font-black text-white/40 uppercase">{movie.genre} • {movie.year}</span>
             <i className={`fa-solid ${isLocked ? 'fa-lock' : 'fa-play-circle'} text-white text-2xl`}></i>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
