
import React, { useState } from 'react';
import { Briefcase, List, Clock, AlertCircle } from 'lucide-react';
import { Position, Order } from '../types';

interface PortfolioPanelProps {
  positions: Position[];
  orders: Order[];
}

const PortfolioPanel: React.FC<PortfolioPanelProps> = ({ positions, orders }) => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ORDERS'>('POSITIONS');

  return (
    <div className="bg-white dark:bg-samp-surface rounded-xl border border-slate-200 dark:border-white/5 flex flex-col h-full overflow-hidden transition-colors duration-300">
        <div className="flex border-b border-slate-200 dark:border-white/5">
            <button 
                onClick={() => setActiveTab('POSITIONS')}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'POSITIONS' ? 'text-slate-900 dark:text-white border-b-2 border-samp-primary bg-slate-50 dark:bg-white/5' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <Briefcase size={14} /> Positions <span className="bg-slate-200 dark:bg-white/10 text-[10px] px-1.5 rounded-full">{positions.length}</span>
            </button>
            <button 
                onClick={() => setActiveTab('ORDERS')}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'ORDERS' ? 'text-slate-900 dark:text-white border-b-2 border-samp-primary bg-slate-50 dark:bg-white/5' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <List size={14} /> Orders <span className="bg-slate-200 dark:bg-white/10 text-[10px] px-1.5 rounded-full">{orders.length}</span>
            </button>
        </div>

        <div className="flex-1 overflow-auto">
            {activeTab === 'POSITIONS' ? (
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0">
                        <tr>
                            <th className="p-3 font-medium">Instrument</th>
                            <th className="p-3 font-medium text-right">Qty.</th>
                            <th className="p-3 font-medium text-right">Avg. Price</th>
                            <th className="p-3 font-medium text-right">LTP</th>
                            <th className="p-3 font-medium text-right">P&L</th>
                            <th className="p-3 font-medium text-center">Product</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {positions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-gray-500">
                                    No active positions. Place an order to get started.
                                </td>
                            </tr>
                        ) : (
                            positions.map((pos, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{pos.symbol}</td>
                                    <td className={`p-3 text-right font-mono ${pos.quantity > 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                                        {pos.quantity}
                                    </td>
                                    <td className="p-3 text-right text-slate-600 dark:text-gray-300 font-mono">₹{pos.avgPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right text-slate-900 dark:text-white font-mono">₹{pos.ltp.toFixed(2)}</td>
                                    <td className={`p-3 text-right font-mono font-bold ${pos.pnl >= 0 ? 'text-samp-success' : 'text-samp-danger'}`}>
                                        {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-gray-400 font-bold">{pos.product}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            ) : (
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-gray-500 sticky top-0">
                        <tr>
                            <th className="p-3 font-medium">Time</th>
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Instrument</th>
                            <th className="p-3 font-medium text-right">Qty.</th>
                            <th className="p-3 font-medium text-right">Price</th>
                            <th className="p-3 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                         {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-gray-500">
                                    No orders found in order book.
                                </td>
                            </tr>
                        ) : (
                            [...orders].reverse().map((order) => (
                                <tr key={order.order_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-slate-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(order.order_timestamp).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.transaction_type === 'BUY' ? 'bg-samp-success/20 text-samp-success' : 'bg-samp-danger/20 text-samp-danger'}`}>
                                            {order.transaction_type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-900 dark:text-white font-medium">{order.symbol}</td>
                                    <td className="p-3 text-right text-slate-900 dark:text-white font-mono">{order.quantity}</td>
                                    <td className="p-3 text-right text-slate-600 dark:text-gray-300 font-mono">₹{order.price.toFixed(2)}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            order.status === 'COMPLETE' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                            order.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                            'bg-red-500/20 text-red-600 dark:text-red-400'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};

export default PortfolioPanel;
