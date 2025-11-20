import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
  flash?: 'green' | 'red' | null;
}

export const MarketTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([
    { symbol: 'XAU/USD', price: '2034.50', change: '+1.2%', isUp: true },
    { symbol: 'BTC/USD', price: '42150.00', change: '+0.5%', isUp: true },
    { symbol: 'EUR/USD', price: '1.0950', change: '-0.1%', isUp: false },
    { symbol: 'GBP/USD', price: '1.2730', change: '+0.2%', isUp: true },
    { symbol: 'ETH/USD', price: '2250.80', change: '-0.8%', isUp: false },
    { symbol: 'SOL/USD', price: '105.20', change: '+3.4%', isUp: true },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => {
        if (Math.random() > 0.7) {
          const move = (Math.random() - 0.5) * (item.symbol.includes('BTC') ? 50 : 0.1);
          const currentPrice = parseFloat(item.price.replace(',', ''));
          const newPrice = (currentPrice + move).toFixed(item.symbol.includes('USD') && !item.symbol.includes('BTC') ? 4 : 2);
          const isUp = move > 0;
          return {
            ...item,
            price: newPrice,
            isUp,
            change: `${isUp ? '+' : ''}${(Math.random()).toFixed(2)}%`,
            flash: isUp ? 'green' : 'red'
          };
        }
        return { ...item, flash: null };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center overflow-hidden relative group bg-navy-950">
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-navy-950 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-navy-950 to-transparent z-10"></div>

      <div className="flex animate-scroll whitespace-nowrap gap-12 min-w-full px-4 group-hover:[animation-play-state:paused] items-center">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 text-xs font-bold cursor-default">
            <span className="text-gray-400 font-mono">{item.symbol}</span>
            <span className={`transition-colors duration-300 ${
              item.flash === 'green' ? 'text-white bg-green-500/20 px-1 rounded' : 
              item.flash === 'red' ? 'text-white bg-red-500/20 px-1 rounded' : 
              item.isUp ? 'text-green-400' : 'text-red-400'
            }`}>
              {item.price}
            </span>
            <span className={`flex items-center text-[10px] ${item.isUp ? 'text-green-500' : 'text-red-500'}`}>
              {item.isUp ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
