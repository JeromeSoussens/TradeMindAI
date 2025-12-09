
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
import { useAuth } from './contexts/AuthContext';
import { LayoutDashboard, Plus, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [stocks, setStocks] = useState<StockPosition[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load stocks when user authenticates
  useEffect(() => {
    const fetchStocks = async () => {
      if (user) {
        setIsLoadingData(true);
        const userStocks = await storageService.getUserStocks(user.id);
        setStocks(userStocks);
        setIsLoadingData(false);
      } else {
        setStocks([]);
      }
    };
    fetchStocks();
  }, [user]);

  // Derive selected stock object
  const selectedStock = stocks.find(s => s.id === selectedStockId) || null;

  // Simulate live market updates (Random walk) - In real app, this would also push to DB if we want persistence of price updates
  const refreshPrices = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStocks(prevStocks => prevStocks.map(stock => {
        const volatility = 0.02; // 2% max swing
        const change = 1 + (Math.random() * volatility * 2 - volatility);
        const newPrice = stock.currentPrice * change;
        return {
          ...stock,
          currentPrice: newPrice,
          previousClose: stock.currentPrice // Move previous close to "yesterday's" price (simulated)
        };
      }));
      setIsRefreshing(false);
    }, 800);
  }, []);

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
      previousClose: data.currentPrice,
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden">
      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddStock}
      />
      
      {/* Sidebar (Mobile: Top Bar) */}
      <div className="w-full md:w-20 lg:w-64 flex-shrink-0 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col justify-between p-4 z-10">
        <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-8">
          <div className="flex items-center gap-3 text-blue-500">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-bold text-lg hidden lg:block tracking-tight text-white">TradeMind</span>
          </div>
          
          <nav className="hidden md:flex flex-col gap-2 w-full">
            <button 
              onClick={() => setSelectedStockId(undefined)}
              className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-xl shadow-lg shadow-blue-900/10 border border-slate-700 transition-all hover:bg-slate-750 w-full"
            >
              <LayoutDashboard size={18} className="text-blue-400" />
              <span className="hidden lg:block text-sm font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all w-full"
            >
               <Plus size={18} />
               <span className="hidden lg:block text-sm font-medium">Add Stock</span>
            </button>
          </nav>
        </div>

        <div className="md:hidden">
           <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-2 text-blue-400 bg-blue-500/10 rounded-lg"
            >
               <Plus size={20} />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden relative">
        {/* Header - Z-Index increased to 40 to sit above Detail Panel (z-30) */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
          <h1 className="text-lg font-semibold text-white">Portfolio Overview</h1>
          <div className="flex items-center gap-4">
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
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="md:hidden p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                      >
                        <Plus size={16} />
                      </button>
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
                   <StockDetail stock={selectedStock} onRemove={handleRemoveStock} />
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
