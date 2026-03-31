
import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit3, Save, X, Database, ShieldCheck, 
  AlertCircle, BarChart, Settings, Sliders, ChevronRight, 
  ArrowRight, Activity, Target, Zap, Layers 
} from 'lucide-react';
import { 
  TradingStrategy, StrategyCondition, IndicatorType, OperatorType 
} from '../types';

interface AdminPanelProps {
  strategies: TradingStrategy[];
  setStrategies: React.Dispatch<React.SetStateAction<TradingStrategy[]>>;
  token: string | null;
  initialTab?: 'architect' | 'errors' | 'inquiries' | 'admissions' | 'aliceblue';
}

const INDICATORS: IndicatorType[] = [
  'PRICE', 'RSI', 'SMA', 'EMA', 'MACD', 'VOLUME', 
  'BOLLINGER_UPPER', 'BOLLINGER_LOWER', 'BOLLINGER_MIDDLE', 
  'ADX', 'DI_PLUS', 'DI_MINUS', 'HEIKIN_ASHI_CANDLE'
];
const OPERATORS: { value: OperatorType; label: string }[] = [
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '>=', label: 'Greater or Equal' },
  { value: '<=', label: 'Less or Equal' },
  { value: '==', label: 'Equal To' },
  { value: 'CROSSOVER', label: 'Crosses Above' },
  { value: 'CROSSUNDER', label: 'Crosses Below' },
  { value: 'NEAR', label: 'Near / Touching' },
  { value: 'BETWEEN', label: 'Is Between' },
  { value: 'PATTERN_MATCH', label: 'Matches Pattern' }
];

const AdminPanel: React.FC<AdminPanelProps> = ({ strategies, setStrategies, token, initialTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'architect' | 'errors' | 'inquiries' | 'admissions' | 'aliceblue'>(initialTab || 'architect');
  
  React.useEffect(() => {
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialTab]);

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [aliceLeads, setAliceLeads] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newStrategy, setNewStrategy] = useState<Partial<TradingStrategy>>({
    name: '',
    description: '',
    timeframe: '5m',
    entryConditions: [],
    exitConditions: [],
    riskConfig: {
      stopLossPct: 1.5,
      takeProfitPct: 3.0,
      trailingStopLoss: false,
      pointBased: false,
      stopLossPoints: 30,
      trailStep: 30,
      minRR: 1.0
    },
    qty: 100,
    productType: 'MIS',
    isActive: true
  });

  const handleAddCondition = (type: 'entry' | 'exit') => {
    const cond: StrategyCondition = {
      id: Math.random().toString(36).substr(2, 5),
      source: 'PRICE',
      sourceParams: { period: 14 },
      operator: '>',
      targetType: 'VALUE',
      targetValue: 0
    };
    
    if (type === 'entry') {
      setNewStrategy(s => ({ ...s, entryConditions: [...(s.entryConditions || []), cond] }));
    } else {
      setNewStrategy(s => ({ ...s, exitConditions: [...(s.exitConditions || []), cond] }));
    }
  };

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setNewStrategy(s => ({ ...s, entryConditions: s.entryConditions?.filter(c => c.id !== id) }));
    } else {
      setNewStrategy(s => ({ ...s, exitConditions: s.exitConditions?.filter(c => c.id !== id) }));
    }
  };

  const updateCondition = (type: 'entry' | 'exit', id: string, updates: Partial<StrategyCondition>) => {
    const updateFn = (conds: StrategyCondition[]) => conds.map(c => c.id === id ? { ...c, ...updates } : c);
    if (type === 'entry') {
      setNewStrategy(s => ({ ...s, entryConditions: updateFn(s.entryConditions || []) }));
    } else {
      setNewStrategy(s => ({ ...s, exitConditions: updateFn(s.exitConditions || []) }));
    }
  };

  const saveStrategy = () => {
    if (!newStrategy.name) return;
    const strategy: TradingStrategy = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: newStrategy.name || '',
      description: newStrategy.description || '',
      timeframe: newStrategy.timeframe || '5m',
      entryConditions: newStrategy.entryConditions as StrategyCondition[],
      exitConditions: newStrategy.exitConditions as StrategyCondition[],
      riskConfig: newStrategy.riskConfig || { stopLossPct: 1, takeProfitPct: 2, trailingStopLoss: false },
      qty: newStrategy.qty || 1,
      productType: (newStrategy.productType as 'MIS' | 'CNC') || 'MIS',
      isActive: newStrategy.isActive ?? true,
      createdBy: 'admin'
    };

    if (editingId) {
      setStrategies(prev => prev.map(s => s.id === editingId ? strategy : s));
    } else {
      setStrategies(prev => [...prev, strategy]);
    }

    setIsAdding(false);
    setEditingId(null);
    setNewStrategy({
      name: '',
      description: '',
      timeframe: '5m',
      entryConditions: [],
      exitConditions: [],
      riskConfig: { stopLossPct: 1.5, takeProfitPct: 3.0, trailingStopLoss: false },
      qty: 100,
      productType: 'MIS',
      isActive: true
    });
  };

  const handleEdit = (s: TradingStrategy) => {
    setNewStrategy(s);
    setEditingId(s.id);
    setIsAdding(true);
  };

  const toggleStrategyActive = (id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const fetchErrors = async () => {
    if (!token) return;
    setIsLoadingErrors(true);
    try {
      const res = await fetch('/api/admin/errors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSystemErrors(data);
    } catch (err) {
      console.error('Failed to fetch system errors:', err);
    } finally {
      setIsLoadingErrors(false);
    }
  };

  const fetchInquiries = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/inquiries', { headers: { 'Authorization': `Bearer ${token}` } });
      setInquiries(await res.json());
    } catch {}
  };

  const fetchAdmissions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/admissions', { headers: { 'Authorization': `Bearer ${token}` } });
      setAdmissions(await res.json());
    } catch {}
  };

  const fetchAliceBlue = async () => {
    if (!token) return;
    try {
        const res = await fetch('/api/admin/aliceblue', { headers: { 'Authorization': `Bearer ${token}` } });
        setAliceLeads(await res.json());
    } catch {}
  };

  React.useEffect(() => {
    if (activeSubTab === 'errors') {
      fetchErrors();
    }
    if (activeSubTab === 'inquiries') fetchInquiries();
    if (activeSubTab === 'admissions') fetchAdmissions();
    if (activeSubTab === 'aliceblue') fetchAliceBlue();
  }, [activeSubTab, token]);

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 max-w-[1600px] mx-auto transition-colors duration-300">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            {(activeSubTab === 'architect' || activeSubTab === 'errors') ? (
              <div className="text-4xl font-black flex items-center gap-4 text-slate-900 dark:text-white">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-samp-primary/10 text-samp-primary">
                    <Sliders size={32} />
                </div>
                Strategy Panel
              </div>
            ) : (
              <div className="text-4xl font-black flex items-center gap-4 text-slate-900 dark:text-white">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                    <Database size={32} />
                </div>
                Lead Management
              </div>
            )}
          </div>
          <p className="text-slate-500 dark:text-gray-500 text-lg font-medium max-w-2xl leading-relaxed">
            {activeSubTab === 'architect' || activeSubTab === 'errors'
              ? "Design limitless automated execution flows. Combine institutional indicators with advanced price action logic."
              : "Manage student enrollments, broker partnerships, and incoming inquiries."}
          </p>
        </div>
      </div>

      {(activeSubTab === 'architect' || activeSubTab === 'errors') ? (
        <div className="flex gap-4 mb-8">
            <button onClick={() => setActiveSubTab('architect')} className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${activeSubTab === 'architect' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>Strategy Architect</button>
            <button onClick={() => setActiveSubTab('errors')} className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${activeSubTab === 'errors' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>Error Reports</button>
        </div>
      ) : (
        <div className="flex gap-4 mb-8">
            <button onClick={() => setActiveSubTab('inquiries')} className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${activeSubTab === 'inquiries' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>General Inquiries</button>
            <button onClick={() => setActiveSubTab('admissions')} className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${activeSubTab === 'admissions' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>Course Admissions</button>
            <button onClick={() => setActiveSubTab('aliceblue')} className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${activeSubTab === 'aliceblue' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}>Alice Blue Partnership</button>
        </div>
      )}


      {!isAdding && activeSubTab === 'architect' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-samp-primary hover:bg-indigo-500 text-white px-8 py-4 rounded-[20px] shadow-2xl shadow-samp-primary/30 transition-all transform hover:-translate-y-1 active:scale-95 font-bold text-lg mb-8"
          >
            <Plus size={24} /> New Architect Draft
          </button>
      )}
      {activeSubTab === 'errors' && (
          <button 
            onClick={fetchErrors}
            className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white px-8 py-4 rounded-[20px] border border-slate-200 dark:border-white/10 transition-all active:scale-95 font-bold text-lg mb-8"
          >
            <Activity className={isLoadingErrors ? 'animate-spin' : ''} size={24} /> Refresh Logs
          </button>
      )}

      <div className="grid grid-cols-12 gap-8">

        {activeSubTab === 'architect' ? (
          <div className={`transition-all duration-500 ease-in-out ${isAdding ? 'col-span-12' : 'col-span-8'}`}>
            {isAdding ? (
              <div className="bg-white dark:bg-samp-surface border-2 border-slate-200 dark:border-samp-primary/20 rounded-[48px] p-10 shadow-3xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden group/board">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-samp-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>

                <div className="flex justify-between items-center mb-12">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-samp-primary/10 rounded-2xl text-samp-primary">
                         <Layers size={28} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Flow Architect</h3>
                         <p className="text-sm text-slate-500 font-mono tracking-widest uppercase mt-1">Status: Drafting System Logic</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-colors">Discard</button>
                      <button 
                         onClick={saveStrategy}
                         className="flex items-center gap-2 bg-samp-primary hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-samp-primary/20 transition-all"
                      >
                         <Save size={20} /> Deploy {editingId ? 'Updates' : 'Strategy'}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-12 gap-10">
                   <div className="col-span-4 space-y-10">
                      <div className="space-y-6">
                         <div className="group/field">
                            <label className="text-[11px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block group-focus-within/field:text-samp-primary transition-colors">Strategy Identity</label>
                            <input 
                               type="text" 
                               placeholder="e.g. NIFTY_MEAN_REVERSION_V2"
                               value={newStrategy.name}
                               onChange={e => setNewStrategy(s => ({...s, name: e.target.value}))}
                               className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-5 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-lg"
                            />
                         </div>

                         <div>
                            <label className="text-[11px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Executive Summary</label>
                            <textarea 
                               placeholder="Describe the logic core for institutional review..."
                               value={newStrategy.description}
                               onChange={e => setNewStrategy(s => ({...s, description: e.target.value}))}
                               className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-5 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all h-32 resize-none text-sm font-medium leading-relaxed"
                            />
                         </div>
                      </div>

                      <div className="p-8 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-[32px] space-y-8">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-samp-danger/10 flex items-center justify-center text-samp-danger">
                               <ShieldCheck size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Risk Guardian</h4>
                         </div>
                         
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-samp-surface rounded-2xl border border-slate-200 dark:border-white/10 mb-6">
                            <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Risk Mode: {newStrategy.riskConfig?.pointBased ? 'POINTS' : 'PERCENTAGE'}</span>
                            <button 
                               onClick={() => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, pointBased: !s.riskConfig!.pointBased }}))}
                               className="px-4 py-1.5 bg-samp-primary/10 text-samp-primary rounded-xl text-[10px] font-black uppercase hover:bg-samp-primary hover:text-white transition-all"
                            >
                               Switch to {newStrategy.riskConfig?.pointBased ? '%' : 'PTS'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             {newStrategy.riskConfig?.pointBased ? (
                               <>
                                 <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SL Points</label>
                                    <input 
                                       type="number" 
                                       value={newStrategy.riskConfig?.stopLossPoints}
                                       onChange={e => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, stopLossPoints: parseFloat(e.target.value) }}))}
                                       className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-samp-danger transition-colors"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Min RR Activation</label>
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       value={newStrategy.riskConfig?.minRR}
                                       onChange={e => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, minRR: parseFloat(e.target.value) }}))}
                                       className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-samp-success transition-colors"
                                    />
                                 </div>
                               </>
                             ) : (
                               <>
                                 <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stop Loss %</label>
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       value={newStrategy.riskConfig?.stopLossPct}
                                       onChange={e => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, stopLossPct: parseFloat(e.target.value) }}))}
                                       className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-samp-danger transition-colors"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Take Profit %</label>
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       value={newStrategy.riskConfig?.takeProfitPct}
                                       onChange={e => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, takeProfitPct: parseFloat(e.target.value) }}))}
                                       className="w-full bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-samp-success transition-colors"
                                    />
                                 </div>
                               </>
                             )}
                          </div>

                         <div className="flex items-center justify-between p-4 bg-white dark:bg-samp-surface rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                               <div className={`w-4 h-4 rounded-full border-2 ${newStrategy.riskConfig?.trailingStopLoss ? 'bg-samp-primary border-samp-primary' : 'border-slate-300 dark:border-white/20'}`}></div>
                               <span className="text-sm font-bold text-slate-700 dark:text-gray-300">Trailing Stop Loss</span>
                            </div>
                            <button 
                               onClick={() => setNewStrategy(s => ({...s, riskConfig: { ...s.riskConfig!, trailingStopLoss: !s.riskConfig!.trailingStopLoss }}))}
                               className={`w-12 h-6 rounded-full transition-all relative ${newStrategy.riskConfig?.trailingStopLoss ? 'bg-samp-primary' : 'bg-slate-300 dark:bg-gray-700'}`}
                            >
                               <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newStrategy.riskConfig?.trailingStopLoss ? 'right-1' : 'left-1'}`}></div>
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="col-span-8 space-y-10">
                      <div className="space-y-6">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-samp-success/10 flex items-center justify-center text-samp-success">
                                  <Zap size={20} />
                               </div>
                               Entry Condition Logic
                               <span className="text-[10px] bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 px-2 py-1 rounded font-mono font-bold">MODE: ALL MUST PASS (AND)</span>
                            </h4>
                            <button 
                               onClick={() => handleAddCondition('entry')}
                               className="text-xs font-bold text-samp-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                            >
                               <Plus size={16} /> ADD LOGIC BLOCK
                            </button>
                         </div>

                         <div className="space-y-4">
                            {newStrategy.entryConditions?.map((cond, i) => (
                              <LogicBlock 
                                 key={cond.id} 
                                 index={i} 
                                 condition={cond} 
                                 onRemove={() => removeCondition('entry', cond.id)}
                                 onUpdate={(u) => updateCondition('entry', cond.id, u)}
                              />
                            ))}
                            {newStrategy.entryConditions?.length === 0 && (
                              <div className="py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
                                 <Activity size={32} className="mb-2 opacity-30" />
                                 <p className="text-sm font-medium">No entry rules defined. Strategy will never trigger.</p>
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex justify-between items-center">
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-samp-danger/10 flex items-center justify-center text-samp-danger">
                                  <Target size={20} />
                               </div>
                               Exit Signal logic
                               <span className="text-[10px] bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 px-2 py-1 rounded font-mono font-bold">MODE: ANY TRIGGERS (OR)</span>
                            </h4>
                            <button 
                               onClick={() => handleAddCondition('exit')}
                               className="text-xs font-bold text-samp-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                            >
                               <Plus size={16} /> ADD LOGIC BLOCK
                            </button>
                         </div>

                         <div className="space-y-4">
                            {newStrategy.exitConditions?.map((cond, i) => (
                              <LogicBlock 
                                 key={cond.id} 
                                 index={i} 
                                 condition={cond} 
                                 onRemove={() => removeCondition('exit', cond.id)}
                                 onUpdate={(u) => updateCondition('exit', cond.id, u)}
                              />
                            ))}
                            {newStrategy.exitConditions?.length === 0 && (
                              <div className="py-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
                                 <p className="text-sm font-medium">Standard Exit: Stop Loss / Take Profit only.</p>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {strategies.map(s => (
                  <div key={s.id} className={`bg-white dark:bg-samp-surface border rounded-[40px] p-8 transition-all group/card shadow-xl relative overflow-hidden ${s.isActive ? 'border-slate-200 dark:border-white/5' : 'opacity-60 border-slate-300 dark:border-white/10 saturate-[0.5]'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-5">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover/card:scale-110 group-hover/card:rotate-3 ${s.isActive ? 'bg-slate-100 dark:bg-white/5 text-samp-primary' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                              <Activity size={28} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white">{s.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.timeframe} TIMEFRAME</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-700"></span>
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${s.isActive ? 'text-samp-success' : 'text-slate-500'}`}>{s.isActive ? 'ACTIVE NODE' : 'INACTIVE'}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(s)} className="p-3 text-slate-400 dark:text-gray-500 hover:text-samp-primary hover:bg-samp-primary/10 rounded-2xl transition-all"><Edit3 size={20} /></button>
                            <button onClick={() => setStrategies(prev => prev.filter(st => st.id !== s.id))} className="p-3 text-slate-400 dark:text-gray-500 hover:text-samp-danger hover:bg-samp-danger/10 rounded-2xl transition-all"><Trash2 size={20} /></button>
                          </div>
                          {/* Status Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.isActive ? 'ENABLED' : 'DISABLED'}</span>
                            <button 
                              onClick={() => toggleStrategyActive(s.id)}
                              className={`w-10 h-5 rounded-full transition-all relative ${s.isActive ? 'bg-samp-success shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-300 dark:bg-gray-700'}`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${s.isActive ? 'right-0.5' : 'left-0.5'}`}></div>
                            </button>
                          </div>
                        </div>
                     </div>

                     <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mb-8 leading-relaxed line-clamp-2">
                        {s.description || "No system documentation provided."}
                     </p>

                     <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100 dark:border-white/5 mb-8">
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conditions</p>
                           <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{s.entryConditions.length + s.exitConditions.length}</p>
                        </div>
                        <div className="text-center border-x border-slate-100 dark:border-white/5 px-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lot Units</p>
                           <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{s.qty}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.riskConfig.pointBased ? 'Risk (Points)' : 'Target P&L'}</p>
                           <p className={`text-xl font-bold font-mono ${s.riskConfig.pointBased ? 'text-samp-danger' : (s.isActive ? 'text-samp-success' : 'text-slate-400')}`}>
                              {s.riskConfig.pointBased ? `-${s.riskConfig.stopLossPoints}` : `+${s.riskConfig.takeProfitPct}%`}
                           </p>
                        </div>
                     </div>

                     <button 
                        onClick={() => handleEdit(s)}
                        className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-300 font-bold rounded-2xl border border-slate-200 dark:border-white/5 hover:border-samp-primary/50 hover:text-samp-primary transition-all flex items-center justify-center gap-2 group/btn"
                     >
                        Modify Architecture <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-white/40 dark:bg-samp-surface/20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[40px] p-12 flex flex-col items-center justify-center text-slate-400 hover:border-samp-primary/30 hover:text-samp-primary transition-all group/add"
                >
                   <div className="w-20 h-20 rounded-[32px] bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 group-hover/add:scale-110 transition-transform">
                      <Plus size={40} />
                   </div>
                   <h4 className="text-xl font-black uppercase tracking-[0.2em]">New Logic Node</h4>
                   <p className="text-sm font-medium mt-2">Scale your quant factory</p>
                </button>
              </div>
            )}
          </div>
        ) : activeSubTab === 'errors' ? (
          <div className="col-span-12 space-y-6">
            <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-10 overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">{systemErrors.length} entries captured</span>
              </div>
              
              <div className="space-y-4">
                {systemErrors.length > 0 ? (
                  systemErrors.slice().reverse().map((err, i) => (
                    <div key={i} className="flex gap-6 p-6 bg-slate-50 dark:bg-black/20 rounded-[32px] border border-slate-100 dark:border-white/5 items-start group hover:border-samp-danger/30 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-samp-danger/10 flex items-center justify-center text-samp-danger shrink-0">
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold text-slate-900 dark:text-white text-lg">{err.context || 'System Error'}</h4>
                           <span className="text-xs font-mono text-slate-400">{new Date(err.timestamp).toLocaleString()}</span>
                         </div>
                         <p className="text-slate-600 dark:text-gray-400 font-mono text-sm break-all bg-white dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 mt-3">
                           {err.error}
                         </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-black/10 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <ShieldCheck size={48} className="mb-4 text-samp-success opacity-50" />
                    <p className="text-lg font-bold">No system errors reported. System is healthy.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeSubTab === 'inquiries' ? (
          <div className="col-span-12 space-y-6">
            <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-10 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">General Inquiries</h3>
                  <p className="text-slate-500 dark:text-gray-500 font-medium mt-1">Direct messages from the landing page contact form</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-2xl text-xs font-bold uppercase tracking-widest">{inquiries.length} Messages</span>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Info</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Received At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {inquiries.length > 0 ? inquiries.map((iq, i) => (
                      <tr key={i} className="hover:bg-blue-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 dark:text-white">{iq.name}</span>
                            <span className="text-xs font-mono text-slate-400">{iq.phone}</span>
                            {iq.email && <span className="text-xs font-mono text-blue-500">{iq.email}</span>}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 max-w-lg">{iq.message}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-mono text-slate-400">{new Date(iq.createdAt).toLocaleString()}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-slate-400 italic">No inquiries found in the pipeline.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'admissions' ? (
          <div className="col-span-12 space-y-6">
            <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-10 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">Academy Admissions</h3>
                  <p className="text-slate-500 dark:text-gray-500 font-medium mt-1">Student enrollment requests for training courses</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-bold uppercase tracking-widest">{admissions.length} Enrollments</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Course</th>
                      <th className="px-8 py-5 text-[100px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {admissions.length > 0 ? admissions.map((adm, i) => (
                      <tr key={i} className="hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 dark:text-white">{adm.name}</span>
                            <div className="flex gap-4">
                                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">☎ {adm.phone}</span>
                                <span className="text-xs font-mono text-blue-500 flex items-center gap-1">✉ {adm.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-2 bg-blue-900 text-white rounded-full text-xs font-bold shadow-md">{adm.course}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-mono text-slate-400">{new Date(adm.createdAt).toLocaleString()}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-slate-400 italic">No registrations found yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'aliceblue' ? (
          <div className="col-span-12 space-y-6">
            <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-10 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">Alice Blue Partners</h3>
                  <p className="text-slate-500 dark:text-gray-500 font-medium mt-1">Demat account opening requests via partner portal</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-2xl text-xs font-bold uppercase tracking-widest">{aliceLeads.length} Partners</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Info</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Verification</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {aliceLeads.length > 0 ? aliceLeads.map((lead, i) => (
                      <tr key={i} className="hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 dark:text-white">{lead.name}</span>
                            <div className="flex gap-4">
                                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">☎ {lead.phone}</span>
                                <span className="text-xs font-mono text-blue-500 flex items-center gap-1">✉ {lead.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 rounded-lg text-xs font-mono font-bold border border-slate-200 dark:border-white/5">{lead.pan}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-mono text-slate-400">{new Date(lead.createdAt).toLocaleString()}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-slate-400 italic">No Alice Blue partner leads processed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        
        {!isAdding && activeSubTab === 'architect' && (
           <div className="col-span-4 space-y-8">
              <div className="bg-samp-primary rounded-[40px] p-10 text-white shadow-3xl relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                 <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <BarChart size={28} />
                    Live Fleet Status
                 </h3>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                       <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Total Nodes</span>
                       <span className="text-2xl font-bold font-mono">{strategies.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                       <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Automated Liquidity</span>
                       <span className="text-2xl font-bold font-mono">₹{strategies.reduce((a,b)=> a+b.qty, 0)*25000}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                       <span className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Handshake Status</span>
                       <span className="flex items-center gap-2 font-bold text-xs">
                          <div className="w-2 h-2 rounded-full bg-samp-success animate-pulse"></div>
                          OPTIMIZED
                       </span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-100 dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[40px] p-8 space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-samp-accent/10 rounded-lg text-samp-accent">
                       <Settings size={20} />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Platform Compliance</h4>
                 </div>
                 <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                    All strategies deployed here are instantly propagated to the user market terminal. Administrators must perform backtesting before committing logic to production.
                 </p>
                 <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-[11px] text-amber-700 dark:text-amber-500/80 font-bold uppercase leading-tight">
                       Modification of active lot sizes affects real-time margin requirements for all connected users.
                    </p>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

interface LogicBlockProps {
  index: number;
  condition: StrategyCondition;
  onRemove: () => void;
  onUpdate: (updates: Partial<StrategyCondition>) => void;
}

const LogicBlock: React.FC<LogicBlockProps> = ({ index, condition, onRemove, onUpdate }) => {
  return (
    <div className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[24px] p-6 hover:border-samp-primary/30 transition-all group/block relative">
       <button 
         onClick={onRemove}
         className="absolute top-4 right-4 p-2 text-slate-300 dark:text-gray-700 hover:text-samp-danger transition-colors opacity-0 group-hover/block:opacity-100"
       >
         <Trash2 size={16} />
       </button>
       
       <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-1">
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[11px] font-black text-slate-400 dark:text-gray-600 border border-slate-200 dark:border-white/10">
                #{index + 1}
             </div>
          </div>

          <div className="col-span-3 space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest ml-1">Source</label>
             <select 
               value={condition.source}
               onChange={e => onUpdate({ source: e.target.value as IndicatorType })}
               className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors"
             >
                {INDICATORS.map(i => <option key={i} value={i} className="bg-white dark:bg-[#151725]">{i}</option>)}
             </select>
          </div>

          <div className="col-span-3 space-y-1.5">
             <label className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest ml-1">Logic Operator</label>
             <select 
               value={condition.operator}
               onChange={e => onUpdate({ operator: e.target.value as OperatorType })}
               className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors"
             >
                {OPERATORS.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-[#151725]">{o.label}</option>)}
             </select>
          </div>

          <div className="col-span-5 flex gap-4">
             <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest ml-1 flex justify-between">
                   Target Setup
                   <button 
                     onClick={() => onUpdate({ targetType: condition.targetType === 'VALUE' ? 'INDICATOR' : 'VALUE' })}
                     className="text-samp-primary hover:underline lowercase italic text-[8px]"
                   >
                      to {condition.targetType === 'VALUE' ? 'indicator' : 'value'}
                   </button>
                </label>
                {condition.source === 'HEIKIN_ASHI_CANDLE' ? (
                   <select 
                     value={condition.pattern}
                     onChange={e => onUpdate({ pattern: e.target.value as any })}
                     className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors"
                   >
                      <option value="STRONG_BULLISH">STRONG BULLISH</option>
                      <option value="STRONG_BEARISH">STRONG BEARISH</option>
                      <option value="WEAK_CANDLE">WEAK CANDLE</option>
                   </select>
                ) : condition.operator === 'BETWEEN' ? (
                   <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="Min"
                        value={condition.minValue}
                        onChange={e => onUpdate({ minValue: parseFloat(e.target.value) })}
                        className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors font-mono"
                      />
                      <input 
                        type="number"
                        placeholder="Max"
                        value={condition.maxValue}
                        onChange={e => onUpdate({ maxValue: parseFloat(e.target.value) })}
                        className="w-1/2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors font-mono"
                      />
                   </div>
                ) : condition.targetType === 'VALUE' ? (
                  <input 
                    type="number"
                    value={condition.targetValue}
                    onChange={e => onUpdate({ targetValue: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors font-mono"
                  />
                ) : (
                  <select 
                    value={condition.targetIndicator}
                    onChange={e => onUpdate({ targetIndicator: e.target.value as IndicatorType })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors"
                  >
                     {INDICATORS.map(i => <option key={i} value={i} className="bg-white dark:bg-[#151725]">{i}</option>)}
                  </select>
                )}
             </div>
             
             {(condition.source !== 'PRICE' || condition.targetType === 'INDICATOR') && (
                <div className="w-20 space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest ml-1">Period</label>
                   <input 
                      type="number"
                      value={condition.sourceParams.period || 14}
                      onChange={e => onUpdate({ sourceParams: { ...condition.sourceParams, period: parseInt(e.target.value) } })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-colors font-mono"
                   />
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default AdminPanel;
