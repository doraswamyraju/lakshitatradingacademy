import React, { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  IChartApi,
  UTCTimestamp,
} from 'lightweight-charts';
import { Candle, ChartType } from '../types';

interface LightweightMarketChartProps {
  data: Candle[];
  height: number;
  chartType?: ChartType;
  showSMA?: boolean;
  showEMA?: boolean;
  timeframe?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Timestamp helpers
// ─────────────────────────────────────────────────────────────────────────────

function toEpochMs(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // If already looks like epoch-ms (> year 2000 = 946684800000), use as-is.
    // If it looks like epoch-seconds, multiply.
    return raw > 946_684_800_000 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Lightweight Charts expects UNIX seconds (UTCTimestamp).
// We do NOT add any IST offset — the chart's `localization` option will handle
// display. Instead we just pass raw UTC seconds so the library renders correctly.
function toChartTime(raw: unknown): UTCTimestamp | null {
  const ms = toEpochMs(raw);
  if (ms === null) return null;
  return Math.floor(ms / 1000) as UTCTimestamp;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMA / SMA helpers
// ─────────────────────────────────────────────────────────────────────────────

function calcSMA(closes: number[], period: number) {
  const result: { time: UTCTimestamp; value: number }[] = [];
  // We store (time, value) separately so caller can zip them
  return result; // computed inline below after we have sorted candles
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({
  data,
  height,
  chartType = 'CANDLE',
  showSMA = false,
  showEMA = false,
  timeframe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const smaSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);

  // ── 1. Sanitise + filter outliers + dedupe + sort ───────────────────────
  const seriesData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Collect valid close prices to derive a robust price anchor
    const closes: number[] = [];
    for (const d of data) {
      const c = Number(d.close);
      if (Number.isFinite(c) && c > 1000) closes.push(c);
    }
    if (closes.length === 0) return [];

    closes.sort((a, b) => a - b);
    const median = closes[Math.floor(closes.length / 2)];

    // Wide tolerance: ±30 % around median — avoids filtering valid candles
    // but still removes junk values like 0, 111, 60000 etc.
    const lo = median * 0.70;
    const hi = median * 1.30;

    const map = new Map<number, {
      time: UTCTimestamp;
      open: number;
      high: number;
      low: number;
      close: number;
    }>();

    for (const raw of data) {
      const rAny = raw as any;
      const t = toChartTime(rAny.time ?? rAny.timestamp ?? rAny.date);
      if (t === null) continue;

      const o = Number(raw.open);
      const h = Number(raw.high);
      const l = Number(raw.low);
      const c = Number(raw.close);

      if (!Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) continue;

      // Only filter if ALL four fields are out of range (not any single one)
      const allInRange = o > lo && o < hi && c > lo && c < hi;
      if (!allInRange) continue;

      map.set(t, { time: t, open: o, high: h, low: l, close: c });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    if (sorted.length === 0) return [];

    // ── Heikin Ashi transform ─────────────────────────────────────────────
    if (chartType === 'HEIKIN_ASHI') {
      const result: typeof sorted = [];
      let prevO = (sorted[0].open + sorted[0].close) / 2;
      let prevC = (sorted[0].open + sorted[0].high + sorted[0].low + sorted[0].close) / 4;
      result.push({
        time: sorted[0].time,
        open: prevO,
        high: Math.max(sorted[0].high, prevO, prevC),
        low: Math.min(sorted[0].low, prevO, prevC),
        close: prevC,
      });
      for (let i = 1; i < sorted.length; i++) {
        const d = sorted[i];
        const haC = (d.open + d.high + d.low + d.close) / 4;
        const haO = (prevO + prevC) / 2;
        result.push({
          time: d.time,
          open: haO,
          high: Math.max(d.high, haO, haC),
          low: Math.min(d.low, haO, haC),
          close: haC,
        });
        prevO = haO;
        prevC = haC;
      }
      return result;
    }

    return sorted;
  }, [data, chartType]);

  // Compute SMA-20 and EMA-9 data in parallel
  const indicatorData = useMemo(() => {
    if (seriesData.length === 0) return { sma20: [], ema9: [] };

    const sma20: { time: UTCTimestamp; value: number }[] = [];
    const ema9: { time: UTCTimestamp; value: number }[] = [];

    const period_sma = 20;
    const period_ema = 9;
    const k = 2 / (period_ema + 1);
    let prevEma: number | null = null;

    for (let i = 0; i < seriesData.length; i++) {
      const { time, close } = seriesData[i];

      // SMA-20
      if (i >= period_sma - 1) {
        let sum = 0;
        for (let j = i - period_sma + 1; j <= i; j++) sum += seriesData[j].close;
        sma20.push({ time, value: sum / period_sma });
      }

      // EMA-9
      if (i === 0) {
        prevEma = close;
      } else {
        prevEma = close * k + prevEma! * (1 - k);
      }
      if (i >= period_ema - 1) {
        ema9.push({ time, value: prevEma! });
      }
    }

    return { sma20, ema9 };
  }, [seriesData]);

  // ── 2. Create chart (only on mount / chartType / height change) ──────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0C15' },
        textColor: '#9CA3AF',
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: {
        autoScale: true,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        // Show times in IST (+05:30)
        tickMarkFormatter: (time: UTCTimestamp) => {
          const d = new Date(time * 1000);
          const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
          const hh = String(ist.getUTCHours()).padStart(2, '0');
          const mm = String(ist.getUTCMinutes()).padStart(2, '0');
          return `${hh}:${mm}`;
        },
      },
      localization: {
        // Format tooltip time as IST
        timeFormatter: (time: UTCTimestamp) => {
          const d = new Date(time * 1000);
          const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
          return ist.toISOString().replace('T', ' ').substring(0, 16) + ' IST';
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
      },
      crosshair: { mode: 1 },
      kineticScroll: { touch: true, mouse: true },
    });
    chartRef.current = chart;

    // Main OHLC series
    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
      });
    }

    // SMA series (hidden until showSMA flag activates it)
    smaSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#FBBF24',
      lineWidth: 1,
      visible: false,
    });

    // EMA series
    emaSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#A78BFA',
      lineWidth: 1,
      visible: false,
    });

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      smaSeriesRef.current = null;
      emaSeriesRef.current = null;
    };
  }, [chartType, height]);

  // ── 3. Feed OHLC data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || seriesData.length === 0) return;
    try {
      seriesRef.current.setData(seriesData);
      chartRef.current?.timeScale().fitContent();
    } catch (e: any) {
      console.error('[Chart] setData error:', e.message);
    }
  }, [seriesData]);

  // ── 4. Feed indicator data + toggle visibility ───────────────────────────
  useEffect(() => {
    if (!smaSeriesRef.current || !emaSeriesRef.current) return;
    try {
      if (indicatorData.sma20.length > 0) {
        smaSeriesRef.current.setData(indicatorData.sma20);
      }
      smaSeriesRef.current.applyOptions({ visible: showSMA });

      if (indicatorData.ema9.length > 0) {
        emaSeriesRef.current.setData(indicatorData.ema9);
      }
      emaSeriesRef.current.applyOptions({ visible: showEMA });
    } catch (e: any) {
      console.error('[Chart] indicator error:', e.message);
    }
  }, [indicatorData, showSMA, showEMA]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="rounded-lg border border-white/5 overflow-hidden shadow-2xl"
    />
  );
};

export default LightweightMarketChart;
