
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { StockPosition } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockPosition | null;
  initialType?: 'BUY' | 'SELL';
  onConfirm: (type: 'BUY' | 'SELL', quantity: number, price: number) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, stock, initialType = 'BUY', onConfirm }) => {
  const [type, setType] = useState<'BUY' | 'SELL'>(initialType);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(stock?.currentPrice || 0);
  const [loading, setLoading] = useState(false);

  // Reset or initialize values when modal opens or stock changes
  useEffect(() => {
    if (stock && isOpen) {
      setPrice(stock.currentPrice);
      setType(initialType);
    }
  }, [stock, isOpen, initialType]);

  if (!isOpen || !stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(type, quantity, price);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Record Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setType('BUY')}
              className={`py-2 text-sm font-medium rounded-md transition-all ${
                type === 'BUY' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType('SELL')}
              className={`py-2 text-sm font-medium rounded-md transition-all ${
                type === 'SELL' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-medium text-slate-400 uppercase">Quantity</label>
             <input
                type="number"
                required
                min="0.0001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
             />
          </div>

          <div className="space-y-1">
             <label className="text-xs font-medium text-slate-400 uppercase">Price per Share ($)</label>
             <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
             />
          </div>

          {type === 'SELL' && (
             <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
               <div className="flex justify-between text-sm text-slate-400">
                  <span>Available:</span>
                  <span className="text-white font-mono">{stock.quantity}</span>
               </div>
             </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Check size={16} />
                  Confirm {type}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
