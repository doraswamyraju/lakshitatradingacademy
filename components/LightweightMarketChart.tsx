import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, LineData, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
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

  // Transform and aggregate data based on Timeframe
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

    const sorted = [...data]
      .filter(d => Number.isFinite(d.time))
      .sort((a, b) => a.time - b.time);

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
      const tsSec = Math.floor(candle.time / 1000);
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
        // Compute strict HA transformation over the raw set
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
            sum += formattedData[i - j].close; 
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
    let ema = formattedData[0].close;

    for (let i = 0; i < formattedData.length; i++) {
        if (i > 0) {
            ema = (formattedData[i].close * k) + (ema * (1 - k));
        }
        result.push({ time: formattedData[i].time, value: ema });
    }
    return result;
  }, [formattedData, showEMA]);

  const volumeData = useMemo(() => {
    return formattedData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    }));
  }, [formattedData]);

  // Handle Chart Destruction & Creation natively
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
      localization: {
        timeFormatter: (timestamp: number) => {
          const date = new Date(timestamp * 1000);
          return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' }
    });

    chartRef.current = chart;

    if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      seriesRef.current = series;
    } else {
      const series = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
        crosshairMarkerVisible: true
      });
      seriesRef.current = series;
    }

    if (showSMA) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 2,
        title: 'SMA 20',
      });
      smaSeriesRef.current = smaSeries;
    }

    if (showEMA) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#8B5CF6',
        lineWidth: 2,
        title: 'EMA 9',
      });
      emaSeriesRef.current = emaSeries;
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
         chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartType, showSMA, height]);

  // Synchronize Dataset seamlessly
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
