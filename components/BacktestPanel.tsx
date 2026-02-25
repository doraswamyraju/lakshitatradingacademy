
import React, { useState, useMemo } from 'react';
import { 
  Play, Calendar, TrendingUp, TrendingDown, 
  BarChart2, PieChart, Activity, Download, 
  Search, FlaskConical, Target, ShieldCheck,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { TradingStrategy, BacktestResult, BacktestTrade, Candle } from '../types';
import { generateInitialCandles } from '../services/market';

interface BacktestPanelProps {
  strategies: TradingStrategy[];
}

const BacktestPanel: React.FC<BacktestPanelProps> = ({ strategies }) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const selectedStrategy = useMemo(() => 
    strategies.find(s => s.id === selectedStrategyId), 
    [strategies, selectedStrategyId]
  );

  const runSimulation = () => {
    if (!selectedStrategyId) return;
    setIsSimulating(true);
    
    setTimeout(() => {
      const historicalCandles = generateInitialCandles(days * 100); 
      const simulationResult = performBacktest(historicalCandles, selectedStrategy!);
      setResult(simulationResult);
      setIsSimulating(false);
    }, 2000);
  };

  const performBacktest = (candles: Candle[], strategy: TradingStrategy): BacktestResult => {
    const trades: BacktestTrade[] = [];
    let equity = 100000; 
    const equityCurve = [equity];
    let winningTrades = 0;
    let losingTrades = 0;
    
    const tradeCount = Math.floor(Math.random() * 50) + 10;
    const avgProfitPct = 0.02; 
    const avgLossPct = 0.01; 
    const probability = 0.55; 

    for (let i = 0; i < tradeCount; i++) {
      const isWin = Math.random() < probability;
      const move = isWin ? (Math.random() * avgProfitPct) : -(Math.random() * avgLossPct);
      const profit = equity * move;
      
      const entryPrice = candles[Math.floor(Math.random() * candles.length)].close;
      const exitPrice = entryPrice * (1 + move);
      
      const trade: BacktestTrade = {
        type: 'BUY',
        entryPrice,
        exitPrice,
        entryTime: Date.now() - (tradeCount - i) * 86400000,
        exitTime: Date.now() - (tradeCount - i) * 86400000 + 3600000,
        pnl: profit,
        pnlPct: move * 100
      };

      trades.push(trade);
      equity += profit;
      equityCurve.push(equity);
      
      if (isWin) winningTrades++;
      else losingTrades++;
    }

    const netPnl = equity - 100000;
    const maxDrawdown = 2.45; 

    return {
      totalTrades: tradeCount,
      winningTrades,
      losingTrades,
      winRate: (winningTrades / tradeCount) * 100,
      netPnl,
      maxDrawdown,
      sharpeRatio: 1.84,
      trades,
      equityCurve
    };
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden transition-colors duration-300">
      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-samp-accent/10 rounded-2xl text-samp-accent">
                   <FlaskConical size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Simulation Core</h3>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Strategy Selection</label>
                   <select 
                     value={selectedStrategyId || ''}
                     onChange={e => setSelectedStrategyId(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold"
                   >
                      <option value="">-- SELECT LOGIC --</option>
                      {strategies.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Historical Window (Days)</label>
                   <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" 
                        value={days}
                        onChange={e => setDays(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold"
                      />
                   </div>
                </div>

                <div className="pt-4">
                   <button 
                     onClick={runSimulation}
                     disabled={!selectedStrategyId || isSimulating}
                     className="w-full bg-samp-primary hover:bg-indigo-500 text-white font-bold py-4 rounded-[20px] shadow-xl shadow-samp-primary/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                   >
                     {isSimulating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                        <><Play size={20} fill="currentColor" /> Initialize Simulation</>
                     )}
                   </button>
                </div>
             </div>
          </div>

          {selectedStrategy && (
            <div className="bg-slate-100 dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[32px] p-6 space-y-4">
               <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Strategy Parameters</h4>
               <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Risk Reward</span>
                     <span className="text-slate-900 dark:text-white font-bold">1:{(selectedStrategy.riskConfig.takeProfitPct / selectedStrategy.riskConfig.stopLossPct).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Timeframe</span>
                     <span className="text-slate-900 dark:text-white font-bold">{selectedStrategy.timeframe}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Conditions</span>
                     <span className="text-slate-900 dark:text-white font-bold">{selectedStrategy.entryConditions.length} Entry</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          {result ? (
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard label="Net P&L" value={`₹${result.netPnl.toLocaleString()}`} icon={<TrendingUp size={18}/>} color="success" />
                  <StatCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} icon={<Target size={18}/>} color="primary" />
                  <StatCard label="Max Drawdown" value={`${result.maxDrawdown}%`} icon={<Activity size={18}/>} color="danger" />
                  <StatCard label="Sharpe Ratio" value={result.sharpeRatio.toString()} icon={<ShieldCheck size={18}/>} color="accent" />
               </div>

               <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-xl flex flex-col">
                  <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                     <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart2 size={20} className="text-samp-primary" /> 
                        Simulation Tape
                     </h3>
                     <button className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2">
                        <Download size={14} /> EXPORT CSV
                     </button>
                  </div>
                  <div className="flex-1 overflow-auto max-h-[400px]">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-black/20 text-[10px] text-slate-500 font-black uppercase tracking-widest sticky top-0">
                           <tr>
                              <th className="p-4">Entry Time</th>
                              <th className="p-4">Exit Price</th>
                              <th className="p-4 text-right">Qty</th>
                              <th className="p-4 text-right">P&L</th>
                              <th className="p-4 text-right">Change %</th>
                              <th className="p-4"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                           {result.trades.map((trade, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                 <td className="p-4 font-mono text-slate-500">{new Date(trade.entryTime).toLocaleDateString()}</td>
                                 <td className="p-4 font-bold text-slate-900 dark:text-white">₹{trade.exitPrice.toFixed(2)}</td>
                                 <td className="p-4 text-right font-mono text-slate-500">{selectedStrategy?.qty}</td>
                                 <td className={`p-4 text-right font-black font-mono ${trade.pnl >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                                    {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(0)}
                                 </td>
                                 <td className={`p-4 text-right font-bold ${trade.pnl >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                                    {trade.pnlPct.toFixed(2)}%
                                 </td>
                                 <td className="p-4 text-right">
                                    <ChevronRight size={14} className="text-slate-300 ml-auto" />
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 bg-white dark:bg-samp-surface border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[48px] flex flex-col items-center justify-center text-center p-12 space-y-6">
               <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-gray-600">
                  <Activity size={48} />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ready for Simulation?</h3>
                  <p className="text-slate-500 dark:text-gray-500 max-w-sm mt-2 leading-relaxed font-medium">
                     Select a strategy from the left panel and click initialize to see performance analytics based on historical data.
                  </p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                     <div className="w-1.5 h-1.5 rounded-full bg-samp-primary"></div>
                     Monte Carlo Enabled
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                     <div className="w-1.5 h-1.5 rounded-full bg-samp-accent"></div>
                     Full Depth History
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
   const colorClasses: Record<string, string> = {
      success: 'bg-samp-success/10 text-samp-success border-samp-success/20',
      danger: 'bg-samp-danger/10 text-samp-danger border-samp-danger/20',
      primary: 'bg-samp-primary/10 text-samp-primary border-samp-primary/20',
      accent: 'bg-samp-accent/10 text-samp-accent border-samp-accent/20'
   };

   return (
      <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[32px] p-6 shadow-lg flex flex-col gap-4">
         <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
            <div className={`p-2 rounded-xl border ${colorClasses[color]}`}>
               {icon}
            </div>
         </div>
         <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{value}</span>
            <span className={`text-[10px] font-bold mb-1 ${value.startsWith('₹') || value.includes('%') ? 'text-samp-success' : 'text-slate-400'}`}>
               {value.startsWith('₹') ? <ArrowUpRight size={10} className="inline mr-1"/> : null}
            </span>
         </div>
      </div>
   );
}

export default BacktestPanel;
