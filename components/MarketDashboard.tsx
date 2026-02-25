
import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Zap, IndianRupee, Search, Activity, Play, Square, Command, Globe, Clock, ShieldCheck, X, Trash2, LayoutGrid, Layers } from 'lucide-react';
import { Candle, MarketState, AIAnalysisResult, UserFunds, Position, Order, TradingStrategy, BrokerConfig, UserRole, ChartType } from '../types';
import { generateInitialCandles, generateNextCandle, generateOrderBook } from '../services/market';
import { analyzeMarket } from '../services/geminiService';
import MarketChart from './MarketChart';
import TradingPanel from './TradingPanel';
import PortfolioPanel from './PortfolioPanel';

interface MarketDashboardProps {
  strategies: TradingStrategy[];
  brokerConfig: BrokerConfig;
  userRole: UserRole;
  onRemoveStrategy?: (id: string) => void;
}

const MarketDashboard: React.FC<MarketDashboardProps> = ({ strategies, brokerConfig, userRole, onRemoveStrategy }) => {
  const [market, setMarket] = useState<MarketState>({
    symbol: 'NSE:NIFTY50',
    price: 22450.35,
    candles: [],
    bids: [],
    asks: [],
    trend: 'neutral'
  });

  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [isAutomationOn, setIsAutomationOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<ChartType>('CANDLE');
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Kernel active...", "[SYSTEM] Listening for user triggers..."]);

  const [funds, setFunds] = useState<UserFunds>({ available: 500000.00, used: 0, total: 500000.00 });
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const automationRef = useRef(isAutomationOn);
  const strategyRef = useRef(activeStrategyId);

  useEffect(() => { automationRef.current = isAutomationOn; }, [isAutomationOn]);
  useEffect(() => { strategyRef.current = activeStrategyId; }, [activeStrategyId]);

  useEffect(() => {
    const candles = generateInitialCandles(60, 22450.35);
    setMarket(prev => ({ ...prev, candles, ...generateOrderBook(22450.35) }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarket(prev => {
        if (prev.candles.length === 0) return prev;
        const lastCandle = prev.candles[prev.candles.length - 1];
        const newCandle = generateNextCandle(lastCandle.close, lastCandle.time);
        
        if (automationRef.current && strategyRef.current) {
          const strategy = strategies.find(s => s.id === strategyRef.current);
          if (strategy && strategy.isActive) {
             const chance = Math.random();
             if (chance > 0.99) {
                handlePlaceOrder('BUY', strategy.qty, 'MARKET', strategy.productType);
                addLog(`[AUTO] ${strategy.name} logic hit. Execution successful.`);
             }
          }
        }

        return {
          ...prev,
          price: newCandle.close,
          candles: [...prev.candles.slice(1), newCandle],
          ...generateOrderBook(newCandle.close),
          trend: newCandle.close > prev.price ? 'bullish' : 'bearish'
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [strategies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const formattedSymbol = searchQuery.toUpperCase().startsWith('NSE:') ? searchQuery.toUpperCase() : `NSE:${searchQuery.toUpperCase()}`;
      setMarket(prev => ({ ...prev, symbol: formattedSymbol }));
      addLog(`[CONTEXT] Terminal updated to ${formattedSymbol}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  useEffect(() => {
    setPositions(prev => prev.map(pos => ({ ...pos, ltp: market.price, pnl: (market.price - pos.avgPrice) * pos.quantity })));
  }, [market.price]);

  const handlePlaceOrder = (side: 'BUY' | 'SELL', quantity: number, type: 'MARKET' | 'LIMIT', product: 'MIS' | 'CNC', priceOverride?: number) => {
    const executionPrice = priceOverride || market.price;
    const orderValue = executionPrice * quantity;
    const marginRequired = product === 'MIS' ? orderValue / 5 : orderValue;

    if (side === 'BUY' && funds.available < marginRequired) {
      addLog(`[ORDER REJECTED] Insufficient funds for ₹${marginRequired.toFixed(2)} margin.`);
      return;
    }

    const newOrder: Order = { 
      order_id: Math.random().toString(36).substr(2, 9).toUpperCase(), 
      symbol: market.symbol, 
      transaction_type: side, 
      quantity, 
      price: executionPrice, 
      order_type: type, 
      status: 'COMPLETE', 
      order_timestamp: new Date().toISOString(), 
      product 
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update funds
    if (side === 'BUY') {
      setFunds(prev => ({ ...prev, available: prev.available - marginRequired, used: prev.used + marginRequired }));
    } else {
      setFunds(prev => ({ ...prev, available: prev.available + marginRequired, used: prev.used - marginRequired }));
    }

    setPositions(prev => {
      const existing = prev.find(p => p.symbol === market.symbol && p.product === product);
      if (side === 'BUY') {
        if (existing) {
          const totalQty = existing.quantity + quantity;
          const avgPrice = ((existing.quantity * existing.avgPrice) + (executionPrice * quantity)) / totalQty;
          return prev.map(p => p === existing ? { ...p, quantity: totalQty, avgPrice } : p);
        }
        return [...prev, { symbol: market.symbol, quantity, avgPrice: executionPrice, ltp: executionPrice, pnl: 0, product }];
      } else {
        if (existing) {
          const newQty = existing.quantity - quantity;
          if (newQty <= 0) {
            addLog(`[POSITION CLOSED] ${market.symbol} ${product} exited at ₹${executionPrice.toFixed(2)}`);
            return prev.filter(p => p !== existing);
          }
          return prev.map(p => p === existing ? { ...p, quantity: newQty } : p);
        }
        if (product === 'MIS') {
           return [...prev, { symbol: market.symbol, quantity: -quantity, avgPrice: executionPrice, ltp: executionPrice, pnl: 0, product }];
        }
        return prev;
      }
    });

    addLog(`[ORDER PLACED] ${side} ${quantity} ${market.symbol} @ ₹${executionPrice.toFixed(2)}`);
  };

  const toggleAutomation = () => {
    if (!activeStrategyId) { addLog("SYSTEM: Kernel requires logic selection."); return; }
    if (!brokerConfig.isConnected) { addLog("SYSTEM: Broker API required."); return; }
    setIsAutomationOn(!isAutomationOn);
    addLog(`AUTO-NODE: ${!isAutomationOn ? 'ACTIVE' : 'IDLE'}`);
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-xl shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-8">
           <div className="flex flex-col min-w-[220px]">
              <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-samp-success animate-pulse"></div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Real-time Feed</span></div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><IndianRupee className="text-samp-primary" size={24} />{market.symbol}<button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"><Search size={18} /></button></h2>
           </div>
           <div className="flex flex-col"><span className={`text-3xl font-mono font-bold tracking-tighter ${market.trend === 'bullish' ? 'text-samp-success' : 'text-samp-danger'}`}>{market.price.toFixed(2)}</span><span className={`text-xs font-mono font-medium ${market.trend === 'bullish' ? 'text-samp-success/70' : 'text-samp-danger/70'}`}>{market.trend === 'bullish' ? '▲' : '▼'} 0.84% (+187.20)</span></div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-inner transition-colors duration-300">
           <div className="flex flex-col pr-4 border-r border-slate-300 dark:border-white/10">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Personal Workspace Algos</span>
              <div className="flex items-center gap-2">
                <select value={activeStrategyId || ''} onChange={e => setActiveStrategyId(e.target.value)} disabled={isAutomationOn} className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                   <option value="" className="bg-white dark:bg-[#151725]">-- SELECT ALGO --</option>
                   {strategies.map(s => (
                     <option key={s.id} value={s.id} className="bg-white dark:bg-[#151725]">{s.name} ({s.qty} Units)</option>
                   ))}
                </select>
                {activeStrategyId && !isAutomationOn && onRemoveStrategy && (
                  <button onClick={() => { onRemoveStrategy(activeStrategyId); setActiveStrategyId(null); }} className="p-1 text-slate-400 hover:text-samp-danger transition-colors"><Trash2 size={14}/></button>
                )}
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end"><span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Automation</span><span className={`text-[10px] font-mono font-bold ${isAutomationOn ? 'text-samp-success' : 'text-slate-400'}`}>{isAutomationOn ? 'ACTIVE' : 'IDLE'}</span></div>
              <button onClick={toggleAutomation} className={`p-3 rounded-xl transition-all active:scale-95 shadow-lg ${isAutomationOn ? 'bg-samp-danger/20 text-samp-danger border border-samp-danger/40 hover:bg-samp-danger/30' : 'bg-samp-success/20 text-samp-success border border-samp-success/40 hover:bg-samp-success/30'}`}>{isAutomationOn ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
           </div>
        </div>

        <div className="flex items-center gap-8 pr-4">
           <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Free Margin</p><p className="text-xl text-slate-900 dark:text-white font-mono font-bold">₹{funds.available.toLocaleString()}</p></div>
           <div className="text-right min-w-[100px]"><p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Portfolio P&L</p><p className={`text-xl font-mono font-bold ${positions.reduce((acc, p) => acc + p.pnl, 0) >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>{positions.reduce((acc, p) => acc + p.pnl, 0) >= 0 ? '+' : ''}₹{positions.reduce((acc, p) => acc + p.pnl, 0).toFixed(2)}</p></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
         {/* Left Column: Chart and Portfolio */}
         <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex-[3] bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 flex flex-col relative transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {['1m', '5m', '15m', '1h', 'D'].map(tf => (
                    <button key={tf} className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${tf === '1m' ? 'bg-samp-primary text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{tf}</button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center"></div>
                  <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <button 
                      onClick={() => setChartType('CANDLE')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'CANDLE' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}
                    >
                      <LayoutGrid size={12} /> Standard
                    </button>
                    <button 
                      onClick={() => setChartType('HEIKIN_ASHI')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'HEIKIN_ASHI' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}
                    >
                      <Layers size={12} /> Heikin Ashi
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Globe size={12} className="text-samp-accent" />SERVERS: UP</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Clock size={12} className="text-samp-accent" />SESSION: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex-1">
                <MarketChart data={market.candles} height={380} chartType={chartType} />
              </div>
            </div>
            <div className="flex-[2] min-h-0">
              <PortfolioPanel positions={positions} orders={orders} />
            </div>
         </div>

         {/* Right Column: Execution, Depth, Logs */}
         <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-1">
            <div className="shrink-0 h-[480px]">
              <TradingPanel currentPrice={market.price} funds={funds} onPlaceOrder={handlePlaceOrder} />
            </div>

            <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-5 shrink-0 transition-colors duration-300">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} className="text-samp-primary" /> Exchange Depth</h3>
              <div className="space-y-1 font-mono text-[10px]">
                {market.asks.slice(0, 5).reverse().map((a, i) => (
                  <div key={i} className="flex justify-between py-1 px-2 relative group hover:bg-samp-danger/5"><span className="text-samp-danger z-10">{a.price.toFixed(2)}</span><span className="text-slate-400 z-10">{a.amount}</span><div className="absolute top-0 right-0 h-full bg-samp-danger/5 transition-all" style={{width: `${(a.total/5000)*100}%`}}></div></div>
                ))}
                <div className="py-2 text-center text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-white/5 my-2 border-y border-slate-200 dark:border-white/5">{market.price.toFixed(2)}</div>
                {market.bids.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex justify-between py-1 px-2 relative group hover:bg-samp-success/5"><span className="text-samp-success z-10">{b.price.toFixed(2)}</span><span className="text-slate-400 z-10">{b.amount}</span><div className="absolute top-0 right-0 h-full bg-samp-success/5 transition-all" style={{width: `${(b.total/5000)*100}%`}}></div></div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-[24px] p-5 flex flex-col h-[240px] shrink-0 font-mono shadow-inner transition-colors duration-300">
              <h3 className="text-[10px] font-bold text-slate-600 mb-3 uppercase tracking-widest">Operation Log</h3>
              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="text-[10px] leading-relaxed text-slate-600 dark:text-gray-500 border-l border-slate-300 dark:border-white/5 pl-2">{log}</div>
                ))}
              </div>
            </div>
         </div>
      </div>

      {isSearchOpen && (
        <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Universal Search</h3>
              <button onClick={() => setIsSearchOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input autoFocus type="text" placeholder="Search instruments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary font-mono transition-colors" />
              <div className="mt-4 flex flex-wrap gap-2">
                {['NIFTY 50', 'BANK NIFTY', 'RELIANCE', 'TATASTEEL', 'HDFCBANK'].map(s => (
                  <button key={s} type="button" onClick={() => { setSearchQuery(s); handleSearch({preventDefault: () => {}} as any); }} className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:text-slate-900 hover:border-samp-primary transition-all">{s}</button>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDashboard;
