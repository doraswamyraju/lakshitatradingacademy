
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartType = 'CANDLE' | 'HEIKIN_ASHI';

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

export interface MarketState {
  symbol: string;
  price: number;
  candles: Candle[];
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  trend: 'bullish' | 'bearish' | 'neutral';
  feedSource?: 'BROKER_WS' | 'DISCONNECTED' | 'ERROR';
}

export interface AIAnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  keyLevels: { support: number; resistance: number };
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  product: 'MIS' | 'CNC';
}

export interface Order {
  order_id: string;
  symbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  order_type: 'MARKET' | 'LIMIT';
  status: 'COMPLETE' | 'OPEN' | 'REJECTED' | 'CANCELLED';
  order_timestamp: string;
  product: 'MIS' | 'CNC';
}

export interface UserFunds {
  walletBalance: number;
  availableMargin: number;
  usedMargin: number;
  collateral: number;
  dayPnl: number;
}

export interface FeedStatus {
  source: 'BROKER_WS' | 'DISCONNECTED' | 'ERROR';
  message: string;
  broker?: string;
  at?: string;
  lastTickAt?: string | null;
  latencyMs?: number | null;
  reconnectCount?: number;
  tokenAgeMinutes?: number | null;
}

export type IndicatorType = 'PRICE' | 'RSI' | 'SMA' | 'EMA' | 'MACD' | 'VOLUME' | 'BOLLINGER_UPPER' | 'BOLLINGER_LOWER' | 'BOLLINGER_MIDDLE' | 'ADX' | 'DI_PLUS' | 'DI_MINUS' | 'HEIKIN_ASHI_CANDLE';
export type OperatorType = '>' | '<' | '==' | '>=' | '<=' | 'CROSSOVER' | 'CROSSUNDER' | 'NEAR' | 'BETWEEN' | 'PATTERN_MATCH';

export interface StrategyCondition {
  id: string;
  source: IndicatorType;
  sourceParams: Record<string, any>;
  operator: OperatorType;
  targetType: 'VALUE' | 'INDICATOR';
  targetValue?: number;
  targetIndicator?: IndicatorType;
  targetParams?: Record<string, any>;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | 'D';
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
  riskConfig: {
    stopLossPct: number;
    takeProfitPct: number;
    trailingStopLoss: boolean;
  };
  qty: number;
  productType: 'MIS' | 'CNC';
  isActive: boolean;
  isMaster?: boolean;
  createdBy?: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export type AlgorithmType = 'bubble' | 'selection' | 'insertion';

export interface VisualizerState {
  array: number[];
  comparingIndices: number[];
  swappingIndices: number[];
  sortedIndices: number[];
  isSorting: boolean;
  isPaused: boolean;
  algorithm: AlgorithmType;
  speed: number;
  arraySize: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL';
  qty: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPct: number;
  reason: string;
  fees: number;
  slippage: number;
  regime: 'TRENDING' | 'SIDEWAYS';
}

export interface BacktestRuleTrace {
  time: number;
  close: number;
  regime: 'TRENDING' | 'SIDEWAYS';
  signals: string[];
  decision: 'ENTER' | 'EXIT' | 'HOLD';
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  expectancy: number;
  cagr: number;
  trades: BacktestTrade[];
  equityCurve: number[];
  ruleTrace: BacktestRuleTrace[];
  regimeStats: {
    trendingTrades: number;
    sidewaysTrades: number;
    trendingPnl: number;
    sidewaysPnl: number;
  };
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  type: 'LIVE' | 'RECORDED';
  instructor: string;
  date: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Strategy' | 'Python' | 'Psychology' | 'Technical Analysis';
  progress?: number;
}

export interface BrokerConfig {
  brokerName: string;
  isEnabled: boolean;
  isConnected?: boolean;
  apiKey?: string;
  apiSecret?: string;
  clientCode?: string;
}
