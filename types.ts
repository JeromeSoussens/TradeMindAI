
export type AdviceType = 'BUY' | 'SELL' | 'HOLD' | 'ANALYZING' | 'UNKNOWN';

export interface StockAdvice {
  action: AdviceType;
  reasoning: string;
  confidence: number; // 0-100
  lastUpdated: number;
}

export interface StockPosition {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
  previousClose: number; // Used to calc daily change
  sector: string;
  advice: StockAdvice;
}

export interface Transaction {
  id: string;
  stockId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: number;
}

export interface MarketTrend {
  name: string;
  value: number;
  isUp: boolean;
}
