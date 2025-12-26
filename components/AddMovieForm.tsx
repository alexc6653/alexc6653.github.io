
import React, { useState, useRef } from 'react';
import { Movie } from '../types';
import { generateMovieMetadata } from '../services/geminiService';
import { CATEGORIES } from '../constants';

interface AddMovieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => void;
}

const AddMovieForm: React.FC<AddMovieFormProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    genre: 'Action',
    rating: 8.5,
    year: new Date().getFullYear(),
    posterUrl: '',
    backdropUrl: '',
    videoUrl: ''
  });

  const handleAiGeneration = async () => {
    if (!title) return alert("Gib zuerst einen Filmtitel ein!");
    setLoading(true);
    try {
      const metadata = await generateMovieMetadata(title);
      if (metadata) {
        // Sicherstellen, dass das Genre in unserer Liste ist (oder Fallback auf Action)
        const matchedGenre = CATEGORIES.find(c => c.toLowerCase() === metadata.genre.toLowerCase()) || 'Action';
        
        setFormData(prev => ({
          ...prev,
          description: metadata.description,
          genre: matchedGenre,
          rating: metadata.rating,
          year: metadata.year,
          posterUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}-poster/400/600`,
          backdropUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}-backdrop/1920/1080`
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          posterUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`,
          backdropUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/1920/1080`
        }));
      }
    } catch (err) {
      alert("KI Generation fehlgeschlagen. Du kannst die Details auch manuell eintragen.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // WICHTIG: Blob URLs sind nur temporär. Sie werden nach einem Reload gelöscht.
      const url = URL.createObjectURL(file);
      setFormData(p => ({ ...p, videoUrl: url }));
      alert("Hinweis: Lokale Videos funktionieren nur während dieser Browser-Sitzung. Für dauerhafte Filme nutze bitte YouTube-Links.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !formData.videoUrl) return alert("Titel und Video-Link werden benötigt!");
    
    onAdd({
      id: `m-${Date.now()}`,
      title,
      isPremium,
      ...formData
    });
    
    onClose();
    // Reset
    setTitle('');
    setFormData({
      description: '',
      genre: 'Action',
      rating: 8.5,
      year: new Date().getFullYear(),
      posterUrl: '',
      backdropUrl: '',
      videoUrl: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#0f121a] w-full max-w-5xl rounded-[40px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh]">
        
        {/* Links: Live Vorschau */}
        <div className="w-full md:w-1/3 bg-black/40 border-r border-white/5 relative p-10 flex flex-col items-center justify-center overflow-hidden">
          <div className="text-[10px] font-black text-[#0063e5] uppercase tracking-[0.4em] mb-8 absolute top-10 left-10">Monitor</div>
          
          <div className="relative group w-full max-w-[300px] aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 transition-transform duration-500 hover:scale-105">
            {formData.posterUrl ? (
              <img src={formData.posterUrl} className="w-full h-full object-cover" alt="Vorschau" />
            ) : (
              <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-4">
                <i className="fa-solid fa-clapperboard text-5xl text-white/10"></i>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Warte auf Daten</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8">
                <h4 className="text-white font-black uppercase text-xl leading-none tracking-tighter truncate">{title || 'FILMTITEL'}</h4>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-[#0063e5] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{formData.genre}</span>
                  <span className="text-white/40 text-[10px] font-black">{formData.year}</span>
                </div>
            </div>
          </div>
          
          <div className="mt-12 w-full hidden md:block">
             <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Backdrop Monitor</div>
             <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/5 overflow-hidden shadow-inner">
                {formData.backdropUrl ? <img src={formData.backdropUrl} className="w-full h-full object-cover opacity-60" /> : <div className="w-full h-full bg-white/5 animate-pulse" />}
             </div>
          </div>
        </div>

        {/* Rechts: Editor */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f121a]">
          <div className="p-10 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f121a]/90 backdrop-blur-md z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
               <i className="fa-solid fa-film text-[#0063e5]"></i> Movie <span className="text-[#0063e5]">Architect</span>
            </h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition w-12 h-12 rounded-full hover:bg-white/5 flex items-center justify-center border border-white/5">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-24">
            <div className="space-y-10">
              {/* Titel & KI */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Basics</label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-2xl px-8 py-6 w-full text-lg outline-none focus:border-[#0063e5] transition-all text-white placeholder-white/20 font-bold"
                      placeholder="Filmtitel hier eingeben..."
                    />
                  </div>
                  <button 
                    type="button" onClick={handleAiGeneration} disabled={loading || !title}
                    className="bg-[#0063e5] text-white px-10 rounded-2xl hover:brightness-125 disabled:opacity-20 shadow-[0_15px_40px_rgba(0,99,229,0.3)] transition-all flex items-center gap-4 group"
                  >
                    {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-xl group-hover:rotate-12 transition-transform"></i>}
                    <span className="font-black uppercase text-xs tracking-widest">KI GENERIEREN</span>
                  </button>
                </div>
              </div>

              {/* Video Link */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Streaming Source</label>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" value={formData.videoUrl.startsWith('blob:') ? '' : formData.videoUrl} 
                      onChange={e => setFormData(p => ({ ...p, videoUrl: e.target.value }))}
                      className="bg-black/50 border border-white/10 rounded-2xl px-8 py-6 w-full text-sm outline-none focus:border-[#0063e5] transition-all text-white placeholder-white/20 font-mono"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                       <i className="fa-brands fa-youtube text-2xl"></i>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 px-4">
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Oder Offline Datei</span>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                  </div>

                  <button 
                    type="button" onClick={() => videoInputRef.current?.click()}
                    className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2 border-dashed ${formData.videoUrl.startsWith('blob:') ? 'bg-[#0063e5]/20 border-[#0063e5] text-white' : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20'}`}
                  >
                    <i className="fa-solid fa-cloud-arrow-up mr-3 text-lg"></i>
                    {formData.videoUrl.startsWith('blob:') ? 'DATEI BEREIT (WIRD NICHT PERMANENT GESPEICHERT)' : 'VOM COMPUTER HOCHLADEN'}
                  </button>
                  <input type="file" ref={videoInputRef} onChange={handleFile} className="hidden" accept="video/*" />
                </div>
              </div>

              {/* Story & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Logline / Beschreibung</label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="bg-black/50 border border-white/10 rounded-3xl px-8 py-6 w-full text-sm h-[200px] outline-none focus:border-[#0063e5] resize-none transition-all text-white/80 leading-relaxed font-medium"
                    placeholder="Worum geht es in dem Meisterwerk?"
                  ></textarea>
                </div>
                
                <div className="space-y-8">
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Genre Auswahl</label>
                         <select 
                           value={formData.genre} 
                           onChange={e => setFormData(p => ({...p, genre: e.target.value}))}
                           className="bg-black/50 border border-white/10 rounded-2xl px-8 py-5 w-full text-sm font-black uppercase tracking-widest outline-none focus:border-[#0063e5] appearance-none text-white cursor-pointer"
                         >
                           {CATEGORIES.filter(c => c !== 'All').map(cat => (
                             <option key={cat} value={cat} className="bg-[#0f121a]">{cat}</option>
                           ))}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Produktionsjahr</label>
                         <input 
                           type="number" value={formData.year} 
                           onChange={e => setFormData(p => ({...p, year: parseInt(e.target.value)}))} 
                           className="bg-black/50 border border-white/10 rounded-2xl px-8 py-5 w-full text-sm font-black outline-none focus:border-[#0063e5] text-white" 
                         />
                      </div>
                   </div>

                   {/* Premium Toggle */}
                   <div 
                     onClick={() => setIsPremium(!isPremium)}
                     className={`flex items-center justify-between p-8 rounded-[32px] cursor-pointer transition-all border-2 ${isPremium ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                   >
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isPremium ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/20'}`}>
                           <i className="fa-solid fa-crown text-2xl"></i>
                        </div>
                        <div>
                           <span className="text-xs font-black uppercase text-white tracking-widest block">Premium Only</span>
                           <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1">Nur für PRO Mitglieder sichtbar</span>
                        </div>
                     </div>
                     <div className={`w-14 h-7 rounded-full relative transition-all duration-500 ${isPremium ? 'bg-yellow-500' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-500 ${isPremium ? 'left-[32px]' : 'left-1'}`}></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-10 bg-white text-black font-black rounded-[40px] shadow-[0_40px_80px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-[0.6em] uppercase flex items-center justify-center gap-6"
            >
              <i className="fa-solid fa-paper-plane text-xl"></i> FILM VERÖFFENTLICHEN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMovieForm;
