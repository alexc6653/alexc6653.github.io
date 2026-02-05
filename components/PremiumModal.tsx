
import React, { useState, useEffect } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string) => boolean;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onActivate }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setStatus('loading');

    // Kurze künstliche Verzögerung für "Processing" Feeling
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = onActivate(code.trim());
    
    if (success) {
      setStatus('success');
      // Schließt das Modal nach der Erfolgsanimation
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1000); // Reset nach Shake
    }
  };

  const benefits = [
    { emoji: '🎬', text: 'Unbegrenztes 4K Streaming' },
    { emoji: '🚫', text: 'Keine Werbeunterbrechungen' },
    { emoji: '💾', text: 'Offline Speicherung' },
    { emoji: '⭐', text: 'Early Access zu neuen Filmen' },
    { emoji: '🔊', text: 'Dolby Atmos Sound' },
  ];

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-[#0b1016] border border-yellow-500/20 shadow-[0_0_100px_rgba(234,179,8,0.15)]">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-to-br from-yellow-600/10 to-transparent blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-gradient-to-tl from-yellow-500/10 to-transparent blur-[100px] pointer-events-none"></div>

        {status === 'success' ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.6)] mb-8 animate-bounce">
              <i className="fa-solid fa-check text-4xl text-black"></i>
            </div>
            <h2 className="text-3xl font-black font-heading uppercase italic text-white mb-2">Willkommen</h2>
            <p className="text-yellow-500 font-bold tracking-[0.2em] uppercase text-sm">im Elite Club 🥂</p>
          </div>
        ) : (
          <div className="relative z-10 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1c2632] to-[#0f121a] border border-yellow-500/30 shadow-2xl mb-4 group">
                <i className="fa-solid fa-crown text-3xl text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform duration-500"></i>
              </div>
              <h2 className="text-2xl font-black font-heading uppercase text-white tracking-tighter italic">
                MegaKino <span className="text-yellow-500">PRO 💎</span>
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[3px] mt-2 font-bold">Unlock the Ultimate Experience</p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
               {benefits.map((b, i) => (
                 <div key={i} className="flex items-center gap-4 text-white/80">
                    <span className="text-lg drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{b.emoji}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{b.text}</span>
                 </div>
               ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`relative transition-transform duration-100 ${status === 'error' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                <input
                  autoFocus
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setStatus('idle'); }}
                  placeholder="CODE EINGEBEN"
                  disabled={status === 'loading'}
                  className={`w-full bg-[#040714] border-2 rounded-xl py-4 px-4 text-center font-black font-heading tracking-[0.3em] text-white focus:outline-none transition-all uppercase placeholder:text-white/10 ${status === 'error' ? 'border-red-500/50 focus:border-red-500' : 'border-[#1c2632] focus:border-yellow-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === 'loading'}
                  className="flex-1 py-4 rounded-xl font-black font-heading text-[10px] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Abbrechen ❌
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-[2] bg-gradient-to-r from-yellow-600 to-amber-500 text-black py-4 rounded-xl font-black font-heading text-[10px] uppercase hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(234,179,8,0.2)] flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <>
                      Freischalten 🔓
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Footer Info */}
        {status !== 'success' && (
           <div className="p-4 bg-black/40 border-t border-white/5 text-center">
              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">
                Codes sind nur über Administratoren erhältlich.
              </p>
           </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default PremiumModal;
