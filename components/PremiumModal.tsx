
import React, { useState } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string) => boolean;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onActivate }) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    const success = onActivate(code.trim());
    if (success) {
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#151d27] w-full max-w-sm rounded-xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="fa-solid fa-crown text-3xl text-yellow-500"></i>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tighter">Premium Aktivieren</h2>
          <p className="text-xs text-gray-400">Gib deinen PRO-Code ein, um alle Premium-Inhalte sofort freizuschalten.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <input
              autoFocus
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MK-XXXX-XXXX"
              className="w-full bg-[#0b1016] border border-gray-700 rounded-lg py-3 px-4 text-center font-black tracking-widest text-[#00adef] focus:border-yellow-500 outline-none transition-all uppercase"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-800 text-gray-400 py-3 rounded-lg font-bold text-xs uppercase hover:bg-gray-700 transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="flex-[2] bg-yellow-600 text-white py-3 rounded-lg font-black text-xs uppercase hover:bg-yellow-500 transition shadow-lg shadow-yellow-600/20"
              >
                Freischalten
              </button>
            </div>
          </form>
          <p className="text-[9px] text-gray-600 uppercase font-bold pt-2">Keinen Code? Frag einen Administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
