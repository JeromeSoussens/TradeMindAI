
// In-memory simulation of a database
// This allows the app to run without setting up a real PostgreSQL server.

interface DBUser {
  id: string;
  google_id: string;
  email: string;
  name: string;
  photo_url: string;
}

interface DBStock {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  buy_price: number;
  quantity: number;
  current_price: number;
  sector: string;
  advice: any;
  created_at: number;
}

interface DBTransaction {
  id: string;
  stock_id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: number;
}

// In-memory stores
let users: DBUser[] = [];
let stocks: DBStock[] = [];
let transactions: DBTransaction[] = [];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const db = {
  // User Operations
  findUserByGoogleId: async (googleId: string) => {
    return users.find(u => u.google_id === googleId);
  },

  findUserById: async (id: string) => {
    return users.find(u => u.id === id);
  },

  upsertUser: async (googleId: string, email: string, name: string, photoURL: string) => {
    let user = users.find(u => u.google_id === googleId);
    if (user) {
      user.name = name;
      user.photo_url = photoURL;
    } else {
      user = {
        id: generateId(),
        google_id: googleId,
        email,
        name,
        photo_url: photoURL
      };
      users.push(user);
    }
    return user;
  },

  // Stock Operations
  getStocksByUserId: async (userId: string) => {
    return stocks
      .filter(s => s.user_id === userId)
      .sort((a, b) => b.created_at - a.created_at);
  },

  addStock: async (userId: string, data: { symbol: string; name: string; buyPrice: number; quantity: number; currentPrice: number; sector: string; advice: any }) => {
    const stockId = generateId();
    const newStock: DBStock = {
      id: stockId,
      user_id: userId,
      symbol: data.symbol,
      name: data.name,
      buy_price: data.buyPrice,
      quantity: data.quantity,
      current_price: data.currentPrice,
      sector: data.sector,
      advice: data.advice,
      created_at: Date.now()
    };
    stocks.push(newStock);

    // Record initial transaction
    transactions.push({
      id: generateId(),
      stock_id: stockId,
      type: 'BUY',
      quantity: data.quantity,
      price: data.buyPrice,
      date: Date.now()
    });

    return newStock;
  },

  updateStock: async (stockId: string, updates: { advice?: any; currentPrice?: number }) => {
    const stock = stocks.find(s => s.id === stockId);
    if (stock) {
      if (updates.advice) stock.advice = updates.advice;
      if (updates.currentPrice) stock.current_price = updates.currentPrice;
      return stock;
    }
    return null;
  },

  deleteStock: async (stockId: string) => {
    const initialLength = stocks.length;
    stocks = stocks.filter(s => s.id !== stockId);
    // Cleanup transactions
    transactions = transactions.filter(t => t.stock_id !== stockId);
    return stocks.length !== initialLength;
  },

  // Transaction Operations
  getTransactionsByStockId: async (stockId: string) => {
    return transactions
      .filter(t => t.stock_id === stockId)
      .sort((a, b) => b.date - a.date);
  },

  addTransaction: async (stockId: string, type: 'BUY' | 'SELL', quantity: number, price: number) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    // Update Stock Stats
    if (type === 'BUY') {
      // Calculate Weighted Average Buy Price
      const totalCost = (stock.quantity * stock.buy_price) + (quantity * price);
      const totalQty = stock.quantity + quantity;
      stock.buy_price = totalQty > 0 ? totalCost / totalQty : 0;
      stock.quantity = totalQty;
    } else {
      // Sell logic: Reduce quantity, buy price (avg) remains same
      stock.quantity = Math.max(0, stock.quantity - quantity);
    }

    const newTx: DBTransaction = {
      id: generateId(),
      stock_id: stockId,
      type,
      quantity,
      price,
      date: Date.now()
    };
    transactions.push(newTx);

    return { transaction: newTx, stock };
  }
};
