import React, { useEffect, useRef, useMemo } from 'react';
import * as LightweightCharts from 'lightweight-charts';
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
  const chartRef = useRef<LightweightCharts.IChartApi | null>(null);
  const seriesRef = useRef<LightweightCharts.ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<LightweightCharts.ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = useRef<LightweightCharts.ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<LightweightCharts.ISeriesApi<"Histogram"> | null>(null);

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
    const normalized = data
      .map((d) => ({ ...d, __tsMs: normalizeTimeToMs((d as any).time) }))
      .filter((d) => d.__tsMs !== null) as Array<Candle & { __tsMs: number }>;
    
    const uniqueMap = new Map<number, Candle & { __tsMs: number }>();
    for (const d of normalized) {
      const timeSecs = Math.floor(d.__tsMs / 1000);
      uniqueMap.set(timeSecs, d);
    }
    const uniqueSorted = Array.from(uniqueMap.values()).sort((a, b) => a.__tsMs - b.__tsMs);
    if (uniqueSorted.length === 0) return [];
    
    let finalData: Array<any> = [];

    if (chartType === 'HEIKIN_ASHI') {
      let prevOpen = (uniqueSorted[0].open + uniqueSorted[0].close) / 2;
      let prevClose = (uniqueSorted[0].open + uniqueSorted[0].high + uniqueSorted[0].low + uniqueSorted[0].close) / 4;

      finalData.push({
        time: Math.floor(uniqueSorted[0].__tsMs / 1000) as LightweightCharts.Time,
        open: prevOpen,
        high: Math.max(uniqueSorted[0].high, prevOpen, prevClose),
        low: Math.min(uniqueSorted[0].low, prevOpen, prevClose),
        close: prevClose,
        value: prevClose,
        volume: uniqueSorted[0].volume
      });

      for (let i = 1; i < uniqueSorted.length; i++) {
        const current = uniqueSorted[i];
        const haClose = (current.open + current.high + current.low + current.close) / 4;
        const haOpen = (prevOpen + prevClose) / 2;
        const haHigh = Math.max(current.high, haOpen, haClose);
        const haLow = Math.min(current.low, haOpen, haClose);

        finalData.push({
          time: Math.floor(current.__tsMs / 1000) as LightweightCharts.Time,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
          value: haClose,
          volume: current.volume
        });

        prevOpen = haOpen;
        prevClose = haClose;
      }
    } else {
      finalData = uniqueSorted.map((d) => ({
        time: (Math.floor(d.__tsMs / 1000)) as LightweightCharts.Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        value: d.close,
        volume: d.volume
      }));
    }

    return finalData;
  }, [data, timeframe, chartType]);

  const smaData = useMemo(() => {
    if (!showSMA || formattedData.length === 0) return [];
    const period = 20; 
    const result: LightweightCharts.LineData[] = [];
    for (let i = 0; i < formattedData.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) { sum += (formattedData[i - j] as any).close; }
        result.push({ time: formattedData[i].time, value: sum / period });
    }
    return result;
  }, [formattedData, showSMA]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: '#0B0C15' },
        textColor: '#9CA3AF',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    // Use a safer way to check for series creation methods
    const c = chart as any;
    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      const series = c.addCandlestickSeries ? c.addCandlestickSeries({
        upColor: '#10B981', downColor: '#EF4444', borderVisible: false,
        wickUpColor: '#10B981', wickDownColor: '#EF4444',
      }) : c.addSeries(LightweightCharts.CandlestickSeries);
      seriesRef.current = series;
    } else {
      const series = c.addLineSeries ? c.addLineSeries({
        color: '#3B82F6', lineWidth: 2,
      }) : c.addSeries(LightweightCharts.LineSeries);
      seriesRef.current = series;
    }

    const volumeSeries = c.addHistogramSeries ? c.addHistogramSeries({
      color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', 
    }) : c.addSeries(LightweightCharts.HistogramSeries);
    
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

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
  }, [chartType, height]);

  useEffect(() => {
    if (seriesRef.current) { seriesRef.current.setData(formattedData as any); }
    if (volumeSeriesRef.current) {
        const vData = formattedData.map(d => ({
            time: d.time,
            value: (d as any).volume,
            color: (d as any).close >= (d as any).open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }));
        volumeSeriesRef.current.setData(vData as any);
    }
  }, [formattedData]);

  return (
    <div 
       ref={chartContainerRef} 
       style={{ width: '100%', height }} 
       className="rounded-lg border border-white/5 overflow-hidden shadow-2xl transition-all" 
    />
  );
};
export default LightweightMarketChart;
