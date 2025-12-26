
import React, { useState, useEffect, useMemo } from 'react';
import { Movie, User, PremiumCode } from './types';
import { INITIAL_MOVIES, CATEGORIES } from './constants';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieCard from './components/MovieCard';
import AddMovieForm from './components/AddMovieForm';
import MoviePlayer from './components/MoviePlayer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PremiumModal from './components/PremiumModal';

const App: React.FC = () => {
  // --- DATABASE & SESSION ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mk_users_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mk_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [movies, setMovies] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('mk_movies_db');
    try {
      return saved ? JSON.parse(saved) : INITIAL_MOVIES;
    } catch {
      return INITIAL_MOVIES;
    }
  });

  const [premiumCodes, setPremiumCodes] = useState<PremiumCode[]>(() => {
    const saved = localStorage.getItem('mk_codes_db');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdminDashOpen, setIsAdminDashOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('mk_users_db', JSON.stringify(users));
    localStorage.setItem('mk_movies_db', JSON.stringify(movies));
    localStorage.setItem('mk_codes_db', JSON.stringify(premiumCodes));
    if (currentUser) {
      localStorage.setItem('mk_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mk_session_user');
    }
  }, [users, movies, premiumCodes, currentUser]);

  // --- FILTER LOGIC ---
  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || 
                              m.genre.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [movies, searchTerm, activeCategory]);

  // --- HANDLERS ---
  const handleLogin = (u: string, p: string) => {
    if (u === 'Zinkereru' && p === '78187') {
      setCurrentUser({ username: u, password: p, isAdmin: true, isPremium: true });
      return;
    }
    const found = users.find(user => user.username === u && user.password === p);
    if (found) setCurrentUser(found);
    else alert("Anmeldedaten falsch!");
  };

  const handleRegister = (u: User) => {
    if (users.some(existing => existing.username === u.username)) {
      alert("Benutzername bereits vergeben!");
      return;
    }
    setUsers(prev => [...prev, u]);
    setCurrentUser(u);
  };

  const handleWipeDatabase = () => {
    if (window.confirm('🚨 MASTER RESET: Möchtest du wirklich alle Filme löschen?')) {
      setMovies([]);
      localStorage.removeItem('mk_movies_db');
    }
  };

  const handleActivateCode = (code: string) => {
    const cleaned = code.trim().toUpperCase();
    const idx = premiumCodes.findIndex(c => c.code === cleaned && !c.isUsed);
    if (idx !== -1) {
      const updatedCodes = [...premiumCodes];
      updatedCodes[idx].isUsed = true;
      setPremiumCodes(updatedCodes);
      
      const upgraded = { ...currentUser!, isPremium: true };
      setCurrentUser(upgraded);
      setUsers(prev => prev.map(u => u.username === currentUser?.username ? upgraded : u));
      setIsPremiumModalOpen(false);
      alert("✨ PRO LEVEL FREIGESCHALTET!");
      return true;
    }
    alert("Code ungültig!");
    return false;
  };

  const MovieRow = ({ title, category }: { title: string, category: string }) => {
    // Hier fixen wir die Filterung: Alles Kleingeschrieben vergleichen
    const rowMovies = category === 'Neu' 
      ? movies.slice(0, 10) // Alle Filme, die neuesten zuerst
      : movies.filter(m => m.genre.toLowerCase() === category.toLowerCase());
      
    if (rowMovies.length === 0) return null;
    return (
      <section className="px-9 mt-12 space-y-4">
        <h3 className="text-xl font-bold tracking-wide text-gray-200 uppercase flex items-center gap-3">
          <span className="w-1 h-6 bg-[#0063e5] rounded-full"></span>
          {title}
        </h3>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8 pt-2">
          {rowMovies.map(movie => (
            <div key={movie.id} className="w-[160px] md:w-[220px]">
              <MovieCard 
                movie={movie} 
                onClick={setSelectedMovie} 
                isAdmin={currentUser?.isAdmin}
                onDelete={() => setMovies(m => m.filter(f => f.id !== movie.id))}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (!currentUser) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <div className="min-h-screen bg-[#040714] text-white flex flex-col pb-20">
      <Navbar 
        onAddClick={() => setIsFormOpen(true)} 
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        isAdmin={currentUser.isAdmin} 
        onLogout={() => setCurrentUser(null)} 
        userName={currentUser.username} 
      />

      {/* Hero nur anzeigen wenn keine Suche aktiv ist */}
      {movies.length > 0 && searchTerm === '' && activeCategory === 'All' && (
        <Hero movies={movies} onPlay={setSelectedMovie} />
      )}

      {/* Marken/Kategorien Kacheln */}
      <section className="px-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mt-8 pt-24 lg:pt-8">
        {CATEGORIES.filter(c => c !== 'All').map(cat => (
          <div 
            key={cat} 
            onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
            className={`glass-panel rounded-xl border-[3px] p-6 flex flex-col items-center justify-center cursor-pointer group h-[120px] transition-all duration-300 ${
              activeCategory === cat ? 'border-white bg-[#0063e5]/20 shadow-[0_0_30px_rgba(0,99,229,0.3)]' : 'border-white/5'
            }`}
          >
            <span className={`text-lg font-black uppercase tracking-widest transition ${
              activeCategory === cat ? 'text-white' : 'text-white/30 group-hover:text-white'
            }`}>{cat}</span>
            <div className={`mt-2 text-[10px] font-bold text-[#0063e5] transition ${
              activeCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {activeCategory === cat ? 'GEFILTERT' : 'ANZEIGEN'}
            </div>
          </div>
        ))}
      </section>

      {/* Suchergebnisse oder Zeilenansicht */}
      {(searchTerm !== '' || activeCategory !== 'All') ? (
        <section className="px-9 mt-12 space-y-8 min-h-[50vh]">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-2xl font-black tracking-wide text-gray-200 uppercase">
              {searchTerm !== '' ? `Suche: "${searchTerm}"` : `Kategorie: ${activeCategory}`}
            </h3>
            <button 
              onClick={() => {setSearchTerm(''); setActiveCategory('All');}}
              className="text-xs font-black text-[#0063e5] uppercase tracking-widest hover:brightness-125 transition"
            >
              <i className="fa-solid fa-rotate-left mr-2"></i> Filter löschen
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredMovies.map(movie => (
              <MovieCard 
                key={movie.id}
                movie={movie} 
                onClick={setSelectedMovie} 
                isAdmin={currentUser.isAdmin}
                onDelete={() => setMovies(m => m.filter(f => f.id !== movie.id))}
              />
            ))}
          </div>
          {filteredMovies.length === 0 && (
            <div className="py-32 text-center opacity-30">
              <i className="fa-solid fa-film text-7xl mb-6"></i>
              <p className="text-xl font-black uppercase tracking-[0.3em]">Keine Filme in dieser Auswahl</p>
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          {movies.length > 0 ? (
            <>
              <MovieRow title="Neu bei MegaKino+" category="Neu" />
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <MovieRow key={cat} title={`${cat} Highlights`} category={cat} />
              ))}
            </>
          ) : (
            <div className="py-40 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <i className="fa-solid fa-plus text-3xl text-white/20"></i>
              </div>
              <p className="text-white/40 font-black uppercase tracking-widest">Die Datenbank ist leer.</p>
              {currentUser.isAdmin && <p className="text-[#0063e5] text-[10px] font-bold mt-2">Klicke auf UPLOAD um Filme hinzuzufügen.</p>}
            </div>
          )}
        </div>
      )}

      <AddMovieForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onAdd={(m) => setMovies(p => [m, ...p])} />
      
      <AdminDashboard 
        isOpen={isAdminDashOpen} 
        onClose={() => setIsAdminDashOpen(false)} 
        codes={premiumCodes}
        onGenerate={(code) => setPremiumCodes(prev => [...prev, code])}
        currentUser={currentUser}
        onWipe={handleWipeDatabase}
      />

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        onActivate={handleActivateCode}
      />

      <MoviePlayer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      
      {/* Admin Button Float */}
      {currentUser.isAdmin && (
        <button 
          onClick={() => setIsAdminDashOpen(true)}
          className="fixed bottom-8 left-8 w-14 h-14 bg-yellow-500 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] border-4 border-[#02040a]"
          title="Master Console"
        >
          <i className="fa-solid fa-shield-halved text-xl"></i>
        </button>
      )}

      {!currentUser.isPremium && (
        <button 
          onClick={() => setIsPremiumModalOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-600 to-amber-500 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(217,119,6,0.3)] hover:scale-105 active:scale-95 transition-all z-[100] border-2 border-white/10"
        >
          <i className="fa-solid fa-crown mr-2"></i> Premium freischalten
        </button>
      )}

      <footer className="mt-32 py-20 flex flex-col items-center gap-10 border-t border-white/5">
        <div className="flex items-center gap-3">
          <img src="https://img.icons8.com/color/48/popcorn.png" alt="Logo" className="w-10 h-10 grayscale opacity-40" />
          <h1 className="text-2xl font-black tracking-[-1px] opacity-40">MEGA<span className="text-white/40">KINO</span><span className="text-[#0063e5] ml-0.5 text-3xl font-light">+</span></h1>
        </div>
        <div className="flex gap-10 text-[10px] font-black uppercase tracking-[3px] text-white/30">
           <span className="hover:text-white cursor-pointer transition">Datenschutz</span>
           <span className="hover:text-white cursor-pointer transition">Impressum</span>
           <span className="hover:text-white cursor-pointer transition">Hilfe Center</span>
        </div>
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-[5px] text-center">Cinematic Experience Engine v2.5.0 build 2025</p>
      </footer>
    </div>
  );
};

export default App;
