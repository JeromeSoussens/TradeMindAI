import React from 'react';
import { StockPosition } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface PortfolioSummaryProps {
  stocks: StockPosition[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ stocks }) => {
  const totalValue = stocks.reduce((acc, stock) => acc + (stock.currentPrice * stock.quantity), 0);
  const totalBuyCost = stocks.reduce((acc, stock) => acc + (stock.buyPrice * stock.quantity), 0);
  const totalPL = totalValue - totalBuyCost;
  const isPositive = totalPL >= 0;

  // Data for Sector Allocation Pie Chart
  const sectorDataMap = stocks.reduce((acc, stock) => {
    const value = stock.currentPrice * stock.quantity;
    acc[stock.sector] = (acc[stock.sector] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const sectorData = Object.keys(sectorDataMap).map(sector => ({
    name: sector,
    value: sectorDataMap[sector]
  }));

  // Mock Data for Area Chart (Portfolio History) - Just simulated based on current total
  const historyData = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const randomFactor = 0.95 + Math.random() * 0.1; 
    return {
      date: day.toLocaleDateString('en-US', { weekday: 'short' }),
      value: Math.floor(totalValue * randomFactor)
    };
  });
  // Force last point to match current
  historyData[6].value = Math.floor(totalValue);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Balance Card */}
      <div className="md:col-span-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">Total Balance</h3>
        <div className="text-3xl font-bold text-white mb-2">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span className="font-medium bg-slate-900/50 px-2 py-0.5 rounded mr-2">
            {totalPL > 0 ? '+' : ''}{totalPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          <span>{isPositive ? 'All Time Profit' : 'All Time Loss'}</span>
        </div>
      </div>

      {/* Mini Charts Container */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Allocation */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg flex items-center justify-between">
           <div className="h-full flex flex-col justify-center">
             <h4 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Allocation</h4>
             <ul className="text-xs space-y-1">
               {sectorData.slice(0,3).map((s, i) => (
                 <li key={s.name} className="flex items-center text-slate-300">
                   <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                   {s.name}
                 </li>
               ))}
             </ul>
           </div>
           <div className="h-24 w-24">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Performance Graph */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg">
          <h4 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">7 Day Trend</h4>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};