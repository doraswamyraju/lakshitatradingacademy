import React, { useEffect, useRef, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  CandlestickData, 
  HistogramData, 
  LineData, 
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  HistogramSeries
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
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const normalizeTimeSecs = (raw: string | number | any): Time | null => {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      // If it's in MS (e.g. 1700000000000), convert to seconds
      return Math.floor(raw > 1e12 ? raw / 1000 : raw) as Time;
    }
    if (typeof raw === 'string') {
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) return Math.floor(parsed / 1000) as Time;
    }
    return null;
  };

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const normalized = data
      .map((d: any) => ({
        ...d,
        __tsSecs: normalizeTimeSecs(d.time || d.timestamp || d.date)
      }))
      .filter((d) => 
        d.__tsSecs !== null && 
        Number.isFinite(d.open) && 
        Number.isFinite(d.high) && 
        Number.isFinite(d.low) && 
        Number.isFinite(d.close) &&
        d.open > 0 && d.close > 0 
      ) as Array<Candle & { __tsSecs: Time, volume: number }>;
    
    // Deduplicate exact timestamps to prevent Lightweight Charts invariant error
    const uniqueMap = new Map<number, Candle & { __tsSecs: Time, volume: number }>();
    for (const d of normalized) {
      uniqueMap.set(d.__tsSecs as number, d);
    }
    const uniqueSorted = Array.from(uniqueMap.values()).sort((a, b) => (a.__tsSecs as number) - (b.__tsSecs as number));
    
    if (uniqueSorted.length === 0) {
        console.warn("[Chart Debug] All candles were filtered out as invalid or had bad timestamps.");
        return [];
    }
    
    const finalData: any[] = [];

    if (chartType === 'HEIKIN_ASHI') {
      let prevOpen = (uniqueSorted[0].open + uniqueSorted[0].close) / 2;
      let prevClose = (uniqueSorted[0].open + uniqueSorted[0].high + uniqueSorted[0].low + uniqueSorted[0].close) / 4;

      finalData.push({
        time: uniqueSorted[0].__tsSecs,
        open: prevOpen,
        high: Math.max(uniqueSorted[0].high, prevOpen, prevClose),
        low: Math.min(uniqueSorted[0].low, prevOpen, prevClose),
        close: prevClose,
        value: prevClose, 
        volume: Number(uniqueSorted[0].volume) || 0
      });

      for (let i = 1; i < uniqueSorted.length; i++) {
        const current = uniqueSorted[i];
        const haClose = (current.open + current.high + current.low + current.close) / 4;
        const haOpen = (prevOpen + prevClose) / 2;
        const haHigh = Math.max(current.high, haOpen, haClose);
        const haLow = Math.min(current.low, haOpen, haClose);

        finalData.push({
          time: current.__tsSecs,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
          value: haClose,
          volume: Number(current.volume) || 0
        });

        prevOpen = haOpen;
        prevClose = haClose;
      }
    } else {
      for (const d of uniqueSorted) {
        finalData.push({
          time: d.__tsSecs,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          value: d.close,
          volume: Number(d.volume) || 0
        });
      }
    }

    console.log(`[Chart Debug] Processed ${finalData.length} valid candles uniquely sorted by time.`, { sample: finalData[finalData.length - 1] });
    return finalData;
  }, [data, chartType]);

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
        secondsVisible: false 
      },
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
      seriesRef.current = series as ISeriesApi<"Candlestick">;
    } else {
      const series = chart.addLineSeries({
        color: '#3B82F6', 
        lineWidth: 2,
      });
      seriesRef.current = series as ISeriesApi<"Line">;
    }

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a', 
      priceFormat: { type: 'volume' }, 
      priceScaleId: 'left', 
    });
    
    chart.priceScale('left').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    });
    
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
    if (formattedData.length === 0) return;

    try {
      if (seriesRef.current) { 
        const isCandle = chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI';
        
        const seriesData = formattedData.map((d: any) => {
          const t = Number(d.time);

          if (!Number.isFinite(t)) {
            console.warn("Invalid time detected:", d);
            return null;
          }

          return isCandle
            ? {
                time: t as UTCTimestamp,   // force strict number
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
              }
            : {
                time: t as UTCTimestamp,
                value: Number(d.value),
              };
        }).filter(Boolean);
        
        console.log("FINAL SERIES DATA:", seriesData.slice(-5));
        
        seriesRef.current.setData(seriesData as any); 
        chartRef.current?.timeScale().fitContent();
      }

      if (volumeSeriesRef.current) {
          const vData = formattedData.map((d: any) => {
              const t = Number(d.time);
              if (!Number.isFinite(t)) return null;
              
              return {
                  time: t as UTCTimestamp,
                  value: Number(d.volume || 0),
                  color: Number(d.close) >= Number(d.open) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
              };
          }).filter(Boolean);
          
          volumeSeriesRef.current.setData(vData as any);
      }
    } catch (err: any) {
      console.error("[Chart Debug] Error drawing series data:", err.message);
    }
  }, [formattedData, chartType]);

  return (
    <div 
       ref={chartContainerRef} 
       style={{ width: '100%', height }} 
       className="rounded-lg border border-white/5 overflow-hidden shadow-2xl transition-all" 
    />
  );
};
export default LightweightMarketChart;
