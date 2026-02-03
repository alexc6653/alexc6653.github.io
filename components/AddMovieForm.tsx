
import React, { useState } from 'react';
import { Movie, Season, Episode } from '../types';
import { CATEGORIES } from '../constants';

interface AddMovieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => Promise<void>;
}

const AddMovieForm: React.FC<AddMovieFormProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    genre: 'Action',
    rating: 8.5,
    year: new Date().getFullYear(),
    posterData: null as Blob | null,
    backdropData: null as Blob | null,
    videoData: null as Blob | null
  });

  const [seasons, setSeasons] = useState<Season[]>([
    { number: 1, episodes: [{ id: 'ep-1', number: 1, title: 'Folge 1', videoData: undefined }] }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, sIndex?: number, eIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (sIndex !== undefined && eIndex !== undefined) {
      const updated = [...seasons];
      updated[sIndex].episodes[eIndex].videoData = file;
      setSeasons(updated);
    } else {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !formData.posterData) return alert("Bitte mindestens Titel und Poster wählen!");
    
    setLoading(true);
    const newMovie: Movie = {
      id: `m-${Date.now()}`,
      title,
      isPremium,
      type: contentType,
      description: formData.description,
      genre: formData.genre,
      rating: formData.rating,
      year: formData.year,
      posterData: formData.posterData,
      backdropData: formData.backdropData || undefined,
      videoData: formData.videoData || undefined,
      seasons: contentType === 'series' ? seasons : undefined
    };

    try {
      await onAdd(newMovie);
      // Nur schließen und resetten, wenn kein Fehler auftrat
      onClose();
      reset();
    } catch (err) {
      console.error("Upload failed in component", err);
      // Wir schließen das Modal NICHT, damit der Nutzer es nochmal versuchen kann
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTitle('');
    setFormData({
      description: '',
      genre: 'Action',
      rating: 8.5,
      year: new Date().getFullYear(),
      posterData: null,
      backdropData: null,
      videoData: null
    });
    setSeasons([{ number: 1, episodes: [{ id: 'ep-1', number: 1, title: 'Folge 1' }] }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="bg-[#0f121a] w-full max-w-6xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh]">
        
        {/* Preview Sidebar */}
        <div className="hidden lg:flex w-80 bg-black/40 border-r border-white/5 p-10 flex-col gap-8 overflow-y-auto">
           <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Preview</h3>
           <div className="aspect-[2/3] w-full bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
             {formData.posterData ? (
               <img src={URL.createObjectURL(formData.posterData)} className="w-full h-full object-cover" />
             ) : (
               <i className="fa-solid fa-image text-white/10 text-3xl"></i>
             )}
           </div>
           <div className="aspect-video w-full bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
             {formData.backdropData ? (
               <img src={URL.createObjectURL(formData.backdropData)} className="w-full h-full object-cover" />
             ) : (
               <i className="fa-solid fa-clapperboard text-white/10 text-3xl"></i>
             )}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-black uppercase text-white italic tracking-tighter">Content <span className="text-[#0063e5]">Creator</span></h2>
            <button onClick={onClose} disabled={loading} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="flex gap-4 p-1 bg-black/50 rounded-2xl border border-white/5 w-fit mb-8">
              <button type="button" onClick={() => setContentType('movie')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${contentType === 'movie' ? 'bg-[#0063e5] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Film</button>
              <button type="button" onClick={() => setContentType('series')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${contentType === 'series' ? 'bg-[#0063e5] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Serie</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Titel</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#0063e5]" placeholder="Z.B. The Avengers" required />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Genre</label>
                <select value={formData.genre} onChange={e => setFormData(p => ({ ...p, genre: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#0063e5]">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Beschreibung</label>
              <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#0063e5] h-32" placeholder="Kurze Story..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Poster (2:3)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 cursor-pointer hover:border-[#0063e5] group transition-all">
                     <i className="fa-solid fa-cloud-arrow-up text-3xl text-white/20 group-hover:text-[#0063e5] mb-4"></i>
                     <span className="text-[10px] font-black text-white/40 uppercase">{formData.posterData ? 'Bild gewählt' : 'Datei wählen'}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'posterData')} />
                  </label>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Backdrop (16:9)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 cursor-pointer hover:border-[#0063e5] group transition-all">
                     <i className="fa-solid fa-film text-3xl text-white/20 group-hover:text-[#0063e5] mb-4"></i>
                     <span className="text-[10px] font-black text-white/40 uppercase">{formData.backdropData ? 'Bild gewählt' : 'Datei wählen'}</span>
                     <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'backdropData')} />
                  </label>
               </div>
            </div>

            {contentType === 'movie' ? (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Filmdatei (Video)</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-14 cursor-pointer hover:border-[#0063e5] group transition-all">
                   <i className="fa-solid fa-play-circle text-4xl text-white/20 group-hover:text-[#0063e5] mb-4"></i>
                   <span className="text-[10px] font-black text-white/60 uppercase">{formData.videoData ? 'Video geladen ✓' : 'Video Datei hochladen'}</span>
                   <input type="file" accept="video/*" className="hidden" onChange={e => handleFileChange(e, 'videoData')} />
                </label>
              </div>
            ) : (
              <div className="space-y-8 bg-black/40 p-10 rounded-[40px] border border-white/5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-black italic">Staffeln & Folgen</h4>
                  <button type="button" onClick={() => setSeasons(p => [...p, { number: p.length + 1, episodes: [{ id: `ep-${Date.now()}`, number: 1, title: 'Folge 1' }] }])} className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase">Staffel hinzufügen</button>
                </div>
                {seasons.map((s, si) => (
                  <div key={si} className="space-y-6 p-8 bg-white/5 rounded-3xl border border-white/5">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-[#0063e5] uppercase italic">Staffel {s.number}</span>
                        <button type="button" onClick={() => {
                          const updated = [...seasons];
                          updated[si].episodes.push({ id: `ep-${Date.now()}`, number: updated[si].episodes.length + 1, title: `Folge ${updated[si].episodes.length + 1}` });
                          setSeasons(updated);
                        }} className="text-[9px] text-white/40 hover:text-white uppercase font-black">+ Folge</button>
                     </div>
                     {s.episodes.map((ep, ei) => (
                       <div key={ep.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/20 p-4 rounded-2xl">
                          <span className="md:col-span-1 text-[10px] font-black opacity-20">#{ep.number}</span>
                          <input type="text" value={ep.title} onChange={e => {
                            const updated = [...seasons];
                            updated[si].episodes[ei].title = e.target.value;
                            setSeasons(updated);
                          }} className="md:col-span-5 bg-transparent border-b border-white/10 px-2 py-1 text-xs text-white outline-none focus:border-[#0063e5]" placeholder="Episoden-Titel" />
                          <label className="md:col-span-6 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 cursor-pointer hover:bg-white/10 transition-all">
                             <i className="fa-solid fa-file-video text-[#0063e5]"></i>
                             <span className="text-[10px] font-black text-white/40 uppercase truncate">{ep.videoData ? 'Video geladen' : 'Video Datei wählen'}</span>
                             <input type="file" accept="video/*" className="hidden" onChange={e => handleFileChange(e, '', si, ei)} />
                          </label>
                       </div>
                     ))}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-10 bg-white/5 rounded-[40px] border border-white/5">
              <div>
                <h4 className="text-lg font-black italic">PRO Exclusive</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Sichtbar nur für Premium Mitglieder</p>
              </div>
              <button type="button" onClick={() => setIsPremium(!isPremium)} className={`w-16 h-8 rounded-full relative transition-all ${isPremium ? 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'bg-white/10'}`}>
                <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${isPremium ? 'left-9' : 'left-1.5'}`}></div>
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-8 text-white rounded-[32px] font-black uppercase italic tracking-[5px] text-xs transition-all shadow-2xl ${loading ? 'bg-gray-600 cursor-wait opacity-80' : 'bg-[#0063e5] hover:scale-[1.01] active:scale-[0.99] shadow-blue-600/30'}`}
            >
               {loading ? (
                 <span className="flex items-center justify-center gap-3">
                   <i className="fa-solid fa-circle-notch fa-spin"></i>
                   Speichere Datenbank... (Bitte warten)
                 </span>
               ) : 'In Mediathek Veröffentlichen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMovieForm;
