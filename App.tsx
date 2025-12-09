
import React, { useState, useEffect, useCallback } from 'react';
import { StockPosition } from './types';
import { StockTable } from './components/StockTable';
import { PortfolioSummary } from './components/PortfolioSummary';
import { StockDetail } from './components/StockDetail';
import { AddStockModal } from './components/AddStockModal';
import { LoginPage } from './components/LoginPage';
import { UserMenu } from './components/UserMenu';
import { analyzeStockPosition } from './services/geminiService';
import { storageService } from './services/storageService';
import { marketDataService } from './services/marketDataService';
import { useAuth } from './contexts/AuthContext';
import { LayoutDashboard, Plus, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [stocks, setStocks] = useState<StockPosition[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchStocks = useCallback(async () => {
    if (user) {
      setIsLoadingData(true);
      const userStocks = await storageService.getUserStocks(user.id);
      setStocks(userStocks);
      setIsLoadingData(false);
    } else {
      setStocks([]);
    }
  }, [user]);

  // Load stocks when user authenticates
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Derive selected stock object
  const selectedStock = stocks.find(s => s.id === selectedStockId) || null;

  // Real Market Update
  const refreshPrices = useCallback(async () => {
    setIsRefreshing(true);
    
    // Create updated stocks array promise
    const updates = await Promise.all(stocks.map(async (stock) => {
      const quote = await marketDataService.getQuote(stock.symbol);
      if (quote) {
        // Optimistically update stock in DB too, in a real app you might batch this
        // but since we are simulating DB or using light server, this is okay for now.
        // NOTE: We do not await this to keep UI snappy
        storageService.updateStock(stock.id, { currentPrice: quote.c, previousClose: quote.pc });
        
        return {
          ...stock,
          currentPrice: quote.c,
          previousClose: quote.pc
        };
      }
      return stock;
    }));

    setStocks(updates);
    setIsRefreshing(false);
  }, [stocks]);

  // Update AI advice for a specific stock
  const refreshAdvice = async (stock: StockPosition) => {
    // Optimistic update to show loading
    setStocks(prev => prev.map(s => 
      s.id === stock.id 
        ? { ...s, advice: { ...s.advice, action: 'ANALYZING', reasoning: 'Consulting Gemini...', confidence: 0 } }
        : s
    ));

    const newAdvice = await analyzeStockPosition(
      stock.symbol,
      stock.buyPrice,
      stock.currentPrice,
      stock.sector
    );

    // Save update to DB
    await storageService.updateStock(stock.id, { advice: newAdvice, currentPrice: stock.currentPrice });

    setStocks(prev => prev.map(s => 
      s.id === stock.id ? { ...s, advice: newAdvice } : s
    ));
  };

  const handleAddStock = async (data: { symbol: string; name: string; buyPrice: number; quantity: number; currentPrice: number; sector: string }) => {
    if (!user) return;

    const stockPayload: StockPosition = {
      id: '', // DB generates ID
      symbol: data.symbol,
      name: data.name,
      buyPrice: data.buyPrice,
      quantity: data.quantity,
      currentPrice: data.currentPrice,
      previousClose: data.currentPrice, // Initially same until refresh
      sector: data.sector,
      advice: {
        action: 'ANALYZING',
        reasoning: 'Initial analysis pending...',
        confidence: 0,
        lastUpdated: Date.now()
      }
    };

    // Save to DB first to get ID
    const savedStock = await storageService.addStock(user.id, stockPayload);
    
    if (savedStock) {
      setStocks(prev => [savedStock, ...prev]);
      // Trigger initial analysis
      refreshAdvice(savedStock);
    }
  };

  const handleRemoveStock = async (id: string) => {
    // Optimistic UI update
    setStocks(prev => prev.filter(s => s.id !== id));
    
    // DB Update
    await storageService.deleteStock(id);

    if (selectedStockId === id) {
      setSelectedStockId(undefined);
    }
  };

  // Called when a transaction happens in Detail View to reload portfolio values
  const handleStockUpdate = async () => {
    if (user) {
       const userStocks = await storageService.getUserStocks(user.id);
       setStocks(userStocks);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden">
      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddStock}
      />
      
      {/* Header - Z-Index increased to 40 to sit above Detail Panel (z-30) */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 text-blue-500">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white hidden sm:block">TradeMind</span>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
           >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Stock</span>
           </button>
           
           <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

           <button 
             onClick={refreshPrices}
             disabled={isRefreshing}
             className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-700 transition-all disabled:opacity-50"
           >
             <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
             <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Update Prices'}</span>
           </button>
           
           <div className="h-6 w-px bg-slate-800 mx-1"></div>
           <UserMenu />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden">
          {isLoadingData ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div className="h-full flex flex-col md:flex-row">
              
              {/* Left Column: Summary & Table */}
              <div className={`flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth ${selectedStockId ? 'hidden md:block' : 'block'}`}>
                <PortfolioSummary stocks={stocks} />
                
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-12">
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-200">Holdings</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        {stocks.length} Assets
                      </span>
                    </div>
                  </div>
                  {stocks.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <p className="mb-4">No stocks in your portfolio.</p>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
                      >
                        Add your first stock
                      </button>
                    </div>
                  ) : (
                    <StockTable 
                      stocks={stocks} 
                      onSelectStock={(s) => setSelectedStockId(s.id)} 
                      selectedStockId={selectedStockId}
                      onRefreshAdvice={refreshAdvice}
                      onRemoveStock={handleRemoveStock}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Detail Panel */}
              <div className={`w-full md:w-[400px] lg:w-[450px] bg-slate-900 z-30 transition-all duration-300 ease-in-out absolute md:relative inset-0 md:inset-auto transform ${selectedStockId ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 lg:w-0 border-l-0 opacity-0 md:opacity-100'}`}>
                 <div className="h-full relative">
                   {/* Mobile Close Button */}
                   <button 
                     onClick={() => setSelectedStockId(undefined)}
                     className="md:hidden absolute top-4 right-4 z-50 p-2 bg-slate-800 rounded-full text-slate-400"
                   >
                     ✕
                   </button>
                   <StockDetail 
                     stock={selectedStock} 
                     onRemove={handleRemoveStock} 
                     onUpdate={handleStockUpdate} 
                   />
                 </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
