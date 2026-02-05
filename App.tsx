
import React, { useState, useEffect, useMemo } from 'react';
import { Movie, User, PremiumCode, Season, Episode } from './types';
import { CATEGORIES } from './constants';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieCard from './components/MovieCard';
import AddMovieForm from './components/AddMovieForm';
import MoviePlayer from './components/MoviePlayer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PremiumModal from './components/PremiumModal';

// --- IndexedDB Configuration ---
const DB_NAME = 'MegaKinoDB';
const DB_VERSION = 3; // Version erhöht für Strukturänderung
const STORE_MOVIES = 'movies'; // Nur Metadaten
const STORE_MEDIA = 'media';   // Nur große Video-Blobs

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      // Store für Filmdaten (Titel, Poster, etc.)
      if (!db.objectStoreNames.contains(STORE_MOVIES)) {
        db.createObjectStore(STORE_MOVIES, { keyPath: 'id' });
      }
      // Neuer Store NUR für die großen Videodateien
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA); // Key-Value Store (ID -> Blob)
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
  const [loadingVideo, setLoadingVideo] = useState(false); // Neuer Loading State für Player
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

  // Load Movies (METADATA ONLY) on startup
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_MOVIES, 'readonly');
        const store = tx.objectStore(STORE_MOVIES);
        const request = store.getAll();
        
        request.onsuccess = () => {
          // Wir laden hier nur die Metadaten, NICHT die riesigen Videodateien!
          setMovies(request.result.reverse());
        };
      } catch (e) {
        console.error("DB Error", e);
      }
    };
    loadMetadata();
  }, []);

  // --- SAVE LOGIC (SPLIT DATA) ---
  const saveMovieToDB = async (movieInput: Movie) => {
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_MOVIES, STORE_MEDIA], 'readwrite');
      const movieStore = tx.objectStore(STORE_MOVIES);
      const mediaStore = tx.objectStore(STORE_MEDIA);

      // 1. Video Blob extrahieren (falls vorhanden)
      const videoBlob = movieInput.videoData;
      
      // 2. Metadaten-Objekt vorbereiten (OHNE das schwere Video)
      // Wir setzen videoData auf null im Metadaten-Objekt, damit der RAM beim Laden sauber bleibt
      const movieMetadata = { ...movieInput };
      delete movieMetadata.videoData; 
      
      // Bei Serien müssen wir auch die Episoden-Videos extrahieren
      if (movieInput.type === 'series' && movieInput.seasons) {
        movieMetadata.seasons = movieInput.seasons.map(season => ({
          ...season,
          episodes: season.episodes.map(ep => {
            // Speichere Episoden-Video separat
            if (ep.videoData) {
              mediaStore.put(ep.videoData, ep.id);
            }
            // Entferne Blob aus Metadaten
            const cleanEp = { ...ep };
            delete cleanEp.videoData;
            return cleanEp;
          })
        }));
      }

      // 3. Hauptfilm-Video speichern (ID als Key)
      if (videoBlob) {
        mediaStore.put(videoBlob, movieInput.id);
      }

      // 4. Metadaten speichern
      movieStore.put(movieMetadata);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject("Transaction aborted");
      });

      // Update UI List (Nur Metadaten)
      setMovies(prev => {
        const idx = prev.findIndex(m => m.id === movieInput.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = movieMetadata;
          return newArr;
        }
        return [movieMetadata, ...prev];
      });

      setToast({ message: "Inhalt erfolgreich gespeichert! 💾", type: 'success' });

    } catch (error: any) {
      console.error("Save failed:", error);
      if (error && error.name === 'QuotaExceededError') {
        alert("SPEICHER VOLL! 🛑 Der Browser hat nicht genug Platz für dieses Video.");
      } else {
        alert("Fehler beim Speichern. Datei möglicherweise zu groß für diesen Browser.");
      }
    }
  };

  // --- PLAY LOGIC (FETCH VIDEO ON DEMAND) ---
  const handleMovieSelect = async (movieMeta: Movie) => {
    if (movieMeta.isPremium && !currentUser?.isPremium && !currentUser?.isAdmin) {
      setIsPremiumModalOpen(true);
      return;
    }

    setLoadingVideo(true);
    setToast({ message: "Lade Video aus Speicher...", type: 'success' });

    try {
      const db = await initDB();
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const mediaStore = tx.objectStore(STORE_MEDIA);

      // Rekonstruiere das volle Movie-Objekt
      const fullMovie = { ...movieMeta };

      if (movieMeta.type === 'movie') {
        // Hole Hauptfilm
        const videoBlob = await new Promise<Blob | undefined>((resolve) => {
          const req = mediaStore.get(movieMeta.id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        });
        if (videoBlob) fullMovie.videoData = videoBlob;
      } 
      else if (movieMeta.type === 'series' && movieMeta.seasons) {
        // Bei Serien laden wir Videos erst, wenn die Episode angeklickt wird? 
        // Für Einfachheit laden wir hier die Struktur, der Player kümmert sich um Episoden-Blobs.
        // Besser: Wir injizieren eine Methode in den Player, um Blobs nachzuladen.
        // HACK: Wir laden hier erstmal alles nötige für die erste Episode, 
        // aber idealerweise müsste der Player async fetching unterstützen.
        
        // Da der Player aktuell synchron arbeitet, laden wir ALLE Episoden Blobs (Vorsicht bei RAM!)
        // Optimierung für später: Player umschreiben. Für jetzt:
        
        const updatedSeasons: Season[] = [];
        for (const season of movieMeta.seasons) {
            const updatedEpisodes: Episode[] = [];
            for (const ep of season.episodes) {
                const epBlob = await new Promise<Blob | undefined>((resolve) => {
                    const req = mediaStore.get(ep.id);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => resolve(undefined);
                });
                updatedEpisodes.push({ ...ep, videoData: epBlob });
            }
            updatedSeasons.push({ ...season, episodes: updatedEpisodes });
        }
        fullMovie.seasons = updatedSeasons;
      }

      setSelectedMovie(fullMovie);
    } catch (e) {
      console.error("Load video failed", e);
      alert("Fehler beim Laden des Videos.");
    } finally {
      setLoadingVideo(false);
    }
  };

  const deleteMovieFromDB = async (id: string) => {
    if (!window.confirm("Wirklich löschen?")) return;
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_MOVIES, STORE_MEDIA], 'readwrite');
      tx.objectStore(STORE_MOVIES).delete(id);
      tx.objectStore(STORE_MEDIA).delete(id);
      
      // Auch Episoden löschen, falls Serie (einfache Bereinigung)
      // Das ist komplexer ohne Index, wir löschen hier nur den Main Key.
      // Ein 'Garbage Collector' Button im Admin Panel wäre gut für verwaiste Episoden.

      await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
      
      setMovies(prev => prev.filter(m => m.id !== id));
      setToast({ message: "Gelöscht.", type: 'success' });
    } catch (e) {
      alert("Fehler beim Löschen.");
    }
  };

  const wipeDB = async () => {
    if (!window.confirm("ALLES LÖSCHEN? Das kann nicht rückgängig gemacht werden.")) return;
    try {
      const db = await initDB();
      const tx = db.transaction([STORE_MOVIES, STORE_MEDIA], 'readwrite');
      tx.objectStore(STORE_MOVIES).clear();
      tx.objectStore(STORE_MEDIA).clear();
      await new Promise<void>(resolve => { tx.oncomplete = () => resolve(); });
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

      {loadingVideo && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
           <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-[#0063e5]"></i>
           <p className="text-sm font-bold tracking-widest uppercase">Lade große Datei...</p>
        </div>
      )}

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
        onAdd={saveMovieToDB} 
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
