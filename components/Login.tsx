
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (username: string, pass: string) => void;
  onRegister: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert("Felder ausfüllen!");

    if (isRegister) {
      onRegister({
        username,
        password,
        isAdmin: username === 'Zinkereru', // Only specific username can be admin
        isPremium: false
      });
    } else {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1016] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black font-heading text-[#00adef] tracking-tighter flex items-center justify-center gap-3">
            <i className="fa-solid fa-play-circle text-5xl"></i>
            MEGA<span className="text-white">KINO</span> 🍿
          </h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">
            {isRegister ? '✨ Neuen Account erstellen ✨' : '🎬 Premium Online Cinema 🎬'}
          </p>
        </div>

        <div className="bg-[#151d27] p-8 rounded-lg shadow-2xl border border-white/5 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 shadow-[0_0_15px_rgba(0,173,239,0.8)] ${isRegister ? 'bg-green-500' : 'bg-[#00adef]'}`}></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">👤 Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0b1016] border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-[#00adef] transition-all"
                placeholder="Name eingeben..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">🔑 Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b1016] border border-gray-700 rounded-md py-3 px-4 text-white focus:outline-none focus:border-[#00adef] transition-all"
                placeholder="Passwort..."
              />
            </div>

            <button
              type="submit"
              className={`w-full text-white py-4 rounded-md font-black font-heading uppercase tracking-widest transition-all active:scale-[0.98] ${isRegister ? 'bg-green-600 hover:bg-green-500' : 'bg-[#00adef] hover:bg-[#0092ca]'}`}
            >
              {isRegister ? '🚀 JETZT REGISTRIEREN' : '🔓 ANMELDEN'}
            </button>
          </form>

          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-center text-[11px] text-gray-500 font-bold uppercase tracking-tighter hover:text-white transition"
          >
            {isRegister ? 'Bereits dabei? Zum Login 🔙' : 'Neu hier? Kostenlos registrieren ✨'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
