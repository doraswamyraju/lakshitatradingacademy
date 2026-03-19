import { ADX, BollingerBands } from 'technicalindicators';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HeikinAshiCandle extends Candle {
  isStrongBullish: boolean;
  isStrongBearish: boolean;
  bodySizePct: number;
}

export class QuantEngine {
  
  /**
   * Converts standard candles to Heikin Ashi candles
   * HA Close = (O+H+L+C)/4
   * HA Open = (Prev HA Open + Prev HA Close)/2
   * HA High = Max(H, HA Open, HA Close)
   * HA Low = Min(L, HA Open, HA Close)
   */
  static generateHeikinAshi(candles: Candle[]): HeikinAshiCandle[] {
    const haCandles: HeikinAshiCandle[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      
      let haOpen = c.open;
      if (i > 0) {
        haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
      }
      
      const haHigh = Math.max(c.high, haOpen, haClose);
      const haLow = Math.min(c.low, haOpen, haClose);
      
      const totalRange = haHigh - haLow;
      const bodySize = Math.abs(haClose - haOpen);
      const bodySizePct = totalRange === 0 ? 0 : bodySize / totalRange;

      // Classifying strict candle types according to strategy rules
      const isBullish = haClose > haOpen;
      const lowerWick = isBullish ? (haOpen - haLow) : (haClose - haLow);
      const upperWick = isBullish ? (haHigh - haClose) : (haHigh - haOpen);
      
      const isStrongBullish = isBullish && bodySizePct >= 0.6 && (lowerWick / totalRange) <= 0.2;
      const isStrongBearish = !isBullish && bodySizePct >= 0.6 && (upperWick / totalRange) <= 0.2;

      haCandles.push({
        time: c.time,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: c.volume,
        isStrongBullish,
        isStrongBearish,
        bodySizePct
      });
    }
    return haCandles;
  }

  /**
   * Calculates ADX for an array of candles
   */
  static calculateADX(candles: Candle[], period: number = 14) {
    const input = {
      high: candles.map(c => c.high),
      low: candles.map(c => c.low),
      close: candles.map(c => c.close),
      period
    };
    
    return ADX.calculate(input);
  }

  /**
   * Calculates Bollinger Bands
   */
  static calculateBollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2) {
      const input = {
          period,
          values: candles.map(c => c.close),
          stdDev
      };
      
      return BollingerBands.calculate(input);
  }

  /**
   * Checks if price is near the Bollinger Middle Band
   */
  static isPriceNearMidBand(price: number, middleBand: number, tolerancePct: number = 1): boolean {
      const diffPct = Math.abs(price - middleBand) / middleBand * 100;
      return diffPct <= tolerancePct;
  }
}
