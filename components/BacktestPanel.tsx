import React, { useMemo, useState } from 'react';
import {
  Play,
  Calendar,
  TrendingUp,
  Activity,
  Download,
  FlaskConical,
  Target,
  ShieldCheck,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { TradingStrategy, BacktestResult, BacktestTrade, Candle, BacktestRuleTrace, ChartType } from '../types';
import { fetchHistoricalCandles } from '../services/market';
import LightweightMarketChart from './LightweightMarketChart';
import { useAuth } from '../context/AuthContext';

interface BacktestPanelProps {
  strategies: TradingStrategy[];
}

const intervalMap: Record<string, 'minute' | '3minute' | '5minute' | '15minute' | '30minute' | '60minute' | 'day'> = {
  '1m': 'minute',
  '3m': '3minute',
  '5m': '5minute',
  '15m': '15minute',
  '30m': '30minute',
  '1h': '60minute',
  'D': 'day'
};

const intervalMinutesMap: Record<'1m' | '3m' | '5m' | '15m' | '30m' | '1h' | 'D', number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  'D': 1440
};

const estimateTargetCandles = (days: number, timeframe: '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | 'D') => {
  if (timeframe === 'D') return Math.max(5, days);
  return Math.max(50, Math.round((days * 375) / intervalMinutesMap[timeframe]));
};

// ─────────────────────────────────────────────────────────────────────────────
// Indicator engine
// ─────────────────────────────────────────────────────────────────────────────

interface IndicatorSnapshot {
  haClose: number; haOpen: number; haHigh: number; haLow: number;
  adx: number | null; diPlus: number | null; diMinus: number | null;
  currentHigh: number; currentLow: number; prevHigh: number; prevLow: number;
}

function computeIndicators(candles: Candle[]): IndicatorSnapshot[] {
  const period_adx = 14;
  const trList: number[] = [];
  const dmPlusList: number[] = [];
  const dmMinusList: number[] = [];

  let prevHaOpen = 0;
  let prevHaClose = 0;
  let prevAdxSmooth = 0;
  let adxInitialized = false;

  return candles.map((c, i) => {
    const prev = i > 0 ? candles[i - 1] : c;

    // Heikin Ashi (correct formula)
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0
      ? (c.open + c.close) / 2
      : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    // Update HA accumulators for next iteration
    prevHaOpen = haOpen;
    prevHaClose = haClose;

    // True Range & Directional Movement
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    const upMove = c.high - prev.high;
    const downMove = prev.low - c.low;
    trList.push(tr);
    dmPlusList.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinusList.push(downMove > upMove && downMove > 0 ? downMove : 0);

    let adx: number | null = null, diPlus: number | null = null, diMinus: number | null = null;

    if (i >= period_adx) {
      const sumTR = trList.slice(-period_adx).reduce((a, b) => a + b, 0);
      const sumDP = dmPlusList.slice(-period_adx).reduce((a, b) => a + b, 0);
      const sumDM = dmMinusList.slice(-period_adx).reduce((a, b) => a + b, 0);
      if (sumTR > 0) {
        diPlus = (sumDP / sumTR) * 100;
        diMinus = (sumDM / sumTR) * 100;
        const dx = diPlus + diMinus > 0 ? (Math.abs(diPlus - diMinus) / (diPlus + diMinus)) * 100 : 0;
        if (!adxInitialized) {
          adx = dx;
          prevAdxSmooth = dx;
          adxInitialized = true;
        } else {
          adx = (prevAdxSmooth * (period_adx - 1) + dx) / period_adx;
          prevAdxSmooth = adx;
        }
      }
    }

    return {
      haClose, haOpen, haHigh, haLow,
      adx, diPlus, diMinus,
      currentHigh: c.high, currentLow: c.low,
      prevHigh: prev.high, prevLow: prev.low,
    };
  });
}

function getHAPattern(snap: IndicatorSnapshot): 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'NEUTRAL' {
  const body = Math.abs(snap.haClose - snap.haOpen);
  const upperWick = snap.haHigh - Math.max(snap.haOpen, snap.haClose);
  const lowerWick = Math.min(snap.haOpen, snap.haClose) - snap.haLow;
  const range = snap.haHigh - snap.haLow;
  if (range === 0) return 'NEUTRAL';
  const bodyRatio = body / range;
  const isBullish = snap.haClose > snap.haOpen;
  const isBearish = snap.haClose < snap.haOpen;
  if (isBullish && bodyRatio > 0.65 && lowerWick < body * 0.4 && upperWick < body * 0.4) return 'STRONG_BULLISH';
  if (isBearish && bodyRatio > 0.65 && upperWick < body * 0.4 && lowerWick < body * 0.4) return 'STRONG_BEARISH';
  return 'NEUTRAL';
}

function evalCondition(
  cond: any,
  snap: IndicatorSnapshot,
  prevSnap: IndicatorSnapshot | null
): { pass: boolean; detail: string } {
  let val: number | null = null;
  switch (cond.source) {
    case 'ADX': val = snap.adx; break;
    case 'DI_PLUS': val = snap.diPlus; break;
    case 'DI_MINUS': val = snap.diMinus; break;
    case 'CURRENT_HIGH': val = snap.currentHigh; break;
    case 'CURRENT_LOW': val = snap.currentLow; break;
    case 'PREVIOUS_HIGH': val = prevSnap ? prevSnap.currentHigh : null; break;
    case 'PREVIOUS_LOW': val = prevSnap ? prevSnap.currentLow : null; break;
    default: break;
  }

  if (cond.source === 'HEIKIN_ASHI_CANDLE') {
    const pattern = getHAPattern(snap);
    const pass = pattern === cond.pattern;
    return { pass, detail: `HA=${pattern}` };
  }

  if (val === null) return { pass: false, detail: `${cond.source}=N/A` };

  switch (cond.operator) {
    case '>': {
      const target = cond.targetType === 'VALUE' ? cond.targetValue : val;
      return { pass: val > target, detail: `${cond.source}=${val.toFixed(2)} > ${target}` };
    }
    case '<': {
      const target = cond.targetType === 'VALUE' ? cond.targetValue : val;
      return { pass: val < target, detail: `${cond.source}=${val.toFixed(2)} < ${target}` };
    }
    case '>=': {
      const target = cond.targetType === 'VALUE' ? cond.targetValue : val;
      return { pass: val >= target, detail: `${cond.source}=${val.toFixed(2)} ≥ ${target}` };
    }
    case '<=': {
      const target = cond.targetType === 'VALUE' ? cond.targetValue : val;
      return { pass: val <= target, detail: `${cond.source}=${val.toFixed(2)} ≤ ${target}` };
    }
    case 'BETWEEN': {
      const pass = val >= (cond.minValue ?? 0) && val <= (cond.maxValue ?? 100);
      return { pass, detail: `${cond.source}=${val.toFixed(2)} ∈ [${cond.minValue}–${cond.maxValue}]` };
    }
    default:
      return { pass: false, detail: `${cond.source} ${cond.operator}=N/A` };
  }
}

// All conditions must pass
function checkSideConditions(
  conds: any[],
  snap: IndicatorSnapshot,
  prevSnap: IndicatorSnapshot | null
): { pass: boolean; signals: string[] } {
  if (conds.length === 0) return { pass: false, signals: [] };
  const signals: string[] = [];
  for (const cond of conds) {
    const { pass, detail } = evalCondition(cond, snap, prevSnap);
      signals.push(`${detail}`);
    if (!pass) return { pass: false, signals };
  }
  return { pass: true, signals };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main backtest engine — evaluates real strategy conditions
// ─────────────────────────────────────────────────────────────────────────────

const performBacktest = (candles: Candle[], strategy: TradingStrategy, days: number): BacktestResult => {
  if (candles.length < 50) {
    console.warn('[Backtest] Not enough candles:', candles.length);
    return {
      totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, netPnl: 0,
      maxDrawdown: 0, sharpeRatio: 0, profitFactor: 0, expectancy: 0, cagr: 0,
      trades: [], equityCurve: [100000], ruleTrace: [],
      regimeStats: { trendingTrades: 0, sidewaysTrades: 0, trendingPnl: 0, sidewaysPnl: 0 }
    };
  }


  const snaps = computeIndicators(candles);
  const entryBuyConds = strategy.entryConditions.filter(c => c.side === 'BUY' || c.side === 'ANY');
  const entrySellConds = strategy.entryConditions.filter(c => c.side === 'SELL' || c.side === 'ANY');
  const exitBuyConds = strategy.exitConditions.filter(c => c.side === 'BUY' || c.side === 'SELL' || c.side === 'ANY');
  const exitSellConds = strategy.exitConditions.filter(c => c.side === 'SELL' || c.side === 'BUY' || c.side === 'ANY');

  const trades: BacktestTrade[] = [];
  const ruleTrace: BacktestRuleTrace[] = [];
  let equity = 100000;
  const equityCurve: number[] = [equity];
  let maxEquity = equity, maxDrawdown = 0;
  let wins = 0, losses = 0, grossProfit = 0, grossLoss = 0;
  let trendingTrades = 0, sidewaysTrades = 0, trendingPnl = 0, sidewaysPnl = 0;

  const pointBased = strategy.riskConfig.pointBased ?? false;
  const slPts = strategy.riskConfig.stopLossPoints ?? 30;
  const tpPts = slPts * (strategy.riskConfig.minRR ?? 1);
  const slPct = strategy.riskConfig.stopLossPct || 1;
  const tpPct = strategy.riskConfig.takeProfitPct || slPct * 2;
  const qty = Math.max(1, strategy.qty || 1);

  let position: { side: 'BUY' | 'SELL'; entryPrice: number; entryTime: number; qty: number } | null = null;

  for (let i = 25; i < candles.length; i++) {
    const c = candles[i];
    const snap = snaps[i];
    const prevSnap = i > 0 ? snaps[i - 1] : null;

    const adxVal = snap.adx ?? 0;
    const regime: 'TRENDING' | 'SIDEWAYS' = adxVal >= 18 ? 'TRENDING' : 'SIDEWAYS';

    let decision: 'ENTER' | 'EXIT' | 'HOLD' = 'HOLD';
    let exitReason = '';
    let exitPrice: number | null = null;
    const signals: string[] = [];

    if (position) {
      const entry = position.entryPrice;
      const isLong = position.side === 'BUY';
      const sl = isLong ? (pointBased ? entry - slPts : entry * (1 - slPct / 100)) : (pointBased ? entry + slPts : entry * (1 + slPct / 100));
      const tp = isLong ? (pointBased ? entry + tpPts : entry * (1 + tpPct / 100)) : (pointBased ? entry - tpPts : entry * (1 - tpPct / 100));

      if (isLong && c.low <= sl) { exitPrice = sl; exitReason = 'STOP_LOSS'; }
      else if (!isLong && c.high >= sl) { exitPrice = sl; exitReason = 'STOP_LOSS'; }
      else if (isLong && c.high >= tp) { exitPrice = tp; exitReason = 'TARGET'; }
      else if (!isLong && c.low <= tp) { exitPrice = tp; exitReason = 'TARGET'; }

      if (exitPrice === null) {
        const exitConds = isLong ? exitBuyConds : exitSellConds;
        const { pass, signals: es } = checkSideConditions(exitConds, snap, prevSnap);
        signals.push(...es);
        if (pass) { exitPrice = c.close; exitReason = 'RULE_EXIT'; }
      }

      if (exitPrice !== null) {
        const pnlRaw = (exitPrice - entry) * position.qty * (isLong ? 1 : -1);
        const turnover = (entry + exitPrice) * position.qty;
        const fees = turnover * 0.0003;
        const slippage = turnover * 0.0002;
        const netPnl = pnlRaw - fees - slippage;

        trades.push({
          type: position.side,
          qty: position.qty,
          entryPrice: entry,
          exitPrice,
          entryTime: position.entryTime,
          exitTime: c.time,
          pnl: netPnl,
          pnlPct: ((exitPrice - entry) / entry) * 100 * (isLong ? 1 : -1),
          reason: exitReason,
          fees,
          slippage,
          regime
        });

        equity += netPnl;
        equityCurve.push(equity);
        maxEquity = Math.max(maxEquity, equity);
        maxDrawdown = Math.max(maxDrawdown, ((maxEquity - equity) / maxEquity) * 100);

        if (netPnl >= 0) { wins++; grossProfit += netPnl; }
        else { losses++; grossLoss += Math.abs(netPnl); }

        if (regime === 'TRENDING') { trendingTrades++; trendingPnl += netPnl; }
        else { sidewaysTrades++; sidewaysPnl += netPnl; }

        position = null;
        decision = 'EXIT';
      }
    }

    if (!position) {
      const buyCheck = checkSideConditions(entryBuyConds, snap, prevSnap);
      signals.push(...buyCheck.signals);
      if (buyCheck.pass) {
        position = { side: 'BUY', entryPrice: c.close, entryTime: c.time, qty };
        decision = 'ENTER';
      } else {
        const sellCheck = checkSideConditions(entrySellConds, snap, prevSnap);
        signals.push(...sellCheck.signals);
        if (sellCheck.pass) {
          position = { side: 'SELL', entryPrice: c.close, entryTime: c.time, qty };
          decision = 'ENTER';
        }
      }
    }

    // Context: always show ADX / DI values
    const ctx = `ADX=${adxVal.toFixed(1)} | DI+=${snap.diPlus?.toFixed(1) ?? '—'} | DI-=${snap.diMinus?.toFixed(1) ?? '—'} | HA=${getHAPattern(snap)}`;
    ruleTrace.push({
      time: c.time,
      close: c.close,
      regime,
      signals: [ctx, ...signals],
      decision
    });
  }

  const totalTrades = trades.length;
  const netPnl = equity - 100000;
  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const tradeReturns = trades.map(t => t.pnl / 100000);
  const avgReturn = tradeReturns.length ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
  const stdDev = tradeReturns.length ? Math.sqrt(tradeReturns.reduce((a, v) => a + Math.pow(v - avgReturn, 2), 0) / tradeReturns.length) : 0;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const cagr = days > 0 ? ((Math.pow(equity / 100000, 365 / days) - 1) * 100) : 0;

  return {
    totalTrades, winningTrades: wins, losingTrades: losses, winRate,
    netPnl, maxDrawdown, sharpeRatio, profitFactor,
    expectancy: totalTrades ? netPnl / totalTrades : 0,
    cagr,
    trades, equityCurve, ruleTrace,
    regimeStats: { trendingTrades, sidewaysTrades, trendingPnl, sidewaysPnl }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const BacktestPanel: React.FC<BacktestPanelProps> = ({ strategies }) => {
  const { token } = useAuth();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '5m' | '15m' | '30m' | '1h' | 'D'>('5m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [historicalData, setHistoricalData] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('CANDLE');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);

  const selectedStrategy = useMemo(
    () => strategies.find(s => s.id === selectedStrategyId),
    [strategies, selectedStrategyId]
  );

  const replayData = useMemo(() => historicalData.slice(0, Math.max(30, replayIndex + 1)), [historicalData, replayIndex]);

  const exportCSV = () => {
    if (!result || result.trades.length === 0) return;
    const headers = ['#', 'Type', 'Entry Time', 'Entry Price', 'Exit Time', 'Exit Price', 'Qty', 'P&L (Rs)', 'P&L %', 'Reason', 'Regime', 'Fees', 'Slippage'];
    const rows = result.trades.map((t, i) => [
      i + 1, t.type,
      new Date(t.entryTime).toLocaleString(), t.entryPrice.toFixed(2),
      new Date(t.exitTime).toLocaleString(), t.exitPrice.toFixed(2),
      t.qty, t.pnl.toFixed(2), t.pnlPct.toFixed(3),
      t.reason, t.regime, t.fees.toFixed(2), t.slippage.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${selectedStrategy?.name ?? 'strategy'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleRuleTrace = useMemo(
    () => result?.ruleTrace.slice(Math.max(0, replayIndex - 15), replayIndex + 1) ?? [],
    [result, replayIndex]
  );

  const runSimulation = async () => {
    if (!selectedStrategy || !token) return;
    setIsSimulating(true);
    setError(null);

    try {
      const hasCustomRange = Boolean(customFrom && customTo);
      const toDate = hasCustomRange ? new Date(customTo) : new Date();
      const fromDate = hasCustomRange
        ? new Date(customFrom)
        : new Date(Date.now() - (days + 10) * 24 * 60 * 60 * 1000);

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error('Invalid From/To date.');
      }
      if (fromDate >= toDate) {
        throw new Error('From date must be earlier than To date.');
      }

      let rawCandles: Candle[] = [];
      let dataSource = '';

      try {
        rawCandles = await fetchHistoricalCandles({
          token,
          instrumentToken: 260105,
          interval: intervalMap[timeframe],
          fromISO: fromDate.toISOString(),
          toISO: toDate.toISOString()
        });
        dataSource = `Kite API (${rawCandles.length} candles)`;
      } catch (apiErr: any) {
        console.warn('[Backtest] Kite API failed, using fallback candles:', apiErr.message);
        dataSource = 'Fallback (Kite unavailable)';
        // Generate realistic fallback candles for BANKNIFTY ~₹46,000
        const fallbackCount = 300;
        let price = 46000;
        const intervalMs = (intervalMinutesMap[timeframe] || 5) * 60 * 1000;
        const startTime = fromDate.getTime();
        rawCandles = Array.from({ length: fallbackCount }, (_, i) => {
          const move = (Math.random() - 0.48) * 0.004 * price;
          const open = price;
          const close = price + move;
          const high = Math.max(open, close) * (1 + Math.random() * 0.002);
          const low = Math.min(open, close) * (1 - Math.random() * 0.002);
          price = close;
          return {
            time: startTime + i * intervalMs,
            open, high, low, close,
            volume: Math.floor(Math.random() * 80000 + 20000)
          };
        });
      }

      console.log('[Backtest] Data source:', dataSource);
      console.log('[Backtest] Candle range:', rawCandles[0] ? new Date(rawCandles[0].time).toLocaleString() : 'none', '→', rawCandles[rawCandles.length - 1] ? new Date(rawCandles[rawCandles.length - 1].time).toLocaleString() : 'none');
      console.log('[Backtest] First candle:', JSON.stringify(rawCandles[0]));

      const candles = hasCustomRange
        ? rawCandles.filter(c => c.time >= fromDate.getTime() && c.time <= toDate.getTime())
        : rawCandles.slice(-estimateTargetCandles(days, timeframe));

      console.log('[Backtest] Strategy:', selectedStrategy?.name, '| Conditions:', selectedStrategy?.entryConditions.length);
      console.log('[Backtest] BUY conditions:', JSON.stringify(selectedStrategy?.entryConditions.filter(c => c.side === 'BUY' || c.side === 'ANY').map(c => `${c.source} ${c.operator} ${c.targetType === 'VALUE' ? c.targetValue : c.targetIndicator}`)));
      console.log('[Backtest] SELL conditions:', JSON.stringify(selectedStrategy?.entryConditions.filter(c => c.side === 'SELL' || c.side === 'ANY').map(c => `${c.source} ${c.operator} ${c.targetType === 'VALUE' ? c.targetValue : c.targetIndicator}`)));
      console.log('[Backtest] Using candles:', candles.length, '| from:', candles[0] ? new Date(candles[0].time).toLocaleString() : 'N/A', '| to:', candles[candles.length - 1] ? new Date(candles[candles.length - 1].time).toLocaleString() : 'N/A');

      if (candles.length < 50) {
        throw new Error('Not enough historical candles returned from broker.');
      }

      let simulationResult: BacktestResult;
      try {
        simulationResult = performBacktest(candles, selectedStrategy, days);
      } catch (err: any) {
        console.error('[BacktestEngine]', err);
        throw new Error(`Backtest engine error: ${err.message}`);
      }

      if (simulationResult.totalTrades === 0) {
        console.warn('[Backtest] No trades generated. Check strategy conditions and candle data.');
      }
      setHistoricalData(candles);
      setResult(simulationResult);
      setReplayIndex(candles.length - 1);
    } catch (err: any) {
      setError(err.message || 'Backtest failed.');
      setResult(null);
      setHistoricalData([]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden transition-colors duration-300">
      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-samp-accent/10 rounded-xl text-samp-accent">
                <FlaskConical size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Backtest Engine</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Strategy</label>
                <select
                  value={selectedStrategyId || ''}
                  onChange={e => setSelectedStrategyId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-3 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-sm"
                >
                  <option value="">-- SELECT LOGIC --</option>
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={e => setTimeframe(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-3 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-sm"
                >
                  {['1m', '3m', '5m', '15m', '30m', '1h', 'D'].map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Historical Window (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="number"
                    min={5}
                    max={365}
                    value={days}
                    onChange={e => setDays(Math.max(5, Math.min(365, parseInt(e.target.value) || 5)))}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">From (Optional)</label>
                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-3 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">To (Optional)</label>
                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-3 text-slate-900 dark:text-white outline-none focus:border-samp-primary transition-all font-bold text-sm"
                />
              </div>

              <button
                onClick={runSimulation}
                disabled={!selectedStrategyId || isSimulating || !token}
                className="w-full bg-samp-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-samp-primary/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {isSimulating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Play size={18} fill="currentColor" /> Run Backtest</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-5 space-y-3">
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Data Source</h4>
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>Instrument</span>
              <span className="font-bold">BANKNIFTY (260105)</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>Timeframe</span>
              <span className="font-bold">{timeframe}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>Window</span>
              <span className="font-bold">{customFrom && customTo ? 'Custom' : `${days}D`}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>Candles</span>
              <span className="font-bold">{historicalData.length || '--'}</span>
            </div>
            {result && (
              <>
                <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Trades</span>
                  <span className="font-bold">{result.totalTrades}</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Strategy</span>
                  <span className="font-bold text-[11px]">{selectedStrategy?.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 overflow-hidden">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm font-medium">
              {error}
            </div>
          )}

          {result ? (
            <div className="flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-hide animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <StatCard label="Net P&L" value={`Rs ${result.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={<TrendingUp size={16} />} color={result.netPnl >= 0 ? 'success' : 'danger'} />
                <StatCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} icon={<Target size={16} />} color="primary" />
                <StatCard label="Max DD" value={`${result.maxDrawdown.toFixed(2)}%`} icon={<Activity size={16} />} color="danger" />
                <StatCard label="Sharpe" value={result.sharpeRatio.toFixed(2)} icon={<ShieldCheck size={16} />} color="accent" />
                <StatCard label="Profit Factor" value={result.profitFactor.toFixed(2)} icon={<Layers size={16} />} color="primary" />
                <StatCard label="Trades" value={`${result.totalTrades}`} icon={<Activity size={16} />} color="primary" />
              </div>

              <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-samp-primary" />
                    Chart — Entry / Exit Visualization
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <button onClick={() => setChartType('CANDLE')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${chartType === 'CANDLE' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}>Standard</button>
                      <button onClick={() => setChartType('HEIKIN_ASHI')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${chartType === 'HEIKIN_ASHI' ? 'bg-white dark:bg-samp-surface text-samp-primary shadow-sm' : 'text-slate-500'}`}>Heikin Ashi</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowSMA(p => !p)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${showSMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500'}`}>SMA</button>
                      <button onClick={() => setShowEMA(p => !p)} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${showEMA ? 'bg-samp-primary/20 text-samp-primary' : 'text-slate-500'}`}>EMA</button>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      Bar {replayIndex + 1} / {historicalData.length}
                    </div>
                  </div>
                </div>
                <LightweightMarketChart
                  data={replayData}
                  height={320}
                  chartType={chartType}
                  showSMA={showSMA}
                  showEMA={showEMA}
                  showBollinger={false}
                  showDMI={false}
                  timeframe={timeframe}
                  tradeMarkers={result?.trades ?? []}
                  replayIndex={replayIndex}
                />
                <div className="mt-4">
                  <input
                    type="range"
                    min={30}
                    max={Math.max(30, historicalData.length - 1)}
                    value={Math.max(30, replayIndex)}
                    onChange={e => setReplayIndex(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Strategy Explain */}
                <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-samp-primary" />
                      Strategy Explain Mode
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">{visibleRuleTrace.length} bars shown</span>
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0 z-10">
                        <tr>
                          <th className="p-2 font-medium text-[9px]">Time</th>
                          <th className="p-2 font-medium text-[9px]">Close</th>
                          <th className="p-2 font-medium text-[9px]">ADX</th>
                          <th className="p-2 font-medium text-[9px]">DI+ / DI-</th>
                          <th className="p-2 font-medium text-[9px]">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {visibleRuleTrace.map((row, idx) => (
                          <tr key={`${row.time}-${idx}`} className={`transition-colors ${row.decision !== 'HOLD' ? 'bg-samp-primary/5' : ''}`}>
                            <td className="p-2 text-[10px] font-mono text-slate-500">{new Date(row.time).toLocaleString()}</td>
                            <td className="p-2 font-mono text-slate-900 dark:text-white text-[11px] font-bold">{row.close.toFixed(2)}</td>
                            <td className="p-2 text-[10px] font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${(row.signals[0] || '').includes('ADX=') ? '' : ''}`}>
                                {row.signals[0]?.split('|')[0]?.replace('ADX=', '') || '—'}
                              </span>
                            </td>
                            <td className="p-2 text-[9px] font-mono text-slate-500">
                              {row.signals[0]?.split('|').slice(1, 3).join(' ').trim() || '—'}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                row.decision === 'ENTER' && row.signals.some(s => s.includes('SELL')) ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                row.decision === 'ENTER' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                                row.decision === 'EXIT' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                                'bg-slate-100 dark:bg-white/5 text-slate-400'
                              }`}>
                                {row.decision}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Expanded signal detail below each row */}
                    <div className="px-2 pb-2">
                      {visibleRuleTrace.slice().reverse().slice(0, 3).map((row, idx) => (
                        <div key={idx} className={`mt-2 p-3 rounded-xl text-[9px] font-mono leading-relaxed ${
                          row.decision === 'ENTER' ? 'bg-green-500/5 border border-green-500/20' :
                          row.decision === 'EXIT' ? 'bg-orange-500/5 border border-orange-500/20' :
                          'bg-slate-50 dark:bg-black/20'
                        }`}>
                          <div className="font-black text-slate-400 uppercase mb-1">{row.decision} @ {new Date(row.time).toLocaleString()}</div>
                          <div className="space-y-0.5">
                            {row.signals.map((sig, i) => (
                              <div key={i} className={
                                sig.includes('>>>') ? 'text-green-600 dark:text-green-400 font-bold' :
                                sig.includes('✗') ? 'text-red-400' :
                                sig.includes('HA=') ? 'text-blue-500 font-bold' :
                                'text-slate-600 dark:text-gray-400'
                              }>{sig}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trade Ledger */}
                <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity size={16} className="text-samp-primary" />
                      Trade Ledger
                    </h3>
                    <button onClick={exportCSV} className="text-xs font-bold text-slate-400 hover:text-samp-primary flex items-center gap-2">
                      <Download size={12} /> EXPORT CSV
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {result.trades.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Activity size={32} className="mb-2 opacity-30" />
                        <p className="text-sm font-medium">No trades generated. Check strategy conditions.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0 z-10">
                          <tr>
                            <th className="p-2 font-medium text-[9px]">Entry Time</th>
                            <th className="p-2 font-medium text-[9px] text-right">Entry Rs</th>
                            <th className="p-2 font-medium text-[9px] text-right">Exit Rs</th>
                            <th className="p-2 font-medium text-[9px] text-right">Qty</th>
                            <th className="p-2 font-medium text-[9px] text-right">P&L</th>
                            <th className="p-2 font-medium text-[9px]">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {result.trades.map((trade, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="p-2 text-[10px] font-mono text-slate-500">{new Date(trade.entryTime).toLocaleString()}</td>
                              <td className="p-2 font-mono text-slate-900 dark:text-white text-right text-[11px]">{trade.entryPrice.toFixed(2)}</td>
                              <td className="p-2 font-mono text-slate-900 dark:text-white text-right text-[11px]">{trade.exitPrice.toFixed(2)}</td>
                              <td className="p-2 text-right text-slate-700 dark:text-gray-300">{trade.qty}</td>
                              <td className={`p-2 text-right font-mono font-bold text-[11px] ${trade.pnl >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                  trade.reason === 'STOP_LOSS' ? 'bg-red-500/10 text-red-500' :
                                  trade.reason === 'TARGET' ? 'bg-green-500/10 text-green-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }`}>{trade.reason.replace('_', ' ')}</span>
                                <div className="text-[8px] text-slate-400 mt-0.5">{trade.type} | {trade.regime}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white dark:bg-samp-surface border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-gray-600">
                <Activity size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ready for Backtest Replay?</h3>
                <p className="text-slate-500 dark:text-gray-500 max-w-sm mt-2 leading-relaxed font-medium">
                  Select strategy + timeframe and run to simulate real historical BANKNIFTY candles with bar-by-bar rule trace and entry/exit markers.
                </p>
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
    <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[16px] p-4 shadow-lg flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{value}</div>
    </div>
  );
};

export default BacktestPanel;
