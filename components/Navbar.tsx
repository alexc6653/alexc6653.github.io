
import React, { useState } from 'react';

interface NavbarProps {
  onAddClick: () => void;
  onSearchChange: (val: string) => void;
  searchTerm: string;
  isAdmin: boolean;
  isPremium?: boolean;
  onLogout: () => void;
  userName: string;
  activeView: 'all' | 'movies' | 'series';
  onViewChange: (view: 'all' | 'movies' | 'series') => void;
  onOpenPremiumModal: () => void; // Neuer Callback für das Modal
}

const Navbar: React.FC<NavbarProps> = ({ 
  onAddClick, 
  onSearchChange, 
  searchTerm, 
  isAdmin, 
  isPremium,
  onLogout, 
  userName,
  activeView,
  onViewChange,
  onOpenPremiumModal
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Bestimme Farben basierend auf Status
  const getStatusColor = () => {
    if (isAdmin) return 'text-red-500 border-red-500/50 bg-red-500/10';
    if (isPremium) return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
    return 'text-white/40 border-white/10 bg-white/5';
  };

  const getRingGradient = () => {
    if (isAdmin) return 'from-red-600 to-red-900 shadow-[0_0_20px_rgba(220,38,38,0.6)]';
    if (isPremium) return 'from-yellow-400 to-yellow-700 shadow-[0_0_20px_rgba(234,179,8,0.6)]';
    return 'from-[#0063e5] to-purple-500';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[#02040a]/70 backdrop-blur-2xl h-[80px] px-10 flex items-center justify-between border-b border-white/5 transition-all duration-300">
      <div className="flex items-center gap-12 flex-1">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onViewChange('all')}
        >
          <div className="relative">
             <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
             <img src="https://img.icons8.com/color/48/popcorn.png" alt="Logo" className="w-10 h-10 relative z-10" />
          </div>
          <h1 className="text-2xl font-black font-heading tracking-[-1px] text-white flex items-center">
            MEGA<span className="text-white/40">KINO</span>
            <span className="text-[#0063e5] text-3xl font-light ml-0.5">+</span>
          </h1>
        </div>

        <div className="hidden lg:flex items-center gap-10">
          <button 
            onClick={() => onViewChange('all')}
            className={`flex items-center gap-2.5 text-[11px] font-bold font-heading tracking-[2px] uppercase transition-all relative ${activeView === 'all' ? 'text-white after:scale-x-100' : 'text-white/60 hover:text-white'} after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-[2px] after:bg-[#0063e5] after:scale-x-0 after:transition-transform`}
          >
            🏠 HOME
          </button>
          
          <button 
            onClick={() => onViewChange('series')}
            className={`flex items-center gap-2.5 text-[11px] font-bold font-heading tracking-[2px] uppercase transition-all relative ${activeView === 'series' ? 'text-white after:scale-x-100' : 'text-white/60 hover:text-white'} after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-[2px] after:bg-[#0063e5] after:scale-x-0 after:transition-transform`}
          >
            📺 SERIEN
          </button>

          <button 
            onClick={() => onViewChange('movies')}
            className={`flex items-center gap-2.5 text-[11px] font-bold font-heading tracking-[2px] uppercase transition-all relative ${activeView === 'movies' ? 'text-white after:scale-x-100' : 'text-white/60 hover:text-white'} after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-[2px] after:bg-[#0063e5] after:scale-x-0 after:transition-transform`}
          >
            🎬 FILME
          </button>

          <div className="relative flex items-center gap-3 group">
            <span className="text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="SUCHEN..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => !searchTerm && setIsSearchActive(false)}
              className={`bg-transparent border-b-2 border-transparent focus:border-[#0063e5] outline-none text-[11px] font-bold font-heading tracking-[2px] uppercase transition-all duration-500 ${isSearchActive || searchTerm ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {isAdmin && (
          <button 
            onClick={onAddClick}
            className="group relative px-7 py-2.5 bg-white text-black text-[10px] font-black font-heading uppercase tracking-[2px] rounded-full transition-all hover:bg-red-600 hover:text-white shadow-xl overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> UPLOAD 🚀
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        )}
        
        <div className="group relative flex items-center gap-4 cursor-pointer">
          {/* Avatar Ring */}
          <div className={`w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr transition-all duration-500 ${getRingGradient()}`}>
            <div className="w-full h-full rounded-full bg-[#1a1d29] flex items-center justify-center font-black text-sm text-white border-2 border-[#02040a]">
              {userName[0]?.toUpperCase() || '👤'}
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="hidden group-hover:block absolute top-[100%] right-0 pt-6 w-72 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="glass-panel rounded-2xl p-2 shadow-2xl overflow-hidden border border-white/10 bg-[#0b1016]/95">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-black/20">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">Angemeldet als</p>
                <p className="text-white font-bold font-heading truncate mt-1">{userName} {isAdmin ? '🛡️' : isPremium ? '👑' : '👋'}</p>
              </div>

              {/* Status Badge Area */}
              <div className="p-2 space-y-2">
                <div className={`rounded-xl p-3 flex items-center gap-3 border ${getStatusColor()}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-black/20`}>
                    <i className={`fa-solid ${isAdmin ? 'fa-shield-halved' : isPremium ? 'fa-crown' : 'fa-user'} text-sm`}></i>
                  </div>
                  <div>
                    <p className="text-[8px] font-black opacity-60 uppercase tracking-widest">Account Status</p>
                    <p className="text-[10px] font-black font-heading uppercase tracking-wider">
                      {isAdmin ? 'Administrator ⚡' : isPremium ? 'Premium Account 💎' : 'Standard User'}
                    </p>
                  </div>
                </div>

                {/* PREMIUM UPGRADE BUTTON für normale User */}
                {!isAdmin && !isPremium && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Verhindert, dass das Dropdown sofort schließt, falls gewünscht, aber hier ok
                      onOpenPremiumModal();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/30 text-yellow-500 font-black font-heading text-[9px] uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2 group/btn shadow-[0_5px_15px_rgba(234,179,8,0.1)]"
                  >
                    <i className="fa-solid fa-key group-hover/btn:rotate-12 transition-transform"></i> Code Einlösen 🔑
                  </button>
                )}
              </div>

              {/* Logout */}
              <button onClick={onLogout} className="w-full text-left p-4 text-[10px] hover:bg-red-500/10 rounded-xl transition text-red-500 font-black font-heading uppercase tracking-[2px] flex items-center gap-3 mt-1">
                <i className="fa-solid fa-power-off"></i> ABMELDEN ✌️
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
