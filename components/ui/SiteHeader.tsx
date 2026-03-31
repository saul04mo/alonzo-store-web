'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, Menu, X, ChevronRight, ArrowLeft } from 'lucide-react';
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

  // Desktop mega menu
  const [hoveredGender, setHoveredGender] = useState<Gender | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSub, setDrawerSub] = useState<Gender | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
    setDrawerOpen(false);
    setDrawerSub(null);
  };

  const handleViewAll = (g: Gender) => {
    onGenderChange(g);
    setActiveCategory('');
    setHoveredGender(null);
    setDrawerOpen(false);
    setDrawerSub(null);
  };

  const dropdownCats = hoveredGender ? (categoriesByGender[hoveredGender] || []) : [];
  const columns: string[][] = [];
  for (let i = 0; i < dropdownCats.length; i += 6) {
    columns.push(dropdownCats.slice(i, i + 6));
  }

  return (
    <>
      <header className="w-full bg-white sticky top-0 z-[90]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-12 md:h-14">

            {/* ── Left: Hamburger (mobile) / Nav (desktop) ── */}
            <div className="flex items-center gap-7 flex-1">
              {/* Mobile hamburger */}
              <button
                onClick={() => { setDrawerOpen(true); setDrawerSub(null); }}
                className="md:hidden text-alonzo-charcoal"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-7">
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
                    {hoveredGender === g && (
                      <span className="absolute bottom-3 left-0 right-0 h-[1.5px] bg-alonzo-black" />
                    )}
                  </button>
                ))}
              </nav>
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
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleViewAll(hoveredGender)}
                    className="text-[11px] tracking-[0.15em] uppercase font-semibold text-alonzo-black hover:opacity-60 transition-opacity text-left"
                  >
                    Ver todo
                  </button>
                </div>
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

      {/* Desktop overlay */}
      {hoveredGender && dropdownCats.length > 0 && (
        <div
          className="hidden md:block fixed inset-0 bg-black/25 z-[88]"
          onMouseEnter={startClose}
        />
      )}

      {/* ══════════════════════════════════════════
          Mobile Full-Screen Drawer (UNDERGOLD style)
          ══════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => { setDrawerOpen(false); setDrawerSub(null); }}
          />

          {/* Drawer panel */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white flex flex-col animate-slide-in-left"
            style={{ animationDuration: '0.25s' }}
          >
            {/* ── Main menu (no sub open) ── */}
            {!drawerSub && (
              <>
                {/* Close button */}
                <div className="flex items-center justify-between px-5 h-12 border-b border-alonzo-gray-200">
                  <button onClick={() => setDrawerOpen(false)}>
                    <X size={20} strokeWidth={1.5} className="text-alonzo-charcoal" />
                  </button>
                </div>

                {/* Menu items */}
                <div className="flex-1 overflow-y-auto">
                  {/* Mujer */}
                  <button
                    onClick={() => setDrawerSub('Mujer')}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left"
                  >
                    <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                      Mujer
                    </span>
                    <ChevronRight size={16} className="text-alonzo-gray-400" />
                  </button>

                  {/* Hombre */}
                  <button
                    onClick={() => setDrawerSub('Hombre')}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left"
                  >
                    <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                      Hombre
                    </span>
                    <ChevronRight size={16} className="text-alonzo-gray-400" />
                  </button>
                </div>

                {/* Bottom: login */}
                <div className="border-t border-alonzo-gray-200 px-5 py-4">
                  <button
                    onClick={() => { setDrawerOpen(false); onProfileOpen(); }}
                    className="flex items-center gap-2 text-alonzo-gray-600"
                  >
                    <User size={16} strokeWidth={1.5} />
                    <span className="text-[11px] tracking-[0.1em] uppercase">
                      {client ? client.name : 'Iniciar sesión'}
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* ── Sub menu (gender categories) ── */}
            {drawerSub && (
              <>
                {/* Back button */}
                <div className="flex items-center gap-3 px-5 h-12 border-b border-alonzo-gray-200">
                  <button onClick={() => setDrawerSub(null)}>
                    <ArrowLeft size={18} strokeWidth={1.5} className="text-alonzo-charcoal" />
                  </button>
                  <span className="text-[13px] tracking-[0.08em] uppercase font-medium text-alonzo-charcoal">
                    {drawerSub}
                  </span>
                </div>

                {/* Categories */}
                <div className="flex-1 overflow-y-auto">
                  <button
                    onClick={() => handleViewAll(drawerSub)}
                    className="w-full px-5 py-4 border-b border-alonzo-gray-200 text-left"
                  >
                    <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-semibold">
                      Ver todo
                    </span>
                  </button>

                  {(categoriesByGender[drawerSub] || []).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(drawerSub, cat)}
                      className="w-full px-5 py-4 border-b border-alonzo-gray-200 text-left"
                    >
                      <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-gray-600">
                        {cat}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.25s ease-out;
        }
      `}</style>
    </>
  );
}