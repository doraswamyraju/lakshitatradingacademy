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
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // 1. Process data: strictly weed out bizarre zeroes and sort correctly
  const seriesData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const map = new Map<number, { time: UTCTimestamp; open: number; high: number; low: number; close: number }>();
    
    // Auto-detect normal price range to filter rogue ticks (e.g. options mixed into index data)
    const validCloseSet = data.map(d => Number(d.close)).filter(c => Number.isFinite(c) && c > 100);
    const medianBase = validCloseSet.length > 0 
      ? validCloseSet.sort((a,b)=>a-b)[Math.floor(validCloseSet.length/2)] 
      : 0;

    for (const raw of data) {
      const rAny = raw as any;
      const t = toUTCSeconds(rAny.time ?? rAny.timestamp ?? rAny.date);
      if (t === null) continue;

      const o = Number(raw.open);
      const h = Number(raw.high);
      const l = Number(raw.low);
      const c = Number(raw.close);

      if (!Number.isFinite(c) || c <= 0) continue;
      
      // If price is heavily deviant from median (e.g. > 90% drift), skip it to prevent Y scale explosion
      if (medianBase > 0 && (c < medianBase * 0.1 || c > medianBase * 1.9)) continue;

      map.set(t, { time: t, open: o || c, high: h || c, low: l || c, close: c });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    if (sorted.length === 0) return [];

    // Heikin Ashi transformation
    if (chartType === 'HEIKIN_ASHI') {
      const result = [];
      let pOpen = (sorted[0].open + sorted[0].close) / 2;
      let pClose = (sorted[0].open + sorted[0].high + sorted[0].low + sorted[0].close) / 4;
      
      result.push({ time: sorted[0].time, open: pOpen, high: Math.max(sorted[0].high, pOpen, pClose), low: Math.min(sorted[0].low, pOpen, pClose), close: pClose });

      for (let i = 1; i < sorted.length; i++) {
        const d = sorted[i];
        const haClose = (d.open + d.high + d.low + d.close) / 4;
        const haOpen = (pOpen + pClose) / 2;
        result.push({
          time: d.time,
          open: haOpen,
          high: Math.max(d.high, haOpen, haClose),
          low: Math.min(d.low, haOpen, haClose),
          close: haClose,
        });
        pOpen = haOpen;
        pClose = haClose;
      }
      return result;
    }

    return sorted;
  }, [data, chartType]);

  // 2. Build canonical, untouched container
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0B0C15' }, textColor: '#9CA3AF' },
      width: containerRef.current.clientWidth,
      height,
      grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
      rightPriceScale: { autoScale: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
      crosshair: { mode: 1 },
      kineticScroll: { touch: true, mouse: true }
    });
    chartRef.current = chart;

    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      seriesRef.current = chart.addSeries(CandlestickSeries, { upColor: '#10B981', downColor: '#EF4444', borderVisible: false, wickUpColor: '#10B981', wickDownColor: '#EF4444' });
    } else {
      seriesRef.current = chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 2 });
    }

    const onResize = () => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartType, height]);

  // 3. Inject data safely into pure series container
  useEffect(() => {
    if (!seriesRef.current || !seriesData || seriesData.length === 0) return;
    try {
      seriesRef.current.setData(seriesData);
      chartRef.current?.timeScale().fitContent();
    } catch (e: any) {
      console.error('[Chart Error] setData crashed:', e.message);
    }
  }, [seriesData]);

  return <div ref={containerRef} style={{ width: '100%', height }} className="rounded-lg border border-white/5 overflow-hidden shadow-2xl" />;
};

export default LightweightMarketChart;
