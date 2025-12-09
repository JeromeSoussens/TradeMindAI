import React from 'react';
import { AdviceType } from '../types';
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';

interface AdviceBadgeProps {
  type: AdviceType;
  confidence?: number;
  className?: string;
}

export const AdviceBadge: React.FC<AdviceBadgeProps> = ({ type, confidence, className = '' }) => {
  const getStyle = () => {
    switch (type) {
      case 'BUY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SELL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'HOLD':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ANALYZING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'BUY': return <TrendingUp size={14} className="mr-1.5" />;
      case 'SELL': return <TrendingDown size={14} className="mr-1.5" />;
      case 'HOLD': return <Minus size={14} className="mr-1.5" />;
      case 'ANALYZING': return <Loader2 size={14} className="mr-1.5 animate-spin" />;
      default: return <AlertCircle size={14} className="mr-1.5" />;
    }
  };

  return (
    <div className={`flex items-center px-2.5 py-1 rounded-full border text-xs font-medium tracking-wide w-fit ${getStyle()} ${className}`}>
      {getIcon()}
      <span>{type}</span>
      {confidence && type !== 'ANALYZING' && (
        <span className="ml-2 pl-2 border-l border-current opacity-70">
          {confidence}%
        </span>
      )}
    </div>
  );
};