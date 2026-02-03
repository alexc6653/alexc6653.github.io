
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

// --- IndexedDB Helper ---
const DB_NAME = 'MegaKinoDB';
const STORE_NAME = 'movies';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mk_users_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mk_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [movies, setMovies] = useState<Movie[]>([]);
  const [premiumCodes, setPremiumCodes] = useState<PremiumCode[]>(() => {
    const saved = localStorage.getItem('mk_codes_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdminDashOpen, setIsAdminDashOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeView, setActiveView] = useState<'all' | 'movies' | 'series'>('all');

  // Load Movies from IndexedDB
  useEffect(() => {
    const loadMovies = async () => {
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
          // Wir drehen das Array um, damit die neuesten Uploads zuerst kommen
          setMovies(request.result.reverse());
        };
        request.onerror = () => {
          console.error("Fehler beim Laden der Filme:", request.error);
        };
      } catch (e) {
        console.error("Datenbank konnte nicht geöffnet werden", e);
      }
    };
    loadMovies();
  }, []);

  useEffect(() => {
    localStorage.setItem('mk_users_db', JSON.stringify(users));
    localStorage.setItem('mk_codes_db', JSON.stringify(premiumCodes));
    if (currentUser) localStorage.setItem('mk_session_user', JSON.stringify(currentUser));
    else localStorage.removeItem('mk_session_user');
  }, [users, premiumCodes, currentUser]);

  const saveMovieToDB = async (movie: Movie) => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Wir verpacken den Speichervorgang in ein Promise, um sicherzustellen, dass es fertig ist
      await new Promise<void>((resolve, reject) => {
        const request = store.put(movie);
        
        tx.oncomplete = () => resolve();
        
        tx.onerror = (event) => {
           reject(tx.error || (event.target as any).error);
        };
        
        request.onerror = (event) => {
           reject(request.error || (event.target as any).error);
        };
      });

      // UI erst aktualisieren, wenn Datenbank bestätigt hat
      setMovies(prev => [movie, ...prev]);
      
    } catch (error: any) {
      console.error("Speichern fehlgeschlagen:", error);
      if (error && error.name === 'QuotaExceededError') {
        alert("SPEICHER VOLL! Das Video ist zu groß für den Browser-Speicher. Bitte lösche alte Filme oder nutze kleinere Dateien.");
      } else {
        alert("Fehler beim Speichern in die Datenbank. Bitte versuche es erneut.");
      }
      throw error; // Fehler weitergeben, damit das Formular offen bleibt
    }
  };

  const deleteMovieFromDB = async (id: string) => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });

      setMovies(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error("Fehler beim Löschen:", e);
      alert("Konnte Film nicht löschen.");
    }
  };

  const wipeDB = async () => {
    if (!window.confirm("Bist du sicher? Dies löscht ALLE Filme aus dem Speicher.")) return;
    
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
      
      setMovies([]);
      alert("Datenbank erfolgreich bereinigt.");
    } catch (e) {
      console.error("Wipe failed", e);
    }
  };

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

  const handleMovieSelect = (movie: Movie) => {
    if (movie.isPremium && !currentUser?.isPremium && !currentUser?.isAdmin) {
      setIsPremiumModalOpen(true);
      return;
    }
    setSelectedMovie(movie);
  };

  const BrandTiles = () => (
    <section className="px-10 grid grid-cols-2 md:grid-cols-5 gap-6 mt-10">
      {['Disney', 'Pixar', 'Marvel', 'Star Wars', 'Nat Geo'].map(brand => (
        <div key={brand} className="group relative aspect-video rounded-xl border-2 border-white/10 overflow-hidden cursor-pointer bg-[#1a1d29] hover:border-white hover:scale-105 transition-all duration-300 shadow-2xl shadow-black">
           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
           <div className="relative z-10 w-full h-full flex items-center justify-center font-black text-white/40 group-hover:text-white uppercase tracking-tighter italic text-xl md:text-2xl transition-all">
             {brand}
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-blue-600/20 to-transparent transition-opacity"></div>
        </div>
      ))}
    </section>
  );

  if (!currentUser) return <Login onLogin={(u,p) => {
    if (u === 'Zinkereru' && p === '78187') {
      setCurrentUser({ username: u, password: p, isAdmin: true, isPremium: true });
    } else {
      const found = users.find(user => user.username === u && user.password === p);
      if (found) setCurrentUser(found); else alert("Login fehlgeschlagen");
    }
  }} onRegister={(u) => { setUsers(p => [...p, u]); setCurrentUser(u); }} />;

  return (
    <div className="min-h-screen bg-[#040714] text-white flex flex-col pb-20 overflow-x-hidden selection:bg-[#0063e5] selection:text-white">
      <Navbar 
        onAddClick={() => setIsFormOpen(true)} 
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        isAdmin={currentUser.isAdmin} 
        onLogout={() => setCurrentUser(null)} 
        userName={currentUser.username}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {searchTerm === '' && activeCategory === 'All' && activeView === 'all' && movies.length > 0 && (
        <Hero movies={movies} onPlay={handleMovieSelect} />
      )}

      {activeView === 'all' && searchTerm === '' && <BrandTiles />}

      <section className="px-10 mt-12 flex gap-4 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map(cat => (
             <button 
               key={cat} onClick={() => setActiveCategory(cat)}
               className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[2px] border transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
             >
               {cat}
             </button>
          ))}
      </section>

      <section className="px-10 mt-16 min-h-[50vh]">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter italic border-l-4 border-[#0063e5] pl-6">
            {searchTerm ? `Suchen: ${searchTerm}` : activeView === 'series' ? 'Serien' : activeView === 'movies' ? 'Filme' : 'Empfehlungen'}
          </h3>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[3px]">{filteredMovies.length} Titel gefunden</span>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center gap-6 opacity-20">
             <i className="fa-solid fa-film text-6xl"></i>
             <p className="font-black uppercase tracking-[5px]">
               {movies.length === 0 ? 'Datenbank leer. Lade etwas hoch!' : 'Keine Treffer für diese Filter.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8">
            {filteredMovies.map(movie => (
              <MovieCard 
                key={movie.id}
                movie={movie} 
                onClick={handleMovieSelect} 
                isAdmin={currentUser.isAdmin}
                isUserPremium={currentUser.isPremium}
                onDelete={() => deleteMovieFromDB(movie.id)}
              />
            ))}
          </div>
        )}
      </section>

      <AddMovieForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onAdd={saveMovieToDB} />
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
        <button onClick={() => setIsAdminDashOpen(true)} className="fixed bottom-10 left-10 w-16 h-16 bg-yellow-500 text-black rounded-full shadow-[0_20px_50px_rgba(234,179,8,0.4)] flex items-center justify-center z-[100] hover:scale-110 active:scale-95 transition-all border-4 border-[#040714]">
          <i className="fa-solid fa-shield-halved text-2xl"></i>
        </button>
      )}
    </div>
  );
};

export default App;
