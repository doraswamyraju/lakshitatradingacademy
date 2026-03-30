import React, { useEffect, useRef, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  LineData,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  UTCTimestamp
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

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({
  data, 
  height, 
  chartType = 'CANDLE',
  showSMA = false,
  showEMA = false,
  timeframe = '1m'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const normalizeTimeToMs = (raw: any): number | null => {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw < 1e12 ? raw * 1000 : raw;
    }
    if (typeof raw === 'string') {
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const bucketSecondsMap: Record<string, number> = {
      '1m': 60,
      '3m': 180,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      'D': 86400
    };
    const bucketSeconds = bucketSecondsMap[timeframe] || 60;

    const normalized = data
      .map((d) => ({ ...d, __tsMs: normalizeTimeToMs((d as any).time) }))
      .filter((d) => d.__tsMs !== null) as Array<Candle & { __tsMs: number }>;

    const sorted = normalized.sort((a, b) => a.__tsMs - b.__tsMs);

    if (sorted.length === 0) return [];

    const aggregated: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    for (const candle of sorted) {
      const tsSec = Math.floor(candle.__tsMs / 1000);
      const bucketStart = Math.floor(tsSec / bucketSeconds) * bucketSeconds;
      const last = aggregated[aggregated.length - 1];

      if (!last || last.time !== bucketStart) {
        aggregated.push({
          time: bucketStart,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        });
        continue;
      }

      last.high = Math.max(last.high, candle.high);
      last.low = Math.min(last.low, candle.low);
      last.close = candle.close;
      last.volume += candle.volume;
    }

    const result = aggregated.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      value: d.close,
      volume: d.volume
    }));

    if (chartType === 'HEIKIN_ASHI' && result.length > 0) {
        const haData = [];
        let prevOpen = (result[0].open + result[0].close) / 2;
        let prevClose = (result[0].open + result[0].high + result[0].low + result[0].close) / 4;
        
        haData.push({ ...result[0], open: prevOpen, close: prevClose });

        for (let i = 1; i < result.length; i++) {
           const current = result[i];
           const haClose = (current.open + current.high + current.low + current.close) / 4;
           const haOpen = (prevOpen + prevClose) / 2;
           const haHigh = Math.max(current.high, haOpen, haClose);
           const haLow = Math.min(current.low, haOpen, haClose);

           haData.push({
               ...current,
               open: haOpen,
               close: haClose,
               high: haHigh,
               low: haLow,
               value: haClose
           });
           prevOpen = haOpen;
           prevClose = haClose;
        }
        return haData;
    }

    return result;
  }, [data, chartType, timeframe]);

  const smaData = useMemo(() => {
    if (!showSMA || formattedData.length === 0) return [];
    const period = 20; 
    const result: LineData[] = [];
    
    for (let i = 0; i < formattedData.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += (formattedData[i - j] as any).close; 
        }
        result.push({ time: formattedData[i].time, value: sum / period });
    }
    return result;
  }, [formattedData, showSMA]);

  const emaData = useMemo(() => {
    if (!showEMA || formattedData.length === 0) return [];
    const period = 9; 
    const result: LineData[] = [];
    const k = 2 / (period + 1);
    let ema = (formattedData[0] as any).close;

    for (let i = 0; i < formattedData.length; i++) {
        const close = (formattedData[i] as any).close;
        if (i > 0) {
            ema = (close * k) + (ema * (1 - k));
        }
        result.push({ time: formattedData[i].time, value: ema });
    }
    return result;
  }, [formattedData, showEMA]);

  const volumeData = useMemo(() => {
    return formattedData.map(d => ({
        time: d.time,
        value: (d as any).volume,
        color: (d as any).close >= (d as any).open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    }));
  }, [formattedData]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0C15' },
        textColor: '#9CA3AF',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        shiftVisibleRangeOnNewBar: true,
      },
      crosshair: { mode: 1 },
    });

    chartRef.current = chart;

    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      const series = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      seriesRef.current = series as any;
    } else {
      const series = chart.addLineSeries({
        color: '#3B82F6',
        lineWidth: 2,
        crosshairMarkerVisible: true
      });
      seriesRef.current = series as any;
    }

    if (showSMA) {
      const smaSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 2,
        title: 'SMA 20',
      });
      smaSeriesRef.current = smaSeries as any;
    }

    if (showEMA) {
      const emaSeries = chart.addLineSeries({
        color: '#8B5CF6',
        lineWidth: 2,
        title: 'EMA 9',
      });
      emaSeriesRef.current = emaSeries as any;
    }

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries as any;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
         chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartType, showSMA, showEMA, height]);

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(formattedData as any);
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData as any);
    }
    if (showSMA && smaSeriesRef.current) {
      smaSeriesRef.current.setData(smaData);
    }
    if (showEMA && emaSeriesRef.current) {
      emaSeriesRef.current.setData(emaData);
    }
  }, [formattedData, showSMA, smaData, showEMA, emaData, volumeData]);

  return (
    <div 
       ref={chartContainerRef} 
       style={{ width: '100%', height }} 
       className="rounded-lg border border-white/5 overflow-hidden shadow-2xl transition-all" 
    />
  );
};
export default LightweightMarketChart;
