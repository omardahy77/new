import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: number;
  change: number; // Percentage change
  isUp: boolean;
  isLive: boolean; // To distinguish WS data from simulation
}

// Realistic 2025 Base Prices for Simulation (Fallback)
const initialPairs: TickerItem[] = [
  { symbol: 'XAU/USD', price: 2645.50, change: 0.45, isUp: true, isLive: false }, // Gold
  { symbol: 'EUR/USD', price: 1.0845, change: -0.12, isUp: false, isLive: false },
  { symbol: 'GBP/USD', price: 1.2630, change: 0.25, isUp: true, isLive: false },
  { symbol: 'BTC/USD', price: 64500.00, change: 1.20, isUp: true, isLive: false },
  { symbol: 'USD/JPY', price: 148.15, change: 0.10, isUp: true, isLive: false },
  { symbol: 'WTI/USD', price: 77.50, change: -0.50, isUp: false, isLive: false }, // Oil
  { symbol: 'USD/CAD', price: 1.3490, change: -0.15, isUp: false, isLive: false },
];

export const MarketTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>(initialPairs);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. WebSocket Connection for REAL-TIME Data (Binance)
  useEffect(() => {
    // We use Binance WS for available pairs. 
    // Mapping: PAXGUSDT -> Gold, EURUSDT -> Euro, etc.
    const streams = [
      'paxgusdt@aggTrade', // Gold Proxy
      'eurusdt@aggTrade',
      'gbpusdt@aggTrade',
      'btcusdt@aggTrade'
    ].join('/');

    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log('🔴 Live Market Stream Connected'); // Clean console
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!message.data) return;
        
        const { s: symbol, p: priceStr } = message.data;
        const price = parseFloat(priceStr);

        setItems(prevItems => prevItems.map(item => {
          let match = false;
          // Map Binance Symbols to Our Display Symbols
          if (symbol === 'PAXGUSDT' && item.symbol === 'XAU/USD') match = true;
          if (symbol === 'EURUSDT' && item.symbol === 'EUR/USD') match = true;
          if (symbol === 'GBPUSDT' && item.symbol === 'GBP/USD') match = true;
          if (symbol === 'BTCUSDT' && item.symbol === 'BTC/USD') match = true;

          if (match) {
            const isUp = price >= item.price;
            return { ...item, price, isUp, isLive: true };
          }
          return item;
        }));
      } catch (e) {
        // Silent error handling for stream parsing issues
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  // 2. Simulation for Non-WS Pairs (Oil, JPY, etc.)
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prevItems => prevItems.map(item => {
        if (item.isLive) return item; // Skip live items

        // Realistic micro-volatility
        const volatility = item.symbol.includes('JPY') ? 0.02 : 0.0005;
        const move = (Math.random() - 0.5) * volatility;
        const newPrice = item.price * (1 + move);
        
        return {
          ...item,
          price: newPrice,
          isUp: move >= 0
        };
      }));
    }, 3000); // Update simulated pairs every 3s

    return () => clearInterval(interval);
  }, []);

  // Duplicate items for seamless scrolling loop
  const displayItems = [...items, ...items];

  const formatPrice = (symbol: string, price: number) => {
    if (symbol.includes('JPY')) return price.toFixed(2);
    if (symbol.includes('BTC')) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (symbol.includes('XAU') || symbol.includes('WTI')) return price.toFixed(2);
    return price.toFixed(4); // Forex standard
  };

  return (
    <div className="w-full h-10 bg-[#050810] border-b border-white/5 flex items-center relative overflow-hidden shadow-inner" dir="ltr">
      
      {/* Gradient Masks - Adjusted for full width */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050810] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050810] to-transparent z-10 pointer-events-none"></div>

      {/* Scrolling Container */}
      <div className="flex animate-scroll will-change-transform items-center min-w-max hover:[animation-play-state:paused]">
        {displayItems.map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center mx-6 select-none group cursor-default">
            
            {/* Symbol */}
            <div className="flex flex-col mr-3">
                <span className={`text-xs font-bold tracking-wider font-mono transition-colors ${item.symbol === 'XAU/USD' ? 'text-gold-500' : 'text-gray-400 group-hover:text-white'}`}>
                    {item.symbol}
                </span>
            </div>

            {/* Price & Change */}
            <div className={`flex flex-col items-end transition-colors duration-300 ${item.isUp ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
               <span className="font-mono text-sm font-bold tracking-wide leading-none mb-0.5">
                 {formatPrice(item.symbol, item.price)}
               </span>
               {/* Only show change % if simulated or we have data, for WS we just show direction arrow for cleanliness */}
               {!item.isLive && (
                 <div className="flex items-center gap-0.5 text-[9px] font-bold opacity-80">
                    {item.isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    <span>{Math.abs(item.change).toFixed(2)}%</span>
                 </div>
               )}
            </div>

            {/* Separator */}
            <div className="ml-6 h-4 w-[1px] bg-white/10"></div>

          </div>
        ))}
      </div>
    </div>
  );
};
