import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IndianRupee, Search, Activity, Play, Square, Globe, Clock, X, Trash2, LayoutGrid, Layers, Wallet, ShieldAlert, RefreshCcw, Settings, Maximize, Minimize } from 'lucide-react';
import { MarketState, UserFunds, Position, Order, TradingStrategy, BrokerConfig, UserRole, ChartType, FeedStatus } from '../types';
import { io } from 'socket.io-client';
import LightweightMarketChart from './LightweightMarketChart';
import TradingPanel from './TradingPanel';
import PortfolioPanel from './PortfolioPanel';
import { useAuth } from '../context/AuthContext';

interface MarketDashboardProps {
  strategies: TradingStrategy[];
  brokerConfig: BrokerConfig;
  userRole: UserRole;
  token?: string | null;
  onRemoveStrategy?: (id: string) => void;
}

interface OptionChainRow {
  strike: number;
  ceLtp: number | null;
  peLtp: number | null;
  ceOi: number | null;
  peOi: number | null;
  ceSymbol?: string | null;
  peSymbol?: string | null;
}

const MarketDashboard: React.FC<MarketDashboardProps> = ({ strategies, brokerConfig, token, userRole, onRemoveStrategy }) => {
  const { user } = useAuth();
  const [market, setMarket] = useState<MarketState>({
    symbol: 'NSE:BANKNIFTY',
    price: 0,
    candles: [],
    bids: [],
    asks: [],
    trend: 'neutral',
    feedSource: 'DISCONNECTED'
  });
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    source: 'DISCONNECTED',
    message: 'Feed initializing...'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [isAutomationOn, setIsAutomationOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | 'D'>('1m');

  const kiteIntervalMap: Record<string, string> = {
    '1m':  'minute',
    '5m':  '5minute',
    '15m': '15minute',
    '1h':  '60minute',
    'D':   'day',
  };

  const lookbackHours: Record<string, number> = {
    '1m':  4,
    '5m':  8,
    '15m': 20,
    '1h':  72,
    'D':   365,
  };
  const [chartType, setChartType] = useState<ChartType>('HEIKIN_ASHI');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showDMI, setShowDMI] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [funds, setFunds] = useState<UserFunds>({
    walletBalance: 0,
    availableMargin: 0,
    usedMargin: 0,
    collateral: 0,
    dayPnl: 0
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [optionChain, setOptionChain] = useState<OptionChainRow[]>([]);
  const [optionExpiry, setOptionExpiry] = useState<string>('');

  const automationRef = useRef(isAutomationOn);
  const strategyRef = useRef(activeStrategyId);
  const timeframeRef = useRef(timeframe);

  useEffect(() => { automationRef.current = isAutomationOn; }, [isAutomationOn]);
  useEffect(() => { strategyRef.current = activeStrategyId; }, [activeStrategyId]);
  useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  };

  const authHeaders = useMemo(() => (
    token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : undefined
  ), [token]);

  const isMarketClosedIST = useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    const hh = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const mm = Number(parts.find(p => p.type === 'minute')?.value || 0);
    return (hh < 9) || (hh === 9 && mm < 15) || (hh > 15) || (hh === 15 && mm >= 30);
  }, []);

  const fetchWallet = async () => {
    if (!authHeaders) return;
    try {
      const res = await fetch('/api/market-data/wallet', { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setFunds(data.wallet);
    } catch {}
  };

  const fetchOrdersAndPositions = async () => {
    if (!authHeaders) return;
    try {
      const [ordersRes, posRes, logsRes] = await Promise.all([
        fetch('/api/algo/orders', { headers: authHeaders }),
        fetch('/api/algo/positions', { headers: authHeaders }),
        fetch('/api/algo/logs?limit=50', { headers: authHeaders })
      ]);
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData.positions || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const dbLogs = logsData.logs.map((l: any) => l.message);
        setLogs(dbLogs);
      }
    } catch {}
  };

  const fetchOptionChain = async () => {
    if (!authHeaders || market.price <= 0) return;
    try {
      const url = `/api/market-data/kite/option-chain?spot=${market.price.toFixed(2)}&strikesAround=5${optionExpiry ? `&expiry=${encodeURIComponent(optionExpiry)}` : ''}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setOptionChain(Array.isArray(data.rows) ? data.rows : []);
        if (data.expiry) setOptionExpiry(data.expiry);
      }
    } catch {}
  };

  const preloadRecentCandles = async (tf: string = timeframe) => {
    if (!authHeaders) return;
    try {
      const interval = kiteIntervalMap[tf] || 'minute';
      const hours = lookbackHours[tf] || 8;
      const to = new Date();
      const from = new Date(Date.now() - hours * 60 * 60 * 1000);
      const url = `/api/market-data/kite/historical?instrumentToken=260105&interval=${interval}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      
      if (res.ok && Array.isArray(data.candles)) {
        const candles = data.candles.map((c: any, idx: number) => ({
          time: Date.parse(c.time) || Date.now() + idx * 60000,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: Number(c.volume || 0)
        }));

        setMarket(prev => ({
          ...prev,
          candles: candles.slice(-600),
          price: prev.price > 0 ? prev.price : (candles.length > 0 ? candles[candles.length - 1].close : 0)
        }));
      }
    } catch {}
  };

  const fetchAutomationState = async () => {
    if (!authHeaders) return;
    try {
      const res = await fetch('/api/algo/status', { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.enabled !== undefined) {
        setIsAutomationOn(data.enabled);
        if (data.activeStrategyId) setActiveStrategyId(data.activeStrategyId);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      const u = user as any;
      setIsAutomationOn(u.automationEnabled || false);
      if (u.activeStrategyId) setActiveStrategyId(u.activeStrategyId);
      fetchAutomationState(); // Verify with direct API call
    }
  }, [user, authHeaders]);

  useEffect(() => {
    if (!authHeaders) return;
    preloadRecentCandles(timeframe);
  }, [authHeaders, timeframe]);

  useEffect(() => {
    if (!authHeaders) return;
    fetchWallet();
    fetchOrdersAndPositions();
    const interval = setInterval(() => {
      fetchWallet();
      fetchOrdersAndPositions();
    }, 30000);
    return () => clearInterval(interval);
  }, [authHeaders]);

  useEffect(() => {
    const socket = io({ path: '/api/socket.io' });

    if (user?.id) {
      socket.emit('join_user_room', user.id);
    }

    socket.on('market_tick', (data: MarketState) => {
      setMarket(prev => {
        const tf = timeframeRef.current;
        const isOneMinute = tf === '1m';
        const livePrice = data.price || 0;
        let merged = [...(prev.candles || [])];

        if (isOneMinute) {
          const newCandles = (data.candles || []).map((c: any) => ({
            ...c,
            time: typeof c.time === 'string' ? Date.parse(c.time) : Number(c.time)
          }));
          if (newCandles.length > 0) {
            const candleMap = new Map(merged.map(c => [Number(c.time), c]));
            newCandles.forEach((c: any) => candleMap.set(Number(c.time), c));
            merged = Array.from(candleMap.values())
              .sort((a, b) => Number(a.time) - Number(b.time))
              .slice(-600);
          }
        } else if (livePrice > 0 && merged.length > 0) {
          const intervalMs: Record<string, number> = { '5m': 300000, '15m': 900000, '1h': 3600000, 'D': 86400000 };
          const ivMs = intervalMs[tf] ?? 300000;
          const IST_MS = 19800000;
          const slotUtcMs = Math.floor((Date.now() + IST_MS) / ivMs) * ivMs - IST_MS;
          const lastCandle = merged[merged.length - 1];
          if (Number(lastCandle.time) === slotUtcMs) {
            merged[merged.length - 1] = {
              ...lastCandle,
              close: livePrice,
              high: Math.max(Number(lastCandle.high), livePrice),
              low: Math.min(Number(lastCandle.low), livePrice),
            };
          } else if (slotUtcMs > Number(lastCandle.time)) {
            merged.push({ time: slotUtcMs, open: livePrice, high: livePrice, low: livePrice, close: livePrice, volume: 0 });
            if (merged.length > 600) merged.shift();
          }
        }

        return {
          ...prev,
          price: data.price || prev.price,
          trend: data.trend || prev.trend,
          feedSource: data.feedSource || prev.feedSource,
          bids: data.bids || prev.bids,
          asks: data.asks || prev.asks,
          candles: merged,
        };
      });
    });

    socket.on('strategy_log', (msg: string) => {
      setLogs(prev => [msg, ...prev].slice(0, 50));
    });

    socket.on('automation_change', ({ enabled }) => {
      setIsAutomationOn(enabled);
    });

    socket.on('feed_status', (payload: FeedStatus) => {
      setMarket(prev => ({ ...prev, feedSource: payload.source }));
      setFeedStatus(payload);
    });

    return () => { socket.disconnect(); };
  }, [user?.id]);

  const toggleAutomation = async () => {
    if (!activeStrategyId) {
      addLog("[SYSTEM] Please select a strategy before starting automation.");
      return;
    }
    if (!authHeaders) return;
    try {
      const nextState = !isAutomationOn;
      const res = await fetch('/api/algo/toggle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ enabled: nextState, strategyId: activeStrategyId })
      });
      if (res.ok) {
        setIsAutomationOn(nextState);
        addLog(`[AUTO] Server Request: ${nextState ? 'ENABLE' : 'DISABLE'}`);
      }
    } catch {}
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMarket(prev => ({ ...prev, symbol: searchQuery.toUpperCase() }));
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handlePlaceOptionOrder = async (
    side: 'BUY' | 'SELL',
    quantity: number,
    type: 'MARKET' | 'LIMIT',
    product: 'MIS' | 'CNC',
    optionType: 'CE' | 'PE',
    strike: number,
    price?: number
  ) => {
    if (!authHeaders) return;
    try {
      setIsPlacingOrder(true);
      const res = await fetch('/api/algo/order-option', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          side, 
          quantity, 
          type, 
          product, 
          optionType, 
          strike, 
          price,
          isPaper: user?.isPaperTrading ?? true 
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`[ORDER] ${side} ${strike} ${optionType} x${quantity} SUCCESS`);
        fetchOrdersAndPositions();
      } else {
        addLog(`[ORDER] FAILED: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`[ORDER] FAILED: Connection error`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div ref={containerRef} className={`min-h-full flex flex-col p-6 gap-6 pb-20 pr-2 ${isFullscreen ? 'bg-[#0B0C15] fixed inset-0 z-[1000] p-10 overflow-auto' : ''}`}>
      <div className="flex items-center justify-between bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-xl shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-8">
          <div className="flex flex-col min-w-[220px]">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${market.feedSource === 'BROKER_WS' ? 'bg-samp-success animate-pulse' : 'bg-samp-danger'}`}></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Real-time Feed</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <IndianRupee className="text-samp-primary" size={24} />{market.symbol}
              <button onClick={() => setIsSearchOpen(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"><Search size={18} /></button>
            </h2>
          </div>
          <div className="flex flex-col">
            <span className={`text-3xl font-mono font-bold tracking-tighter ${market.trend === 'bullish' ? 'text-samp-success' : 'text-samp-danger'}`}>{market.price > 0 ? market.price.toFixed(2) : '--'}</span>
            <span className="text-xs font-mono font-medium text-slate-500">{feedStatus.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl shadow-inner transition-colors duration-300">
          <div className="flex flex-col pr-4 border-r border-slate-300 dark:border-white/10">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Personal Workspace Algos</span>
            <div className="flex items-center gap-2">
              <select value={activeStrategyId || ''} onChange={e => setActiveStrategyId(e.target.value)} disabled={isAutomationOn} className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                <option value="" className="bg-white dark:bg-[#151725]">-- SELECT ALGO --</option>
                {strategies.map(s => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#151725]">{s.name} ({s.qty} Units)</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end"><span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Automation</span><span className={`text-[10px] font-mono font-bold ${isAutomationOn ? 'text-samp-success' : 'text-slate-400'}`}>{isAutomationOn ? 'ACTIVE' : 'IDLE'}</span></div>
            <button onClick={toggleAutomation} className={`p-3 rounded-xl transition-all active:scale-95 shadow-lg ${isAutomationOn ? 'bg-samp-danger/20 text-samp-danger border border-samp-danger/40 hover:bg-samp-danger/30' : 'bg-samp-success/20 text-samp-success border border-samp-success/40 hover:bg-samp-success/30'}`}>{isAutomationOn ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
          </div>
        </div>

        <div className="flex gap-10 items-end px-4">
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Wallet Snapshot</p><p className="text-lg text-slate-900 dark:text-white font-mono font-bold">₹{(funds?.walletBalance ?? 0).toLocaleString('en-IN')}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Day P&L</p><p className={`text-lg font-mono font-bold ${(funds?.dayPnl ?? 0) >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>₹{(funds?.dayPnl ?? 0).toLocaleString('en-IN')}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {['1m', '5m', '15m', '1h', 'D'].map(tf => (<button key={tf} onClick={() => setTimeframe(tf as any)} className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${tf === timeframe ? 'bg-samp-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{tf}</button>))}
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center" />
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                  <button onClick={() => setChartType('CANDLE')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'CANDLE' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={12} /> Standard</button>
                  <button onClick={() => setChartType('HEIKIN_ASHI')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'HEIKIN_ASHI' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}><Layers size={12} /> Heikin Ashi</button>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center" />
                <button onClick={() => setShowSMA(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showSMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>SMA 20</button>
                <button onClick={() => setShowEMA(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showEMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>EMA 9</button>
                <button onClick={() => setShowBollinger(p => !p)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showBollinger ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Bollinger</button>
                <button onClick={() => setShowDMI(p => !p)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showDMI ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>DMI (14)</button>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center" />
                <button onClick={toggleFullScreen} className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all text-slate-500 hover:text-samp-primary hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-1.5">{isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />} {isFullscreen ? 'Normal' : 'Full Screen'}</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Globe size={12} className="text-samp-accent" />FEED: {market.feedSource}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Clock size={12} className="text-samp-accent" />SESSION: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            <LightweightMarketChart data={market.candles} height={isFullscreen ? 550 : 350} showSMA={showSMA} showEMA={showEMA} showBollinger={showBollinger} showDMI={showDMI} timeframe={timeframe} chartType={chartType} />
          </div>
          <PortfolioPanel 
            positions={positions} 
            orders={orders} 
            optionChain={optionChain} 
            onPlaceOptionOrder={handlePlaceOptionOrder} 
          />
        </div>

        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-[24px] p-5 flex flex-col h-[250px] font-mono overflow-hidden">
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Audit Log (Live)</h3>
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
              {logs.map((log, i) => (<div key={i} className="text-[10px] leading-relaxed text-slate-600 dark:text-gray-500 border-l border-white/5 pl-2">{log}</div>))}
            </div>
          </div>
          <TradingPanel funds={funds} optionChain={optionChain} isPaperTrading={user?.isPaperTrading ?? true} onPlaceOptionOrder={handlePlaceOptionOrder} />
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
          <div className="bg-samp-surface border border-white/10 rounded-[32px] p-8 w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-6">Change Symbol</h3>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input autoFocus type="text" placeholder="e.g. BANKNIFTY" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-samp-primary" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDashboard;
