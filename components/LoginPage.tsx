
import React, { useState } from 'react';
import { Activity, ShieldCheck, User, ArrowRight, Github } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-samp-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-samp-accent blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-samp-surface/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-2xl transition-colors duration-300">
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-8 left-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
          )}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-samp-primary to-samp-accent flex items-center justify-center shadow-lg shadow-samp-primary/20 mb-4 animate-pulse-slow">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Lakshita Academy</h1>
            <p className="text-slate-500 dark:text-gray-500 text-sm mt-1">Premium Stock Market Training</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold tracking-widest ml-1">Terminal ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder="Username (use 'admin' for master access)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all placeholder:text-slate-400 dark:placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all placeholder:text-slate-400 dark:placeholder:text-gray-700"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-samp-primary to-indigo-600 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-samp-primary/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Initialize Session <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col items-center gap-4">
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-600 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-samp-success"></div>
                  NSE LITE v4.2
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-600 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-samp-primary"></div>
                  SECURE CHANNEL
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
