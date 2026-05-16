import React, { useState } from 'react';
import { Bot, ShieldCheck, User, ArrowRight, Zap } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  onBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (username.toLowerCase().includes('admin')) {
        onLogin('ADMIN');
      } else {
        onLogin('USER');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-600/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[140px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#151725]/80 backdrop-blur-3xl border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none group-hover:text-green-500/5 transition-colors duration-700">
             <Bot size={160} />
          </div>

          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors"
            >
              <ArrowRight className="rotate-180" size={24} />
            </button>
          )}

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/10 mb-6 group-hover:scale-110 transition-transform overflow-hidden">
              <img src="/LTA Logo.png" alt="LTA Logo" className="w-[120%] h-[120%] object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Smart <span className="text-green-500">Algo</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Secure Terminal v4.2</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1 mb-2 block">Terminal ID</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-green-500 transition-all placeholder:text-slate-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1 mb-2 block">Access Key</label>
              <div className="relative">
                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-green-500 transition-all placeholder:text-slate-700 font-bold"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-500 text-[#0B0C15] font-black py-5 rounded-[24px] shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] uppercase tracking-widest text-lg"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-[#0B0C15]/30 border-t-[#0B0C15] rounded-full animate-spin"></div>
              ) : (
                <>Connect System <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
             <div className="flex gap-6">
                <div className="flex items-center gap-2 text-[9px] text-slate-600 font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  System Online
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-600 font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Encrypted
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
