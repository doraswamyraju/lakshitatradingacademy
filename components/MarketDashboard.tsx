import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IndianRupee, Search, Activity, Play, Square, Globe, Clock, X, Trash2, LayoutGrid, Layers, Wallet, ShieldAlert, RefreshCcw, Settings } from 'lucide-react';
import { MarketState, UserFunds, Position, Order, TradingStrategy, BrokerConfig, UserRole, ChartType, FeedStatus } from '../types';
import { io } from 'socket.io-client';
import LightweightMarketChart from './LightweightMarketChart';
import TradingPanel from './TradingPanel';
import PortfolioPanel from './PortfolioPanel';
import { useAuth } from '../context/AuthContext';
import { ExecutionEngine, OpenPosition } from '../services/executionEngine';

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

  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [isAutomationOn, setIsAutomationOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | 'D'>('1m');

  // Maps UI timeframe labels → Kite API interval strings
  const kiteIntervalMap: Record<string, string> = {
    '1m':  'minute',
    '5m':  '5minute',
    '15m': '15minute',
    '1h':  '60minute',
    'D':   'day',
  };

  // How many hours of history to load per timeframe.
  // Keep this to roughly one trading session to avoid cross-session artifacts (e.g. "00:15" midnight labels).
  // The socket handles live 1m updates; historical fetch just pre-populates the chart.
  const lookbackHours: Record<string, number> = {
    '1m':  4,    // ~240 1m candles (4 hours)
    '5m':  8,    // ~96 5m candles (covers today's full session)
    '15m': 20,   // ~80 15m candles (today + a bit of yesterday)
    '1h':  72,   // ~72 1h candles (3 trading days)
    'D':   365,  // daily candles for ~1 year
  };
  const [chartType, setChartType] = useState<ChartType>('HEIKIN_ASHI');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showDMI, setShowDMI] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Engine initialized.']);
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
  // timeframeRef prevents stale closures in the socket handler
  // (the socket listener is registered once; a ref always has the latest value)
  const timeframeRef = useRef(timeframe);
  // Persistent execution engine instance — survives re-renders
  const engineRef = useRef(new ExecutionEngine());
  useEffect(() => { automationRef.current = isAutomationOn; }, [isAutomationOn]);
  useEffect(() => { strategyRef.current = activeStrategyId; }, [activeStrategyId]);
  useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

  // Track open position for the UI display
  const [openPosition, setOpenPosition] = useState<OpenPosition | null>(null);

  const addLog = (msg: string) => {
    const prefix = user?.isPaperTrading ? '[SIMULATED] ' : '';
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${prefix}${msg}`, ...prev].slice(0, 25));
  };

  // Reset the engine when automation is turned OFF so stale position state is cleared
  useEffect(() => {
    if (!isAutomationOn) {
      engineRef.current.reset();
      setOpenPosition(null);
      addLog('[AUTO] Automation disabled. Engine reset.');
    } else {
      addLog('[AUTO] Automation ENABLED. Engine ready.');
    }
  }, [isAutomationOn]);

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
    const res = await fetch('/api/market-data/wallet', { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Wallet fetch failed.');
    setFunds(data.wallet);
  };

  const fetchTokenStatus = async () => {
    if (!authHeaders) return;
    const res = await fetch('/api/market-data/kite/token-status', { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Token status fetch failed.');
    if (data.shouldReconnect) addLog('[TOKEN] Kite session stale. Reconnect advised.');
  };

  const fetchOrdersAndPositions = async () => {
    if (!authHeaders) return;
    const [ordersRes, posRes] = await Promise.all([
      fetch('/api/algo/orders', { headers: authHeaders }),
      fetch('/api/algo/positions', { headers: authHeaders })
    ]);
    const ordersData = await ordersRes.json();
    const posData = await posRes.json();
    if (ordersRes.ok && Array.isArray(ordersData.orders)) setOrders(ordersData.orders);
    if (posRes.ok && Array.isArray(posData.positions)) setPositions(posData.positions);
  };

  const fetchOptionChain = async () => {
    if (!authHeaders || market.price <= 0) return;
    const url = `/api/market-data/kite/option-chain?spot=${market.price.toFixed(2)}&strikesAround=5${optionExpiry ? `&expiry=${encodeURIComponent(optionExpiry)}` : ''}`;
    const res = await fetch(url, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Option chain fetch failed.');
    setOptionChain(Array.isArray(data.rows) ? data.rows : []);
    if (data.expiry) setOptionExpiry(data.expiry);
  };

  const preloadRecentCandles = async (tf: string = timeframe) => {
    if (!authHeaders) return;
    const interval = kiteIntervalMap[tf] || 'minute';
    const hours = lookbackHours[tf] || 8;
    const to = new Date();
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);
    const url = `/api/market-data/kite/historical?instrumentToken=260105&interval=${interval}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
    const res = await fetch(url, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to preload candles.');

    const candles = Array.isArray(data.candles)
      ? data.candles.map((c: any, idx: number) => ({
          time: Date.parse(c.time) || Date.now() + idx * 60000,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: Number(c.volume || 0)
        }))
      : [];

    if (candles.length > 0) {
      setMarket(prev => ({
        ...prev,
        candles: candles.slice(-600),
        price: prev.price > 0 ? prev.price : candles[candles.length - 1].close
      }));
      addLog(`[SYSTEM] Loaded ${candles.length} candles (${tf}).`);
    } else {
      // Clear stale candles when switching timeframe with no data
      setMarket(prev => ({ ...prev, candles: [] }));
      addLog(`[SYSTEM] No candles returned for ${tf}. Check broker auth.`);
    }
  };

  // Reload candles on first auth
  useEffect(() => {
    if (!authHeaders) return;
    preloadRecentCandles(timeframe).catch((error: any) => addLog(`[SYNC] ${error.message}`));
  }, [authHeaders]);

  // Reload candles whenever timeframe changes
  useEffect(() => {
    if (!authHeaders) return;
    setMarket(prev => ({ ...prev, candles: [] })); // clear while loading
    preloadRecentCandles(timeframe).catch((error: any) => addLog(`[SYNC] ${error.message}`));
  }, [timeframe]);

  useEffect(() => {
    if (!authHeaders) return;
    const run = async () => {
      try {
        await Promise.all([fetchWallet(), fetchTokenStatus(), fetchOrdersAndPositions()]);
      } catch (error: any) {
        addLog(`[SYNC] ${error.message}`);
      }
    };
    run();
    const interval = setInterval(run, 30000);
    return () => clearInterval(interval);
  }, [authHeaders]);

  useEffect(() => {
    if (!authHeaders || market.price <= 0) return;
    fetchOptionChain().catch((error: any) => addLog(`[CHAIN] ${error.message}`));
    const interval = setInterval(() => {
      fetchOptionChain().catch((error: any) => addLog(`[CHAIN] ${error.message}`));
    }, 20000);
    return () => clearInterval(interval);
  }, [authHeaders, market.price, optionExpiry]);

  useEffect(() => {
    const socket = io({ path: '/api/socket.io' });

    socket.on('market_tick', (data: MarketState) => {
      setMarket(prev => {
        const tf = timeframeRef.current;
        const isOneMinute = tf === '1m';
        const livePrice = data.price || 0;

        let merged = [...(prev.candles || [])];

        if (isOneMinute) {
          // ── 1m: merge socket 1-min candles into history ───────────────────
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
          // ── 5m / 15m / 1h / D: update last candle with live price ─────────
          // Historical candles don't change; only the CURRENT (last) candle
          // gets its close/high/low updated on every tick.
          // When the interval rolls over, a new candle slot is appended.
          const intervalMs: Record<string, number> = {
            '5m':  5  * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h':  60 * 60 * 1000,
            'D':   24 * 60 * 60 * 1000,
          };
          const ivMs = intervalMs[tf] ?? 5 * 60 * 1000;

          // NSE candles are aligned to IST. Calculate current slot in IST then
          // convert back to UTC epoch-ms so it matches our stored candle times.
          const IST_MS = 5.5 * 60 * 60 * 1000;
          const nowUtcMs  = Date.now();
          const nowIstMs  = nowUtcMs + IST_MS;
          const slotIstMs = Math.floor(nowIstMs / ivMs) * ivMs;
          const slotUtcMs = slotIstMs - IST_MS; // current candle's open time in UTC epoch-ms

          const lastCandle    = merged[merged.length - 1];
          const lastCandleMs  = Number(lastCandle.time);

          if (lastCandleMs === slotUtcMs || Math.abs(lastCandleMs - slotUtcMs) < ivMs) {
            // Same candle period — update close/high/low
            merged = [
              ...merged.slice(0, -1),
              {
                ...lastCandle,
                close: livePrice,
                high:  Math.max(Number(lastCandle.high),  livePrice),
                low:   Math.min(Number(lastCandle.low),   livePrice),
              }
            ];
          } else if (slotUtcMs > lastCandleMs) {
            // New candle period started — append fresh candle
            merged = [
              ...merged,
              {
                time:   slotUtcMs,
                open:   livePrice,
                high:   livePrice,
                low:    livePrice,
                close:  livePrice,
                volume: 0,
              }
            ].slice(-600);
          }
        }

        return {
          ...prev,
          price:      data.price      || prev.price,
          trend:      data.trend      || prev.trend,
          feedSource: data.feedSource || prev.feedSource,
          bids:       data.bids       || prev.bids,
          asks:       data.asks       || prev.asks,
          candles:    merged,
        };
      });


      // ── Auto-execution engine ─────────────────────────────────────────────
      if (automationRef.current && strategyRef.current) {
        const strategy = strategies.find(s => s.id === strategyRef.current);
        if (strategy && strategy.isActive && data.price > 0) {
          // We use a local snapshot of candles from the state update above.
          // The engine is async but we don't await to avoid blocking the UI.
          engineRef.current.evaluate({
            candles:    data.candles || [],
            livePrice:  data.price,
            strategy,
            authHeaders,
            addLog,
            isPaper:    user?.isPaperTrading ?? true,
            onPositionChange: (pos) => setOpenPosition(pos ? { ...pos } : null),
          }).catch((err: any) => addLog(`[AUTO] Engine error: ${err.message}`));
        }
      }
    });

    socket.on('feed_status', (payload: FeedStatus) => {
      setMarket(prev => ({ ...prev, feedSource: payload.source }));
      setFeedStatus(payload);
      addLog(`[FEED] ${payload.message}`);
      if (payload.source === 'BROKER_WS') {
        setLogs(prev => prev.filter(line => !line.includes('Waiting for live market data')));
      }
    });

    socket.on('connect', () => addLog('[SOCKET] Connected'));
    socket.on('disconnect', () => addLog('[SOCKET] Disconnected'));

    return () => { socket.disconnect(); };
  }, [strategies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const formattedSymbol = searchQuery.toUpperCase().startsWith('NSE:') ? searchQuery.toUpperCase() : `NSE:${searchQuery.toUpperCase()}`;
    setMarket(prev => ({ ...prev, symbol: formattedSymbol }));
    addLog(`[CONTEXT] Symbol set to ${formattedSymbol}`);
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
    priceOverride?: number
  ) => {
    if (!authHeaders) return;
    const selected = optionChain.find((row) => row.strike === strike);
    const optionSymbol = optionType === 'CE' ? selected?.ceSymbol : selected?.peSymbol;
    const ltp = optionType === 'CE' ? (selected?.ceLtp ?? 0) : (selected?.peLtp ?? 0);
    if (!optionSymbol) {
      addLog(`[ORDER] ${optionType} symbol not available for strike ${strike}.`);
      return;
    }
    const executionPrice = priceOverride || ltp;
    if (executionPrice <= 0) {
      addLog('[ORDER] Option LTP unavailable.');
      return;
    }
    const marginRequired = (type === 'MARKET' ? executionPrice : (priceOverride || executionPrice)) * quantity / (product === 'MIS' ? 5 : 1);
    if (side === 'BUY' && funds.availableMargin < marginRequired) {
      addLog(`[ORDER] Insufficient margin for ₹${marginRequired.toFixed(2)}.`);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/algo/order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tradingsymbol: optionSymbol,
          exchange: 'NFO',
          transactionType: side,
          quantity,
          product,
          orderType: type,
          price: type === 'LIMIT' ? priceOverride : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Order placement failed.');
      addLog(`[ORDER] ${optionSymbol} submitted: ${data.orderId}`);
      await Promise.all([fetchOrdersAndPositions(), fetchWallet()]);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const toggleAutomation = () => {
    if (!activeStrategyId) { addLog('Select a strategy first.'); return; }
    if (!brokerConfig.isConnected) { addLog('Connect order API first.'); return; }
    setIsAutomationOn(prev => !prev);
    addLog(`AUTO: ${!isAutomationOn ? 'ACTIVE' : 'IDLE'}`);
  };

  return (
    <div className="min-h-full flex flex-col p-6 gap-6 pb-20 pr-2">
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
            <span className="text-xs font-mono font-medium text-slate-500">
              {feedStatus.message}{isMarketClosedIST ? ' • Market Closed (static chart)' : ''}
            </span>
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
              {activeStrategyId && !isAutomationOn && onRemoveStrategy && (
                <button onClick={() => { onRemoveStrategy(activeStrategyId); setActiveStrategyId(null); }} className="p-1 text-slate-400 hover:text-samp-danger transition-colors"><Trash2 size={14} /></button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end"><span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Automation</span><span className={`text-[10px] font-mono font-bold ${isAutomationOn ? 'text-samp-success' : 'text-slate-400'}`}>{isAutomationOn ? 'ACTIVE' : 'IDLE'}</span></div>
            <button onClick={toggleAutomation} className={`p-3 rounded-xl transition-all active:scale-95 shadow-lg ${isAutomationOn ? 'bg-samp-danger/20 text-samp-danger border border-samp-danger/40 hover:bg-samp-danger/30' : 'bg-samp-success/20 text-samp-success border border-samp-success/40 hover:bg-samp-success/30'}`}>{isAutomationOn ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
          </div>
        </div>

        <div className="flex gap-10 items-end px-4">
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Wallet Balance</p><p className="text-lg text-slate-900 dark:text-white font-mono font-bold">₹{(funds?.walletBalance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Available Margin</p><p className="text-lg text-samp-success font-mono font-bold">₹{(funds?.availableMargin ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Used Margin</p><p className="text-lg text-slate-900 dark:text-white font-mono font-bold">₹{(funds?.usedMargin ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Day P&L</p><p className={`text-lg font-mono font-bold ${(funds?.dayPnl ?? 0) >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>{(funds?.dayPnl ?? 0) >= 0 ? '+' : ''}₹{(funds?.dayPnl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 shrink-0">
        <FeedBadge icon={<Globe size={14} />} label="Broker" value={feedStatus.broker || 'Kite'} />
        <FeedBadge icon={<Clock size={14} />} label="Last Tick" value={feedStatus.lastTickAt ? new Date(feedStatus.lastTickAt).toLocaleTimeString() : '--'} />
        <FeedBadge icon={<Activity size={14} />} label="Latency" value={typeof feedStatus.latencyMs === 'number' ? `${feedStatus.latencyMs} ms` : '--'} />
        <FeedBadge icon={<RefreshCcw size={14} />} label="Reconnects" value={String(feedStatus.reconnectCount ?? 0)} />
        <FeedBadge icon={<ShieldAlert size={14} />} label="Token Age" value={feedStatus.tokenAgeMinutes !== undefined && feedStatus.tokenAgeMinutes !== null ? `${feedStatus.tokenAgeMinutes} min` : '--'} />
      </div>

      <div className="grid grid-cols-12 gap-6 min-h-0">
        <div className="col-span-8 flex flex-col gap-6 min-h-0 pr-1">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 flex flex-col relative transition-colors duration-300 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {['1m', '5m', '15m', '1h', 'D'].map(tf => (<button key={tf} onClick={() => setTimeframe(tf as any)} className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${tf === timeframe ? 'bg-samp-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{tf}</button>))}
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center"></div>
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                  <button onClick={() => setChartType('CANDLE')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'CANDLE' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={12} /> Standard</button>
                  <button onClick={() => setChartType('HEIKIN_ASHI')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${chartType === 'HEIKIN_ASHI' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}><Layers size={12} /> Heikin Ashi</button>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-2 self-center"></div>
                <button onClick={() => setShowSMA(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showSMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>SMA 20</button>
                <button onClick={() => setShowEMA(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showEMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>EMA 9</button>
                <button onClick={() => setShowBollinger(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showBollinger ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Bollinger</button>
                <button onClick={() => setShowDMI(prev => !prev)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showDMI ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>DMI (14)</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Globe size={12} className="text-samp-accent" />FEED: {market.feedSource}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"><Clock size={12} className="text-samp-accent" />SESSION: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="relative">
              <LightweightMarketChart 
                data={market.candles} 
                height={330} 
                chartType={chartType} 
                showSMA={showSMA} 
                showEMA={showEMA} 
                showBollinger={showBollinger}
                showDMI={showDMI}
                timeframe={timeframe} 
              />
              {(!market.candles || market.candles.length === 0) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-xl">
                  <div className="text-center p-6 bg-slate-800/90 rounded-2xl shadow-xl">
                    <p className="text-white font-bold text-sm">No live market data</p>
                    <p className="text-gray-300 text-xs mt-1">{feedStatus.message}</p>
                    <div className="mt-4 flex flex-col gap-2 items-center">
                      <p className="text-samp-primary text-[10px] uppercase tracking-widest font-black">Authentication Required</p>
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => window.location.hash = '#settings'} 
                          className="px-6 py-2 bg-samp-primary hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Settings size={12} /> CONFIGURE SYSTEM BROKER
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 min-h-[280px]"><PortfolioPanel positions={positions} orders={orders} /></div>
        </div>

        <div className="col-span-4 flex flex-col gap-6 min-h-0 pr-1">
          {/* ── Audit Log ── always first so signals are visible immediately */}
          <div className="bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/5 rounded-[24px] p-5 flex flex-col h-[200px] shrink-0 font-mono shadow-inner transition-colors duration-300">
            <h3 className="text-[10px] font-bold text-slate-600 dark:text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="text-samp-primary" /> Audit Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
              {logs.map((log, i) => (<div key={i} className="text-[10px] leading-relaxed text-slate-600 dark:text-gray-500 border-l border-slate-300 dark:border-white/5 pl-2">{log}</div>))}
            </div>
          </div>
          {/* ── Execute Option ── */}
          <div className="shrink-0">
            <TradingPanel funds={funds} optionChain={optionChain} isPaperTrading={user?.isPaperTrading ?? false} onPlaceOptionOrder={handlePlaceOptionOrder} />
          </div>
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-5 shrink-0 transition-colors duration-300">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} className="text-samp-primary" /> Option Chain ({optionExpiry || '--'})</h3>
            <div className="max-h-[190px] overflow-auto text-xs font-mono">
              <table className="w-full">
                <thead className="text-slate-500 sticky top-0 bg-white dark:bg-samp-surface">
                  <tr>
                    <th className="text-left py-1">CE LTP</th>
                    <th className="text-center py-1">Strike</th>
                    <th className="text-right py-1">PE LTP</th>
                  </tr>
                </thead>
                <tbody>
                  {optionChain.map((row) => (
                    <tr key={row.strike} className="border-t border-slate-200 dark:border-white/5">
                      <td className="py-1 text-samp-success">{row.ceLtp?.toFixed(2) ?? '--'}</td>
                      <td className="py-1 text-center font-bold text-slate-900 dark:text-white">{row.strike}</td>
                      <td className="py-1 text-right text-samp-danger">{row.peLtp?.toFixed(2) ?? '--'}</td>
                    </tr>
                  ))}
                  {optionChain.length === 0 && (
                    <tr><td colSpan={3} className="py-3 text-center text-slate-400">No option-chain data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-4 shrink-0 transition-colors duration-300">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Wallet size={14} className="text-samp-primary" /> Wallet Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-slate-200 dark:border-white/5 p-3 bg-slate-50 dark:bg-black/20">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Wallet</div>
                <div className="font-bold text-slate-900 dark:text-white">₹{(funds?.walletBalance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/5 p-3 bg-slate-50 dark:bg-black/20">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Collateral</div>
                <div className="font-bold text-slate-900 dark:text-white">₹{(funds?.collateral ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Universal Search</h3>
              <button onClick={() => setIsSearchOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input autoFocus type="text" placeholder="Search instruments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary font-mono transition-colors" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedBadge: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">
      {icon}
      {label}
    </div>
    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">{value}</div>
  </div>
);

export default MarketDashboard;
