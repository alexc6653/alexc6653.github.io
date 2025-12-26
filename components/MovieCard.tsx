
import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  isAdmin?: boolean;
  onDelete?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, isAdmin, onDelete }) => {
  return (
    <div className="relative flex flex-col group flex-shrink-0 animate-in fade-in duration-500">
      {/* GLOW EFFECT LAYER */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#0063e5] to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
      
      <div 
        onClick={() => onClick(movie)}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden cursor-pointer shadow-2xl border-2 border-white/5 transition-all duration-500 group-hover:scale-[1.05] group-hover:border-white/40 bg-[#1a1d29]"
      >
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {isAdmin && onDelete && (
          <div className="absolute top-3 right-3 z-50">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="bg-black/60 backdrop-blur-md text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-600 transition-all border border-white/10"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        )}

        {/* PREMIUM BADGE */}
        {movie.isPremium && (
          <div className="absolute top-3 left-3 z-50">
             <div className="bg-yellow-500 text-black px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest shadow-xl">PRO</div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
           <h4 className="text-white text-sm font-black uppercase tracking-tight leading-tight truncate">{movie.title}</h4>
           <div className="flex items-center justify-between mt-2">
             <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#0063e5] font-black">{movie.rating} IMDB</span>
                <span className="text-[10px] text-white/40 font-bold">{movie.year}</span>
             </div>
             <i className="fa-solid fa-circle-play text-white/80 text-xl"></i>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
