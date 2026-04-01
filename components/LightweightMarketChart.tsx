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

// IST = UTC + 5h 30m = 19800 seconds
// Lightweight Charts renders timestamps as-is (UTC). To show IST labels on the
// x-axis we shift every timestamp forward by 19800 s before feeding it in.
const IST_OFFSET_SECONDS = 19800;

function toChartTime(raw: unknown): UTCTimestamp | null {
  let ms: number;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    ms = raw > 1_000_000_000_000 ? raw : raw * 1000;
  } else if (typeof raw === 'string' && raw.length > 0) {
    const parsed = Date.parse(raw);
    if (!Number.isFinite(parsed)) return null;
    ms = parsed;
  } else {
    return null;
  }

  // Convert to seconds, then add IST offset so the chart x-axis reads IST.
  return (Math.floor(ms / 1000) + IST_OFFSET_SECONDS) as UTCTimestamp;
}

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({
  data,
  height,
  chartType = 'CANDLE',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // ── 1. Sanitise, filter outliers on ALL OHLC fields, de-dupe, sort ──────
  const seriesData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Step A: collect all close prices > 100 to compute a robust median
    const closes: number[] = [];
    for (const d of data) {
      const c = Number(d.close);
      if (Number.isFinite(c) && c > 100) closes.push(c);
    }
    if (closes.length === 0) return [];

    closes.sort((a, b) => a - b);
    const median = closes[Math.floor(closes.length / 2)];
    const lo = median * 0.85;   // 15 % below median
    const hi = median * 1.15;   // 15 % above median

    // Step B: build candle map, filtering on EVERY OHLC field
    const map = new Map<number, {
      time: UTCTimestamp; open: number; high: number; low: number; close: number;
    }>();

    for (const raw of data) {
      const rAny = raw as any;
      const t = toChartTime(rAny.time ?? rAny.timestamp ?? rAny.date);
      if (t === null) continue;

      const o = Number(raw.open);
      const h = Number(raw.high);
      const l = Number(raw.low);
      const c = Number(raw.close);

      // ALL four fields must be finite and within the safe band
      if (!Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) continue;
      if (o < lo || o > hi) continue;
      if (h < lo || h > hi) continue;
      if (l < lo || l > hi) continue;
      if (c < lo || c > hi) continue;

      map.set(t, { time: t, open: o, high: h, low: l, close: c });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    if (sorted.length === 0) return [];

    // Step C: Heikin Ashi transform
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

  // ── 2. Create chart ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0B0C15' }, textColor: '#9CA3AF' },
      width: containerRef.current.clientWidth,
      height,
      grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
      rightPriceScale: { autoScale: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true, secondsVisible: false },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
      crosshair: { mode: 1 },
      kineticScroll: { touch: true, mouse: true },
    });
    chartRef.current = chart;

    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981', downColor: '#EF4444',
        borderVisible: false, wickUpColor: '#10B981', wickDownColor: '#EF4444',
      });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 2 });
    }

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartType, height]);

  // ── 3. Feed data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !seriesData || seriesData.length === 0) return;
    try {
      seriesRef.current.setData(seriesData);
      chartRef.current?.timeScale().fitContent();
    } catch (e: any) {
      console.error('[Chart] setData error:', e.message);
    }
  }, [seriesData]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="rounded-lg border border-white/5 overflow-hidden shadow-2xl"
    />
  );
};

export default LightweightMarketChart;
