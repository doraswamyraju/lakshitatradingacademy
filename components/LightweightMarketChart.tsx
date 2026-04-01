import React, { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
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

function toSeconds(raw: unknown): UTCTimestamp | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.floor(raw > 1e12 ? raw / 1000 : raw) as UTCTimestamp;
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
  // Use any for series refs to avoid fighting v5 generic types
  const priceSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // ─── Build clean, sorted, de-duped candle array ──────────────────────────
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const map = new Map<number, {
      time: UTCTimestamp;
      open: number; high: number; low: number; close: number;
      volume: number;
    }>();

    for (const raw of data as any[]) {
      const t = toSeconds(raw.time ?? raw.timestamp ?? raw.date);
      if (t === null) continue;

      const open  = Number(raw.open);
      const high  = Number(raw.high);
      const low   = Number(raw.low);
      const close = Number(raw.close);

      if (!Number.isFinite(open) || open <= 0)  continue;
      if (!Number.isFinite(high) || high <= 0)  continue;
      if (!Number.isFinite(low)  || low  <= 0)  continue;
      if (!Number.isFinite(close)|| close <= 0) continue;

      map.set(t, { time: t, open, high, low, close, volume: Number(raw.volume) || 0 });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
    console.log('[Chart] valid candles:', sorted.length, '| last:', sorted[sorted.length - 1]);
    return sorted;
  }, [data, chartType]);

  // ─── Build the chart & series once per chartType change ──────────────────
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
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    // ── Price series (v5 API) ──────────────────────────────────────────────
    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      priceSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
    } else {
      priceSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
      });
    }

    // ── Volume series — anchored to hidden LEFT scale ──────────────────────
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'left',
    });
    chart.priceScale('left').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,           // hide left axis → zero influence on right price scale
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
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [chartType, height]);

  // ─── Feed data into series whenever formattedData changes ────────────────
  useEffect(() => {
    if (formattedData.length === 0 || !priceSeriesRef.current) return;

    const isCandle = chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI';

    try {
      if (isCandle) {
        // ── Heikin Ashi transform ──────────────────────────────────────────
        let priceData: any[];

        if (chartType === 'HEIKIN_ASHI') {
          priceData = [];
          let pOpen = (formattedData[0].open + formattedData[0].close) / 2;
          let pClose = (formattedData[0].open + formattedData[0].high + formattedData[0].low + formattedData[0].close) / 4;

          priceData.push({
            time: formattedData[0].time,
            open:  pOpen,
            high:  Math.max(formattedData[0].high, pOpen, pClose),
            low:   Math.min(formattedData[0].low,  pOpen, pClose),
            close: pClose,
          });

          for (let i = 1; i < formattedData.length; i++) {
            const d = formattedData[i];
            const haClose = (d.open + d.high + d.low + d.close) / 4;
            const haOpen  = (pOpen + pClose) / 2;
            priceData.push({
              time:  d.time,
              open:  haOpen,
              high:  Math.max(d.high, haOpen, haClose),
              low:   Math.min(d.low,  haOpen, haClose),
              close: haClose,
            });
            pOpen  = haOpen;
            pClose = haClose;
          }
        } else {
          priceData = formattedData.map(d => ({
            time: d.time, open: d.open, high: d.high, low: d.low, close: d.close,
          }));
        }

        console.log('FINAL SERIES DATA:', priceData.slice(-5));
        priceSeriesRef.current.setData(priceData);
      } else {
        const lineData = formattedData.map(d => ({ time: d.time, value: d.close }));
        console.log('FINAL SERIES DATA:', lineData.slice(-5));
        priceSeriesRef.current.setData(lineData);
      }

      // ── Volume ────────────────────────────────────────────────────────────
      if (volumeSeriesRef.current) {
        const volData = formattedData.map(d => ({
          time:  d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
        }));
        volumeSeriesRef.current.setData(volData);
      }

      chartRef.current?.timeScale().fitContent();
    } catch (err: any) {
      console.error('[Chart] setData error:', err.message);
    }
  }, [formattedData, chartType]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="rounded-lg border border-white/5 overflow-hidden shadow-2xl"
    />
  );
};

export default LightweightMarketChart;
