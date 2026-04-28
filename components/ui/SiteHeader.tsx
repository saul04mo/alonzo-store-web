'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import type { Announcement } from '@/lib/getAnnouncements';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Gender } from '@/types';

interface SiteHeaderProps {
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCartOpen: () => void;
  onProfileOpen: () => void;
  searchRef?: React.RefObject<HTMLInputElement>;
  announcements?: Announcement[];
}

export function SiteHeader({
  gender,
  onGenderChange,
  searchTerm,
  onSearchChange,
  onCartOpen,
  onProfileOpen,
  searchRef,
  announcements = [],
}: SiteHeaderProps) {
  const totalItems = useCartStore((s) => s.totalItems());
  const { client } = useClientStore();
  const categoriesByGender = useUIStore((s) => s.categoriesByGender);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const hasBrowsed = useUIStore((s) => s.hasBrowsed);
  const [mounted, setMounted] = useState(false);

  // Desktop mega menu
  const [hoveredGender, setHoveredGender] = useState<Gender | null>(null);
  const [headerHovered, setHeaderHovered] = useState(false);
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
    setHasBrowsed(true);
    setHoveredGender(null);
    setDrawerOpen(false);
    setDrawerSub(null);
  };

  const handleViewAll = (g: Gender) => {
    onGenderChange(g);
    setActiveCategory('');
    setHasBrowsed(false);
    setHoveredGender(null);
    setDrawerOpen(false);
    setDrawerSub(null);
  };

  const pathname = usePathname();
  const router = useRouter();
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

  // Header es fixed/transparente SOLO cuando el HeroBanner está renderizado
  // detrás (mismo criterio que HomePage: showHero = !hasBrowsed && !searchTerm).
  // En home browsing categoría → no hay hero → sticky con bg blanco.
  // En cualquier otra ruta → sticky con bg blanco.
  const isHomeHero = pathname === '/' && !searchTerm && !hasBrowsed;
  const isTransparent = isHomeHero && !isScrolled && !drawerOpen && !hoveredGender && !headerHovered;

  const baseHeaderClass = "w-full top-0 z-[90] transition-colors duration-300";
  const headerLayoutClass = isHomeHero ? "fixed" : "sticky";
  const headerBgClass = isTransparent ? "bg-transparent border-transparent" : "bg-white border-alonzo-gray-200 border-b";

  // Helpers de color: transparente (blanco) vs opaco (gris/negro original)
  const navItemClass = isTransparent
    ? "text-white/80 hover:text-white"
    : "text-alonzo-gray-600 hover:text-alonzo-black";
  const navActiveClass = isTransparent ? "text-white" : "text-alonzo-black";
  const iconClass = isTransparent
    ? "text-white hover:text-white/80"
    : "text-alonzo-charcoal hover:text-alonzo-black";
  const underlineClass = isTransparent ? "bg-white" : "bg-alonzo-black";
  // Logo PNG: cuando es transparente, lo invertimos a blanco con filter
  const logoFilterClass = isTransparent ? "brightness-0 invert" : "";

  return (
    <>
      <header
        className={`${baseHeaderClass} ${headerLayoutClass} ${headerBgClass}`}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <AnnouncementBar initialAnnouncements={announcements} />
        <div className="w-full mx-auto px-3 md:px-6 lg:px-10 h-full">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* ── Left: Hamburger + Search (mobile) / Nav (desktop) ── */}
            <div className="flex items-center gap-4 md:gap-7 flex-1 h-full">
              {/* Mobile hamburger */}
              <button
                onClick={() => { setDrawerOpen(true); setDrawerSub(null); }}
                className={`md:hidden transition-colors ${iconClass}`}
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
              {/* Mobile search */}
              <button
                onClick={() => router.push('/search')}
                className={`md:hidden transition-colors ${iconClass}`}
              >
                <Search size={22} strokeWidth={1.5} />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-7 h-full">
                {/* SHOP */}
                <button
                  onClick={() => handleViewAll(gender)}
                  className={`text-[13px] font-sans tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 relative group ${navItemClass}`}
                >
                  Shop
                  <span className={`absolute bottom-3 left-0 right-0 h-[1.5px] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left ${underlineClass}`} />
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
                      className={`text-[13px] font-sans tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 relative ${gender === g ? navActiveClass : navItemClass}`}
                    >
                      {g === 'Mujer' ? 'Mujer' : 'Hombre'}
                      {hoveredGender === g && (
                        <span className={`absolute bottom-3 left-0 right-0 h-[1.5px] ${underlineClass}`} />
                      )}
                    </button>
                  </div>
                ))}

                {/* BASICS */}
                <button
                  onClick={() => {
                    onGenderChange(gender);
                    setTimeout(() => setActiveCategory('BÁSICOS'), 50);
                    setHasBrowsed(true);
                  }}
                  className={`text-[13px] font-sans tracking-[0.18em] uppercase font-medium py-4 transition-colors duration-200 relative group ${navItemClass}`}
                >
                  Basics
                  <span className={`absolute bottom-3 left-0 right-0 h-[1.5px] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left ${underlineClass}`} />
                </button>
              </nav>
            </div>

            {/* ── Center logo ── */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" onClick={() => { setHasBrowsed(false); setActiveCategory(''); }} className="flex items-center">
                <img
                  src="/images/logoAlonzo.png"
                  alt="ALONZO"
                  className={`h-8 md:h-12 w-auto object-contain transition-[filter] duration-300 ${logoFilterClass}`}
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

            {/* ── Right icons ── */}
            <div className="flex items-center justify-end gap-4 md:gap-7 flex-1">
              {/* Search (desktop only — mobile has it on the left) */}
              <button
                onClick={() => router.push('/search')}
                className={`hidden md:flex transition-colors items-center ${iconClass}`}
              >
                <Search size={23} strokeWidth={1.5} />
              </button>
              {/* User / Profile */}
              <button
                onClick={onProfileOpen}
                className={`transition-colors flex items-center ${iconClass}`}
              >
                <User size={22} strokeWidth={1.5} className="md:w-[23px] md:h-[23px]" />
              </button>
              {/* Cart */}
              <button
                onClick={onCartOpen}
                className={`transition-colors relative ${iconClass}`}
              >
                <ShoppingBag size={22} strokeWidth={1.5} className="md:w-[23px] md:h-[23px]" />
                {mounted && totalItems > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    isTransparent ? 'bg-white text-alonzo-black' : 'bg-alonzo-black text-white'
                  }`}>
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
            <div className="w-full mx-auto px-3 md:px-6 lg:px-10">
              <div className="flex items-start pt-6 pb-8">
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
                      className="text-[11px] font-sans tracking-[0.15em] uppercase font-semibold text-alonzo-black hover:opacity-60 transition-opacity text-left whitespace-nowrap mega-item-reveal"
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
                        className="text-[11px] font-sans tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors text-left whitespace-nowrap mega-item-reveal"
                        style={{ animationDelay: `${(idx + 1) * 40}ms` }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {/* Nuevo + Más Vendido */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => { handleViewAll(hoveredGender); setTimeout(() => setActiveCategory('NUEVO'), 50); }}
                      className="text-[11px] font-sans tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors text-left whitespace-nowrap mega-item-reveal"
                      style={{ animationDelay: `${(dropdownCats.length + 1) * 40}ms` }}
                    >
                      Nuevo
                    </button>
                    <button
                      onClick={() => { handleViewAll(hoveredGender); setTimeout(() => setActiveCategory('MÁS VENDIDO'), 50); }}
                      className="text-[11px] font-sans tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors text-left whitespace-nowrap mega-item-reveal"
                      style={{ animationDelay: `${(dropdownCats.length + 2) * 40}ms` }}
                    >
                      Más Vendido
                    </button>
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
              {/* ── Shop ── */}
              <button
                onClick={() => handleViewAll(gender)}
                className="w-full flex items-center px-5 py-4 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '0ms' }}
              >
                <span className="text-[13px] font-sans tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                  Shop
                </span>
              </button>

              {/* ── Hombre ── */}
              <button
                onClick={() => setDrawerSub(drawerSub === 'Hombre' ? null : 'Hombre')}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '60ms' }}
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
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
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
                      <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                        {cat}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => { handleViewAll('Hombre'); setTimeout(() => setActiveCategory('NUEVO'), 50); }}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: `${((categoriesByGender['Hombre'] || []).length + 1) * 60}ms` }}
                  >
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                      Nuevo
                    </span>
                  </button>
                  <button
                    onClick={() => { handleViewAll('Hombre'); setTimeout(() => setActiveCategory('MÁS VENDIDO'), 50); }}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: `${((categoriesByGender['Hombre'] || []).length + 2) * 60}ms` }}
                  >
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                      Más Vendido
                    </span>
                  </button>
                </div>
              )}

              {/* ── Mujer ── */}
              <button
                onClick={() => setDrawerSub(drawerSub === 'Mujer' ? null : 'Mujer')}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '120ms' }}
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
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
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
                      <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                        {cat}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => { handleViewAll('Mujer'); setTimeout(() => setActiveCategory('NUEVO'), 50); }}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: `${((categoriesByGender['Mujer'] || []).length + 1) * 60}ms` }}
                  >
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                      Nuevo
                    </span>
                  </button>
                  <button
                    onClick={() => { handleViewAll('Mujer'); setTimeout(() => setActiveCategory('MÁS VENDIDO'), 50); }}
                    className="w-full px-8 py-3 border-b border-alonzo-gray-200/60 text-left mobile-menu-reveal"
                    style={{ animationDelay: `${((categoriesByGender['Mujer'] || []).length + 2) * 60}ms` }}
                  >
                    <span className="text-[12px] font-sans tracking-[0.08em] uppercase text-alonzo-gray-500">
                      Más Vendido
                    </span>
                  </button>
                </div>
              )}

              {/* ── Basics ── */}
              <button
                onClick={() => {
                  onGenderChange(gender);
                  setTimeout(() => setActiveCategory('BÁSICOS'), 50);
                  setHasBrowsed(true);
                  setDrawerOpen(false);
                  setDrawerSub(null);
                }}
                className="w-full flex items-center px-5 py-4 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '180ms' }}
              >
                <span className="text-[13px] tracking-[0.08em] uppercase text-alonzo-charcoal font-medium">
                  Basics
                </span>
              </button>
            </div>

            {/* Bottom links */}
            <div className="border-t border-alonzo-gray-200">
              <button
                onClick={() => { setDrawerOpen(false); onProfileOpen(); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '240ms' }}
              >
                <User size={16} strokeWidth={1.5} className="text-alonzo-gray-500" />
                <span className="text-[12px] tracking-[0.06em] uppercase text-alonzo-charcoal">
                  {client ? client.name : 'Iniciar sesión'}
                </span>
              </button>
              <button
                onClick={() => { setDrawerOpen(false); onCartOpen(); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '300ms' }}
              >
                <ShoppingBag size={16} strokeWidth={1.5} className="text-alonzo-gray-500" />
                <span className="text-[12px] tracking-[0.06em] uppercase text-alonzo-charcoal">
                  Carrito {mounted && totalItems > 0 ? `(${totalItems})` : ''}
                </span>
              </button>
              <a
                href="/terms"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center px-5 py-3.5 border-b border-alonzo-gray-200 text-left mobile-menu-reveal"
                style={{ animationDelay: '360ms' }}
              >
                <span className="text-[11px] tracking-[0.06em] uppercase text-alonzo-gray-500">
                  Términos y condiciones
                </span>
              </a>
              <a
                href="/privacy"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center px-5 py-3.5 text-left mobile-menu-reveal"
                style={{ animationDelay: '420ms' }}
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