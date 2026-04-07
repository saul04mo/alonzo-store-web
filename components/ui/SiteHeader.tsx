'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    closeTimer.current = setTimeout(() => setHoveredGender(null), 80);
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

  const pathname = usePathname();
  const dropdownCats = hoveredGender ? (categoriesByGender[hoveredGender] || []) : [];
  const columns: string[][] = [];
  for (let i = 0; i < dropdownCats.length; i += 6) {
    columns.push(dropdownCats.slice(i, i + 6));
  }

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomeHero = pathname === '/' && !searchTerm;
  const isTransparent = isHomeHero && !isScrolled && !drawerOpen && !hoveredGender;

  const baseHeaderClass = "w-full top-0 z-[90] transition-colors duration-300";
  const headerLayoutClass = isHomeHero ? "fixed" : "sticky";
  const headerBgClass = isTransparent ? "bg-transparent border-transparent" : "bg-white border-alonzo-gray-200 border-b";

  return (
    <>
      <header className={`${baseHeaderClass} ${headerLayoutClass} ${headerBgClass}`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 h-full">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* ── Left: Hamburger (mobile) / Nav (desktop) ── */}
            <div className="flex items-center gap-7 flex-1 h-full">
              {/* Mobile hamburger */}
              <button
                onClick={() => { setDrawerOpen(true); setDrawerSub(null); }}
                className="md:hidden text-alonzo-charcoal"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-7 h-full">
                {/* SHOP */}
                <button
                  onClick={() => handleViewAll(gender)}
                  className="text-[13px] tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 text-alonzo-gray-600 hover:text-alonzo-black relative"
                >
                  Shop
                </button>

                {(['Mujer', 'Hombre'] as Gender[]).map((g) => (
                  <div
                    key={g}
                    className="h-full flex items-center"
                    onMouseEnter={() => openMenu(g)}
                    onMouseLeave={startClose}
                  >
                    <button
                      onClick={() => handleViewAll(g)}
                      className={`text-[13px] tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 hover:text-alonzo-black relative ${gender === g ? 'text-alonzo-black' : 'text-alonzo-gray-600'
                        }`}
                    >
                      {g === 'Mujer' ? 'Mujer' : 'Hombre'}
                      {hoveredGender === g && (
                        <span className="absolute bottom-3 left-0 right-0 h-[1.5px] bg-alonzo-black" />
                      )}
                    </button>
                  </div>
                ))}

                {/* BASICS */}
                <button
                  onClick={() => {
                    onGenderChange(gender);
                    setTimeout(() => setActiveCategory('BÁSICOS'), 50);
                  }}
                  className="text-[13px] tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 text-alonzo-gray-600 hover:text-alonzo-black relative"
                >
                  Basics
                </button>
              </nav>
            </div>

            {/* ── Center logo ── */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="flex items-center">
                <img
                  src="/images/logoAlonzo.png"
                  alt="ALONZO"
                  className="h-8 md:h-12 w-auto object-contain"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    const fb = document.createElement('span');
                    fb.className = 'text-xl md:text-2xl font-bold tracking-[0.25em] text-alonzo-black';
                    fb.textContent = 'ALONZO';
                    el.parentElement?.appendChild(fb);
                  }}
                />
              </Link>
            </div>

            {/* ── Right icons (desktop only) ── */}
            <div className="flex items-center justify-end gap-5 md:gap-7 flex-1">
              {/* Search */}
              <button
                onClick={() => {
                  const el = document.getElementById('alonzo-search-input');
                  if (el) { el.focus(); } else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
                }}
                className="hidden md:flex text-alonzo-charcoal hover:text-alonzo-black transition-colors items-center"
              >
                <Search size={21} strokeWidth={1.5} />
              </button>
              {/* User / Profile */}
              <button
                onClick={onProfileOpen}
                className="hidden md:flex text-alonzo-charcoal hover:text-alonzo-black transition-colors items-center"
              >
                <User size={21} strokeWidth={1.5} />
              </button>
              {/* Cart */}
              <button
                onClick={onCartOpen}
                className="hidden md:block text-alonzo-charcoal hover:text-alonzo-black transition-colors relative"
              >
                <ShoppingBag size={21} strokeWidth={1.5} />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-alonzo-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════ Desktop Mega Menu (Full Width, Aligned Content) ══════ */}
        {hoveredGender && dropdownCats.length > 0 && (
          <div
            className="hidden md:block absolute left-0 right-0 z-[89] top-full bg-white border-b border-alonzo-gray-200 shadow-sm"
            onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
            onMouseLeave={startClose}
          >
            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8">
              <div className="flex items-start py-10">
                {/* Spacer block to perfectly align the content under the hovered nav item */}
                <div className="flex items-center gap-7 invisible h-0">
                  <span className="text-[13px] tracking-[0.18em] uppercase font-medium">Shop</span>
                  {hoveredGender === 'Hombre' && (
                    <span className="text-[13px] tracking-[0.18em] uppercase font-medium">Mujer</span>
                  )}
                </div>

                {/* Actual Menu Content */}
                <div className="ml-7 flex gap-16 min-w-[340px]">
                  {/* Ver todo */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleViewAll(hoveredGender)}
                      className="text-[11px] tracking-[0.15em] uppercase font-semibold text-alonzo-black hover:opacity-60 transition-opacity text-left whitespace-nowrap mega-item-reveal"
                      style={{ animationDelay: '0ms' }}
                    >
                      Ver todo
                    </button>
                  </div>
                  {/* Categories */}
                  <div className="flex flex-col gap-2.5">
                    {dropdownCats.map((cat, idx) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(hoveredGender, cat)}
                        className="text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors text-left whitespace-nowrap mega-item-reveal"
                        style={{ animationDelay: `${(idx + 1) * 40}ms` }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
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
            {/* Close button */}
            <div className="flex items-center justify-between px-5 h-12 border-b border-alonzo-gray-200">
              <button onClick={() => setDrawerOpen(false)}>
                <X size={20} strokeWidth={1.5} className="text-alonzo-charcoal" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Mujer ── */}
              <button
                onClick={() => setDrawerSub(drawerSub === 'Mujer' ? null : 'Mujer')}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left"
              >
                <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                  Mujer
                </span>
                <ChevronDown
                  size={16}
                  className={`text-alonzo-gray-400 transition-transform duration-300 ${drawerSub === 'Mujer' ? 'rotate-180' : ''}`}
                />
              </button>
              {/* Mujer categories – inline expand */}
              {drawerSub === 'Mujer' && (
                <div className="bg-gray-50/60">
                  <button
                    onClick={() => handleViewAll('Mujer')}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-[12px] tracking-[0.08em] uppercase text-alonzo-charcoal font-semibold">
                      Ver todo
                    </span>
                  </button>
                  {(categoriesByGender['Mujer'] || []).map((cat, idx) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick('Mujer', cat)}
                      className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                      style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                    >
                      <span className="text-[12px] tracking-[0.08em] uppercase text-alonzo-gray-500">
                        {cat}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Hombre ── */}
              <button
                onClick={() => setDrawerSub(drawerSub === 'Hombre' ? null : 'Hombre')}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left"
              >
                <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                  Hombre
                </span>
                <ChevronDown
                  size={16}
                  className={`text-alonzo-gray-400 transition-transform duration-300 ${drawerSub === 'Hombre' ? 'rotate-180' : ''}`}
                />
              </button>
              {/* Hombre categories – inline expand */}
              {drawerSub === 'Hombre' && (
                <div className="bg-gray-50/60">
                  <button
                    onClick={() => handleViewAll('Hombre')}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="text-[12px] tracking-[0.08em] uppercase text-alonzo-charcoal font-semibold">
                      Ver todo
                    </span>
                  </button>
                  {(categoriesByGender['Hombre'] || []).map((cat, idx) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick('Hombre', cat)}
                      className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                      style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                    >
                      <span className="text-[12px] tracking-[0.08em] uppercase text-alonzo-gray-500">
                        {cat}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom links */}
            <div className="border-t border-alonzo-gray-200">
              <button
                onClick={() => { setDrawerOpen(false); onProfileOpen(); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-alonzo-gray-200 text-left"
              >
                <User size={16} strokeWidth={1.5} className="text-alonzo-gray-500" />
                <span className="text-[12px] tracking-[0.06em] uppercase text-alonzo-charcoal">
                  {client ? client.name : 'Iniciar sesión'}
                </span>
              </button>
              <button
                onClick={() => { setDrawerOpen(false); onCartOpen(); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-alonzo-gray-200 text-left"
              >
                <ShoppingBag size={16} strokeWidth={1.5} className="text-alonzo-gray-500" />
                <span className="text-[12px] tracking-[0.06em] uppercase text-alonzo-charcoal">
                  Carrito {mounted && totalItems > 0 ? `(${totalItems})` : ''}
                </span>
              </button>
              <a
                href="/terms"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center px-5 py-3.5 border-b border-alonzo-gray-200 text-left"
              >
                <span className="text-[11px] tracking-[0.06em] uppercase text-alonzo-gray-500">
                  Términos y condiciones
                </span>
              </a>
              <a
                href="/privacy"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center px-5 py-3.5 text-left"
              >
                <span className="text-[11px] tracking-[0.06em] uppercase text-alonzo-gray-500">
                  Política de privacidad
                </span>
              </a>
            </div>
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
        @keyframes megaItemReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .mega-item-reveal {
          opacity: 0;
          animation: megaItemReveal 0.3s ease-out forwards;
        }
        .mobile-menu-reveal {
          opacity: 0;
          animation: megaItemReveal 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}