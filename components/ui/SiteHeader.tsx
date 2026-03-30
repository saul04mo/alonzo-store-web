'use client';
import { useState, useEffect } from 'react';
import { Search, User, Heart, ShoppingBag } from 'lucide-react';
import { useCartStore, useClientStore } from '@/stores';
import Link from 'next/link';
import type { Gender } from '@/types';

interface SiteHeaderProps {
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCartOpen: () => void;
  onProfileOpen: () => void;
  searchRef?: React.RefObject<HTMLInputElement>;
}

export function SiteHeader({
  gender,
  onGenderChange,
  searchTerm,
  onSearchChange,
  onCartOpen,
  onProfileOpen,
  searchRef,
}: SiteHeaderProps) {
  const totalItems = useCartStore((s) => s.totalItems());
  const { client } = useClientStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="w-full bg-white sticky top-0 z-[90]">
      {/* Main nav row */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-10">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left nav links — visible on desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onGenderChange('Mujer')}
              className={`text-sm tracking-wide transition-all duration-200 hover:text-alonzo-black ${
                gender === 'Mujer'
                  ? 'text-alonzo-black font-medium'
                  : 'text-alonzo-gray-600'
              }`}
            >
              Moda para mujer
            </button>
            <button
              onClick={() => onGenderChange('Hombre')}
              className={`text-sm tracking-wide transition-all duration-200 hover:text-alonzo-black ${
                gender === 'Hombre'
                  ? 'text-alonzo-black font-medium'
                  : 'text-alonzo-gray-600'
              }`}
            >
              Moda para hombre
            </button>
          </nav>

          {/* Mobile: gender tabs */}
          <div className="flex md:hidden items-center gap-6">
            <button
              onClick={() => onGenderChange('Mujer')}
              className={`text-xs tracking-wider uppercase transition-all ${
                gender === 'Mujer'
                  ? 'text-alonzo-black font-semibold border-b-[1.5px] border-alonzo-black pb-1'
                  : 'text-alonzo-gray-500'
              }`}
            >
              MUJER
            </button>
            <button
              onClick={() => onGenderChange('Hombre')}
              className={`text-xs tracking-wider uppercase transition-all ${
                gender === 'Hombre'
                  ? 'text-alonzo-black font-semibold border-b-[1.5px] border-alonzo-black pb-1'
                  : 'text-alonzo-gray-500'
              }`}
            >
              HOMBRE
            </button>
          </div>

          {/* Center logo */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex-1 md:flex md:justify-center">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logoAlonzo.png"
                alt="ALONZO"
                className="h-9 md:h-14 w-auto object-contain cursor-pointer"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.className = 'text-2xl md:text-3xl font-bold tracking-[0.2em] text-alonzo-black';
                  fallback.textContent = 'ALONZO';
                  el.parentElement?.appendChild(fallback);
                }}
              />
            </Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-4 md:gap-5">
            <button
              onClick={onProfileOpen}
              className="text-alonzo-charcoal hover:text-alonzo-black transition-colors flex items-center gap-2"
            >
              <User size={20} strokeWidth={1.5} />
              {mounted && client && (
                <span className="hidden md:block text-xs font-medium capitalize truncate max-w-[200px]">
                  {client.name}
                </span>
              )}
            </button>
            <button
              className="text-alonzo-gray-400 cursor-not-allowed hidden md:block"
              title="Lista de deseos — Próximamente"
              disabled
            >
              <Heart size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={onCartOpen}
              className="text-alonzo-charcoal hover:text-alonzo-black transition-colors relative"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-alonzo-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar — Farfetch style */}
        <div className="hidden md:flex justify-end pb-3">
          <div className="relative w-[280px]">
            <Search
              size={16}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-alonzo-gray-500"
            />
            <input
              ref={searchRef as React.RefObject<HTMLInputElement>}
              type="text"
              placeholder="Encuentra estilos y marcas"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-6 pr-2 py-2 border-0 border-b border-alonzo-gray-300 bg-transparent text-sm text-alonzo-charcoal outline-none focus:border-alonzo-black transition-colors placeholder:text-alonzo-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-alonzo-gray-500"
          />
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-alonzo-gray-100 rounded-md text-xs text-alonzo-charcoal outline-none placeholder:text-alonzo-gray-500 focus:ring-1 focus:ring-alonzo-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Bottom border */}
      <div className="h-px bg-alonzo-gray-300" />
    </header>
  );
}
