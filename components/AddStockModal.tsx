
import React, { useState } from 'react';
import { X, Check, Search, Loader2 } from 'lucide-react';
import { marketDataService } from '../services/marketDataService';

interface AddStockData {
  symbol: string;
  name: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
  sector: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddStockData) => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<AddStockData>({
    symbol: '',
    name: '',
    buyPrice: 0,
    quantity: 1,
    currentPrice: 0,
    sector: 'Technology'
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'buyPrice' || name === 'quantity' || name === 'currentPrice' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleLookup = async () => {
    if (!formData.symbol) return;
    setError('');
    setIsLookingUp(true);

    // Parallel fetch for profile and quote
    const [profile, quote] = await Promise.all([
      marketDataService.getProfile(formData.symbol),
      marketDataService.getQuote(formData.symbol)
    ]);
    
    if (profile && quote) {
      setFormData(prev => ({
        ...prev,
        name: profile.name,
        currentPrice: quote.c,
        buyPrice: quote.c, // Default buy price to current price for convenience
        sector: profile.finnhubIndustry || 'Technology'
      }));
    } else {
      setError('Symbol not found or data unavailable');
    }
    setIsLookingUp(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    // Reset form
    setFormData({
      symbol: '',
      name: '',
      buyPrice: 0,
      quantity: 1,
      currentPrice: 0,
      sector: 'Technology'
    });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Add New Position</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Symbol</label>
              <div className="relative">
                <input
                  type="text"
                  name="symbol"
                  required
                  placeholder="e.g. AAPL"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  onBlur={() => { if(formData.symbol && !formData.name) handleLookup() }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={isLookingUp || !formData.symbol}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-400 disabled:opacity-50 transition-colors"
                  title="Auto-fill details"
                >
                  {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Sector</label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Automotive">Automotive</option>
                <option value="Consumer">Consumer</option>
                <option value="Energy">Energy</option>
                <option value="Industrial">Industrial</option>
                <option value="Crypto">Crypto</option>
                <option value="Utilities">Utilities</option>
                <option value="Real Estate">Real Estate</option>
              </select>
            </div>
          </div>
          
          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Company Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Apple Inc."
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Buy Price ($)</label>
              <input
                type="number"
                name="buyPrice"
                required
                min="0.01"
                step="0.01"
                value={formData.buyPrice || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Quantity</label>
              <input
                type="number"
                name="quantity"
                required
                min="0.0001"
                step="any"
                value={formData.quantity || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

           <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase">Current Market Price ($)</label>
              <input
                type="number"
                name="currentPrice"
                required
                min="0.01"
                step="0.01"
                value={formData.currentPrice || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
               <p className="text-[10px] text-slate-500">Used to calculate initial P/L.</p>
            </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLookingUp}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              Add Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
