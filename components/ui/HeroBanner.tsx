'use client';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useUIStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';
import type { Gender } from '@/types';

export function HeroBanner() {
  const setGender = useUIStore((s) => s.setGender);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const { heroTitle, heroSubtitle, heroImage } = useWebSettings();
  
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleGenderSelect = useCallback((g: Gender) => {
    setGender(g);
    setHasBrowsed(true);
    setActiveCategory('');
    
    const productsEl = document.getElementById('products-section');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, [setGender, setHasBrowsed, setActiveCategory]);

  const isExternal = heroImage.startsWith('http');

  return (
    <div className="relative w-full h-screen bg-alonzo-gray-100 overflow-hidden">
      {isExternal ? (
        <img
          src={heroImage}
          alt="Hero Banner"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000 ease-out ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.02]'
          }`}
        />
      ) : (
        <Image
          src={heroImage}
          alt="Hero Banner"
          fill
          priority
          sizes="100vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover object-top transition-all duration-1000 ease-out ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.02]'
          }`}
        />
      )}
      
      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col items-center justify-end pb-16 md:pb-24 z-10 text-center">
        <div className="max-w-lg text-white flex flex-col items-center">
          <img 
            src="/images/logoAlonzo.png" 
            alt="ALONZO" 
            className="h-8 md:h-12 w-auto mb-4 object-contain brightness-0 invert stagger-up stagger-1"
          />
          <p className="text-sm md:text-base font-serif tracking-[0.15em] mb-8 font-light text-white/90 uppercase drop-shadow-md stagger-up stagger-2">
            {heroSubtitle}
          </p>

          <div className="flex items-center justify-center gap-3 md:gap-4 stagger-up stagger-3">
            <button
              onClick={() => handleGenderSelect('Mujer')}
              className="py-3 px-8 border border-white bg-black/20 text-white text-[11px] font-serif tracking-[0.15em] uppercase font-semibold hover:bg-white hover:text-alonzo-black transition-colors duration-300 backdrop-blur-sm"
            >
              Mujer
            </button>
            <button
              onClick={() => handleGenderSelect('Hombre')}
              className="py-3 px-8 border border-white bg-black/20 text-white text-[11px] font-serif tracking-[0.15em] uppercase font-semibold hover:bg-white hover:text-alonzo-black transition-colors duration-300 backdrop-blur-sm"
            >
              Hombre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
