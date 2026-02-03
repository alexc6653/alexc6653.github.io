
import React, { useState } from 'react';
import { User, PremiumCode } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  codes: PremiumCode[];
  onGenerate: (code: PremiumCode) => void;
  currentUser: User;
  onWipe?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, codes, onGenerate, currentUser, onWipe }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'prompts'>('manage');

  if (!isOpen) return null;

  const generateCode = () => {
    const newCode = `MK-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    onGenerate({
      code: newCode,
      isUsed: false,
      generatedBy: currentUser.username
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("In die Zwischenablage kopiert!");
  };

  const prompts = {
    bulk: `Handle als professioneller Film-Datenbank-Architekt. Erstelle eine JSON-Liste mit 10 fiktiven Filmen für meine Streaming-Plattform. 
Jedes Objekt muss exakt diese Struktur haben:
{
  "id": "unique-id",
  "title": "Film Titel",
  "description": "Fesselnde 2-Satz Zusammenfassung",
  "genre": "Eines von: Action, Drama, Sci-Fi, Comedy, Horror, Thriller",
  "rating": 1.0-10.0,
  "year": 2020-2025,
  "posterUrl": "https://picsum.photos/seed/[title]/400/600",
  "backdropUrl": "https://picsum.photos/seed/[title]/1920/1080",
  "videoUrl": "Link zu einem Trailer oder Video"
}
Antworte NUR mit dem JSON-Code.`,
    poster: `Cinematic movie poster photography, ultra-realistic, 8k resolution, dramatic cinematic lighting, movie studio quality, [GENRE] atmosphere, [TITLE] theme, highly detailed, no text on image, masterpiece, anamorphic lens flare, professional color grading.`
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/98 flex items-center justify-center p-4 md:p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#151d27] w-full max-w-4xl rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header mit Tab-Switcher */}
        <div className="p-8 border-b border-white/5 bg-[#1c2632] flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black uppercase text-yellow-500 tracking-tighter flex items-center gap-4">
              <i className="fa-solid fa-shield-halved text-3xl"></i>
              Master Console
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-all bg-white/5 w-10 h-10 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          
          <div className="flex gap-4 p-1 bg-black/20 rounded-2xl border border-white/5 w-fit">
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manage' ? 'bg-yellow-500 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Management
            </button>
            <button 
              onClick={() => setActiveTab('prompts')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prompts' ? 'bg-[#0063e5] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              AI Prompt Studio
            </button>
          </div>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'manage' ? (
            <>
              {/* Bestehende Management Sektion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0b1016] p-8 rounded-3xl border border-yellow-500/10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-plus text-2xl text-yellow-500"></i>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-2">Premium Codes</h4>
                  <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest leading-relaxed">Erstelle Codes für neue PRO Nutzer.</p>
                  <button onClick={generateCode} className="w-full bg-yellow-600 text-white py-4 rounded-2xl font-black text-xs hover:bg-yellow-500 transition shadow-xl uppercase tracking-widest">Code generieren</button>
                </div>

                <div className="bg-[#0b1016] p-8 rounded-3xl border border-red-500/10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-trash-can text-2xl text-red-500"></i>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-2">Datenbank Wipe</h4>
                  <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest leading-relaxed">Alle Filme weltweit unwiderruflich löschen.</p>
                  <button onClick={onWipe} className="w-full bg-red-900/40 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition shadow-xl uppercase tracking-widest">Alles leeren</button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] pl-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                  Aktive Premium Keys
                </h4>
                <div className="grid gap-3">
                  {codes.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 opacity-40 text-xs font-black uppercase tracking-widest italic">Keine Keys im Umlauf</div>
                  ) : (
                    codes.map((c, i) => (
                      <div key={i} className={`flex items-center justify-between px-6 py-5 rounded-2xl bg-[#1c2632] border border-white/5 transition-all ${c.isUsed ? 'grayscale opacity-30 scale-95' : 'hover:border-yellow-500/30'}`}>
                        <div className="flex items-center gap-5">
                          <div className={`w-3 h-3 rounded-full ${c.isUsed ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_100px_#22c55e]'}`}></div>
                          <code className="text-base font-black text-white tracking-[0.2em]">{c.code}</code>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-black text-gray-500 uppercase">Von: {c.generatedBy}</span>
                          {!c.isUsed && <button onClick={() => copyToClipboard(c.code)} className="text-[10px] bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl font-black uppercase transition-all">Kopieren</button>}
                          {c.isUsed && <span className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-4 py-2 rounded-xl">Eingelöst</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#0063e5]/20 rounded-2xl flex items-center justify-center">
                      <i className="fa-solid fa-database text-xl text-[#0063e5]"></i>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white uppercase leading-none">Bulk Movie Generator</h4>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Für ChatGPT / Claude / Gemini</p>
                   </div>
                </div>
                <div className="relative group">
                   <pre className="bg-black/50 border border-white/10 rounded-3xl p-8 text-[11px] text-white/70 leading-relaxed font-mono whitespace-pre-wrap select-all">
                     {prompts.bulk}
                   </pre>
                   <button 
                     onClick={() => copyToClipboard(prompts.bulk)}
                     className="absolute top-6 right-6 bg-[#0063e5] text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                   >
                     <i className="fa-solid fa-copy mr-2"></i> Prompt kopieren
                   </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fa-solid fa-wand-magic-sparkles text-xl text-purple-500"></i>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white uppercase leading-none">Cinematic Poster Prompt</h4>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Für Midjourney / DALL-E / Leonardo</p>
                   </div>
                </div>
                <div className="relative group">
                   <pre className="bg-black/50 border border-white/10 rounded-3xl p-8 text-[11px] text-white/70 leading-relaxed font-mono whitespace-pre-wrap select-all italic">
                     {prompts.poster}
                   </pre>
                   <button 
                     onClick={() => copyToClipboard(prompts.poster)}
                     className="absolute top-6 right-6 bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                   >
                     <i className="fa-solid fa-copy mr-2"></i> Prompt kopieren
                   </button>
                </div>
              </div>
              
              <div className="p-8 bg-[#0063e5]/10 rounded-3xl border border-[#0063e5]/20 flex items-start gap-6">
                 <i className="fa-solid fa-circle-info text-2xl text-[#0063e5] mt-1"></i>
                 <div>
                    <h5 className="text-[11px] font-black text-[#0063e5] uppercase tracking-widest mb-2">Profi-Tipp:</h5>
                    <p className="text-xs text-white/50 leading-relaxed font-medium italic">
                      Kopiere den Bulk-Generator Prompt und füge ihn bei ChatGPT ein. Du erhälst eine Liste mit 10 fertigen Filmen, die du im JSON-Format einfach in die Datenbank deiner App importieren könntest (oder manuell als Vorlage nutzt).
                    </p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
