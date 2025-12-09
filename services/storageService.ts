
import { StockPosition } from '../types';

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
    // Note: We need userId for local fallback. In a real app we might store userId in a context service wrapper.
    // For this fix, we assume we might fail silently locally if we don't have the userId context here, 
    // OR we iterate all keys (messy). 
    // Ideally, pass userId to updateStock. For now, we attempt API, fail is just log if we can't find local.
    
    try {
      const response = await fetch(`${API_URL}/stocks/${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      console.warn('Backend unavailable (updateStock). Local update requires User ID (not provided in this signature).');
      // If we really needed local fallback for update, we'd need to change the function signature or store current User ID in this service.
      // For now, let's try to find the stock in any local key for fallback (simplified)
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
  }
};
