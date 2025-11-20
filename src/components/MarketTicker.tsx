import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: number;
  change: number; // Percentage change
  isUp: boolean;
}

// Forex Data Only (No Crypto)
const forexPairs: TickerItem[] = [
  { symbol: 'XAU/USD', price: 2035.50, change: 0.45, isUp: true }, // Gold
  { symbol: 'EUR/USD', price: 1.0845, change: -0.12, isUp: false },
  { symbol: 'GBP/USD', price: 1.2630, change: 0.25, isUp: true },
  { symbol: 'USD/JPY', price: 148.15, change: 0.10, isUp: true },
  { symbol: 'USD/CHF', price: 0.8650, change: -0.05, isUp: false },
  { symbol: 'AUD/USD', price: 0.6580, change: 0.30, isUp: true },
  { symbol: 'USD/CAD', price: 1.3490, change: -0.15, isUp: false },
  { symbol: 'NZD/USD', price: 0.6120, change: 0.18, isUp: true },
  { symbol: 'EUR/GBP', price: 0.8560, change: -0.08, isUp: false },
  { symbol: 'EUR/JPY', price: 160.50, change: 0.12, isUp: true },
  { symbol: 'XAG/USD', price: 22.40, change: 0.80, isUp: true }, // Silver
  { symbol: 'WTI/USD', price: 74.50, change: -0.50, isUp: false }, // Oil
];

export const MarketTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>(forexPairs);

  useEffect(() => {
    // Simulate live market updates
    const interval = setInterval(() => {
      setItems(prevItems => prevItems.map(item => {
        // Random fluctuation
        const fluctuation = (Math.random() - 0.5) * 0.001; 
        const newPrice = item.price * (1 + fluctuation);
        
        // Update change percentage slightly
        const newChange = item.change + (Math.random() - 0.5) * 0.02;
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          isUp: newChange >= 0
        };
      }));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Duplicate items exactly once to create a seamless loop with translateX(-50%)
  const displayItems = [...items, ...items];

  const formatPrice = (symbol: string, price: number) => {
    if (symbol.includes('JPY')) return price.toFixed(2);
    if (symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('WTI')) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <div className="w-full h-full flex items-center overflow-hidden relative bg-transparent" dir="ltr">
      {/* Gradient Masks for smooth fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none"></div>

      {/* Scrolling Container */}
      <div className="flex animate-scroll will-change-transform items-center min-w-max hover:[animation-play-state:paused]">
        {displayItems.map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center mx-6 select-none">
            
            {/* Symbol Section */}
            <span className="text-gray-400 font-bold text-xs tracking-wider uppercase mr-3 font-mono">
                {item.symbol}
            </span>

            {/* Price & Icon Section */}
            <div className={`flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${item.isUp ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
               {item.isUp ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
               <span className="font-mono tracking-wide">{formatPrice(item.symbol, item.price)}</span>
            </div>

            {/* Vertical Separator */}
            <div className="ml-6 h-4 w-[1px] bg-white/10"></div>

          </div>
        ))}
      </div>
      
      {/* Live Indicator */}
      <div className="absolute left-4 z-20 flex items-center gap-1.5 bg-navy-950/80 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/20 shadow-lg">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] text-green-500 font-bold tracking-widest">LIVE</span>
      </div>
    </div>
  );
};
