import { ExecutionLoop } from './engine/ExecutionLoop';
import { Candle } from './engine/QuantCalculations';

async function runSimulation() {
  console.log("==========================================");
  console.log("🚀 LAKSHITA TRADING ACADEMY - NODE INITIALIZED");
  console.log("==========================================\n");

  const engine = new ExecutionLoop();

  // 1. Initializing Broker Connect
  await engine.start({
    apiKey: 'angel_dummy_api',
    clientCode: 'DORASWAMY1',
    apiSecret: 'secret'
  });

  console.log("\n[Simulator] Injecting 20 historical candles to warm up Bollinger/ADX...");

  // Let's generate 20 candles that represent a strong bullish trend reaching a peak
  let basePrice = 22000;
  for (let i = 0; i < 20; i++) {
    // Upward trend
    basePrice += Math.random() * 20 + 10;
    
    const candle: Candle = {
      time: Date.now() - (20 - i) * 300000,
      open: basePrice - Math.random() * 10,
      close: basePrice + Math.random() * 10,
      high: basePrice + 15,
      low: basePrice - 15,
      volume: 1000
    };
    engine.injectCandle(candle);
  }

  // Inject a pullback candle near the 20 SMA (simulated drop)
  console.log("\n[Simulator] Injecting Pullback Candle to hit the Bollinger Middle Band...");
  
  // The 20 SMA of the last 20 candles will be around (22000 + 22500)/2 = 22250.
  // Let's drop price to exactly that level with a strong Heikin Ashi body.
  const pullbackPrice = 22250;
  const pullbackCandle: Candle = {
    time: Date.now(),
    open: pullbackPrice - 20, // open lower
    close: pullbackPrice + 30, // strong bullish close
    high: pullbackPrice + 32, // tiny upper wick
    low: pullbackPrice - 25, // tiny lower wick
    volume: 5000
  };
  
  engine.injectCandle(pullbackCandle);

  console.log("\n[Simulator] Waiting for execution engine tick...\n");

  setTimeout(() => {
    engine.stop();
    console.log("\n==========================================");
    console.log("🏁 SIMULATION COMPLETE");
    console.log("==========================================");
    process.exit(0);
  }, 6000);
}

runSimulation();
