
import React, { useState } from 'react';

interface NavbarProps {
  onAddClick: () => void;
  onSearchChange: (val: string) => void;
  searchTerm: string;
  isAdmin: boolean;
  onLogout: () => void;
  userName: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onAddClick, 
  onSearchChange, 
  searchTerm, 
  isAdmin, 
  onLogout, 
  userName 
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[#02040a]/70 backdrop-blur-2xl h-[80px] px-10 flex items-center justify-between border-b border-white/5 transition-all duration-300">
      <div className="flex items-center gap-12 flex-1">
        {/* Brand Identity */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => window.location.reload()}
        >
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <img src="https://img.icons8.com/color/48/popcorn.png" alt="Logo" className="w-10 h-10 relative z-10" />
          </div>
          <h1 className="text-2xl font-black tracking-[-1px] text-white flex items-center">
            MEGA<span className="text-white/40">KINO</span>
            <span className="text-[#0063e5] text-3xl font-light ml-0.5">+</span>
          </h1>
        </div>

        {/* Cinematic Links */}
        <div className="hidden lg:flex items-center gap-10">
          <button className="flex items-center gap-2.5 text-[11px] font-black tracking-[2px] text-white/60 hover:text-white uppercase transition-all relative after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-[2px] after:bg-[#0063e5] after:scale-x-0 hover:after:scale-x-100 after:transition-transform">
            <i className="fa-solid fa-house text-sm"></i> HOME
          </button>
          
          <div className="relative flex items-center gap-3 group">
            <i className={`fa-solid fa-magnifying-glass text-sm transition-colors ${isSearchActive ? 'text-[#0063e5]' : 'text-white/60'}`}></i>
            <input 
              type="text" 
              placeholder="SUCHEN"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => !searchTerm && setIsSearchActive(false)}
              className={`bg-transparent border-b-2 border-transparent focus:border-[#0063e5] outline-none text-[11px] font-black tracking-[2px] uppercase transition-all duration-500 ${isSearchActive || searchTerm ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}
            />
            {!isSearchActive && !searchTerm && (
              <span className="text-[11px] font-black tracking-[2px] uppercase cursor-pointer text-white/60" onClick={() => setIsSearchActive(true)}>SUCHE</span>
            )}
          </div>

          <button className="flex items-center gap-2.5 text-[11px] font-black tracking-[2px] text-white/60 hover:text-white uppercase transition-all">
            <i className="fa-solid fa-plus text-sm"></i> WATCHLIST
          </button>
          <button className="flex items-center gap-2.5 text-[11px] font-black tracking-[2px] text-white/60 hover:text-white uppercase transition-all">
            <i className="fa-solid fa-film text-sm"></i> FILME
          </button>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-8">
        {isAdmin && (
          <button 
            onClick={onAddClick}
            className="group relative px-7 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[2px] rounded-full transition-all hover:bg-[#0063e5] hover:text-white shadow-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <i className="fa-solid fa-cloud-arrow-up"></i> UPLOAD
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        )}
        
        <div className="group relative flex items-center gap-4 cursor-pointer">
          <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#0063e5] to-purple-500">
            <div className="w-full h-full rounded-full bg-[#1a1d29] flex items-center justify-center font-black text-sm text-white border-2 border-[#02040a]">
              {userName[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="hidden group-hover:block absolute top-[100%] right-0 pt-4 w-56 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="glass-panel rounded-2xl p-2 shadow-2xl overflow-hidden">
              <div className="p-4 text-[10px] border-b border-white/10 text-white/40 font-black uppercase tracking-[2px]">
                Profil: {userName}
              </div>
              <button onClick={onLogout} className="w-full text-left p-4 text-[11px] hover:bg-white/5 rounded-xl transition text-red-500 font-black uppercase tracking-[2px] flex items-center gap-3">
                <i className="fa-solid fa-power-off"></i> ABMELDEN
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
