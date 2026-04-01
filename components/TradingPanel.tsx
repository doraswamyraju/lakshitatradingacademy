import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { UserFunds, MarketState, FeedStatus, BrokerConfig } from '../types';

interface OptionChainRow {
  strike: number;
  ceLtp: number | null;
  peLtp: number | null;
  ceSymbol?: string | null;
  peSymbol?: string | null;
}

interface TradingPanelProps {
  funds: UserFunds;
  optionChain: OptionChainRow[];
  isPaperTrading?: boolean;
  onPlaceOptionOrder: (
    side: 'BUY' | 'SELL',
    quantity: number,
    type: 'MARKET' | 'LIMIT',
    product: 'MIS' | 'CNC',
    optionType: 'CE' | 'PE',
    strike: number,
    price?: number
  ) => void | Promise<void>;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ funds, optionChain, onPlaceOptionOrder, isPaperTrading = false }) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [product, setProduct] = useState<'MIS' | 'CNC'>('MIS');
  const [selectedStrike, setSelectedStrike] = useState<number>(0);
  const [limitPrice, setLimitPrice] = useState<number>(0);

  useEffect(() => {
    if (optionChain.length === 0) return;
    if (!selectedStrike || !optionChain.some((row) => row.strike === selectedStrike)) {
      setSelectedStrike(optionChain[0].strike);
    }
  }, [optionChain, selectedStrike]);

  const selectedRow = optionChain.find((row) => row.strike === selectedStrike);
  const optionLtp = optionType === 'CE' ? (selectedRow?.ceLtp ?? 0) : (selectedRow?.peLtp ?? 0);

  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(optionLtp);
    }
  }, [optionLtp, orderType]);

  const estimatedValue = (orderType === 'MARKET' ? optionLtp : limitPrice) * quantity;
  const marginRequired = product === 'MIS' ? estimatedValue / 5 : estimatedValue;
  const hasOptionPrice = Number.isFinite(optionLtp) && optionLtp > 0;
  const hasSufficientMargin = (funds?.availableMargin ?? 0) >= marginRequired;
  // In paper trading mode bypass real margin check — orders are simulated anyway
  const canSubmit = hasOptionPrice && selectedStrike > 0 && (isPaperTrading || hasSufficientMargin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((funds?.availableMargin ?? 0) < marginRequired) return;
    onPlaceOptionOrder(
      side,
      quantity,
      orderType,
      product,
      optionType,
      selectedStrike,
      orderType === 'LIMIT' ? limitPrice : undefined
    );
  };

  return (
    <div className="bg-white dark:bg-samp-surface rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col h-full transition-colors duration-300 shadow-xl">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
        <ShoppingCart size={16} className="text-samp-primary" /> Execute Option
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <label className={`cursor-pointer border ${optionType === 'CE' ? 'border-samp-primary bg-samp-primary/10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20'} rounded-lg p-2 text-center transition-all`}>
            <input type="radio" name="optionType" className="hidden" checked={optionType === 'CE'} onChange={() => setOptionType('CE')} />
            <div className="text-xs font-bold text-slate-900 dark:text-white">CALL (CE)</div>
          </label>
          <label className={`cursor-pointer border ${optionType === 'PE' ? 'border-samp-primary bg-samp-primary/10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20'} rounded-lg p-2 text-center transition-all`}>
            <input type="radio" name="optionType" className="hidden" checked={optionType === 'PE'} onChange={() => setOptionType('PE')} />
            <div className="text-xs font-bold text-slate-900 dark:text-white">PUT (PE)</div>
          </label>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block uppercase font-bold tracking-widest">Strike</label>
          <select
            value={selectedStrike || ''}
            onChange={(e) => setSelectedStrike(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-samp-primary outline-none transition-colors"
          >
            {optionChain.length === 0 && <option value="">No strikes</option>}
            {optionChain.map((row) => (
              <option key={row.strike} value={row.strike}>
                {row.strike}
              </option>
            ))}
          </select>
        </div>

        <div className="flex bg-slate-100 dark:bg-black/30 rounded-lg p-1 border border-slate-200 dark:border-white/5 transition-colors">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
              side === 'BUY' ? 'bg-samp-success text-white shadow-lg' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex-1 py-2 rounded text-sm font-bold transition-all ${
              side === 'SELL' ? 'bg-samp-danger text-white shadow-lg' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className={`cursor-pointer border ${product === 'MIS' ? 'border-samp-primary bg-samp-primary/10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20'} rounded-lg p-1.5 text-center transition-all`}>
            <input type="radio" name="product" className="hidden" checked={product === 'MIS'} onChange={() => setProduct('MIS')} />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Intraday</div>
            <div className="text-[8px] text-slate-500 dark:text-gray-400 font-bold uppercase">MIS (5x)</div>
          </label>
          <label className={`cursor-pointer border ${product === 'CNC' ? 'border-samp-primary bg-samp-primary/10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20'} rounded-lg p-1.5 text-center transition-all`}>
            <input type="radio" name="product" className="hidden" checked={product === 'CNC'} onChange={() => setProduct('CNC')} />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Delivery</div>
            <div className="text-[8px] text-slate-500 dark:text-gray-400 font-bold uppercase">CNC (1x)</div>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block uppercase font-bold tracking-widest">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-samp-primary outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block uppercase font-bold tracking-widest">Option LTP</label>
              <input
                type="number"
                disabled
                value={optionLtp > 0 ? optionLtp.toFixed(2) : ''}
                placeholder="--"
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm opacity-70"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block uppercase font-bold tracking-widest">Limit Price</label>
              <input
                type="number"
                step="0.05"
                disabled={orderType === 'MARKET'}
                value={orderType === 'MARKET' ? optionLtp.toFixed(2) : limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
                className={`w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-samp-primary outline-none transition-colors ${orderType === 'MARKET' ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="orderType"
                checked={orderType === 'MARKET'}
                onChange={() => setOrderType('MARKET')}
                className="accent-samp-primary w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-gray-300 font-medium">Market</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="orderType"
                checked={orderType === 'LIMIT'}
                onChange={() => setOrderType('LIMIT')}
                className="accent-samp-primary w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-gray-300 font-medium">Limit</span>
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-white/5">
          <div className="flex justify-between text-[9px] mb-0.5 font-bold uppercase tracking-widest">
            <span className="text-slate-500 dark:text-gray-400">Margin Required</span>
            <span className="text-slate-900 dark:text-white">₹{(marginRequired ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
            <span className="text-slate-500 dark:text-gray-400">Available Margin</span>
            <span className={(funds?.availableMargin ?? 0) < marginRequired ? 'text-samp-danger' : 'text-samp-success'}>
              ₹{(funds?.availableMargin ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-xl transition-all transform active:scale-95 ${
            side === 'BUY'
              ? 'bg-samp-success hover:bg-emerald-500 shadow-samp-success/20'
              : 'bg-samp-danger hover:bg-red-500 shadow-samp-danger/20'
          } ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          PLACE {side} {optionType}{isPaperTrading ? ' [PAPER]' : ''}
        </button>
      </form>
    </div>
  );
};

export default TradingPanel;

