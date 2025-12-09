import React, { useMemo } from 'react';
import { StockPosition } from '../types';
import { AdviceBadge } from './AdviceBadge';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { BrainCircuit, DollarSign, Wallet, Activity, Trash2 } from 'lucide-react';

interface StockDetailProps {
  stock: StockPosition | null;
  onRemove: (id: string) => void;
}

export const StockDetail: React.FC<StockDetailProps> = ({ stock, onRemove }) => {
  if (!stock) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center border-l border-slate-800">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Activity size={32} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">Market Analysis</h3>
        <p className="text-sm max-w-xs">Select a stock from your portfolio to view detailed AI analysis and performance metrics.</p>
      </div>
    );
  }

  const profit = (stock.currentPrice - stock.buyPrice) * stock.quantity;
  const isProfit = profit >= 0;

  // Simulated Volume Data
  const volumeData = useMemo(() => [
    { name: '10:00', vol: 4000 },
    { name: '11:00', vol: 3000 },
    { name: '12:00', vol: 2000 },
    { name: '13:00', vol: 2780 },
    { name: '14:00', vol: 1890 },
    { name: '15:00', vol: 2390 },
    { name: '16:00', vol: 3490 },
  ], [stock.id]);

  return (
    <div className="h-full flex flex-col border-l border-slate-800 bg-slate-900/50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{stock.symbol}</h2>
            <p className="text-slate-400 text-sm">{stock.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => onRemove(stock.id)}
              className="p-2 -mr-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Remove Position"
            >
              <Trash2 size={18} />
            </button>
            <div className="text-right">
              <div className="text-2xl font-mono text-white">${stock.currentPrice.toFixed(2)}</div>
              <div className={`text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {isProfit ? '+' : ''}{profit.toFixed(2)} ({((profit / (stock.buyPrice * stock.quantity)) * 100).toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">{stock.sector}</span>
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">{stock.quantity} Shares</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
             <BrainCircuit size={18} className="text-blue-400" />
             <h3 className="text-sm font-semibold text-slate-200">AI Analyst Insight</h3>
          </div>
          <AdviceBadge type={stock.advice.action} confidence={stock.advice.confidence} className="mb-2" />
          <p className="text-sm text-slate-300 leading-relaxed">
            {stock.advice.reasoning}
          </p>
          <div className="mt-3 text-[10px] text-slate-500 flex justify-between">
            <span>Model: Gemini 2.5 Flash</span>
            <span>Updated: {new Date(stock.advice.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4">Key Stats</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
               <DollarSign size={12} /> Buy Price
             </div>
             <div className="text-lg font-mono text-slate-200">${stock.buyPrice.toFixed(2)}</div>
           </div>
           <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
               <Wallet size={12} /> Total Value
             </div>
             <div className="text-lg font-mono text-slate-200">${(stock.currentPrice * stock.quantity).toFixed(2)}</div>
           </div>
        </div>

        <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4">Intraday Volume</h4>
        <div className="h-40 w-full mb-4">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={volumeData}>
               <Bar dataKey="vol" radius={[4, 4, 0, 0]}>
                 {volumeData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} fillOpacity={0.6} />
                 ))}
               </Bar>
               <Tooltip 
                 cursor={{fill: 'transparent'}}
                 contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
               />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};