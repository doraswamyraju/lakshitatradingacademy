
import React, { useState } from 'react';
import { BookOpen, Search, Copy, Plus, Activity, Zap, ShieldCheck, Target, ChevronRight, X } from 'lucide-react';
import { TradingStrategy } from '../types';

interface StrategyHubProps {
  strategies: TradingStrategy[];
  onCopy: (strategy: TradingStrategy, units: number) => void;
}

const StrategyHub: React.FC<StrategyHubProps> = ({ strategies, onCopy }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [units, setUnits] = useState(1);

  const filtered = strategies.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    if (selectedStrategy) {
      onCopy(selectedStrategy, units);
      setSelectedStrategy(null);
      setUnits(1);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 max-w-[1400px] mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-samp-warning/10 flex items-center justify-center text-samp-warning">
                <BookOpen size={32} />
             </div>
             Master Strategy Hub
          </h2>
          <p className="text-slate-500 dark:text-gray-500 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
            Browse institutionally validated trading blueprints. Copy templates to your workspace and customize deployment volume.
          </p>
        </div>

        <div className="relative w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search templates..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary shadow-lg transition-all"
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 scrollbar-hide">
         {filtered.map(s => (
            <div key={s.id} className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-8 flex flex-col hover:border-samp-primary/40 dark:hover:border-samp-primary/20 transition-all group shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-samp-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                     <Activity size={28} />
                  </div>
                  <div className="bg-samp-success/10 px-3 py-1 rounded-full border border-samp-success/20">
                     <span className="text-[10px] text-samp-success font-black uppercase tracking-widest">Validated</span>
                  </div>
               </div>

               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{s.name}</h3>
               <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-8 leading-relaxed line-clamp-2">
                  {s.description}
               </p>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Profile</p>
                     <p className="text-xs font-bold text-slate-900 dark:text-white">Medium-High</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeframe</p>
                     <p className="text-xs font-bold text-slate-900 dark:text-white">{s.timeframe}</p>
                  </div>
               </div>

               <button 
                  onClick={() => setSelectedStrategy(s)}
                  className="mt-auto w-full py-4 bg-samp-primary/10 text-samp-primary font-bold rounded-2xl border border-samp-primary/20 hover:bg-samp-primary hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
               >
                  <Copy size={18} className="group-hover/btn:scale-110 transition-transform" />
                  Copy to Namespace
               </button>
            </div>
         ))}
      </div>

      {selectedStrategy && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-[48px] p-10 w-full max-w-lg shadow-3xl animate-in fade-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-samp-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-samp-primary/10 rounded-2xl text-samp-primary">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Configure Deployment</h3>
                       <p className="text-sm text-slate-500 font-medium">Step: Set Volume Units</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedStrategy(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="space-y-8">
                 <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-6">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{selectedStrategy.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{selectedStrategy.description}</p>
                    <div className="flex gap-4">
                       <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Zap size={12} className="text-samp-warning" />
                          Risk: {selectedStrategy.riskConfig.stopLossPct}% SL
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Target size={12} className="text-samp-success" />
                          Goal: {selectedStrategy.riskConfig.takeProfitPct}% TP
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                       <label className="text-[11px] text-slate-500 uppercase font-black tracking-widest">Quantity Units (Lots)</label>
                       <span className="text-[11px] text-samp-primary font-mono">Min: 1 | Max: 1000</span>
                    </div>
                    <div className="relative group">
                       <input 
                         type="number" 
                         min="1"
                         max="1000"
                         value={units}
                         onChange={e => setUnits(parseInt(e.target.value) || 1)}
                         className="w-full bg-slate-100 dark:bg-black/40 border-2 border-slate-200 dark:border-white/5 rounded-3xl py-6 px-8 text-3xl font-black text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-mono text-center shadow-inner"
                       />
                       <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                          <Plus size={24} />
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                       onClick={() => setSelectedStrategy(null)}
                       className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleCopy}
                       className="flex-[2] bg-samp-primary hover:bg-indigo-500 text-white font-bold py-4 rounded-[24px] shadow-2xl shadow-samp-primary/20 transition-all flex items-center justify-center gap-3 transform active:scale-95 group"
                    >
                       Confirm & Sync
                       <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StrategyHub;
