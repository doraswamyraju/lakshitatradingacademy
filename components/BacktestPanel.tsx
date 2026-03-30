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
import { TradingStrategy, BacktestResult, BacktestTrade, Candle, BacktestRuleTrace } from '../types';
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
  // NSE session is ~375 minutes/day. We keep strict day-based candle targeting.
  return Math.max(50, Math.round((days * 375) / intervalMinutesMap[timeframe]));
};

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

  const selectedStrategy = useMemo(
    () => strategies.find(s => s.id === selectedStrategyId),
    [strategies, selectedStrategyId]
  );

  const replayData = useMemo(() => historicalData.slice(0, Math.max(30, replayIndex + 1)), [historicalData, replayIndex]);
  const visibleRuleTrace = useMemo(
    () => result?.ruleTrace.slice(Math.max(0, replayIndex - 12), replayIndex + 1) || [],
    [result, replayIndex]
  );
  const dataFrom = historicalData.length > 0 ? new Date(historicalData[0].time).toLocaleString() : '--';
  const dataTo = historicalData.length > 0 ? new Date(historicalData[historicalData.length - 1].time).toLocaleString() : '--';

  const runSimulation = async () => {
    if (!selectedStrategy || !token) return;
    setIsSimulating(true);
    setError(null);

    try {
      const hasCustomRange = Boolean(customFrom && customTo);
      const toDate = hasCustomRange ? new Date(customTo) : new Date();
      // Fetch with a calendar buffer so weekends/holidays don't collapse the selected trading window.
      const fromDate = hasCustomRange
        ? new Date(customFrom)
        : new Date(Date.now() - (days + 10) * 24 * 60 * 60 * 1000);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error('Invalid From/To date.');
      }
      if (fromDate >= toDate) {
        throw new Error('From date must be earlier than To date.');
      }

      const rawCandles = await fetchHistoricalCandles({
        token,
        instrumentToken: 260105,
        interval: intervalMap[timeframe],
        fromISO: fromDate.toISOString(),
        toISO: toDate.toISOString()
      });

      const candles = hasCustomRange
        ? rawCandles.filter(c => c.time >= fromDate.getTime() && c.time <= toDate.getTime())
        : rawCandles.slice(-estimateTargetCandles(days, timeframe));

      if (candles.length < 50) {
        throw new Error('Not enough historical candles returned from broker.');
      }

      const simulationResult = performBacktest(candles, selectedStrategy, days);
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
                  <><Play size={18} fill="currentColor" /> Run Historical Replay</>
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
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>From</span>
              <span className="font-bold text-[11px]">{dataFrom}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center justify-between">
              <span>To</span>
              <span className="font-bold text-[11px]">{dataTo}</span>
            </div>
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
                <StatCard label="Net P&L" value={`₹${result.netPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={<TrendingUp size={16} />} color="success" />
                <StatCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} icon={<Target size={16} />} color="primary" />
                <StatCard label="Max DD" value={`${result.maxDrawdown.toFixed(2)}%`} icon={<Activity size={16} />} color="danger" />
                <StatCard label="Sharpe" value={result.sharpeRatio.toFixed(2)} icon={<ShieldCheck size={16} />} color="accent" />
                <StatCard label="Profit Factor" value={result.profitFactor.toFixed(2)} icon={<Layers size={16} />} color="primary" />
                <StatCard label="CAGR" value={`${result.cagr.toFixed(2)}%`} icon={<TrendingUp size={16} />} color="success" />
              </div>

              <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-samp-primary" />
                    Replay Chart + Rule Engine
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    Bar {replayIndex + 1} / {historicalData.length}
                  </div>
                </div>
                <LightweightMarketChart data={replayData} height={320} chartType="CANDLE" showSMA={true} showEMA={true} timeframe={timeframe} />
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
                <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-samp-primary" />
                      Strategy Explain Mode
                    </h3>
                  </div>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0">
                        <tr>
                          <th className="p-3 font-medium">Time</th>
                          <th className="p-3 font-medium">Close</th>
                          <th className="p-3 font-medium">Regime</th>
                          <th className="p-3 font-medium">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {visibleRuleTrace.map((row, idx) => (
                          <tr key={`${row.time}-${idx}`}>
                            <td className="p-3 text-slate-600 dark:text-gray-400">{new Date(row.time).toLocaleString()}</td>
                            <td className="p-3 font-mono text-slate-900 dark:text-white">{row.close.toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.regime === 'TRENDING' ? 'bg-samp-primary/15 text-samp-primary' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300'}`}>
                                {row.regime}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.decision === 'ENTER' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : row.decision === 'EXIT' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300'}`}>
                                {row.decision}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1">{row.signals.join(' | ')}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white dark:bg-samp-surface border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity size={16} className="text-samp-primary" />
                      Trade Ledger
                    </h3>
                    <button className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2">
                      <Download size={12} /> EXPORT CSV
                    </button>
                  </div>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0">
                        <tr>
                          <th className="p-3 font-medium">Entry</th>
                          <th className="p-3 font-medium text-right">Qty</th>
                          <th className="p-3 font-medium text-right">Exit</th>
                          <th className="p-3 font-medium text-right">P&L</th>
                          <th className="p-3 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {result.trades.map((trade, i) => (
                          <tr key={i}>
                            <td className="p-3 font-mono text-slate-900 dark:text-white">{trade.entryPrice.toFixed(2)}</td>
                            <td className="p-3 text-right text-slate-700 dark:text-gray-300">{trade.qty}</td>
                            <td className="p-3 text-right font-mono text-slate-900 dark:text-white">{trade.exitPrice.toFixed(2)}</td>
                            <td className={`p-3 text-right font-mono font-bold ${trade.pnl >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-gray-400">{trade.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  Select strategy + timeframe and run to simulate real historical candles with bar-by-bar rule trace.
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

const sma = (values: number[], period: number, i: number) => {
  if (i < period - 1) return null;
  let sum = 0;
  for (let idx = i - period + 1; idx <= i; idx++) sum += values[idx];
  return sum / period;
};

const rsi = (values: number[], period: number, i: number) => {
  if (i <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let idx = i - period + 1; idx <= i; idx++) {
    const delta = values[idx] - values[idx - 1];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
};

const performBacktest = (candles: Candle[], strategy: TradingStrategy, days: number): BacktestResult => {
  const closes = candles.map(c => c.close);
  const trades: BacktestTrade[] = [];
  const ruleTrace: BacktestRuleTrace[] = [];
  const equityCurve: number[] = [100000];
  let equity = 100000;

  let position: { entryPrice: number; entryTime: number; qty: number; regime: 'TRENDING' | 'SIDEWAYS' } | null = null;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let maxEquity = equity;
  let maxDrawdown = 0;
  let trendingTrades = 0;
  let sidewaysTrades = 0;
  let trendingPnl = 0;
  let sidewaysPnl = 0;

  const stopLossPct = Math.max(0.1, strategy.riskConfig.stopLossPct || 1);
  const takeProfitPct = Math.max(stopLossPct * 2, strategy.riskConfig.takeProfitPct || stopLossPct * 2);
  const qty = Math.max(1, strategy.qty || 1);

  for (let i = 20; i < candles.length; i++) {
    const candle = candles[i];
    const sma20 = sma(closes, 20, i);
    const rsi14 = rsi(closes, 14, i);
    if (sma20 === null || rsi14 === null) continue;

    const regime: 'TRENDING' | 'SIDEWAYS' = Math.abs((candle.close - sma20) / sma20) > 0.003 ? 'TRENDING' : 'SIDEWAYS';
    const signals = [
      `Close ${candle.close.toFixed(2)}`,
      `SMA20 ${sma20.toFixed(2)}`,
      `RSI14 ${rsi14.toFixed(1)}`
    ];

    let decision: 'ENTER' | 'EXIT' | 'HOLD' = 'HOLD';
    const entrySignal = candle.close > sma20 && rsi14 >= 55;
    const exitSignal = candle.close < sma20 || rsi14 <= 45;

    if (!position && entrySignal) {
      position = { entryPrice: candle.close, entryTime: candle.time, qty, regime };
      decision = 'ENTER';
    } else if (position) {
      const stopPrice = position.entryPrice * (1 - stopLossPct / 100);
      const targetPrice = position.entryPrice * (1 + takeProfitPct / 100);
      let exitPrice: number | null = null;
      let reason = '';

      if (candle.low <= stopPrice) {
        exitPrice = stopPrice;
        reason = 'STOP_LOSS';
      } else if (candle.high >= targetPrice) {
        exitPrice = targetPrice;
        reason = 'TARGET';
      } else if (exitSignal) {
        exitPrice = candle.close;
        reason = 'RULE_EXIT';
      }

      if (exitPrice !== null) {
        const turnover = (position.entryPrice + exitPrice) * position.qty;
        const fees = turnover * 0.0003;
        const slippage = turnover * 0.0002;
        const pnl = (exitPrice - position.entryPrice) * position.qty - fees - slippage;
        const pnlPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

        const trade: BacktestTrade = {
          type: 'BUY',
          qty: position.qty,
          entryPrice: position.entryPrice,
          exitPrice,
          entryTime: position.entryTime,
          exitTime: candle.time,
          pnl,
          pnlPct,
          reason,
          fees,
          slippage,
          regime: position.regime
        };

        trades.push(trade);
        equity += pnl;
        equityCurve.push(equity);
        maxEquity = Math.max(maxEquity, equity);
        maxDrawdown = Math.max(maxDrawdown, ((maxEquity - equity) / maxEquity) * 100);

        if (pnl >= 0) {
          wins += 1;
          grossProfit += pnl;
        } else {
          losses += 1;
          grossLoss += Math.abs(pnl);
        }

        if (trade.regime === 'TRENDING') {
          trendingTrades += 1;
          trendingPnl += pnl;
        } else {
          sidewaysTrades += 1;
          sidewaysPnl += pnl;
        }

        position = null;
        decision = 'EXIT';
      }
    }

    ruleTrace.push({
      time: candle.time,
      close: candle.close,
      regime,
      signals,
      decision
    });
  }

  const totalTrades = trades.length;
  const netPnl = equity - 100000;
  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;
  const tradeReturns = trades.map(t => t.pnl / 100000);
  const avgReturn = tradeReturns.length ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
  const stdDev = tradeReturns.length
    ? Math.sqrt(tradeReturns.reduce((acc, v) => acc + Math.pow(v - avgReturn, 2), 0) / tradeReturns.length)
    : 0;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const expectancy = totalTrades ? netPnl / totalTrades : 0;
  const cagr = days > 0 ? ((Math.pow(equity / 100000, 365 / days) - 1) * 100) : 0;

  return {
    totalTrades,
    winningTrades: wins,
    losingTrades: losses,
    winRate,
    netPnl,
    maxDrawdown,
    sharpeRatio,
    profitFactor,
    expectancy,
    cagr,
    trades,
    equityCurve,
    ruleTrace,
    regimeStats: {
      trendingTrades,
      sidewaysTrades,
      trendingPnl,
      sidewaysPnl
    }
  };
};

export default BacktestPanel;
