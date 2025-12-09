import React from 'react';
import { StockPosition } from '../types';
import { AdviceBadge } from './AdviceBadge';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

interface StockTableProps {
  stocks: StockPosition[];
  onSelectStock: (stock: StockPosition) => void;
  selectedStockId?: string;
  onRefreshAdvice: (stock: StockPosition) => void;
  onRemoveStock: (stockId: string) => void;
}

export const StockTable: React.FC<StockTableProps> = ({ stocks, onSelectStock, selectedStockId, onRefreshAdvice, onRemoveStock }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <th className="p-4 font-medium">Ticker</th>
            <th className="p-4 font-medium text-right">Price</th>
            <th className="p-4 font-medium text-right">Day Chg</th>
            <th className="p-4 font-medium text-right">Total P/L</th>
            <th className="p-4 font-medium">AI Advice</th>
            <th className="p-4 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-800/50">
          {stocks.map((stock) => {
            const dailyChange = stock.currentPrice - stock.previousClose;
            const dailyChangePercent = (dailyChange / stock.previousClose) * 100;
            const totalPL = (stock.currentPrice - stock.buyPrice) * stock.quantity;
            const totalPLPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;

            const isDayPositive = dailyChange >= 0;
            const isTotalPositive = totalPL >= 0;

            const isSelected = selectedStockId === stock.id;

            return (
              <tr 
                key={stock.id} 
                className={`group transition-colors cursor-pointer hover:bg-slate-800/50 ${isSelected ? 'bg-slate-800/80 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
                onClick={() => onSelectStock(stock)}
              >
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{stock.symbol}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</span>
                  </div>
                </td>
                <td className="p-4 text-right font-mono text-slate-200">
                  ${stock.currentPrice.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <div className={`flex items-center justify-end font-mono ${isDayPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isDayPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {Math.abs(dailyChangePercent).toFixed(2)}%
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className={`flex flex-col items-end font-mono ${isTotalPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>{totalPL > 0 ? '+' : ''}{totalPL.toFixed(2)}</span>
                    <span className="text-xs opacity-70">{totalPLPercent > 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <AdviceBadge type={stock.advice.action} confidence={stock.advice.confidence} />
                    <span className="text-[10px] text-slate-500 line-clamp-1">{stock.advice.reasoning}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefreshAdvice(stock);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Re-analyze with AI"
                    >
                       {stock.advice.action === 'ANALYZING' ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(stock.id);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Remove from portfolio"
                    >
                       <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};