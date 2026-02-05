
import React, { useState, useEffect, useMemo } from 'react';
import { Movie, User, PremiumCode } from './types';
import { CATEGORIES } from './constants';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieCard from './components/MovieCard';
import AddMovieForm from './components/AddMovieForm';
import MoviePlayer from './components/MoviePlayer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PremiumModal from './components/PremiumModal';

const API_BASE = (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const fetchJson = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  if (!API_BASE) {
    throw new Error('VITE_MOVIES_API_BASE_URL ist nicht gesetzt.');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    throw new Error(`API Fehler (${response.status})`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
};

// Helper für Emojis
const getCategoryEmoji = (cat: string) => {
  switch(cat) {
    case 'Action': return '💥';
    case 'Drama': return '🎭';
    case 'Sci-Fi': return '👽';
    case 'Comedy': return '😂';
    case 'Horror': return '👻';
    case 'Thriller': return '🔪';
    case 'All': return '♾️';
    default: return '✨';
  }
};

const App: React.FC = () => {
  // User State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mk_users_db');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mk_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [premiumCodes, setPremiumCodes] = useState<PremiumCode[]>(() => {
    const saved = localStorage.getItem('mk_codes_db');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [movieToEdit, setMovieToEdit] = useState<Movie | null>(null);
  const [isAdminDashOpen, setIsAdminDashOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeView, setActiveView] = useState<'all' | 'movies' | 'series'>('all');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem('mk_users_db', JSON.stringify(users));
    localStorage.setItem('mk_codes_db', JSON.stringify(premiumCodes));
    if (currentUser) localStorage.setItem('mk_session_user', JSON.stringify(currentUser));
    else localStorage.removeItem('mk_session_user');
  }, [users, premiumCodes, currentUser]);

  // Load Movies from API on startup
  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchJson<Movie[]>('/movies');
        setMovies(data.reverse());
      } catch (e) {
        console.error("API Error", e);
        setToast({ message: "API nicht erreichbar. Prüfe VITE_MOVIES_API_BASE_URL.", type: 'error' });
      }
    };
    loadMovies();
  }, []);

  const saveMovieToApi = async (movieInput: Movie) => {
    try {
      const exists = movies.some(m => m.id === movieInput.id);
      const saved = await fetchJson<Movie>(exists ? `/movies/${movieInput.id}` : '/movies', {
        method: exists ? 'PUT' : 'POST',
        body: JSON.stringify(movieInput)
      });

      setMovies(prev => {
        const idx = prev.findIndex(m => m.id === movieInput.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = saved;
          return newArr;
        }
        return [saved, ...prev];
      });

      setToast({ message: "Inhalt erfolgreich gespeichert! 💾", type: 'success' });
    } catch (error) {
      console.error("Save failed:", error);
      setToast({ message: "Fehler beim Speichern in der Datenbank.", type: 'error' });
    }
  };

  const handleMovieSelect = async (movieMeta: Movie) => {
    if (movieMeta.isPremium && !currentUser?.isPremium && !currentUser?.isAdmin) {
      setIsPremiumModalOpen(true);
      return;
    }
    setSelectedMovie(movieMeta);
  };

  const deleteMovieFromDB = async (id: string) => {
    if (!window.confirm("Wirklich löschen?")) return;
    try {
      await fetchJson(`/movies/${id}`, { method: 'DELETE' });
      setMovies(prev => prev.filter(m => m.id !== id));
      setToast({ message: "Gelöscht.", type: 'success' });
    } catch (e) {
      alert("Fehler beim Löschen aus der Datenbank.");
    }
  };

  const wipeDB = async () => {
    if (!window.confirm("ALLES LÖSCHEN? Das kann nicht rückgängig gemacht werden.")) return;
    try {
      await fetchJson('/movies', { method: 'DELETE' });
      setMovies([]);
      setToast({ message: "Datenbank komplett geleert.", type: 'success' });
    } catch (e) { console.error(e); }
  };

  // Filter Logic
  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || m.genre.toLowerCase() === activeCategory.toLowerCase();
      const matchesView = activeView === 'all' || 
                         (activeView === 'movies' && m.type === 'movie') || 
                         (activeView === 'series' && m.type === 'series');
      return matchesSearch && matchesCategory && matchesView;
    });
  }, [movies, searchTerm, activeCategory, activeView]);

  const handleEditMovie = (movie: Movie) => { setMovieToEdit(movie); setIsFormOpen(true); };
  const handleOpenAddForm = () => { setMovieToEdit(null); setIsFormOpen(true); };

  // Brand Tiles Component
  const BrandTiles = () => (
    <section className="px-6 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
      {['Disney', 'Pixar', 'Marvel', 'Star Wars', 'Nat Geo'].map(brand => (
        <div key={brand} className="group relative aspect-video rounded border border-white/10 overflow-hidden cursor-pointer bg-[#181a20] hover:border-white/30 hover:scale-105 transition-all duration-300">
           <div className="absolute inset-0 flex items-center justify-center font-serif-display font-bold text-white/40 group-hover:text-white uppercase tracking-wider text-lg transition-colors z-10">
             {brand}
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      ))}
    </section>
  );

  if (!currentUser) return <Login onLogin={(u,p) => {
    if (u === 'Zinkereru' && p === '78187') {
      setCurrentUser({ username: u, password: p, isAdmin: true, isPremium: true });
    } else {
      const found = users.find(user => user.username === u && user.password === p);
      if (found) setCurrentUser(found); else alert("Login fehlgeschlagen.");
    }
  }} onRegister={(u) => { setUsers(p => [...p, u]); setCurrentUser(u); }} />;

  return (
    <div className="min-h-screen bg-[#0f1014] text-white flex flex-col pb-20 selection:bg-white selection:text-black">
      <Navbar 
        onAddClick={handleOpenAddForm}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        isAdmin={currentUser.isAdmin} 
        isPremium={currentUser.isPremium}
        onLogout={() => setCurrentUser(null)} 
        userName={currentUser.username}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
      />

      {searchTerm === '' && activeCategory === 'All' && activeView === 'all' && movies.length > 0 && (
        <Hero movies={movies} onPlay={handleMovieSelect} />
      )}

      {activeView === 'all' && searchTerm === '' && <BrandTiles />}

      <section className="px-6 md:px-12 mt-12 flex gap-3 overflow-x-auto no-scrollbar py-2 border-b border-white/5 pb-6">
          {CATEGORIES.map(cat => (
             <button 
               key={cat} onClick={() => setActiveCategory(cat)}
               className={`px-5 py-2 rounded text-xs font-medium transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'bg-[#181a20] text-gray-400 hover:text-white hover:bg-[#222]'}`}
             >
               {cat}
             </button>
          ))}
      </section>

      <section className="px-6 md:px-12 mt-12 min-h-[50vh]">
        <div className="flex items-end justify-between mb-8">
          <h3 className="text-xl font-semibold text-white">
            {searchTerm ? `Suche: "${searchTerm}"` : activeView === 'series' ? 'Serien' : activeView === 'movies' ? 'Filme' : 'Empfehlungen'}
          </h3>
          <span className="text-xs text-gray-500 font-medium">{filteredMovies.length} Titel</span>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center gap-4 opacity-30">
             <i className="fa-solid fa-film text-4xl text-gray-500"></i>
             <p className="text-sm font-medium tracking-wide text-gray-400">
               {movies.length === 0 ? 'Die Mediathek ist leer.' : 'Keine Inhalte gefunden.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredMovies.map(movie => (
              <MovieCard 
                key={movie.id}
                movie={movie} 
                onClick={handleMovieSelect} 
                isAdmin={currentUser.isAdmin}
                isUserPremium={currentUser.isPremium}
                onDelete={() => deleteMovieFromDB(movie.id)}
                onEdit={() => handleEditMovie(movie)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#181a20] border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 z-[2000] animate-in fade-in slide-in-from-bottom-4">
           <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
             <i className={`fa-solid ${toast.type === 'success' ? 'fa-check' : 'fa-exclamation'} text-[10px]`}></i>
           </div>
           <span className="text-sm font-medium text-white">{toast.message}</span>
        </div>
      )}

      <AddMovieForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onAdd={saveMovieToApi} 
        initialMovie={movieToEdit}
      />
      
      <AdminDashboard isOpen={isAdminDashOpen} onClose={() => setIsAdminDashOpen(false)} codes={premiumCodes} onGenerate={(c) => setPremiumCodes(p => [...p, c])} currentUser={currentUser} onWipe={wipeDB} />
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} onActivate={(c) => {
          const idx = premiumCodes.findIndex(pc => pc.code === c && !pc.isUsed);
          if (idx !== -1) {
            const updated = [...premiumCodes]; updated[idx].isUsed = true; setPremiumCodes(updated);
            const user = { ...currentUser, isPremium: true }; setCurrentUser(user);
            setUsers(u => u.map(x => x.username === user.username ? user : x));
            return true;
          }
          return false;
      }} />
      <MoviePlayer movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      
      {currentUser.isAdmin && (
        <button 
          onClick={() => setIsAdminDashOpen(true)} 
          className="fixed bottom-8 left-8 w-12 h-12 bg-[#181a20] text-white rounded-full shadow-lg border border-white/10 flex items-center justify-center z-[100] hover:bg-white hover:text-black transition-all"
        >
          <i className="fa-solid fa-cog text-lg"></i>
        </button>
      )}
    </div>
  );
};

export default App;
