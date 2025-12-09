
import { StockPosition, Transaction } from '../types';

const API_URL = 'http://localhost:3001/api';
const LOCAL_STORAGE_KEY = 'trademind_stocks_fallback';

// Helper to simulate DB ID generation for local fallback
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Local Storage Fallback Implementation
const localStore = {
  getStocks: (userId: string): StockPosition[] => {
    try {
      const data = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  saveStocks: (userId: string, stocks: StockPosition[]) => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(stocks));
  },
  addStock: (userId: string, stock: StockPosition): StockPosition => {
    const stocks = localStore.getStocks(userId);
    const newStock = { ...stock, id: generateId() };
    stocks.unshift(newStock);
    localStore.saveStocks(userId, stocks);
    return newStock;
  },
  updateStock: (userId: string, stockId: string, updates: Partial<StockPosition>) => {
    const stocks = localStore.getStocks(userId);
    const updated = stocks.map(s => s.id === stockId ? { ...s, ...updates } : s);
    localStore.saveStocks(userId, updated);
  },
  deleteStock: (userId: string, stockId: string) => {
    const stocks = localStore.getStocks(userId);
    const filtered = stocks.filter(s => s.id !== stockId);
    localStore.saveStocks(userId, filtered);
  },
  
  // Transaction Fallbacks
  getTransactions: (stockId: string): Transaction[] => {
    try {
      const data = localStorage.getItem(`${LOCAL_STORAGE_KEY}_tx_${stockId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  saveTransactions: (stockId: string, txs: Transaction[]) => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_tx_${stockId}`, JSON.stringify(txs));
  },
  addTransaction: (userId: string, stockId: string, type: 'BUY' | 'SELL', quantity: number, price: number) => {
    const stocks = localStore.getStocks(userId);
    const stockIndex = stocks.findIndex(s => s.id === stockId);
    if (stockIndex === -1) return null;

    const stock = stocks[stockIndex];

    // Update Stock Stats Logic (Mirrors Backend)
    if (type === 'BUY') {
      const totalCost = (stock.quantity * stock.buyPrice) + (quantity * price);
      const totalQty = stock.quantity + quantity;
      stock.buyPrice = totalQty > 0 ? totalCost / totalQty : 0;
      stock.quantity = totalQty;
    } else {
      stock.quantity = Math.max(0, stock.quantity - quantity);
    }
    
    // Save updated stock
    stocks[stockIndex] = stock;
    localStore.saveStocks(userId, stocks);

    // Create and save transaction
    const txs = localStore.getTransactions(stockId);
    const newTx: Transaction = {
      id: generateId(),
      stockId,
      type,
      quantity,
      price,
      date: Date.now()
    };
    txs.unshift(newTx);
    localStore.saveTransactions(stockId, txs);

    return { transaction: newTx, stock };
  }
};

export const storageService = {
  /**
   * Sync User with Backend (Fire and Forget with fallback log)
   */
  syncUser: async (user: any) => {
    try {
      await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.warn('Backend unavailable (syncUser), skipping sync.', error);
    }
  },

  /**
   * Retrieve stocks
   */
  getUserStocks: async (userId: string): Promise<StockPosition[]> => {
    try {
      const response = await fetch(`${API_URL}/stocks`, {
        headers: { 'x-user-id': userId }
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable (getUserStocks), falling back to local storage.');
      return localStore.getStocks(userId);
    }
  },

  /**
   * Add a stock
   */
  addStock: async (userId: string, stock: StockPosition): Promise<StockPosition | null> => {
    try {
      const response = await fetch(`${API_URL}/stocks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(stock)
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable (addStock), saving locally.');
      return localStore.addStock(userId, stock);
    }
  },

  updateStock: async (stockId: string, updates: Partial<StockPosition>): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn('Backend unavailable (updateStock). Local update not fully supported without ID context.');
      // Attempt generic fallback
      const key = Object.keys(localStorage).find(k => k.startsWith(LOCAL_STORAGE_KEY) && localStorage.getItem(k)?.includes(stockId));
      if (key) {
        const userId = key.replace(`${LOCAL_STORAGE_KEY}_`, '');
        localStore.updateStock(userId, stockId, updates);
      }
    }
  },

  deleteStock: async (stockId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn('Backend unavailable (deleteStock), deleting locally.');
      const key = Object.keys(localStorage).find(k => k.startsWith(LOCAL_STORAGE_KEY) && localStorage.getItem(k)?.includes(stockId));
      if (key) {
        const userId = key.replace(`${LOCAL_STORAGE_KEY}_`, '');
        localStore.deleteStock(userId, stockId);
      }
    }
  },

  /**
   * Transaction Methods
   */
  getTransactions: async (stockId: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}/transactions`);
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable (getTransactions), using local fallback.');
      return localStore.getTransactions(stockId);
    }
  },

  addTransaction: async (stockId: string, type: 'BUY' | 'SELL', quantity: number, price: number, userId?: string): Promise<{ transaction: Transaction, stock: StockPosition } | null> => {
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity, price })
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable (addTransaction), using local fallback.');
      if (userId) {
        return localStore.addTransaction(userId, stockId, type, quantity, price);
      }
      return null;
    }
  }
};
