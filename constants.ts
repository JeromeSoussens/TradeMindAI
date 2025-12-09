import { StockPosition } from './types';

export const MOCK_STOCKS: StockPosition[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    buyPrice: 150.00,
    quantity: 10,
    currentPrice: 175.50,
    previousClose: 172.00,
    sector: 'Technology',
    advice: { action: 'HOLD', reasoning: 'Strong momentum, but approaching resistance levels.', confidence: 75, lastUpdated: Date.now() }
  },
  {
    id: '2',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    buyPrice: 240.00,
    quantity: 5,
    currentPrice: 210.25,
    previousClose: 215.00,
    sector: 'Automotive',
    advice: { action: 'HOLD', reasoning: 'Volatility high. Wait for stabilization before adding.', confidence: 60, lastUpdated: Date.now() }
  },
  {
    id: '3',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    buyPrice: 400.00,
    quantity: 8,
    currentPrice: 850.00,
    previousClose: 830.00,
    sector: 'Semiconductors',
    advice: { action: 'SELL', reasoning: 'Massive gains realized. Consider taking partial profits.', confidence: 85, lastUpdated: Date.now() }
  },
  {
    id: '4',
    symbol: 'AMZN',
    name: 'Amazon.com',
    buyPrice: 130.00,
    quantity: 15,
    currentPrice: 145.00,
    previousClose: 144.50,
    sector: 'Consumer Cyclical',
    advice: { action: 'BUY', reasoning: 'Undervalued relative to recent sector growth.', confidence: 70, lastUpdated: Date.now() }
  },
  {
    id: '5',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    buyPrice: 310.00,
    quantity: 12,
    currentPrice: 410.00,
    previousClose: 405.00,
    sector: 'Technology',
    advice: { action: 'HOLD', reasoning: 'Consistent performer with strong AI tailwinds.', confidence: 90, lastUpdated: Date.now() }
  },
  {
    id: '6',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    buyPrice: 140.00,
    quantity: 20,
    currentPrice: 138.00,
    previousClose: 139.00,
    sector: 'Technology',
    advice: { action: 'BUY', reasoning: 'Trading at a discount. Good entry point.', confidence: 80, lastUpdated: Date.now() }
  }
];