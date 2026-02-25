import { Candle, OrderBookItem } from "../types";

// Default Starting Price
const INITIAL_PRICE = 2450.00; 
const VOLATILITY = 0.0015; 

export const generateInitialCandles = (count: number, startPrice: number = INITIAL_PRICE): Candle[] => {
  const candles: Candle[] = [];
  let price = startPrice;
  // Start from several hours ago
  let time = Date.now() - count * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const movement = (Math.random() - 0.5) * VOLATILITY * 5 * price;
    const open = price;
    const close = open + movement;
    
    const high = Math.max(open, close) + Math.random() * Math.abs(movement) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(movement) * 0.5;
    
    const volume = Math.floor(Math.random() * 50000 + 10000);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });

    price = close;
    time += 60 * 1000;
  }
  return candles;
};

export const generateNextCandle = (prevClose: number, lastTime: number): Candle => {
  const change = (Math.random() - 0.45) * VOLATILITY * 2 * prevClose; 
  const open = prevClose;
  const close = open + change;
  const high = Math.max(open, close) + Math.random() * (prevClose * 0.001);
  const low = Math.min(open, close) - Math.random() * (prevClose * 0.001);
  
  return {
    time: lastTime + 60 * 1000,
    open,
    high,
    low,
    close,
    volume: Math.floor(Math.random() * 10000 + 5000)
  };
};

export const generateOrderBook = (currentPrice: number): { bids: OrderBookItem[], asks: OrderBookItem[] } => {
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  const tickSize = 0.05;

  for (let i = 0; i < 10; i++) {
    let bidPrice = currentPrice - (i + 1) * tickSize * (1 + Math.random());
    let askPrice = currentPrice + (i + 1) * tickSize * (1 + Math.random());
    
    bidPrice = Math.round(bidPrice * 20) / 20;
    askPrice = Math.round(askPrice * 20) / 20;

    const amount = Math.floor(Math.random() * 500 + 10);
    
    bidTotal += amount;
    askTotal += amount;

    bids.push({ price: bidPrice, amount, total: bidTotal });
    asks.push({ price: askPrice, amount, total: askTotal });
  }

  return { bids, asks };
};