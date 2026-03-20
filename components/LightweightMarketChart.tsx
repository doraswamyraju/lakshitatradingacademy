import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, LineData, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { Candle, ChartType } from '../types';

interface LightweightMarketChartProps {
  data: Candle[];
  height: number;
  chartType?: ChartType;
  showSMA?: boolean;
}

const LightweightMarketChart: React.FC<LightweightMarketChartProps> = ({ 
  data, 
  height, 
  chartType = 'CANDLE',
  showSMA = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Transform our generic string-based Candle[] into strict TradingView format
  const formattedData = useMemo(() => {
    // Because backend `time` is a string like "02:30 PM", we cleanly generate strict chronological Unix timestamps
    // by anchoring the most recent candle to NOW, and subtracting 1 minute backward for each.
    const nowSecs = Math.floor(Date.now() / 1000);
    const result = data.map((d, index) => {
        // Distance from end of the array inside a 1m chart = (data.length - 1 - index) minutes
        const minutesAgo = data.length - 1 - index;
        const ts = nowSecs - (minutesAgo * 60);

        // Calculate Heikin Ashi values dynamically if requested
        let o = d.open;
        let c = d.close;
        let h = d.high;
        let l = d.low;

        return {
           time: ts as Time, 
           open: o, 
           high: h, 
           low: l, 
           close: c,
           value: c // for line charts
        };
    });

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
  }, [data, chartType]);

  const smaData = useMemo(() => {
    if (!showSMA || formattedData.length === 0) return [];
    const period = 20; 
    const result: LineData[] = [];
    
    for (let i = 0; i < formattedData.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += formattedData[i - j].close; // HA close or normal close
        }
        result.push({ time: formattedData[i].time, value: sum / period });
    }
    return result;
  }, [formattedData, showSMA]);

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
    if (seriesRef.current && formattedData.length > 0) {
      seriesRef.current.setData(formattedData as any);
    }
    if (showSMA && smaSeriesRef.current && smaData.length > 0) {
      smaSeriesRef.current.setData(smaData);
    }
  }, [formattedData, showSMA, smaData]);

  return (
    <div 
       ref={chartContainerRef} 
       style={{ width: '100%', height }} 
       className="rounded-lg border border-white/5 overflow-hidden shadow-2xl transition-all" 
    />
  );
};
export default LightweightMarketChart;
