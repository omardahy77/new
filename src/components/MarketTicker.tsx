import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
}

// Initial realistic data (Fallback)
const initialItems: TickerItem[] = [
  { symbol: 'XAU/USD', price: '2950.50', change: '+0.45%', isUp: true },
  { symbol: 'BTC/USD', price: '98450.00', change: '+1.2%', isUp: true },
  { symbol: 'EUR/USD', price: '1.0520', change: '-0.1%', isUp: false },
  { symbol: 'GBP/USD', price: '1.2740', change: '+0.2%', isUp: true },
  { symbol: 'ETH/USD', price: '2750.80', change: '-0.8%', isUp: false },
  { symbol: 'SOL/USD', price: '185.20', change: '+3.4%', isUp: true },
  { symbol: 'USDT/USD', price: '1.0001', change: '+0.0%', isUp: true },
  { symbol: 'JPY/USD', price: '153.14', change: '-0.3%', isUp: false },
  { symbol: 'US30', price: '44269.30', change: '+0.5%', isUp: true },
];

export const MarketTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>(initialItems);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to Binance WebSocket for real-time crypto & forex-proxy data
    const symbols = ['btcusdt', 'ethusdt', 'solusdt', 'paxgusdt', 'eurusdt', 'gbpusdt'];
    const streamName = symbols.map(s => `${s}@trade`).join('/');
    
    wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data && data.s && data.p) {
        updatePrice(data.s, parseFloat(data.p));
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const updatePrice = (rawSymbol: string, newPrice: number) => {
    let displaySymbol = '';
    let decimals = 2;

    switch(rawSymbol.toUpperCase()) {
      case 'PAXGUSDT': displaySymbol = 'XAU/USD'; decimals = 2; break; // Gold
      case 'BTCUSDT': displaySymbol = 'BTC/USD'; decimals = 2; break;
      case 'ETHUSDT': displaySymbol = 'ETH/USD'; decimals = 2; break;
      case 'SOLUSDT': displaySymbol = 'SOL/USD'; decimals = 2; break;
      case 'EURUSDT': displaySymbol = 'EUR/USD'; decimals = 4; break;
      case 'GBPUSDT': displaySymbol = 'GBP/USD'; decimals = 4; break;
      default: return;
    }

    setItems(prevItems => prevItems.map(item => {
      if (item.symbol === displaySymbol) {
        const oldPrice = parseFloat(item.price.replace(/,/g, ''));
        const isUp = newPrice >= oldPrice;
        
        if (oldPrice === newPrice) return item;

        return {
          ...item,
          price: newPrice.toFixed(decimals),
          isUp: isUp,
          // We keep the change static or calculate it if we had 24h data, 
          // for now we focus on price direction color
        };
      }
      return item;
    }));
  };

  // Duplicate items enough times to ensure seamless loop
  const displayItems = [...items, ...items, ...items, ...items];

  return (
    <div className="w-full h-full flex items-center overflow-hidden relative bg-transparent" dir="ltr">
      {/* Gradient Masks for smooth fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none"></div>

      {/* Scrolling Container */}
      <div className="flex animate-scroll will-change-transform items-center min-w-max hover:[animation-play-state:paused]">
        {displayItems.map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center mx-6 select-none">
            
            {/* Price & Icon Section */}
            <div className={`flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${item.isUp ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
               {item.isUp ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
               <span className="font-mono tracking-wide">{item.price}</span>
            </div>

            {/* Symbol Section */}
            <span className="ml-3 text-gray-400 font-bold text-xs tracking-wider uppercase">
                {item.symbol}
            </span>

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
