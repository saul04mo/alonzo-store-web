'use client';
import { useState, useEffect } from 'react';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/stores';

interface BottomNavProps {
  onCartOpen: () => void;
  onProfileOpen: () => void;
  onSearchFocus?: () => void;
}

export function BottomNav({ onCartOpen, onProfileOpen, onSearchFocus }: BottomNavProps) {
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white border-t border-alonzo-gray-300 flex justify-around py-3 z-[100] md:max-w-[400px] md:rounded-full md:bottom-5 md:shadow-lg md:border">
      <button className="text-alonzo-charcoal p-2">
        <Home size={22} strokeWidth={1.5} />
      </button>

      <button className="text-alonzo-charcoal p-2" onClick={onSearchFocus}>
        <Search size={22} strokeWidth={1.5} />
      </button>

      <button className="text-alonzo-charcoal p-2 relative" onClick={onCartOpen}>
        <ShoppingBag size={22} strokeWidth={1.5} />
        {mounted && totalItems > 0 && (
          <span className="absolute -top-0.5 -right-1 bg-alonzo-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-fade-in">
            {totalItems}
          </span>
        )}
      </button>

      <button className="text-alonzo-charcoal p-2" onClick={onProfileOpen}>
        <User size={22} strokeWidth={1.5} />
      </button>
    </nav>
  );
}
