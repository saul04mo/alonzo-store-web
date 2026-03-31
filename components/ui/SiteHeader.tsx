'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag } from 'lucide-react';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
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
  const categoriesByGender = useUIStore((s) => s.categoriesByGender);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const [mounted, setMounted] = useState(false);
  const [hoveredGender, setHoveredGender] = useState<Gender | null>(null);
  const [mobileMenuGender, setMobileMenuGender] = useState<Gender | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setMounted(true); }, []);

  const openMenu = (g: Gender) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredGender(g);
  };
  const startClose = () => {
    closeTimer.current = setTimeout(() => setHoveredGender(null), 250);
  };

  const handleCategoryClick = (g: Gender, cat: string) => {
    onGenderChange(g);
    setTimeout(() => setActiveCategory(cat), 50);
    setHoveredGender(null);
    setMobileMenuGender(null);
  };

  const handleViewAll = (g: Gender) => {
    onGenderChange(g);
    setActiveCategory('');
    setHoveredGender(null);
    setMobileMenuGender(null);
  };

  const dropdownCats = hoveredGender ? (categoriesByGender[hoveredGender] || []) : [];

  // Split categories into columns (max 6 per column)
  const columns: string[][] = [];
  for (let i = 0; i < dropdownCats.length; i += 6) {
    columns.push(dropdownCats.slice(i, i + 6));
  }

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-[90]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-12 md:h-14">

            {/* ── Left nav (desktop) ── */}
            <nav className="hidden md:flex items-center gap-7 flex-1">
              {(['Mujer', 'Hombre'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onMouseEnter={() => openMenu(g)}
                  onMouseLeave={startClose}
                  onClick={() => handleViewAll(g)}
                  className={`text-[11px] tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 hover:text-alonzo-black relative ${gender === g ? 'text-alonzo-black' : 'text-alonzo-gray-600'
                    }`}
                >
                  {g === 'Mujer' ? 'Mujer' : 'Hombre'}
                  {/* Active underline */}
                  {hoveredGender === g && (
                    <span className="absolute bottom-3 left-0 right-0 h-[1.5px] bg-alonzo-black" />
                  )}
                </button>
              ))}
            </nav>

            {/* ── Mobile: gender tabs ── */}
            <div className="flex md:hidden items-center gap-5">
              {(['Mujer', 'Hombre'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    onGenderChange(g);
                    setMobileMenuGender(mobileMenuGender === g ? null : g);
                  }}
                  className={`text-[10px] tracking-[0.15em] uppercase transition-all ${gender === g
                      ? 'text-alonzo-black font-semibold border-b-[1.5px] border-alonzo-black pb-0.5'
                      : 'text-alonzo-gray-500'
                    }`}
                >
                  {g === 'Mujer' ? 'MUJER' : 'HOMBRE'}
                </button>
              ))}
            </div>

            {/* ── Center logo ── */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="flex items-center">
                <img
                  src="/images/logoAlonzo.png"
                  alt="ALONZO"
                  className="h-7 md:h-10 w-auto object-contain"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    const fb = document.createElement('span');
                    fb.className = 'text-lg md:text-xl font-bold tracking-[0.25em] text-alonzo-black';
                    fb.textContent = 'ALONZO';
                    el.parentElement?.appendChild(fb);
                  }}
                />
              </Link>
            </div>

            {/* ── Right icons ── */}
            <div className="flex items-center justify-end gap-4 md:gap-5 flex-1">
              <button
                onClick={onProfileOpen}
                className="text-alonzo-charcoal hover:text-alonzo-black transition-colors flex items-center gap-2"
              >
                <User size={17} strokeWidth={1.5} />
                {mounted && client && (
                  <span className="hidden lg:block text-[10px] tracking-wide font-medium capitalize truncate max-w-[140px]">
                    {client.name}
                  </span>
                )}
              </button>
              <button
                onClick={onCartOpen}
                className="text-alonzo-charcoal hover:text-alonzo-black transition-colors relative"
              >
                <ShoppingBag size={17} strokeWidth={1.5} />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-alonzo-black text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-alonzo-gray-500" />
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-alonzo-gray-100 rounded text-[11px] text-alonzo-charcoal outline-none placeholder:text-alonzo-gray-500 focus:ring-1 focus:ring-alonzo-gray-400 transition-all"
            />
          </div>
        </div>

        <div className="h-px bg-alonzo-gray-200" />

        {/* ══════ Desktop Mega Menu ══════ */}
        {hoveredGender && dropdownCats.length > 0 && (
          <div
            className="hidden md:block absolute left-0 right-0 z-[89]"
            onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
            onMouseLeave={startClose}
          >
            <div className="bg-white border-b border-alonzo-gray-200">
              <div className="max-w-[1400px] mx-auto px-10 py-8 flex gap-16">
                {/* "Ver todo" column */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleViewAll(hoveredGender)}
                    className="text-[11px] tracking-[0.15em] uppercase font-semibold text-alonzo-black hover:opacity-60 transition-opacity text-left"
                  >
                    Ver todo
                  </button>
                </div>

                {/* Category columns */}
                {columns.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-2.5">
                    {col.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(hoveredGender, cat)}
                        className="text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors text-left whitespace-nowrap"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Desktop overlay ── */}
      {hoveredGender && dropdownCats.length > 0 && (
        <div
          className="hidden md:block fixed inset-0 bg-black/25 z-[88] transition-opacity"
          onMouseEnter={startClose}
        />
      )}

      {/* ══════ Mobile dropdown ══════ */}
      {mobileMenuGender && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/25 z-[85]"
            onClick={() => setMobileMenuGender(null)}
          />
          <div className="md:hidden fixed top-[100px] left-0 right-0 z-[86] bg-white border-b border-alonzo-gray-200 shadow-sm animate-slide-down">
            <div className="px-5 py-5 flex flex-col gap-3">
              <button
                onClick={() => handleViewAll(mobileMenuGender)}
                className="text-[11px] tracking-[0.15em] uppercase font-semibold text-alonzo-black text-left"
              >
                Ver todo
              </button>
              <div className="h-px bg-alonzo-gray-200" />
              {(categoriesByGender[mobileMenuGender] || []).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(mobileMenuGender, cat)}
                  className="text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black active:bg-alonzo-gray-100 transition-colors text-left py-1.5 rounded px-1 -mx-1"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}