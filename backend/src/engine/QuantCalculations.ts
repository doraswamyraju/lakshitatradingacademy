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
  isWeak: boolean;
  bodySizePct: number;
}

export class QuantEngine {
  
  /**
   * Converts standard candles to Heikin Ashi candles
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
      if (totalRange === 0) {
         haCandles.push({ ...c, open: haOpen, high: haHigh, low: haLow, close: haClose, isStrongBullish: false, isStrongBearish: false, isWeak: true, bodySizePct: 0 });
         continue;
      }

      const bodySize = Math.abs(haClose - haOpen);
      const bodySizePct = bodySize / totalRange;

      const isBullish = haClose > haOpen;
      const lowerWick = isBullish ? (haOpen - haLow) : (haClose - haLow);
      const upperWick = isBullish ? (haHigh - haClose) : (haHigh - haOpen);
      
      // STRONG_BULLISH: close ≈ high AND small lower wick
      const isStrongBullish = isBullish && (upperWick / totalRange) < 0.05 && (lowerWick / totalRange) < 0.1 && bodySizePct > 0.6;
      
      // STRONG_BEARISH: close ≈ low AND small upper wick
      const isStrongBearish = !isBullish && (lowerWick / totalRange) < 0.05 && (upperWick / totalRange) < 0.1 && bodySizePct > 0.6;
      
      // WEAK_CANDLE: small body + wicks both sides
      const isWeak = bodySizePct < 0.3 && (lowerWick / totalRange) > 0.2 && (upperWick / totalRange) > 0.2;

      haCandles.push({
        time: c.time,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: c.volume,
        isStrongBullish,
        isStrongBearish,
        isWeak,
        bodySizePct
      });
    }
    return haCandles;
  }

  /**
   * Calculates ADX and DMI (+DI, -DI)
   */
  static calculateADX(candles: Candle[], period: number = 14) {
    const input = {
      high: candles.map(c => c.high),
      low: candles.map(c => c.low),
      close: candles.map(c => c.close),
      period
    };
    
    const adx = ADX.calculate(input);
    return adx; // Returns { adx, pdi, mdi }
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
