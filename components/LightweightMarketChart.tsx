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

function toUTCSeconds(raw: unknown): UTCTimestamp | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // timestamps in ms are > year 2001 in seconds (1e9) and > 2001 in ms (1e12)
    return Math.floor(raw > 1_000_000_000_000 ? raw / 1000 : raw) as UTCTimestamp;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    const ms = Date.parse(raw);
    if (Number.isFinite(ms)) return Math.floor(ms / 1000) as UTCTimestamp;
  }
  return null;
}

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({
  data,
  height,
  chartType = 'CANDLE',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<any>(null);

  // ── 1. Normalise & validate incoming candles ────────────────────────────
  const cleanCandles = useMemo(() => {
    if (!data || data.length === 0) return [];

    const map = new Map<number, {
      time: UTCTimestamp;
      open: number; high: number; low: number; close: number;
    }>();

    for (const raw of data as any[]) {
      const t = toUTCSeconds(raw.time ?? raw.timestamp ?? raw.date);
      if (t === null) { console.warn('[Chart] bad time:', raw); continue; }

      const o = Number(raw.open);
      const h = Number(raw.high);
      const l = Number(raw.low);
      const c = Number(raw.close);

      // skip completely invalid rows – but ONLY require positive close & open
      if (!Number.isFinite(o) || o <= 0) continue;
      if (!Number.isFinite(h) || h <= 0) continue;
      if (!Number.isFinite(l) || l <= 0) continue;
      if (!Number.isFinite(c) || c <= 0) continue;

      map.set(t, { time: t, open: o, high: h, low: l, close: c });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    console.log('[Chart] cleanCandles count:', sorted.length, '| last:', sorted.at(-1));
    return sorted;
  }, [data]);

  // ── 2. Transform into price series rows ─────────────────────────────────
  const seriesData = useMemo(() => {
    if (cleanCandles.length === 0) return [];

    if (chartType !== 'HEIKIN_ASHI') {
      // plain candlestick — pass through as-is
      return cleanCandles; // already { time, open, high, low, close }
    }

    // Heikin Ashi transform
    const result: { time: UTCTimestamp; open: number; high: number; low: number; close: number }[] = [];
    let pOpen  = (cleanCandles[0].open + cleanCandles[0].close) / 2;
    let pClose = (cleanCandles[0].open + cleanCandles[0].high + cleanCandles[0].low + cleanCandles[0].close) / 4;
    result.push({ time: cleanCandles[0].time, open: pOpen, high: Math.max(cleanCandles[0].high, pOpen, pClose), low: Math.min(cleanCandles[0].low, pOpen, pClose), close: pClose });

    for (let i = 1; i < cleanCandles.length; i++) {
      const d = cleanCandles[i];
      const haClose = (d.open + d.high + d.low + d.close) / 4;
      const haOpen  = (pOpen + pClose) / 2;
      result.push({
        time:  d.time,
        open:  haOpen,
        high:  Math.max(d.high, haOpen, haClose),
        low:   Math.min(d.low,  haOpen, haClose),
        close: haClose,
      });
      pOpen  = haOpen;
      pClose = haClose;
    }
    return result;
  }, [cleanCandles, chartType]);

  // ── 3. Create chart & series (once per chartType/height) ─────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0C15' },
        textColor: '#9CA3AF',
      },
      width:  containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: { visible: true },
      timeScale: { timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    });

    chartRef.current = chart;

    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor:      '#10B981',
        downColor:    '#EF4444',
        borderVisible: false,
        wickUpColor:   '#10B981',
        wickDownColor: '#EF4444',
      });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: '#3B82F6', lineWidth: 2,
      });
    }

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, [chartType, height]);

  // ── 4. Push data into series ─────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || seriesData.length === 0) return;

    console.log('FINAL SERIES DATA (last 5):', seriesData.slice(-5));

    try {
      if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
        seriesRef.current.setData(seriesData);
      } else {
        seriesRef.current.setData(
          seriesData.map(d => ({ time: d.time, value: d.close }))
        );
      }
      chartRef.current?.timeScale().fitContent();
    } catch (err: any) {
      console.error('[Chart] setData error:', err.message);
    }
  }, [seriesData, chartType]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="rounded-lg border border-white/5 overflow-hidden shadow-2xl"
    />
  );
};

export default LightweightMarketChart;
