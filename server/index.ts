
import express from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors() as any);
app.use(express.json() as any);

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/', (req, res) => {
  res.send('TradeMind API is running (In-Memory Mode)');
});

// Auth: Upsert User (Sync Google User to DB)
app.post('/api/auth/login', async (req, res) => {
  const { id, email, name, photoURL } = req.body;
  
  try {
    const user = await db.upsertUser(id, email, name, photoURL);
    res.json(user);
  } catch (err) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Stocks for User
app.get('/api/stocks', async (req, res) => {
  const googleId = req.headers['x-user-id'] as string;
  
  if (!googleId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await db.findUserByGoogleId(googleId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const stocks = await db.getStocksByUserId(user.id);
    
    // Transform to frontend format (camelCase)
    const formattedStocks = stocks.map(row => ({
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      buyPrice: row.buy_price,
      quantity: row.quantity,
      currentPrice: row.current_price,
      previousClose: row.current_price, // approximate
      sector: row.sector,
      advice: row.advice
    }));

    res.json(formattedStocks);
  } catch (err) {
    console.error('Error in GET /api/stocks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Stock
app.post('/api/stocks', async (req, res) => {
  const googleId = req.headers['x-user-id'] as string;
  const { symbol, name, buyPrice, quantity, currentPrice, sector, advice } = req.body;

  if (!googleId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await db.findUserByGoogleId(googleId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const row = await db.addStock(user.id, {
      symbol, name, buyPrice, quantity, currentPrice, sector, advice
    });

    const newStock = {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      buyPrice: row.buy_price,
      quantity: row.quantity,
      currentPrice: row.current_price,
      previousClose: row.current_price,
      sector: row.sector,
      advice: row.advice
    };

    res.json(newStock);
  } catch (err) {
    console.error('Error in POST /api/stocks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Stock (e.g. for Advice refresh)
app.put('/api/stocks/:id', async (req, res) => {
  const { id } = req.params;
  const { advice, currentPrice } = req.body;

  try {
    const updated = await db.updateStock(id, { advice, currentPrice });
    if (!updated) {
        return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Return formatted
    res.json({
      id: updated.id,
      symbol: updated.symbol,
      name: updated.name,
      buyPrice: updated.buy_price,
      quantity: updated.quantity,
      currentPrice: updated.current_price,
      previousClose: updated.current_price,
      sector: updated.sector,
      advice: updated.advice
    });
  } catch (err) {
    console.error('Error in PUT /api/stocks/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Stock
app.delete('/api/stocks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.deleteStock(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/stocks/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Transactions
app.get('/api/stocks/:id/transactions', async (req, res) => {
  const { id } = req.params;
  try {
    const transactions = await db.getTransactionsByStockId(id);
    const formatted = transactions.map(t => ({
      id: t.id,
      stockId: t.stock_id,
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      date: t.date
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error in GET /api/stocks/:id/transactions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Transaction (Buy/Sell)
app.post('/api/stocks/:id/transactions', async (req, res) => {
  const { id } = req.params;
  const { type, quantity, price } = req.body;

  try {
    const { transaction, stock } = await db.addTransaction(id, type, quantity, price);
    
    // Return both the new transaction and the updated stock stats
    res.json({
      transaction: {
        id: transaction.id,
        stockId: transaction.stock_id,
        type: transaction.type,
        quantity: transaction.quantity,
        price: transaction.price,
        date: transaction.date
      },
      stock: {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        buyPrice: stock.buy_price,
        quantity: stock.quantity,
        currentPrice: stock.current_price,
        previousClose: stock.current_price,
        sector: stock.sector,
        advice: stock.advice
      }
    });
  } catch (err) {
    console.error('Error in POST /api/stocks/:id/transactions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
