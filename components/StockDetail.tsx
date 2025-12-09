
import React, { useMemo, useEffect, useState } from 'react';
import { StockPosition, Transaction } from '../types';
import { AdviceBadge } from './AdviceBadge';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BrainCircuit, DollarSign, Wallet, Activity, Trash2, History, Plus, Minus, TrendingUp } from 'lucide-react';
import { storageService } from '../services/storageService';
import { marketDataService } from '../services/marketDataService';
import { TransactionModal } from './TransactionModal';
import { useAuth } from '../contexts/AuthContext';

interface StockDetailProps {
  stock: StockPosition | null;
  onRemove: (id: string) => void;
  onUpdate: () => void; // Trigger refresh of main list
}

export const StockDetail: React.FC<StockDetailProps> = ({ stock, onRemove, onUpdate }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [txModalType, setTxModalType] = useState<'BUY' | 'SELL' | null>(null);
  
  // Chart Data State
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Load transactions when stock ID changes
  useEffect(() => {
    if (stock?.id) {
      setLoadingHistory(true);
      storageService.getTransactions(stock.id).then(data => {
        setTransactions(data);
        setLoadingHistory(false);
      });
    } else {
      setTransactions([]);
    }
  }, [stock?.id]);

  // Load Real Historical Data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!stock) return;
      setIsLoadingChart(true);
      
      // Calculate timestamps for last 365 days
      const to = Math.floor(Date.now() / 1000);
      const from = to - (365 * 24 * 60 * 60);

      const history = await marketDataService.getHistory(stock.symbol, 'D', from, to);
      
      if (history && history.c && history.t) {
        const data = history.t.map((timestamp, index) => ({
          timestamp,
          date: new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: history.c[index]
        }));

        // Calculate Moving Averages
        const dataWithMA = data.map((point, index, array) => {
          let ma50 = null;
          let ma200 = null;

          // Calculate MM50
          if (index >= 49) {
            const slice = array.slice(index - 49, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
            ma50 = sum / 50;
          }

          // Calculate MM200
          if (index >= 199) {
            const slice = array.slice(index - 199, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
            ma200 = sum / 200;
          }

          return { ...point, ma50, ma200 };
        });

        // Slice to show roughly last 90 days for better visual initially
        setChartData(dataWithMA.slice(-90));
      } else {
        setChartData([]);
      }
      setIsLoadingChart(false);
    };

    fetchHistory();
  }, [stock?.symbol]);

  const handleTransaction = async (type: 'BUY' | 'SELL', quantity: number, price: number) => {
    if (!stock) return;
    
    // Pass user.id to support fallback mechanism if API is down
    const result = await storageService.addTransaction(stock.id, type, quantity, price, user?.id);
    
    if (result) {
      // Prepend new transaction to UI list
      setTransactions(prev => [result.transaction, ...prev]);
      // Notify parent to refresh stock list (update quantity/avg price)
      onUpdate(); 
    }
  };

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

  return (
    <div className="h-full flex flex-col border-l border-slate-800 bg-slate-900/50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{stock.symbol}</h2>
            <p className="text-slate-400 text-sm">{stock.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
               <button 
                 onClick={() => setTxModalType('BUY')}
                 className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded transition-colors flex items-center gap-1"
               >
                 <Plus size={12} /> Buy
               </button>
               <button 
                 onClick={() => setTxModalType('SELL')}
                 className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium rounded transition-colors flex items-center gap-1"
               >
                 <Minus size={12} /> Sell
               </button>
               <button 
                onClick={() => onRemove(stock.id)}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all ml-1"
                title="Remove Position"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="text-right mt-2">
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

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm">
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

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Price Chart Section */}
        <div className="mb-6">
          <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Price History (Last 90 Days)
          </h4>
          <div className="h-56 w-full bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden pt-4 pr-4 flex items-center justify-center">
             {isLoadingChart ? (
               <div className="flex flex-col items-center gap-2 text-slate-500">
                 <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-xs">Loading market data...</span>
               </div>
             ) : chartData.length === 0 ? (
               <span className="text-xs text-slate-500">No data available for this symbol.</span>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={chartData}>
                   <defs>
                     <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis 
                     dataKey="date" 
                     tick={{fontSize: 10, fill: '#64748b'}} 
                     axisLine={false} 
                     tickLine={false}
                     minTickGap={30}
                   />
                   <YAxis 
                     domain={['auto', 'auto']} 
                     tick={{fontSize: 10, fill: '#64748b'}} 
                     axisLine={false} 
                     tickLine={false}
                     tickFormatter={(val) => `$${val.toFixed(0)}`}
                     width={40}
                   />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                     itemStyle={{ color: '#f8fafc' }}
                     labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                     formatter={(value: number, name: string) => {
                        if (name === 'price') return [`$${value.toFixed(2)}`, 'Price'];
                        if (name === 'ma50') return [`$${value.toFixed(2)}`, 'MM50'];
                        if (name === 'ma200') return [`$${value.toFixed(2)}`, 'MM200'];
                        return [value, name];
                     }}
                   />
                   <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                      iconSize={8}
                      formatter={(value) => {
                        if (value === 'price') return 'Price';
                        if (value === 'ma50') return 'MM50';
                        if (value === 'ma200') return 'MM200';
                        return value;
                      }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="price" 
                     stroke="#3b82f6" 
                     strokeWidth={2}
                     fillOpacity={1} 
                     fill="url(#colorPrice)" 
                   />
                   <Line type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                   <Line type="monotone" dataKey="ma200" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                 </ComposedChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4">Position Stats</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
               <DollarSign size={12} /> Avg. Buy Price
             </div>
             <div className="text-lg font-mono text-slate-200">${stock.buyPrice.toFixed(2)}</div>
           </div>
           <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
               <Wallet size={12} /> Market Value
             </div>
             <div className="text-lg font-mono text-slate-200">${(stock.currentPrice * stock.quantity).toFixed(2)}</div>
           </div>
        </div>

        <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider mb-4 flex items-center gap-2">
          <History size={12} /> Transaction History
        </h4>
        <div className="space-y-2 mb-8">
           {loadingHistory ? (
             <div className="text-center py-4 text-xs text-slate-500">Loading history...</div>
           ) : transactions.length === 0 ? (
             <div className="text-center py-4 text-xs text-slate-600 italic">No history found</div>
           ) : (
             transactions.map(tx => (
               <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg border border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'BUY' ? 'B' : 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-300">{tx.type}</div>
                      <div className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-slate-200">{tx.quantity} @ ${tx.price.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Total: ${(tx.quantity * tx.price).toFixed(2)}</div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      <TransactionModal 
        isOpen={!!txModalType} 
        onClose={() => setTxModalType(null)} 
        stock={stock}
        initialType={txModalType || 'BUY'}
        onConfirm={handleTransaction}
      />
    </div>
  );
};
