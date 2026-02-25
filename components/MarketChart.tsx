
import React, { useMemo } from 'react';
import { Candle, ChartType } from '../types';

interface MarketChartProps {
  data: Candle[];
  height: number;
  width?: string;
  chartType?: ChartType;
}

const MarketChart: React.FC<MarketChartProps> = ({ data, height, chartType = 'CANDLE' }) => {
  const transformedData = useMemo(() => {
    if (data.length === 0) return [];
    if (chartType === 'CANDLE') return data;

    const haData: Candle[] = [];
    let prevOpen = (data[0].open + data[0].close) / 2;
    let prevClose = (data[0].open + data[0].high + data[0].low + data[0].close) / 4;

    haData.push({
      ...data[0],
      open: prevOpen,
      close: prevClose,
      high: Math.max(data[0].high, prevOpen, prevClose),
      low: Math.min(data[0].low, prevOpen, prevClose),
    });

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
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
      });

      prevOpen = haOpen;
      prevClose = haClose;
    }
    return haData;
  }, [data, chartType]);

  const { min, max, candles } = useMemo(() => {
    if (transformedData.length === 0) return { min: 0, max: 100, candles: [] };

    const minPrice = Math.min(...transformedData.map(d => d.low));
    const maxPrice = Math.max(...transformedData.map(d => d.high));
    const padding = (maxPrice - minPrice) * 0.1;

    return {
      min: minPrice - padding,
      max: maxPrice + padding,
      candles: transformedData
    };
  }, [transformedData]);

  const getY = (price: number) => {
    return height - ((price - min) / (max - min)) * height;
  };

  return (
    <div className="w-full relative bg-[#0B0C15] rounded-lg overflow-hidden border border-white/5" style={{ height }}>
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} className="absolute w-full border-t border-gray-400" style={{ top: `${p * 100}%` }} />
        ))}
      </div>

      <svg width="100%" height={height} className="block">
        {candles.map((candle, i) => {
          const x = (i / candles.length) * 100;
          const candleWidth = (100 / candles.length) * 0.7;
          
          const yOpen = getY(candle.open);
          const yClose = getY(candle.close);
          const yHigh = getY(candle.high);
          const yLow = getY(candle.low);

          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#10b981' : '#ef4444';

          return (
            <g key={candle.time}>
              {/* Wick */}
              <line 
                x1={`${x + candleWidth / 2}%`} 
                y1={yHigh} 
                x2={`${x + candleWidth / 2}%`} 
                y2={yLow} 
                stroke={color} 
                strokeWidth="1" 
              />
              {/* Body */}
              <rect
                x={`${x}%`}
                y={Math.min(yOpen, yClose)}
                width={`${candleWidth}%`}
                height={Math.max(1, Math.abs(yOpen - yClose))}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Price Labels */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500 py-1 pr-1 bg-[#0B0C15]/80 pointer-events-none">
          <span>{max.toFixed(2)}</span>
          <span>{((max + min) / 2).toFixed(2)}</span>
          <span>{min.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default MarketChart;
