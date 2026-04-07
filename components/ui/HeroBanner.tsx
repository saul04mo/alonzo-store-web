'use client';
import { useCallback } from 'react';
import { useUIStore } from '@/stores';
import type { Gender } from '@/types';

export function HeroBanner() {
  const setGender = useUIStore((s) => s.setGender);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);

  const handleGenderSelect = useCallback((g: Gender) => {
    setGender(g);
    setHasBrowsed(true);
    setActiveCategory('');
    
    // Smooth scroll down to products grid
    const productsEl = document.getElementById('products-section');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, [setGender, setHasBrowsed, setActiveCategory]);

  return (
    <div className="relative w-full h-[80vh] md:h-[95vh] bg-alonzo-gray-100 overflow-hidden">
      {/* Background Image */}
      <img
        src="/images/hero-banner.png"
        alt="Nueva Colección"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      
      {/* Gradient Overlay for bottom text readability - Changed to a subtle center radial gradient for better centered text contrast */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content wrapper */}
      <div className="absolute inset-0 max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col items-center justify-end pb-16 md:pb-24 z-10 text-center">
        <div className="max-w-lg text-white flex flex-col items-center">
          <img 
            src="/images/logoAlonzo.png" 
            alt="ALONZO" 
            className="h-10 md:h-16 w-auto mb-4 object-contain brightness-0 invert"
          />
          <p className="text-sm md:text-base tracking-[0.15em] mb-8 font-light text-white/90 uppercase drop-shadow-md">
            Newest Collection
          </p>

          <div className="flex items-center justify-center gap-3 md:gap-4">
            <button
              onClick={() => handleGenderSelect('Mujer')}
              className="py-3 px-8 border border-white bg-black/20 text-white text-[11px] tracking-[0.15em] uppercase font-semibold hover:bg-white hover:text-alonzo-black transition-colors duration-300 backdrop-blur-sm"
            >
              Mujer
            </button>
            <button
              onClick={() => handleGenderSelect('Hombre')}
              className="py-3 px-8 border border-white bg-black/20 text-white text-[11px] tracking-[0.15em] uppercase font-semibold hover:bg-white hover:text-alonzo-black transition-colors duration-300 backdrop-blur-sm"
            >
              Hombre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
