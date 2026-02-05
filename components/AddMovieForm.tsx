
import React, { useState, useEffect } from 'react';
import { Movie, Season, Episode } from '../types';
import { CATEGORIES } from '../constants';

interface AddMovieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => Promise<void>;
  initialMovie?: Movie | null;
}

const AddMovieForm: React.FC<AddMovieFormProps> = ({ isOpen, onClose, onAdd, initialMovie }) => {
  const [title, setTitle] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    genre: 'Action',
    rating: 8.5,
    year: new Date().getFullYear(),
    posterData: null as Blob | null | string,
    backdropData: null as Blob | null | string,
    videoData: null as Blob | null | string
  });

  const [seasons, setSeasons] = useState<Season[]>([
    { number: 1, episodes: [{ id: 'ep-1', number: 1, title: 'Folge 1', videoData: undefined }] }
  ]);

  useEffect(() => {
    if (isOpen && initialMovie) {
      setTitle(initialMovie.title);
      setIsPremium(!!initialMovie.isPremium);
      setContentType(initialMovie.type);
      setFormData({
        description: initialMovie.description,
        genre: initialMovie.genre,
        rating: initialMovie.rating,
        year: initialMovie.year,
        posterData: initialMovie.posterData || initialMovie.posterUrl || null,
        backdropData: initialMovie.backdropData || initialMovie.backdropUrl || null,
        videoData: initialMovie.videoData || initialMovie.videoUrl || null
      });
      if (initialMovie.type === 'series' && initialMovie.seasons) {
        setSeasons(initialMovie.seasons);
      } else {
        setSeasons([{ number: 1, episodes: [{ id: 'ep-1', number: 1, title: 'Folge 1' }] }]);
      }
    } else if (isOpen && !initialMovie) {
      reset();
    }
  }, [isOpen, initialMovie]);

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
    if (!title) return alert("Titel fehlt!");
    if (!formData.posterData && !initialMovie) return alert("Poster fehlt!");
    
    setLoading(true);
    
    const newMovie: Movie = {
      id: initialMovie ? initialMovie.id : `m-${Date.now()}`,
      title,
      isPremium,
      type: contentType,
      description: formData.description,
      genre: formData.genre,
      rating: formData.rating,
      year: formData.year,
      posterData: formData.posterData || undefined,
      backdropData: formData.backdropData || undefined,
      videoData: formData.videoData || undefined,
      seasons: contentType === 'series' ? seasons : undefined
    };

    try {
      await onAdd(newMovie);
      onClose();
      if (!initialMovie) reset();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTitle('');
    setIsPremium(false);
    setContentType('movie');
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

  const getPreviewUrl = (data: Blob | string | null | undefined) => {
    if (!data) return null;
    if (data instanceof Blob) return URL.createObjectURL(data);
    return data as string;
  };

  if (!isOpen) return null;

  // Render Helpers
  const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#0063e5] uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );

  const FileUploadBox = ({ label, file, onChange, icon = "fa-cloud-arrow-up", accept = "image/*" }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{label}</label>
      <label className={`relative flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden group ${file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-[#0063e5] hover:bg-[#0063e5]/5'}`}>
         
         {/* Background Preview if Image */}
         {file && accept.startsWith('image') && (
            <img src={getPreviewUrl(file) || ''} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
         )}

         <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${file ? 'bg-green-500 text-black' : 'bg-white/5 text-white/30 group-hover:text-[#0063e5] group-hover:scale-110'}`}>
              <i className={`fa-solid ${file ? 'fa-check' : icon} text-xl`}></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-4 truncate max-w-[200px]">
              {file ? (file instanceof File ? file.name : 'Datei Vorhanden') : 'Click to Upload'}
            </span>
         </div>
         <input type="file" accept={accept} className="hidden" onChange={onChange} />
      </label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0b1016] w-full max-w-[90rem] h-[90vh] rounded-[32px] border border-white/10 shadow-2xl flex overflow-hidden">
        
        {/* Left: Live Preview Sidebar */}
        <div className="hidden xl:flex w-[400px] bg-[#080a0f] border-r border-white/5 flex-col relative">
           <div className="absolute inset-0 bg-gradient-to-b from-[#0063e5]/5 to-transparent pointer-events-none"></div>
           
           <div className="p-8 border-b border-white/5">
              <h3 className="text-xl font-black font-heading text-white uppercase italic tracking-tight">Preview</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">So sieht es im Dashboard aus</p>
           </div>

           <div className="flex-1 p-8 flex flex-col items-center justify-center gap-8 overflow-y-auto">
              
              {/* Card Preview */}
              <div className="w-[280px] relative group pointer-events-none select-none">
                 <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#1a1d29] relative">
                    {formData.posterData ? (
                       <img src={getPreviewUrl(formData.posterData) || ''} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/10">
                          <i className="fa-solid fa-image text-4xl"></i>
                       </div>
                    )}
                    
                    {/* Overlays */}
                    {isPremium && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded text-[9px] font-black uppercase shadow-lg z-20">
                        <i className="fa-solid fa-crown mr-1"></i> PRO
                      </div>
                    )}
                    {contentType === 'series' && (
                      <div className={`absolute top-${isPremium ? '10' : '3'} left-3 bg-[#0063e5] text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-lg z-20 mt-1`}>
                        SERIE
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-5">
                       <h4 className="text-white text-lg font-black uppercase italic leading-none drop-shadow-md">{title || 'Titel Vorschau'}</h4>
                       <div className="flex items-center justify-between mt-2 text-[9px] font-black text-white/60 uppercase">
                          <span>{formData.genre} • {formData.year}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Backdrop Preview */}
              <div className="w-full space-y-2">
                 <p className="text-[9px] text-white/30 uppercase font-black tracking-widest text-center">Backdrop Preview</p>
                 <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-[#1a1d29] relative">
                    {formData.backdropData ? (
                       <img src={getPreviewUrl(formData.backdropData) || ''} className="w-full h-full object-cover opacity-60" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/10">
                          <i className="fa-solid fa-film text-2xl"></i>
                       </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <h2 className="text-2xl font-black uppercase italic text-white drop-shadow-lg">{title || 'TITEL'}</h2>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        {/* Right: Form Content */}
        <div className="flex-1 flex flex-col h-full bg-[#0b1016]">
          
          {/* Form Header */}
          <div className="h-20 px-8 border-b border-white/5 flex items-center justify-between bg-[#0b1016]/50 backdrop-blur-xl shrink-0 z-20">
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${initialMovie ? 'bg-yellow-500 text-black' : 'bg-[#0063e5] text-white'}`}>
                   <i className={`fa-solid ${initialMovie ? 'fa-pen-to-square' : 'fa-cloud-arrow-up'}`}></i>
                </div>
                <div>
                   <h2 className="text-lg font-black font-heading text-white uppercase tracking-tight leading-none">
                      {initialMovie ? 'Edit Mode' : 'Content Studio'}
                   </h2>
                   <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      {initialMovie ? `Editing: ${initialMovie.title}` : 'Neuen Inhalt hinzufügen'}
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                 <i className="fa-solid fa-xmark text-lg"></i>
               </button>
             </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
             <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-10">
                
                {/* 1. Type & Main Info */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   <div className="lg:col-span-12 flex justify-center pb-4">
                      <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 inline-flex relative">
                         <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#0063e5] rounded-xl transition-all duration-300 shadow-lg ${contentType === 'series' ? 'translate-x-[calc(100%+6px)]' : 'left-1.5'}`}></div>
                         <button type="button" onClick={() => setContentType('movie')} className="relative z-10 px-10 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all w-32">Film</button>
                         <button type="button" onClick={() => setContentType('series')} className="relative z-10 px-10 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all w-32">Serie</button>
                      </div>
                   </div>

                   <div className="lg:col-span-8 space-y-6">
                      <InputGroup label="Titel">
                         <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#151a23] border border-white/5 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-[#0063e5] focus:bg-black transition-all text-lg placeholder:text-white/10" placeholder="z.B. Inception" required />
                      </InputGroup>
                      
                      <InputGroup label="Beschreibung / Plot">
                         <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-[#151a23] border border-white/5 rounded-xl px-5 py-4 text-white font-medium outline-none focus:border-[#0063e5] focus:bg-black transition-all min-h-[120px] placeholder:text-white/10 leading-relaxed" placeholder="Beschreibe die Handlung..." />
                      </InputGroup>

                      <div className="grid grid-cols-3 gap-4">
                         <InputGroup label="Genre">
                            <select value={formData.genre} onChange={e => setFormData(p => ({ ...p, genre: e.target.value }))} className="w-full bg-[#151a23] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0063e5]">
                               {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </InputGroup>
                         <InputGroup label="Jahr">
                            <input type="number" value={formData.year} onChange={e => setFormData(p => ({ ...p, year: parseInt(e.target.value) }))} className="w-full bg-[#151a23] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0063e5]" />
                         </InputGroup>
                         <InputGroup label="Rating">
                            <input type="number" step="0.1" max="10" value={formData.rating} onChange={e => setFormData(p => ({ ...p, rating: parseFloat(e.target.value) }))} className="w-full bg-[#151a23] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0063e5]" />
                         </InputGroup>
                      </div>
                   </div>

                   <div className="lg:col-span-4 space-y-4">
                      <FileUploadBox label="Poster (2:3)" file={formData.posterData} onChange={(e: any) => handleFileChange(e, 'posterData')} icon="fa-image" />
                      <FileUploadBox label="Backdrop (16:9)" file={formData.backdropData} onChange={(e: any) => handleFileChange(e, 'backdropData')} icon="fa-panorama" />
                   </div>
                </div>

                <div className="w-full h-px bg-white/5"></div>

                {/* 2. Media Content */}
                <div>
                   <h3 className="text-xl font-black font-heading text-white uppercase italic mb-6 flex items-center gap-3">
                      <i className="fa-solid fa-film text-[#0063e5]"></i> Media Assets
                   </h3>

                   {contentType === 'movie' ? (
                      <div className="bg-[#151a23] p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                         <FileUploadBox label="Hauptfilm Datei" file={formData.videoData} onChange={(e: any) => handleFileChange(e, 'videoData')} icon="fa-file-video" accept="video/*" />
                      </div>
                   ) : (
                      <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Staffel Management</p>
                            <button type="button" onClick={() => setSeasons(p => [...p, { number: p.length + 1, episodes: [{ id: `ep-${Date.now()}`, number: 1, title: 'Folge 1' }] }])} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2">
                               <i className="fa-solid fa-plus"></i> Staffel hinzufügen
                            </button>
                         </div>

                         {seasons.map((s, si) => (
                            <div key={si} className="bg-[#151a23] rounded-2xl border border-white/5 overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
                               <div className="bg-black/20 p-4 flex justify-between items-center border-b border-white/5">
                                  <div className="flex items-center gap-3">
                                     <span className="w-8 h-8 rounded-lg bg-[#0063e5]/20 text-[#0063e5] flex items-center justify-center font-black text-xs">S{s.number}</span>
                                     <span className="text-xs font-bold text-white uppercase tracking-wider">Staffel {s.number}</span>
                                  </div>
                                  <button type="button" onClick={() => {
                                     const updated = [...seasons];
                                     updated[si].episodes.push({ id: `ep-${Date.now()}`, number: updated[si].episodes.length + 1, title: `Folge ${updated[si].episodes.length + 1}` });
                                     setSeasons(updated);
                                  }} className="text-[10px] bg-[#0063e5] text-white px-3 py-1.5 rounded-lg font-black uppercase hover:scale-105 transition-transform">
                                     + Folge
                                  </button>
                               </div>

                               <div className="p-4 space-y-2">
                                  {s.episodes.map((ep, ei) => (
                                     <div key={ep.id} className="grid grid-cols-12 gap-3 items-center bg-black/20 p-3 rounded-xl hover:bg-black/30 transition-colors group">
                                        <div className="col-span-1 text-center">
                                           <span className="text-[10px] font-black text-white/20 group-hover:text-white/50">#{ep.number}</span>
                                        </div>
                                        <div className="col-span-5">
                                           <input type="text" value={ep.title} onChange={e => {
                                              const updated = [...seasons];
                                              updated[si].episodes[ei].title = e.target.value;
                                              setSeasons(updated);
                                           }} className="w-full bg-transparent border-b border-transparent focus:border-[#0063e5] text-xs font-bold text-white outline-none py-1 placeholder:text-white/20" placeholder="Titel der Folge" />
                                        </div>
                                        <div className="col-span-6">
                                           <label className={`flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-all border ${ep.videoData || ep.videoUrl ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}>
                                              <span className="text-[9px] font-black uppercase truncate max-w-[150px]">
                                                 {ep.videoData ? (ep.videoData instanceof File ? ep.videoData.name : 'Datei OK') : (ep.videoUrl ? 'URL OK' : 'Video Upload')}
                                              </span>
                                              <i className={`fa-solid ${ep.videoData || ep.videoUrl ? 'fa-check' : 'fa-upload'} text-xs`}></i>
                                              <input type="file" accept="video/*" className="hidden" onChange={e => handleFileChange(e, '', si, ei)} />
                                           </label>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Footer Controls */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 pb-20 lg:pb-0">
                   <button 
                     type="button" 
                     onClick={() => setIsPremium(!isPremium)} 
                     className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all w-full md:w-auto ${isPremium ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                   >
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${isPremium ? 'bg-yellow-500' : 'bg-white/20'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isPremium ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <div className="text-left">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-yellow-500' : 'text-white/40'}`}>Premium Exclusive</p>
                         <p className="text-xs text-white/60">Nur für PRO User sichtbar</p>
                      </div>
                   </button>

                   <button 
                     type="submit" 
                     disabled={loading} 
                     className="w-full md:w-auto flex-1 bg-gradient-to-r from-[#0063e5] to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white py-5 px-10 rounded-2xl font-black font-heading text-sm uppercase tracking-[3px] shadow-[0_10px_40px_rgba(0,99,229,0.4)] hover:shadow-[0_10px_60px_rgba(0,99,229,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                   >
                      {loading ? (
                        <>
                           <i className="fa-solid fa-circle-notch fa-spin"></i>
                           <span>Processing...</span>
                        </>
                      ) : (
                        <>
                           <span>{initialMovie ? 'Update Speichern' : 'Veröffentlichen'}</span>
                           <i className="fa-solid fa-rocket"></i>
                        </>
                      )}
                   </button>
                </div>

             </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddMovieForm;
