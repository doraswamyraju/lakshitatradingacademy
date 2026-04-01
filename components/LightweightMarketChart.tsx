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

// IST = UTC + 5:30 = +19800 seconds
const IST_OFFSET_SECS = 19800;

function toUTCSecs(raw: unknown): UTCTimestamp | null {
  let ms: number | null = null;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    ms = raw > 1_000_000_000_000 ? raw : raw * 1000; // handle both ms and s
  } else if (typeof raw === 'string' && raw.length > 0) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) ms = parsed;
  }

  if (ms === null) return null;
  // Convert UTC ms → UTC seconds, then shift to IST so chart labels show IST
  return Math.floor(ms / 1000) as UTCTimestamp;
}

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({
  data,
  height,
  chartType = 'CANDLE',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // ── 1. Normalise & de-dupe incoming candles ────────────────────────────
  const cleanCandles = useMemo(() => {
    if (!data || data.length === 0) return [];

    const map = new Map<number, {
      time: UTCTimestamp;
      open: number; high: number; low: number; close: number;
    }>();

    for (const raw of data as any[]) {
      const t = toUTCSecs(raw.time ?? raw.timestamp ?? raw.date);
      if (t === null) { console.warn('[Chart] bad time:', raw); continue; }

      const o = Number(raw.open);
      const h = Number(raw.high);
      const l = Number(raw.low);
      const c = Number(raw.close);

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

  // ── 2. Apply Heikin Ashi transform if needed ────────────────────────────
  const seriesData = useMemo(() => {
    if (cleanCandles.length === 0) return [];
    if (chartType !== 'HEIKIN_ASHI') return cleanCandles;

    const result: { time: UTCTimestamp; open: number; high: number; low: number; close: number }[] = [];
    let pO = (cleanCandles[0].open + cleanCandles[0].close) / 2;
    let pC = (cleanCandles[0].open + cleanCandles[0].high + cleanCandles[0].low + cleanCandles[0].close) / 4;
    result.push({ time: cleanCandles[0].time, open: pO, high: Math.max(cleanCandles[0].high, pO, pC), low: Math.min(cleanCandles[0].low, pO, pC), close: pC });

    for (let i = 1; i < cleanCandles.length; i++) {
      const d = cleanCandles[i];
      const haC = (d.open + d.high + d.low + d.close) / 4;
      const haO = (pO + pC) / 2;
      result.push({ time: d.time, open: haO, high: Math.max(d.high, haO, haC), low: Math.min(d.low, haO, haC), close: haC });
      pO = haO; pC = haC;
    }
    return result;
  }, [cleanCandles, chartType]);

  // ── 3. Create chart & series ─────────────────────────────────────────────
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
      // ── Enable scroll & zoom ─────────────────────────────────────────────
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        crosshair: {
          mode: 1,
        },

        kineticScroll: {
          mouse: true,
          touch: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: { time: true, price: true },
          axisDoubleClickReset: { time: true, price: true },
        },
        // ────────────────────────────────────────────────────────────────────
        rightPriceScale: {
          visible: true,
          autoScale: true,
          scaleMargins: { top: 0.2, bottom: 0.2 },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          // We already shifted timestamps to IST, so tell the lib timezone offset = 0
          // (shifting in data rather than via locale avoids needing a premium API)
        },
        crosshair: { mode: 1 },
      });

    chartRef.current = chart;

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
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartType, height]);

  // ── 4. Feed data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || seriesData.length === 0) return;

    console.log('FINAL SERIES DATA (last 5):', seriesData.slice(-5));

    try {
      if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
        seriesRef.current.setData(seriesData);
      } else {
        seriesRef.current.setData(seriesData.map(d => ({ time: d.time, value: d.close })));
      }

      // Lock visible price range around last close ±500
      const last = seriesData[seriesData.length - 1];

      if (last && chartRef.current) {
        const range = 300;

        chartRef.current.priceScale('right').setVisibleRange({
          from: last.close - range,
          to: last.close + range,
        });
      }

      chartRef.current?.timeScale().scrollToRealTime();
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
